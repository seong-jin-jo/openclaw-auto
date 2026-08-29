-- 무료 재생성은 후보 셋을 모두 거절한 뒤에만 나간다(요구 대장 R27).
-- 거절은 클라이언트 상태가 아니라 서버 장부로만 인정한다.
BEGIN;

CREATE TABLE IF NOT EXISTS studio_generation_candidate_rejections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  member_id     TEXT NOT NULL,
  job_id        UUID NOT NULL,
  candidate_id  UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_studio_generation_candidate_rejection
    UNIQUE (tenant_id, job_id, candidate_id),
  FOREIGN KEY (tenant_id, job_id)
    REFERENCES studio_generation_jobs(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_studio_generation_candidate_rejections_job
  ON studio_generation_candidate_rejections(tenant_id, job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON
  studio_generation_candidate_rejections
TO osmu_service;

ALTER TABLE studio_generation_candidate_rejections ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_generation_candidate_rejections FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_iso ON studio_generation_candidate_rejections;
CREATE POLICY tenant_iso ON studio_generation_candidate_rejections
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMIT;
