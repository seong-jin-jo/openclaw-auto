# Handoff: openclaw-auto 운영 컨텍스트 (2026-06-16~18 실측)

**Date**: 2026-06-19
**Source**: 이전 Claude 세션 handoff
**Status**: 0차 진행 시 반드시 참고. 이 문서는 wiki/learnings/ 에 기록됨.

## 현재 라이브 배포 (실제 동작 중)
- **공개 URL**: https://openclaw.example.com
  - cloudflared 터널 (온프렘 VM) → localhost:18789
- **VM**: Proxmox (root@100.80.25.40) 안의 marketing@192.168.1.110 에서 cloudflared 데몬 실행 중.
- **배포 방식**:
  - GitHub Actions: `deploy-marketing.yml` (self-hosted runner = `marketing_runner`)
  - 명령: `gh workflow run deploy-marketing.yml -f services="openclaw-dashboard-osmu"`
  - push만으로는 배포되지 않음 (수동 트리거 필수).
- **Compose**: `docker-compose.postagi-4tenants.yml` 의 `openclaw-dashboard-osmu` 서비스 (포트 18789).

## 시크릿 관리
- **모든 시크릿은 GitHub Actions Secrets에만 존재** (VM에 secrets 파일 두지 않음).
- 주요:
  - OSMU_DASHBOARD_AUTH_TOKEN
  - OSMU_SUPABASE_URL
  - OSMU_SUPABASE_ANON_KEY
  - OSMU_DATABASE_URL
  - OSMU_SECRET_KEY
- 워크플로가 배포 시 이 값들로 `.env.osmu` 를 렌더링 (services에 'osmu' 포함 시).
- 운영자 대시보드 접속: `OSMU_DASHBOARD_AUTH_TOKEN` 값을 localStorage `dashboard_auth_token` 에 넣음.

## 고친 치명적 버그 (다시 밟지 말 것)
1. **NEXT_PUBLIC_* 빌드 타임 문제**
   - NEXT_PUBLIC_* 는 `next build` 시점에 인라인됨.
   - 런타임 .env 만 주면 빈 값 → "supabaseUrl is required" 로 가입/로그인 실패.
   - **해결**: Dockerfile에 ARG/ENV + 워크플로 build 시 `--build-arg NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` (secrets에서).
   - 공개키는 **반드시 build-arg** 로 주입.

2. **포트 처리**
   - dashboard Dockerfile CMD 가 `PORT` 가 아니라 `DASHBOARD_PORT` 를 읽음 (기본 34560).
   - 포트 지정은 반드시 `DASHBOARD_PORT` 로 (PORT 무시됨, 34560 충돌 시 502).
   - **해결**: 배포 시 DASHBOARD_PORT 명시.

3. **AuthGate LandingPage 덮어쓰기**
   - 토큰 없으면 /login 포함 모든 경로에 LandingPage 가 덮어씀 → 가입폼 안 보임.
   - **해결**: usePathname 으로 `/login`, `/signup` 은 통과시킴.

## 인증 / 멀티테넌트 (이미 동작 중)
- **고객 로그인**: Supabase Auth (`/login` – 이메일/비번/구글).
  - 첫 로그인 시 `tenants` 자동 생성 (owner_auth_id).
- **effectiveTenantId 우선순위**:
  1. 세션
  2. osmu_토큰
  3. Host header (tenants.domain 매칭)
  4. fallback
- **테넌트 격리**:
  - `lib/db.ts`: `withTenant()` → `SET LOCAL ROLE osmu_service + app.tenant_id`
  - RLS 정책 적용. 고객 A 데이터는 B가 절대 못 봄 (검증됨).
- **커스텀 도메인**:
  - `tenants.domain` 에 도메인 저장 → `resolveTenantByHost()` 로 매핑.
  - 외부 도메인(다른 CF 계정)의 경우 **Cloudflare for SaaS (Custom Hostnames)** 필요.
- **Supabase 설정 주의**:
  - "Confirm email" 토글 ON: 가입 후 메일 확인 필요 (실서비스 권장).
  - OFF (autoconfirm): 즉시 로그인 (테스트용).
  - 콘솔: supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo

## 재발 방지 (이미 배포 파이프라인에 박음)
- `deploy-marketing.yml` 끝에 **OSMU 스모크 게이트**:
  - `/login` → 200
  - `/api/me` → 401 (인증 필요)
  - supabase URL 빌드 주입 확인 (grep)
  - 하나라도 실패하면 배포 FAIL.
- **미작성 (다음에 할 것)**: Playwright E2E (로그아웃 → 가입 → 로그인 → 대시보드 → 테넌트 격리 검증).

## 교훈 (강조)
- **빌드 통과 + HTTP 200 ≠ 실제 동작**.
- 배포 UX 검증은 **실제 브라우저** (로그아웃 상태, 신규 방문자 관점) 로 가입/로그인/제출까지 직접 눌러봐야 함.
- 노출된 시크릿 (VM 비번 qwer1234!, 과거 토큰들)은 로테이트 권장.

## 0차와의 연관 (2026-06-19 추가)
- 현재 라이브는 "osmu" 테넌트 중심 (4 tenants compose).
- 0차 목표(운영자 본인의 다중 서비스 안정 자동화) 달성을 위해 **반드시 지켜야 할 것**:
  - 이 배포 모델(cloudflared 터널 + self-hosted GHA 수동 트리거 + build-arg 규칙 + DASHBOARD_PORT + 스모크 게이트)을 절대 깨지 않게.
  - Multi-repo wiki context pulling (다른 서비스 레포 위키 끌어오기) 추가.
  - 에러 설명력 대폭 개선 (사용자가 로그로 설명 가능하게).
  - Shorts Factory + 전체 루프 안정화.
- CF for SaaS (Custom Hostnames)는 **고객용 커스텀 도메인** 단계 (0차 안정 후 1차)에서 본격 적용.
- 모든 0차 작업 전 이 파일 + `wiki/ops/multi-tenant.md` + `wiki/product/vision.md` 선행 읽기 필수.
- 교훈: "빌드 통과 + HTTP 200 ≠ 동작". 항상 실제 브라우저 플로우(로그아웃/신규 사용자 관점)로 검증.

이 문서는 이전 운영 세션의 실측 컨텍스트를 정확히 보존하기 위해 기록됨.
0차 작업 시 이 파일을 먼저 읽고, 위 버그 패턴과 배포 절차를 절대 깨지 않도록 한다.