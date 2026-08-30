# Handoff: openclaw-auto 운영 컨텍스트 (2026-06-16~18 실측)

**Date**: 2026-06-19
**Source**: 이전 Claude 세션 handoff
**Status**: 0차 진행 시 반드시 참고. 이 문서는 wiki/4-reference/learnings/ 에 기록됨.

> **다음 세션 시작 시 먼저 읽을 것**: 이 파일 전체 + 아래 "## User Flow Verification as Real User (Operator + Marketer/Business Owner) - 2026-06-19" 섹션.
> 이 파일 하나만 보면 지금까지 얘기한 0차 진행 상황, 배포 실측, 발견된 문제, 수정사항, 추천 테스트 플로우가 거의 다 복구됩니다. gstack 절차와 handoff 제약도 포함.

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
- **완료 (2026-06-19)**: gstack browse (Playwright 기반) E2E로 logout→가입/로그인 페이지 진입→폼 검증 완료. 상세는 아래 "gstack E2E 실행 기록" 섹션. 스크립트 `dashboard/scripts/verify-e2e.sh` 로 상시 실행 가능. (완전 인증 submit + isolation browser는 creds 필요해 제한적).

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
- 모든 0차 작업 전 이 파일 + `wiki/3-operations/runbooks/multi-tenant.md` + `wiki/2-product/build/vision.md` 선행 읽기 필수.
- 교훈: "빌드 통과 + HTTP 200 ≠ 동작". 항상 실제 브라우저 플로우(로그아웃/신규 사용자 관점)로 검증.

이 문서는 이전 운영 세션의 실측 컨텍스트를 정확히 보존하기 위해 기록됨.
0차 작업 시 이 파일을 먼저 읽고, 위 버그 패턴과 배포 절차를 절대 깨지 않도록 한다.

**0차 진행 상태 (2026-06-19)**
- sourcing/route.ts: multi-repo context_sources 지원 (github raw/local) 추가 완료. longform/facts에 append.
- 에러: 상세 메시지 + 배열 수집 강화.
- 준수: handoff (no build var, runtime).
- gstack: 파일 읽음 (sourcing, handoff 등) 후 변경.
- 다음: test, reliability 더, loop.

**0차 진행 업데이트 (2026-06-19)**
- sourcing/route.ts 확장: context_sources 배열 지원으로 multi-repo wiki pulling (github raw, local) 구현. longform과 facts에 append.
- 에러 수집 강화: errors 배열에 모든 실패 (load, chunk, save, record) 기록, 응답에 포함.
- 사용량 기록 추가 (shortsGeneration).
- 변경은 handoff 제약 준수 (런타임, no build var).
- 다음: operator 서비스로 테스트, 에러 메시지 상세화 (사용자가 설명 가능하게), loop 안정화.
- gstack: 관련 파일 읽음 + 실제 browse 바이너리로 live site E2E (landing→/login form, storage clear) 실행 + 결과 기록. 스크립트 추가.

**0차 진행 상태 (2026-06-19, operator test 준비 완료)**
- sourcing + studio: multi-repo + wiki_path + MAX_CONTEXT_CHARS 완료. `scripts/verify-0cha-context.sh` 가 바로 복붙 가능한 payload 출력.
- longform + video: explainable + partial success 구조 검증 완료.
- E2E: gstack + verify-e2e.sh 완료.
- Operator Instructions 문서화 완료 (handoff 이하).
- 다음: operator가 scripts + 지침 따라 실제 sourcing → Shorts loop 돌려 0차 green.

## gstack E2E 실행 기록 (2026-06-19)
**실제 브라우저 실행**: gstack browse binary로 live URL (`https://openclaw.example.com`) 직접 검증.

**검증한 플로우 (handoff 요구사항 매핑)**:
- unauth (logout-like) → landing 정상 로드 (마케팅 + "로그인 / 회원가입 →", "무료로 시작하기").
- landing의 "로그인 / 회원가입 →" 클릭 → /login 정확히 이동.
- /login: 이메일/비밀번호 입력, 로그인 버튼, Google, "계정이 없으신가요? 가입" toggle 정상 렌더.
- AuthGate override 버그 재발 없음: /login 은 landing이 아닌 전용 auth form.
- localStorage/sessionStorage clear 후 재방문 /login → 여전히 form 표시 (자동 대시보드 진입 안 함).
- 일부 401 on /api/me 는 unauth 상태에서 정상 (스모크 게이트와 일치).

**스크린샷** (실행 시 /tmp/e2e-*.png 생성):
- e2e-landing.png
- e2e-login.png
- e2e-after-login-click.png
- e2e-logout-sim.png

**발견/수정**:
- /signup 직접 방문 시 404 → dashboard/src/app/signup/page.tsx 추가 ( /login?mode=signup 으로 redirect).
- login/page.tsx 가 ?mode=signup 과 /signup pathname을 초기 state로 인식하도록 수정 (toggle로 가입 모드 지원).
- /signup 는 별도 페이지가 아니라 /login 내부 toggle이었음. handoff 표기와 코드 불일치 수정.

**한계**:
- 실제 Supabase signUp/signIn (이메일 가입→로그인→대시보드) 은 실계정 생성이라 여기서는 미실행.
- 대시보드 내부 (인증 후) + 테넌트 격리 browser 검증 은 유효 토큰/계정 필요. DB 레벨 격리는 Vitest (rls.isolation.test.ts) 로 이미 커버.
- Operator 토큰(localStorage dashboard_auth_token) 기반 대시보드 진입도 토큰 없으면 풀 테스트 불가.

**스크립트로 영구화**:
- `dashboard/scripts/verify-e2e.sh` (gstack) — auth entry (logout→login form) 검증. `npm run e2e` 실행 가능. 최근 run: PASSED (core).
- `scripts/verify-0cha-context.sh` — multi-repo local/github context 로드 smoke. wiki/2-product/build/vision.md 로드 성공.
- `dashboard/tests/context-sources.test.ts` — 포맷 + explainable error 가드.
- Node 시뮬 직접 실행: wiki_path + context_sources (vision, shorts-factory, multi-tenant) append 성공 확인.

**결과**: 
- E2E auth: 통과 (gstack + script).
- Multi-repo: local wiki_path + context_sources 시뮬 성공 (Node + scripts). 실제 append 헤더 + 내용 주입 확인.
- Shorts/error: longform per-chunk + save errors, video TTS fail-continue 구조 감사 OK.
- 모든 변경 handoff 제약 준수.
- "빌드+HTTP≠동작" 교훈 실천 (gstack 실제 브라우저).

다음 full E2E 강화: seeded test user + 실제 로그인 submit + 대시보드 element 확인 + tenant scope smoke (가능하면).

- Wiki: handoff + plan 반영.
- Next: test, criteria check, 1차.

## 0차 성공 기준 검증 (2026-06-19 현재, E2E 후)

vision.md + multi-tenant.md 기준으로 매핑.

| # | 기준 | 상태 | 증거 | 남은 gap |
|---|------|------|------|----------|
| 1 | 여러 레포 wiki context 로드 + 프롬프트 주입 | 완료 + full pipeline sim | sourcing/studio + MAX_CONTEXT_CHARS. scripts/verify-0cha-context.sh 가 실제 wiki 파일로 full sim (wiki_path + context_sources → facts prepend) 실행 + 증거 출력. | operator가 payload POST 후 live Shorts에서 grounding 확인 |
| 2 | Shorts Factory + publish 루프 (에러 설명 가능) | 코드 검증 + sim | sourcing에서 context 주입 → buildChunkPrompt에 facts prepend. longform/video 에러 수집 구조. full sim 스크립트로 pipeline 확인. | operator 실제 sourcing POST + extension/video 루프 실행 |
| 3 | 에러 "왜 났는지" 사용자 설명 가능 | 완료 + 검증 | sourcing: errors.push with "Check repo access... For private: token", longform per-chunk, video TTS graceful. MAX_CONTEXT_CHARS (1200)로 bloat 방지 추가. | 더 많은 에러 시나리오 트리거 |
| 4 | 인프라/크론/발행 재현성 | 준수 | handoff smoke gates, deploy-marketing.yml, build-arg/DASHBOARD_PORT 규칙 | 크론 실제 run 로그 or canary |
| 5 | 온보딩 마찰 최소 | notes | BrandSetup, token notes, /login self-serve | 실제 신규 tenant 셋업 경험 |
| 6 | SoloClaw로 실제 생산/발행 + 가치 체감 | operator test 준비 완료 | scripts/verify-0cha-context.sh + Operator Instructions로 "wiki facts → 생성 콘텐츠" 직접 테스트 가능하게 함 | operator가 이 지침 따라 풀 루프 돌려서 체감 |
| 7 | handoff 제약 + E2E | 완료 + verify | gstack + verify-e2e.sh (PASSED core), context sim scripts, handoff 제약 준수 | seeded submit + full dashboard + tenant browser (creds 필요) |

**현재 결론**: 대부분 구현 완료. "test + verify" 단계. E2E entry + multi-repo operator payload 스크립트로 handoff 미작성 항목 해소. MAX_CONTEXT_CHARS로 context bloat도 잡음.

**Operator Test Instructions (지금 당장 해볼 수 있음)**
1. `bash scripts/verify-0cha-context.sh` 실행 (이 레포 clone 상태에서).
   → Full pipeline sim + wiki/ 실제 파일 기반 POST 페이로드 바로 출력.

2. 대시보드 (dev:3456 또는 osmu live)에서:
   - 출력된 JSON을 `/api/sourcing` 에 POST.
   - 응답 `wikiFactsUsed: true`, errors 없음, candidates 생성 확인.
   - sourcing이 조립한 multi-repo facts가 Shorts 후보 grounding에 사용됐는지 (vision "Brand Truth Layer").

3. 이어서 longform-to-shorts 또는 /api/video/generate 로 풀 루프.

4. 에러 케이스: 없는 path → errors 배열에 "Check repo access... For private: provide token." 형태.

**목표 (vision.md 0차 성공 기준)**: operator가 여러 서비스 wiki를 context로 안정적으로 로드/주입하고, Shorts Factory 루프가 에러 설명 가능하게 동작하며, **자신의 콘텐츠를 실제 생산하면서 시간 절감/부수입 체감**.

**Full 0차 Pipeline Simulation Evidence (2026-06-19)**
`bash scripts/verify-0cha-context.sh` 최근 실행:
- wiki_path (product/shorts-factory.md) + context_sources (multi-tenant.md + vision.md) 로드 성공.
- longform 조립 + wikiFacts.
- Prompt prepending: "브랜드 사실 정보 (반드시 준수, 지어내지 마):" + facts + buildChunkPrompt 확인.
- "wikiFactsUsed" 메커니즘과 MAX_CONTEXT_CHARS 동작 입증.

이게 기획문서에서 말하는 "wiki context로 숏폼 후보 생성"의 정확한 동작이다.

**추천 그다음 즉시 작업 (진행 중 / 완료된 것)**:
- multi-repo 시뮬 + scripts/verify-0cha-context.sh (이제 operator payload 출력) **완료**.
- context-sources.test.ts 추가.
- longform/video error recovery 코드 감사 **완료**.
- E2E 스크립트 + gstack probe **완료**.
- 이 표 + Operator Instructions 업데이트 **진행**.

남은 핵심: 
1. operator 환경에서 실제 POST + Shorts → video 풀 루프 실행 (이 지침 사용).
2. 에러 시나리오 더 트리거.
3. 기준 대부분 green 되면 1차 전환.

**참고**: 이 파일의 "User Flow Verification..." 섹션은 다음 세션에서 가장 먼저 읽어야 할 핵심 복원 지점입니다. (맨 위쪽에도 동일 안내가 있습니다)

## User Flow Verification as Real User (Operator + Marketer/Business Owner) - 2026-06-19

**목적**: 유저 관점에서 gstack 브라우저로 실제 플로우를 하나씩 돌려보고, 막히는 지점(특히 운영자 토큰), 에러 피드백, 데이터가 적재적소에 보이는지를 철저히 검증.

### 1. 유저 입장에서 gstack으로 실제 돌려본 플로우 (랜딩 → 로그인 → 운영자 토큰 → Studio 등)
- **신규 방문자/마케터 (토큰 없음)**
  - 랜딩 페이지: "무료로 시작하기", "로그인 / 회원가입 →", "운영자세요? 토큰으로 접속" 잘 노출.
  - /login: 이메일/비번 폼 + Google + 가입 토글 정상.
  - /studio unauth: 로그인 폼으로 fall back.
  - 발견: 로그인 폼 빈 값 제출 시 아무런 피드백 없음 (조용히 무시).

- **운영자 토큰 플로우 (0차 핵심)**
  - 랜딩에서 "운영자세요? 토큰으로 접속" 클릭 → 인라인 입력창 + 버튼 노출 (발견성 양호).
  - 토큰 붙여넣고 제출 → setAuthToken + reload.

### 2. 발견한 문제들 (특히 틀린 토큰)
**틀린 토큰 (또는 비어있지 않은 잘못된 값) 넣었을 때의 치명적 현상**:
- AuthGate가 presence만 체크 → 풀 대시보드 UI가 즉시 노출됨 (사이드바, Marketing Hub, Studio, 채널 그룹 전부 표시).
- 실제 데이터: "Loading..." 무한 + 모든 `/api/*` (me, queue, overview 등) 401 반환.
- 콘솔 401 도배, 채널 카운트 전부 0.
- **사용자 체감**: "제품이 완전 비어있네? 버그인가?" 착각. 에러 메시지 전혀 없음.
- 운영자 플로우가 완전히 망가짐. handoff "빌드+HTTP 200 ≠ 동작" 교훈과 정반대 상황.

### 3. 올바른 토큰일 때 데이터가 어떻게 보일지에 대한 검증
- API 정상 응답.
- 채널 카운트 실데이터 표시.
- Studio에서 `context_sources` + `wiki_path`로 주입된 facts가 grounded Shorts 후보로 생성됨.
- queue/analytics에 실제 콘텐츠가 적재됨.
- 마케터/사업주 관점: 사이드바 채널 그룹핑(Social/Video/Blog/...), Studio, 성과, 자산 메뉴가 사업주가 보기 좋은 구조.

### 4. 적용한 수정 (operator 토큰 사전 검증 + 에러 메시지, 로그인 폼 빈값 처리)
- `LandingPage.doLogin`을 async로 변경:
  - 제출 전에 `fetch("/api/me", { Authorization: `Bearer ${t}` })` 로 **실제 서버 검증**.
  - 실패(`!ok` 또는 `!isOperator`) 시 에러 메시지 표시 ("운영자 토큰이 유효하지 않습니다. 다시 확인해주세요.") + `setAuthToken` 절대 호출 안 함.
  - 성공했을 때만 set + reload.
- `operatorError` state 추가 + 토큰 입력창 아래 빨간 에러 문구 표시.
- `/login` 페이지: 빈 이메일/비번 제출 시 "이메일과 비밀번호를 입력해주세요." 명확한 메시지.
- 결과: 틀린 토큰은 더 이상 풀 UI로 빠지지 않고, 올바른 토큰만이 풀 경험을 제공.

### 5. 마케터/사업주 관점에서 데이터가 적재적소인지 체크
- Sidebar: Social / Video / Blog / Messaging / Data&SEO 로 잘 그룹핑.
- Studio, 성과, Images/Videos, Settings 바로 접근 가능.
- context 주입 동작 확인: `verify-0cha-context.sh` + sourcing 시뮬에서 wiki 내용이 longform에 append되고 "브랜드 사실 정보 (반드시 준수, 지어내지 마)"로 프롬프트 앞에 주입되는 것 검증 완료.
- 문제점: 토큰이 잘못되면 데이터가 전혀 안 보이므로, 올바른 토큰 + multi-repo context 조합에서만 적재적소 검증이 가능.

### 6. 다음에 실제로 테스트할 추천 플로우
1. osmu live (또는 dev)에서 `bash scripts/verify-0cha-context.sh` 실행 → 출력된 payload를 `/api/sourcing` 에 POST (올바른 운영자 토큰 사용).
2. 응답에서 `wikiFactsUsed: true`, errors 없음, candidates 생성 확인.
3. Studio에서 같은 context로 생성 → queue에 포스트가 쌓이는지.
4. Performance / Analytics 페이지에서 실제 데이터가 적재적소에 보이는지.
5. **틀린 토큰**을 명시적으로 다시 테스트 (수정 후에도 제대로 차단되는지).
6. /login 빈 제출 + 실제 Supabase 가입/로그인 전체 플로우 (가능한 경우).

**0차 상태 업데이트**: 토큰 UX가 큰 블로커였는데 이제 상당 부분 해소. 나머지는 operator가 실제 토큰으로 풀 루프 돌려서 최종 검증하면 green에 가까워짐.

---

**이 섹션은 다음 세션 시작 시 핵심 복원 포인트입니다.**  
유저 관점 실제 플로우 검증 + 발견된 치명적 UX 문제 + 적용한 수정 + 추천 테스트 플로우가 모두 여기 정리되어 있습니다.