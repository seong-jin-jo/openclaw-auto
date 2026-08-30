-- 주 갈래를 확정하면 같이 고른 갈래로 파생 생성한다(질문2 확정안 나3).
-- 파생 장부는 무료 재생성 장부(studio_free_regeneration_uses)와 물리적으로 분리한다.
-- 같은 표에 두면 파생 한 번이 그날의 무료 몫을 갉아먹는 사고가 언제든 다시 난다.
BEGIN;

CREATE TABLE IF NOT EXISTS studio_derivation_batches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id        TEXT NOT NULL,
  job_id           UUID NOT NULL,
  candidate_id     UUID NOT NULL,
  idempotency_key  TEXT NOT NULL,
  request_hash     TEXT NOT NULL,
  status           TEXT NOT NULL
    CHECK (status IN ('succeeded', 'partially_succeeded', 'failed')),
  currency         TEXT NOT NULL,
  -- quoted_minor 는 확정 전에 회원에게 보여 준 금액, charged_minor 는 실제로 나간 금액이다.
  -- 실패한 갈래는 charged_minor 에 들어가지 않는다. 둘을 한 칸으로 합치면
  -- 실패를 성공으로 집계하는 그 사고가 과금 쪽에서 되풀이된다.
  quoted_minor     INTEGER NOT NULL CHECK (quoted_minor >= 0),
  charged_minor    INTEGER NOT NULL CHECK (charged_minor >= 0),
  items            JSONB NOT NULL,
  response_payload JSONB NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  discarded_at     TIMESTAMPTZ,
  CONSTRAINT uq_studio_derivation_idempotency
    UNIQUE (tenant_id, member_id, idempotency_key),
  CONSTRAINT ck_studio_derivation_charge_within_quote
    CHECK (charged_minor <= quoted_minor),
  FOREIGN KEY (tenant_id, job_id)
    REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_studio_derivation_batches_job
  ON studio_derivation_batches(tenant_id, job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  studio_derivation_batches
TO osmu_service;

ALTER TABLE studio_derivation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_derivation_batches FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON studio_derivation_batches;
CREATE POLICY tenant_iso ON studio_derivation_batches
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMIT;
