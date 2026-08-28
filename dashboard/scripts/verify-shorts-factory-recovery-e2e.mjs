#!/usr/bin/env node
// C1 회귀 검증. 죽은 공장 실행 회수와 운영자 강제 종료를 도는 앱과 실제 DB로 확인한다.
import crypto from "node:crypto";
import fs from "node:fs";
import postgres from "postgres";

const base = process.env.STUDIO_E2E_BASE_URL || "http://localhost:3456";
const studioToken = process.env.STUDIO_DEV_BEARER_TOKEN;
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN;
const memberId = process.env.STUDIO_DEV_MEMBER_ID;
const workspaceId = (process.env.STUDIO_DEV_WORKSPACE_IDS || "").split(",")[0].trim();
const databaseUrl = process.env.DATABASE_URL;
if (!studioToken || !operatorToken || !memberId || !workspaceId || !databaseUrl) {
  throw new Error("Studio 개발 인증, 운영자 인증, 데이터베이스 설정이 필요하다");
}

const sql = postgres(databaseUrl, { max: 1, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
const seededRunIds = [crypto.randomUUID(), crypto.randomUUID()];
let createdRunId = null;

async function seedRun(runId, updatedAt) {
  await sql`
    INSERT INTO shorts_factory_runs
      (id, tenant_id, member_id, status, concurrency_limit, total_concepts,
       idempotency_key, request_hash, created_at, updated_at, started_at)
    VALUES
      (${runId}, ${workspaceId}, ${memberId}, 'running', 1, 1,
       ${`c1-live-${runId}`}, ${"c".repeat(64)}, ${updatedAt}, ${updatedAt}, ${updatedAt})`;
}

try {
  const active = await sql`
    SELECT id FROM shorts_factory_runs
    WHERE tenant_id = ${workspaceId} AND status IN ('queued', 'running')`;
  if (active.length > 0) throw new Error("검증 전부터 활성 공장 실행이 있어 안전하게 중단한다");

  await seedRun(seededRunIds[0], new Date(Date.now() - 60 * 60 * 1000));

  const generation = JSON.parse(fs.readFileSync(new URL("../tests/studio/generation-request.json", import.meta.url), "utf8"));
  delete generation.workspace_id;
  generation.learning_context.u3.purpose = "";
  const concepts = Array.from({ length: 8 }, (_, index) => ({
    concept_id: `c1_recovery_${index + 1}`,
    name: `C1 회수 검증 ${index + 1}`,
    config: structuredClone(generation),
  }));
  const recoveryResponse = await fetch(`${base}/api/studio/v1/shorts-factory/runs`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${studioToken}`,
      "content-type": "application/json",
      "Idempotency-Key": `c1-recovery-${crypto.randomUUID()}`,
    },
    body: JSON.stringify({ workspace_id: workspaceId, concurrency_limit: 4, concepts }),
  });
  const recoveryPayload = await recoveryResponse.json();
  createdRunId = recoveryPayload.data?.run?.run_id ?? null;
  const [reclaimed] = await sql`
    SELECT status, finished_at IS NOT NULL AS finished
    FROM shorts_factory_runs WHERE tenant_id = ${workspaceId} AND id = ${seededRunIds[0]}`;
  const recovered = recoveryResponse.status === 201
    && Boolean(createdRunId)
    && reclaimed?.status === "failed"
    && reclaimed?.finished === true;
  console.log(`C1 죽은 실행 회수: HTTP ${recoveryResponse.status}, 이전 실행 ${reclaimed?.status}, ${recovered ? "통과" : "실패"}`);
  if (!recovered) {
    console.log(JSON.stringify({ code: recoveryPayload.error?.code, message: recoveryPayload.error?.message }));
    throw new Error("죽은 실행 회수 검증 실패");
  }

  await seedRun(seededRunIds[1], new Date());
  const forceResponse = await fetch(`${base}/api/operator/shorts-factory/runs/${seededRunIds[1]}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${operatorToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ action: "force_fail", workspace_id: workspaceId }),
  });
  const forcePayload = await forceResponse.json();
  const [forced] = await sql`
    SELECT status, finished_at IS NOT NULL AS finished
    FROM shorts_factory_runs WHERE tenant_id = ${workspaceId} AND id = ${seededRunIds[1]}`;
  const forceStopped = forceResponse.status === 200
    && forcePayload.data?.run?.status === "failed"
    && forced?.status === "failed"
    && forced?.finished === true;
  console.log(`C1 운영자 강제 종료: HTTP ${forceResponse.status}, 실행 ${forced?.status}, ${forceStopped ? "통과" : "실패"}`);
  if (!forceStopped) process.exitCode = 1;
} finally {
  const cleanupIds = [...seededRunIds, ...(createdRunId ? [createdRunId] : [])];
  await sql`DELETE FROM shorts_factory_runs WHERE tenant_id = ${workspaceId} AND id = ANY(${cleanupIds}::uuid[])`;
  await sql.end({ timeout: 5 });
}
