#!/usr/bin/env node
// verify-shorts-factory-fencing.mjs
//
// 무엇을 막는가: 강제 종료된 숏폼 공장 실행의 옛 worker 가 계속 살아 비용 작업을 만들고,
// 끝날 때 failed 로 닫힌 실행을 succeeded 로 되돌리던 결함.
//
// 실 DB 에 대고 울타리 표 세 가지를 본다.
//   진행 신호는 표가 지워지면 거절된다.
//   컨셉 성공 기록도 표가 없으면 통하지 않는다.
//   마감은 최종 상태를 덮지 않는다.
//
// 사용: cd dashboard && set -a && . ./.env.local && set +a &&
//       node scripts/verify-shorts-factory-fencing.mjs
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL 이 필요합니다");
  process.exit(2);
}

const failures = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "통과" : "실패"} ${label}: 관찰 ${JSON.stringify(actual)} 기대 ${JSON.stringify(expected)}`);
  if (!ok) failures.push(label);
}

const sql = postgres(DATABASE_URL, { max: 2, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
const runId = crypto.randomUUID();
const memberId = `verify-fencing-${crypto.randomUUID()}`;
const staleToken = crypto.randomUUID();
let tenantId = null;

try {
  const [tenant] = await sql`SELECT id FROM tenants ORDER BY created_at LIMIT 1`;
  if (!tenant) throw new Error("검증에 테넌트가 하나 필요합니다");
  tenantId = tenant.id;

  await sql`
    INSERT INTO shorts_factory_runs
      (id, tenant_id, member_id, status, concurrency_limit, total_concepts, idempotency_key, request_hash)
    VALUES (${runId}, ${tenantId}, ${memberId}, 'queued', 1, 1, ${`fence-${runId}`}, ${"a".repeat(64)})`;
  await sql`
    INSERT INTO shorts_factory_concept_runs
      (id, tenant_id, factory_run_id, concept_id, name, position, status, stage, config_payload)
    VALUES (${crypto.randomUUID()}, ${tenantId}, ${runId}, 'concept_1', '컨셉 1', 1, 'queued', 'waiting', '{}'::jsonb)`;

  const claimed = await sql`
    UPDATE shorts_factory_runs SET status = 'running', lease_token = ${staleToken}, started_at = now(), updated_at = now()
    WHERE tenant_id = ${tenantId} AND id = ${runId} AND status = 'queued' AND lease_token IS NULL
    RETURNING id`;
  check("표 발급 성사", claimed.length, 1);

  // 운영자 강제 종료. 표를 지우고 최종 상태로 닫는다.
  await sql`
    UPDATE shorts_factory_runs
    SET status = 'failed', finished_at = now(), updated_at = now(), lease_token = NULL
    WHERE tenant_id = ${tenantId} AND id = ${runId}`;

  const heartbeat = await sql`
    UPDATE shorts_factory_runs SET updated_at = now()
    WHERE tenant_id = ${tenantId} AND id = ${runId}
      AND status IN ('queued', 'running') AND lease_token = ${staleToken}
    RETURNING id`;
  check("강제 종료 뒤 옛 표의 진행 신호", heartbeat.length, 0);

  const conceptWrite = await sql`
    UPDATE shorts_factory_concept_runs
    SET status = 'succeeded', stage = 'completed', finished_at = now()
    WHERE tenant_id = ${tenantId} AND factory_run_id = ${runId} AND concept_id = 'concept_1'
      AND EXISTS (
        SELECT 1 FROM shorts_factory_runs
        WHERE tenant_id = ${tenantId} AND id = ${runId} AND status = 'running' AND lease_token = ${staleToken})
    RETURNING id`;
  check("강제 종료 뒤 옛 표의 컨셉 성공 기록", conceptWrite.length, 0);

  const finalize = await sql`
    UPDATE shorts_factory_runs
    SET status = 'succeeded', finished_at = now(), updated_at = now(), lease_token = NULL
    WHERE tenant_id = ${tenantId} AND id = ${runId} AND status = 'running' AND lease_token = ${staleToken}
    RETURNING id`;
  check("강제 종료 뒤 옛 표의 마감", finalize.length, 0);

  const [final] = await sql`SELECT status FROM shorts_factory_runs WHERE tenant_id = ${tenantId} AND id = ${runId}`;
  check("최종 실행 상태", final.status, "failed");
} finally {
  try {
    if (tenantId) {
      await sql`DELETE FROM shorts_factory_concept_runs WHERE tenant_id = ${tenantId} AND factory_run_id = ${runId}`;
      await sql`DELETE FROM shorts_factory_runs WHERE tenant_id = ${tenantId} AND id = ${runId}`;
    }
  } catch (error) {
    console.error("정리 실패:", error instanceof Error ? error.message : String(error));
    failures.push("정리");
  }
  await sql.end({ timeout: 5 });
}

console.log(failures.length === 0 ? "\n판정: 표를 잃은 worker 는 진행도 기록도 마감도 하지 못한다." : `\n판정: 실패 ${failures.length}건 (${failures.join(", ")})`);
process.exit(failures.length === 0 ? 0 : 1);
