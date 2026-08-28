-- C1 전 rollback manifest에 고정할 tenant-scoped rollback index를 먼저 준비한다.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_generation_tenant_rollback_idx
  ON public.studio_generation_idempotency(tenant_id, member_id, operation, idempotency_key);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_quota_tenant_rollback_idx
  ON public.studio_free_regeneration_uses(tenant_id, member_id, local_date);

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
    JOIN pg_catalog.pg_index AS i ON i.indexrelid=c.oid
    WHERE n.nspname='public'
      AND c.relname IN ('uq_studio_generation_tenant_rollback_idx','uq_studio_quota_tenant_rollback_idx')
      AND (NOT i.indisunique OR NOT i.indisvalid OR NOT i.indisready)
  ) THEN
    RAISE EXCEPTION 'rollback index is not valid and ready';
  END IF;
END
$verify$;
