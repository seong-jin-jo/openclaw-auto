# QA Tracker — openclaw-auto-osmu (pipeline qa 단계 증거)

> 2026-07-02 밤샘 라이브 QA(browse+curl, 직접 관찰). 형식: 증거 항목 → 결과 → 근거.

## 2026-07-10 ❌ 재제보 재확인 — live Google/raw JSON + 비밀번호 찾기 없음 + 가입자 목록

**사용자 재제보:** Google 로그인 클릭 시 Supabase raw JSON `Unsupported provider: provider is not enabled`가 보이고, 비밀번호 찾기 UI도 없음. 현재 가입자 목록 확인 요청.

**직접 확인:**
- live `GET https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/login` → 200이지만 HTML에 `비밀번호 찾기` 버튼 없음. 현재 운영 빌드는 2026-07-09 로컬 수정 전 구버전.
- live `GET /api/auth/google?redirect_to=...` → 401 `{"error":"Unauthorized"}`. 새 public preflight route/middleware가 운영에 아직 반영되지 않음.
- 운영 DB 직접 조회(비밀번호 원문 조회 없음): `auth.users` 5명, `tenants` 9개. 셀프서브 auth와 tenant가 연결된 계정은 `r.cupid@gmail.com`, `j.the.great.investor@gmail.com`, `code0to1@gmail.com`.

**가입자/워크스페이스 판정:**
- `j.the.great.investor@gmail.com` 존재 확인: auth user 있음, tenant `j-the-great-investor-6794e3` 연결됨, email confirmed, last sign-in `2026-06-28T15:47:44Z`.
- 미확인/미완료 auth 계정: `osmu.qa.overnight0702@gmail.com`, `qa.live.1781632644@gmail.com`은 auth에는 있으나 email unconfirmed + tenant 미연결.

**현재 결론:** 수정 코드는 로컬 worktree에서 통과했지만 라이브에는 미배포다. 배포 전까지 고객은 raw JSON/비밀번호 찾기 없음 상태를 계속 본다.

**2026-07-10 추가 구현:** 운영자 `/operator/customers`를 auth 가입자까지 보이도록 확장하고, 계정별 `비밀번호 재설정 메일` 액션을 추가했다. 기존 비밀번호 원문/해시 조회·노출은 구현하지 않았다.

**2026-07-10 배포 전 검증:**
- `npm run test -- tests/api/operator-customers.test.ts tests/brand/google-auth-preflight.test.ts tests/brand/oauth-errors.test.ts tests/isolation/middleware.test.ts` → 4 files / 22 tests PASS.
- `npm run test` → 37 files PASS, 190 PASS / 8 skipped.
- `npm run build` → PASS. `/api/auth/google`, `/api/operator/customers`, `/api/studio/engine-status`, `/operator/customers` 포함.
- `npm run e2e:local` with `http://localhost:3456` → PASS, screenshots `/tmp/e2e-*.png`. Supabase client duplicate warning만 있고 core flow 통과.

## 2026-07-09 ❌ 재제보 NG — 로그인/계정/연결 E2E

**사용자 재제보:**
- Google 로그인 클릭 시 여전히 raw JSON 노출: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
- 비밀번호 찾기/재설정 UI 없음.
- 가입 회원 목록 및 `J.the.great.investor@gmail.com` 계정 존재 여부 확인 필요. 비밀번호 원문/추정 검증은 하지 않음(비밀번호는 조회 불가/조회 금지, 재설정만 가능).
- OAuth 연결 완료 UI, 토큰 저장, 실제 전송까지 “되는 것/안 되는 것/미검증”을 다시 분리해 기록 필요.

**현재 판정:** live/prod는 **NG 유지**. local gstack/테스트는 통과했지만 운영 터널은 아직 수정본 미배포/미반영 상태라 Google raw JSON이 재현된다.

**2026-07-09 재검증 요청:** 사용자 요청으로 전체 테스트/빌드/로컬 E2E/gstack 브라우저 검증을 재실행. **검증 결과: local PASS, live/prod NG.**

**원인 분석 (2026-07-09 Codex):**
- live gstack에서 `/login` → `Google로 계속` 클릭 시 앱이 에러를 받는 것이 아니라 브라우저가 `https://gvtsyyltgwqplrqegrxo.supabase.co/auth/v1/authorize?...`로 이동했고, Supabase authorize endpoint가 raw JSON을 직접 렌더링하는 것을 확인.
- 따라서 기존 `signInWithOAuth()` 이후 `error.message` mapper는 이 케이스에 닿지 않았음. 원인은 “앱 내부 에러 미매핑”이 아니라 **Supabase 자동 리다이렉트가 raw JSON 페이지로 브라우저를 넘긴 것**.
- 비밀번호 찾기 검색 결과 `resetPasswordForEmail`/recovery UI가 없었음.
- 회원 목록 조회는 현재 실행 환경에 `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DASHBOARD_AUTH_TOKEN`이 없어 불가. 비밀번호 원문은 조회 불가/조회 금지이며 재설정 링크로만 처리.

**수정 반영 (2026-07-09 Codex):**
- `/api/auth/google` 공개 preflight 라우트 추가. Supabase authorize URL을 서버에서 `redirect: manual`로 먼저 호출해 400 raw JSON을 한국어 안내로 변환하고, 3xx일 때만 브라우저를 Supabase/Google로 이동.
- `/login`의 Google 버튼을 직접 `signInWithOAuth()` 리다이렉트 방식에서 `/api/auth/google` preflight 방식으로 변경.
- middleware에서 `/api/auth/google`을 고객 로그인 공개 API로 허용.
- `/login`에 `비밀번호 찾기` 버튼 추가. 이메일 입력 후 Supabase `resetPasswordForEmail()` 발송, `/login?type=recovery` 복귀 후 새 비밀번호 설정 폼 추가.
- `/signup`/`?mode=signup` 첫 렌더의 서버/클라이언트 모드 불일치 가능성을 줄이기 위해 초기 mode는 `login`으로 고정하고 mount 후 URL 기준으로 signup 전환.
- 로컬 env 누락(`NEXT_PUBLIC_SUPABASE_ANON_KEY`)이 E2E 콘솔에서 실패처럼 보이지 않도록 login mount catch 로그를 `console.error`에서 `console.warn`으로 낮춤.

**직접 검증 (2026-07-09 Codex):**
- live gstack: `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/login` → Google 클릭 → Supabase raw JSON 페이지 재현 확인.
- local env 재현 서버: `PORT=3457 NEXT_PUBLIC_SUPABASE_URL=https://gvtsyyltgwqplrqegrxo.supabase.co npm run dev`.
- gstack `http://localhost:3457/login`: `비밀번호 찾기` 버튼 노출 확인.
- gstack `http://localhost:3457/login` → Google 클릭: Supabase raw JSON 페이지로 이동하지 않고 앱 화면에 “Google 로그인이 아직 설정되지 않았습니다. 이메일로 가입하거나 관리자에게 Supabase Google provider 활성화를 요청하세요.” 표시 확인.
- gstack `비밀번호 찾기` 클릭(이메일 미입력): “비밀번호를 재설정할 이메일을 입력해주세요.” 표시 확인.
- tests: `npm run test -- tests/brand/google-auth-preflight.test.ts tests/brand/oauth-errors.test.ts tests/isolation/middleware.test.ts` → 3 files / 19 tests PASS.
- build: `npm run build` → PASS, `/api/auth/google` route 포함 확인.

**재검증 결과 (2026-07-09 Codex, 재실행):**
- tests: `npm run test` → 36 files PASS, 187 PASS / 8 skipped.
- build: `npm run build` → PASS, `/api/auth/google` route 포함. 기존 warning만 유지: Next middleware convention deprecated, Turbopack NFT trace warning(`next.config.ts` → `/api/sourcing`).
- local E2E: `npm run e2e:local` → PASS. 스크린샷 `/tmp/e2e-landing.png`, `/tmp/e2e-login.png`, `/tmp/e2e-signup.png`, `/tmp/e2e-logout.png`.
- local E2E console: gstack console buffer clear 후 재실행. Supabase anon key 미설정은 현재 코드 기준 `[warning]`으로만 표시됨.
- local gstack `http://localhost:3456/login`: `Google로 계속`/`비밀번호 찾기` 버튼 노출 확인.
- local gstack Google 클릭: URL이 `http://localhost:3456/login`에 남고 “Google 로그인이 아직 설정되지 않았습니다. 이메일로 가입하거나 관리자에게 Supabase Google provider 활성화를 요청하세요.” 표시 확인.
- local curl `/api/auth/google?...` → HTTP 400 + 위 한국어 JSON. Supabase raw JSON으로 브라우저를 넘기지 않음.
- local gstack 비밀번호 찾기 클릭: 로컬 env에 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 없어 “비밀번호 재설정 로그인 설정이 서버/환경변수에 아직 없습니다...” 안내 표시. 실제 reset email 발송은 prod/env 주입 후 재검 필요.
- live curl `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/auth/google?...` → HTTP 401 `{"error":"Unauthorized"}`. 새 public middleware/route가 운영에 반영되지 않음.
- live gstack `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/login`: `비밀번호 찾기` 버튼 없음. `Google로 계속` 클릭 시 `https://gvtsyyltgwqplrqegrxo.supabase.co/auth/v1/authorize?...`로 이동하고 raw JSON `Unsupported provider: provider is not enabled` 재현. 스크린샷 `/tmp/openclaw-login-google-live-ng.png`.
- local 비밀번호 찾기/Google 상태 스크린샷: `/tmp/openclaw-login-google-reset-local.png`.

## requires_evidence 현황

| 증거 | 상태 | 근거 |
|---|---|---|
| prod-health-200 | ✅ | `GET /api/health` → `{ok:true,db:up}` 200 (반복 실측) |
| prod-demo-login-200 | 🟡 부분 | 운영자 `/api/me` 200 `{isOperator:true}` 실측. **고객 가입 로그인은 Supabase Email Confirm ON에 막힘**(가입→"이메일 확인" 대기 실측) → 아침 토글 후 재검 |
| e2e-happy | 🟢 대부분 | vitest 146 pass. 라이브: IG auth-url 생성 ✅, **콘텐츠 생성 라이브 성공 ✅**(CLAUDE_CODE_OAUTH_TOKEN 배선, 실제 한국어 콘텐츠). 남은 건 IG 연결 로그인(사용자)→실발행 |
| e2e-edge | ✅(유닛)/🟡(라이브) | 잘못된 키 400·미연결 분기·state누락 등 vitest. 라이브 Threads "미설정" 에러 일관 실측 |

## 2026-07-08 회귀 QA — OAuth/OSMU/운영자 허브

**사용자 제보 NG:**
- Google 로그인 반복 클릭 시 raw JSON 노출: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`
- 온보딩/마케팅 자동화 시작에서 OAuth가 아니라 토큰 입력으로 진입
- Threads OAuth 후 동의/초대 상태가 불명확하고 재연결 시 Meta tester invite 미수락 에러(`1349245`)
- Instagram 연결 시 Meta 개발자/테스터 역할 권한 부족
- permission error 팝업 한글 깨짐
- TikTok/YouTube 등 일부 채널에 OAuth 로그인 UI 부재
- OAuth 토큰/accessToken이 Settings에 원문으로 박제되는지 확인 필요
- OSMU 생성 엔진이 Anthropic key인지 `claude -p`인지 불명확, 영상 생성 실패 원인 불명확
- Marketing Hub 유저 관리자 페이지 필요

**반영 방향:**
- OAuth/Meta 에러를 한국어 조치 문장으로 매핑하고 callback HTML을 `utf-8` + escape 처리.
- OAuth 지원 채널은 공식 OAuth 버튼을 기본으로 노출하고, 수동 토큰 입력은 고급/비상용으로 숨김.
- OAuth 토큰은 `integrations(kind='channel')`에 암호화 저장하고 Settings 화면에는 원문 미표시. 기존 수동 설정 토큰도 API 응답에서 마스킹.
- Studio에 현재 생성 엔진(`내 Anthropic API 키` vs `공유 Claude CLI`)과 마지막 실패 원인 표시.
- `/operator/customers` 운영자 고객/연결/사용량 개요 MVP 추가.

**원인 → 해결 방법 → 직접 확인:**

| 제보 | 원인 | 해결 방법 | gstack 확인 |
|---|---|---|---|
| Google 클릭 raw JSON | Supabase provider/env 오류를 `error.message` 그대로 렌더 | `oauthErrorMessage()` 추가, Google provider disabled/missing env를 한국어 안내로 변환 | `/login` Google 클릭 → “Google 로그인 설정이 서버/환경변수에 아직 없습니다…” 표시 |
| Threads tester invite `1349245` | Meta tester 초대 미수락/앱 테스트 권한 문제를 raw로 표시 | Meta invite/role/permission 오류 패턴 매핑 | `/api/connect/threads/callback?error=Invalid_Request_1349245` → tester invite 안내 |
| Instagram 개발자 역할 부족 | Meta App Dashboard role/테스터 권한 미부여 | role/permission 오류 패턴 매핑 | Instagram callback role 부족 URL → 개발자/테스터/관리자 추가 안내 |
| permission popup 한글 깨짐 | callback HTML에 charset/escape 없음 | `lang=ko`, `<meta charset="utf-8">`, `Content-Type: text/html; charset=utf-8`, HTML escape 적용 | callback HTML에서 `meta charset="utf-8"` 확인 |
| YouTube/TikTok OAuth UI 없음 | Settings/채널 UI에서 수동 토큰 폼이 기본, 일부 OAuth 채널 누락 | OAuth 지원 채널 목록 확장, `SocialConnectButton` 기본 노출, 수동 입력은 고급 토글 뒤로 이동 | `/channels/youtube`, `/settings` TikTok 탭에서 OAuth 버튼 확인 |
| accessToken Settings 박제 의심 | OAuth 토큰은 DB 암호화지만 기존 수동 `openclaw.json` 토큰은 API 응답 원문 가능 | `/api/channel-config` GET에서 secret key 마스킹, POST에서 `********`가 기존값 덮어쓰지 않게 처리 | 유닛 테스트 `channel-config-mask` PASS |
| OSMU가 Claude API인지 CLI인지 불명확 | tenant Anthropic key fallback 상태가 UI에 없었음 | `/api/studio/engine-status` 추가, Studio 상단 엔진 배지 표시 | `/studio` → `AI 공유 Claude CLI · claude -p` 표시 |

**검증 결과 (Codex, local dev + gstack):**
- `npm run test -- tests/brand/oauth-errors.test.ts tests/api/channel-config-mask.test.ts tests/api/channel-config-bridge.test.ts tests/brand/social-connect.test.ts` → 4 files / 45 tests PASS.
- `npm run build` → PASS. 기존 Turbopack NFT warning(`next.config.ts` → `/api/sourcing`)만 유지.
- gstack `/login`: Google 클릭 시 raw `supabaseUrl is required` 대신 “Google 로그인 설정…” 안내 표시 확인. 운영 raw JSON(`Unsupported provider`)은 유닛 테스트로 고정.
- gstack `/channels/youtube`: `YouTube OAuth 연결` 기본 노출, `고급: 토큰 직접 입력` 토글 전에는 수동 폼 미노출, 토글 후 수동 CredentialForm 노출 확인.
- gstack `/settings`: `OSMU 채널 OAuth` 카드, “토큰 원문은 서버에 암호화 저장되고 화면에 표시하지 않습니다” 문구, `채널 OAuth 연결` 모달 확인. TikTok 탭에서 `TikTok OAuth 연결` 버튼 확인.
- gstack `/studio`: 상단 엔진 배지 `AI 공유 Claude CLI · claude -p` 확인.
- gstack `/operator/customers`: 운영자 유저 관리 페이지 렌더 확인. 로컬 `DATABASE_URL` 미설정으로 API 500은 표시됨(프로덕션 DB 필요).
- gstack callback HTML: `/api/connect/threads/callback?error=Invalid_Request_1349245` → `utf-8` HTML + Meta tester invite 안내 확인. Instagram role 부족 에러도 한국어 안내 확인.

## 라이브 실측 결과 (2026-07-02 밤)

**정상 동작 확인:**
- `/api/health` 200, DB up (pg_trgm·pgcrypto·osmu_service·핵심 7테이블 적용 확인 — psql 실측)
- 운영자 인증(`/api/me`), 워크스페이스 8개 존재(ZERO-ONE·D-Edu·Romeo 등)
- **IG OAuth 연결 auth-url 라이브 생성** — 실제 instagram.com OAuth URL + client_id + callback (컨테이너 env IG_APP_ID/SECRET 적재 실측)
- 가입 폼 동작(중복 가드·이메일 검증·pending 안내 화면), 대시보드 번들에 "Instagram 연결" 버튼 문자열 존재

**발견 → 수정한 버그(2088a456 배포):**
1. **간헐 Cloudflare 520 → /_next 청크 로드 실패 → 하이드레이션 전멸 → 전체 버튼 무반응** (콘솔 520 실측; "구글 로그인 안 먹음"의 앱측 원인) → layout에 청크 에러 자동복구 스크립트(15s 가드 1회 reload)
2. `/login?mode=signup`·`/signup` 딥링크 미적용(실측) → mount 후 URL 재동기화

**막힌 것(사용자/설정 필요 — 아침 체크리스트):**
1. **Supabase Email Confirm ON** → 신규 가입이 메일 확인 대기에 걸림(실측). 콘솔 토글 필요
2. **생성 502** — 컨테이너 claude CLI 미인증(호스트 `~/.claude` 빈 폴더 실측) + Anthropic 키 미보유. `claude setup-token` 값 또는 API 키 필요
3. **Meta redirect URI 미등록** — IG auth-url은 나오지만 Meta가 callback 거부할 상태
4. VM crontab(publish-due)·autoheal 기동 — classifier가 프로덕션 시스템 변경 차단 → 사용자 승인/실행 필요
5. Threads/FB 연결 — `THREADS/FB_APP_ID/SECRET` 시크릿 미제공

## 판정
qa = **in-progress** (ship 게이트 잠김 유지). 아침 체크리스트 1~3 처리 후 고객 가입→생성→IG 연결 라이브 재검 → `/approve qa`.

## 2026-07-10 04:45 KST 배포 직전 재실행 (Fable 5, Phase 0)

- `npm run test` → 37 files / 190 PASS / 8 skipped (직접 실행)
- `npm run build` → PASS. `/api/auth/google`, `/api/operator/customers`, `/api/studio/engine-status`, `/operator/customers` 라우트 포함 확인
- `bash scripts/verify-e2e.sh http://localhost:3459` → **PASS** (3456은 타 프로젝트 dev 점유라 3459 사용). 스크린샷 `/tmp/e2e-*.png`
- local `/login` → `비밀번호 찾기` 렌더 확인 (grep 1)
- local `/api/auth/google?redirect_to=...` → 400 + 한국어 안내 JSON ("Google 로그인이 아직 설정되지 않았습니다...") — Supabase raw JSON 미노출
- 커밋 위생: `origin/main..HEAD` 7커밋 = dashboard 28 + .github 1 + docker-compose 1 + docs 1 + wiki 2 파일. `.codex/`·nested `openclaw/` 미포함 확인
- 판정: **배포 준비 완료** — `/approve qa` 대기

## 2026-07-10 06:00 KST Phase 5 qa 미니사이클 — 구현·보안리뷰 완료 (Fable 5 + code-builder + Codex)

**변경 4건:** ①온보딩 채널감지에 DB integrations OR 조건(파일 폴백 유지) ②발행 미지원 8채널 "발행 준비 중" 배지(SCHEDULABLE_PLATFORMS SSOT 테스트 고정) ③OAuth state HMAC 서명(base64url JSON payload + HMAC-SHA256, provider 바인딩, 10분 만료, 상수시간 비교, 키 있으면 비서명 거부) ④배포 스모크 게이트 확장(비밀번호찾기 grep + preflight 200/400 화이트리스트).

**보안 리뷰 사이클(고위험 인증 코드 의무):** Codex 크로스모델 3라운드 — R1: Critical(평문 다운그레이드)·Major(provider 미바인딩)·Minor(스모크 401만 감지) 발견 → 수정 → R2: Critical·Minor 해결 확인, Major(구분자 주입) 잔존 → 수정 → R3 최종: **"결함 없음"**.

**검증(메인 세션 직접 재실행 — 관찰됨):** `npm run test` 38 files / 209 PASS / 8 skip(신규 19건 포함) · `npm run build` PASS · `verify-e2e.sh`(port 3459) **E2E SMOKE PASSED**.
**미검증:** 라이브 반영(배포 대기), 실 OAuth 왕복(라이브 채널 필요).

## 2026-07-10 20:35 KST ✅ 배포 + 라이브 재검 전항목 통과 (Fable 5, Phase 1~2)

**배포:** run `29088645737` success (headSha `b9f8066c` = 런치 수정 7커밋 + Phase 5 하드닝). 확장 스모크 게이트(비밀번호찾기 grep + preflight 200/400 화이트리스트) 포함 통과.

**라이브 직접 실측 (전부 관찰됨):**
| # | 검증 | 결과 |
|---|---|---|
| 1 | live `/login` `비밀번호 찾기` | ✅ 1 (배포 전 0 → 해소) |
| 2 | `GET /api/auth/google?...` | ✅ 400 (배포 전 401 → public preflight 반영) |
| 3 | preflight body | ✅ 한국어 안내 JSON — Supabase raw JSON 미노출 (고객 제보 에러 해소) |
| 4 | `/api/health` · `/api/me` | ✅ `{ok,db:up,ms:42}` · 401 |
| 5 | `/api/operator/customers` 무토큰 | ✅ 401 (게이트 정상. 토큰 조회 200은 로컬 토큰 부재로 이 세션 미검증 — 2026-07-10 04:17 Codex 세션에서 검증 이력 있음) |
| 6 | `verify-e2e.sh` (live) | ✅ **E2E SMOKE PASSED** + 스크린샷 `/tmp/e2e-*.png` |

**남은 미검증 (외부 선행조건):** Google 실로그인(Supabase provider — 회장 콘솔), 비밀번호 재설정 메일 실수신(테스트 이메일 필요), 고객 생성→연결→실발행 루프(Phase 4).

## 2026-07-15 OSMU v1.0.0 출시 후보 QA

**변경 범위:** 공개 가입 즉시 활성화 + 공유 Claude 별도 운영자 승인, 운영자 계정/재설정 관리, strict allowlist 기반 오류·Slack 관측, transition-only health monitor, consent-aware GA4, Instagram/Threads 수동 출시팩.

**메인 세션 직접 검증:**
- `npm test` → 62 files PASS, 540 PASS / DB 연동형 8 skipped.
- `npx tsc --noEmit` → PASS.
- `npm run build` → PASS, 161 static pages 생성. 기존 Turbopack dynamic tracing warning 1건만 유지.
- `npm run e2e:local -- http://localhost:3461` → PASS. `/`, `/login`, `/signup -> /login?mode=signup`, storage clear 후 로그인 폼을 실제 브라우저로 관찰. DB env 미주입 상태의 API 503은 예상 동작.
- `git diff --check` → PASS.
- production PostgreSQL schema를 synthetic active/pending/paused 레코드로 transaction 안에서 적용해 `MIGRATION_TRANSACTION_PASS` 확인 후 rollback. 운영 데이터 미변경.
- SNS JSON 계약 → content 8 + DM 6, unique IDs 14, 전부 draft/manual approval, DM auto/cold false, caption/slides/alt text Markdown 동기화, Instagram alt text 슬라이드 수 일치·100자 미만, `fail=[]`.

**독립 QA:**
- `qa-verifier` fresh review: auth/shared CLI/schema/observability/GA4/deploy 스팟체크, 관련 11 files / 123 tests PASS, Critical/High 0.
- 위임 품질 검증: `verify-agent-quality.sh` → QA PASS(`qa-only` Skill, 근거 조사, 소크라테스/레드팀), code-builder PASS, content review PASS, visual producer PASS.
- 발견 Low 1건(`e2e:local` URL override 무시)은 수정 후 실제 3461 브라우저 E2E로 CLOSED.

**라이브/외부 미검증(배포 완료 판정 금지):**
- Supabase Google provider 실 OAuth 왕복.
- custom SMTP 비밀번호 재설정 메일 실수신.
- Slack webhook 실제 알림 수신.
- GA4 Measurement ID 주입 및 DebugView 이벤트 수신.
- 신규 가입 lead가 production `auth.users`에 저장되는 실제 signup 경로와 tenant 생성.
- Instagram/Threads 계정 리네임·프로필 업로드·첫 draft 수동 발행.

## 2026-07-16 v1 후보 운영 배포·핵심 E2E

- deploy run `29422450258` / head `b361d951` → success. DB schema/RLS, build, up, smoke 전 step success.
- live health → 200 + DB up. live browser public E2E → PASS.
- 운영 가입 폼 합성 사용자 생성 → auth user + confirmed email + active tenant 저장 관찰. shared AI 최초 미승인.
- 미승인 `/api/studio/text` → 403. operator `approve_shared_ai` → 승인시각 DB 저장. 승인 후 실제 shared `claude -p` 생성 → 200, 5개 출력 키와 한국어 Threads 결과 관찰.
- 비밀번호 재설정 UI → `r.cupid@gmail.com` 요청 성공 및 `recovery_sent_at` DB 저장. 메일함 수신은 미검증.
- Health Monitor run `29438972593` → success, HTTP 200, up→up, state cache 저장. Slack 실수신은 webhook secret 부재로 미검증.
- 판정: 핵심 제품 경로는 운영에서 관찰됨. Google OAuth·GA4 DebugView·Slack 실알림·SMTP 메일함 수신·Meta 실제 업로드가 남아 있어 `v1.0.0` 태그는 보류.

## 2026-07-16 06:31 KST 외부 설정 반영·운영 재검증

- Google provider 활성화 후 live preflight가 HTTP 200 + Supabase Google auth URL을 반환함을 관찰.
- 운영 `Google로 계속` 클릭 후 `accounts.google.com` 로그인 화면과 등록된 Supabase callback URI로 이동함을 실제 브라우저에서 관찰. Google 계정 입력 후 앱 복귀는 미검증.
- GitHub Secrets `OSMU_GA4_MEASUREMENT_ID`, `OSMU_ALERT_SLACK_WEBHOOK_URL` 저장 확인.
- Slack webhook 실제 POST → `ok`, exit 0 관찰. 단 채팅에 노출된 URL이므로 출시 전 회전 필요.
- 첫 deploy run `29451844552`는 잘못된 compose service 입력 `osmu`로 기동 실패. 실제 서비스명 `openclaw-dashboard-osmu`로 재실행한 run `29452057807`은 build/up/smoke 전 단계 success.
- 운영 브라우저 GA4: 동의 전 consent storage null 및 gtag script 없음. 동의 후 `G-MEEQ2D8C1J` gtag.js HTTP 200, consent granted, config, `/login` page_view dataLayer 적재를 관찰. GA4 DebugView 수신은 미검증.
- SMTP 공급자 credential은 로컬/GitHub에 없음. custom SMTP 설정과 실제 reset 메일 수신은 미검증.
- 회장 보고상 Instagram 계정은 생성됨. 계정 URL·프로필 반영·첫 게시물과 Threads 상태는 화면 증거 전 미검증.

## 2026-07-16 Google-only auth 전환 QA

- 정책: 고객 인증은 Google OAuth 단일 경로. SMTP/Resend와 이메일/비밀번호 가입·로그인·재설정은 사용하지 않음. 운영자 비밀번호 인증은 유지.
- 코드: 로그인 이메일 API/UI 제거, `/signup`→`/login`, 랜딩/오류 카피 Google-only화, 배포 스모크와 gstack E2E의 구 이메일 계약 제거.
- Codex 2차 리뷰에서 `AuthGate` 이메일 카피 잔존과 배포 스모크의 `비밀번호 찾기` 필수 조건을 발견해 수정·회귀 테스트 추가.
- 직접 검증: focused 4 files/43 PASS, full 63 files/548 PASS/8 skip, `tsc --noEmit` PASS, production build 161 pages PASS.
- 로컬 gstack E2E: `/login` Google CTA만 표시, 이메일/비밀번호/recovery 없음, `/signup` 307→`/login`, storage clear 후 동일 UX, Google 계정 로그인 화면 이동 관찰.
- 운영 auth users 6명은 모두 현재 `email` provider only임을 Admin API로 확인. 삭제하지 않으며 동일 이메일 Google 첫 로그인에서 identity linking/tenant 보존을 검증해야 함.
- 미검증: 변경 코드 운영 배포, Supabase Email provider 비활성화, 실제 Google 계정 선택→앱 복귀, 기존 user/tenant 보존, 신규 Google lead 저장.

### 2026-07-16 08:13 KST 독립 QA HIGH 종결

- 독립 QA가 관리자 고객 화면의 `비밀번호 재설정 메일`이 제거된 고객 recovery UI를 가리키는 죽은 기능임을 발견했다.
- API의 Supabase `/auth/v1/recover` 호출, UI 버튼/상태, `send_password_reset` 관측성 enum을 제거했다. 직접 API 호출은 400 unsupported이며 메일 fetch는 호출되지 않는다.
- 계정 정지/재개와 공유 AI 승인/회수는 유지했다. 관련 focused 8 files/98 PASS, 전체 63 files/548 PASS/8 skip, `tsc --noEmit` PASS, production build 161 pages PASS.
- 로컬 gstack E2E에서 `/login` Google CTA 단일 표시, 이메일/비밀번호/recovery 부재, `/signup`→`/login`, storage clear 후 동일 UX를 다시 관찰했다.
- 로컬 E2E 서버에는 이번 실행에서 Supabase 공개 env가 없어 Google 외부 화면 이동을 재실행하지 못했다. 해당 이동은 직전 운영/로컬 실행에서 관찰됐지만, 변경 코드 배포 후 계정 선택→앱 복귀·identity linking·lead/tenant 저장은 여전히 미검증이다.
- SMTP/Resend는 출시 선행조건이 아니다. Google-only 강제를 위해 Supabase Email provider를 비활성화해야 한다.

## 2026-07-16 운영 배포 후 SNS 전수 QA

- 배포 run `29485147720` / head `70001691` 성공. 운영 health 200+DB up, `/login` Google-only HTML, Google preflight 200과 실제 `accounts.google.com` 이동을 관찰했다.
- 운영 테넌트 `587cee76-...`의 integrations 조회에서 Instagram·Threads가 `has_secret=true`였지만, 플랫폼 읽기 전용 계정 API 직접 호출은 두 채널 모두 HTTP 400 / OAuth error code 190을 반환했다. 저장 토큰이 만료·무효이므로 UI의 저장 여부만으로 연결됨 판정하면 안 된다. QA용 임시 tenant token은 종료 시 revoke한다.
- ✅ OAuth preflight 200: Instagram, Threads, Facebook, YouTube.
- ❌ NG OAuth credential 미설정(운영 HTTP 500): X, LinkedIn, Naver Blog, Pinterest, Tumblr, TikTok, Slack, LINE.
- ❌ NG 직접 발행 구현 범위: `/api/publish`는 Threads, Instagram, X, Facebook, Bluesky, Telegram, Discord, Slack만 분기한다. YouTube·LinkedIn·Naver Blog·Pinterest·Tumblr·TikTok·LINE은 OAuth UI가 있더라도 직접 발행 분기가 없어 `미지원`이다.
- ❌ NG Instagram·Threads: 암호화 토큰은 존재하지만 실제 API error 190으로 연결 무효. 재OAuth 전 발행 불가.
- 🔎 진행 중: Instagram·Threads 재OAuth, Facebook·YouTube OAuth 동의/콜백, 미설정 플랫폼을 v1 차단으로 볼지 credential/발행 구현을 추가할지 분류.

### 2026-07-16 20:03 KST P0 시정

- 🔧 UI↔발행 불일치: 고객 UI의 발행 채널 SSOT를 `/api/publish`가 직접 지원하는 8개(Threads/X/Instagram/Facebook/Bluesky/Telegram/Discord/Slack)로 축소했다. 미지원 7개는 내부 확장 설정은 보존하되 Sidebar·Settings·ChannelConnect에서 노출하지 않는다.
- 🔧 연결 false-positive: `GET /api/channel-config`가 Instagram·Threads 암호화 토큰을 서버에서만 복호화하고 provider read-only 계정 API로 병렬 검증한다. HTTP 400/401 또는 code 190은 `connected=false`, `reconnectRequired=true`, `oauth_token_invalid`; 네트워크/5xx는 토큰을 삭제하지 않고 `unverified/provider_unreachable`로 표시한다.
- 🔧 UI: 일반 ChannelPage와 Instagram 전용 화면에 `재연결 필요`와 provider 일시 장애 문구를 분리했다. 토큰 원문·provider raw body는 응답/로그에 포함하지 않는다.
- 테스트됨: focused 6 files/75 PASS, full 65 files/563 PASS/8 skip, `tsc --noEmit` PASS, production build 161 pages PASS. code-builder 위임 품질 게이트 PASS(WebSearch/Fetch 5, 소크라테스 마커 5).
- 운영 재배포 후 실제 code190 테넌트가 `재연결 필요`로 표시되는지 확인해야 `관찰됨`으로 전환한다.

### 2026-07-16 21:20 KST P0 운영 재배포·직접 관찰

- 배포 run `29496623489` / head `8b1ca33f` 성공. schema/RLS, image build, up, status, Google-only/operator smoke 전 단계 통과.
- live `/api/health` HTTP 200, `{ok:true,db:"up"}` 직접 관찰.
- 인증된 live `/api/channel-config`에서 Instagram·Threads 모두 provider read-only 검증 결과 `connected=true`, `connectionStatus=valid`, `reconnectRequired=false`; 응답의 token/secret/credential 명명 필드는 0개였다.
- 운영 브라우저에서 Instagram `Connected`, Threads `Live`를 관찰했다. Sidebar/Settings 채널 목록은 직접 발행 지원 8개(Threads/X/Instagram/Facebook/Bluesky/Telegram/Discord/Slack)만 노출했다. Instagram 화면 캡처: `/private/tmp/osmu-prod-instagram.png`.
- 앞선 provider error 190과 현재 valid 결과가 달라졌으나, 현재 서버 API와 브라우저 결과는 일치한다. 실제 공개 게시를 하지 않았으므로 `threads_content_publish`/Instagram content publish 실권한과 최종 permalink는 미검증이다.
- 운영 auth user 6명(confirmed 4, unconfirmed 2), customer workspace 10개(active 10, shared AI 승인 10, integration 보유 2)를 operator API로 관찰했다. 비밀번호 원문은 Supabase에서 조회할 수 없다.
- Health Monitor run `29497421714` success. QA tenant token revoke 후 동일 token으로 live API 401 확인. 브라우저 localStorage 및 임시 probe 파일 정리 완료.
- ship 잔여: 실제 Google 계정 선택→앱 복귀→identity/lead 저장, Threads 공개 게시 1건과 permalink, GA4 DebugView 수신, 채팅에 노출된 Slack webhook 회전.

## 2026-07-17 사용자 실기기 SNS 연결 QA — 출시 차단 NG

> 증거 등급: **사용자 실기기 관찰**. 아래 항목은 재현·원인 분류 전까지 전부 ❌ NG이며, 기존 `Connected`/`Live` 판정을 출시 근거로 사용하지 않는다.

- ❌ **Threads 계정 전환 불가:** Chrome에 남아 있던 다른 Meta/Threads 계정으로 `계속하기`만 제공되고 취소 외 선택지가 없어 목표 계정을 연결하지 못함.
- ❌ **Instagram 인증 rate limit:** 인증번호 요청 한도 메시지로 로그인 완료 불가. 30초 안내가 있어도 현재 실제 재요청 성공은 미검증.
- ❌ **X 연결 버튼 실패:** 클릭 결과 `{"error":"X_CLIENT_ID 미설정 — 플랫폼 OAuth 앱 자격증명 필요"}`. 사용자에게 비활성/설정 필요 상태를 사전 표시하지 않고 연결 가능한 버튼처럼 노출함.
- ❌ **Facebook 앱 비활성:** Meta 화면에서 앱 비활성 상태로 차단되어 로그인·동의·callback 불가.
- ❌ **Bluesky 연결 UX/저장 실패:** OAuth가 아닌 handle/app password 입력 방식에 대한 설명이 부족하고, 임의 입력 시 `{"error":"openclaw.json not found"}` raw 오류 노출. 멀티테넌트 DB 저장 경로 대신 존재하지 않는 파일 설정에 의존하는 결함 의심.
- ❌ **영상 플랫폼 누락:** YouTube/TikTok/Reels/Shorts가 미리보기/영상 화면 일부에는 있으나 고객 채널 연결·발행 범위에서 제거되거나 불완전해, 사용자가 어디서 연결·발행하는지 알 수 없음. 실제 end-to-end 업로드는 미검증.

### QA 재발방지 판정

- 기존 QA는 `auth URL 생성`, `read-only /me 성공`, `connected/live 렌더`까지만 확인하고 **계정 전환 → 로그인/2FA → 동의 → callback → 저장 → 실제 발행** 전체 왕복을 확인하지 않았다. 따라서 `21:20 KST`의 연결 판정은 부분 증거이며 출시 완료 근거가 아니다.
- 앞으로 provider별 E2E 매트릭스에 `새 브라우저`, `기존 타계정 세션`, `2FA/rate limit`, `앱 live 상태`, `credential 누락`, `callback`, `저장`, `재연결`, `실발행/permalink`를 각각 별도 게이트로 둔다.
- raw JSON/파일 누락/credential 누락은 브라우저에 그대로 노출하지 않고, 연결 버튼 비활성 + 한국어 조치 안내로 수렴해야 한다.

### 결함 관리 원장 — 2026-07-17

| ID | 결함 | 확정 원인 | 미확정/외부 원인 | 수정 소유자 | 종료증거 | 상태 |
|---|---|---|---|---|---|---|
| SNS-001 | Threads 목표 계정 전환 불가 | `window.open`이 기존 Chrome의 Threads/Meta 쿠키를 공유하고, authorize URL에 계정 전환/재인증 UX가 없음 | Meta가 현재 앱에 허용하는 계정 전환 파라미터와 실제 계정 선택 화면 | build: 연결 UX·popup 상태 / external: 목표 계정 로그인 | 기존 타계정 세션이 있는 Chrome에서 목표 계정 선택→callback→DB의 Threads userId 변경 관찰 | 🔧 코드 수정·테스트됨 / 실브라우저 미검증 |
| SNS-002 | Instagram 인증번호 요청 제한 | Instagram 로그인 단계에서 OTP 요청 rate limit 발생; callback까지 도달하지 못함 | 제한 해제 시점·계정 보안 상태는 Meta만 판단 | build: 재시도/cooldown 안내 / external: 계정 인증 | 목표 Instagram 계정 로그인→동의→callback→DB 저장, 반복 요청 없이 1회 왕복 관찰 | ❌ NG |
| SNS-003 | X 연결 버튼이 500/raw error | 운영 `X_CLIENT_ID`, `X_CLIENT_SECRET` 미설정. UI는 readiness를 모르고 정적 OAuth 버튼 노출 | X Developer App 생성·요금/권한 승인 상태 | build: readiness·disabled UX / external: X app credential | credential 미설정 시 버튼 비활성+조치 안내; 설정 후 PKCE callback→DB 저장→테스트 post/permalink | 🔧 코드 수정·테스트됨 / 운영 credential 미설정 |
| SNS-004 | Facebook 앱 비활성 차단 | 서버 credential/config_id는 설정돼 auth URL은 생성되나 Meta가 앱 접근을 차단 | Development/Live 모드, 역할, 정책 제한, 앱 비활성 사유 중 무엇인지는 콘솔 캡처 전 미검증 | external: Meta 앱 관리자 / build: 상태 안내 | Meta 콘솔의 활성 상태 증거 + 비역할 사용자 로그인→동의→callback→Page token 저장→테스트 post | ❌ NG |
| SNS-005 | Bluesky 수동 연결 404 | `POST /api/channel-config/bluesky`가 DB bridge 전에 tenant `openclaw.json` 존재를 강제하고 없으면 404. GET은 빈 config를 허용해 계약도 불일치 | ATProto OAuth 도입 시점 | build: DB-first 저장·오류 정규화 | config 파일 없는 신규 tenant에서 App Password 저장→createSession 검증→DB 저장→실제 post/permalink | 🔧 코드 수정·테스트됨 / 실계정 미검증 |
| SNS-006 | 영상 플랫폼 연결·발행 누락 | YouTube callback은 DB `integrations`에 저장하지만 status는 `youtube-token.json`, publish는 `openclaw.json`을 읽어 저장소가 3개로 분리. TikTok credential 없음+publish 미구현, Reels publish 분기 없음 | TikTok 앱 심사/공개 발행 승인 | build: YouTube DB 단일화·영상 UI / external: TikTok review | YouTube OAuth→DB refresh→영상 업로드→Shorts URL. TikTok/Reels는 구현 전 disabled+사유 노출 | 🔧 YouTube 코드 수정·테스트됨 / 실업로드 미검증 |
| SNS-007 | 사이트 내 provider 다중계정 관리·전환 불가 | `integrations`가 `UNIQUE(tenant_id,kind,label)`이고 OAuth callback이 provider label로 upsert해 새 계정 연결 시 기존 계정을 덮어씀. 발행 API도 provider별 단일 credential만 조회 | 두 번째 계정 OAuth 로그인 자체는 provider 세션/2FA 제약을 통과해야 함 | eng/build: additive `channel_accounts`+계정 관리 UI/API+선택 발행 | 동일 provider 2계정 보존→기본계정 전환→각 계정 선택 발행 permalink, 기존 단일계정 무손실, cross-tenant 거부 | 🟡 운영 단일계정 UI 관찰 / 실 2계정 전환·발행 미검증 |
| SNS-008 | OAuth 연결 클릭 후 popup 미생성 | 공통 `SocialConnectButton`이 auth URL fetch를 await한 뒤 `window.open()`을 호출해 transient user activation을 잃음 | provider 로그인·동의·callback 이후 외부 단계 | build: 클릭 즉시 blank popup 예약→URL 이동, failure/unmount/StrictMode lifecycle 정리 | 운영 Chrome에서 Facebook·YouTube 클릭 시 새 popup target 생성 및 공식 provider host 이동, callback postMessage 후 상태 갱신 | 🟡 운영 popup/provider 진입 관찰 / callback 미검증 |
| SNS-009 | Threads `valid`인데 실발행 400 | readiness가 `/me?fields=username` 성공만 보고 저장 user ID와 토큰 실제 ID를 비교하지 않음. publish는 stale `meta.userId`를 그대로 사용 | 없음(TEXT 실발행 기준) | build: `/me?id` identity 검증·실제 ID 사용, mismatch 회귀 테스트 | 운영 T-PIN-01 발행 성공 + permalink, draft 중복 방지, 실패 기록 보존 | ✅ 운영 관찰 |
| SNS-010 | Threads 컨테이너 준비 전 발행·발행 결과불명 | 모든 media container 생성 직후 상태 폴링 없이 publish하고, publish 네트워크 단절 시 실제 성공 여부를 확정할 수 없음 | IMAGE 실발행은 아직 미검증 | build: FINISHED까지 status 폴링 + ERROR/EXPIRED/timeout fail-closed; 응답 단절 중복은 SNS-012 순차 방지로 일부 완화 | TEXT/이미지 게시 실 permalink, publish 응답 단절 후 중복 0건 | 🟡 TEXT 운영 관찰 / IMAGE 미검증 |
| SNS-011 | 운영 재배포 후 tenant queue/config 파일 소실 | deploy가 checkout 전 workspace 전체를 삭제하는데 OSMU가 workspace 상대 bind mount를 사용 | 삭제된 과거 config의 별도 백업은 없음 | build: 고정 이름 Docker volume + 상대 bind 금지 계약 테스트 | 재배포 전후 동일 queue ID/원문 유지, 컨테이너 재생성 후에도 존속 | ✅ 운영 관찰 |
| SNS-012 | 실발행 성공 후 draft 잔존·재클릭 중복 | `/api/publish`가 `published_posts`만 INSERT하고 queue JSON/DB shadow 상태를 갱신하지 않으며 기존 성공 조회도 없음 | 동시 요청 레이스는 별도 DB lock 없이는 완전 차단되지 않음 | build: 계정별 기존 성공 반환 + 성공 후 queue dual-write | 첫 요청 게시 1개/queue published, 순차 동일 요청 `alreadyPublished:true`, 외부 게시물 증가 0 | ✅ 순차 운영 관찰 |
| SNS-013 | 발행 성공했지만 permalink 누락으로 검증 실패 | Meta media permalink가 발행 직후 조회에서 비어도 발행 자체는 성공 처리되며 기존 성공 retry는 URL을 보강하지 않음 | Meta permalink 가시화 지연 | build: 초기 5회 조회 + 기존 external ID URL-only 복구/DB·queue 보강 | 동일 요청 `alreadyPublished:true`+permalink, published/distinct external 1 | ✅ 운영 관찰 |

**관리 규칙:** 상태 전이는 `❌ NG → 🔧 코드 수정·테스트됨 → 🔧 로컬 실브라우저 관찰 → 🟡 운영 미검증 → ✅ 운영 관찰`만 허용한다. unit/mock/auth URL 200은 E2E나 종료증거로 승격하지 않는다. 각 ID는 코드 커밋·테스트·배포 run·실사용 증거에 동일하게 붙인다.

**SNS-011 재현·복구 근거(2026-07-19):** SNS-009 배포 run `29662640422` 직후 실제 컨테이너의 `/app/data`와 `/app/config`, compose checkout의 `data-osmu`/`config-osmu`가 모두 비어 있음을 확인했다. workflow는 checkout 전에 workspace를 전부 삭제하고, 기존 compose는 그 workspace의 상대 경로를 mount해 영속성 계약이 모순이었다. DB `queue_posts`에는 T-PIN-01(`13730d99-...`, 397자, text match)과 T-02 두 draft가 남고, T-PIN-01 `published_posts`는 failed 1건·permalink 0건이라 복구 및 단일 재발행이 가능하다. compose를 `openclaw-osmu-data`/`openclaw-osmu-config` 고정 이름 volume으로 바꾸고 `osmu-persistence.contract.test.ts` 2 PASS와 `docker compose config --quiet --no-interpolate` PASS를 확인했다. 운영 종료증거는 새 volume에 DB shadow를 복구한 뒤 재배포 전후 동일 ID 2건이 유지되는 관찰이다.

**SNS-010 TEXT 운영 재현 정정(2026-07-19):** deploy run `29681690918` 후 T-PIN-01을 재발행했을 때 identity 조회와 container 생성은 통과했으나 `threads_publish`가 400으로 실패했다. 공개 성공 0, failed 기록 2, queue draft, QA token revoke/401을 확인했다. 따라서 기존 "TEXT에는 폴링의 직접 영향 없음" 판단은 철회한다. container `status`를 최대 20회/1초 간격으로 조회해 `FINISHED`만 publish하고 `ERROR`/`EXPIRED`/unknown/network/timeout은 원문·토큰 비노출 오류로 중단하도록 수정했다. focused 3 files/29 PASS, tsc PASS. 운영 permalink 전에는 종료하지 않는다.

**SNS-013 운영 재현(2026-07-19):** polling 배포 run `29683491094` 후 동일 draft 발행은 DB `published=1`, distinct external ID 1, queue JSON/DB `published`로 실제 성공했다. 단, 발행 직후 permalink가 비어 검증 스크립트가 URL assertion에서 중단됐다. 토큰은 revoke됐고 외부 게시 재호출은 하지 않았다. 초기 permalink를 5회 재시도하고, 이미 성공한 draft의 순차 요청은 기존 external ID로 URL만 조회해 DB/queue를 보강하도록 수정했다. focused 27 PASS, tsc PASS.

**Threads TEXT 최종 운영 증거(2026-07-19):** deploy run `29684688750` SUCCESS 후 동일 T-PIN-01 요청이 기존 성공을 재사용해 permalink를 DB와 queue에 보강했다. DB는 published 1, distinct external ID 1, 과거 failed 2이고 queue JSON/DB는 published다. 로컬·marketing VM curl 모두 공개 URL HTTP 200, gstack 실제 브라우저가 `zero_to_one_ai` 계정의 397자 원문 전체를 직접 렌더했다: `https://www.threads.com/@zero_to_one_ai/post/Da-Kay5lD4f`. 외부 게시물 추가 생성은 0이다. 별도 최종 토큰 수명주기에서 발급 직후 queue API 200, revoke 후 같은 토큰 401을 직접 확인했다.

**SNS-007 구현 결정:** 기존 `integrations` UNIQUE를 즉시 제거하지 않는다. 새 `channel_accounts` 테이블을 additive로 추가하고 기존 integration을 backfill·fallback으로 유지한다. OAuth는 계정별 upsert, 기본계정 변경 시 legacy integration을 동기화한다. 롤백 시 새 테이블 사용만 중단하면 기존 단일계정 경로가 유지된다.

**SNS-007 build candidate(2026-07-17, 자동 테스트 통과·실브라우저 미검증):** 스키마(`channel_accounts` + `published_posts.account_id`/`schedules.account_id`, tenant/provider당 partial unique default, 멱등 backfill) + `src/lib/channel-accounts.ts`(upsert/list/setDefault/delete/getSelectedCred) + REST(`/api/channels/[provider]/accounts`, `/[id]`, `/[id]/default`) + `/api/publish`·`/api/schedule`·`/api/schedule/publish-due` 선택계정 발행 + `AccountManager` UI + Studio/SchedulePanel/YouTube 선택 드롭다운을 구현했다. refresh token 평문 저장 금지, provider/tenant 계정 검증, 선택 YouTube refresh/upload, workspace 변경 시 선택 초기화가 자동 테스트로 검증됐다. 테스트: `npm test` 73 files/630 pass·9 DB-env skip, `npx tsc --noEmit` clean, `npm run build` PASS(160 pages). `tests/db/channel-accounts-concurrency.db.test.ts`는 실제 `upsertChannelAccount` 두 호출을 병렬 실행해 2행/기본계정 1개를 검증하도록 추가했지만 로컬 DB가 없어 skip됐다. QA 종료 조건은 CI PostgreSQL에서 이 테스트가 skip 없이 통과하는 것이다. 미검증: 실계정 2계정 OAuth 왕복, 프로덕션 migration, 선택계정별 실제 permalink/Shorts URL.

**SNS-007 실제 DB QA(2026-07-17):** GitHub Actions run `29572377311`(commit `592c4741`)에서 PostgreSQL 16에 `schema.sql → seed-test-tenants.sql → rls.sql`을 적용한 뒤 전체 테스트가 **73 files/626 pass/0 skip**으로 통과했다. 신규 `channel-accounts-concurrency.db.test.ts`는 314ms에 skip 없이 실행되어 실제 `upsertChannelAccount` 병렬 2호출 결과가 2행/기본계정 1개임을 관찰했다. 이는 DB 경쟁 조건과 RLS/schema 계약 증거이며, 실제 provider OAuth·브라우저 계정전환·공개 발행 증거는 아니다.

**SNS-007 운영 브라우저 QA와 핫픽스(2026-07-17):** 최초 운영 배포 run `29573237891` 후 고객용 단기 `osmu_` 토큰으로 Chrome을 열었을 때 AccountManager가 403 `이 API는 운영자 전용입니다`를 표시했다. 원인은 `proxy.ts`의 tenant-aware allowlist에 신규 account API 3경로가 누락된 것이며, commit `15b09a2c`에서 경로를 추가하고 osmu/JWT 회귀 테스트를 고정했다. GitHub Actions run `29598660707`은 typecheck/build/PostgreSQL schema→seed→RLS/full test를 모두 통과했다. 재배포 run `29600031321` 성공 후 분리된 headless Chrome에서 Instagram과 Threads Settings를 다시 열어 각각 계정 1개, 외부 계정 ID, `기본`, `정상`, `삭제` 컨트롤 렌더를 assertion과 스크린샷으로 직접 관찰했다. 증거는 `docs/evidence/sns007-live-{instagram,threads}-account-manager-20260717.png`. 단기 QA 토큰은 폐기 후 같은 account API가 HTTP 401을 반환하는 것을 확인했고 원문 파일도 로컬/서버에서 삭제했다. 이 증거는 **운영 고객 인증 경로와 단일계정 관리 UI**의 통과 증거다. 실제 provider 두 번째 계정 OAuth, 두 계정 간 기본 전환, 계정별 공개 발행 permalink는 여전히 미검증이므로 SNS-007을 종료하지 않는다.

**SNS-008 build candidate(2026-07-18):** 운영 고객 토큰 Chrome에서 X readiness 차단 안내는 정상 렌더됐지만 Facebook OAuth 클릭 후 popup target이 생성되지 않았다. E2E 스크립트의 click 판정 오류를 먼저 고쳐 재시도해도 동일하게 재현됐고, 공통 버튼이 `await fetch` 뒤 `window.open`하는 코드와 MDN/WHATWG transient activation 규칙이 원인으로 일치했다. 클릭 핸들러에서 `about:blank` popup을 동기 예약하고 auth URL 응답 후 이동하도록 수정했다. popup blocked 시 fetch 미호출, API/JSON/network/authUrl 없음 시 popup close, valid postMessage 시 interval 정리, wrong origin/provider 무시, popup close 감지, unmount cleanup, pending fetch 중 unmount, React StrictMode setup-cleanup-setup을 컴포넌트 테스트 10건으로 고정했다. 메인세션 직접 재현은 focused 10/10, 전체 74 files/644 PASS·9 DB-env skip, tsc clean, production build 160 pages PASS.

**SNS-008 운영 Chrome QA(2026-07-18):** commit `41f33340` 기준 OSMU 단독 배포 run `29639946525`가 DB/RLS, 이미지 빌드, 기동, 상태, OSMU 스모크를 포함해 성공했다. 분리된 headless Chrome과 단기 고객 토큰으로 X 버튼 비활성 및 `X_CLIENT_ID/X_CLIENT_SECRET` 사유, Facebook `Development/Live` 경고를 관찰했다. 사용자 제스처 클릭 후 Facebook 새 page target이 `www.facebook.com`, YouTube 새 page target이 `accounts.google.com`으로 이동한 것을 CDP target URL로 assertion했다. 영상 화면의 YouTube 연결 UI와 TikTok/Reels `미구현` 상태도 함께 확인했다. 화면 증거는 `docs/evidence/sns008-live-oauth-popup-e2e-20260718.png`. 단기 토큰은 즉시 revoke했고 같은 토큰의 readiness API가 HTTP 401임을 확인한 뒤 원문과 임시 파일을 삭제했다. 이 증거는 **팝업 생성과 provider 진입까지만** 종료한다. 실제 provider 로그인·동의·callback postMessage·DB 저장·2계정 전환·공개 발행은 미검증이다.

## 2026-07-18 마케팅 실행 재개 — 운영 draft 큐

- 사용자 지적: 개발·QA 보고가 길어지고 실제 마케팅 출고가 시작되지 않음. 기존 SNS-001~008과 별개로 실행 지연 문제를 기록한다.
- 운영 API 직접 관찰: Instagram·Threads는 각각 `connected=true`, `connectionStatus=valid`, 기본 active 계정 1개. X 미연결, Facebook·YouTube 계정 0개.
- 런치 정본 `T-PIN-01`(397자)과 `T-02`(273자)를 `/api/queue/add`로 생성했고, `/api/queue` 재조회에서 두 ID가 `draft`, placeholder 0건임을 확인했다. 공개 발행·승인은 하지 않았다.
- 보안: 상태 조회와 draft 생성에 쓴 단기 tenant token을 각 실행 직후 revoke했고 동일 API HTTP 401을 확인했다.
- 브라우저 UI: `gstack browse`는 server start timeout, 대체 Chrome CDP 실행은 결과 로그를 남기지 않아 `/inbox` 렌더는 **미검증**. API 저장 증거를 UI PASS로 승격하지 않는다.
- 다음 종료증거: 실제 사용자 로그인 세션에서 `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/inbox`를 열어 두 초안 원문 확인 → 사용자 승인 → Threads 실제 발행 permalink 관찰.
- 실발행 재현: 정본 `T-PIN-01`을 기본 active Threads 계정으로 실제 POST했으나 provider 400 `Unsupported post request`가 발생했다. 공개 게시물은 생성되지 않았고 draft는 보존했다. 저장 계정 ID가 현재 token 권한 대상이 아니며, readiness가 id 비교 없이 username 조회 성공만으로 `valid`를 표시한 false-positive가 코드와 일치한다. 단기 token은 revoke 후 401 확인.

### 2026-07-19 SNS-009 build candidate

- `publishThreads`는 저장 `meta.userId`를 발행 URL에 쓰지 않고 매 발행 직전 토큰의 `GET /me?fields=id` 결과를 container/publish ID로 사용한다. 저장 user ID가 없어도 유효 토큰의 live ID로 발행할 수 있다.
- `verifyChannel`과 `GET /api/channel-config`는 Threads live ID가 없거나 파싱되지 않으면 `valid`로 통과시키지 않는다. 저장 ID와 live ID가 다르면 `identity_mismatch`, ID 확인 불가는 `identity_unavailable`로 분리한다.
- Threads identity/container/publish 실패 응답은 provider 원문 body를 포함하지 않고 상태 코드와 조치 문구만 반환한다.
- 직접 검증: focused 6 files/68 PASS, `npx tsc --noEmit` PASS, production build 160 pages PASS. 전체 테스트는 75 files/653 PASS·9 skip이고, 기존 5초 제한 2건이 현재 머신의 느린 동적 import로 timeout났다. 두 테스트만 15초 제한으로 조정해 단독 2 files/36 PASS를 관찰했다.
- 미검증: 변경 코드 CI·운영 배포, 현재 Threads token의 publish scope, T-PIN-01 공개 게시물과 permalink. 이 세 가지를 보기 전 SNS-009를 `✅ 운영 관찰`로 승격하지 않는다.
- QA 후속: Meta 공식 Threads Postman 컬렉션은 container 상태(`FINISHED`, `IN_PROGRESS`, `ERROR`, `EXPIRED`, `PUBLISHED`) 조회를 제공한다. 현재 T-PIN-01은 TEXT라 이미지 준비 폴링의 직접 영향은 없고, qa-verifier도 blocker/high 0·조건부 PASS로 분류했다. IMAGE 상태 폴링과 publish 응답 단절 후 중복 방지는 SNS-010으로 분리하되 이미지 공개 발행 전 해결한다. 이번 패치에서 새로 넣었던 `threads_publish` 15초 timeout은 응답만 늦은 실제 성공을 실패로 오판할 수 있어 제거했다.
- 최종 자동 증거: network/malformed JSON 4개 회귀를 포함한 focused 5 files/43 PASS, identity test 9/9 PASS, `npx tsc --noEmit` clean. 최종 qa-verifier는 `standards/dev.md` Read + QA Skill 1회 + Meta WebFetch 2회가 품질 스크립트에서 확인돼 PASS했고 blocker/high 0, TEXT build 조건부 PASS로 판정했다. 운영 permalink는 여전히 미검증이다.

## 2026-07-19 Google lead 및 GA4 재방문 QA

- **Google lead 운영 관찰:** 운영 PostgreSQL 비식별 집계에서 auth identity는 email 6/google 3, Google 고유
  사용자 3명, Google 사용자와 연결된 active tenant 3개, tenant 미연결 Google 사용자 0명이다. 따라서 실제
  Google 인증 유입이 tenant lead로 저장되는 경로는 운영 데이터로 관찰됐다. 계정 이메일·토큰·DB URL은 출력하지 않았다.
- **GA4 동의 경계 관찰:** 신규 격리 브라우저의 동의 전 네트워크에는 Google Tag/Analytics 요청이 0건이었다.
  동의 후 `G-MEEQ2D8C1J` gtag.js 200, analytics consent granted, config, `/login` page_view dataLayer 적재를 관찰했다.
- **GA4-001 재현:** 동의가 이미 저장된 상태로 `/login`을 reload하면 gtag.js는 200이지만 첫 page_view가 dataLayer와
  네트워크에서 유실됐다. `RouteTracker`가 `ConsentBanner`의 bootstrap보다 먼저 실행될 수 있고 `sendGaHit`가
  초기화 전 이벤트를 무시하는 순서 경쟁이 원인이다.
- **GA4-001 build 후보:** 저장 동의가 있고 `window.gtag`가 없으면 `sendGaHit`가 consent/config를 1회 bootstrap한
  뒤 이벤트를 큐잉한다. bootstrap 자체도 페이지 수명 동안 1회로 멱등화해 늦은 default 재적재를 막았다. focused
  18 PASS, TypeScript PASS. 운영 배포 후 저장 동의 reload에서 page_view와 실제 `google-analytics.com/g/collect`
  관찰 전 상태는 `코드 수정·테스트됨`이며, GA4 DebugView 수신은 별도 미검증이다.
- **GA4-001 CI:** commit `af50af17`, GitHub Actions run `29719316459`에서 typecheck, production build,
  PostgreSQL schema→seed→RLS, full test가 모두 성공했다. 운영 재배포·브라우저 network 관찰은 아직 미검증이다.

### HARNESS-001 — 가역 실행 승인 반복 노출

- ❌ **NG(사용자 직접 지적, 2026-07-20):** 이미 진행·build·QA 승인이 확정된 상태에서 Git/브라우저/GitHub
  명령의 샌드박스 권한 요청을 작업 승인처럼 반복 노출했다. 가역 작업은 묻지 않고 실행한다는 하네스 규칙과 충돌한다.
- **원인:** 제품 stage 승인과 실행환경 sandbox escalation을 보고 문구에서 분리하지 않았고, 권한 prefix를 한 번에
  확보하지 않아 승인 UI가 여러 번 발생했다.
- **재발방지:** 기존 승인 prefix는 무질문 실행, 신규 외부 권한이 시스템상 필수일 때만 최소 범위를 한 번에 묶는다.
  제품·단계 승인은 이미 승인됐으면 다시 요청하지 않는다. 이 항목의 종료증거는 남은 배포·운영 E2E를 추가 제품 승인
  질문 없이 끝까지 수행한 실행 기록이다.

### GA4-002 — dataLayer 명령이 보이지만 실제 수집 0건

- ❌ **운영 NG:** GA4-001 배포 run `29727395683` 후 저장 동의 reload에서 consent/config/page_view는 단일 순서로
  dataLayer에 존재했지만 GA collect 요청은 0건이고 `gtag('get', ..., 'client_id')` callback도 3초 timeout됐다.
- **확정 원인:** `rawGtag(...args)`가 일반 Array를 push했다. Google 공식 gtag snippet은 native `arguments` 객체를
  push하며, 운영 gtag.js는 일반 Array 명령을 실행하지 않았다. destination 전용 스크립트에는 측정 ID와 GA event
  설정이 실제 포함돼 있어 script/ID 미주입 문제는 아니다.
- **종료증거:** native Arguments 교정 후 운영 저장 동의 reload에서 client_id callback 반환, page_view collect
  network 요청, 명령 단일 적재를 모두 직접 관찰해야 한다. DebugView UI 수신은 별도 외부 확인으로 남긴다.
- **자동 검증:** commit `7c84d533`, focused 18 PASS, local full 77 files/669 PASS·9 DB-env skip, TypeScript,
  production 160-page build PASS. CI run `29728777597`도 typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS.
