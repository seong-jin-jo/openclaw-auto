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
