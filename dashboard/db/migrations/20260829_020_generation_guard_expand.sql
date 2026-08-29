-- S1 전용 expand: 구 애플리케이션도 회원 전역 멱등성과 UTC 무료 몫을 지키게 한다.
-- S2/S3에서는 member UNIQUE가 이미 정본이므로 trigger를 설치하지 않는다.
BEGIN;

DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'osmu_generation_guard_owner_v2') THEN
    CREATE ROLE osmu_generation_guard_owner_v2
      NOLOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
  ALTER ROLE osmu_generation_guard_owner_v2
    NOLOGIN BYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
END
$role$;

CREATE OR REPLACE FUNCTION public.guard_studio_generation_idempotency_member_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, pg_temp
AS $function$
BEGIN
  PERFORM pg_catalog.set_config('lock_timeout', '1500ms', true);
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'osmu:generation-idempotency:v1|' || NEW.member_id || '|' || NEW.operation || '|' || NEW.idempotency_key,
      0
    )
  );
  IF EXISTS (
    SELECT 1
    FROM public.studio_generation_idempotency AS claim
    WHERE claim.member_id = NEW.member_id
      AND claim.operation = NEW.operation
      AND claim.idempotency_key = NEW.idempotency_key
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.guard_studio_free_regeneration_member_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, pg_temp
AS $function$
BEGIN
  PERFORM pg_catalog.set_config('lock_timeout', '1500ms', true);
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'osmu:free-regeneration:v1|' || NEW.member_id || '|' || NEW.local_date::text,
      0
    )
  );
  IF EXISTS (
    SELECT 1
    FROM public.studio_free_regeneration_uses AS quota
    WHERE quota.member_id = NEW.member_id
      AND quota.local_date = NEW.local_date
  ) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END
$function$;

ALTER FUNCTION public.guard_studio_generation_idempotency_member_scope()
  OWNER TO osmu_generation_guard_owner_v2;
ALTER FUNCTION public.guard_studio_free_regeneration_member_scope()
  OWNER TO osmu_generation_guard_owner_v2;
REVOKE ALL ON FUNCTION public.guard_studio_generation_idempotency_member_scope() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_studio_free_regeneration_member_scope() FROM PUBLIC;
DO $service_acl$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'osmu_service') THEN
    REVOKE ALL ON FUNCTION public.guard_studio_generation_idempotency_member_scope() FROM osmu_service;
    REVOKE ALL ON FUNCTION public.guard_studio_free_regeneration_member_scope() FROM osmu_service;
  END IF;
END
$service_acl$;
GRANT USAGE ON SCHEMA public TO osmu_generation_guard_owner_v2;
GRANT SELECT ON public.studio_generation_idempotency,
                public.studio_free_regeneration_uses
TO osmu_generation_guard_owner_v2;

DO $trigger$
DECLARE
  generation_member_unique BOOLEAN;
  quota_member_unique BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_generation_idempotency'::regclass
      AND conname = 'uq_studio_generation_idempotency_member_operation_key'
  ) INTO generation_member_unique;
  SELECT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid = 'public.studio_free_regeneration_uses'::regclass
      AND conname = 'uq_studio_free_regeneration_member_date'
  ) INTO quota_member_unique;

  IF NOT generation_member_unique THEN
    DROP TRIGGER IF EXISTS trg_studio_generation_member_guard ON public.studio_generation_idempotency;
    CREATE TRIGGER trg_studio_generation_member_guard
      BEFORE INSERT ON public.studio_generation_idempotency
      FOR EACH ROW EXECUTE FUNCTION public.guard_studio_generation_idempotency_member_scope();
  END IF;
  IF NOT quota_member_unique THEN
    DROP TRIGGER IF EXISTS trg_studio_free_regeneration_member_guard ON public.studio_free_regeneration_uses;
    CREATE TRIGGER trg_studio_free_regeneration_member_guard
      BEFORE INSERT ON public.studio_free_regeneration_uses
      FOR EACH ROW EXECUTE FUNCTION public.guard_studio_free_regeneration_member_scope();
  END IF;
END
$trigger$;

DO $preflight$
DECLARE
  safe_functions INTEGER;
  owner_flags_ok BOOLEAN;
  execute_leak BOOLEAN;
  unexpected_table_privilege BOOLEAN;
BEGIN
  SELECT count(*) INTO safe_functions
  FROM pg_catalog.pg_proc AS p
  WHERE p.oid IN (
    'public.guard_studio_generation_idempotency_member_scope()'::regprocedure,
    'public.guard_studio_free_regeneration_member_scope()'::regprocedure
  )
    AND pg_catalog.pg_get_userbyid(p.proowner) = 'osmu_generation_guard_owner_v2'
    AND p.proconfig @> ARRAY['search_path=pg_catalog, pg_temp'];
  SELECT NOT rolcanlogin AND rolbypassrls AND NOT rolsuper
         AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit
    INTO owner_flags_ok
  FROM pg_catalog.pg_roles
  WHERE rolname = 'osmu_generation_guard_owner_v2';
  SELECT EXISTS (
    SELECT 1
  FROM pg_catalog.pg_proc AS p
    WHERE p.oid IN (
      'public.guard_studio_generation_idempotency_member_scope()'::regprocedure,
      'public.guard_studio_free_regeneration_member_scope()'::regprocedure
    ) AND (
      pg_catalog.has_function_privilege('public', p.oid, 'EXECUTE')
      OR (EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='osmu_service')
          AND pg_catalog.has_function_privilege('osmu_service', p.oid, 'EXECUTE'))
    )
  ) INTO execute_leak;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
    WHERE grantee='osmu_generation_guard_owner_v2'
      AND NOT (
        table_schema='public'
        AND table_name IN ('studio_generation_idempotency','studio_free_regeneration_uses')
        AND privilege_type='SELECT'
      )
  ) INTO unexpected_table_privilege;
  IF safe_functions <> 2
     OR NOT owner_flags_ok
     OR execute_leak
     OR unexpected_table_privilege THEN
    RAISE EXCEPTION 'generation guard privilege preflight failed';
  END IF;
END
$preflight$;

COMMIT;
