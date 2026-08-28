-- Generation C1: compatibility app 확인 뒤 generation tenant-scoped UNIQUE만 제거한다.
-- Quota C1은 별도 승인 migration에서만 실행한다.
BEGIN;
SET LOCAL lock_timeout = '5000ms';
DO $contract$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_generation_idempotency'::regclass
      AND conname = 'uq_studio_generation_idempotency_member_operation_key'
  ) THEN
    RAISE EXCEPTION 'generation member-scoped constraint must be valid before contract';
  END IF;

  ALTER TABLE public.studio_generation_idempotency
    DROP CONSTRAINT IF EXISTS uq_studio_generation_idempotency_tenant_member_operation_key;
END
$contract$;
COMMIT;
