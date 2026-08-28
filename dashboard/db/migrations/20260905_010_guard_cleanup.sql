-- 관찰 기간 종료 뒤 임시 E1 guard와 rollback index를 제거한다.
DROP TRIGGER IF EXISTS trg_studio_generation_member_guard
  ON public.studio_generation_idempotency;
DROP TRIGGER IF EXISTS trg_studio_free_regeneration_member_guard
  ON public.studio_free_regeneration_uses;

DROP FUNCTION IF EXISTS public.guard_studio_generation_idempotency_member_scope();
DROP FUNCTION IF EXISTS public.guard_studio_free_regeneration_member_scope();

DROP INDEX CONCURRENTLY IF EXISTS public.uq_studio_generation_tenant_rollback_idx;
DROP INDEX CONCURRENTLY IF EXISTS public.uq_studio_quota_tenant_rollback_idx;

DO $role_cleanup$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='osmu_generation_guard_owner') THEN
    EXECUTE 'DROP OWNED BY osmu_generation_guard_owner';
    EXECUTE 'DROP ROLE osmu_generation_guard_owner';
  END IF;
END
$role_cleanup$;
