---
# pipeline-state.md — Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: ship            # plan|design|eng-design|build|qa|ship
approved_stages: [plan, design, eng-design, build, qa]   # 2026-07-16 사용자 /approve qa
approved_artifacts: { qa: docs/qa-tracker.md@2026-07-16 }
stages:
  plan:       { status: approved, artifacts_ok: true }   # README/feature-spec/USERFLOW 존재(ADOPTED)
  design:     { status: approved, artifacts_ok: true }   # ui-rules/channel-ui-spec(ADOPTED)
  eng-design: { status: approved, artifacts_ok: true }   # CLAUDE.md/wiki/architecture(ADOPTED)
  build:      { status: approved, artifacts_ok: true }   # dashboard/src(ADOPTED)
  qa:         { status: approved, artifacts_ok: true }   # 2026-07-16 사용자 /approve qa
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
- [ ] e2e-happy (가입→미승인 403→운영자 승인→shared Claude 실생성 200 ✅ / Google 실로그인·SNS 실발행은 외부설정 대기)
- [x] e2e-edge (vitest 548 pass/8 skip + 라이브 미승인 403·Google provider preflight 200 실측)

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
  lead 저장 운영 E2E 후 `/approve qa` 필요.

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
- Google OAuth: provider 활성화·Google 로그인 화면 이동 관찰. Google-only 코드 운영 미배포, 계정 입력→앱 복귀 실왕복 필요.
- Email auth: Google-only 정책 강제를 위해 Supabase Email provider 비활성화 필요. 기존 6 users는 삭제 금지.
- GA4: ID 주입·재배포·동의 기반 script/page_view 적재 관찰. GA4 DebugView 실수신 필요.
- Slack: webhook secret 주입 및 실제 ping `ok` 관찰. 채팅에 노출된 webhook은 출시 전 회전 필요.
- SMTP: Google-only 정책 확정으로 도입하지 않음. 비밀번호 재설정 경로 폐기.
- Meta: 회장 보고상 Instagram 계정 생성. 프로필 URL/리네임/이미지/첫 draft 및 Threads는 미검증.
