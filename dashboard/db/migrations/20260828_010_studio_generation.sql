-- Studio v1 생성, 멱등 응답, 무료 재생성 장부를 기존 운영 스키마에 추가한다.
BEGIN;

CREATE TABLE IF NOT EXISTS studio_generation_jobs (
  id                    UUID PRIMARY KEY,
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id             TEXT NOT NULL,
  status                TEXT NOT NULL CHECK (status IN ('succeeded')),
  candidates            JSONB NOT NULL,
  layer_revisions       JSONB NOT NULL,
  platform_spec_receipt JSONB,
  time_zone             TEXT NOT NULL,
  request_payload       JSONB NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, id)
);
CREATE INDEX IF NOT EXISTS idx_studio_generation_jobs_member_time
  ON studio_generation_jobs(tenant_id, member_id, created_at DESC);

CREATE TABLE IF NOT EXISTS studio_generation_idempotency (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id         TEXT NOT NULL,
  operation         TEXT NOT NULL,
  idempotency_key   TEXT NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 255),
  request_hash      CHAR(64) NOT NULL,
  job_id            UUID NOT NULL,
  response_payload  JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_studio_generation_idempotency_member_operation_key
    UNIQUE (member_id, operation, idempotency_key),
  FOREIGN KEY (tenant_id, job_id)
    REFERENCES studio_generation_jobs(tenant_id, id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
DO $$
BEGIN
  ALTER TABLE studio_generation_idempotency
    DROP CONSTRAINT IF EXISTS studio_generation_idempotency_tenant_id_member_id_operation_key;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'studio_generation_idempotency'::regclass
      AND conname = 'uq_studio_generation_idempotency_member_operation_key'
  ) THEN
    ALTER TABLE studio_generation_idempotency
      ADD CONSTRAINT uq_studio_generation_idempotency_member_operation_key
      UNIQUE (member_id, operation, idempotency_key);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_studio_generation_idempotency_job
  ON studio_generation_idempotency(tenant_id, job_id);

CREATE TABLE IF NOT EXISTS studio_free_regeneration_uses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id           TEXT NOT NULL,
  local_date          DATE NOT NULL,
  original_job_id     UUID NOT NULL,
  replacement_job_id  UUID NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_studio_free_regeneration_member_date
    UNIQUE (member_id, local_date),
  FOREIGN KEY (tenant_id, original_job_id)
    REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, replacement_job_id)
    REFERENCES studio_generation_jobs(tenant_id, id)
    ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);
DO $$
BEGIN
  ALTER TABLE studio_free_regeneration_uses
    DROP CONSTRAINT IF EXISTS studio_free_regeneration_uses_tenant_id_member_id_local_dat_key;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'studio_free_regeneration_uses'::regclass
      AND conname = 'uq_studio_free_regeneration_member_date'
  ) THEN
    ALTER TABLE studio_free_regeneration_uses
      ADD CONSTRAINT uq_studio_free_regeneration_member_date
      UNIQUE (member_id, local_date);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_studio_free_regeneration_jobs
  ON studio_free_regeneration_uses(tenant_id, original_job_id, replacement_job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  studio_generation_jobs,
  studio_generation_idempotency,
  studio_free_regeneration_uses
TO osmu_service;

ALTER TABLE studio_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_generation_jobs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON studio_generation_jobs;
CREATE POLICY tenant_iso ON studio_generation_jobs
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE studio_generation_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_generation_idempotency FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON studio_generation_idempotency;
CREATE POLICY tenant_iso ON studio_generation_idempotency
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE studio_free_regeneration_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_free_regeneration_uses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON studio_free_regeneration_uses;
CREATE POLICY tenant_iso ON studio_free_regeneration_uses
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMIT;
