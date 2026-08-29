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

-- CREATE INDEX CONCURRENTLY 실패 뒤 같은 이름의 invalid/not-ready index가 남을 수 있다.
-- IF NOT EXISTS는 이를 복구하지 않으므로 transaction 밖에서 먼저 제거한다.
SELECT pg_catalog.format('DROP INDEX CONCURRENTLY %I.%I', n.nspname, c.relname)
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_index AS i ON i.indexrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relname IN (
    'uq_studio_generation_idempotency_member_operation_key',
    'uq_studio_free_regeneration_member_date'
  )
  AND (NOT i.indisvalid OR NOT i.indisready)
\gexec

DO $definition$
DECLARE
  generation_ok BOOLEAN;
  quota_ok BOOLEAN;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_index AS i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'uq_studio_generation_idempotency_member_operation_key'
      AND (
        NOT i.indisunique OR i.indexprs IS NOT NULL OR i.indpred IS NOT NULL
        OR i.indnatts <> 3 OR i.indnkeyatts <> 3
        OR (
          SELECT pg_catalog.array_agg(a.attname ORDER BY keys.ordinality)
          FROM pg_catalog.unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
          JOIN pg_catalog.pg_attribute AS a
            ON a.attrelid=i.indrelid AND a.attnum=keys.attnum
        ) IS DISTINCT FROM ARRAY['member_id','operation','idempotency_key']::name[]
      )
  ) INTO generation_ok;
  SELECT NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    JOIN pg_catalog.pg_index AS i ON i.indexrelid = c.oid
    WHERE n.nspname = 'public'
      AND c.relname = 'uq_studio_free_regeneration_member_date'
      AND (
        NOT i.indisunique OR i.indexprs IS NOT NULL OR i.indpred IS NOT NULL
        OR i.indnatts <> 2 OR i.indnkeyatts <> 2
        OR (
          SELECT pg_catalog.array_agg(a.attname ORDER BY keys.ordinality)
          FROM pg_catalog.unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
          JOIN pg_catalog.pg_attribute AS a
            ON a.attrelid=i.indrelid AND a.attnum=keys.attnum
        ) IS DISTINCT FROM ARRAY['member_id','local_date']::name[]
      )
  ) INTO quota_ok;
  IF NOT generation_ok OR NOT quota_ok THEN
    RAISE EXCEPTION 'member unique index definition drift requires manual recovery';
  END IF;
END
$definition$;

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
