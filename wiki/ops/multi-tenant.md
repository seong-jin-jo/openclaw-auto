# Multi-Tenancy & SaaS Operations

## Design Principles
- Every piece of user data is tenant-scoped.
- RLS (Row Level Security) in Postgres + `withTenant()` wrapper in all queries.
- Isolation even at the API layer via effectiveTenantId.

## Key Isolation Points
- `wiki_docs`, `drafts`, `viral_signals`, `growth_metrics` — all have `tenant_id`.
- Prompt guides, keywords, credentials — stored per-tenant or per-workspace.
- Brand wiki sync is per-tenant (GitHub PAT + folder scoped).
- Project wiki (`wiki/`) is repo-level (shared dev knowledge, not customer data).

## Workspace / Tenant Model
- Tenant = billing/ownership unit.
- Workspace = operating unit (one "brand" or service).
- One tenant can have multiple workspaces (agency model).

## Onboarding & Activation
- Wizard: choose industry → auto-generate prompt-guide + keywords from templates.
- First channel connect triggers credential verification.
- Wiki/repo sync encouraged early (biggest quality lever).

## Deployment & Custom Domains (0차 아키텍처 핵심)

**원칙**: 하나의 사이트/앱에서 관리하되, 화면(UI)과 DB가 테넌트별로 **완전히 격리**되어야 한다.

**추천 배포 모델: Cloudflare for SaaS (Custom Hostnames)** — 0차에서 정답으로 채택
- 이게 정답: "고객이 자기 도메인 꽂게" 하는 전용 기능.
- 실제 동작 예 (marketing.example.com):
  1. 우리 CF 계정에서 `marketing.example.com`을 Custom Hostname으로 등록.
  2. 고객(sample) 계정에서 CNAME을 우리의 fallback origin으로 설정.
  3. CF가 교차계정 라우팅 + SSL 자동 발급/관리.
- 장점:
  - 멀티테넌트 SaaS의 표준.
  - 고객 브랜딩 완전 지원.
  - 2개 도메인까지 무료 한도 내.
- 구현 포인트:
  - Fallback origin (우리가 관리).
  - Hostname → tenant 매핑.
  - CF Custom Hostnames API/설정.

이 모델을 0차에서 먼저 안정화한다. 단일 앱 + 완전 테넌트 격리 + 고객 도메인 지원.

**테넌트 격리 세부**:
- DB: 모든 테이블에 `tenant_id`, RLS (Row Level Security) + `withTenant()` wrapper 강제.
- UI: effectiveTenantId로 모든 요청/화면 격리. 한 테넌트 데이터가 다른 화면에 절대 노출 안 됨.
- R2: per-tenant prefix 또는 별도 bucket policy.

**구현 로드맵 (0차)**:
1. Fallback origin + basic Custom Hostname 매핑.
2. Hostname resolver 미들웨어 (req.hostname → tenant lookup).
3. SSL 자동화 확인 + 테스트 (2개 도메인).
4. 테넌트별 완전 격리 검증 (DB + UI).
5. 문서화 (이 파일 + deploy 가이드).
- Cron: tenant-aware execution + rate limit.

자세한 Cloudflare 설정과 코드는 `wiki/ops/deploy.md` (추가 예정)와 architecture 문서 참조.

## Scaling Considerations for 1,000+ Subscribers
- Cron workers must be tenant-aware and rate-limit per account.
- Model usage tracked (primary Sonnet for gen, Haiku for ops).
- Storage: R2 per-tenant prefixes where needed.
- Database: proper indexing on tenant_id + time.
- Observability: per-tenant metrics for generation count, publish success, viral rate.

## Security
- Credential verification on save (real API calls).
- Tokens hashed.
- No service-specific secrets in repo.

See decisions/ and architecture/data-model.md for persistence details. All development of multi-tenant features follows gstack procedures.