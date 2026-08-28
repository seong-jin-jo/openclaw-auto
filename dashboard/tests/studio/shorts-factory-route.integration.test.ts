import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { setShortsFactoryRuntimeForTests } from "@/lib/studio/shorts-factory/runtime";
import { ShortsFactoryService } from "@/lib/studio/shorts-factory/service";
import { generationRequestFixture, STUDIO_TEST_WORKSPACE_ID } from "./generation-fixture";
import type { ShortsFactoryRepository } from "@/lib/studio/shorts-factory/repository";
import { GenerationService } from "@/lib/studio/generation/service";
import { MemoryGenerationRepository } from "./generation-memory-repository";

const TOKEN = "shorts-factory-route-token";

function body() {
  const generation = generationRequestFixture();
  return {
    workspace_id: STUDIO_TEST_WORKSPACE_ID,
    concurrency_limit: 4,
    concepts: Array.from({ length: 8 }, (_, index) => {
      const config = structuredClone(generation) as unknown as Record<string, unknown>;
      delete config.workspace_id;
      (config.learning_context as Record<string, Record<string, unknown>>).r6.topic = `라우트 컨셉 ${index + 1}`;
      return { concept_id: `route_${index + 1}`, name: `라우트 컨셉 ${index + 1}`, config };
    }),
  };
}

class RouteMemoryRepository implements ShortsFactoryRepository {
  private run: import("@/lib/studio/shorts-factory/repository").FactoryRunSnapshot | null = null;

  async createRun(input: import("@/lib/studio/shorts-factory/repository").CreateFactoryRunInput) {
    if (this.run) return { run: structuredClone(this.run), created: false };
    this.run = {
      runId: crypto.randomUUID(), workspaceId: input.workspaceId, status: "queued",
      concurrencyLimit: input.concurrencyLimit, totalConcepts: 8, succeededConcepts: 0, failedConcepts: 0,
      createdAt: new Date().toISOString(), startedAt: null, finishedAt: null,
      concepts: input.concepts.map((concept, index) => ({
        conceptId: concept.conceptId, name: concept.name, position: index + 1, status: "queued", stage: "waiting",
        studioJobId: null, errorCode: null, errorMessage: null, startedAt: null, finishedAt: null,
      })),
    };
    return { run: structuredClone(this.run), created: true };
  }
  async markRunRunning() { this.run!.status = "running"; }
  async touchRun() {}
  async markConceptRunning(_w: string, _r: string, id: string) {
    Object.assign(this.run!.concepts.find((concept) => concept.conceptId === id)!, { status: "running", stage: "generating_candidates" });
  }
  async markConceptSucceeded(_w: string, _r: string, id: string, jobId: string) {
    Object.assign(this.run!.concepts.find((concept) => concept.conceptId === id)!, { status: "succeeded", stage: "completed", studioJobId: jobId });
  }
  async markConceptFailed(_w: string, _r: string, id: string, code: string, message: string) {
    Object.assign(this.run!.concepts.find((concept) => concept.conceptId === id)!, { status: "failed", stage: "failed", errorCode: code, errorMessage: message });
  }
  async finalizeRun() {
    this.run!.succeededConcepts = this.run!.concepts.filter((concept) => concept.status === "succeeded").length;
    this.run!.failedConcepts = this.run!.concepts.filter((concept) => concept.status === "failed").length;
    this.run!.status = this.run!.failedConcepts ? "partial" : "succeeded";
    return structuredClone(this.run!);
  }
  async forceFailRun() {
    this.run!.status = "failed";
    this.run!.failedConcepts = this.run!.concepts.filter((concept) => concept.status !== "succeeded").length;
    for (const concept of this.run!.concepts) {
      if (concept.status === "succeeded") continue;
      Object.assign(concept, { status: "failed", stage: "failed", errorCode: "FACTORY_RUN_FORCE_STOPPED" });
    }
    return structuredClone(this.run!);
  }
  async findRun(_member: string, runId: string, workspaces: readonly string[]) {
    return this.run?.runId === runId && workspaces.includes(this.run.workspaceId) ? structuredClone(this.run) : null;
  }
  async listRuns(_member: string, workspaceId: string) {
    return this.run?.workspaceId === workspaceId ? [structuredClone(this.run)] : [];
  }
}

beforeEach(() => {
  const generation = new GenerationService(new MemoryGenerationRepository());
  setShortsFactoryRuntimeForTests(new ShortsFactoryService(
    new RouteMemoryRepository(),
    async ({ memberId, idempotencyKey, request }) => generation.create(memberId, idempotencyKey, request),
  ));
  process.env.STUDIO_IDENTITY_MODE = "development";
  process.env.STUDIO_DEV_BEARER_TOKEN = TOKEN;
  process.env.STUDIO_DEV_MEMBER_ID = "shorts-factory-route-member";
  process.env.STUDIO_DEV_WORKSPACE_IDS = STUDIO_TEST_WORKSPACE_ID;
});

describe("숏폼 공장 HTTP 통합 계약", () => {
  it("FACTORY-HTTP-01 한국어 설명: Route Handler가 여덟 컨셉 실행과 상태판을 201로 반환한다", async () => {
    const { POST, GET: list } = await import("@/app/api/studio/v1/shorts-factory/runs/route");
    const request = new Request("http://localhost/api/studio/v1/shorts-factory/runs", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "Idempotency-Key": "factory-http-1" },
      body: JSON.stringify(body()),
    });
    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.data.run.status).toBe("succeeded");
    expect(payload.data.run.concepts).toHaveLength(8);
    expect(payload.data.run.concepts.every((concept: { studio_job_id: string | null }) => concept.studio_job_id)).toBe(true);

    const listed = await list(new Request(`http://localhost/api/studio/v1/shorts-factory/runs?workspace_id=${STUDIO_TEST_WORKSPACE_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    }));
    expect((await listed.json()).data.runs[0].run_id).toBe(payload.data.run.run_id);
  });

  it("FACTORY-HTTP-02 한국어 설명: 다른 작업 공간은 시작 전에 404로 거절한다", async () => {
    const { POST } = await import("@/app/api/studio/v1/shorts-factory/runs/route");
    const denied = body();
    denied.workspace_id = "33333333-3333-4333-8333-333333333333";
    const response = await POST(new Request("http://localhost/api/studio/v1/shorts-factory/runs", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "Idempotency-Key": "factory-http-denied" },
      body: JSON.stringify(denied),
    }));

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("RESOURCE_NOT_FOUND");
  });
});
