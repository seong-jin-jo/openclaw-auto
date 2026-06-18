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

**현재 실제 배포 (2026-06 handoff 기준, 0차 필수 참고)**:
**상세 전체 (터널, GHA, 빌드 규칙, 버그, 스모크, 교훈)**: `wiki/learnings/2026-06-19-openclaw-osmu-handoff.md` **반드시 먼저 읽을 것**.
- 공개: cloudflared 터널 (Proxmox) → localhost:18789
- 배포: self-hosted GHA (marketing_runner) + 수동 `gh workflow run deploy-marketing.yml -f services="openclaw-dashboard-osmu"`
- 시크릿: GitHub Secrets only
- 0차 작업 시 이 모델(터널 + GHA 수동 + build-arg + DASHBOARD_PORT + 스모크)을 절대 깨지 않게.
- 공개: cloudflared 터널 (Proxmox VM 100.80.25.40 → 192.168.1.110) → localhost:18789
- 배포: GitHub Actions self-hosted runner (`marketing_runner`) + 수동 `gh workflow run deploy-marketing.yml -f services="openclaw-dashboard-osmu"`
- Compose: `docker-compose.postagi-4tenants.yml` 의 `openclaw-dashboard-osmu` (포트 18789)
- 시크릿: GitHub Secrets만 사용 (.env.osmu 렌더). VM에 secrets 파일 없음.
- 상세 운영 컨텍스트: `wiki/learnings/2026-06-19-openclaw-osmu-handoff.md` 참조.

**추천 미래 배포 모델: Cloudflare for SaaS (Custom Hostnames)**
- 0차/1차 고객용 정답: 고객이 자기 도메인을 직접 꽂을 수 있게.
- 예: marketing.example.com
  - 우리 CF에서 Custom Hostname 등록 → 고객 CNAME → fallback origin.
  - CF가 cross-account routing + SSL.
- 2개 도메인까지 무료.
- 현재는 터널 + self-hosted GHA 로 운영 중. CF SaaS 는 고객 커스텀 도메인 단계에서 적용.

이 모델을 0차에서 점진적으로 안정화 (현재 배포 방식 깨지 않게 주의). 단일 앱 + 완전 테넌트 격리 유지.

**테넌트 격리 세부**:
- DB: 모든 테이블에 `tenant_id`, RLS (Row Level Security) + `withTenant()` wrapper 강제.
- UI: effectiveTenantId로 모든 요청/화면 격리. 한 테넌트 데이터가 다른 화면에 절대 노출 안 됨.
- R2: per-tenant prefix 또는 별도 bucket policy.

**0차 구현 상세 계획 (handoff 현실 반영, 더 세밀하게 다듬음)**:

**⚠️ 필수 선행**: `wiki/learnings/2026-06-19-openclaw-osmu-handoff.md` 전체 읽기. 
현재 라이브(터널 + self-hosted GHA 수동 + build-arg 규칙 + DASHBOARD_PORT + 스모크 게이트)를 절대 깨지 않게 해야 함.

**1. Tenant Isolation 완벽화 (단일 앱 + 완전 격리)**
   - DB: 모든 주요 테이블에 tenant_id 강제 + RLS 정책 철저 적용 + withTenant() wrapper 누락 방지.
   - UI: 모든 라우트/컴포넌트에서 effectiveTenantId 기반 격리. 한 테넌트 데이터가 다른 화면에 절대 보이지 않게.
   - 테스트: 여러 테넌트 시뮬레이션으로 크로스-테넌트 누출 방지 검증.
   - 현재 상태 점검: data-model.md와 schema.sql 기반으로 gaps 찾기.

**2. Cloudflare for SaaS (Custom Hostnames) 구현**
   - Fallback origin 설정 (우리가 관리하는 단일 origin).
   - Custom Hostname 등록 자동화/매핑 (hostname → tenant_id lookup, 미들웨어 또는 CF Worker).
   - 예시: marketing.example.com → 우리 origin, 고객은 CNAME 설정.
   - SSL: CF 자동 발급 확인.
   - 테스트: 1-2개 도메인으로 end-to-end (routing + isolation).
   - 한계: 2개까지 무료, 이후 유료 고려.

**3. Multi-repo Wiki Context Pulling (0차 핵심)**
   - 사용자가 가진 다른 레포/노트 위키를 포인팅해서 context 끌어오기.
   - 여기 product wiki (`wiki/`) + 외부 레포 위키 동시 지원.
   - 구현: sourcing/route.ts 등에서 repo URL + path 지원 강화, RAG/주입 로직.
   - 안정성: 에러 시 명확한 메시지 + fallback.

**4. Reliability & Error Handling (에러 설명 가능하게)**
   - 모든 에러 (발행 실패, 기록 미노출, API 에러 등)에 대해:
     - 상세 로그 (traceable).
     - 사용자에게 "무엇이 왜 실패했는지" 설명 가능한 메시지.
   - Debug/재현 모드 추가 (사용자가 에러를 operator에게 쉽게 전달).
   - 인프라 모니터링 (크론, API 다운 방지).

**5. Shorts Factory + Automation Loop 안정화 (0차 검증)**
   - Wiki context (자신의 서비스 + product wiki)로 숏폼 후보 생성 → 검토 → 발행 → 인사이트까지 풀 루프.
   - Multi-channel (text + video) 동작 확인.
   - 사용자가 실제 서비스에서 "시간 절감 or 부수입 가능" 체감할 수준으로.

**6. Onboarding 마찰 최소화 (토큰 과정)**
   - API 토큰 발급/등록을 더 가이드화 (메뉴얼 or 셀프 트라이).
   - 0차에서는 operator(본인)가 쉽게 여러 서비스 등록할 수 있게.

**7. 0차 완료 기준 + 전환**
   - 위 성공 기준 만족 시 1차로 (1명 사용자 유치).
   - SoloClaw 이름 가정 하에 브랜딩 최소 적용.
   - 모든 변경은 gstack 절차 (read wiki → plan → implement → review) 따름.

자세한 Cloudflare 설정은 별도 `wiki/ops/deploy.md`에 문서화 예정.
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