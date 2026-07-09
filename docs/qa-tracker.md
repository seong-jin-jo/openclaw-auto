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
