---
# pipeline-state.md — Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: ship            # plan|design|eng-design|build|qa|ship
approved_stages: [plan, design, eng-design, build, qa]
approved_artifacts: {}
stages:
  plan:       { status: approved, artifacts_ok: true }   # README/feature-spec/USERFLOW 존재(ADOPTED)
  design:     { status: approved, artifacts_ok: true }   # ui-rules/channel-ui-spec(ADOPTED)
  eng-design: { status: approved, artifacts_ok: true }   # CLAUDE.md/wiki/architecture(ADOPTED)
  build:      { status: approved, artifacts_ok: true } # OAuth popup lifecycle + CI 재검증
  qa:         { status: approved, artifacts_ok: true }
  ship:       { status: in-progress, artifacts_ok: false }
override: false
override_reason: ""
override_expires: ""
---

# Pipeline State — openclaw-auto-osmu

> 2026-06-30 `init --adopt`. 이 레포는 이미 라이브 배포된 멀티테넌트 마케팅 SaaS라 plan~build는
> ADOPT(기존 인정). **현재 ship(in-progress).** 신규 기능(OAuth 연결, GA4, 가이드 등)은 build→qa→ship 게이트를
> `/approve`로만 통과한다. **배포(gh workflow / ship)는 `/approve qa` 후에만.** (과거 게이트 없는
> 자동 배포 = 하네스 위반, 재발 금지.)

## qa 단계 산출물/증거 (requires_evidence) — 상세 docs/qa-tracker.md
- [x] docs/qa-tracker.md (2026-07-16 운영 배포·직접 E2E 증거 갱신)
- [x] prod-health-200 (반복 실측 ✅)
- [x] prod-demo-login-200 (2026-07-16 운영 가입→로그인→active tenant 저장 직접 관찰)
- [ ] e2e-happy (가입→미승인 403→운영자 승인→shared Claude 실생성 200 ✅ / Google 최종 왕복·SNS 실발행은 사용자 동의/콘텐츠 승인 대기)
- [x] e2e-edge (vitest 563 pass/8 skip + 라이브 미승인 403·Google provider preflight 200·SNS credential 비노출 실측)

## 2026-07-16 Google-only auth build
- 이메일/비밀번호 가입·로그인·확인메일·재설정 UI/API 호출 제거. `/signup`은 `/login`으로 수렴.
- 랜딩·오류문구·배포 스모크·gstack E2E를 `Google로 계속` 단일 경로 계약으로 변경.
- 운영자 고객 API/UI의 `send_password_reset`·Supabase `/recover` 경로와 관측성 enum을 제거. 관리자 기능은
  계정 정지/재개와 공유 AI 승인/회수만 유지하며, 직접 API 호출도 400 unsupported로 거부한다.
- 기존 auth user 6명은 삭제하지 않음. 조회 결과 전원 현재 `email` provider only이며, 동일 이메일 Google
  첫 로그인 시 identity linking 및 tenant 보존을 운영에서 확인해야 함.
- 직접 검증: Google-only/operator focused 98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, build PASS(161 pages),
  local gstack E2E PASS(`/login`, `/signup` 307, storage clear, email/password controls absent), Google 계정 화면 이동.
- QA 게이트 재개: Supabase Email provider 비활성화, 실제 Google 계정→앱 복귀→기존 user/tenant 보존과 신규
  lead 저장 운영 E2E가 ship 잔여다. QA는 2026-07-16 사용자 `/approve qa`로 승인됨.

## 2026-07-16 SNS P0 ship 재배포
- 커밋 `8b1ca33f`, deploy run `29496623489` 성공. 발행 UI를 실제 `/api/publish` 지원 8채널로 제한하고
  Instagram/Threads 저장 토큰을 provider read-only API로 검증하도록 운영 반영.
- live API와 인증 브라우저에서 Instagram `Connected`, Threads `Live`, 비밀 필드 비노출, 미지원 7채널
  고객 UI 비노출을 직접 관찰. Health Monitor run `29497421714` success.
- QA 임시 tenant token은 revoke 후 401 확인. 공개 SNS 게시물은 회장 콘텐츠 승인 전 실행하지 않음.
- ship 잠금 유지: Google 계정 선택→앱 복귀/lead 저장, Threads 실발행 permalink, GA4 DebugView, Slack webhook 회전.

## 2026-07-17 사용자 실기기 SNS 연결 NG — ship 차단
- 사용자 실기기에서 Threads 타계정 세션 고착, Instagram OTP rate limit, X credential 누락 500/raw JSON,
  Facebook 앱 비활성, Bluesky `openclaw.json not found`, 영상 플랫폼 연결·발행 누락을 확인했다.
- 기존 `Connected/Live` 증거는 provider read-only `/me`와 렌더까지만 확인한 부분 증거다. 계정 전환→2FA→동의
  →callback→저장→실발행 전체 왕복을 보지 않았으므로 e2e-happy 충족으로 사용하지 않는다.
- ship은 계속 `in-progress`, `artifacts_ok:false`. 수정 범위 사용자 확인 후 `/pipeline reopen build`로 재오픈하고,
  provider별 실제 브라우저 E2E 및 공개/삭제 가능한 테스트 발행 증거를 다시 수집해야 한다.
- 상세 NG와 재발방지 매트릭스: `docs/qa-tracker.md`의 `2026-07-17 사용자 실기기 SNS 연결 QA`.
- 사용자 추가 지시로 SNS-007(사이트 내 provider 다중계정 목록·추가·기본 전환·개별 해제·선택 발행)을
  동일 build에 포함. 기존 단일계정 토큰 무손실 migration과 cross-tenant 차단 E2E가 build 종료조건이다.

## 2026-07-17 SNS-007 다중계정 build candidate
- additive `channel_accounts`와 기본계정 legacy mirror, 계정 목록/기본전환/삭제 API·UI, Studio/예약/YouTube
  선택 발행을 구현했다. 최초 동시 OAuth callback은 provider 단위 advisory lock으로 직렬화한다.
- refresh token은 `refresh_enc`에만 암호화 저장하며 callback/meta 평문 기록을 금지했다. 예약 생성 시 선택
  계정의 tenant/provider/status를 검증하고, 명시 계정이 유효하지 않으면 기본계정으로 fallback하지 않는다.
- 자동 증거: `npm test` 72 files/630 pass·8 DB-env skip, `npx tsc --noEmit` PASS, production build 160 pages PASS,
  `git diff --check` PASS. 자동 테스트를 로컬 E2E로 승격하지 않는다.
- build 승인 전 미검증: production schema 적용, 실제 provider 2계정 OAuth 왕복, 기본전환 UI 직접 관찰,
  선택계정별 공개 테스트 발행 permalink/YouTube Shorts URL. `/approve build` 후 QA·배포 게이트로 이동한다.

## 2026-07-17 SNS-007 QA 진행
- build 승인을 반영해 QA로 전환했다. 실제 `upsertChannelAccount` 두 호출의 최초 연결 경쟁을 재현하는
  PostgreSQL 통합 테스트를 추가했다. 로컬은 DB 부재로 해당 1건 skip, 전체 73 files/630 pass/9 skip,
  `tsc --noEmit` PASS, production build 160 pages PASS다.
- QA 자동 종료 조건: GitHub CI PostgreSQL에서 신규 동시성 테스트가 skip 없이 실행되어 2계정 저장과
  provider 기본계정 정확히 1개를 관찰할 것. 운영 OAuth·실발행은 CI로 검증되지 않으므로 별도 미검증이다.
- 실제 DB 증거: GitHub Actions run `29572377311`(commit `592c4741`) SUCCESS. PostgreSQL 16에
  schema→seed→RLS 적용 후 73 files/626 pass/0 skip. 신규 동시성 테스트가 314ms에 실제 실행되어
  병렬 최초 callback 2건 저장과 기본계정 1개를 확인했다. 운영 OAuth·실발행 미검증은 유지한다.

## 최근 build (qa 대기 중 — ship 전 /approve qa 필요)
- 셀프서브 코어: A1 증류 generateText 통일, A2 온보딩 위저드, A3 키검증, /api/health+autoheal+슬랙경보,
  성과 ConnectGate, 가입 confirm 탭.
- **소셜 OAuth '연결' 3종(IG·Threads·Facebook)**: `lib/social-connect`(provider config+토큰교환, FB는 페이지토큰),
  `api/connect/[provider]`(auth-url)+callback(per-tenant integrations 저장), `SocialConnectButton`+ChannelPage 배선.
- **setup-guides 재작성**: IG·Threads·FB를 "연결 버튼 먼저, 수동은 고급"으로.
- 검증: vitest 146 pass/8 skip(connect E2E 7 IG/Threads/FB 포함), tsc 0, build ✓. **라이브 미검증.**
- ⚠️ 일부(health·연결 초기버전)는 게이트 전 prod 배포됨. 연결 3종·가이드는 **미배포(게이트 준수, /approve qa 후)**.
- **라이브 qa 선행조건(사용자 액션)**: 배포 env `IG_APP_ID/SECRET`·`THREADS_APP_ID/SECRET`·`FB_APP_ID/SECRET` +
  Meta 앱 redirect URI `https://<live>/api/connect/{provider}/callback` 등록. 그 후 배포→browse로 qa 증거.

## 승인 로그 (append-only)
2026-07-18 — qa APPROVED — 직전 보고에서 QA 승인 추천, 승인 시 OSMU 단독 배포·실 Chrome E2E,
  미승인 시 운영 popup 결함 유지라는 결과를 제시했고 사용자가 `진행`으로 응답해 QA 진행 의사를 확인.
  독립 qa-verifier blocker/high 0, RUBRIC 23/25, QA Skill 1회, WebSearch/Fetch 3회,
  verify-agent-quality PASS. commit `e66e6f76`, CI run `29608715956` SUCCESS. ship으로 전환하되
  Facebook/YouTube popup target과 provider host를 직접 관찰하기 전 ship 완료 금지.
2026-07-18 — build APPROVED — 직전 보고에서 `/approve build` 추천, 승인 시 QA 재검증, 미승인 시
  운영 popup 결함 유지라는 결과를 평문으로 제시했고 사용자가 `진행`으로 응답해 build 진행 의사를 명확히
  확인. 증거: commit `e66e6f76`, focused 10 PASS, full 74 files/644 PASS·9 DB-env skip, tsc clean,
  production build 160 pages PASS, GitHub CI run `29608715956` typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test SUCCESS. QA 단계로 전환하며 QA 승인 전 운영 배포 금지.
2026-07-18 — build REOPENED FROM SHIP — 운영 headless Chrome에서 X readiness 안내는 통과했으나
  Facebook OAuth 버튼 클릭 후 새 target이 생성되지 않았다. 공통 `SocialConnectButton`이 auth URL fetch를
  await한 뒤 `window.open()`을 호출해 브라우저 사용자 제스처를 잃는 popup-blocker 구조임을 코드와 운영
  브라우저로 확인. Instagram/Threads/Facebook/YouTube 공통 영향이므로 synchronous blank popup→URL 이동
  hotfix, 회귀 테스트, CI, build/qa 재승인, 재배포 전 ship 완료 금지.
2026-07-17 — hotfix build+qa APPROVED — 운영 Chrome에서 발견한 tenant account API 403의 교정 범위만
  재검증. commit `15b09a2c`, GitHub Actions run `29598660707`에서 typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test 전부 성공. 로컬 focused proxy test 39 PASS, full 73 files/634 PASS/9
  DB-env skip, production build 160 pages PASS. 사용자가 `QA승인`을 명시했으므로 QA 승인으로 반영하고,
  기존 승인 build 범위의 회귀 핫픽스 증거도 함께 재고정해 ship으로 전환. 운영 재배포 후 동일 고객 토큰
  Chrome E2E가 통과하기 전 ship 완료 금지. 외부 provider 2계정 OAuth·실발행은 계속 미검증.
2026-07-17 — build REOPENED FROM SHIP — 운영 Chrome E2E에서 신규 `/api/channels/{provider}/accounts*`
  3개 경로가 proxy tenant-aware allowlist에 없어 실제 고객 osmu/JWT가 403 `이 API는 운영자 전용입니다`를
  받는 결함을 직접 관찰. hotfix→CI→build/qa 재승인→재배포 전 ship 완료 금지.
2026-07-17 — qa APPROVED — 사용자 명시 입력 `QA승인`. 재검증 증거: GitHub Actions run `29572377311`
  PostgreSQL 16 schema→seed→RLS 적용 성공, 73 files/626 PASS/0 skip, SNS-007 최초 동시 callback 2건과
  기본계정 1개 실 DB 관찰. 운영 OAuth·브라우저 계정전환·실발행은 ship 단계 미검증으로 유지.
2026-07-17 — build APPROVED — 사용자 명시 입력 `승인하다고 /approved build`. 명령 오타와 무관하게
  build 승인 의사가 명확하므로 승인으로 처리. 재검증 증거: commit `98896f30`, full 72 files/630 PASS/8
  DB-env skip, `tsc --noEmit` PASS, production build 160 pages PASS, `git diff --check` PASS. QA 단계로 전환.
2026-07-17 — build REOPENED — 사용자 명시 지시 `진행해서 싹 되게해`. SNS-001~006 사용자 실기기
  결함을 수정하기 위해 ship에서 build로 재오픈. 코드 수정→로컬 E2E→실브라우저 운영 QA 후 build/qa 재승인 필요.
2026-07-16 — qa APPROVED — 사용자 명시 입력 `/approve qa`. 재검증 증거: Google-only/operator focused
  98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, production build 161 pages PASS, local gstack Google-only
  E2E PASS. 운영 배포 후 Google 실왕복·SNS 연결/발행·lead 저장은 ship 단계 직접 관찰 대상으로 유지.
2026-06-30 — ADOPTED(pre-harness) — plan·design·eng-design·build 기존 산출물 인정, current=qa.
2026-07-03 — HOTFIX 배포(게이트 예외) — 이미 라이브인 IG 연결의 "Invalid redirect_uri"(프록시 뒤
  origin=0.0.0.0 실측) 수정. 신규 스코프 아님·라이브 깨짐 복구. 커밋 e8603547, run 28611637538,
  라이브 redirect_uri 정상 검증. vitest 9 pass·tsc0. qa 게이트는 유지(IG 로그인→실발행 E2E 후 /approve qa).
2026-07-10 04:51 KST — qa APPROVED — 회장 승인 계획(fable-purrfect-bumblebee.md, Phase 1) 기반.
  증거 재검증: prod-health-200 ✅(당일 재실측 {ok,db:up}) · e2e-edge ✅(vitest+라이브 에러분기 실측) ·
  prod-demo-login-200 🟡(운영자 /api/me 200 실측, 고객가입은 Email Confirm 외부설정 대기) ·
  e2e-happy 🟡(vitest 190 PASS + 라이브 생성 성공 실측, 실발행은 라이브 채널 OAuth 대기).
  🟡 2건은 이번 배포 없이는 수집 불가(라이브 로그인 UX 수정 자체가 배포 대상)라 배포 후 Phase 2/4에서
  수집 의무 — **ship 게이트는 라이브 증거(비번찾기·preflight·Google 실로그인·실발행 관찰) 완성 전 잠금 유지**.
  당일 배포 전 재검증: vitest 37f/190 PASS·build PASS·verify-e2e PASS(port 3459)·커밋 위생 7커밋 런치트랙만.
  (artifacts: docs/qa-tracker.md 2026-07-10 04:45 섹션)
2026-07-16 03:22 KST — ship 후보 운영 배포(run `29422450258`, head `b361d951`) 성공.
  직접 증거: health 200/DB up, live browser public E2E PASS, 합성 QA 가입자 auth user+active tenant 저장,
  shared AI 미승인 403→operator 승인시각 저장→실제 `claude -p` 생성 200, password recovery 요청시각 저장,
  Health Monitor run `29438972593` HTTP 200/up 상태 캐시 저장. **ship 완료/`v1.0.0` 태그는 잠금 유지**:
  Google 계정 최종 OAuth 왕복·GA4 DebugView 수신·custom SMTP 메일함 수신·Instagram/Threads 프로필/첫
  게시물 실제 확인이 남음. (artifact: docs/qa-tracker.md 2026-07-16 섹션)
2026-07-16 06:31 KST — Google/GA4/Slack 외부 설정 반영.
  Google preflight 200 및 실제 accounts.google.com 로그인 화면 이동 관찰. GA4/Slack GitHub secrets 저장 후
  deploy run `29452057807` success. 운영 브라우저에서 동의 전 GA script 없음, 동의 후 G-MEEQ2D8C1J script
  200 + consent update + page_view 적재 관찰. Slack webhook 실제 POST `ok` 관찰. Google 계정 입력 후 앱 복귀,
  GA4 DebugView 수신은 미검증. 첫 deploy run `29451844552`는 잘못된 service 입력 `osmu`로 실패했고 실제
  service `openclaw-dashboard-osmu`로 재실행해 시정.

## Blocked / Notes
- SNS-008 운영 Chrome 부분 통과: OSMU 단독 deploy run `29639946525` SUCCESS. 단기 고객 토큰을 넣은
  분리 Chrome에서 X credential 누락 비활성 안내, Facebook mode 경고, Facebook 클릭 후 새 target의
  `www.facebook.com` 이동, YouTube 클릭 후 새 target의 `accounts.google.com` 이동, TikTok/Reels 미구현
  표시를 직접 관찰했다. 증거 `docs/evidence/sns008-live-oauth-popup-e2e-20260718.png`. 토큰 revoke 후
  동일 readiness API HTTP 401과 원문 삭제 확인. popup activation 결함은 운영에서 교정됐지만 provider
  로그인·동의·callback/DB 저장·실 2계정 전환·공개 발행은 미검증이므로 ship/artifacts는 잠금 유지.
- SNS-008 독립 QA 최종 PASS: qa-verifier가 standards/dev.md, QA Skill, MDN, source/callback/test/CI를
  read-only 재검증. focused 10 PASS + 관련 callback tests, full 74 files/644 PASS·9 local DB skip,
  tsc/build/CI SUCCESS를 대조했고 blocker/high 0건, RUBRIC 23/25. `verify-agent-quality.sh`는 Skill 1회,
  WebSearch/Fetch 3회, 소크라/레드팀 3개를 확인해 PASS. 첫 2회 위임은 각각 표준 Read/QA Skill 누락으로
  반려되어 승인 근거에서 제외. 운영 Chrome post-fix popup target은 QA 승인·재배포 전 미검증.
- SNS-008 OAuth popup activation build candidate commit `e66e6f76`. 운영 Chrome에서 기존 구현의 Facebook
  popup target 0개를 직접 관찰해 build 재오픈. synchronous blank popup 예약, failure/callback/unmount/
  pending-fetch/React StrictMode 생명주기를 컴포넌트 테스트 10건으로 고정했다. 메인세션 focused 10 PASS,
  full 74 files/644 PASS·9 DB-env skip, tsc/build(160 pages) PASS. GitHub CI run `29608715956`은 Node 설치,
  typecheck/build, PostgreSQL 16 schema→seed→RLS, full test 전부 SUCCESS. build 승인 후 QA 재배포 전에는
  Facebook/YouTube popup target 생성이 미검증. readiness QA token은 revoke 후 HTTP 401 및 원문 삭제.
- SNS-007 tenant proxy 핫픽스 운영 배포 run `29600031321` SUCCESS. 고객 `osmu_` 토큰을 넣은 실제 Chrome에서
  Instagram/Threads AccountManager의 계정 1개·외부 ID·기본·정상·삭제 컨트롤을 직접 관찰했다. QA 토큰은
  revoke 후 동일 account API HTTP 401 확인 및 원문 삭제. ship은 계속 잠금: 실제 provider 2계정 OAuth,
  기본 전환, 계정별 공개 발행 permalink/Shorts URL은 미검증.
- SNS P0 QA remediation(2026-07-16): UI를 직접 발행 8채널로 정렬하고 Instagram/Threads provider live validation 및 재연결 상태를 구현. focused 75 PASS, full 563 PASS/8 skip, tsc/build PASS. 운영 재배포 후 code190 상태 직접 관찰 필요.
- Google OAuth: Google-only 코드 운영 배포(run 29485147720), provider 활성화·Google 로그인 화면 이동 관찰. 계정 입력→앱 복귀 실왕복 필요.
- Email auth: Google-only 정책 강제를 위해 Supabase Email provider 비활성화 필요. 기존 6 users는 삭제 금지.
- GA4: ID 주입·재배포·동의 기반 script/page_view 적재 관찰. GA4 DebugView 실수신 필요.
- Slack: webhook secret 주입 및 실제 ping `ok` 관찰. 채팅에 노출된 webhook은 출시 전 회전 필요.
- SMTP: Google-only 정책 확정으로 도입하지 않음. 비밀번호 재설정 경로 폐기.
- Meta: 회장 보고상 Instagram 계정 생성. 프로필 URL/리네임/이미지/첫 draft 및 Threads는 미검증.
