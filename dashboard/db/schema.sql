-- OSMU 멀티테넌트 스키마 (단계0 — 내부 팀용 경량)
-- 제공자(우리) 중앙 호스팅 Postgres. 공유DB + tenant_id. RLS는 SaaS화 시 활성.
-- 적용: psql -d openclaw_osmu -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid

-- 테넌트(워크스페이스). 내부 단계는 하드인증 없음 — 등록=워크스페이스 생성.
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,            -- URL/식별용 (예: tenant1)
  name        TEXT NOT NULL,                   -- 표시명 (예: Tenant)
  status      TEXT NOT NULL DEFAULT 'active',  -- active | paused
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 브랜드 컨텍스트(위저드/레포연동 산출, 표준 스키마). 생성이 이걸 읽어 톤 주입.
CREATE TABLE IF NOT EXISTS brand_guides (
  tenant_id     UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  prompt_guide  TEXT,                          -- 톤·금지어·hook·페르소나 (claude -p 증류 산출)
  visual_rules  JSONB,                         -- { colors[], typography, forbidden[] }
  source        TEXT,                          -- wizard | repo | paste
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 통합(고객 BYO 키): Anthropic/Higgsfield/MCP/채널. 단계0=공유키라 선택. 값은 암호화 저장(SaaS화 시).
CREATE TABLE IF NOT EXISTS integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,                 -- anthropic | higgsfield | mcp | channel
  label         TEXT,
  secret_enc    TEXT,                          -- 단계0 평문 가능, SaaS화 시 암호화 필수
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, kind, label)
);

-- 초안(생성물). 현 data/studio/drafts.json → 이주. tenant_id 처음부터.
CREATE TABLE IF NOT EXISTS drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  idea        TEXT,
  payload     JSONB,                           -- 플랫폼별 텍스트/이미지/영상 산출
  status      TEXT NOT NULL DEFAULT 'draft',   -- draft | published
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drafts_tenant ON drafts(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integrations_tenant ON integrations(tenant_id);
