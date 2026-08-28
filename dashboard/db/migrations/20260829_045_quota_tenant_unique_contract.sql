-- Quota C1: 회원 전역·UTC 계약의 별도 승인 뒤 quota tenant-scoped UNIQUE만 제거한다.
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_quota_tenant_rollback_idx
  ON public.studio_free_regeneration_uses(tenant_id, member_id, local_date);

BEGIN;
SET LOCAL lock_timeout = '5000ms';
DO $contract$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_free_regeneration_uses'::regclass
      AND conname = 'uq_studio_free_regeneration_member_date'
  ) THEN
    RAISE EXCEPTION 'quota member-scoped constraint must be valid before contract';
  END IF;

  ALTER TABLE public.studio_free_regeneration_uses
    DROP CONSTRAINT IF EXISTS uq_studio_free_regeneration_tenant_member_date;
END
$contract$;
COMMIT;
