import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { parseShortsFactoryRequest } from "@/lib/studio/shorts-factory/contracts";
import { PostgresShortsFactoryRepository } from "@/lib/studio/shorts-factory/repository";
import { ShortsFactoryService } from "@/lib/studio/shorts-factory/service";
import { GenerationService } from "@/lib/studio/generation/service";
import { PostgresGenerationRepository } from "@/lib/studio/generation/repository";
import { getDatabaseUrl } from "../isolation/_env";
import { generationRequestFixture } from "./generation-fixture";

type Sql = ReturnType<typeof postgres>;

let admin: Sql | null = null;
let firstTenantId = "";
let secondTenantId = "";
const members: string[] = [];

function factoryBody(workspaceId: string, invalidIndex?: number) {
  const source = generationRequestFixture();
  return {
    workspace_id: workspaceId,
    concurrency_limit: 4,
    concepts: Array.from({ length: 8 }, (_, index) => {
      const config = structuredClone(source) as unknown as Record<string, unknown>;
      delete config.workspace_id;
      const layers = config.learning_context as Record<string, Record<string, unknown>>;
      layers.r6.topic = `DB 컨셉 ${index + 1}`;
      if (invalidIndex === index) layers.u3.purpose = "";
      return { concept_id: `db_concept_${index + 1}`, name: `DB 컨셉 ${index + 1}`, config };
    }),
  };
}

async function liveDatabase(ctx: { skip: () => void }): Promise<boolean> {
  if (admin) return true;
  const url = getDatabaseUrl();
  if (!url) {
    if (process.env.CI) throw new Error("CI requires DATABASE_URL for shorts factory DB integration");
    ctx.skip();
    return false;
  }
  process.env.DATABASE_URL = url;
  admin = postgres(url, { max: 5, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
  firstTenantId = crypto.randomUUID();
  secondTenantId = crypto.randomUUID();
  await admin`
    INSERT INTO tenants (id, slug, name, status)
    VALUES
      (${firstTenantId}, ${`factory-db-${firstTenantId}`}, 'Factory DB tenant A', 'active'),
      (${secondTenantId}, ${`factory-db-${secondTenantId}`}, 'Factory DB tenant B', 'active')`;
  return true;
}

beforeAll(() => {
  admin = null;
  firstTenantId = "";
  secondTenantId = "";
});

afterAll(async () => {
  if (!admin) return;
  if (members.length > 0) {
    await admin`DELETE FROM shorts_factory_runs WHERE member_id = ANY(${members}::text[])`;
    await admin`DELETE FROM studio_generation_jobs WHERE member_id = ANY(${members}::text[])`;
  }
  if (firstTenantId && secondTenantId) {
    await admin`DELETE FROM tenants WHERE id IN (${firstTenantId}, ${secondTenantId})`;
  }
  await admin.end({ timeout: 5 });
});

describe("숏폼 공장 Postgres 격리와 경합 계약", () => {
  it("FACTORY-DB-01 한국어 설명: 한 컨셉 실패는 실제 DB에서 일곱 성공과 분리되고 다른 작업 공간에는 보이지 않는다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const memberId = `factory-db-${crypto.randomUUID()}`;
    members.push(memberId);
    const factoryRepository = new PostgresShortsFactoryRepository();
    const generation = new GenerationService(new PostgresGenerationRepository());
    const service = new ShortsFactoryService(
      factoryRepository,
      async ({ memberId: owner, idempotencyKey, request }) => generation.create(owner, idempotencyKey, request),
    );

    const result = await service.start(
      memberId,
      "factory-db-failure-isolation",
      parseShortsFactoryRequest(factoryBody(firstTenantId, 2)),
    );

    expect(result.run.status).toBe("partial");
    expect(result.run.succeededConcepts).toBe(7);
    expect(result.run.failedConcepts).toBe(1);
    expect(result.run.concepts[2]).toEqual(expect.objectContaining({
      status: "failed",
      errorCode: "LEARNING_CONTEXT_INCOMPLETE",
      studioJobId: null,
    }));
    expect(await factoryRepository.findRun(memberId, result.run.runId, [secondTenantId])).toBeNull();

    const [counts] = await admin!<{ concepts: number; jobs: number }[]>`
      SELECT
        (SELECT count(*)::int FROM shorts_factory_concept_runs WHERE tenant_id = ${firstTenantId}) AS concepts,
        (SELECT count(*)::int FROM studio_generation_jobs WHERE tenant_id = ${firstTenantId} AND member_id = ${memberId}) AS jobs`;
    expect(counts).toEqual({ concepts: 8, jobs: 7 });
  });

  it("FACTORY-DB-02 한국어 설명: 같은 작업 공간의 실행 중 공장 둘째는 거절하고 다른 작업 공간은 독립 실행한다", async (ctx) => {
    if (!await liveDatabase(ctx)) return;
    const memberId = `factory-active-${crypto.randomUUID()}`;
    members.push(memberId);
    const repository = new PostgresShortsFactoryRepository();
    const first = parseShortsFactoryRequest(factoryBody(firstTenantId));
    const second = parseShortsFactoryRequest(factoryBody(secondTenantId));

    await repository.createRun({
      workspaceId: first.workspaceId, memberId, idempotencyKey: "active-a", requestHash: "a".repeat(64),
      concurrencyLimit: first.concurrencyLimit, concepts: first.concepts,
    });
    await expect(repository.createRun({
      workspaceId: first.workspaceId, memberId, idempotencyKey: "active-b", requestHash: "b".repeat(64),
      concurrencyLimit: first.concurrencyLimit, concepts: first.concepts,
    })).rejects.toEqual(expect.objectContaining({ code: "FACTORY_RUN_ALREADY_ACTIVE", status: 409 }));

    const other = await repository.createRun({
      workspaceId: second.workspaceId, memberId, idempotencyKey: "active-other-workspace", requestHash: "c".repeat(64),
      concurrencyLimit: second.concurrencyLimit, concepts: second.concepts,
    });
    expect(other.run.workspaceId).toBe(secondTenantId);
  });
});
