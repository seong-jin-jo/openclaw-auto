import crypto from "node:crypto";
import { db, withTenant } from "@/lib/db";
import { StudioApiError } from "@/lib/studio/generation/errors";
import type { ShortsFactoryConceptInput } from "./contracts";

type Sql = ReturnType<typeof db>;

export type FactoryRunStatus = "queued" | "running" | "succeeded" | "partial" | "failed";
export type FactoryConceptStatus = "queued" | "running" | "succeeded" | "failed";
export type FactoryConceptStage = "waiting" | "generating_candidates" | "completed" | "failed";

export type FactoryConceptSnapshot = {
  conceptId: string;
  name: string;
  position: number;
  status: FactoryConceptStatus;
  stage: FactoryConceptStage;
  studioJobId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

export type FactoryRunSnapshot = {
  runId: string;
  workspaceId: string;
  status: FactoryRunStatus;
  concurrencyLimit: number;
  totalConcepts: number;
  succeededConcepts: number;
  failedConcepts: number;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  concepts: FactoryConceptSnapshot[];
};

type RunRow = {
  id: string;
  tenant_id: string;
  status: FactoryRunStatus;
  concurrency_limit: number;
  total_concepts: number;
  succeeded_concepts: number;
  failed_concepts: number;
  created_at: Date | string;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  request_hash?: string;
};

type ConceptRow = {
  factory_run_id: string;
  concept_id: string;
  name: string;
  position: number;
  status: FactoryConceptStatus;
  stage: FactoryConceptStage;
  studio_job_id: string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: Date | string | null;
  finished_at: Date | string | null;
};

export type CreateFactoryRunInput = {
  workspaceId: string;
  memberId: string;
  idempotencyKey: string;
  requestHash: string;
  concurrencyLimit: number;
  staleAfterMs: number;
  concepts: ShortsFactoryConceptInput[];
};

// 울타리 표. 실행을 시작한 worker 만 이 표를 가진다.
// 강제 종료나 회수는 표를 지워 옛 worker 의 진행 신호, 컨셉 기록, 마감을 모두 무효로 만든다.
// 표 없이 최종 상태를 쓰게 두면 강제 종료된 실행이 다시 succeeded 로 덮인다.
export type FactoryLeaseToken = string;

export interface ShortsFactoryRepository {
  createRun(input: CreateFactoryRunInput): Promise<{ run: FactoryRunSnapshot; created: boolean }>;
  markRunRunning(workspaceId: string, runId: string, leaseToken: FactoryLeaseToken): Promise<boolean>;
  touchRun(workspaceId: string, runId: string, leaseToken: FactoryLeaseToken): Promise<boolean>;
  markConceptRunning(workspaceId: string, runId: string, conceptId: string, leaseToken: FactoryLeaseToken): Promise<boolean>;
  markConceptSucceeded(workspaceId: string, runId: string, conceptId: string, studioJobId: string, leaseToken: FactoryLeaseToken): Promise<boolean>;
  markConceptFailed(workspaceId: string, runId: string, conceptId: string, errorCode: string, errorMessage: string, leaseToken: FactoryLeaseToken): Promise<boolean>;
  finalizeRun(workspaceId: string, runId: string, leaseToken: FactoryLeaseToken): Promise<FactoryRunSnapshot>;
  forceFailRun(workspaceId: string, runId: string): Promise<FactoryRunSnapshot>;
  findRun(memberId: string, runId: string, allowedWorkspaceIds: readonly string[]): Promise<FactoryRunSnapshot | null>;
  listRuns(memberId: string, workspaceId: string, limit?: number): Promise<FactoryRunSnapshot[]>;
}

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toConcept(row: ConceptRow): FactoryConceptSnapshot {
  return {
    conceptId: row.concept_id,
    name: row.name,
    position: row.position,
    status: row.status,
    stage: row.stage,
    studioJobId: row.studio_job_id,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    startedAt: iso(row.started_at),
    finishedAt: iso(row.finished_at),
  };
}

function toRun(row: RunRow, concepts: ConceptRow[]): FactoryRunSnapshot {
  return {
    runId: row.id,
    workspaceId: row.tenant_id,
    status: row.status,
    concurrencyLimit: row.concurrency_limit,
    totalConcepts: row.total_concepts,
    succeededConcepts: row.succeeded_concepts,
    failedConcepts: row.failed_concepts,
    createdAt: iso(row.created_at)!,
    startedAt: iso(row.started_at),
    finishedAt: iso(row.finished_at),
    concepts: concepts.sort((left, right) => left.position - right.position).map(toConcept),
  };
}

async function snapshot(sql: Sql, workspaceId: string, memberId: string, runId: string): Promise<FactoryRunSnapshot | null> {
  const [run] = await sql<RunRow[]>`
    SELECT id, tenant_id, status, concurrency_limit, total_concepts,
           succeeded_concepts, failed_concepts, created_at, started_at, finished_at
    FROM shorts_factory_runs
    WHERE tenant_id = ${workspaceId} AND id = ${runId} AND member_id = ${memberId}
    LIMIT 1`;
  if (!run) return null;
  const concepts = await sql<ConceptRow[]>`
    SELECT factory_run_id, concept_id, name, position, status, stage, studio_job_id,
           error_code, error_message, started_at, finished_at
    FROM shorts_factory_concept_runs
    WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}
    ORDER BY position`;
  return toRun(run, concepts);
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "23505";
}

export class PostgresShortsFactoryRepository implements ShortsFactoryRepository {
  async createRun(input: CreateFactoryRunInput): Promise<{ run: FactoryRunSnapshot; created: boolean }> {
    try {
      return await withTenant(input.workspaceId, async (sql) => {
        const staleRuns = await sql<{ id: string }[]>`
          SELECT id
          FROM shorts_factory_runs
          WHERE tenant_id = ${input.workspaceId}
            AND status IN ('queued', 'running')
            AND updated_at < now() - (${input.staleAfterMs} * interval '1 millisecond')
          FOR UPDATE`;
        if (staleRuns.length > 0) {
          const staleIds = staleRuns.map((run) => run.id);
          await sql`
            UPDATE shorts_factory_concept_runs
            SET status = 'failed', stage = 'failed', error_code = 'FACTORY_RUN_STALE',
                error_message = '마지막 진행 신호가 만료되어 실행을 회수했습니다', finished_at = now()
            WHERE tenant_id = ${input.workspaceId}
              AND factory_run_id = ANY(${staleIds}::uuid[])
              AND status IN ('queued', 'running')`;
          await sql`
            UPDATE shorts_factory_runs
            SET status = 'failed', failed_concepts = total_concepts - succeeded_concepts,
                finished_at = now(), updated_at = now(), lease_token = NULL
            WHERE tenant_id = ${input.workspaceId}
              AND id = ANY(${staleIds}::uuid[])
              AND status IN ('queued', 'running')`;
        }
        const runId = crypto.randomUUID();
        const [inserted] = await sql<{ id: string }[]>`
          INSERT INTO shorts_factory_runs
            (id, tenant_id, member_id, status, concurrency_limit, total_concepts,
             idempotency_key, request_hash)
          VALUES
            (${runId}, ${input.workspaceId}, ${input.memberId}, 'queued',
             ${input.concurrencyLimit}, ${input.concepts.length},
             ${input.idempotencyKey}, ${input.requestHash})
          ON CONFLICT (tenant_id, member_id, idempotency_key) DO NOTHING
          RETURNING id`;

        if (!inserted) {
          const [existing] = await sql<RunRow[]>`
            SELECT id, tenant_id, status, concurrency_limit, total_concepts,
                   succeeded_concepts, failed_concepts, created_at, started_at, finished_at,
                   request_hash
            FROM shorts_factory_runs
            WHERE tenant_id = ${input.workspaceId}
              AND member_id = ${input.memberId}
              AND idempotency_key = ${input.idempotencyKey}
            LIMIT 1`;
          if (!existing || existing.request_hash !== input.requestHash) {
            throw new StudioApiError({
              status: 409,
              code: "FACTORY_IDEMPOTENCY_CONFLICT",
              message: "같은 Idempotency-Key에 다른 공장 설정을 보낼 수 없습니다",
            });
          }
          const existingSnapshot = await snapshot(sql, input.workspaceId, input.memberId, existing.id);
          if (!existingSnapshot) throw new Error("factory run snapshot missing");
          return { run: existingSnapshot, created: false };
        }

        for (const [index, concept] of input.concepts.entries()) {
          await sql`
            INSERT INTO shorts_factory_concept_runs
              (id, tenant_id, factory_run_id, concept_id, name, position, status, stage, config_payload)
            VALUES
              (${crypto.randomUUID()}, ${input.workspaceId}, ${runId}, ${concept.conceptId},
               ${concept.name}, ${index + 1}, 'queued', 'waiting',
               ${sql.json(concept.generationBody as Parameters<typeof sql.json>[0])})`;
        }
        const createdSnapshot = await snapshot(sql, input.workspaceId, input.memberId, runId);
        if (!createdSnapshot) throw new Error("factory run snapshot missing");
        return { run: createdSnapshot, created: true };
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new StudioApiError({
          status: 409,
          code: "FACTORY_RUN_ALREADY_ACTIVE",
          message: "이 작업 공간에서 이미 숏폼 공장이 실행 중입니다",
          retryable: true,
        });
      }
      throw error;
    }
  }

  // 표를 발급하며 실행을 running 으로 올린다. 이미 다른 소유자가 있으면 false.
  async markRunRunning(workspaceId: string, runId: string, leaseToken: string): Promise<boolean> {
    return withTenant(workspaceId, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        UPDATE shorts_factory_runs
        SET status = 'running', lease_token = ${leaseToken},
            started_at = COALESCE(started_at, now()), updated_at = now()
        WHERE tenant_id = ${workspaceId} AND id = ${runId} AND status = 'queued'
          AND lease_token IS NULL
        RETURNING id`;
      return rows.length > 0;
    });
  }

  // 진행 신호. 표가 지워졌거나 남의 표면 false 를 돌려준다.
  // 호출부는 이 false 를 삼키지 말고 실행을 접어야 한다.
  async touchRun(workspaceId: string, runId: string, leaseToken: string): Promise<boolean> {
    return withTenant(workspaceId, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        UPDATE shorts_factory_runs
        SET updated_at = now()
        WHERE tenant_id = ${workspaceId} AND id = ${runId}
          AND status IN ('queued', 'running') AND lease_token = ${leaseToken}
        RETURNING id`;
      return rows.length > 0;
    });
  }

  async markConceptRunning(workspaceId: string, runId: string, conceptId: string, leaseToken: string): Promise<boolean> {
    return withTenant(workspaceId, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        UPDATE shorts_factory_concept_runs
        SET status = 'running', stage = 'generating_candidates', started_at = COALESCE(started_at, now())
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}
          AND concept_id = ${conceptId} AND status = 'queued'
          AND EXISTS (
            SELECT 1 FROM shorts_factory_runs
            WHERE tenant_id = ${workspaceId} AND id = ${runId}
              AND status = 'running' AND lease_token = ${leaseToken})
        RETURNING id`;
      if (rows.length === 0) return false;
      await sql`
        UPDATE shorts_factory_runs SET updated_at = now()
        WHERE tenant_id = ${workspaceId} AND id = ${runId} AND status = 'running'
          AND lease_token = ${leaseToken}`;
      return true;
    });
  }

  async markConceptSucceeded(workspaceId: string, runId: string, conceptId: string, studioJobId: string, leaseToken: string): Promise<boolean> {
    return withTenant(workspaceId, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        UPDATE shorts_factory_concept_runs
        SET status = 'succeeded', stage = 'completed', studio_job_id = ${studioJobId},
            error_code = NULL, error_message = NULL, finished_at = now()
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}
          AND concept_id = ${conceptId} AND status = 'running'
          AND EXISTS (
            SELECT 1 FROM shorts_factory_runs
            WHERE tenant_id = ${workspaceId} AND id = ${runId}
              AND status = 'running' AND lease_token = ${leaseToken})
        RETURNING id`;
      if (rows.length === 0) return false;
      await sql`
        UPDATE shorts_factory_runs SET updated_at = now()
        WHERE tenant_id = ${workspaceId} AND id = ${runId} AND status = 'running'
          AND lease_token = ${leaseToken}`;
      return true;
    });
  }

  async markConceptFailed(workspaceId: string, runId: string, conceptId: string, errorCode: string, errorMessage: string, leaseToken: string): Promise<boolean> {
    return withTenant(workspaceId, async (sql) => {
      const rows = await sql<{ id: string }[]>`
        UPDATE shorts_factory_concept_runs
        SET status = 'failed', stage = 'failed', error_code = ${errorCode},
            error_message = ${errorMessage.slice(0, 1000)}, finished_at = now()
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}
          AND concept_id = ${conceptId} AND status IN ('queued', 'running')
          AND EXISTS (
            SELECT 1 FROM shorts_factory_runs
            WHERE tenant_id = ${workspaceId} AND id = ${runId}
              AND status = 'running' AND lease_token = ${leaseToken})
        RETURNING id`;
      if (rows.length === 0) return false;
      await sql`
        UPDATE shorts_factory_runs SET updated_at = now()
        WHERE tenant_id = ${workspaceId} AND id = ${runId} AND status = 'running'
          AND lease_token = ${leaseToken}`;
      return true;
    });
  }

  // 마감은 최종 상태 CAS 다. 여전히 running 이고 내 표일 때만 쓴다.
  // 강제 종료나 회수로 이미 끝난 실행을 옛 worker 가 succeeded 로 되돌리지 못하게 한다.
  async finalizeRun(workspaceId: string, runId: string, leaseToken: string): Promise<FactoryRunSnapshot> {
    return withTenant(workspaceId, async (sql) => {
      const [counts] = await sql<{ succeeded: number; failed: number }[]>`
        SELECT
          count(*) FILTER (WHERE status = 'succeeded')::int AS succeeded,
          count(*) FILTER (WHERE status = 'failed')::int AS failed
        FROM shorts_factory_concept_runs
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}`;
      const status: FactoryRunStatus = counts.succeeded === 0
        ? "failed"
        : counts.failed === 0 ? "succeeded" : "partial";
      const [run] = await sql<{ member_id: string }[]>`
        UPDATE shorts_factory_runs
        SET status = ${status}, succeeded_concepts = ${counts.succeeded},
            failed_concepts = ${counts.failed}, finished_at = now(), updated_at = now(),
            lease_token = NULL
        WHERE tenant_id = ${workspaceId} AND id = ${runId}
          AND status = 'running' AND lease_token = ${leaseToken}
        RETURNING member_id`;
      const [owner] = run
        ? [run]
        : await sql<{ member_id: string }[]>`
            SELECT member_id FROM shorts_factory_runs
            WHERE tenant_id = ${workspaceId} AND id = ${runId} LIMIT 1`;
      if (!owner) throw new Error("factory run missing during finalize");
      const result = await snapshot(sql, workspaceId, owner.member_id, runId);
      if (!result) throw new Error("factory run snapshot missing after finalize");
      return result;
    });
  }

  async forceFailRun(workspaceId: string, runId: string): Promise<FactoryRunSnapshot> {
    return withTenant(workspaceId, async (sql) => {
      const [run] = await sql<{ member_id: string }[]>`
        SELECT member_id
        FROM shorts_factory_runs
        WHERE tenant_id = ${workspaceId} AND id = ${runId} AND status IN ('queued', 'running')
        FOR UPDATE`;
      if (!run) {
        throw new StudioApiError({
          status: 409,
          code: "FACTORY_RUN_NOT_ACTIVE",
          message: "종료할 수 있는 숏폼 공장 실행이 아닙니다",
        });
      }
      await sql`
        UPDATE shorts_factory_concept_runs
        SET status = 'failed', stage = 'failed', error_code = 'FACTORY_RUN_FORCE_STOPPED',
            error_message = '운영자가 실행을 강제로 종료했습니다', finished_at = now()
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ${runId}
          AND status IN ('queued', 'running')`;
      // 표를 지워야 아직 돌고 있는 옛 worker 가 다음 신호에서 자기가 무효임을 알고 멈춘다.
      await sql`
        UPDATE shorts_factory_runs
        SET status = 'failed', failed_concepts = total_concepts - succeeded_concepts,
            finished_at = now(), updated_at = now(), lease_token = NULL
        WHERE tenant_id = ${workspaceId} AND id = ${runId}`;
      const result = await snapshot(sql, workspaceId, run.member_id, runId);
      if (!result) throw new Error("factory run snapshot missing after force fail");
      return result;
    });
  }

  async findRun(memberId: string, runId: string, allowedWorkspaceIds: readonly string[]): Promise<FactoryRunSnapshot | null> {
    for (const workspaceId of allowedWorkspaceIds) {
      const found = await withTenant(workspaceId, (sql) => snapshot(sql, workspaceId, memberId, runId));
      if (found) return found;
    }
    return null;
  }

  async listRuns(memberId: string, workspaceId: string, limit = 20): Promise<FactoryRunSnapshot[]> {
    return withTenant(workspaceId, async (sql) => {
      const runs = await sql<RunRow[]>`
        SELECT id, tenant_id, status, concurrency_limit, total_concepts,
               succeeded_concepts, failed_concepts, created_at, started_at, finished_at
        FROM shorts_factory_runs
        WHERE tenant_id = ${workspaceId} AND member_id = ${memberId}
        ORDER BY created_at DESC
        LIMIT ${Math.min(Math.max(limit, 1), 50)}`;
      if (runs.length === 0) return [];
      const ids = runs.map((run) => run.id);
      const concepts = await sql<ConceptRow[]>`
        SELECT factory_run_id, concept_id, name, position, status, stage, studio_job_id,
               error_code, error_message, started_at, finished_at
        FROM shorts_factory_concept_runs
        WHERE tenant_id = ${workspaceId} AND factory_run_id = ANY(${ids}::uuid[])
        ORDER BY factory_run_id, position`;
      return runs.map((run) => toRun(run, concepts.filter((concept) => concept.factory_run_id === run.id)));
    });
  }
}
