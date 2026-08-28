import type {
  GenerationJob,
  GenerationRepository,
  IdempotencyRecord,
  PersistCreationInput,
  PersistFreeRegenerationInput,
  PersistedCreation,
  PersistedFreeRegeneration,
} from "@/lib/studio/generation/service";

export class MemoryGenerationRepository implements GenerationRepository {
  private readonly jobs = new Map<string, GenerationJob>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly freeRetryUses = new Set<string>();

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

  async persistFreeRegeneration(input: PersistFreeRegenerationInput): Promise<PersistedFreeRegeneration> {
    const useKey = `${input.replacement.memberId}:${input.localDate}`;
    if (this.freeRetryUses.has(useKey)) {
      const existing = this.idempotency.get(`${input.replacement.memberId}:${input.operation}:${input.idempotencyKey}`);
      return existing?.requestHash === input.requestHash
        ? { consumed: true, response: existing.response }
        : { consumed: false, response: null };
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
