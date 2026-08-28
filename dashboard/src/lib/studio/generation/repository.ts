import { db, withTenant } from "@/lib/db";
import type {
  GenerationJob,
  GenerationRepository,
  GenerationResponse,
  PersistCreationInput,
  PersistFreeRegenerationInput,
  PersistedCreation,
  PersistedFreeRegeneration,
} from "./service";

type Sql = ReturnType<typeof db>;

type GenerationJobRow = {
  id: string;
  tenant_id: string;
  member_id: string;
  status: "succeeded";
  candidates: GenerationJob["candidates"];
  layer_revisions: GenerationJob["layerRevisions"];
  platform_spec_receipt: GenerationJob["platformSpecReceipt"];
  time_zone: string;
  request_payload: GenerationJob["request"];
  created_at: Date | string;
};

type IdempotencyRow = {
  request_hash: string;
  response_payload: GenerationResponse;
};

function rowToJob(row: GenerationJobRow): GenerationJob {
  return {
    jobId: row.id,
    memberId: row.member_id,
    workspaceId: row.tenant_id,
    status: row.status,
    candidates: row.candidates,
    layerRevisions: row.layer_revisions,
    platformSpecReceipt: row.platform_spec_receipt,
    timeZone: row.time_zone,
    request: row.request_payload,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function insertJob(sql: Sql, job: GenerationJob): Promise<void> {
  const json = (value: unknown) => sql.json(value as Parameters<typeof sql.json>[0]);
  await sql`
    INSERT INTO studio_generation_jobs
      (id, tenant_id, member_id, status, candidates, layer_revisions,
       platform_spec_receipt, time_zone, request_payload, created_at)
    VALUES
      (${job.jobId}, ${job.workspaceId}, ${job.memberId}, ${job.status},
       ${json(job.candidates)}, ${json(job.layerRevisions)},
       ${job.platformSpecReceipt ? json(job.platformSpecReceipt) : null},
       ${job.timeZone}, ${json(job.request)}, ${job.createdAt})`;
}

export class PostgresGenerationRepository implements GenerationRepository {
  async persistCreation(input: PersistCreationInput): Promise<PersistedCreation> {
    return withTenant(input.job.workspaceId, async (sql) => {
      const [reserved] = await sql<IdempotencyRow[]>`
        INSERT INTO studio_generation_idempotency
          (tenant_id, member_id, operation, idempotency_key, request_hash, job_id, response_payload)
        VALUES
          (${input.job.workspaceId}, ${input.job.memberId}, ${input.operation},
           ${input.idempotencyKey}, ${input.requestHash}, ${input.job.jobId},
           ${sql.json(input.response as Parameters<typeof sql.json>[0])})
        ON CONFLICT (member_id, operation, idempotency_key) DO NOTHING
        RETURNING request_hash, response_payload`;

      if (!reserved) {
        const [existing] = await sql<IdempotencyRow[]>`
          SELECT request_hash, response_payload
          FROM studio_generation_idempotency
          WHERE tenant_id = ${input.job.workspaceId}
            AND member_id = ${input.job.memberId}
            AND operation = ${input.operation}
            AND idempotency_key = ${input.idempotencyKey}
          LIMIT 1`;
        if (!existing) {
          // 동일 회원의 키가 다른 워크스페이스에서 이미 쓰였다. RLS로 그 행은 읽지 않고
          // 해시 불일치만 반환해 service가 기존 계약대로 409를 내도록 한다.
          return { created: false, requestHash: "", response: input.response };
        }
        return { created: false, requestHash: existing.request_hash, response: existing.response_payload };
      }

      await insertJob(sql, input.job);
      return { created: true, requestHash: input.requestHash, response: input.response };
    });
  }

  async findJob(memberId: string, jobId: string, allowedWorkspaceIds: readonly string[]): Promise<GenerationJob | null> {
    for (const workspaceId of allowedWorkspaceIds) {
      const [row] = await withTenant(workspaceId, (sql) => sql<GenerationJobRow[]>`
        SELECT id, tenant_id, member_id, status, candidates, layer_revisions,
               platform_spec_receipt, time_zone, request_payload, created_at
        FROM studio_generation_jobs
        WHERE tenant_id = ${workspaceId} AND member_id = ${memberId} AND id = ${jobId}
        LIMIT 1`);
      if (row) return rowToJob(row);
    }
    return null;
  }

  async persistFreeRegeneration(input: PersistFreeRegenerationInput): Promise<PersistedFreeRegeneration> {
    return withTenant(input.replacement.workspaceId, async (sql) => {
      const [reserved] = await sql<{ id: string }[]>`
        INSERT INTO studio_free_regeneration_uses
          (tenant_id, member_id, local_date, original_job_id, replacement_job_id)
        VALUES
          (${input.replacement.workspaceId}, ${input.replacement.memberId}, ${input.localDate},
           ${input.originalJobId}, ${input.replacement.jobId})
        ON CONFLICT (member_id, local_date) DO NOTHING
        RETURNING id`;
      if (!reserved) {
        const [existing] = await sql<IdempotencyRow[]>`
          SELECT request_hash, response_payload
          FROM studio_generation_idempotency
          WHERE tenant_id = ${input.replacement.workspaceId}
            AND member_id = ${input.replacement.memberId}
            AND operation = ${input.operation}
            AND idempotency_key = ${input.idempotencyKey}
          LIMIT 1`;
        return existing?.request_hash === input.requestHash
          ? { consumed: true, response: existing.response_payload }
          : { consumed: false, response: null };
      }

      await sql`
        INSERT INTO studio_generation_idempotency
          (tenant_id, member_id, operation, idempotency_key, request_hash, job_id, response_payload)
        VALUES
          (${input.replacement.workspaceId}, ${input.replacement.memberId}, ${input.operation},
           ${input.idempotencyKey}, ${input.requestHash}, ${input.replacement.jobId},
           ${sql.json(input.response as Parameters<typeof sql.json>[0])})`;
      await insertJob(sql, input.replacement);
      return { consumed: true, response: input.response };
    });
  }
}
