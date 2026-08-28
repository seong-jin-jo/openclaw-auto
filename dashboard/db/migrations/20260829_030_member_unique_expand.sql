-- E3: member-scoped UNIQUE를 concurrent index로 만든 뒤 constraint로 attach한다.
DO $audit$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.studio_generation_idempotency
    GROUP BY member_id, operation, idempotency_key HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'generation member-scope duplicates require manual recovery';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.studio_free_regeneration_uses
    GROUP BY member_id, local_date HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'quota member-date duplicates require manual recovery';
  END IF;
END
$audit$;

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_generation_idempotency_member_operation_key
  ON public.studio_generation_idempotency(member_id, operation, idempotency_key);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_studio_free_regeneration_member_date
  ON public.studio_free_regeneration_uses(member_id, local_date);

BEGIN;
SET LOCAL lock_timeout = '5000ms';
DO $attach$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_generation_idempotency'::regclass
      AND conname = 'uq_studio_generation_idempotency_member_operation_key'
  ) THEN
    ALTER TABLE public.studio_generation_idempotency
      ADD CONSTRAINT uq_studio_generation_idempotency_member_operation_key
      UNIQUE USING INDEX uq_studio_generation_idempotency_member_operation_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_free_regeneration_uses'::regclass
      AND conname = 'uq_studio_free_regeneration_member_date'
  ) THEN
    ALTER TABLE public.studio_free_regeneration_uses
      ADD CONSTRAINT uq_studio_free_regeneration_member_date
      UNIQUE USING INDEX uq_studio_free_regeneration_member_date;
  END IF;
END
$attach$;
COMMIT;
