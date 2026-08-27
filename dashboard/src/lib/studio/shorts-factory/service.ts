import crypto from "node:crypto";
import { parseGenerationRequest, type GenerationRequest } from "@/lib/studio/generation/contracts";
import { isStudioApiError, StudioApiError } from "@/lib/studio/generation/errors";
import type { ShortsFactoryRequest } from "./contracts";
import type { FactoryRunSnapshot, ShortsFactoryRepository } from "./repository";

export type FactoryConceptExecutor = (input: {
  memberId: string;
  idempotencyKey: string;
  request: GenerationRequest;
}) => Promise<{ jobId: string }>;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function requestHash(value: unknown): string {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function conceptError(error: unknown): { code: string; message: string } {
  if (isStudioApiError(error)) return { code: error.code, message: error.message };
  return { code: "CONCEPT_EXECUTION_FAILED", message: "컨셉 생성 중 오류가 발생했습니다" };
}

export class ShortsFactoryService {
  constructor(
    private readonly repository: ShortsFactoryRepository,
    private readonly executeConcept: FactoryConceptExecutor,
  ) {}

  async start(memberId: string, idempotencyKey: string, request: ShortsFactoryRequest): Promise<{
    run: FactoryRunSnapshot;
    reused: boolean;
  }> {
    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new StudioApiError({
        status: 400,
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key 머리말이 필요합니다",
      });
    }
    const created = await this.repository.createRun({
      workspaceId: request.workspaceId,
      memberId,
      idempotencyKey,
      requestHash: requestHash(request),
      concurrencyLimit: request.concurrencyLimit,
      concepts: request.concepts,
    });
    if (!created.created) return { run: created.run, reused: true };

    await this.repository.markRunRunning(request.workspaceId, created.run.runId);
    let cursor = 0;
    const worker = async () => {
      while (cursor < request.concepts.length) {
        const index = cursor;
        cursor += 1;
        const concept = request.concepts[index];
        await this.repository.markConceptRunning(request.workspaceId, created.run.runId, concept.conceptId);
        try {
          const generation = parseGenerationRequest(concept.generationBody);
          const result = await this.executeConcept({
            memberId,
            idempotencyKey: `${created.run.runId}:${concept.conceptId}`,
            request: generation,
          });
          await this.repository.markConceptSucceeded(
            request.workspaceId,
            created.run.runId,
            concept.conceptId,
            result.jobId,
          );
        } catch (error) {
          const normalized = conceptError(error);
          await this.repository.markConceptFailed(
            request.workspaceId,
            created.run.runId,
            concept.conceptId,
            normalized.code,
            normalized.message,
          );
        }
      }
    };
    await Promise.all(Array.from({ length: request.concurrencyLimit }, worker));
    return { run: await this.repository.finalizeRun(request.workspaceId, created.run.runId), reused: false };
  }

  async get(memberId: string, runId: string, allowedWorkspaceIds: readonly string[]): Promise<FactoryRunSnapshot> {
    const run = await this.repository.findRun(memberId, runId, allowedWorkspaceIds);
    if (!run) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "숏폼 공장 실행을 찾을 수 없습니다" });
    }
    return run;
  }

  list(memberId: string, workspaceId: string): Promise<FactoryRunSnapshot[]> {
    return this.repository.listRuns(memberId, workspaceId);
  }
}
