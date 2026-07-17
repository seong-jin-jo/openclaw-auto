-- OSMU 멀티테넌트 스키마 (단계0 — 내부 팀용 경량)
-- 제공자(우리) 중앙 호스팅 Postgres. 공유DB + tenant_id. RLS는 SaaS화 시 활성.
-- 적용: psql -d openclaw_osmu -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- 위키 문서 trigram 검색(한글 부분매칭)

-- 테넌트(워크스페이스). 내부 단계는 하드인증 없음 — 등록=워크스페이스 생성.
CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,            -- URL/식별용 (예: tenant1)
  name        TEXT NOT NULL,                   -- 표시명 (예: Tenant One)
  status      TEXT NOT NULL DEFAULT 'active',  -- active | paused (+ 레거시 pending, 아래 백필 DO 블록이 active로 전환).
                                                -- OSMU v1.0.0부터 신규 셀프서브 가입은 즉시 'active'로 생성(공개 대시보드) —
                                                -- 계정 게이트는 paused/unavailable(알수없는 값)만. 공유 AI 사용 승인은
                                                -- 별도 컬럼 shared_cli_approved_at(아래)로 분리됐다. CHECK 제약 없음, 코멘트만 갱신.
  tier        TEXT NOT NULL DEFAULT 'starter',    -- starter | pro | team (ADR-003 hybrid pricing)
  domain      TEXT UNIQUE,                     -- 커스텀 도메인(CNAME). Host 헤더 → 이 테넌트로 매핑(호스팅 멀티테넌트)
  owner_auth_id UUID UNIQUE,                    -- Supabase Auth 유저 → 테넌트 매핑(고객 셀프서브 로그인). 첫 로그인 시 자동 생성
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OSMU v1.0.0 셀프서브 오픈: 공유 claude -p("공유 AI") 사용 승인 시각(nullable, tenants.status와
-- 독립된 별도 entitlement). null = 미승인(BYO Anthropic 키 등록 시에만 생성 가능), 값 있음 = 운영자가
-- 공유 CLI quota 사용을 승인. 계정 자체 접근(active/paused)과 절대 섞지 않는다 — 승인 대기가 대시보드
-- 진입 자체를 막지 않는다(lib/anthropic.ts generateText가 quota reserve 전에 이 컬럼만 gate).
-- 1회성 백필(멱등 — 컬럼이 "이번 실행에서 처음 추가되는" 경우에만 동작. 이미 존재하면 전체 스킵되므로
-- schema.sql 재적용(재배포 등)이 운영자의 이후 승인/회수(shared_cli_approved_at UPDATE)를 되돌리지 않는다):
--   · 기존 active 테넌트 → 즉시 공유 승인(now()) — 라이브 고객 워크플로 무중단.
--   · 기존 pending 테넌트 → status만 active로 전환(계정 게이트는 이제 paused/unavailable만). 공유 AI 승인은
--     별도 entitlement이므로 shared_cli_approved_at은 null로 남겨 운영자가 개별 승인.
--   · paused 테넌트 → status/승인 모두 그대로(변경 없음).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tenants' AND column_name = 'shared_cli_approved_at'
  ) THEN
    ALTER TABLE tenants ADD COLUMN shared_cli_approved_at TIMESTAMPTZ;
    UPDATE tenants SET shared_cli_approved_at = now() WHERE status = 'active';
    UPDATE tenants SET status = 'active' WHERE status = 'pending';
  END IF;
END $$;

-- 브랜드 컨텍스트(위저드/레포연동 산출, 표준 스키마). 생성이 이걸 읽어 톤 주입.
CREATE TABLE IF NOT EXISTS brand_guides (
  tenant_id     UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  prompt_guide  TEXT,                          -- 톤·금지어·hook·페르소나 (claude -p 증류 산출)
  visual_rules  JSONB,                         -- { colors[], typography, forbidden[] }
  source        TEXT,                          -- wizard | repo | paste
  source_repo   TEXT,                          -- repo 인입 시 'owner/name'
  source_path   TEXT,                          -- repo 인입 시 파일 경로 (예: wiki/brand/마케팅.md)
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

-- P4: 발행 큐(현 data/queue.json v2 → 이주). expand/contract 1단계 = dual-write(읽기/cron은 json 유지, 무중단).
-- id는 queue.json 항목 id(UUID)와 1:1. payload에 원 항목 무손실 스냅샷.
CREATE TABLE IF NOT EXISTS queue_posts (
  id            UUID PRIMARY KEY,                  -- queue.json post.id와 동일(default 없음)
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  text          TEXT,
  topic         TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',     -- draft | approved | published | failed
  hashtags      TEXT[],
  channels      JSONB,                             -- v2 멀티채널 발행 상태
  payload       JSONB,                             -- 원 queue.json 항목 스냅샷(무손실)
  generated_at  TIMESTAMPTZ,
  approved_at   TIMESTAMPTZ,
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_queue_posts_tenant ON queue_posts(tenant_id, status, generated_at DESC);

-- P6 예약: 초안을 미래 시각에 멀티채널 발행 예약. 스케줄러가 scheduled_at 도래 시 발행.
CREATE TABLE IF NOT EXISTS schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  draft_id      UUID,                          -- 원 초안(선택)
  platforms     TEXT[],                        -- 발행 대상 채널 목록
  scheduled_at  TIMESTAMPTZ NOT NULL,          -- 예약 발행 시각
  status        TEXT NOT NULL DEFAULT 'scheduled', -- scheduled | processing | published | partial | failed | canceled
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
  label         TEXT,                            -- 용도 메모 (예: 'tenant-frontend')
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

-- Usage & Billing for Hybrid SaaS Pricing (ADR-003)
-- Track events for base + usage billing. Aggregate for quotas and overage.
CREATE TABLE IF NOT EXISTS usage_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,                   -- aiGeneration, shortsVideoMinute, publication, priorityModel, apiCall, etc.
  quantity      NUMERIC NOT NULL DEFAULT 1,      -- count or minutes
  meta          JSONB,                           -- e.g. { model, source: 'shorts', wiki_path }
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant ON usage_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(tenant_id, event_type, created_at);

-- Current subscription state per tenant (for base pricing + tier)
CREATE TABLE IF NOT EXISTS subscriptions (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  tier              TEXT NOT NULL DEFAULT 'starter',  -- starter | pro | team
  base_price        NUMERIC,                          -- monthly base in cents or won units
  status            TEXT NOT NULL DEFAULT 'active',   -- active | past_due | canceled
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Monthly quotas & usage summary (for enforcement and dashboard)
CREATE TABLE IF NOT EXISTS usage_quotas (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  period            TEXT NOT NULL,                   -- YYYY-MM
  shorts_included   INTEGER DEFAULT 50,
  shorts_used       INTEGER DEFAULT 0,
  generations_included INTEGER DEFAULT 1000,
  generations_used  INTEGER DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, period)
);
CREATE INDEX IF NOT EXISTS idx_usage_quotas_tenant_period ON usage_quotas(tenant_id, period);

-- SNS-007: 사이트 내 provider별 다중 계정. `integrations(kind='channel')`는 provider당 1행이라
-- "Threads 개인+브랜드 2개 동시 연결" 같은 요구를 표현 못 한다(2026-07-17 사용자 실기기 QA).
-- ADD-ONLY: integrations UNIQUE(tenant_id,kind,label)는 건드리지 않는다 — 기존 단일계정 rollback 경로 보존.
-- integrations는 "그 provider의 현재 기본 계정"을 계속 미러링(dual-write)해 레거시 소비자
-- (getChannelCred 폴백, publish-due 등 미마이그레이트 경로)가 무중단으로 동작한다.
-- (아키텍처는 main 세션이 회장과 합의해 code-builder에 지정 — 2026-07-17, ADD table / integrations 불변.)
CREATE TABLE IF NOT EXISTS channel_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider            TEXT NOT NULL,               -- threads | instagram | x | facebook | bluesky | youtube | ...
  external_account_id TEXT NOT NULL,                -- provider가 발급한 authoritative user/channel/page id
  display_name        TEXT,                         -- 사람이 읽는 이름(YouTube 채널명 등)
  username            TEXT,                          -- @handle
  secret_enc          TEXT NOT NULL,                 -- pgp_sym_encrypt(access_token) — 평문 절대 금지
  refresh_enc         TEXT,                          -- pgp_sym_encrypt(refresh_token), nullable
  meta                JSONB,                         -- provider별 부가 필드(X 4키, api flag 등)
  is_default          BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL DEFAULT 'active', -- active | expired | revoked
  token_expires_at    TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider, external_account_id)
);
CREATE INDEX IF NOT EXISTS idx_channel_accounts_tenant ON channel_accounts(tenant_id, provider);
-- provider당 tenant 1개만 기본계정 — is_default=true 행에만 걸리는 partial unique index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_channel_accounts_one_default
  ON channel_accounts(tenant_id, provider) WHERE is_default;

-- 발행/스케줄이 "이 특정 계정으로" 발행했는지 감사·선택발행 대상 — additive, nullable, SET NULL
-- (계정 삭제돼도 과거 발행 기록 자체는 보존, 참조만 끊음).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='published_posts' AND column_name='account_id'
  ) THEN
    ALTER TABLE published_posts ADD COLUMN account_id UUID REFERENCES channel_accounts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='schedules' AND column_name='account_id'
  ) THEN
    ALTER TABLE schedules ADD COLUMN account_id UUID REFERENCES channel_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 멱등 백필: 기존 integrations(kind='channel') 1행 → provider당 channel_accounts 1행(기본계정)으로 승격.
-- 매 배포마다 실행 — 개별 tenant/provider 단위 idempotency는 ON CONFLICT DO NOTHING이 보장한다(이미
-- 존재하는 행은 override하지 않음). 이러면 나중에 integrations에 새 tenant/provider가 추가돼도(레거시
-- 코드 경로가 살아있는 한) 다음 배포에서 자동 백필된다 — global existence-guard(구버전, 테이블이 통째로
-- 비었을 때만 동작)는 제거했다: 그 가드는 한 번이라도 다른 provider로 계정을 추가한 뒤 재배포하면 나머지
-- legacy integrations가 영원히 백필 안 되는 결함이 있었다(2026-07-17 리뷰).
-- 보안: 마이그레이션 SQL엔 OSMU_SECRET_KEY가 없어 여기서 pgp_sym_encrypt 불가 — refresh_enc는 반드시
-- NULL로 남기고(평문 복사 금지), meta에서도 refreshToken 키를 제거해 plaintext가 어디에도 안 남게 한다.
-- refresh_enc가 NULL인 legacy 계정은 코드 레벨에서 자동 refresh 금지 — 재연결(OAuth) 유도 대상.
DO $$
DECLARE
  r RECORD;
  legacy_id TEXT;
BEGIN
  FOR r IN
    SELECT tenant_id, label AS provider, secret_enc, meta
    FROM integrations
    WHERE kind = 'channel' AND secret_enc IS NOT NULL AND secret_enc <> ''
  LOOP
    legacy_id := COALESCE(r.meta->>'userId', 'legacy-' || r.provider || '-' || r.tenant_id::text);
    -- 방어: 이 tenant/provider에 channel_accounts 행이 이미 하나라도 있으면(OAuth 재연결이
    -- 이 migration보다 먼저 계정을 만들었거나, 재배포로 다른 external_id가 이미 기본계정인 경우)
    -- is_default=true 백필을 건너뛴다 — 안 그러면 uq_channel_accounts_one_default(partial unique)와
    -- 충돌해 이 DO 블록 전체가 롤백된다(한 tenant 사고가 전체 배포를 막는 것 방지, 2026-07-17 발견).
    IF NOT EXISTS (
      SELECT 1 FROM channel_accounts WHERE tenant_id = r.tenant_id AND provider = r.provider
    ) THEN
      INSERT INTO channel_accounts (tenant_id, provider, external_account_id, display_name, username, secret_enc, refresh_enc, meta, is_default, status)
      VALUES (
        r.tenant_id, r.provider, legacy_id,
        NULL, NULL,
        r.secret_enc,
        NULL, -- 평문 refresh 절대 복사 금지 — 재연결 시 upsertChannelAccount가 암호화 저장
        (r.meta - 'refreshToken'), true, 'active'
      )
      ON CONFLICT (tenant_id, provider, external_account_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
