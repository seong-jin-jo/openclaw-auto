-- L1: Row-Level Security (방어심층, 인증모델 a). 적용: psql -d <db> -f db/rls.sql
-- ⚠️ 적용 전 모든 테넌트-스코프 쿼리가 lib/db.ts withTenant() 경유여야 함(아니면 차단됨).
--    앱은 비-superuser osmu_service role로 접속해야 RLS가 강제됨(superuser는 RLS 우회).
-- 정책: tenant_id = current_setting('app.tenant_id') — withTenant가 트랜잭션마다 SET LOCAL.
-- 19금 격리는 별도(P4 tier: osmu-private 프로젝트). 이건 한 프로젝트 내 테넌트 간 격리.

-- 비-superuser 앱 role (RLS 우회 불가)
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'osmu_service') THEN
    CREATE ROLE osmu_service NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO osmu_service;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO osmu_service;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO osmu_service;

-- 앱 접속 role(Supabase=postgres, 로컬=현재 유저)이 SET LOCAL ROLE osmu_service 할 수 있게 멤버십 부여.
-- ⚠️ Supabase postgres는 rolbypassrls=true라 그냥 두면 RLS 우회 → withTenant가 osmu_service로 전환해야 강제됨.
DO $$ BEGIN
  EXECUTE format('GRANT osmu_service TO %I', current_user);
END $$;

-- 데이터 테이블 RLS FORCE + tenant_id 정책 (tenants는 운영자 목록조회라 제외 — P4서 매핑정교화)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['brand_guides','integrations','drafts','published_posts','schedules','growth_metrics','viral_signals'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS tenant_iso ON %I', t);
    EXECUTE format(
      'CREATE POLICY tenant_iso ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true)::uuid)',
      t);
  END LOOP;
END $$;
