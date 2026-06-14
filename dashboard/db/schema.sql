-- OSMU 멀티테넌트 스키마 (단계0 — 내부 팀용 경량)
-- 제공자(우리) 중앙 호스팅 Postgres. 공유DB + tenant_id. RLS는 SaaS화 시 활성.
-- 적용: psql -d openclaw_osmu -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- 위키 문서 trigram 검색(한글 부분매칭)

-- 테넌트(워크스페이스). 내부 단계는 하드인증 없음 — 등록=워크스페이스 생성.
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,            -- URL/식별용 (예: tenant1)
  name        TEXT NOT NULL,                   -- 표시명 (예: Tenant)
  status      TEXT NOT NULL DEFAULT 'active',  -- active | paused
  tier        TEXT NOT NULL DEFAULT 'team',    -- team | private — tier별 Supabase 프로젝트 라우팅(team=공유, private=19금 물리분리)
  domain      TEXT UNIQUE,                     -- 커스텀 도메인(CNAME). Host 헤더 → 이 테넌트로 매핑(호스팅 멀티테넌트)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 브랜드 컨텍스트(위저드/레포연동 산출, 표준 스키마). 생성이 이걸 읽어 톤 주입.
CREATE TABLE IF NOT EXISTS brand_guides (
  tenant_id     UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  prompt_guide  TEXT,                          -- 톤·금지어·hook·페르소나 (claude -p 증류 산출)
  visual_rules  JSONB,                         -- { colors[], typography, forbidden[] }
  source        TEXT,                          -- wizard | repo | paste
  source_repo   TEXT,                          -- repo 인입 시 'owner/name'
  source_path   TEXT,                          -- repo 인입 시 파일 경로 (예: wiki/Tenant/마케팅.md)
  source_ref    TEXT,                          -- repo 브랜치/태그 (기본 main)
  source_hash   TEXT,                          -- 원문 해시 — 동일하면 재증류 skip
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

-- 발행된 게시물 + 성과(insights). 실발행 시 1행, collect로 metrics 갱신.
CREATE TABLE IF NOT EXISTS published_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  draft_id      UUID,                          -- 원 초안(선택)
  platform      TEXT NOT NULL,                 -- threads | x | instagram | ...
  external_id   TEXT,                          -- threadsMediaId / tweetId / mediaId
  permalink     TEXT,
  text          TEXT,
  status        TEXT NOT NULL DEFAULT 'published', -- published | failed
  error         TEXT,
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 성과(insights) — collect가 갱신
  views         INTEGER,
  likes         INTEGER,
  replies       INTEGER,
  reposts       INTEGER,
  metrics_at    TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pubposts_tenant ON published_posts(tenant_id, published_at DESC);

-- P6 예약: 초안을 미래 시각에 멀티채널 발행 예약. 스케줄러가 scheduled_at 도래 시 발행.
CREATE TABLE IF NOT EXISTS schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  draft_id      UUID,                          -- 원 초안(선택)
  platforms     TEXT[],                        -- 발행 대상 채널 목록
  scheduled_at  TIMESTAMPTZ NOT NULL,          -- 예약 발행 시각
  status        TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | published | canceled
  payload       JSONB,                         -- 발행 페이로드 스냅샷
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON schedules(tenant_id, scheduled_at);

-- P7 팔로워추적: 채널별 팔로워/팔로잉 시계열 롤업. growth 추세 시각화.
CREATE TABLE IF NOT EXISTS growth_metrics (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL,                 -- threads | x | instagram | ...
  followers     INTEGER,
  following     INTEGER,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_growth_metrics_tenant ON growth_metrics(tenant_id, recorded_at DESC);

-- P9 트렌드/터진글: 외부 인기글·트렌드 시그널 수집. score로 랭킹, content 생성 소스로 활용.
CREATE TABLE IF NOT EXISTS viral_signals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source        TEXT,                          -- 수집 출처 (search | trending | ...)
  external_ref  TEXT,                          -- 외부 글 식별자/URL
  content       TEXT,                          -- 본문/요약
  score         NUMERIC,                       -- 화제성 점수
  captured_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_viral_signals_tenant ON viral_signals(tenant_id, captured_at DESC);


-- 테넌트 API 토큰(인증모델 b). 포크 프론트가 이 토큰으로 중앙 API 호출 → 서버가 tenant 못박음.
-- 원문은 발급 시 1회만 노출, 저장은 sha256 해시. RLS 제외(토큰→tenant 해석은 tenant 컨텍스트 진입 전이라).
CREATE TABLE IF NOT EXISTS tenant_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,           -- sha256(raw)
  label         TEXT,                            -- 용도 메모 (예: 'tenant3-frontend')
  last_used_at  TIMESTAMPTZ,
  revoked       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenant_tokens_hash ON tenant_tokens(token_hash);

-- 위키 문서 전체 인입(폴더 통째). 생성 시 pg_trgm으로 관련 문서 검색→프롬프트 주입(사실 기반).
-- 문서별 1행, hash로 증분 동기화. 테넌트별 RLS.
CREATE TABLE IF NOT EXISTS wiki_docs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,                    -- 'wiki/제품/기능.md'
  title       TEXT,                             -- 첫 H1 또는 파일명
  content     TEXT,                             -- 원문(.md 전체)
  hash        TEXT,                             -- sha256(content) — 증분 동기화
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, path)
);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_trgm ON wiki_docs USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_wiki_docs_tenant ON wiki_docs(tenant_id);
