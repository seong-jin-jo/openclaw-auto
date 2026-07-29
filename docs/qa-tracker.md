# QA Tracker — openclaw-auto-osmu (pipeline qa 단계 증거)

> 2026-07-02 밤샘 라이브 QA(browse+curl, 직접 관찰). 형식: 증거 항목 → 결과 → 근거.

## 2026-07-29 고객 운영 플로우 차단 결함 — 독립 QA

**판정:** 로컬 제품 QA PASS. 운영 배포·실브라우저는 미검증이므로 ship PASS가 아니다.

- tests-first RED: 최초 고객 경계/외부 실패 20건, 첫 독립 QA가 찾은 회귀 10건,
  AuthGate `SIGNED_OUT` micro-race 2건을 각각 실제 실패로 관찰했다.
- 최종 focused auth/영향 회귀 57/57, 독립 계약 감사 9/9, 전체 dashboard 115 files
  948 PASS/10 DB-env skip, `tsc --noEmit`, Next.js webpack production build 166/166,
  `git diff --check`가 통과했다.
- 고객 화면은 operator-only global cron/token/secret/file API를 더 이상 요청하지 않으며 Proxy
  allowlist는 변경하지 않았다. tenant-safe 자동화는 `/api/channel-settings/{channel}`로 유지한다.
  연결된 Instagram Editor는 global `/api/design-tools` 없이 core editor·queue 기능을 유지하고,
  global Figma push/import만 숨긴다. setup guide의 존재하지 않는 image reference는 0개다.
- AuthGate는 401 reauth owner token과 local-scope sign-out으로 이전 요청의 늦은
  `SIGNED_OUT`가 갱신된 Google/Supabase JWT를 지우지 못하게 한다. owner 없는 정상 고객
  `SIGNED_OUT`과 operator token 경로는 기존대로 동작한다.
- YouTube upload와 Telegram/Discord/Slack/LINE notification 실패는 HTTP/body/ID 계약을
  fail-closed로 판정한다.
- **미검증:** 실제 운영 다중 탭 auth interleaving, 고객/운영자 전체 route matrix, 외부 provider
  전송, Admin OAuth UI 저장→마스킹→reveal→delete, DB 환경 의존 10 tests.
- **하네스 상태:** Codex 환경에 qa/browse/verify Skill이 없어 QA 역할 품질 skill gate는 FAIL.
  제품 판정은 독립 diff·테스트·TypeScript·production build 증거로만 PASS했다.

## 2026-07-29 기존 OAuth env 자격증명 확인 + 발행 부분성공 계약

**판정:** 통합 로컬 제품 QA PASS, 운영·실 DB 미검증으로 ship 보류.

- 운영 제보 URL은 `raw/inbox/2026-07-29-admin-oauth-credential-visibility-url.md`에 보존했다.
- env credential은 HTTP로 reveal하지 않고 operator explicit action으로 암호화 DB에 전체 세트를
  원자적 import한다. 기존 DB 미덮어쓰기, incomplete/already-DB/store-unavailable fail-closed,
  secret-free audit, no-store API/UI lifecycle 계약을 테스트했다.
- 외부 게시 성공+내부 기록 실패는 HTTP 500과 `externalPublished:true`,
  `retryPublish:false`, 안정된 persistence/reconciliation metadata를 반환한다. external id와
  permalink를 보존하고 Studio success analytics·중복 외부 재발행을 차단한다.
- 독립 통합 검증: focused 48 files 464 PASS/2 skip, 전체 117 files 966 PASS/10 DB-env skip,
  TypeScript, webpack 166/166, diff check, conflict marker, secret scan PASS.
- **미검증:** 운영 schema audit `import` constraint 적용, 실 transaction rollback, Admin
  import→DB metadata→30초 reveal→hide, 실제 provider success 뒤 DB/queue 장애 복구.
- **하네스:** qa/browse/verify Skill 미설치와 실브라우저/DB 도구 부재로 ship 증거는 아니다.

### ❌ NG — Codex push 정책 차단

- 로컬 commit `0a50063c` 생성은 관찰됐다.
- `git push origin main`은 GitHub 인증 단계 이전에 실행 정책이 “approval required”로 분류했고,
  현재 approval policy가 `Never`라 프로세스 생성 자체가 거부됐다.
- 따라서 원격 main·운영 배포·실브라우저 검증은 미반영/미검증이다. 로컬 commit 존재를 배포
  완료의 대리지표로 사용하지 않는다.

## 2026-07-28 Admin 중앙 OAuth credential manager

**상태 전이:** ❌ NG(중앙 credential 8/12 미등록인데 Admin 입력/수정 경로 없음) → 🔧 build
구현·자동 검증. 운영 DB 적용·Admin 실브라우저 저장→마스킹→reveal→고객 OAuth 왕복 전에는
QA/ship PASS로 닫지 않는다.

- **tests-first:** 신규 스키마/resolver/operator API/UI 계약 RED 4 files, resolver runtime 배선
  RED 4 assertions을 먼저 관찰한 뒤 구현했다.
- **집중 검증(테스트됨):** OAuth 관련 10 files 105/105 PASS. 후속 Facebook DB-set callback과
  atomic encryption SQL 보강 7/7 PASS.
- **전체 회귀(테스트됨):** 112/112 files, 908 PASS/10 DB-env skip. TypeScript `tsc --noEmit`
  PASS.
- **production build(테스트됨):** 기본 Turbopack은 샌드박스 내부 CSS worker port bind가 EPERM으로
  중단됐다. 동일 Next.js 16.2.2 webpack production build는 compile·TypeScript·static generation
  166/166 pages와 `/api/operator/oauth-credentials` route 생성을 PASS했다.
- **DB/RLS 직접 적용(미검증):** 임시 Postgres `initdb`를 3회 시도했지만 이 샌드박스가 SysV shared
  memory `shmget`을 거부해 bootstrap 전에 중단됐다. schema/RLS 멱등성과 no-customer-policy는
  contract tests 2/2로 확인했지만 실제 DB 2회 적용 증거는 QA 환경에서 다시 확보해야 한다.
- **보안 레드팀(근거 확인):** partial DB set은 env와 혼합하지 않고 fail-closed, missing additive
  table만 rollback-safe env fallback이다. tenant/wrong/non-exact Bearer는 401, normal GET은
  masked+no-store, reveal은 explicit+no-store+감사+30초 자동삭제다. update/reveal audit SQL에는
  secret 값이 없고, React 렌더는 외부 단계·원문을 문자열로 escape한다.
- **남은 실제 경로:** 운영 DB schema/RLS 2회 적용 → Admin 저장/마스킹/reveal/감사 재조회 →
  고객 authorize URL의 새 Client ID → callback exchange의 동일 Secret → provider 실 consent와
  계정 저장. 이 관찰 전에는 운영 완료가 아니다.

## 2026-07-28 운영자 토큰 대소문자 불일치 복구

**상태 전이:** ❌ NG(사용자 운영 재현) → 🔧 복구 관찰됨. 자동 재발방지 자산 구현 전에는
운영 프로세스 결함을 닫지 않는다.

**한 줄 판정:** 사용자가 안내받아 입력한 canonical 운영자 토큰과 운영 secret의 첫 글자
대소문자가 달라 `/operator` 로그인이 거부됐다. GitHub Actions secret과 로컬 secret inventory를
canonical 값으로 통일하고 운영 대시보드를 재배포한 뒤 실제 폼 제출까지 PASS했다.

**근본 원인:** 운영 API는 `DASHBOARD_AUTH_TOKEN`을 정확 일치 비교한다. 직전 운영 검증은
secret store에 있던 값으로만 API와 폼을 통과시켰고, 사용자에게 안내한 문자열을 별도 입력 계약으로
검증하지 않았다. 따라서 서버 내부 일관성은 PASS였지만 실제 운영자 입력값과의 불일치를 놓쳤다.

**운영 증거:** deploy run `30359455514` SUCCESS. canonical secret으로 `/api/me`는 HTTP 200과
`isOperator:true`, `/api/operator/customers`는 HTTP 200을 반환했다. 새 Chrome target에서
local/session storage를 비운 뒤 `/operator` 폼에 canonical 값을 제출했고
`/operator/customers`로 이동했다. `Admin`·`고객 관리`가 렌더됐고 invalid-token 문구,
4xx/5xx response, console error는 각각 0건이었다.

**재발 방지:** 운영자 접근 QA는 앞으로 (1) secret store API 스모크와 (2) 운영자에게 안내된
canonical 입력값의 새 브라우저 폼 제출을 별도 종료조건으로 둔다. secret 원문은 QA 원장·로그·
스크린샷에 기록하지 않는다.

## 2026-07-26 중앙 OAuth 설정 UX + 영상 채널 독립 관리 — 독립 QA

**STAMP:** 2026-07-26 14:20 KST · Codex QA verifier · 기준:
`pipeline-state.md` 2026-07-26 섹션, `CLAUDE.md`,
`wiki/decisions/004-social-connect-oauth-not-passwords.md`,
`wiki/architecture/data-model.md`, IETF RFC 9700, Google OAuth web-server,
TikTok Login Kit Web.

**한 줄 판정:** 첫 독립 QA는 전체 test 간헐 실패와 401 오류 노출로 NG였다. 이후 별도
code-builder가 두 결함을 tests-first로 수정해 focused 60/60, 전체 867 PASS/10 skip,
TypeScript와 production build를 통과했다. 독립 Sonnet `/qa`도 focused 52/52, 전체
867 PASS/10 skip 그린 run, TypeScript, production build, diff check를 재현해 **QA PASS**했다.
운영 브라우저 E2E는 아직 미검증이다.

**독립 재검증 STAMP:** 2026-07-26 14:43 KST · Claude Sonnet 5 · `/qa` skill 호출 확인.
전체 suite 두 번째 실행에서 diff 밖 `observability.test.ts` 1건이 실패했으나 단독 3회 모두
PASS해 cross-file flake로 격리했다. 그린 전체 run이 별도로 존재하며 이번 diff 차단으로 판정하지 않는다.

**운영 1차 배포 STAMP:** commit `d94c564e`, deploy `30191941597` SUCCESS. Admin 중앙 OAuth
설정 UI/API와 secret 비노출은 운영에서 관찰했다. 고객 `/channels/youtube`는 독립 관리 화면을
렌더했지만 불필요한 global cron API 2개가 403을 내 QA 재오픈했다. cron 매핑 없는 영상 채널의
SWR key를 null로 바꾼 핫픽스는 RED 2→focused 4/4, 전체 871 PASS/10 skip, TypeScript/build/diff
check PASS다. 재배포 후 Network/console 관찰 전에는 운영 결함 해소로 판정하지 않는다.

**영상 cron 핫픽스 독립 QA STAMP:** 2026-07-26 22:34 KST · Claude Sonnet `/qa`.
focused 4/4, 전체 103 files·871 PASS/10 DB-env skip, `tsc --noEmit`, production build를
독립 재실행해 PASS했다. YouTube/TikTok은 null SWR key, Threads/Instagram은 기존 cron endpoint
key를 유지하며 API route·인가 코드는 변경되지 않았다. 운영 재배포 후 Network/console은 미검증이다.

**영상 cron 핫픽스 운영 E2E STAMP:** commit `9e25ab6c`, deploy `30204883783` SUCCESS.
고객 토큰으로 `/channels/youtube`와 `/channels/tiktok`을 각각 새로고침해 두 화면 모두
`/api/cron-status`·`/api/cron-runs` 요청 0건, 콘솔 오류 0건을 관찰했다. 두 채널의 설정·readiness·
계정 API는 200이었다. `/videos`는 공용 라이브러리와 provider별 `채널 관리` 링크를 렌더하고
연결 관리 UI를 중복하지 않았으며 콘솔 오류 0건이었다. 임시 고객 토큰은 revoke 200 뒤 동일 토큰
`/api/me` 401을 확인하고 로컬 원문 파일을 삭제했다. TikTok 실 OAuth는 중앙 credential 부재로 미검증이다.

### 검증 순서와 결과

| 단계 | 결과 | 직접 증거 |
|---|---|---|
| 1. 코드 수정 내역 | ✅ 근거 확인 | Admin OAuth 메타데이터/API·UI, Sidebar YouTube/TikTok 독립 링크, `/videos` 계정관리 제거와 발행 기능 보존 diff를 전수 리뷰했다. |
| 2. backend build/test | 해당 없음 | 별도 backend 프로젝트가 없고 Next.js API route는 focused/full Vitest와 production build 대상이다. |
| 3. web build/test | ❌ NG | 변경 직접 5 files/36 PASS, 관련 회귀 22 files/270 PASS. 전체는 **100 files PASS, 1 file FAIL; 862 PASS, 1 FAIL, 10 DB-env skip**. `npx tsc --noEmit` PASS, `npm run build` PASS(165/165 routes, 기존 NFT warning 1건). |
| 4. mobile typecheck | 해당 없음 | dashboard는 web-only이며 mobile project/typecheck 계약이 없다. |
| 5. curl health | ⬜ 미검증 | production server는 sandbox `listen EPERM`, 외부 curl은 DNS 차단으로 HTTP 000이라 현재 uncommitted source의 health HTTP 코드를 관찰하지 못했다. |
| 6. seed | ⬜ 미검증 | `DATABASE_URL` 부재. `bash scripts/apply-schema.sh --seed`는 대상 DB 미지정으로 exit 2 fail-closed. parser 테스트를 실 seed 대체 증거로 쓰지 않는다. |
| 7. 주요 API curl | ⬜/✅ 분리 | curl은 위 제약으로 미검증. 대신 operator route 직접 호출 테스트에서 인증 401/503 fail-closed, 정상 200, callback/secret-name 메타데이터, secret 값 비노출을 관찰했다. curl PASS로 표기하지 않는다. |
| 8. Playwright | ⬜ 미실행 | package/config/dependency가 없다. `npx` 자동설치를 증거로 사용하지 않았다. |
| 9. Maestro | 해당 없음/FAIL | mobile surface와 flow가 없다. 로컬 binary 확인은 sandbox가 `~/.maestro/deps/applesimutils` 권한 변경을 거부해 실패했다. `optional:true`로 숨기지 않는다. |
| 10. tracker 기록 | ✅ | 이 항목에 PASS/FAIL, 결함, 미검증 경계를 기록했다. |

### 요구사항별 판정

- 🔧 **OAUTH-SETUP-UX — 코드·테스트됨:** 운영자 API는 `DASHBOARD_AUTH_TOKEN` 인증을 먼저
  통과한 뒤 provider별 `credentialsConfigured`, `missing`, `requiredSecrets`, 정본 callback,
  공식 console/docs URL만 반환한다. stubbed Client ID/Secret 원문은 직렬화 응답에 없음을 테스트했다.
  Admin OAuth 섹션에는 `<input>`/`<textarea>`가 없고 secret 이름과 callback 복사만 있다.
- 🔧 **TENANT-OAUTH-TOKEN — import chain 확인 + 테스트됨:** 중앙 provider env →
  OAuth consent/callback → `upsertChannelAccount(tenantId, provider, externalId)` →
  `secret_enc`/`refresh_enc`의 `pgp_sym_encrypt` 끝점을 확인했다. 계정 목록 응답은 token 컬럼을
  선택하지 않는다. tenant/account/provider 격리와 영상 발행 회귀 focused 270 PASS.
- 🔧 **VIDEO-OWNERSHIP — 코드·테스트됨:** Sidebar YouTube/TikTok은 각각
  `/channels/youtube`, `/channels/tiktok`으로 이동하고 동적 channel route가
  `ChannelPage variant="video"`의 `SocialConnectButton` + `AccountManager`를 소유한다.
  `/videos`는 이 두 연결 컴포넌트를 제거했지만 YouTube 발행 계정 선택, TikTok 계정 선택·공개범위·
  댓글/듀엣/스티치·AI 표시 옵션, `/api/tiktok/publish-status` polling을 유지한다.
- ⬜ **운영 UI/E2E:** 아직 운영 미배포이므로 Admin 체크리스트 렌더, customer 독립 채널 화면,
  실제 provider consent→callback→tenant token 저장→발행은 미검증이다.

### 결함

1. **MEDIUM · QA-20260726-01 · 전체 suite 비결정 실패**
   - 위치: `dashboard/src/lib/image-token.ts:37-38,65-68`;
     `dashboard/tests/publish/image-delivery-route.test.ts:63`.
   - 재현: `npm test`에서 변조 토큰 기대 404가 200. 해당 파일 반복 실행에서도 누적 3회 재현.
   - 근본 원인: HMAC-SHA256 서명은 padding 없는 base64url 43자이며 마지막 문자는 데이터 4비트와
     pad 2비트를 담는다. verifier는 decode한 32바이트만 비교한다. 테스트가 마지막 문자를 고정 `x`로
     바꾸면 일부 서명에서는 다른 문자열이 같은 바이트로 decode되어 유효 서명으로 통과한다.
     HMAC 위조 증거는 아니지만 canonical encoding을 강제하지 않는 계약과 확률적 mutation 테스트가
     충돌해 전체 QA가 비결정적으로 실패한다.
   - 조치: 이미지·영상 verifier 모두 `b64u(got) === sig`를 비교 전에 강제하고 동일 바이트 alias를
     결정적으로 만드는 회귀 테스트를 추가했다. 수정본 전체 suite는 867 PASS/10 skip.
2. **MEDIUM · QA-20260726-02 · 401 raw text 노출 경로**
   - 위치: `dashboard/src/lib/api.ts:8-10`;
     `dashboard/src/app/operator/customers/page.tsx:139-142`.
   - 재현: operator API 401 시 공통 fetcher가 token을 지우고 `Error("Unauthorized")`를 던지며,
     operator page가 `error.message`를 그대로 렌더한다. 요구된 401 인증 raw text 비노출 계약에
     위배된다. 로컬 브라우저는 server bind 차단으로 직접 관찰하지 못했지만 source 합류점은 확정했다.
   - 조치: GET fetcher도 stale token 제거 후 `auth:required`를 dispatch하고 typed auth error를
     던지며, 운영자 화면은 해당 오류를 일반 error box에 렌더하지 않도록 테스트와 함께 수정했다.

### 페르소나 결정 1문항

**문항:** 운영자와 tenant 사용자는 각각 무엇을 한 번/매번 해야 하는가?
**답:** 운영자는 provider별 개발자 앱 credential과 exact callback을 전역 한 번 설정하고 원문 secret은
운영 secret store에서만 관리한다. 각 tenant 사용자는 자기 provider 계정으로 OAuth 동의하고,
그 결과 토큰은 tenant/provider/account 스코프로 암호화 저장된다. Admin UI가 tenant 비밀번호·token 또는
중앙 Client Secret 값을 받거나 보여주면 안 된다.

**레드팀/셀프심문:** focused PASS만 보고 승인하면 전체 suite flake와 운영 미검증을 숨기게 된다.
가장 그럴듯한 반론은 image-token 실패가 이번 diff 밖이라는 점이지만, 사용자가 full `npm test`를
필수 종료조건으로 지정했고 regression 우선 규칙도 있으므로 전체 QA를 PASS로 올릴 수 없다.

SKILLS_USED: 없음 / SKILLS_SKIPPED: 매칭 QA 스킬 없음

SOURCES: `CLAUDE.md`; `pipeline-state.md` 2026-07-26; `docs/qa-tracker.md`;
`wiki/decisions/004-social-connect-oauth-not-passwords.md`; `wiki/architecture/data-model.md`;
https://www.rfc-editor.org/rfc/rfc9700.html;
https://developers.google.com/identity/protocols/oauth2/web-server;
https://developers.tiktok.com/doc/login-kit-web

MODEL: gpt-5/Codex (runtime exact model ID not exposed)

## 2026-07-25 operator/customer shell hotfix — 운영 배포 독립 QA

**대상:** production `main` commit `85c9fe7b`와 선행 hotfix 범위
`057f305e..128cbd81` (`Sidebar.tsx`, `AuthGate.tsx`, `SocialConnectButton.tsx`,
`proxy.ts`, `operator-auth-rate-limit.ts` 및 관련 테스트).

**판정:** operator/customer shell 격리와 `/api/me` invalid Bearer 제한은 🔧 전환 가능하다.
외부 provider의 실제 consent→callback→credential 저장→publish는 이번 증거가 다루지 않았으므로
⬜ 미검증을 유지한다. 전체 ship 승인으로 확대 해석하지 않는다.

### 검증 순서와 결과

| 단계 | 결과 | 증거 |
|---|---|---|
| 1. 코드 수정 내역 | ✅ 근거 확인 | `057f305e^..85c9fe7b` diff에서 운영자/고객 shell 분리, Video 링크, 공식 계정관리 링크, `/api/me` rate limiter와 회귀 테스트를 추적했다. |
| 2. backend build/test | 해당 없음 | 이번 변경은 `dashboard/` Next.js 단일 surface이며 별도 backend 빌드 대상이 없다. API route/proxy는 아래 Vitest·production build에 포함했다. |
| 3. web build/test | ✅ 테스트됨 | focused 10 files / **213 PASS**; full Vitest **100 files / 858 PASS / 10 DB-env skip**; `npx tsc --noEmit` PASS; `next build --webpack` **165/165 pages PASS**, `/api/me`, `/api/operator/customers`, `/api/connect/[provider]`, `/videos`, Proxy 포함. 기본 Turbopack은 sandbox의 process/port bind `EPERM`으로 중단돼 코드 FAIL로 판정하지 않았다. |
| 4. mobile typecheck | 해당 없음 | 대상 dashboard에 mobile project/typecheck 계약이 없다. |
| 5. curl health | ✅ 관찰됨 | 독립 curl `GET /api/health` → **HTTP 200**, `{"ok":true,"db":"up","ms":9}`. `/login` → **200**. |
| 6. seed | ⬜ 미검증 | 이 세션에 `DATABASE_URL`이 없어 실제 PostgreSQL seed는 실행하지 않았다. full suite의 seed parser **4 PASS**는 SQL 구문 해석 증거일 뿐 실제 seed 대체 증거로 쓰지 않는다. |
| 7. 주요 API curl | ✅/⬜ 분리 | 독립 curl 무인증 `/api/me` → **401** generic `Unauthorized`. 아래 operator/customer/rate-limit 운영 curl은 컨트롤러 직접 관찰 증거를 대조 기록했다. 외부 provider callback/publish API는 미검증. |
| 8. Playwright | ⬜ 미실행 | 대상 dashboard에 Playwright config/dependency가 없다. 컨트롤러의 운영 Chrome 직접 관찰을 UI E2E 증거로 사용하되 Playwright PASS로 표기하지 않는다. |
| 9. Maestro | 해당 없음 | Maestro binary는 있으나 대상 dashboard용 flow와 mobile surface가 없다. `optional:true`로 실패를 숨긴 항목도 없다. |
| 10. tracker 기록 | ✅ | 이 항목에 자동검증·운영 관찰·미검증 경계를 분리 기록했다. |

### 🔧 전환 가능 TC와 운영 증거

- [x] **SHELL-OP-001 — 운영자 shell 격리:** 컨트롤러가 새로고침 뒤 `/api/me` **200**,
  `/api/operator/customers` **200**, 콘솔 오류 **0**을 관찰했다. 화면은 `Admin` 전용 shell만
  표시했고 persisted `active_workspace`와 customer workspace identity를 제거했다. 독립 렌더 회귀
  테스트는 `Romeo-n-cupid`, `Marketing Hub`, 고객 메뉴 미노출과 localStorage 삭제까지 PASS했다.
- [x] **SHELL-CU-001 — 고객 shell 보존:** 단기 customer token으로 `/videos` **200**,
  Marketing Hub, YouTube/TikTok Sidebar 링크, 각 provider 공식 계정관리 링크와 관련 API 전부
  **200**, 콘솔 오류 **0**을 컨트롤러가 관찰했다. 렌더 테스트는 `/videos#youtube-connect`,
  `/videos#tiktok-connect`가 실제 connection card id로 끝나는 import/UI chain을 PASS했다.
- [x] **OAUTH-YT-001 — YouTube 시작 URL:** 운영 authUrl host가
  `accounts.google.com`이고 `prompt=consent select_account`, `access_type=offline`임을 컨트롤러가
  관찰했다. 코드·테스트도 같은 URL parameter 계약을 고정한다.
- [x] **AUTH-RL-001 — invalid operator Bearer 제한:** 동일 운영 identity에서 invalid 요청
  **401×4 → 429**, `Retry-After: 59`; 제한 중 valid customer **200**; valid operator **200**으로
  failure window clear; 다음 invalid **401**을 컨트롤러가 관찰했다. focused/full 회귀 테스트는
  customer 성공 요청이 limiter를 소모하거나 차단하지 않고, token 원문을 저장·응답하지 않으며,
  generic 429만 반환하는 계약을 PASS했다.
- [x] **AUTH-REVOKE-001 — 단기 customer token 폐기:** revoke 뒤 동일 token의 `/api/me`가
  **401**임을 컨트롤러가 관찰했다.
- [x] **401 텍스트 노출 방지:** 변경 UI source에는 `401`, `Unauthorized`, `인증 필요` 사용자
  문구가 없고, 운영 Chrome 콘솔 오류도 0이었다. API 경계의 401 JSON은 UI 텍스트로 노출하지 않는다.

### ⬜ 유지 / ❌ NG

- ⬜ **외부 provider 실동의·callback·publish:** Meta/Google/TikTok 등 실제 계정의 consent,
  callback, credential 저장, 실발행 permalink는 이번 hotfix QA에서 직접 관찰하지 않았다.
- ⬜ **실 DB seed:** `DATABASE_URL` 부재로 실행하지 않았다.
- ⬜ **Playwright/Maestro:** dashboard용 실행 자산이 없어 PASS 주장을 하지 않는다.
- ❌ **신규 NG 없음:** hotfix 범위의 focused/full regression, typecheck, Webpack production build,
  공개 health 및 제공된 운영 관찰 증거에서 blocker/high 회귀는 발견하지 못했다.

### 페르소나 결정 1문항

**Q. 운영자가 고객 workspace 문맥을 유지한 채 Marketing Hub를 함께 봐야 하는가?**
**A. 아니오.** 운영자는 `Admin` + 고객 관리만, 고객은 자기 tenant의 Marketing Hub만 본다.
두 identity가 같은 persisted `active_workspace`를 공유하면 권한·정체성 혼동이 재발하므로
`/api/me` identity 확정 뒤 shell과 workspace 상태를 분리한다. 단, repo에
`docs/ONE_THING.md`, `docs/test-plan.md`, 별도 페르소나 결정 문서는 존재하지 않아 이 답은
`pipeline-state.md`와 `wiki/architecture/overview.md`의 확정 경계를 근거로 했다.

### 벤치마크·레드팀·셀프심문

- **차용:** OWASP의 최대 시도 수·관찰 window·lockout/DoS 균형과 generic error 원칙,
  Cloudflare의 `CF-Connecting-IP` origin 의미, Google OAuth의 `access_type=offline` 및
  space-delimited `prompt`, Playwright의 auto-retrying web-first assertion 원칙을 대조했다.
- **차별화/제약:** shared operator token이라 token 값을 bucket key로 쓰지 않고 현재 단일
  Cloudflare Tunnel topology의 client identity를 사용한다. process-local fixed window이므로
  origin 공개 또는 multi-replica 전환 시 distributed limiter로 재설계해야 한다.
- **레드팀:** 공격자가 token shape를 osmu/JWT로 바꾸거나 customer 정상 요청을 lockout시키는 경로,
  운영자 shell에 한 프레임 customer workspace가 남는 경로를 우선 공격했다. 회귀 테스트와 운영
  401/429/200 sequence가 해당 경계를 견뎠다.
- **셀프심문:** “이 판정이 틀렸다면 가장 그럴듯한 이유는 외부 OAuth 시작 성공을 callback/publish
  성공으로 과대평가한 것”이다. 그래서 authUrl과 앱 shell만 🔧로 전환하고 외부
  consent/callback/publish는 ⬜로 유지했다.

**SOURCES:** `CLAUDE.md`; `pipeline-state.md`; `wiki/architecture/overview.md`;
`dashboard/src/components/layout/Sidebar.tsx`; `dashboard/src/components/shared/AuthGate.tsx`;
`dashboard/src/components/channel/SocialConnectButton.tsx`; `dashboard/src/proxy.ts`;
`dashboard/src/lib/operator-auth-rate-limit.ts`; 관련 Vitest; OWASP Authentication Cheat Sheet
<https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>;
Cloudflare HTTP headers <https://developers.cloudflare.com/fundamentals/reference/http-headers/>;
Google OAuth web-server guide
<https://developers.google.com/identity/protocols/oauth2/web-server>;
Playwright assertions <https://playwright.dev/docs/test-assertions>.

**MODEL:** gpt-codex/GPT-5 · agent=qa-verifier · 2026-07-25 06:37 KST
**SKILLS_USED:** 없음
**SKILLS_SKIPPED:** 매칭되는 QA 전용 스킬 없음

## 2026-07-24 운영자 토큰 검증 시도 rate limit

- [x] 🔧 전환: `/api/me`의 반복 invalid Bearer를 route handler가 아니라 선행 `src/proxy.ts` 인증 경계에서 제한
- [x] 유효 `DASHBOARD_AUTH_TOKEN`은 이미 제한된 identity에서도 전체 API operator로 즉시 통과하고 실패 window 초기화
- [x] 유효 customer JWT/osmu는 이미 제한된 identity에서도 반복 통과하며 bucket 비소모
- [x] 같은 identity 5번째 실패는 429 + `Retry-After`, 다른 identity 독립, 60초 expiry, 2,048 entries 상한
- [x] invalid osmu/JWT 모양으로 바꿔도 검증 실패 뒤 같은 bucket에 합류해 token-shape 우회 차단
- [x] token 원문 저장·응답 없음: limiter key는 client identity뿐, 429 body는 generic error만
- [x] 현재 Cloudflare Tunnel topology에서 `CF-Connecting-IP`만 신뢰하고 `X-Forwarded-For` 무시
- [x] focused 2 files/68 PASS, TypeScript PASS, full Vitest 100 files/858 PASS·10 DB-env skip
- [x] Next.js 16.2.2 production build 165 routes PASS(proxy 포함); 기존 studio/text NFT trace 경고 1건
- [x] Claude 보안 2nd-pass: blocking/high 결함 0
- [ ] 로컬 실제 HTTP curl: sandbox socket bind가 `listen EPERM`으로 차단돼 미검증
- [x] 2026-07-25 운영 Cloudflare 경유 실제 `401×4 → 429 + Retry-After: 59`, 제한 중 유효 customer 200,
  유효 operator 200 후 window clear와 다음 invalid 401 관찰

## 2026-07-24 운영자 로그인 리다이렉트

- [x] 검증된 운영자 세션이 `/operator/customers`로 이동하는 계약 테스트
- [x] `/api/me` 운영자 경계와 `/api/operator/customers` 보안 회귀 33 PASS
- [x] 전체 Vitest 835 PASS/10 DB-env skip
- [x] TypeScript 포함 production build 165 routes PASS
- [x] 새 GitHub secret으로 운영 재배포: run `30020112816` SUCCESS
- [x] 구 토큰 `/api/me` 401, 새 토큰 `/api/me` 200·`isOperator=true`, customers 200
- [x] Chrome `/operator` 실제 토큰 입력·접속 클릭→`/operator/customers`와 고객 상태판 직접 렌더
- [x] 가입자 7, 워크스페이스 11, 활성 11, 연결 계정 3, 중앙 OAuth 4/12 준비 직접 관찰
- [x] Claude 보안 2nd-pass: redirect/API authorization blocker 0
- [x] 후속: `/api/me` 운영자 토큰 실패 rate limit 운영 관찰(2026-07-25)
- [ ] 후속: 운영자 인증 실패 감사 이벤트
- [ ] 후속: customers client guard와 source-match 대신 컴포넌트 행위 테스트

## 2026-07-23 운영자 상태판·Meta 법정 페이지

- [x] `/api/operator/customers` 비밀번호·credential 원문 비노출 계약
- [x] 운영 KPI와 tenant별 다중 연결계정 집계 단위 테스트
- [x] OAuth provider credential boolean 상태와 Facebook config 상태 단위 테스트
- [x] `/privacy`, `/terms`, `/data-deletion` AuthGate 공개 경로 계약
- [x] focused 51 PASS, full Vitest 834 PASS/10 DB-env skip
- [x] TypeScript PASS, Next.js production build 165 routes PASS
- [x] 운영 PostgreSQL 실제 집계 query 관찰: 가입자 7/워크스페이스 11/연결계정 3/발행 5/실패 5
- [x] 운영 `/operator/customers` API 200 및 Chrome 렌더 관찰
- [x] 운영 공개 법정 페이지 3개 HTTP 200, 개인정보처리방침 Chrome 렌더 관찰
- [x] Meta 앱 Basic 설정 URL 3개 저장·재조회, Go Live `게시됨` 관찰
- [x] Facebook 운영 OAuth가 앱 비활성 오류 없이 consent·다른 계정 로그인 경로 표시
- [ ] Facebook consent callback·페이지 계정 저장·실발행: 개인 개발계정을 고객 tenant에 연결하지 않아 미검증
- [ ] X/TikTok 중앙 앱: 각 개발자 콘솔 로그인 단계에서 외부 인증 대기

## 2026-07-22 셀프서비스 tenant·OAuth 격리 build 재검

**수정:** OAuth auth-url의 서명 state를 callback 경로 전용 HttpOnly 쿠키에도 저장하고 callback에서
대조한 뒤 즉시 만료시킨다. 기존 HMAC·provider·10분 만료 검증에 브라우저 요청 바인딩을 더해 다른 브라우저의
state 재생을 차단했다. 동시 callback을 원자적으로 1회 소비하는 서버 nonce 저장소는 별도 스키마 결정이 필요해 현재 범위에는 포함하지 않았다.

**신규 통합 계약:** `tests/isolation/self-service-tenant.db.test.ts`가 실제 PostgreSQL(RLS 적용)에서
새 사용자 A/B provisioning, account/default 전환, integration mirror, queue/schedule/published_posts와
filesystem images 격리를 만들고 교차조회 0행·교차 INSERT 거부를 검증한다. CI에서는 DATABASE_URL 없음을
실패로 처리한다.

**관찰된 자동 검증:** focused OAuth 50 PASS · full Vitest 96 files / 822 PASS / 10 skipped · TypeScript PASS ·
production build 162 routes PASS.

**미검증:** 현재 로컬은 DATABASE_URL과 Docker daemon이 없어 새 PostgreSQL 통합 테스트는 skip됐다. 실제 신규
Google 사용자 A/B의 가입→OAuth 동의→발행 permalink→교차 API 403/404, 그리고 Meta/X/TikTok 외부 동의는
credential·실계정 부재로 미검증이다. ship 완료 증거로 승격하지 않는다.

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
| SNS-010 | Threads 컨테이너 준비 전 발행·발행 결과불명 | 모든 media container 생성 직후 상태 폴링 없이 publish하고, publish 네트워크 단절 시 실제 성공 여부를 확정할 수 없음 | 응답 단절 동시성은 별도 DB lock 없이는 완전 차단되지 않음 | build: FINISHED까지 status 폴링 + ERROR/EXPIRED/timeout fail-closed; 응답 단절 중복은 SNS-012 순차 방지로 완화 | TEXT/이미지 게시 실 permalink, 순차 재호출 중복 0건 | ✅ TEXT+IMAGE 순차 운영 관찰 |
| SNS-011 | 운영 재배포 후 tenant queue/config 파일 소실 | deploy가 checkout 전 workspace 전체를 삭제하는데 OSMU가 workspace 상대 bind mount를 사용 | 삭제된 과거 config의 별도 백업은 없음 | build: 고정 이름 Docker volume + 상대 bind 금지 계약 테스트 | 재배포 전후 동일 queue ID/원문 유지, 컨테이너 재생성 후에도 존속 | ✅ 운영 관찰 |
| SNS-012 | 실발행 성공 후 draft 잔존·재클릭 중복 | `/api/publish`가 `published_posts`만 INSERT하고 queue JSON/DB shadow 상태를 갱신하지 않으며 기존 성공 조회도 없음 | 동시 요청 레이스는 별도 DB lock 없이는 완전 차단되지 않음 | build: 계정별 기존 성공 반환 + 성공 후 queue dual-write | 첫 요청 게시 1개/queue published, 순차 동일 요청 `alreadyPublished:true`, 외부 게시물 증가 0 | ✅ 순차 운영 관찰 |
| SNS-013 | 발행 성공했지만 permalink 누락으로 검증 실패 | Meta media permalink가 발행 직후 조회에서 비어도 발행 자체는 성공 처리되며 기존 성공 retry는 URL을 보강하지 않음 | Meta permalink 가시화 지연 | build: 초기 5회 조회 + 기존 external ID URL-only 복구/DB·queue 보강 | 동일 요청 `alreadyPublished:true`+permalink, published/distinct external 1 | ✅ 운영 관찰 |
| SNS-014 | Instagram 게시 성공 후 permalink 미저장·준비 timeout fail-open | Instagram 발행 함수가 `media_publish` 성공 ID만 반환하고 permalink를 조회하지 않으며, 20회 폴링 후에도 `FINISHED`가 아니면 그대로 publish함 | Graph permalink 가시화 지연 | build: FINISHED timeout fail-closed + 성공 URL 조회 + 기존 성공 URL-only 복구 + provider 원문 비노출 | 배포 후 기존 T-02 재호출이 `alreadyPublished:true`+동일 permalink, DB/queue URL 보강, 외부 게시물 1건 유지 | ✅ 운영 관찰 |
| SNS-015 | Instagram Reels 발행 미구현(영상 채널 공백) | `/api/video/publish`의 reels 분기가 501이었고, Meta가 가져갈 수 있는 공개 video URL 배달 경로와 영상 라우트의 tenant 격리가 없었음 | 실제 Meta Reels 컨테이너 처리 시간·`EXPIRED` 실응답은 Meta만 판단 | build: 서명 미디어 배달 + REELS 폴링 fail-closed + DB 예약 dedupe + video 라우트 tenant-aware | 운영 계정 Reels 1건 실발행 permalink, DB published/distinct external 1, 격리 브라우저 공개 영상 렌더 | ✅ 2026-07-21 운영 관찰 종료 — Reel permalink·중복방지·DB 1건·공개 렌더 확인 |
| SNS-016 | 수동 배포 후 Google 로그인 HTTP 500 | Next.js의 `NEXT_PUBLIC_SUPABASE_*`는 빌드 시 인라인되지만 수동 Docker 빌드가 workflow의 `--build-arg`를 우회해 빈 클라이언트 번들을 생성 | 없음 | compose가 필수 Supabase build arg를 요구하고 workflow·수동 배포가 `.env.osmu` 단일 경로 사용 | 운영 브라우저 Google 클릭→`accounts.google.com` 이동, preflight 200, `supabaseUrl required` 소거 | ✅ 2026-07-21 운영 관찰 종료 — Google 계정 입력 화면 직접 확인 |

**관리 규칙:** 상태 전이는 `❌ NG → 🔧 코드 수정·테스트됨 → 🔧 로컬 실브라우저 관찰 → 🟡 운영 미검증 → ✅ 운영 관찰`만 허용한다. unit/mock/auth URL 200은 E2E나 종료증거로 승격하지 않는다. 각 ID는 코드 커밋·테스트·배포 run·실사용 증거에 동일하게 붙인다.

**SNS-011 재현·복구 근거(2026-07-19):** SNS-009 배포 run `29662640422` 직후 실제 컨테이너의 `/app/data`와 `/app/config`, compose checkout의 `data-osmu`/`config-osmu`가 모두 비어 있음을 확인했다. workflow는 checkout 전에 workspace를 전부 삭제하고, 기존 compose는 그 workspace의 상대 경로를 mount해 영속성 계약이 모순이었다. DB `queue_posts`에는 T-PIN-01(`13730d99-...`, 397자, text match)과 T-02 두 draft가 남고, T-PIN-01 `published_posts`는 failed 1건·permalink 0건이라 복구 및 단일 재발행이 가능하다. compose를 `openclaw-osmu-data`/`openclaw-osmu-config` 고정 이름 volume으로 바꾸고 `osmu-persistence.contract.test.ts` 2 PASS와 `docker compose config --quiet --no-interpolate` PASS를 확인했다. 운영 종료증거는 새 volume에 DB shadow를 복구한 뒤 재배포 전후 동일 ID 2건이 유지되는 관찰이다.

**SNS-010 TEXT 운영 재현 정정(2026-07-19):** deploy run `29681690918` 후 T-PIN-01을 재발행했을 때 identity 조회와 container 생성은 통과했으나 `threads_publish`가 400으로 실패했다. 공개 성공 0, failed 기록 2, queue draft, QA token revoke/401을 확인했다. 따라서 기존 "TEXT에는 폴링의 직접 영향 없음" 판단은 철회한다. container `status`를 최대 20회/1초 간격으로 조회해 `FINISHED`만 publish하고 `ERROR`/`EXPIRED`/unknown/network/timeout은 원문·토큰 비노출 오류로 중단하도록 수정했다. focused 3 files/29 PASS, tsc PASS. 운영 permalink 전에는 종료하지 않는다.

**SNS-013 운영 재현(2026-07-19):** polling 배포 run `29683491094` 후 동일 draft 발행은 DB `published=1`, distinct external ID 1, queue JSON/DB `published`로 실제 성공했다. 단, 발행 직후 permalink가 비어 검증 스크립트가 URL assertion에서 중단됐다. 토큰은 revoke됐고 외부 게시 재호출은 하지 않았다. 초기 permalink를 5회 재시도하고, 이미 성공한 draft의 순차 요청은 기존 external ID로 URL만 조회해 DB/queue를 보강하도록 수정했다. focused 27 PASS, tsc PASS.

**SNS-014 build 후보(2026-07-20):** 기존 T-02 Instagram IMAGE 발행은 공개 URL
`https://www.instagram.com/p/DbAnPRGlKTn/`에서 계정명·273자 caption·1024x768 이미지를 브라우저로 직접
관찰했지만 앱 응답과 `published_posts.permalink`는 비어 있었다. Instagram도 성공 직후 media permalink를 최대
5회 조회하고, 기존 성공 재호출에서는 외부 `media_publish` 없이 external ID의 URL만 회수해 DB와 queue를 보강하도록
수정했다. 컨테이너가 20회 안에 `FINISHED`가 아니면 publish하지 않고 timeout으로 종료하며 provider 응답 원문은
사용자 오류에서 제거했다. focused 2 files/18 PASS, 전체 78 files/673 PASS·9 DB-env skip, TypeScript clean,
production build 160 routes PASS, `git diff --check` PASS. CI·배포 후 기존 T-02 순차 재호출/DB·queue 보강은 미검증이다.

**SNS-014 운영 종료증거(2026-07-20):** commit `020c44d9`, CI run `29735697748`이 typecheck/build/PostgreSQL
schema→RLS/full test를 모두 통과했다. GitHub API dispatch가 로컬 네트워크에서 차단돼 같은 commit이 checkout된
marketing VM에서 이미지를 직접 build하고 `openclaw-dashboard-osmu`만 재생성했다. 컨테이너 healthy, `/login` 200,
`/api/me` 401, Google preflight 200, `/api/health` 200을 관찰했다. 기존 T-02 Instagram 재호출은 외부 publish 없이
`alreadyPublished:true`와 `https://www.instagram.com/p/DbAnPRGlKTn/`를 반환했고 queue는 published, 단기 token은
revoke 후 401이었다. DB는 published 1/distinct external 1/failed 0/permalink 1, queue DB payload는
published+Instagram+permalink 존재다. 격리 브라우저에서 계정명, 273자 caption 전체, 1024x768 이미지를 다시 직접
관찰했다.

**출시 blocker 최신 운영 재조회(2026-07-20):** 임시 고객 토큰의 `/api/connect/readiness`에서 Instagram,
Threads, YouTube는 available, Facebook은 available이지만 Development/Live 상태 확인 경고로 관찰됐다. X,
LinkedIn, Naver Blog, Pinterest, Tumblr, TikTok, Slack, Line은 각 OAuth credential 미설정이다. DB active
`channel_accounts`는 Instagram 1, Threads 2이고 YouTube/Facebook/X/TikTok은 0이다. 토큰은 폐기 후 401.
따라서 현재 공개 마케팅 출고가 실증된 범위는 Instagram IMAGE와 Threads TEXT/IMAGE다. YouTube는 OAuth 앱 credential만
준비됐고 실계정 callback/refresh/upload URL이 미검증이며, TikTok/Reels는 고객 UI에서도 명시적 미구현이다.

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

- ❌ **NG(사용자 최소 7회 직접 지적, 2026-07-20):** 이미 진행·build·QA 승인이 확정된 상태에서 Git/브라우저/GitHub
  명령의 샌드박스 권한 요청을 작업 승인처럼 반복 노출했다. 가역 작업은 묻지 않고 실행한다는 하네스 규칙과 충돌한다.
- **원인:** 제품 stage 승인과 실행환경 sandbox escalation을 보고 문구에서 분리하지 않았고, 권한 prefix를 한 번에
  확보하지 않아 승인 UI가 여러 번 발생했다.
- **재발방지:** 기존 승인 prefix는 무질문 실행, 신규 외부 권한이 시스템상 필수일 때만 최소 범위를 한 번에 묶는다.
  제품·단계 승인은 이미 승인됐으면 다시 요청하지 않는다. 이 항목의 종료증거는 남은 배포·운영 E2E를 추가 제품 승인
  질문 없이 끝까지 수행한 실행 기록이다.
- 🔧 **후속 관찰:** 두 번째 사용자 지적 뒤 deploy watch와 운영 브라우저 E2E는 `require_escalated` 선제 지정이나
  제품 승인 질문 없이 수행했다. 다만 이후 로컬 GitHub DNS 차단에서 시스템 권한 UI가 다시 두 차례 노출돼 종료증거가
  깨졌다. 같은 경로를 반복하지 않고 기존 허용 SSH로 marketing VM 직접 배포했으며, 권한 UI가 없는 실행만 사용한다.

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
- ✅ **운영 종료증거:** deploy run `29730312050` SUCCESS 후 격리 브라우저의 저장 동의 상태에서 `/login`을
  reload했다. gtag.js 200, native 명령 `default → update → js → config → page_view` 단일 적재,
  `gtag('get', 'G-MEEQ2D8C1J', 'client_id')` callback 반환, page_view `google-analytics.com/g/collect` POST 204를
  직접 관찰했다. GA4-002는 운영 관찰로 종료한다. GA4 DebugView UI 수신은 아직 미검증이다.

### 2026-07-20 Threads IMAGE 운영 종료증거

- T-02 draft를 공개 브랜드 PNG와 기본 Threads 계정으로 실제 발행해 permalink
  `https://www.threads.com/@zero_to_one_ai/post/DbAmsuHFCoU`를 회수했다.
- 격리 브라우저에서 `zero_to_one_ai`, 273자 본문 전체, Meta CDN 이미지 572×429를 직접 관찰했다.
- DB는 published 1, distinct external ID 1, failed 0, permalink row 1이고 queue는 published다.
- 동일 draft+platform+account 순차 재호출은 `alreadyPublished:true`와 같은 permalink를 반환했고 외부 게시물은
  1건으로 유지됐다. 각 실행의 단기 tenant token은 폐기 후 같은 queue API가 401임을 확인했다.

### 2026-07-20 SNS-015 Instagram Reels — build/QA 증거

**판정: 코드 테스트됨 + QA PASS, 그러나 운영 Reels 실발행은 미검증이므로 완료가 아니다.**

**구현 범위(코드 근거 확인):**
- `POST /api/video/upload` → 테넌트 스코프 `data/videos` 저장 → 15분 만료 HMAC 서명 URL
  `GET|HEAD /api/media/<token>`(Range 지원)로 배달 → Meta `media_type=REELS` 컨테이너 →
  `status_code` 최대 5분 폴링(1분 간격, `ERROR`/`EXPIRED`/timeout fail-closed) → `media_publish` →
  permalink 재조회 → DB/queue 기록.
- 미디어 토큰은 **암호화가 아니라 서명**이다. payload는 base64url 평문 JSON(tenantId·파일명·만료)이라
  토큰 보유자가 읽을 수 있다. 보장은 변조 불가와 만료뿐이며 기밀성은 주장하지 않는다.
- `/api/media/*`는 프록시 Bearer 인증을 요구하지 않는다(Meta 서버가 헤더를 못 붙임). 인가 판단은
  핸들러의 `verifyMediaToken` HMAC 검증으로 이동했다.
- 테넌트에 열린 영상 라우트는 list/upload/delete/publish 4개다. `/api/video/generate`는 임의 URL fetch(SSRF)와
  동기 ffmpeg 자원 고갈 위험 때문에 tenant-aware allowlist에서 의도적으로 제외한 **운영자 전용**이다.
- 업로드·발행 공통 애플리케이션 상한은 **100 MiB**(`lib/video-limits.ts`). 이전 기록의 1GB는 오기다.
- 중복 발행은 `published_posts` `status='in_progress'` 예약 INSERT + `draft_id` partial unique index로
  DB에서 강제하고, 경쟁에서 진 요청은 409 `publish_in_progress`로 fail-closed 응답한다. 좀비 예약 회수 경로도 포함.

**자동 검증(직접 실행, 관찰됨):**
- focused 106 PASS(미디어 배달 Range/HEAD, proxy bypass 계약, 5라우트 cross-tenant 격리,
  REELS 폴링·EXPIRED fail-closed, 예약 dedupe·409 경로).
- 최신 전체 실행 84 files / 752 PASS / 9 DB-env skip, 회귀 0.
- `npx tsc --noEmit` clean. production build 160 pages PASS.

**독립 QA:**
- qa-verifier 품질 게이트 PASS — `Skill qa-only` 1회, WebFetch 5회(Meta content-publishing, RFC 9110 등),
  `standards/` 품질헌법 Read 증거 확인.
- 직전 라운드의 BLOCKER 2건(미디어 경로가 프록시 인증벽에 막힘 / OAuth·osmu 사용자가 영상 라우트 5개에 403)은
  수정 후 회귀 테스트로 고정됐다.

**운영 환경 확인(컨트롤러 직접 관찰):**
- 운영 DB 중복 점검 `duplicateGroups=0`, `totalExtra=0`.
- 운영 origin은 HTTPS이며 미디어 서명은 전용 `MEDIA_SIGNING_SECRET` 없이 `DASHBOARD_AUTH_TOKEN` 파생 폴백으로
  구성돼 있다(전용 시크릿 설정 여부 = false). 서명 자체는 동작하지만 전용 시크릿 분리는 미완이다.

**미검증(완료 판정 금지):**
- 실제 Meta Reels 1건 공개 발행과 permalink 회수, 격리 브라우저의 공개 영상 렌더.
- 실 OAuth 고객 브라우저 세션의 `/videos` 전체 플로우 직접 관찰.
- `EXPIRED` 분기의 실제 Meta 응답(현재는 공식문서 근거 구현).

### 2026-07-21 SNS-015 Instagram Reels — 운영 관찰로 종료(operating observed / closed)

**판정: SNS-015는 운영 관찰로 종료한다. 단 전체 v1.0.0 ship은 계속 in-progress다.**

**운영 증거(컨트롤러 직접 관찰, commit `1a6e7e5a`):**
- 운영 DB에 schema 적용, 컨테이너 healthy, live health HTTP 200 · `db: up`.
- 실제 테넌트 업로드 수행 → 서명 미디어 `HEAD` HTTP 200, `Range: bytes=0-99` 요청에 HTTP 206 + 100 bytes 반환.
- 실제 Instagram Reel 공개 permalink 회수: `https://www.instagram.com/reel/DbBPRa7iFff/`.
- 동일 요청 재시도는 외부 재발행 없이 `alreadyPublished: true` + 동일 permalink 반환.
- 운영 DB: rows 1 / published 1 / distinct external 1 / permalink 1 / failed 0.
- 임시 테넌트 토큰은 revoke했고, 같은 토큰의 video list API가 HTTP 401임을 확인했다.

**공개 브라우저 관찰(gstack, 인증 없는 공개 경로):** 계정 `zero_to_one_ai`, 한국어 제목·본문·해시태그 원문 그대로,
`readyState=4`인 720x1280 8초 영상과 렌더된 브랜드 프레임을 직접 확인했다.
화면 증거: `docs/evidence/sns015-instagram-reel-operating-20260721.png`.

**이전 "미검증" 항목 해소:** 위 3건 중 실제 Reels 발행·permalink 회수와 공개 영상 렌더는 해소됐다.
`EXPIRED` 분기의 실제 Meta 응답은 여전히 공식문서 근거 구현으로 남는다(운영에서 발생하지 않음).

**전체 ship이 아직 in-progress인 이유(SNS-015와 무관한 외부 blocker):** X·TikTok credential 미설정,
Facebook 앱 활성화, Instagram 신규 로그인 OTP, YouTube 실업로드, 동일 provider 실계정 2개 전환, GA4 DebugView.

### 2026-07-21 SNS-017 TikTok OAuth·Direct Post build candidate

**판정: 코드·자동 QA·생산 빌드는 통과, 운영 TikTok 계정 왕복과 실게시물은 미검증이다.**

- OAuth: TikTok 규격에 맞춰 authorize/token 양쪽에서 `client_key`를 사용하고 token 응답의 `open_id`를 계정 ID로 저장한다.
- 다중계정: 기존 `channel_accounts` 계정 목록·기본 전환·삭제 UI를 TikTok에도 연결하고, 발행 시 선택한 `account_id`만 사용한다.
- Direct Post: creator-info를 매번 조회해 계정이 허용한 공개범위만 표시·검증하고 댓글·듀엣·스티치 제한을 강제한다.
  사용자가 공개범위를 직접 고르기 전에는 발행 버튼을 노출하지 않는다.
- 영상 전달: 65분 만료 서명 HTTPS URL로 `PULL_FROM_URL`을 사용하며 토큰/provider 원문 오류를 응답에 노출하지 않는다.
- 처리 상태: `PUBLISH_COMPLETE`만 게시 완료로 응답하고, provider가 계속 처리 중이면 HTTP 202 `processing:true`로 구분한다.
- 회귀: focused 124 PASS, 최종 전체 88 files / 766 PASS / 9 DB-env skip, `tsc --noEmit` clean,
  Next.js 16 Webpack production build 161 pages PASS, `git diff --check` PASS.
- 빌드 중 발견한 기존 결함도 해소: route 파일의 금지된 보조 export 4건과 선택적 Request 서명 2건을 라이브러리 분리/정상 서명으로 교정했다.
- 공식 근거: TikTok Direct Post, creator info, status API 문서
  (`https://developers.tiktok.com/doc/content-posting-api-reference-direct-post`,
  `https://developers.tiktok.com/doc/content-posting-api-reference-query-creator-info/`,
  `https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status`).

**운영 차단:** 운영 `TIKTOK_CLIENT_KEY`·`TIKTOK_CLIENT_SECRET`이 없고 TikTok 앱 Content Posting API 심사 상태를
실계정으로 확인하지 못했다. 따라서 연결→callback→creator-info→SELF_ONLY 테스트 게시→status/permalink 회수는 미검증이며,
운영 배포 후 UI는 credential 누락 사유를 정직하게 disabled로 보여야 한다.

**1차 운영 Chrome 재발견·수정:** `/videos`가 active workspace 확정 전에 tenant 없는 Instagram accounts API를 호출해
operator token까지 401로 지우는 인증 race를 관찰했다. 조회를 workspace 조건부 + `tenant_id`로 교정했다. 또한 TikTok·YouTube
영상 직접 발행이 구현됐는데 SocialConnectButton이 “직접 발행 미지원”으로 표시하던 SSOT 드리프트를
`VIDEO_PUBLISH_PLATFORMS`로 교정했다. focused 17 PASS, TypeScript clean, diff check PASS. 재배포 후 Chrome 재관찰 필요.

**후속 운영 관찰(2026-07-21, commit `cf0be864`):** marketing VM Docker production build 161 pages PASS,
컨테이너 `running/healthy`, DB up, Google auth URL 정상. 격리 Chrome `/videos`에서 Instagram accounts 200,
TikTok accounts 200, readiness 200 두 번을 관찰했고 해당 navigation의 HTTP 4xx/5xx는 0건이었다. TikTok 버튼은 disabled이며
`TIKTOK_CLIENT_KEY/TIKTOK_CLIENT_SECRET` 누락 사유가 화면에 표시되고, 낡은 “직접 발행 미지원” 문구는 없다.
별도 `/login` Google 클릭은 실제 `accounts.google.com` identifier URL로 이동했다.
화면 증거: `docs/evidence/sns017-tiktok-disabled-operating-20260721.png`. 운영자 브라우저 storage는 검증 후 폐기했다.

### 2026-07-21 GA4 운영 전송 관찰

- 격리 Chrome에서 기존 consent/storage를 삭제하고 `/login`을 새로 열어 분석 동의를 직접 클릭했다.
- `www.googletagmanager.com/gtag/js?id=G-MEEQ2D8C1J` HTTP 200 로드 관찰.
- `page_view`와 `scroll(percent_scrolled=90)`이 `www.google-analytics.com/g/collect`의 동일 measurement ID로
  실제 POST되어 각각 HTTP 204를 반환한 것을 network에서 직접 관찰했다.
- 판정: 클라이언트 태그·동의 후 이벤트 전송은 운영 관찰 완료. GA4 관리 콘솔 DebugView에 이벤트가 표시되는지는
  Google 계정 콘솔 화면을 열지 않았으므로 **미검증**이다. 브라우저 storage는 관찰 후 삭제했다.

### 2026-07-21 SNS-017 TikTok 비동기 발행 — 독립 QA PASS

**판정: 코드·자동 QA·생산 빌드 BLOCKER 0. 운영 배포 가능하며, 실 TikTok 발행은 credential·앱 심사 부재로 미검증이다.**

- 최종 관찰: focused 6 files / 25 tests PASS, 전체 `npm test` 90 files / 776 PASS / 9 DB-env skip,
  `npx tsc --noEmit` PASS, Next.js 16 Webpack production build 162 pages PASS, `git diff --check` PASS.
- QA 발견·해소: workspace 전환 시 이전 tenant publish ID가 한 프레임 poll될 수 있던 race를 상태 자체의 workspace 태깅으로 차단했다.
  `workspaceId` nullability를 정규화해 typecheck/build를 회복했다.
- QA 발견·해소: provider `publish_id`와 final `post_id`를 분리하기 위해 `provider_post_id` additive schema와 완료 update/재조회
  계약을 추가했다. 중복 POST의 완료 응답도 final post ID를 사용한다.
- QA 발견·해소: 공개 게시의 creator-info 일시 실패 또는 final post ID 부재 시 성공 확정을 보류하고 202로 재시도한다.
  반대로 `SELF_ONLY`는 공개 post ID가 없을 수 있으므로 저장된 privacy metadata와 `PUBLISH_COMPLETE`로 정상 종결한다.
- 보안·격리: status lookup은 현재 tenant의 예약과 그 예약의 `account_id` 토큰만 사용하고 provider 원문 오류·token을 숨긴다.
  5xx/429에서는 브라우저 pending을 보존하며 terminal/stale 4xx에서만 제거한다.
- 미검증: 로컬 `DATABASE_URL` 부재로 PostgreSQL 연동형 9건과 schema seed는 skip됐다. Playwright 구성, mobile project,
  Maestro flow는 없다. 운영 TikTok credential·Content Posting API 심사·실계정이 없어 OAuth → SELF_ONLY Direct Post →
  status 완료 및 공개 게시 post ID/permalink의 실제 provider 왕복은 미검증이다.

**운영 배포 증거:** commit `ca4596ab`, CI run `29820483251` SUCCESS, deploy run `29820488738` SUCCESS. 운영 컨테이너
healthy, PostgreSQL `provider_post_id:text`·`provider_meta:jsonb` 실조회, public health 200/db up, login 200,
Google preflight 200, `/api/me` 401, 신규 TikTok status route 무인증 401을 관찰했다. deploy 과정에서 발견한 compose
env-file 누락과 수동 컨테이너 이름 충돌은 workflow 계약 테스트 및 rollback 가능한 교체 절차로 교정했다.

**운영 E2E 판정:** 앱·DB·인증 경계의 운영 반영은 관찰됨. TikTok provider credential과 앱 심사가 없어 실 OAuth와
SELF_ONLY/공개 게시 왕복은 미검증이며 SNS-017 provider E2E는 open 상태를 유지한다.

### 2026-07-21 SNS-018 고객 영상 403·테넌트 이미지 운영 종료

- **재현:** 운영 고객 토큰 `/videos`에서 `/api/youtube/status`, `/api/images`, 전역
  `/api/clipping-config`, `/api/elevenlabs-config`가 403이었다. 이미지 업로드·삭제는 전역 flat 경로였고
  업로드 반환 URL은 실제 제공 라우트가 없어 고객 이미지 발행이 끊겨 있었다.
- **수정:** YouTube status와 images만 tenant-aware로 허용했다. 전역 평문 API key를 반환하는 clipping/ElevenLabs는
  운영자 전용을 유지하고 고객 UI에서 요청·설정 폼을 숨겼다. 이미지 업로드·목록·삭제를
  `data/tenants/{tenant}/images`로 격리하고, 영상과 목적 키가 분리된 HMAC 이미지 배달 URL을 추가했다.
  업로드는 10MiB·허용 확장자·빈 파일을 차단하고, 삭제/배달은 경로 탈출과 타 테넌트를 404로 숨긴다.
- **QA 발견·해소:** 30일 토큰을 큐에 영속하면 장기 예약이 깨지는 문제를 발행 직전 HMAC 재검증·동일 테넌트
  재서명으로 보완했다. Instagram 업로드 401은 원시 오류 대신 공통 `auth:required` 재로그인 흐름으로 전환했다.
  이미지 삭제 후 캐시 잔존을 막기 위해 배달 응답은 `private, no-store`다.
- **자동 검증:** 최초 focused 7 files/111 PASS, 전체 94 files/819 PASS·9 DB-env skip. 운영 Chrome 후속 결함
  수정 뒤 전체 95 files/820 PASS·9 DB-env skip, `tsc --noEmit` PASS, Webpack production build 162 pages PASS,
  `git diff --check` PASS. 독립 Sonnet 보안 리뷰 blocker/high 0.
- **배포:** image 보안 commit `15ec5d0e`, CI `29848488923`, deploy `29849273792` SUCCESS. Chrome에서 발견한
  고객의 operator-only `/api/cron-status` 403은 `Sidebar` 역할 조건부 fetch/render와 계약 테스트로 교정했다.
  후속 commit `176b3bd5`, CI `29850049736`, deploy `29850058481` 모두 SUCCESS.
- **운영 API E2E(관찰됨):** 고객 토큰으로 실제 PNG 업로드 200, absolute HTTPS signed URL 반환, 인증 없는
  signed GET 200 + `image/png` + 업로드 원본과 SHA-256 일치, 고객 목록 1건 반영, 삭제 200, 삭제 뒤 같은 URL
  404와 목록 0건을 확인했다.
- **운영 Chrome E2E(관찰됨):** `/videos`에서 `/api/images`·`/api/youtube/status` 200, cron-status·clipping-config·
  elevenlabs-config 요청 0건, 전체 4xx/5xx 0건. `/images`에서 signed image가 `complete=true`, naturalWidth/Height
  1x1로 렌더되고 화면 카드에도 표시됐다.
- **보안 종료:** 브라우저 QA 이미지를 삭제해 URL 404를 재확인했다. 단기 tenant token을 revoke한 뒤 같은
  `/api/me` 요청이 401임을 확인했고 브라우저 storage 및 로컬/marketing-vm 원문 임시 파일을 제거했다.
- **잔여 미검증:** 이번 신규 이미지 URL로 Instagram/Threads 새 공개 게시물을 추가 생성하지는 않았다.
  기존 실제 Instagram Reel·Threads 게시 증거와 별개다. R2 원격 백업은 미설정이지만 현재 Docker 영속 volume의
  업로드·배달은 운영 관찰됐으며, R2는 재해복구 강화를 위한 별도 인프라 항목이다.

### 2026-07-22 셀프서비스 OAuth SaaS QA·운영 배포

- **CI DB 격리(테스트됨):** run `29891147154` SUCCESS. PostgreSQL 16 schema→seed→RLS 적용 후 신규 사용자
  A/B tenant provisioning, A의 다중계정/default 전환, queue/schedule/published/file 경계, 상호 조회 0행과
  cross-tenant RLS write 거부를 `self-service-tenant.db.test.ts`에서 skip 없이 실행. 전체 96 files PASS.
- **운영 배포(관찰됨):** deploy run `29891777778` SUCCESS. public health 200/db up, login 200,
  무인증 `/api/me` 401, Google preflight 200와 Supabase authorize URL을 직접 확인.
- **OAuth 시작 경로(관찰됨):** 단기 tenant token으로 Instagram, Threads, Facebook, YouTube가 각각 공식
  authorize host와 HttpOnly `oauth_state_<provider>` cookie를 반환. Instagram state를 cookie 없는 별도 요청에서
  callback했을 때 토큰 교환 전에 브라우저 불일치로 차단되고 state cookie `Max-Age=0` 폐기 확인.
- **비활성 경계(관찰됨):** X는 `X_CLIENT_ID` 미설정 500, TikTok은 `TIKTOK_CLIENT_KEY` 미설정 500,
  Bluesky는 지원하지 않는 OAuth provider 400. QA token은 매 실행 후 revoke했고 동일 `/api/me` 401 확인.
- **미검증:** 완전히 새로운 Google 사용자 A/B의 실제 consent 왕복, 각 사용자 SNS 계정 callback 저장,
  동일 provider 실계정 2개 UI 전환, 사용자별 실발행 permalink, 운영 API 상호 403/404. Facebook 앱 Live/심사,
  Instagram OTP rate limit, X/TikTok credential·심사도 외부 차단으로 남는다.
- **판정:** 코드·DB·배포 QA는 승인. 전체 v1.0.0 ship은 위 실계정 운영 E2E가 없어 in-progress 유지.
- **Google 계정전환 후속:** 앱 로그인 preflight에도 `prompt=select_account`를 추가해 OSMU 로그아웃 후 기존
  Google 세션이 자동 재사용되는 경로를 막았다. focused 22 PASS, 전체 96 files/828 PASS·10 local DB skip,
  TypeScript와 Webpack production build PASS. commit `52925362`, CI `29893393332`, deploy `29893789257` SUCCESS.
  운영 앱 auth URL과 Supabase→Google redirect 모두 `prompt=select_account`를 보존했다. 격리 브라우저에서 기존
  세션 자동진입 없이 Google 이메일/계정 선택 진입 화면을 직접 관찰했다. 증거:
  `docs/evidence/google-account-selector-20260722.png`.
- **운영 2-tenant 격리(관찰됨):** 서로 다른 활성 tenant 두 개의 단기 토큰으로 `/api/me` 귀속이 서로 다름을
  확인. 다른 활성 tenant 10개가 존재하지만 양쪽 isolation proof의 cross-tenant drafts는 0. 상대 tenant_id를
  Instagram accounts 쿼리에 넣어도 각자의 무주입 응답과 동일해 client override가 무시됨. 두 토큰 revoke 후
  동일 `/api/me` 401 확인.
- **credential inventory(근거 확인):** GitHub secret 이름은 Meta·YouTube만 존재하고 X/TikTok은 없음.
  로컬 harness secret 파일에도 X/TikTok 4개 env 이름이 없다. 실제 값은 조회·출력하지 않음.
- **운영 lead 저장(관찰됨):** 고객 API에서 auth user 7명/tenant 11개, 실제 Google provider 사용자 1명과
  연결된 active tenant를 확인. Google 유입의 auth user·tenant 저장은 관찰됐고 비밀번호 원문 필드는 없음.
- **재발방지 보강:** deploy smoke가 Google preflight 200에 더해 authUrl의 `prompt=select_account`를 검사하고,
  누락 시 배포를 실패시킨다. focused 9 PASS, jq 정상/누락 분기 확인. commit `ee475f1f`, CI
  `29895690967`, deploy `29896414859` SUCCESS. 운영 smoke의 새 계정선택 gate PASS를 직접 확인.

### 2026-07-22 OAuth/영상 플랫폼 운영 고객 UI 재검증

- 실제 Chrome에서 운영 앱 로그인 탭, Meta/X/TikTok 개발자 콘솔 탭을 열었다. X는 로그인 화면, TikTok은
  Email/Password 폼, Meta의 정확한 앱 dashboard는 공개 개발자 홈으로 돌아가 세 콘솔 모두 개발자 인증 입력이
  필요한 상태임을 관찰했다.
- 단기 tenant 토큰으로 운영 고객 UI를 직접 렌더했다. X credential 누락 disabled, Facebook 앱 모드/role 경고,
  Instagram 기본 active 계정 1개와 계정전환 안내, Bluesky invalid App Password의 조치 가능한 오류를 관찰했다.
  과거 raw JSON `X_CLIENT_ID 미설정` 클릭 오류와 Bluesky `openclaw.json not found`는 재현되지 않았다.
- `/videos`에서 YouTube OAuth 버튼, TikTok credential 누락 disabled, Instagram Reels 발행 가능을 직접 관찰했다.
  증거는 `docs/evidence/oauth-video-platforms-operating-20260722.png`이다.
- 첫 브라우저 토큰 주입은 `browse eval` 인자 형식 오사용으로 임시 토큰이 도구 로그에 노출됐다. 즉시 revoke하고
  동일 `/api/me` 401을 확인했다. 두 번째 실행은 mode 600 JS 파일 경유로 주입하고 종료 시 revoke/401 및 파일
  삭제까지 확인했다. 재발방지 규칙은 inline secret 주입 금지, mode 600 파일 경유, 종료 revoke/401이다.
- **판정:** 고객 앱 UI와 앱 측 방어는 관찰됨. X/TikTok credential·심사, Meta 개발자 로그인과 Live/test role,
  Instagram OTP, YouTube 실제 동의·업로드, 동일 provider 실계정 2개 전환·발행은 외부 계정 입력 전까지 미검증이다.

### 2026-07-24 Threads 예약→자동 발행 운영 E2E

- **재현 원인:** marketing VM crontab은 `*/10 * * * * /home/marketing/osmu-publish-due.sh`로 정상 동작했지만,
  반복 로그가 `tenantCount:0, processed:0`이었다. 자동 발행이 멈춘 것이 아니라 예약 데이터가 0건이었다.
- **콘텐츠 중복 방지:** 기존 `@zero_to_one_ai` 공개 게시물의 가동 선언·브랜드 위키 주제와 겹친 1차 초안은
  폐기했다. 대행 견적 분리, AI 환각 안전선, 사장님 저녁 시간 주제로 재위임했고,
  `verify-agent-quality.sh`가 Skill 11/WebSearch 6/Socratic 10/RUBRIC 22/25로 PASS했다.
- **운영 적재:** tenant `587cee76-deca-480e-8fdd-808a30ec86eb`에 draft 3건과 Threads schedule 3건을 생성했다.
  GET 재조회로 세 본문이 손상 없이 저장됐고, 첫 건 01:44 KST, 후속은 7월 24·25일 20:00 KST다.
- **실발행 관찰:** due 이후 operator all-tenant sweep이 processed 1을 반환하고 schedule
  `e5056bc0-443e-4dea-a39d-8575bf3e294a`를 `published`로 마감했다. 결과는 external ID
  `18002265641778373`, 공개 URL
  `https://www.threads.com/@zero_to_one_ai/post/DbJH7KJGDS6`이다.
- **브라우저 직접 확인:** gstack Chrome에서 공개 URL을 열어 `@zero_to_one_ai`와 3개 견적 항목을 포함한
  원문 전체를 렌더했다. 증거: `docs/evidence/threads-auto-publish-20260724.png`.
- **성과 수집 확인:** 운영 `/api/metrics` refresh가 `updated:1,total:3`을 반환했고, GET에서 동일 external ID,
  permalink, 본문, `published_at=2026-07-23T16:44:52.906Z`,
  `metrics_at=2026-07-23T16:46:22.742Z`를 재조회했다.
- **판정:** Threads draft→schedule→due sweep→외부 발행→공개 브라우저→metrics 저장 경로는 관찰됨.
  후속 두 schedule의 cron 자동 출고는 미래 시각이라 아직 미검증이다.
- **남은 플랫폼:** Instagram TEXT-only는 플랫폼 계약상 불가하므로 이미지 자산이 있어야 예약 E2E가 가능하다.
  X/TikTok은 중앙 앱 credential·심사, Facebook/YouTube는 신규 고객 실동의·callback·발행,
  동일 provider 2계정은 전환 후 계정별 발행 permalink가 미검증이다.

### 2026-07-25 TikTok 재인증 URL 계약 + Threads 두 번째 자동 발행

- **TikTok build:** commit `cea30fe0`에서 TikTok authorize URL에 provider 전용
  `disable_auto_auth=1`을 추가했다. 테스트 선행 실패는 `null` 1건, 수정 뒤 OAuth focused
  70/70 PASS, 전체 858 PASS/10 DB-env skip, TypeScript PASS, production build 165/165 routes PASS다.
- **독립 QA:** Sonnet qa-verifier가 변경 2파일과 provider별 병합 경계를 검토했다. TikTok 관련
  74/74 PASS, 전체 858 PASS/10 skip, `tsc --noEmit` PASS, `next build` exit 0으로
  `PASS with caveats` 판정했다. 공식 TikTok Login Kit Web 원문에서 `disable_auto_auth=1` 계약을 확인했다.
- **미검증 경계:** 중앙 `TIKTOK_CLIENT_KEY`/`TIKTOK_CLIENT_SECRET`가 없어 운영 authUrl,
  provider consent, callback 저장, 실 발행은 실행할 수 없다. 코드·테스트 통과와 실 OAuth 완료를 혼동하지 않는다.
- **Threads 자동 발행 관찰:** schedule `ea086bbb-8aaa-4165-ab93-04560f05d81b`가
  `published`로 전환됐고 external ID `18108077243008891`, 공개 permalink
  `https://www.threads.com/@zero_to_one_ai/post/DbNqEMelEgJ`를 반환했다. 공개 브라우저에서
  계정과 원문 전체를 렌더했다.
- **성과 저장 관찰:** 운영 `/api/metrics`는 `updated:1,total:5`를 반환했고 해당 게시물의
  `published_at=2026-07-25T11:00:07.744Z`, `metrics_at=2026-07-25T11:13:40.530Z`를 재조회했다.
- **운영 배포:** deploy run `30156828520`, head `e37ada41`, 2분 31초 SUCCESS. 이미지 build,
  컨테이너 기동, login/auth/Google 계정선택/operator API 자동 스모크가 모두 통과했다.
- **공개 스모크:** health 200(`ok:true,db:up`), login 200, operator customers 200.
  운영자 실브라우저 로그인은 `/operator/customers`로 이동했고 `Admin` 단일 셸,
  가입자 7명·워크스페이스 11개·연결 계정 3개·발행 8건·중앙 OAuth 4/12 준비를 렌더했다.
  안정화 뒤 콘솔 오류 0건.
- **배포 후 TikTok 경계:** readiness는 credential 누락으로 `available:false`를 반환한다.
  변경 코드는 운영 이미지에 포함됐지만 실제 authUrl·consent·callback·발행은 계속 미검증이다.

### 2026-07-28 운영자 로그인 전역 모달 인증 경합

- **운영 재현(관찰됨):** 공개 홈과 운영자 로그인 전환 중 닫힌 전역 `ImagePickerModal`이
  `/api/images`·`/api/queue`를 호출했다. 로그인 전 시작된 401이 새 운영자 토큰 저장 뒤 도착해
  공통 fetcher가 새 토큰을 삭제하고 `Login Required`를 띄웠다.
- **이전 QA 누락:** 안정화된 `/operator/customers`만 확인하고 실제 토큰 입력 직후와
  identity별 route matrix를 종료조건에 넣지 않았다. 이 때문에 운영자 토큰으로 고객 shell이
  잠시 mount되는 경로와 로그인 race를 발견하지 못했다.
- **수정:** 닫힌 modal은 SWR null key로 보호 API를 호출하지 않는다. 공통 API helper는 요청 시점
  토큰과 응답 시점 토큰이 같을 때만 401 로그아웃을 수행한다. 운영자 identity는 고객 보호 경로의
  children을 mount하지 않고 `/operator/customers`로 이동한다.
- **자동 검증(테스트됨):** tests-first focused 35/35, 전체 880 PASS/10 DB-env skip,
  TypeScript PASS, production build 165/165 routes PASS, diff check clean.
- **독립 QA(테스트됨):** Claude Sonnet이 변경을 독립 검토하고 focused 11/11,
  `tsc --noEmit` PASS를 재현했다. stale 401 새 토큰 보존, 동일 토큰 401 로그아웃 유지,
  닫힌 modal 무요청, 운영자 redirect, 고객 `/videos` 보존을 확인했다.
- **배포 전 판정:** build/QA 승인. 운영 배포 뒤 실제 운영자 로그인 폼 제출, 공개 홈 무요청,
  운영자 route matrix, 15초 이상 안정화 동안 401/429·Login Required 0건은 미검증이며 ship 종료증거다.
- **운영 배포(관찰됨):** commit `87dae325`, deploy run `30287931603` SUCCESS. 이미지 build, 기동,
  상태, 자동 로그인 smoke를 모두 통과했다.
- **공개 홈(관찰됨):** 브라우저 storage를 비우고 `/`를 새로 열었을 때 랜딩만 렌더됐고
  `Login Required`, `/api/images`, `/api/queue`, 콘솔 오류가 모두 0건이었다.
- **운영자 로그인(관찰됨):** `/operator`의 실제 토큰 입력 폼을 제출해 `/operator/customers`로 이동,
  Admin 단일 shell과 가입자 7명·워크스페이스 11개를 렌더했다. 로그인 전환의 `/api/me`와
  `/api/operator/customers`는 200이며 401·콘솔 오류는 0건이었다.
- **운영자 route matrix(관찰됨):** 운영자 상태로 `/`, `/videos`, `/channels/youtube`를 각각 직접 열었다.
  세 경로 모두 고객 sidebar를 mount하지 않고 `/operator/customers`로 복귀했으며 Login Required,
  `/api/images`·`/api/queue` 401/429, 콘솔 오류가 0건이었다. 이후 20초 동안 `/api/me` 2회 모두 200.
- **고객 회귀(관찰됨):** 단기 code0to1 tenant token으로 운영 `/videos`가 그대로 유지되고 Admin이
  표시되지 않으며 video/channel/image API가 모두 200, 콘솔 오류가 0건이었다. 토큰은 revoke 200 뒤
  동일 `/api/me` 401을 확인하고 브라우저용 임시 비밀 파일까지 삭제했다.
- **판정:** 운영자 로그인 전역 모달 결함은 종료. 전체 v1.0.0 ship은 중앙 OAuth credential이 없는
  8개 provider와 provider별 신규 고객 실 consent→callback→계정 저장→발행 permalink가 미검증이라
  계속 in-progress다.

### 2026-07-28 전체 운영 플로우 재검사

- **검사 범위:** 공개 7 routes, 고객 25 routes, 운영자 5 routes, 고객 핵심 API 10개,
  중앙 OAuth 12 provider preflight, Google auth preflight, GA4 consent.
- **자동 검증(테스트됨):** controller가 현재 `main`에서 전체 105/105 files,
  880 PASS/10 DB-env skip을 재현했다. `tsc --noEmit` PASS. 샌드박스 기본 build는
  localhost bind EPERM으로 실패했지만 제한 밖 동일 `npm run build`는 165/165 pages PASS했다.
- **공개 인증(관찰됨):** `/login`은 Google CTA만 있고 email/password/recovery 입력이 없다.
  `/signup`은 `/login`으로 이동한다. `/api/auth/google`은 Supabase auth host와
  `prompt=select_account`를 반환한다. 다만 홈→로그인 이동 시 Supabase client 중복 경고가 발생한다.
- **GA4(관찰됨):** 분석 동의 클릭 뒤 localStorage consent=`granted`, `gtag` 함수와 dataLayer가 생성됐다.
  `gtag.js?id=G-MEEQ2D8C1J` 200과 GA collect `page_view` 204를 직접 확인했다.
- **운영자(관찰됨):** `/operator/customers`와 운영자 상태의 `/`,`/studio`,`/videos`,
  `/channels/youtube`는 모두 Admin 단일 shell로 수렴했다. bad HTTP·console error 0,
  16초 안정화 뒤에도 Login Required 0.
- **고객 core API(관찰됨):** `/api/me`,`overview`,`queue`,`schedule`,`metrics`,`images`,
  `video/list`,`integrations`,`connect/readiness`는 200. `/api/workspaces`는 운영자 전용이라 403.
- **고객 UI FAIL(관찰됨+근거 확인):** home, Studio, Threads, Telegram, Discord, Slack,
  Images, Blog, Google Analytics, Search Advisor, Naver Trends가 고객 bearer로 operator-only API를
  호출해 403과 콘솔 오류를 만든다. `proxy.ts`의 tenant-aware allowlist에 없는 전역 파일/secret/
  cron API를 고객 UI가 호출하는 권한 계약 불일치다.
- **안내 자산 FAIL(관찰됨):** Threads/X 연결 안내가 존재하지 않는
  `/onboarding/threads/*.png`, `/onboarding/x/*.png` 4개를 요청해 404.
- **오탐 제거:** 연속 페이지 이동의 지연 응답이 섞인 Inbox와 Blog Performance는 각각 분리된
  새 브라우저에서 재실행해 bad HTTP 0, console error 0으로 확인했다.
- **OAuth readiness(관찰됨):** Instagram, Threads, YouTube, Facebook은 공식 authorize host를
  반환했다. X, LinkedIn, Naver Blog, Pinterest, Tumblr, TikTok, Slack, LINE은 중앙 credential
  미설정 500으로 실제 사용자 연결 불가.
- **false-success blocker(근거 확인):** YouTube upload PUT non-2xx/empty ID,
  Telegram/Discord/Slack/LINE notification HTTP non-2xx, Slack test/send HTTP non-2xx를 성공으로
  기록할 수 있다. provider 발행 성공 뒤 DB/queue 기록 실패도 `ok:true`를 유지해 UI가
  `publish_success`를 기록할 수 있다.
- **토큰 종료:** 전체 E2E와 격리 재검사에 쓴 단기 tenant token은 각각 revoke 200 뒤
  동일 `/api/me` 401을 확인했다. 원문 비밀 파일은 만들지 않았다.
- **미검증:** 실제 신규 Google 계정 consent→callback→auth user/tenant 저장, 실제 DB RLS 10건,
  provider별 consent/cancel/refresh, 동일 provider 다중계정 전환, 현재 배포의 새 실발행 permalink,
  GA4 DebugView UI, Slack 메시지 실제 도착.
- **판정:** 전체 고객 플로우 QA FAIL. 자동 테스트·빌드 통과는 운영 UI/API 권한 불일치와
  외부 성공 오판을 가리지 못했다. 결함 수정·재배포 뒤 동일 route matrix를 재실행하기 전 출하 금지.

### 2026-07-29 중앙 OAuth 자격증명 관리자 독립 보안리뷰 Major

- **판정:** 🔧 수정·자동검증 통과, 실 PostgreSQL RLS 재검증 대기. commits
  `68c251bb..0ffefb39`의 중앙 OAuth 자격증명 관리자에서
  전역 테이블 RLS owner 접근 차단, RLS 적용 순서 rollback, env 원문 reveal, readiness N+1 복호화
  쿼리의 Major 4건이 확인됐다.
- **수정 범위:** 전역 테이블은 RLS default-deny/no customer policy를 유지하면서 owner/BYPASSRLS
  연결만 접근하도록 NO FORCE 전환, tenant policy 적용 뒤 guarded global ALTER, DB-source 전용 reveal,
  list/readiness bulk resolve, DB row DELETE+audit+Admin 버튼, 저장소 장애 UI 분리.
- **종료 증거:** tests-first focused/full test, TypeScript, webpack build와 secret 비로그·exact operator
  Bearer·no-store 회귀를 재검증하기 전까지 QA/ship은 잠금 유지한다.
- **자동검증:** focused 32/32, 전체 112 files 917 PASS/10 DB-env skip, `tsc --noEmit`,
  Next.js 16.2.2 webpack build 166/166 routes, `git diff --check` PASS.
- **미검증:** 임시 PostgreSQL은 sandbox `shmget` 차단으로 `initdb` bootstrap 전에 2회 중단됐다.
  owner/BYPASSRLS 1행 접근, `osmu_service` 0행·쓰기 거부, 전역 테이블 부재 상태의 tenant policy
  적용은 QA DB에서 직접 관찰해야 한다.
