DO $verify_rollback_indexes$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
    JOIN pg_catalog.pg_index AS i ON i.indexrelid=c.oid
    WHERE n.nspname='public'
      AND c.relname='uq_studio_generation_tenant_rollback_idx'
      AND i.indrelid='public.studio_generation_idempotency'::regclass
      AND i.indisunique AND i.indisvalid AND i.indisready
      AND i.indexprs IS NULL AND i.indpred IS NULL
      AND i.indnatts=4 AND i.indnkeyatts=4
      AND (
        SELECT pg_catalog.array_agg(a.attname ORDER BY keys.ordinality)
        FROM pg_catalog.unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS a
          ON a.attrelid=i.indrelid AND a.attnum=keys.attnum
      ) = ARRAY['tenant_id','member_id','operation','idempotency_key']::name[]
  ) THEN
    RAISE EXCEPTION 'generation rollback index definition drifted or is not valid and ready';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_class AS c
    JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
    JOIN pg_catalog.pg_index AS i ON i.indexrelid=c.oid
    WHERE n.nspname='public'
      AND c.relname='uq_studio_quota_tenant_rollback_idx'
      AND i.indrelid='public.studio_free_regeneration_uses'::regclass
      AND i.indisunique AND i.indisvalid AND i.indisready
      AND i.indexprs IS NULL AND i.indpred IS NULL
      AND i.indnatts=3 AND i.indnkeyatts=3
      AND (
        SELECT pg_catalog.array_agg(a.attname ORDER BY keys.ordinality)
        FROM pg_catalog.unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS a
          ON a.attrelid=i.indrelid AND a.attnum=keys.attnum
      ) = ARRAY['tenant_id','member_id','local_date']::name[]
  ) THEN
    RAISE EXCEPTION 'quota rollback index definition drifted or is not valid and ready';
  END IF;
END
$verify_rollback_indexes$;
