import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { setShortsFactoryRuntimeForTests } from "@/lib/studio/shorts-factory/runtime";
import { ShortsFactoryService } from "@/lib/studio/shorts-factory/service";
import type { ShortsFactoryRepository, FactoryRunSnapshot } from "@/lib/studio/shorts-factory/repository";
import { STUDIO_TEST_WORKSPACE_ID } from "./generation-fixture";

const OPERATOR_TOKEN = "operator-shorts-factory-token";
const RUN_ID = crypto.randomUUID();

class OperatorMemoryRepository implements ShortsFactoryRepository {
  run: FactoryRunSnapshot = {
    runId: RUN_ID,
    workspaceId: STUDIO_TEST_WORKSPACE_ID,
    status: "running",
    concurrencyLimit: 4,
    totalConcepts: 8,
    succeededConcepts: 0,
    failedConcepts: 0,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    finishedAt: null,
    concepts: Array.from({ length: 8 }, (_, index) => ({
      conceptId: `operator_${index + 1}`,
      name: `운영자 컨셉 ${index + 1}`,
      position: index + 1,
      status: "running" as const,
      stage: "generating_candidates" as const,
      studioJobId: null,
      errorCode: null,
      errorMessage: null,
      startedAt: new Date().toISOString(),
      finishedAt: null,
    })),
  };
  async createRun(): Promise<never> { throw new Error("unused"); }
  async markRunRunning() { return true; }
  async touchRun() { return true; }
  async markConceptRunning() { return true; }
  async markConceptSucceeded() { return true; }
  async markConceptFailed() { return true; }
  async finalizeRun() { return structuredClone(this.run); }
  async findRun() { return structuredClone(this.run); }
  async listRuns() { return [structuredClone(this.run)]; }
  async forceFailRun(workspaceId: string, runId: string) {
    if (workspaceId !== this.run.workspaceId || runId !== this.run.runId) throw new Error("not found");
    this.run.status = "failed";
    this.run.failedConcepts = 8;
    this.run.finishedAt = new Date().toISOString();
    for (const concept of this.run.concepts) {
      concept.status = "failed";
      concept.stage = "failed";
      concept.errorCode = "FACTORY_RUN_FORCE_STOPPED";
    }
    return structuredClone(this.run);
  }
}

beforeEach(() => {
  process.env.DASHBOARD_AUTH_TOKEN = OPERATOR_TOKEN;
  setShortsFactoryRuntimeForTests(new ShortsFactoryService(
    new OperatorMemoryRepository(),
    async () => ({ jobId: crypto.randomUUID() }),
  ));
});

describe("숏폼 공장 운영자 강제 종료 HTTP 계약", () => {
  it("C1-FACTORY-OPERATOR-01 한국어 설명: 운영자 토큰과 force_fail 요청은 활성 실행을 실패로 닫는다", async () => {
    const { POST } = await import("@/app/api/operator/shorts-factory/runs/[runId]/route");
    const response = await POST(new Request("http://localhost/api/operator/shorts-factory/runs/id", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPERATOR_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "force_fail", workspace_id: STUDIO_TEST_WORKSPACE_ID }),
    }), { params: Promise.resolve({ runId: RUN_ID }) });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.run.status).toBe("failed");
    expect(payload.data.run.failed_concepts).toBe(8);
  });

  it("C1-FACTORY-OPERATOR-02 한국어 설명: 운영자 토큰이 없으면 강제 종료를 401로 거절한다", async () => {
    const { POST } = await import("@/app/api/operator/shorts-factory/runs/[runId]/route");
    const response = await POST(new Request("http://localhost/api/operator/shorts-factory/runs/id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "force_fail", workspace_id: STUDIO_TEST_WORKSPACE_ID }),
    }), { params: Promise.resolve({ runId: RUN_ID }) });

    expect(response.status).toBe(401);
  });
});
