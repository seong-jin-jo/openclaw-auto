import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import postgres from "postgres";
import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import { PostgresGenerationRepository } from "@/lib/studio/generation/repository";
import { GenerationService } from "@/lib/studio/generation/service";
import { getDatabaseUrl } from "../isolation/_env";
import { generationRequestFixture } from "./generation-fixture";

type Sql = ReturnType<typeof postgres>;

let admin: Sql | null = null;
let tenantId = "";
let memberId = "";

async function liveDatabase(ctx: { skip: () => void }): Promise<boolean> {
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for Studio generation DB integration");
    ctx.skip();
    return false;
  }
  process.env.DATABASE_URL = url;
  admin = postgres(url, { max: 3, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
  try {
    const [tenant] = await admin<{ id: string }[]>`SELECT id FROM tenants ORDER BY created_at LIMIT 1`;
    if (!tenant) throw new Error("Studio generation DB integration requires one tenant");
    tenantId = tenant.id;
    memberId = `studio-db-${crypto.randomUUID()}`;
    return true;
  } catch (error) {
    await admin.end({ timeout: 5 });
    admin = null;
    if (process.env.CI) throw error;
    ctx.skip();
    return false;
  }
}

async function cleanup(): Promise<void> {
  if (!admin || !memberId) return;
  await admin`DELETE FROM studio_generation_jobs WHERE tenant_id = ${tenantId} AND member_id = ${memberId}`;
}

beforeEach(() => {
  admin = null;
  tenantId = "";
  memberId = "";
});

afterEach(async () => {
  await cleanup();
  if (admin) await admin.end({ timeout: 5 });
});

describe("Studio 생성 Postgres 장부 계약", () => {
  it("GEN-DB-01 한국어 설명: 같은 멱등 키는 실제 DB에서 작업 한 건과 같은 응답으로 수렴한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const service = new GenerationService(new PostgresGenerationRepository());
    const body = generationRequestFixture();
    body.workspace_id = tenantId;
    const request = parseGenerationRequest(body);

    const [first, second] = await Promise.all([
      service.create(memberId, "db-same-key", request),
      service.create(memberId, "db-same-key", request),
    ]);

    expect(second).toEqual(first);
    const [counts] = await admin!<{ jobs: number; idempotency: number }[]>`
      SELECT
        (SELECT count(*)::int FROM studio_generation_jobs WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS jobs,
        (SELECT count(*)::int FROM studio_generation_idempotency WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS idempotency`;
    expect(counts).toEqual({ jobs: 1, idempotency: 1 });
  });

  it("GEN-DB-02 한국어 설명: 같은 멱등 키에 다른 본문은 실제 DB 기록을 바꾸지 않고 거절한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const service = new GenerationService(new PostgresGenerationRepository());
    const original = generationRequestFixture();
    original.workspace_id = tenantId;
    await service.create(memberId, "db-conflict-key", parseGenerationRequest(original));
    const changed = generationRequestFixture();
    changed.workspace_id = tenantId;
    changed.learning_context.r6.topic = "DB 충돌 본문";

    await expect(service.create(memberId, "db-conflict-key", parseGenerationRequest(changed))).rejects.toEqual(
      expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT", status: 409 }),
    );
    const [count] = await admin!<{ value: number }[]>`
      SELECT count(*)::int AS value FROM studio_generation_jobs
      WHERE tenant_id = ${tenantId} AND member_id = ${memberId}`;
    expect(count.value).toBe(1);
  });

  it("GEN-DB-03 한국어 설명: 동시에 두 번 재생성해도 회원 현지 날짜 무료 몫은 한 건만 소비한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const service = new GenerationService(new PostgresGenerationRepository());
    const body = generationRequestFixture();
    body.workspace_id = tenantId;
    const original = await service.create(memberId, "db-retry-origin", parseGenerationRequest(body));
    const now = new Date("2026-08-27T01:00:00.000Z");

    const settled = await Promise.allSettled([
      service.regenerate(memberId, original.jobId, [tenantId], now),
      service.regenerate(memberId, original.jobId, [tenantId], now),
    ]);

    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(settled.find((result) => result.status === "rejected")).toEqual(expect.objectContaining({
      reason: expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED", status: 409 }),
    }));
    const [counts] = await admin!<{ jobs: number; free_uses: number }[]>`
      SELECT
        (SELECT count(*)::int FROM studio_generation_jobs WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS jobs,
        (SELECT count(*)::int FROM studio_free_regeneration_uses WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS free_uses`;
    expect(counts).toEqual({ jobs: 2, free_uses: 1 });
  });
});
