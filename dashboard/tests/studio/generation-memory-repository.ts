import crypto from "node:crypto";
import type { DerivationBatch } from "@/lib/studio/generation/derivation";
import type {
  DerivationDraftSink,
  PersistDerivationInput,
  PersistedDerivation,
} from "@/lib/studio/generation/service";
import type {
  GenerationJob,
  GenerationRepository,
  IdempotencyRecord,
  PersistCreationInput,
  PersistFreeRegenerationInput,
  PersistedCreation,
  PersistedFreeRegeneration,
  RecordRejectionInput,
} from "@/lib/studio/generation/service";

export class MemoryGenerationRepository implements GenerationRepository {
  private readonly jobs = new Map<string, GenerationJob>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly freeRetryUses = new Set<string>();
  private readonly rejections = new Map<string, Set<string>>();
  private readonly derivations = new Map<string, { batch: DerivationBatch; memberId: string; workspaceId: string; requestHash: string }>();
  private readonly derivationKeys = new Map<string, string>();

  /** 파생이 무료 재생성 몫을 갉아먹지 않는지 확인할 때 쓴다 */
  freeRetryUseCount(): number {
    return this.freeRetryUses.size;
  }

  async persistDerivation(input: PersistDerivationInput): Promise<PersistedDerivation> {
    const scope = `${input.workspaceId}:${input.memberId}:${input.idempotencyKey}`;
    const existingId = this.derivationKeys.get(scope);
    if (existingId) {
      const existing = this.derivations.get(existingId)!;
      return { created: false, requestHash: existing.requestHash, batch: existing.batch };
    }
    this.derivations.set(input.batch.batchId, {
      batch: input.batch,
      memberId: input.memberId,
      workspaceId: input.workspaceId,
      requestHash: input.requestHash,
    });
    this.derivationKeys.set(scope, input.batch.batchId);
    return { created: true, requestHash: input.requestHash, batch: input.batch };
  }

  async findDerivation(
    memberId: string,
    batchId: string,
    allowedWorkspaceIds: readonly string[],
  ): Promise<{ batch: DerivationBatch; workspaceId: string } | null> {
    const found = this.derivations.get(batchId);
    if (!found || found.memberId !== memberId || !allowedWorkspaceIds.includes(found.workspaceId)) return null;
    return { batch: found.batch, workspaceId: found.workspaceId };
  }

  async markDerivationDiscarded(workspaceId: string, batchId: string, at: string): Promise<DerivationBatch | null> {
    const found = this.derivations.get(batchId);
    if (!found || found.workspaceId !== workspaceId) return null;
    found.batch = { ...found.batch, discardedAt: found.batch.discardedAt ?? at };
    return found.batch;
  }

  async persistCreation(input: PersistCreationInput): Promise<PersistedCreation> {
    const scope = `${input.job.memberId}:${input.operation}:${input.idempotencyKey}`;
    const existing = this.idempotency.get(scope);
    if (existing) return { created: false, ...existing };
    this.jobs.set(input.job.jobId, input.job);
    this.idempotency.set(scope, { requestHash: input.requestHash, response: input.response });
    return { created: true, requestHash: input.requestHash, response: input.response };
  }

  async findJob(memberId: string, jobId: string, allowedWorkspaceIds: readonly string[]): Promise<GenerationJob | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.memberId !== memberId || !allowedWorkspaceIds.includes(job.workspaceId)) return null;
    return job;
  }

  async recordCandidateRejection(input: RecordRejectionInput): Promise<{ rejectedCandidateIds: string[] }> {
    const key = `${input.workspaceId}:${input.jobId}`;
    const set = this.rejections.get(key) ?? new Set<string>();
    set.add(input.candidateId);
    this.rejections.set(key, set);
    return { rejectedCandidateIds: [...set] };
  }

  async persistFreeRegeneration(input: PersistFreeRegenerationInput): Promise<PersistedFreeRegeneration> {
    const useKey = `${input.replacement.memberId}:${input.localDate}`;
    const existing = this.idempotency.get(`${input.replacement.memberId}:${input.operation}:${input.idempotencyKey}`);
    if (existing?.requestHash === input.requestHash) {
      return { consumed: true, response: existing.response };
    }
    const rejected = this.rejections.get(`${input.replacement.workspaceId}:${input.originalJobId}`) ?? new Set<string>();
    const pendingCandidateIds = input.requiredRejections.filter((id) => !rejected.has(id));
    if (pendingCandidateIds.length > 0) {
      return { consumed: false, response: null, refusal: "candidates_not_rejected", pendingCandidateIds };
    }
    if (this.freeRetryUses.has(useKey)) {
      return { consumed: false, response: null, refusal: "quota_exhausted" };
    }
    this.freeRetryUses.add(useKey);
    this.jobs.set(input.replacement.jobId, input.replacement);
    this.idempotency.set(
      `${input.replacement.memberId}:${input.operation}:${input.idempotencyKey}`,
      { requestHash: input.requestHash, response: input.response },
    );
    return { consumed: true, response: input.response };
  }
}

// 편집실 저장을 대신하는 시험용 통로. 갈래별로 따로 저장되는지, 버릴 때 그 갈래 것만
// 사라지는지 확인한다. failKinds 로 한 갈래만 실패시켜 부분 실패를 재현한다.
export class MemoryDerivationSink implements DerivationDraftSink {
  readonly drafts = new Map<string, { workspaceId: string; summary: string; kind: string }>();

  constructor(private readonly failKinds: readonly string[] = []) {}

  async createDraft(input: Parameters<DerivationDraftSink["createDraft"]>[0]): Promise<{ draftId: string; handoffId: string }> {
    if (this.failKinds.includes(input.payload.kind)) {
      throw new Error("저장 통로가 이 갈래를 받지 못했습니다");
    }
    const draftId = crypto.randomUUID();
    this.drafts.set(draftId, { workspaceId: input.workspaceId, summary: input.summary, kind: input.payload.kind });
    return { draftId, handoffId: crypto.randomUUID() };
  }

  async deleteDrafts(workspaceId: string, draftIds: readonly string[]): Promise<void> {
    for (const draftId of draftIds) {
      if (this.drafts.get(draftId)?.workspaceId === workspaceId) this.drafts.delete(draftId);
    }
  }
}
