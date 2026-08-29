import crypto from "node:crypto";
import { parseGenerationRequest, type GenerationRequest } from "@/lib/studio/generation/contracts";
import { isStudioApiError, StudioApiError } from "@/lib/studio/generation/errors";
import type { ShortsFactoryRequest } from "./contracts";
import type { FactoryRunSnapshot, ShortsFactoryRepository } from "./repository";

export type FactoryConceptExecutor = (input: {
  memberId: string;
  idempotencyKey: string;
  request: GenerationRequest;
  // 실행 소유권을 잃으면 곧바로 끊긴다. 비용이 드는 실행은 이 신호를 존중해야 한다.
  signal: AbortSignal;
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

const DEFAULT_STALE_AFTER_MS = 15 * 60 * 1000;

function staleAfterMs(): number {
  const raw = Number(process.env.SHORTS_FACTORY_STALE_AFTER_MS);
  return Number.isSafeInteger(raw) && raw >= 1000 ? raw : DEFAULT_STALE_AFTER_MS;
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
      staleAfterMs: staleAfterMs(),
      concepts: request.concepts,
    });
    if (!created.created) return { run: created.run, reused: true };

    // 울타리 표. 이 실행의 소유자임을 증명하는 값이고, 강제 종료나 회수는 이 표를 지운다.
    const leaseToken = crypto.randomUUID();
    const owned = await this.repository.markRunRunning(request.workspaceId, created.run.runId, leaseToken);
    if (!owned) {
      throw new StudioApiError({
        status: 409,
        code: "FACTORY_RUN_ALREADY_ACTIVE",
        message: "이 실행은 이미 다른 작업자가 맡았습니다",
        retryable: true,
      });
    }

    // 진행 신호가 거절되면(강제 종료, 회수, 실행이 이미 끝남) 즉시 취소로 전환한다.
    // 예전에는 이 실패를 삼켜서 무효가 된 worker 가 비용 작업을 계속 만들었다.
    const cancellation = new AbortController();
    const heartbeat = setInterval(() => {
      void this.repository.touchRun(request.workspaceId, created.run.runId, leaseToken)
        .then((alive) => { if (!alive) cancellation.abort(); })
        .catch(() => cancellation.abort());
    }, Math.min(30_000, Math.max(1000, Math.floor(staleAfterMs() / 3))));
    heartbeat.unref?.();

    let cursor = 0;
    const worker = async () => {
      while (cursor < request.concepts.length) {
        if (cancellation.signal.aborted) return;
        const index = cursor;
        cursor += 1;
        const concept = request.concepts[index];
        const claimed = await this.repository.markConceptRunning(
          request.workspaceId,
          created.run.runId,
          concept.conceptId,
          leaseToken,
        );
        // 표를 잃었으면 이 컨셉을 시작하지 않는다. 비용은 여기서 끊긴다.
        if (!claimed) {
          cancellation.abort();
          return;
        }
        try {
          const generation = parseGenerationRequest(concept.generationBody);
          const result = await this.executeConcept({
            memberId,
            idempotencyKey: `${created.run.runId}:${concept.conceptId}`,
            request: generation,
            signal: cancellation.signal,
          });
          await this.repository.markConceptSucceeded(
            request.workspaceId,
            created.run.runId,
            concept.conceptId,
            result.jobId,
            leaseToken,
          );
        } catch (error) {
          const normalized = conceptError(error);
          await this.repository.markConceptFailed(
            request.workspaceId,
            created.run.runId,
            concept.conceptId,
            normalized.code,
            normalized.message,
            leaseToken,
          );
        }
      }
    };

    try {
      await Promise.all(Array.from({ length: request.concurrencyLimit }, worker));
    } finally {
      clearInterval(heartbeat);
    }
    // 마감도 표가 있어야 쓴다. 표를 잃었으면 현재 상태를 그대로 읽어 돌려준다.
    return { run: await this.repository.finalizeRun(request.workspaceId, created.run.runId, leaseToken), reused: false };
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

  forceFail(workspaceId: string, runId: string): Promise<FactoryRunSnapshot> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(runId)) {
      throw new StudioApiError({ status: 422, code: "FACTORY_RUN_INVALID", message: "올바른 실행 번호가 필요합니다" });
    }
    return this.repository.forceFailRun(workspaceId, runId);
  }
}
