-- C1: compatibility app 확인 뒤 tenant-scoped UNIQUE를 제거한다.
-- rollback index는 7일 관찰이 끝날 때까지 보존한다.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_generation_tenant_rollback_idx
  ON public.studio_generation_idempotency(tenant_id, member_id, operation, idempotency_key);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_quota_tenant_rollback_idx
  ON public.studio_free_regeneration_uses(tenant_id, member_id, local_date);

BEGIN;
SET LOCAL lock_timeout = '5000ms';
DO $contract$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_generation_idempotency'::regclass
      AND conname = 'uq_studio_generation_idempotency_member_operation_key'
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_free_regeneration_uses'::regclass
      AND conname = 'uq_studio_free_regeneration_member_date'
  ) THEN
    RAISE EXCEPTION 'member-scoped constraints must be valid before contract';
  END IF;

  ALTER TABLE public.studio_generation_idempotency
    DROP CONSTRAINT IF EXISTS uq_studio_generation_idempotency_tenant_member_operation_key;
  ALTER TABLE public.studio_free_regeneration_uses
    DROP CONSTRAINT IF EXISTS uq_studio_free_regeneration_tenant_member_date;
END
$contract$;
COMMIT;
