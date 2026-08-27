-- 여덟 컨셉 숏폼 공장 실행과 컨셉별 진행 상태를 작업 공간 단위로 보관한다.
CREATE TABLE IF NOT EXISTS shorts_factory_runs (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id           TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued', 'running', 'succeeded', 'partial', 'failed')),
  concurrency_limit   SMALLINT NOT NULL CHECK (concurrency_limit BETWEEN 1 AND 8),
  total_concepts      SMALLINT NOT NULL CHECK (total_concepts BETWEEN 1 AND 8),
  succeeded_concepts  SMALLINT NOT NULL DEFAULT 0,
  failed_concepts     SMALLINT NOT NULL DEFAULT 0,
  idempotency_key     TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 255),
  request_hash        CHAR(64) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  UNIQUE (tenant_id, member_id, idempotency_key),
  UNIQUE (tenant_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_shorts_factory_active_workspace
  ON shorts_factory_runs(tenant_id)
  WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS idx_shorts_factory_runs_member_time
  ON shorts_factory_runs(tenant_id, member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shorts_factory_concept_runs (
  id                  UUID PRIMARY KEY,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  factory_run_id      UUID NOT NULL,
  concept_id          TEXT NOT NULL,
  name                TEXT NOT NULL,
  position            SMALLINT NOT NULL CHECK (position BETWEEN 1 AND 8),
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  stage               TEXT NOT NULL DEFAULT 'waiting'
                      CHECK (stage IN ('waiting', 'generating_candidates', 'completed', 'failed')),
  config_payload      JSONB NOT NULL,
  studio_job_id       UUID,
  error_code          TEXT,
  error_message       TEXT,
  started_at          TIMESTAMPTZ,
  finished_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, factory_run_id, concept_id),
  UNIQUE (tenant_id, factory_run_id, position),
  FOREIGN KEY (tenant_id, factory_run_id)
    REFERENCES shorts_factory_runs(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, studio_job_id)
    REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_shorts_factory_concepts_status
  ON shorts_factory_concept_runs(tenant_id, factory_run_id, status, position);

ALTER TABLE shorts_factory_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shorts_factory_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON shorts_factory_runs;
CREATE POLICY tenant_iso ON shorts_factory_runs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE shorts_factory_concept_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shorts_factory_concept_runs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON shorts_factory_concept_runs;
CREATE POLICY tenant_iso ON shorts_factory_concept_runs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON shorts_factory_runs TO osmu_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON shorts_factory_concept_runs TO osmu_service;
