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
let temporaryTenantId = "";
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
  await admin`DELETE FROM studio_free_regeneration_uses WHERE member_id = ${memberId}`;
  await admin`DELETE FROM studio_generation_idempotency WHERE member_id = ${memberId}`;
  await admin`DELETE FROM studio_generation_jobs WHERE member_id = ${memberId}`;
  if (temporaryTenantId) await admin`DELETE FROM tenants WHERE id = ${temporaryTenantId}`;
}

async function createTemporaryTenant(): Promise<string> {
  temporaryTenantId = crypto.randomUUID();
  await admin!`
    INSERT INTO tenants (id, slug, name, status)
    VALUES (${temporaryTenantId}, ${`studio-db-${temporaryTenantId}`}, 'Studio DB contract tenant', 'active')`;
  return temporaryTenantId;
}

beforeEach(() => {
  admin = null;
  tenantId = "";
  temporaryTenantId = "";
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

  it("M1-GEN-DB-01 경합: 구 앱과 신 앱의 멱등 충돌 대상이 배포 전환 중 함께 동작한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const service = new GenerationService(new PostgresGenerationRepository());
    const body = generationRequestFixture();
    body.workspace_id = tenantId;
    await service.create(memberId, "db-expand-contract", parseGenerationRequest(body));

    const duplicated = await admin!<{ id: string }[]>`
      INSERT INTO studio_generation_idempotency
        (tenant_id, member_id, operation, idempotency_key, request_hash, job_id, response_payload)
      SELECT tenant_id, member_id, operation, idempotency_key, request_hash, job_id, response_payload
      FROM studio_generation_idempotency
      WHERE tenant_id = ${tenantId} AND member_id = ${memberId}
        AND operation = 'generation.create' AND idempotency_key = 'db-expand-contract'
      ON CONFLICT (tenant_id, member_id, operation, idempotency_key) DO NOTHING
      RETURNING id`;

    expect(duplicated).toEqual([]);
    const [count] = await admin!<{ value: number }[]>`
      SELECT count(*)::int AS value FROM studio_generation_idempotency
      WHERE member_id = ${memberId} AND idempotency_key = 'db-expand-contract'`;
    expect(count.value).toBe(1);
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

  it("GEN-DB-03 한국어 설명: 동시에 두 번 재생성해도 회원 UTC 날짜 무료 몫은 한 건만 소비한다", async (ctx) => {
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

    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    const replacements = settled
      .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof service.regenerate>>> => result.status === "fulfilled")
      .map((result) => result.value.replacement.jobId);
    expect(new Set(replacements).size).toBe(1);
    const [counts] = await admin!<{ jobs: number; free_uses: number }[]>`
      SELECT
        (SELECT count(*)::int FROM studio_generation_jobs WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS jobs,
        (SELECT count(*)::int FROM studio_free_regeneration_uses WHERE tenant_id = ${tenantId} AND member_id = ${memberId}) AS free_uses`;
    expect(counts).toEqual({ jobs: 2, free_uses: 1 });
  });

  it("GEN-DB-04 한국어 설명: 같은 회원의 멱등 키는 워크스페이스가 달라도 두 번째 생성을 거절한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const otherTenantId = await createTemporaryTenant();
    const service = new GenerationService(new PostgresGenerationRepository());
    const first = generationRequestFixture();
    first.workspace_id = tenantId;
    await service.create(memberId, "db-member-global-key", parseGenerationRequest(first));
    const second = generationRequestFixture();
    second.workspace_id = otherTenantId;

    await expect(service.create(memberId, "db-member-global-key", parseGenerationRequest(second))).rejects.toEqual(
      expect.objectContaining({ code: "IDEMPOTENCY_CONFLICT", status: 409 }),
    );
    const [count] = await admin!<{ value: number }[]>`
      SELECT count(*)::int AS value FROM studio_generation_jobs WHERE member_id = ${memberId}`;
    expect(count.value).toBe(1);
  });

  it("GEN-DB-05 한국어 설명: 같은 회원의 UTC 날짜 무료 몫은 워크스페이스가 달라도 한 번뿐이다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const otherTenantId = await createTemporaryTenant();
    const service = new GenerationService(new PostgresGenerationRepository());
    const first = generationRequestFixture();
    first.workspace_id = tenantId;
    const firstJob = await service.create(memberId, "db-free-global-a", parseGenerationRequest(first));
    const second = generationRequestFixture();
    second.workspace_id = otherTenantId;
    const secondJob = await service.create(memberId, "db-free-global-b", parseGenerationRequest(second));
    const now = new Date("2026-08-27T01:00:00.000Z");

    await service.regenerate(memberId, firstJob.jobId, [tenantId], now);
    await expect(service.regenerate(memberId, secondJob.jobId, [otherTenantId], now)).rejects.toEqual(
      expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED", status: 409 }),
    );
    const [counts] = await admin!<{ jobs: number; free_uses: number }[]>`
      SELECT
        (SELECT count(*)::int FROM studio_generation_jobs WHERE member_id = ${memberId}) AS jobs,
        (SELECT count(*)::int FROM studio_free_regeneration_uses WHERE member_id = ${memberId}) AS free_uses`;
    expect(counts).toEqual({ jobs: 3, free_uses: 1 });
  });

  it("M1-GEN-DB-06 한국어 설명: 동서 끝 시간대의 서로 다른 작업도 실제 DB에서 UTC 하루 몫을 공유한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const service = new GenerationService(new PostgresGenerationRepository());
    const eastBody = generationRequestFixture();
    eastBody.workspace_id = tenantId;
    eastBody.learning_context.u2.time_zone = "Pacific/Kiritimati";
    const westBody = generationRequestFixture();
    westBody.workspace_id = tenantId;
    westBody.learning_context.u2.time_zone = "Etc/GMT+12";
    westBody.learning_context.r6.topic = "DB 서쪽 시간대 작업";
    const east = await service.create(memberId, "db-time-zone-east", parseGenerationRequest(eastBody));
    const west = await service.create(memberId, "db-time-zone-west", parseGenerationRequest(westBody));
    const now = new Date("2026-08-27T12:30:00.000Z");

    await service.regenerate(memberId, east.jobId, [tenantId], now);
    await expect(service.regenerate(memberId, west.jobId, [tenantId], now)).rejects.toEqual(
      expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED", status: 409 }),
    );
    const [count] = await admin!<{ value: number }[]>`
      SELECT count(*)::int AS value
      FROM studio_free_regeneration_uses
      WHERE tenant_id = ${tenantId} AND member_id = ${memberId}`;
    expect(count.value).toBe(1);
  });

  it("M2-GEN-DB-07 거절: 무료 몫을 쓴 작업 공간을 삭제해도 같은 회원의 당일 둘째 무료 재생성을 막는다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const deletedTenantId = await createTemporaryTenant();
    const service = new GenerationService(new PostgresGenerationRepository());
    const first = generationRequestFixture();
    first.workspace_id = deletedTenantId;
    const firstJob = await service.create(memberId, "db-delete-free-a", parseGenerationRequest(first));
    const now = new Date("2026-08-29T04:00:00.000Z");
    await service.regenerate(memberId, firstJob.jobId, [deletedTenantId], now);

    await admin!`DELETE FROM tenants WHERE id = ${deletedTenantId}`;
    temporaryTenantId = "";
    const replacementTenantId = await createTemporaryTenant();
    const second = generationRequestFixture();
    second.workspace_id = replacementTenantId;
    second.learning_context.r6.topic = "작업 공간 삭제 뒤 둘째 무료 재생성";
    const secondJob = await service.create(memberId, "db-delete-free-b", parseGenerationRequest(second));

    await expect(service.regenerate(memberId, secondJob.jobId, [replacementTenantId], now)).rejects.toEqual(
      expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED", status: 409 }),
    );
    const rows = await admin!<{ tenant_id: string | null; uses: number }[]>`
      SELECT min(tenant_id::text) AS tenant_id, count(*)::int AS uses
      FROM studio_free_regeneration_uses
      WHERE member_id = ${memberId}`;
    expect(rows[0]).toEqual({ tenant_id: null, uses: 1 });
  });
});
