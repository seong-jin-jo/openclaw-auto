---
# pipeline-state.md — Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: ship            # plan|design|eng-design|build|qa|ship
approved_stages: [plan, design, eng-design, build, qa]   # ADOPTED(pre-harness) — 성숙·배포된 앱
approved_artifacts: { qa: docs/qa-tracker.md@2026-07-16 }
stages:
  plan:       { status: approved, artifacts_ok: true }   # README/feature-spec/USERFLOW 존재(ADOPTED)
  design:     { status: approved, artifacts_ok: true }   # ui-rules/channel-ui-spec(ADOPTED)
  eng-design: { status: approved, artifacts_ok: true }   # CLAUDE.md/wiki/architecture(ADOPTED)
  build:      { status: approved, artifacts_ok: true }   # dashboard/src(ADOPTED)
  qa:         { status: approved, artifacts_ok: true }   # 2026-07-16 운영 가입·승인·실생성 E2E까지 재검증
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
- [x] e2e-edge (vitest 540 pass/8 skip + 라이브 미승인 403·Google provider 400 안내 실측)

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
  Google provider enable·GA4 Measurement ID/DebugView·Slack webhook 실수신·custom SMTP 메일함 수신·
  Instagram/Threads 프로필/첫 게시물 실제 업로드가 남음. (artifact: docs/qa-tracker.md 2026-07-16 섹션)

## Blocked / Notes
- Google OAuth: Supabase Google provider가 disabled. Google OAuth client + Supabase provider enable 후 실왕복 필요.
- GA4: `OSMU_GA4_MEASUREMENT_ID` secret 없음. ID 주입·재배포·DebugView 실수신 필요.
- Slack: `OSMU_ALERT_SLACK_WEBHOOK_URL` secret 없음. webhook 주입 후 실제 ping/transition 수신 필요.
- SMTP: reset 요청과 DB 기록은 성공했으나 custom SMTP 및 메일함 실수신 확인 필요.
- Meta: 프로필 리네임/이미지 업로드/첫 draft 수동 발행은 계정 소유자 화면 작업 필요.
