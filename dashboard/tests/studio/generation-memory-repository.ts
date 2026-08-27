import type {
  GenerationJob,
  GenerationRepository,
  IdempotencyRecord,
  PersistCreationInput,
  PersistFreeRegenerationInput,
  PersistedCreation,
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

  async persistFreeRegeneration(input: PersistFreeRegenerationInput): Promise<boolean> {
    const useKey = `${input.replacement.memberId}:${input.localDate}`;
    if (this.freeRetryUses.has(useKey)) return false;
    this.freeRetryUses.add(useKey);
    this.jobs.set(input.replacement.jobId, input.replacement);
    this.idempotency.set(
      `${input.replacement.memberId}:${input.operation}:${input.idempotencyKey}`,
      { requestHash: input.requestHash, response: input.response },
    );
    return true;
  }
}
