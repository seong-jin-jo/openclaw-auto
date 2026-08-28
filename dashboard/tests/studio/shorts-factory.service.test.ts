import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { parseShortsFactoryRequest, type ShortsFactoryRequest } from "@/lib/studio/shorts-factory/contracts";
import { ShortsFactoryService } from "@/lib/studio/shorts-factory/service";
import type {
  CreateFactoryRunInput,
  FactoryConceptSnapshot,
  FactoryRunSnapshot,
  ShortsFactoryRepository,
} from "@/lib/studio/shorts-factory/repository";
import { generationRequestFixture, STUDIO_TEST_WORKSPACE_ID } from "./generation-fixture";

function factoryFixture(options?: { invalidIndex?: number; concurrencyLimit?: number }): ShortsFactoryRequest {
  const generation = generationRequestFixture();
  return parseShortsFactoryRequest({
    workspace_id: STUDIO_TEST_WORKSPACE_ID,
    concurrency_limit: options?.concurrencyLimit ?? 3,
    concepts: Array.from({ length: 8 }, (_, index) => {
      const config = structuredClone(generation) as unknown as Record<string, unknown>;
      delete config.workspace_id;
      const layers = config.learning_context as Record<string, Record<string, unknown>>;
      layers.r6.topic = `컨셉 ${index + 1}`;
      if (options?.invalidIndex === index) layers.u3.purpose = "";
      return { concept_id: `concept_${index + 1}`, name: `컨셉 ${index + 1}`, config };
    }),
  });
}

class MemoryFactoryRepository implements ShortsFactoryRepository {
  run: FactoryRunSnapshot | null = null;
  memberId = "";
  requestHash = "";
  idempotencyKey = "";

  async createRun(input: CreateFactoryRunInput) {
    if (this.run && this.memberId === input.memberId && this.idempotencyKey === input.idempotencyKey) {
      if (this.requestHash !== input.requestHash) throw new Error("test idempotency conflict");
      return { run: structuredClone(this.run), created: false };
    }
    this.memberId = input.memberId;
    this.requestHash = input.requestHash;
    this.idempotencyKey = input.idempotencyKey;
    const now = new Date().toISOString();
    this.run = {
      runId: crypto.randomUUID(),
      workspaceId: input.workspaceId,
      status: "queued",
      concurrencyLimit: input.concurrencyLimit,
      totalConcepts: input.concepts.length,
      succeededConcepts: 0,
      failedConcepts: 0,
      createdAt: now,
      startedAt: null,
      finishedAt: null,
      concepts: input.concepts.map((concept, index): FactoryConceptSnapshot => ({
        conceptId: concept.conceptId,
        name: concept.name,
        position: index + 1,
        status: "queued",
        stage: "waiting",
        studioJobId: null,
        errorCode: null,
        errorMessage: null,
        startedAt: null,
        finishedAt: null,
      })),
    };
    return { run: structuredClone(this.run), created: true };
  }

  async markRunRunning(_workspaceId: string, _runId: string) {
    this.run!.status = "running";
    this.run!.startedAt = new Date().toISOString();
  }

  async touchRun() {}

  async markConceptRunning(_workspaceId: string, _runId: string, conceptId: string) {
    const concept = this.run!.concepts.find((item) => item.conceptId === conceptId)!;
    concept.status = "running";
    concept.stage = "generating_candidates";
    concept.startedAt = new Date().toISOString();
  }

  async markConceptSucceeded(_workspaceId: string, _runId: string, conceptId: string, studioJobId: string) {
    const concept = this.run!.concepts.find((item) => item.conceptId === conceptId)!;
    concept.status = "succeeded";
    concept.stage = "completed";
    concept.studioJobId = studioJobId;
    concept.finishedAt = new Date().toISOString();
  }

  async markConceptFailed(_workspaceId: string, _runId: string, conceptId: string, errorCode: string, errorMessage: string) {
    const concept = this.run!.concepts.find((item) => item.conceptId === conceptId)!;
    concept.status = "failed";
    concept.stage = "failed";
    concept.errorCode = errorCode;
    concept.errorMessage = errorMessage;
    concept.finishedAt = new Date().toISOString();
  }

  async finalizeRun() {
    const succeeded = this.run!.concepts.filter((concept) => concept.status === "succeeded").length;
    const failed = this.run!.concepts.filter((concept) => concept.status === "failed").length;
    this.run!.succeededConcepts = succeeded;
    this.run!.failedConcepts = failed;
    this.run!.status = succeeded === 0 ? "failed" : failed === 0 ? "succeeded" : "partial";
    this.run!.finishedAt = new Date().toISOString();
    return structuredClone(this.run!);
  }

  async forceFailRun() {
    this.run!.status = "failed";
    this.run!.failedConcepts = this.run!.concepts.filter((concept) => concept.status !== "succeeded").length;
    for (const concept of this.run!.concepts) {
      if (concept.status === "succeeded") continue;
      concept.status = "failed";
      concept.stage = "failed";
      concept.errorCode = "FACTORY_RUN_FORCE_STOPPED";
    }
    return structuredClone(this.run!);
  }

  async findRun(memberId: string, runId: string, allowedWorkspaceIds: readonly string[]) {
    return this.run && memberId === this.memberId && runId === this.run.runId && allowedWorkspaceIds.includes(this.run.workspaceId)
      ? structuredClone(this.run)
      : null;
  }

  async listRuns(memberId: string, workspaceId: string) {
    return this.run && memberId === this.memberId && workspaceId === this.run.workspaceId ? [structuredClone(this.run)] : [];
  }
}

describe("숏폼 공장 실행 계약", () => {
  it("FACTORY-UNIT-01 한국어 설명: 여덟 컨셉은 설정한 동시 실행 한도를 넘지 않고 모두 끝난다", async () => {
    const repository = new MemoryFactoryRepository();
    let active = 0;
    let maxActive = 0;
    const service = new ShortsFactoryService(repository, async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { jobId: crypto.randomUUID() };
    });

    const result = await service.start("member-1", "factory-unit-limit", factoryFixture({ concurrencyLimit: 3 }));

    expect(result.run.status).toBe("succeeded");
    expect(result.run.succeededConcepts).toBe(8);
    expect(result.run.concepts.every((concept) => concept.stage === "completed" && concept.studioJobId)).toBe(true);
    expect(maxActive).toBe(3);
  });

  it("FACTORY-UNIT-02 한국어 설명: 한 컨셉 입력이 거절돼도 나머지 일곱 컨셉은 계속 성공한다", async () => {
    const repository = new MemoryFactoryRepository();
    const service = new ShortsFactoryService(repository, async () => ({ jobId: crypto.randomUUID() }));

    const result = await service.start("member-2", "factory-unit-isolation", factoryFixture({ invalidIndex: 3 }));

    expect(result.run.status).toBe("partial");
    expect(result.run.succeededConcepts).toBe(7);
    expect(result.run.failedConcepts).toBe(1);
    expect(result.run.concepts[3]).toEqual(expect.objectContaining({
      status: "failed",
      stage: "failed",
      errorCode: "LEARNING_CONTEXT_INCOMPLETE",
      studioJobId: null,
    }));
  });

  it("FACTORY-UNIT-03 한국어 설명: 컨셉이 일곱 개면 공장 실행 전에 거절한다", () => {
    const generation = generationRequestFixture();
    expect(() => parseShortsFactoryRequest({
      workspace_id: STUDIO_TEST_WORKSPACE_ID,
      concepts: Array.from({ length: 7 }, (_, index) => ({
        concept_id: `concept_${index}`,
        name: `컨셉 ${index}`,
        config: generation,
      })),
    })).toThrow(expect.objectContaining({ code: "FACTORY_CONCEPT_COUNT_INVALID", status: 422 }));
  });
});
