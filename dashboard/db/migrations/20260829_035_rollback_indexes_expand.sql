-- C1 전 rollback manifest에 고정할 tenant-scoped rollback index를 먼저 준비한다.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_generation_tenant_rollback_idx
  ON public.studio_generation_idempotency(tenant_id, member_id, operation, idempotency_key);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_quota_tenant_rollback_idx
  ON public.studio_free_regeneration_uses(tenant_id, member_id, local_date);

\ir ../verify-rollback-indexes.sql
