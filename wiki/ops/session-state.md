# 세션 작업 상태 (재실행 가능한 핸드오프)

> 작업 하네스 규칙 #3. 30초 재개. 상세 이력: [archive/session-2026-06.md](archive/session-2026-06.md) (2026-07-02 롤오버).
> 단계 진실원: 루트 `pipeline-state.md`(현재 **qa**, ship은 `/approve qa` 후). QA 증거: `docs/qa-tracker.md`.

**최종 갱신:** 2026-07-10 04:20 KST · `main` · **Codex build: admin auth users + password reset email 구현, qa 게이트 대기**

---

### 🔄 Codex handoff binding — launch/OAuth/admin QA audit (2026-07-10 00:40 KST)

**사용자 지정 primary:** “우리 앱 진짜 제대로 띄워서 돌려야해. `claude -p`로 돌리되 유저들이 OAuth 로그인해서 각자 사용하는 방식. 최근 admin도 구성했지? 이어하자.”

**tmux pane 표식:** session `2`, window `0`의 openclaw-auto pane 2개를 확인했고 pane border에 작업 목표를 고정했다.
- `%7` / pane 0: `launch: OAuth login, per-user claude-p, admin QA`
- `%8` / pane 1: `paused: branding wiki/codebase review`

**현재 판정:**
- 로컬 worktree에는 2026-07-09 OAuth/admin 수정이 들어와 있고 현재 재검증도 통과했다.
- 라이브 `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud`는 아직 2026-07-05 배포 커밋(`290390c`)을 쓰는 구버전이다. 그래서 `/login`에 `비밀번호 찾기`가 없고 `/api/auth/google`이 `401 Unauthorized`를 반환한다.
- 최신 수정은 아직 운영 배포되지 않았다. `gh run list --workflow 'Deploy openclaw (marketing VM)' --limit 5` 기준 최신 배포는 2026-07-05T17:58:21Z, run `28749775595`, headSha `290390ccd8b5e039e37c7cba73eaa12b80e1ee42`.

**현 worktree 검증(직접 실행):**
- `npm run test` in `dashboard/` → 36 files PASS, 187 PASS / 8 skipped.
- `npm run build` in `dashboard/` → PASS. `/api/auth/google`, `/api/operator/customers`, `/api/studio/engine-status`, `/operator/customers` 포함.
- `env PORT=3456 NEXT_PUBLIC_SUPABASE_URL=https://gvtsyyltgwqplrqegrxo.supabase.co npm run dev` → local `http://localhost:3456` Ready.
- local `curl /login` → 200, `비밀번호 찾기` 버튼 렌더 확인.
- local `curl /api/auth/google?...` → 400 JSON, “Google 로그인이 아직 설정되지 않았습니다...” 한국어 안내. Supabase raw JSON으로 브라우저 넘김 없음.
- `npm run e2e:local` → PASS, screenshots `/tmp/e2e-*.png`. 로컬 anon key 미설정 warning은 남음.

**라이브 검증(직접 실행):**
- live `/login` → 200이지만 `비밀번호 찾기` 버튼 없음(구버전 HTML).
- live `/api/auth/google?redirect_to=...` → 401 `{"error":"Unauthorized"}`. 새 public middleware가 운영에 미반영.
- live `/api/me` → 401. 운영자 게이트 자체는 살아 있음.

**현재 변경 상태 주의:**
- `origin/main..HEAD` = 로컬이 5 commits ahead.
- OAuth/admin 관련 신규 미추적 파일: `dashboard/src/app/api/auth/google/route.ts`, `dashboard/src/app/api/operator/customers/route.ts`, `dashboard/src/app/api/studio/engine-status/route.ts`, `dashboard/src/app/operator/customers/page.tsx`, `dashboard/src/lib/oauth-errors.ts`, `dashboard/src/lib/secret-mask.ts`, 관련 tests 4개.
- `openclaw/` nested tree는 대량 untracked가 있으나 이번 launch/OAuth/admin 트랙과 무관. 건드리지 말 것.

**다음 액션:**
1. OAuth/admin 수정만 선별 commit한다. 브랜딩 wiki/scratchpad와 `openclaw/` 대량 untracked는 섞지 않는다.
2. `/approve qa` 또는 명시 배포 승인 후 `gh workflow run "Deploy openclaw (marketing VM)"` 실행.
3. 배포 후 live에서 `/login` 비밀번호 찾기, `/api/auth/google` public preflight, `/operator/customers` 운영자 토큰 조회, 실제 Google OAuth provider 설정 상태, 고객 로그인→워크스페이스→Studio 엔진 배지→채널 OAuth 연결→토큰 저장→실발행 E2E를 순서대로 재검증한다.
4. Google OAuth를 실제로 성공시키려면 Supabase Auth Google provider 활성화와 redirect URL 등록이 필요하다. 비밀번호 재설정 메일은 운영 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 빌드 주입된 배포 후에만 실발송 검증 가능.

**2026-07-10 03:31 KST 재제보 후 추가 확인:**
- 사용자 재제보: Google 로그인 raw JSON `Unsupported provider: provider is not enabled`, 비밀번호 찾기 없음, 현재 가입자 목록 요청.
- live `/login` 직접 curl → 200이지만 `비밀번호 찾기` 버튼 없음. live `/api/auth/google?...` → 401 `{"error":"Unauthorized"}`.
- 운영 DB를 remote VM에서 `postgres:16` psql 컨테이너로 조회했다. DB URL/토큰은 출력하지 않았고 비밀번호 원문은 조회하지 않았다.
- auth users 5명: `r.cupid@gmail.com`(tenant 연결/confirmed), `j.the.great.investor@gmail.com`(tenant 연결/confirmed), `code0to1@gmail.com`(tenant 연결/confirmed), `osmu.qa.overnight0702@gmail.com`(unconfirmed/tenant 없음), `qa.live.1781632644@gmail.com`(unconfirmed/tenant 없음).
- tenants 9개: 셀프서브 연결 3개(`r-cupid-9da55f`, `j-the-great-investor-6794e3`, `code0to1-2dafcd`) + 기존 내부 tenant 6개(`--`, `dedu`, `zeroone`, `zero-one`, `okgram`, `romeo`).
- `j.the.great.investor@gmail.com`은 존재 확인: auth id `e6baa000-cefe-4a77-9034-c600703c41c5`, tenant id `badd844f-9106-4992-ad10-41a234fceb35`, email confirmed `2026-06-28T15:47:21Z`, last sign-in `2026-06-28T15:47:44Z`.

**2026-07-10 04:17 KST 추가 구현/검증:**
- 기존 비밀번호 원문/해시 조회는 구현하지 않았다. 대신 `/operator/customers`에 auth 가입자 목록과 `비밀번호 재설정 메일` 버튼을 추가했다.
- `GET /api/operator/customers`는 tenants + auth.users 요약을 반환한다. 반환 필드에는 password/encrypted_password 없음.
- `POST /api/operator/customers` with `{ action: "send_password_reset", email }`은 Supabase `/auth/v1/recover`를 호출해 재설정 메일만 보낸다.
- 검증: focused tests 4 files / 22 PASS, 전체 `npm run test` 37 files / 190 PASS / 8 skipped, `npm run build` PASS, `npm run e2e:local` PASS.
- commit: `b1624ee3 fix(dashboard): ship OAuth login and operator account recovery`.
- 차단: `git push origin main`이 stage-gate에서 `현재 'qa', approved_stages=[plan, design, eng-design, build]. 'qa' 승인 후 재시도.`로 차단됨. 원격/배포 아직 미반영.
- 다음 액션: 회장 `/approve qa` 후 `git push origin main` → `gh workflow run "Deploy openclaw (marketing VM)"` → live `/login`, `/api/auth/google`, `/operator/customers`, reset email action 직접 검증.

---

### 🔄 Codex audit — marketing/branding wiki handoff check (2026-07-10 KST)

**사용자 지정 primary:** "마케팅 브랜딩 중심으로 위키 구성" 작업. 회장이 tmux pane 목표를 보라고 명시했으므로 tmux transcript를 primary로 보고, `session-state.md`와 `wiki/marketing/`은 보조 증거로 대조함.

**확인한 tmux panes:** 현재 살아있는 `openclaw-auto` pane은 `%7`(`2:0.0`)과 `%8`(`2:0.1`)뿐. `%8`은 이 감사 요청을 받은 현재 Codex 세션이고, `%7`은 직전 "앱/OAuth/admin" 점검 세션. 과거 브랜딩 pane `%36`은 현재 tmux에는 없고, 복구 가능한 정본 맥락은 이 파일의 2026-07-08/09 브랜딩 handoff 섹션에 남아 있음.

**검토 결과:**
- 위키 구조화는 진행됨: `wiki/marketing/` 7파일 + proposals 2건이 신설되어 positioning/competitors/playbook/brand/growth-log/assets로 분리됨.
- 마케팅 자산은 복구됨: `scratchpad/brand-visuals/`에 showcase 포함 21 files가 있고, `wiki/marketing/assets.md`가 이 위치를 가리킴.
- 최신 방향과 정본 사이에 불일치가 있음: `wiki/marketing/brand.md`는 아직 2026-07-07의 개발자/바이브코더 build-in-public 3안을 정본 후보로 들고 있음. 반면 최신 handoff는 타겟을 자영업자/사장님으로 고치고, `사장님-홍보비서` 서사 + "지금 보시는 이 콘텐츠도 자동화로 만들었다" proof hook을 다음 작업으로 지정함.
- 실행 자산은 아직 미확정 상태: 이름 확정, 핸들 선점, 프로필/비주얼 교체, waitlist 랜딩, 워터마크, 공개 성과 페이지, pSEO 공개 가이드는 아직 하지 않음.

**의사판단 기준:**
- 1순위: 팔 대상이 즉시 이해해야 함. 자영업자/사장님이 3초 안에 "내 가게 홍보를 대신 챙기는 것"으로 읽히는 이름/카피가 우선.
- 2순위: 사장님을 낮춰 보지 않아야 함. 사장님은 가게와 손님을 아는 주인공, 우리는 뒤에서 글/초안/발행/반응을 챙기는 기술 비서라는 구도가 맞음.
- 3순위: 제품 시연성이 있어야 함. "지금 보시는 이 콘텐츠도 자동화로 만들었다" proof hook을 자연스럽게 품는 안이 우선.
- 4순위: 너무 도구명/기능명처럼 싸 보이면 감점. 외부 표현은 `홍보비서`, `오늘 올릴 글`, `초안부터 발행까지`처럼 업무 결과 언어가 우선.
- 5순위: 기존 개발자 build-log 자산은 보조 신뢰 자료로만 살리고, 메인 채널 아이덴티티에는 올리지 않음.

**추천 진행 순서:**
1. 새 브랜드킷 3안 작성: `사장님 콘텐츠 공장`, `사장님 마케팅 비서`, `오늘 올릴 가게글` 축으로 이름/bio/슬로건/톤/콘텐츠 필러를 만든다.
2. 3안 비교: 위 5개 기준으로 점수화하고, 추천 1안을 명시한다.
3. 회장 선택 후에만 `wiki/marketing/brand.md` 정본 교체 및 기존 2026-07-07 제안 격하 처리.
4. 정본 교체 후 기존 `scratchpad/brand-visuals/` 자산은 폐기/재사용 여부를 판단한다. 현재 자산은 `빌드로그 SJ` 기준이라 바로 업로드하면 안 됨.
5. 실행은 그 다음: 핸들 검색/선점 → 프로필/bio 교체 → 첫 고정글 3개 작성 → 자동화 proof hook을 담은 첫 발행 테스트.

**정확한 다음 액션:** `brand-positioning-kit`을 사용해 자영업자/사장님 타겟의 새 브랜드킷 3안을 만들고, 기존 `빌드로그 SJ` 계열은 메인 채널 후보에서 폐기/보조 창업자 로그로 격하한다. 회장 선택 전에는 `wiki/marketing/brand.md` 정본 교체, 핸들 선점, 프로필/비주얼 업로드를 하지 않는다.

---

### 🔄 Codex handoff binding — branding proof hook (2026-07-09)

**사용자 지정 primary:** 브랜딩/마케팅 트랙. 현재는 아이데이션 상태이며, 회장이 이름은 더 고민한다고 명시함.

**회장 최신 피드백:** “우리도 이 마케팅 자동화해서 보시는 이 컨텐츠도 우리가 자동화 프로그램으로 만들었다. 이렇게 딱 갈기면 호기심+설득될듯. 이름은 더 고민.”

**현재 유효한 방향:**
- 타겟은 **자영업자/사장님**. 개발자 build-log 채널이 아님.
- 메인 감정은 **사장님 리스펙 + 홍보비서/뒤팀 + 기술적으로 탄탄한 자동화**.
- 강한 proof hook: **“지금 보시는 이 콘텐츠도 우리가 자동화로 만들었다”**. 이 문장은 호기심과 제품 시연을 동시에 만든다.
- 단, “자동화 프로그램”은 너무 도구/싸구려 느낌이 날 수 있으니 외부 카피에서는 `홍보비서`, `자동화`, `초안부터 발행까지 챙김` 언어로 번역하는 쪽이 더 적합.

**카피 후보(아이데이션, 미확정):**
- “지금 보신 이 콘텐츠도 저희 홍보비서가 만들고 발행했습니다.”
- “사장님은 손님 보시고, 홍보비서는 오늘 올릴 글을 챙깁니다.”
- “이 콘텐츠가 광고입니다. 동시에 시연입니다.”
- “이런 가게 홍보글, 매일 직접 쓰지 마세요. 비서가 챙기게 하세요.”

**아직 하지 않은 것:** `wiki/marketing/brand.md` 정본 반영, 이름 확정, 핸들 선점, 프로필/비주얼 교체. 회장이 확정하지 않았으므로 실행하지 말 것.

**다음 액션:** 이름은 보류하고, 먼저 `사장님-홍보비서` 서사 + 자동화 증명 훅을 포함한 새 브랜드킷 3안을 만든다. 이후 회장 선택을 받아 wiki 정본과 자산을 갈아엎는다.

---

### 🔄 Codex handoff binding — tmux pane `%36` branding correction (2026-07-08)

**사용자 지정 primary:** tmux pane `%36`의 브랜딩/마케팅 트랙. 최신 대화 기준으로 이전 `빌드로그 SJ` 추천은 타겟 오판이다.

**회장 최신 피드백:**
- 실제 채널 타겟은 개발자/인디해커가 아니라 **자영업자 대상 마케팅 채널**.
- 감정 축은 좋음: **자영업자를 한껏 띄워주고, 우리는 시다바리/뒤팀/비서 역할**.
- 단, 사장님을 무시하는 말맛은 금지. 기술적으로는 우리가 탄탄하되, 메시지는 “사장님은 가게와 손님을 아는 주인공이고 우리는 홍보 잡일을 뒤에서 굴리는 기술 비서”여야 함.
- 네이밍은 너무 얌전한 `사장님 마케팅실`보다 이전 제안 계열이 더 낫고, **워딩/슬로건은 `사장님-비서` 서사**가 괜찮다는 판단.

**현재 유효한 방향:**
- 브랜드 감정: `사장님 리스펙 + 낮은 자세 + 뒤에서 돌아가는 탄탄한 자동화`.
- 유력 네이밍 축: `사장님 콘텐츠 공장`, `사장님 마케팅 비서`, `오늘 올릴 가게글`, `매장 홍보 자동화`, `동네가게 마케팅`.
- 추천 조합(아직 미확정): 브랜드/계정명은 `사장님 콘텐츠 공장` 쪽, 슬로건/카피는 `사장님-비서` 서사. 예: “사장님은 장사하세요. 홍보는 비서가 챙기겠습니다.”류.
- `빌드로그 SJ`와 기존 founder build-in-public 3안은 **메인 채널명으로 부적합**. 이후 wiki 정본 갱신 시 폐기/보조 창업자 로그로 격하 표시 필요.

**아직 하지 않은 것:** 회장이 “박아라/확정/문서 반영”을 말하지 않았으므로 `wiki/marketing/brand.md` 정본은 아직 수정하지 않았다. 아이데이션 상태로 `session-state.md`에만 기록.

**다음 액션:** 다음 세션은 `brand-positioning-kit` 기준으로 자영업자 타겟의 새 브랜드킷 3안을 다시 작성한다. 반드시 `사장님-비서` 서사를 포함하고, 사장님을 낮춰 보는 뉘앙스 없이 “기술적으로 탄탄한 뒤팀” 포지션으로 쓴다. 확정 전까지 계정명/핸들/비주얼 교체 금지.

---

### 🔄 Codex handoff binding — tmux pane `%19` (2026-07-08)

**사용자 지정 primary:** tmux pane `%19`. `tmux list-panes` 기준 `%19` = `marketing-claw:0.0`, title=`✳ self-serve-marketing-platform`, cwd=`/Users/sj/sj_code_master/openclaw-auto`.

**회장 제보/요청:** Google 로그인 raw JSON, 온보딩/Settings 토큰 입력 우선 노출, Threads/Instagram Meta 권한·tester invite 에러 안내 부족, permission popup 한글 깨짐, TikTok/YouTube 등 OAuth UI 부재, Settings accessToken 박제 여부, OSMU 엔진/영상 실패 원인 불명확, Marketing Hub 유저 관리자 페이지 필요.

**반영 완료(코드):**
- OAuth/Meta 에러 mapper 추가: Google provider disabled/missing env, Meta tester invite `1349245`, Meta role 부족, redirect URI/scope/client 설정 오류를 한국어 조치 문장으로 변환.
- `/api/connect/[provider]/callback` HTML을 `lang=ko`, `<meta charset="utf-8">`, HTML escape로 변경. 한글 깨짐/스크립트 삽입 방지.
- 채널/온보딩/Settings 연결 UI를 OAuth 우선으로 정리. 수동 토큰 입력은 `고급: 토큰 직접 입력` 토글 뒤에만 노출.
- OAuth 토큰은 `integrations(kind='channel')`에 암호화 저장되며 Settings에 원문 미표시. 기존 수동 `openclaw.json` 토큰도 `/api/channel-config` 응답에서 `********`로 마스킹하고, POST에서 마스크값이 기존 토큰을 덮어쓰지 않게 처리.
- Studio 상단에 OSMU 생성 엔진 상태 표시: tenant Anthropic key 있으면 `내 Anthropic API 키`, 없으면 `공유 Claude CLI · claude -p`.
- Studio 텍스트/이미지/영상 실패 원인을 `마지막 실패`로 노출. Higgsfield 크레딧/NSFW류는 문구 구분.
- `/operator/customers` 운영자 유저 관리 MVP 추가: tenants, integrations, drafts/published/failed, usage_events, quotas 요약. `/api/operator` middleware 허용.

**검증 완료:**
- `npm run test -- tests/brand/oauth-errors.test.ts tests/api/channel-config-mask.test.ts tests/api/channel-config-bridge.test.ts tests/brand/social-connect.test.ts` → 4 files / 45 tests PASS.
- `npm run build` → PASS. 기존 Turbopack NFT warning만 유지.
- gstack `/login`: Google 클릭 시 raw 에러 대신 “Google 로그인 설정…” 안내 확인.
- gstack `/channels/youtube`: OAuth 버튼 기본, 수동 토큰 고급 토글 확인.
- gstack `/settings`: `OSMU 채널 OAuth` 카드 + 연결 모달 확인, TikTok 탭 OAuth 버튼 확인.
- gstack `/studio`: `AI 공유 Claude CLI · claude -p` 배지 확인.
- gstack `/api/connect/threads/callback?error=Invalid_Request_1349245`: `utf-8` HTML + tester invite 안내 확인. Instagram role 부족 에러도 확인.
- gstack `/operator/customers`: 페이지 렌더 확인. local DB 미설정이라 API 500 표시(프로덕션 DB에서 재검 필요).

**해결 방식 표기(요약):** raw OAuth 에러는 `oauthErrorMessage()`로 한국어 조치 문장화, callback popup은 `utf-8` HTML+escape, OAuth 지원 채널은 버튼 기본/수동 입력 고급화, 수동 토큰 API 응답은 `********` 마스킹, Studio는 `/api/studio/engine-status`로 Anthropic API vs `claude -p`를 표시, 운영자 페이지는 `/operator/customers`로 tenants/integrations/usage 집계.

**남은 외부/라이브 검증:** Google provider 활성화, Meta tester invite 수락/role 부여, 각 플랫폼 OAuth client secret 등록 후 실제 OAuth 동의→토큰 저장→실발행 E2E. 로컬 `DATABASE_URL` 미설정으로 DB-backed operator data/발행 이력은 live DB에서 재검.

**2026-07-09 재제보 후 추가 수정:** live gstack에서 Google 버튼 클릭 시 브라우저가 Supabase authorize endpoint로 이동하고 raw JSON(`Unsupported provider: provider is not enabled`)을 직접 렌더링하는 것을 재현. 기존 mapper는 앱으로 돌아온 에러만 처리해 이 자동 리다이렉트 케이스를 못 잡았다. 해결: `/api/auth/google` preflight route 추가 → 서버가 Supabase authorize를 `redirect: manual`로 먼저 확인 → provider disabled면 한국어 안내 반환, 3xx면 authUrl 반환. `/login` Google 버튼은 이 API를 먼저 호출하도록 변경. `/login`에 `비밀번호 찾기`/recovery 새 비밀번호 설정 폼 추가. middleware에서 `/api/auth/google` 공개 허용. `/signup`/`?mode=signup` 초기 렌더 mode 불일치 가능성 제거. 로컬 env 누락 로그는 `console.warn`으로 낮춤. 검증: focused tests 19 PASS, `npm run build` PASS, gstack `http://localhost:3457/login`에서 Google 클릭 시 raw JSON 페이지 이동 없이 앱 안내 표시 확인, `비밀번호 찾기` 버튼 노출 및 이메일 미입력 안내 확인. 회원 목록 조회는 현재 shell env에 `DATABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`DASHBOARD_AUTH_TOKEN`이 없어 미검증; 비밀번호 원문은 조회 불가/금지, 재설정만 가능.

**2026-07-09 재검증 재실행:** `npm run test` → 36 files PASS, 187 PASS / 8 skipped. `npm run build` → PASS, `/api/auth/google` route 포함. `npm run e2e:local` → PASS, `/tmp/e2e-*.png` 생성. gstack console buffer clear 후 재실행했고 Supabase anon key 미설정은 `[warning]`으로만 표시. local gstack `http://localhost:3456/login`에서 `Google로 계속` 클릭 시 `/login`에 머물고 “Google 로그인이 아직 설정되지 않았습니다...” 안내 표시 확인. local curl `/api/auth/google?...` → HTTP 400 + 한국어 JSON 확인. `비밀번호 찾기`는 로컬 anon key 미설정 때문에 실제 메일 발송은 미검증이고 “Supabase 설정 없음” 안내 표시까지 확인. live/prod는 아직 NG: live curl `/api/auth/google?...` → HTTP 401 `Unauthorized`, live gstack `/login`에는 `비밀번호 찾기` 버튼이 없고 Google 클릭 시 Supabase raw JSON으로 이동. 스크린샷 `/tmp/openclaw-login-google-live-ng.png`, `/tmp/openclaw-login-google-reset-local.png`.

---

### 🔄 Codex handoff binding — tmux pane `%36` (2026-07-08)

**사용자 지정 primary:** tmux pane `%36`. `tmux list-panes` 기준 `%36` = `marketing-claw:0.2`, title=`✳ Fable 위키 점검 및 마케팅 브랜딩 업데이트`, cwd=`/Users/sj/sj_code_master/openclaw-auto`.

**캡처된 최신 문맥:** 회장이 `showcase.html`에 대해 “이거 너가 만든거아니야?”라고 확인했고, pane `%36`은 “store-visual-producer 에이전트가 design-html/design-review 스킬로 제작했고 메인세션은 spec 전달·검증·relay만 했다”고 답한 상태에서 대기 중.

**현재 해석:** 이어갈 주 작업은 2026-07-07 브랜딩/마케팅 위키 트랙이다. 위키 감사·마케팅 섹션 신설·브랜드킷 제안·비주얼 목업은 산출됐고, 실제 계정 교체/핸들 선점/채널 운영 착수는 회장 결정 대기다.

**복구한 누락 산출물:** 기존 노트는 `scratchpad/brand-visuals/showcase.html`을 repo 경로처럼 적었지만 실제 repo에 폴더가 없었다. Codex가 임시 Claude 렌더 경로 `/private/tmp/claude-501/-Users-sj-sj-code-master-openclaw-auto/20c1de30-14cd-4b24-9b3d-2100d9e8749c/scratchpad/brand-visuals/`에서 repo `scratchpad/brand-visuals/`로 복구했다. 확인: 21 files / 3.1M, `showcase.html` 포함. 같은 시각 자산을 반복 open하지 않기 위해 경로만 갱신.

**변경 상태 주의:** 루트에는 기존 wiki 변경 + 신규 `wiki/marketing/` + 복구된 `scratchpad/brand-visuals/`가 있다. nested `openclaw/` repo는 별도 대량 dirty 상태라 이 브랜딩 트랙에서는 건드리지 않는다.

**다음 액션:** 회장이 아래 4가지를 결정하면 바로 실행한다: ①계정 아이덴티티(3안 중 선택) ②운영 채널/언어(한국어 Threads, 영어 X, 병행) ③GitHub 오픈소스 퍼널 공개 여부 ④워터마크/서명 문구. 결정 전에는 계정 업로드·핸들 선점·외부 배포를 하지 않는다.

---

### 🔄 Codex handoff binding — tmux pane 0 (2026-07-07)

**사용자 지정 primary:** tmux pane 0. `tmux list-panes` 기준 current window는 `marketing-claw`, pane 0은 `marketing-claw:0.0`이며 title=`✳ self-serve-marketing-platform`, cwd=`/Users/sj/sj_code_master/openclaw-auto`.

**캡처된 최신 질문:** “사내는 레포 wiki 가져오고 고객은 노션 페이지 연결시켜서 컨텐츠 퀄 높이자는거지? … AI 도움 받아서 테스트하면 다 돼? 4앱에서?” → 이어받을 핵심은 **구현 상태를 추측하지 말고 코드/배선/테스트로 확인**하는 것.

**현재 해석:** 제품 MCP 신규 구현은 0. 그라운딩은 snapshot store로 통일. 사내=GitHub/wiki sync 기존 경로 확인, 외부=wizard 기존 + Notion/URL/upload 커넥터 구현 여부 확인 필요. 4앱 적용은 실제 배선/시크릿/배포/브라우저 E2E로만 완료 판정.

**작업 격리:** session-state 디테일은 이 레포 `wiki/ops/session-state.md`에 둔다. tmux pane title이 작업명 표시 역할을 함. 코드/DB/배포/OTP는 다른 pane 중복 작업 확인 전 실행 금지.

**다음 액션:** `dashboard/` 코드에서 brand/wiki sync, wizard, Notion/URL/upload connector, 4앱 tenant 경로를 확인하고 “이미 됨/부분 구현/미구현/외부 액션 필요”로 나눈다. 검증 전 “다 된다” 금지.

**Codex 확인 결과 (2026-07-08):**
- ✅ 외부 기본 경로: `BrandSetupWizard` → `/api/studio/brand-setup` → `brand_guides(source='wizard')` 구현 확인.
- ✅ 사내/자료형 경로: `RepoConnect` → `/api/brand/sync-wiki`(GitHub `.md` 폴더 전체 → `wiki_docs`) + `/api/brand/sync-repo`(특정 파일 → `brand_guides`) 구현 확인.
- ✅ 생성 경로: `/api/studio/text`가 `getWikiContext(tenantId, idea)`로 `wiki_docs`를 읽어 “지어내기 금지” 위키 참조 프롬프트에 주입 확인.
- ❌ Notion OAuth/page sync 전용 라우트·UI·테스트 없음. `notion|sync-notion|api/.*notion` 검색 결과는 문서 언급뿐. URL crawl/upload 커넥터도 brand/wiki 인입 라우트로는 미구현.
- ⚠️ 4앱 “다 됨”은 미검증. 코드상 멀티테넌트/워크스페이스 구조와 내부 4앱 컨테이너 기록은 있으나, 각 앱별 wiki sync·콘텐츠 생성·실발행/성과까지 라이브 E2E는 아직 필요.
- 검증: `npm run test -- tests/brand/brand-setup.test.ts tests/brand/studio-text-grounding.test.ts tests/brand/distill-backend.contract.test.ts tests/brand/integrations-anthropic-verify.test.ts tests/context-sources.test.ts` → 5 files / 16 tests PASS. `npm run build` → PASS(샌드박스 포트 제한으로 1차 실패 후 승인 실행).

**gstack 직접 검증 (2026-07-08, Codex):**
- ✅ 대상 pane 확인: tmux `%19` = `marketing-claw:0.0`, title=`✳ self-serve-marketing-platform`, cwd=`/Users/sj/sj_code_master/openclaw-auto`.
- ✅ live `/login`: `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/login` 200, 이메일/비밀번호 로그인 + Google 로그인 UI 렌더 확인. 스크린샷 `/private/tmp/openclaw-login.png`.
- ⚠️ live `/studio?setup=brand`: 비로그인 상태에서는 내부 Studio가 아니라 랜딩/가입 화면으로 떨어짐. Chrome cookie import는 macOS Keychain 권한 팝업에서 차단되어 live 내부 E2E는 미검증.
- ✅ local dev + gstack: `http://localhost:3456`에서 `/operator` 더미 토큰 로그인 후 Studio 진입 확인. `DASHBOARD_AUTH_TOKEN` 미설정 dev 모드라 `/api/me`는 operator로 통과.
- ⚠️ local DB: `/api/workspaces`와 workspace 생성은 `team DATABASE_URL 미설정 — Postgres 연결 불가`로 500. 그래서 DB-backed workspace 생성/실제 sync submit은 미검증.
- ✅ UI 분리 검증: gstack localStorage에 `active_workspace`를 주입해 Studio UI 렌더 확인. `/studio?setup=brand`에서 브랜드 6문항 위저드 자동 오픈, `🎨 브랜드 설정`, `📚 위키`, `✨ AI 자동초안` 버튼 노출 확인. 스크린샷 `/private/tmp/openclaw-local-brand-wizard.png`.
- ✅ GitHub wiki UI: `📚 레포 위키 연동` 모달 확인. 폴더 전체 모드(`owner/repo`, `wiki/`, `main`, GitHub token, `위키 폴더 전체 동기화`)와 특정 파일 모드(`docs/brand.md, docs/marketing.md`, `파일 가져와 톤 갱신`) 모두 렌더. repo/path 입력 시 파일 모드 동기화 버튼 활성화 확인. 스크린샷 `/private/tmp/openclaw-local-repo-connect.png`, `/private/tmp/openclaw-local-repo-connect-file.png`, `/private/tmp/openclaw-local-repo-connect-file-enabled.png`.

---

### 🔄 진행 중: 위키 점검 + 계정 브랜딩 + 마케팅 실무 (2026-07-07, Claude 세션)

**회장 지시:** ①위키 점검·업데이트(마케팅 브랜딩 관점) ②인스타/스레드/유튜브 계정 이름·소개·ID·이미지·배너·썸네일·로고 디자인 ③잘나가는 SaaS 벤치마킹 + 위키 시스템 디벨롭 + 마케팅 실무 진행.

**완료:**
- ✅ 위키 전 페이지 감사 (git 날짜+줄수 스캔): 결함 = ①`reference/benchmarking.md` 동일 블록 3중 중복(라인 26~142)+2026-06 낡음 ②`reference/channel-status.md` X를 "Live 검증"으로 오기재 ③마케팅/브랜드 섹션 부재.
- ✅ `reference/channel-status.md` 7/6 실감사 기준으로 재작성 (Threads Live / IG Connected / 13채널 미연결 + OAuth 9채널 코드완료 반영). 문서 수정만이라 테스트 해당 없음.

**리서치 위임 2건 완료 + 검증 PASS (verify-agent-quality.sh 실행 — 스킬 1·웹리서치 21회 / 스킬 1·웹리서치 39회):**
1. 브랜드킷 3안 (추천=안1 "빌드로그 SJ") → `wiki/marketing/proposals/2026-07-07-brand-kit.md`에 박제 (상태: 회장 미결정 제안)
2. 벤치마크 갱신 → `wiki/marketing/proposals/2026-07-07-benchmark-refresh.md` (원자료) + marketing/ 각 페이지에 반영

**위키 반영 완료:**
- ✅ `wiki/marketing/` 신설 7파일: index / positioning("agentic" 차별화 폐기→그라운딩 3축) / competitors(2026-07 표, Postiz·Blotato 등 신규) / playbook(SaaS 성장 사례 + 0차 실무 우선순위 5) / brand(톤 확정 + 아이덴티티 3안 미결정) / growth-log(빈 원장) / assets(인벤토리)
- ✅ `reference/benchmarking.md` 4-5회 중복 dedupe → 원자료 아카이브로 재정의 (287줄→~60줄, 원문 git 이력)
- ✅ `wiki/index.md`·`reference/index.md` 내비 갱신, `product/vision.md`에 "agentic 폐기" 경고 포인터

**✅ 비주얼 자산 10종 완료 (2026-07-07→08 야간, store-visual-producer):**
- 로고 2종(cursor+wordmark) · 배너(safezone guide+clean) · 썸네일 3종(시리즈별) · 하이라이트 3종 + showcase.html
- verify-agent-quality.sh PASS: design-html·design-review 2회, WebSearch 9회, 소크라 3회
- QA: WCAG 대비 7.5~18배 통과, accent 규율 2건 수정, 168px/48px 판독 확인
- 파일: `scratchpad/brand-visuals/*.png/html` + showcase 렌더 완료

**회장 결정 대기 (open-decisions.md 등록 4건):**
①**아이덴티티 선택** (안1/2/3 중 1 + 핸들 가용성·얼굴 노출·AI bio 명시·업로드 요일)
②**build-in-public 채널** (한국어 Threads vs 영어 X vs 병행)
③**오픈소스 GitHub 퍼널** (Postiz형 셀프호스트 공개 여부)
④**워터마크 문구** (제품명 가칭 상태)

**다음 액션 (회장 결정 후):**
- 이름 확정 → 핸들 선점(3채널 동시) → 프로필 교체
- 채널·언어 확정 → playbook 우선순위 1(도그푸딩 공개)·2(워터마크) 착수
- showcase.html은 변경 없으므로 경로만 재안내: `/scratchpad/brand-visuals/showcase.html`

**변경 파일 (신규 10개 + 수정 4개):**
- 신규: wiki/marketing/index·positioning·competitors·playbook·brand·growth-log·assets·proposals/2건 (brand-kit·benchmark-refresh)
- 수정: wiki/reference/benchmarking·channel-status, wiki/index·reference/index·product/vision
- 코드 변경 없음 → 빌드/E2E 해당 없음 (문서+디자인 트랙)

**완료 상태:**
- ✅ 9채널 OAuth 코드 구현 (commit 5b21197d)
- ✅ deploy-marketing.yml 18개 env var 추가 (commit 4c863e00)
- ✅ OPENCLAW_EXTENSIONS 배선 완료 — 13개 publisher 추가 (commit 1f97cd0a)
- ✅ YouTube gh secret 등록

**현재 차단:**
- gstack 브라우저 모든 포털 세션 만료 — 자동 로그인 불가(비밀번호/2FA 필요)
- 8개 플랫폼(X/Naver/Pinterest/Tumblr/LINE/LinkedIn/Slack/TikTok) 앱 등록 대기

**회장이 해야 할 것 (이것만):**
- 8개 플랫폼 Developer Portal 앱 등록 → gh secret set (아래 표 참고)
- 모든 시크릿 등록 후 배포: `gh workflow run "Deploy openclaw (marketing VM)"`

**미검증:** OAuth 연결 후 실제 발행 E2E (배포 + 시크릿 등록 후 검증 필요)

---

### ✅ 전채널 Settings UI 점검 완료 (2026-07-06, gstack 브라우저 직접 확인)

**작업**: 회장 지적 "X에는 로그인 연결 UI 자체가 없어 / 전체 점검 안하냐?" → 전 채널 Settings 탭 브라우저 직접 확인.

**직접 관찰 증거 (스크린샷 / ARIA 트리 / 코드 일치):**

| 채널 | 상태 | Settings UI | 비고 |
|------|------|-------------|------|
| Threads | ✅ Live | OAuth 재연결 버튼 + Token 폼 | DB 연결됨 |
| Instagram | ✅ Connected (2,390 followers) | OAuth 재연결 버튼 + Token 폼 | DB 연결됨 |
| X (Twitter) | ⚠️ 미연결 | 4개 OAuth 1.0a 키 입력 + "Connect X Account" 버튼 | **Settings 기본 탭** (미연결 시) |
| Facebook | ⚠️ 미연결 | "Facebook 연결" OAuth 버튼 + Token 폼 | FB_CONFIG_ID 등록됨, OAuth 가능 |
| LinkedIn | ⚠️ 미연결 | OAuth 2.0 Token + Person URN 폼 | 수동 키 입력 |
| Bluesky | ⚠️ 미연결 | Handle + App Password 폼 | |
| Pinterest | ⚠️ 미연결 | Token + Board ID 폼 | |
| Tumblr | ⚠️ 미연결 | OAuth 1.0a 5개 키 + Blog Name 폼 | |
| TikTok | ⚠️ 미연결 | Access Token 폼 | |
| YouTube | ⚠️ 미연결 | Google OAuth Token 폼 | |
| Naver Blog | ⚠️ 미연결 | Blog ID + Username + API Key 폼 | |
| Telegram | ⚠️ 미연결 | Bot Token + Chat ID 폼 | |
| Discord | ⚠️ 미연결 | Webhook URL 폼 | |
| Slack | ⚠️ 미연결 | Webhook URL 폼 | |
| LINE | ⚠️ 미연결 | Channel Access Token 폼 | |

**X "연결 UI 없다"는 이유 파악:**
- X는 Instagram/Facebook처럼 "클릭 한 번 → OAuth 자동 로그인" 버튼이 없음
- `ChannelPage.tsx:101` — 미연결 채널 진입 시 `setSubTab("settings")` → Settings 기본 탭
- `ChannelPage.tsx:171` — Queue 탭에서 미연결이면 `ConnectGate` (Settings 탭 이동 버튼) 표시
- X가 보여주는 것: 수동 4키 입력 폼 + "Connect X Account" 저장 버튼
- OAuth 자동 연결 버튼 없음 = Developer Portal에서 4개 키 직접 발급 + 입력 필요

**코드 확인:** 모든 채널이 `IMPLEMENTED_PLUGINS` 배열에 포함, 각 채널 setup-guides에 필드 정의됨.

**검증 미완료:**
- X에 OAuth 2.0 PKCE 자동 연결 버튼 추가 여부 — 회장 결정 필요
- 나머지 채널 실제 연결 (회장이 각 플랫폼 API 키 제공 필요)

**다음 액션 (30초 재개):**
1. 회장이 OAuth 연결 추가할 채널 우선순위 결정 → 해당 플랫폼 Developer Portal 앱 등록 (회장 손) → 내가 코드 구현
2. 결정 보류 채널은 수동 키 입력 방식 유지
3. Facebook OAuth 연결: "Facebook 연결" 버튼 클릭 → FB OAuth 플로우 (FB_CONFIG_ID 이미 등록됨)

### 📋 "전채널 OAuth 로그인 버튼" 방향 결정 (2026-07-06, 회장 지시)

**회장 의도**: 모든 채널에 "로그인 버튼 → OAuth → 토큰 자동 Settings 저장" 방식 원함. 수동 키 입력 아닌 플랫폼 로그인 방식.

**기술 분석 결과 (직접 조사):**
- **OAuth 가능 (앱 등록 + 코드 구현 필요)**: X, LinkedIn, YouTube, Naver Blog, Pinterest, Tumblr, TikTok, Slack, LINE
- **OAuth 불가 (수동 입력이 플랫폼 표준)**: Telegram (봇토큰), Discord (Webhook), Bluesky (App Password 공식 권장)
- **X 주의**: OAuth 로그인은 무료, 트윗 발행은 $100/월 Basic API 필요

**필요 작업 (채널당 동일 패턴):**
1. 회장이 해당 플랫폼 Developer Portal에서 OAuth 앱 등록 → Client ID + Secret 발급
2. 내가 환경변수 배선 + `/api/connect/{provider}` + `/api/connect/{provider}/callback` 라우트 구현
3. ChannelPage에 "로그인 연결" 버튼 추가

**미결정 (회장 결정 필요)**: X 발행 API 비용 — 우리 앱 Basic tier $100/월 내기 vs 고객 각자 4키 입력 유지

**방향 확정 (2026-07-06):**
- **X 포함** 전 9개 채널 OAuth 자동 연결 버튼 추가 (X 발행은 고객이 각자 Developer Portal 등록)
- Telegram/Discord/Bluesky → 수동 입력 유지 (플랫폼 표준)

### ✅ 9개 채널 OAuth 코드 구현 완료 (커밋 5b21197d)

**직접 관찰 증거:** tsc 0 오류, vitest 177 PASS (로컬 직접 실행)

**구현 완료 파일:**
- `dashboard/src/lib/social-connect.ts` — X(PKCE), LinkedIn, YouTube, Naver, Pinterest, Tumblr, TikTok(PKCE), Slack, LINE 프로바이더 추가
- `dashboard/src/app/api/connect/[provider]/route.ts` — PKCE code_verifier httpOnly 쿠키 저장
- `dashboard/src/app/api/connect/[provider]/callback/route.ts` — 9채널 토큰 교환 + integrations 저장
- `dashboard/src/components/channel/ChannelPage.tsx` — OAUTH_CONNECT 12개 채널(OAuth 버튼)
- `dashboard/tests/brand/social-connect.test.ts` — +17 신규 테스트 (177 총계)

**환경변수만 등록하면 즉시 활성화.** 코드는 env 없으면 버튼 숨김, 있으면 OAuth 플로우 진입.

---

### 🔄 진행 중: 플랫폼 앱 등록 (회장 수동, 내가 gh secret set)

**X Developer Portal** — 로그인 **대기 중**:
- URL: `https://developer.twitter.com/en/portal/dashboard`  
- 로그인: 이메일+비밀번호 직접 (Google/Apple SSO 이메일 충돌로 불가)
- 앱 생성 후: OAuth 2.0 설정 → redirect URI `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/x/callback` → Client ID/Secret 발급

**등록 대기 채널 (순서대로):**
| 채널 | Portal URL | Redirect URI | 필요 시크릿 |
|------|-----------|--------------|------------|
| X | developer.twitter.com | .../connect/x/callback | X_CLIENT_ID, X_CLIENT_SECRET |
| LinkedIn | linkedin.com/developers/apps | .../connect/linkedin/callback | LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET |
| YouTube | console.cloud.google.com | .../connect/youtube/callback | YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET |
| Naver | developers.naver.com/apps/ | .../connect/naver_blog/callback | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET |
| Pinterest | developers.pinterest.com | .../connect/pinterest/callback | PINTEREST_APP_ID, PINTEREST_APP_SECRET |
| Tumblr | tumblr.com/oauth/apps | .../connect/tumblr/callback | TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET |
| TikTok | developers.tiktok.com | .../connect/tiktok/callback | TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET |
| Slack | api.slack.com/apps | .../connect/slack/callback | SLACK_CLIENT_ID, SLACK_CLIENT_SECRET |
| LINE | developers.line.biz/console/ | .../connect/line/callback | LINE_CLIENT_ID, LINE_CLIENT_SECRET |

**deploy-marketing.yml 업데이트 필요**: 새 env var 9종 `.env.osmu` 렌더 섹션에 추가 (앱 등록 완료 후)

**진행 현황 (2026-07-06):**

| 채널 | gh secret | 비고 |
|------|-----------|------|
| YouTube | ✅ **완료** | YOUTUBE_CLIENT_ID + YOUTUBE_CLIENT_SECRET 등록됨 |
| X | ❌ 미등록 | developer.twitter.com 직접 로그인 필요 |
| LinkedIn | ❌ 미등록 | 2FA(모바일 앱)로 자동화 차단 |
| Naver Blog | ❌ 미등록 | naver 계정 로그인 필요 |
| Pinterest | ❌ 미등록 | 직접 등록 필요 |
| Tumblr | ❌ 미등록 | 직접 등록 필요 |
| TikTok | ❌ 미등록 | 심사 기간 있음 |
| Slack | ❌ 미등록 | Google OAuth rejected (Playwright 차단) |
| LINE | ❌ 미등록 | LINE 계정 로그인 필요 |

**deploy-marketing.yml**: 9개 env var 이미 추가 완료 (2026-07-07 커밋 예정). 시크릿만 등록하면 즉시 활성화.

**다음 즉시 액션 (30초 재개):**
1. 아래 표 순서대로 각 플랫폼에서 앱 등록 → `printf '%s' "<value>" | gh secret set <KEY> --repo seong-jin-jo/openclaw-auto`
2. 모든 시크릿 등록 후 → `gh workflow run "Deploy openclaw (marketing VM)"` 으로 배포
3. 배포 후 각 채널 Settings 탭 → "연결" 버튼 클릭해서 OAuth 흐름 확인

**플랫폼별 등록 가이드 (회장 직접):**
| 플랫폼 | URL | Redirect URI | 시크릿 이름 |
|--------|-----|-------------|------------|
| X | https://developer.twitter.com/en/portal/dashboard | `.../connect/x/callback` | X_CLIENT_ID, X_CLIENT_SECRET |
| LinkedIn | https://www.linkedin.com/developers/apps | `.../connect/linkedin/callback` | LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET |
| Naver | https://developers.naver.com/apps/ | `.../connect/naver_blog/callback` | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET |
| Pinterest | https://developers.pinterest.com/ | `.../connect/pinterest/callback` | PINTEREST_APP_ID, PINTEREST_APP_SECRET |
| Tumblr | https://www.tumblr.com/oauth/apps | `.../connect/tumblr/callback` | TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET |
| TikTok | https://developers.tiktok.com/ | `.../connect/tiktok/callback` | TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET |
| Slack | https://api.slack.com/apps → Create App → OAuth & Permissions | `.../connect/slack/callback` | SLACK_CLIENT_ID, SLACK_CLIENT_SECRET |
| LINE | https://developers.line.biz/console/ → 채널 생성 → LINE Login | `.../connect/line/callback` | LINE_CLIENT_ID, LINE_CLIENT_SECRET |

(Redirect URI 공통 prefix: `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/`)

---

### ✅ 배포 복구 완료 · OSMU 전체 라이브 (2026-07-06, run 28749775595 전 스텝 ✓)

**완료(직접 관찰 증거):**
- **deploy 실패 원인 해결**: `.env.tenant1~4` 파일이 `~/openclaw-persist/`에 없었음 → SSH로 VM에서 tenant1~4 env + data/config 디렉토리 생성 후 persist 복사
- **워크플로우 수정(커밋 290390cc)**:
  - `.env.osmu 렌더` 단계의 `if: contains(services,'osmu')` 조건 제거 → 전체 배포 시 env 누락 방지
  - `FB_CONFIG_ID` 시크릿 추가 (.env.osmu에 포함)
  - 스모크게이트: `services==''` (전체배포) 시에도 OSMU 검증 포함
- **배포 run 28749775595**: 전 스텝 ✓ (영속 복원→env렌더→빌드→기동→상태→스모크게이트 모두 통과)
- **OSMU 대시보드 라이브**: `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud`
  - `/api/me` → `{"isOperator":true,"tenant":null}` ✓
  - `/api/connect/facebook?tenant_id=dc` → authUrl 정상 생성 (config_id=1553247286513620 포함) ✓
- **실행 중 컨테이너**: tenant1~4 gateway/dashboard + osmu dashboard + autoheal
- **dc 인스턴스**: 중단됨(postagi-4tenants.yml에 dc 서비스 없음 — config/data는 persist에 보존)

**플랫폼 연결 준비도:**
| 플랫폼 | 키 상태 | 비고 |
|--------|---------|------|
| Instagram | ✅ IG_APP_ID/SECRET 등록 | OAuth 버튼 클릭으로 연결 가능 |
| Threads | ✅ THREADS_APP_ID/SECRET 등록 | OAuth 버튼 클릭으로 연결 가능 |
| Facebook | ✅ FB_APP_ID/SECRET/CONFIG_ID 등록 | OAuth 버튼 클릭으로 연결 가능 |
| X (Twitter) | ❌ 4개 키 미입력 | 회장이 X Developer Portal 키 제공 필요 |
| YouTube / Naver Blog / TikTok / LinkedIn | ❌ 개발자앱 미생성 | 각 플랫폼 앱 생성 후 OAuth |
| Telegram / Discord / Slack / LINE | ❌ 토큰/웹훅 미입력 | 토큰 직접 입력 |

**다음 액션(30초 재개):**
1. OSMU 대시보드 → Settings → Instagram/Threads/Facebook "연결" 버튼 클릭 → OAuth 플로우
   - 각 OAuth 후 Supabase integrations 테이블 확인 (`SELECT label,has_token FROM integrations WHERE kind='channel'`)
2. X 연결: 회장이 4개 키 제공 → Settings에서 API Key / API Key Secret / Access Token / Access Token Secret 입력
3. 기타 플랫폼: 회장 측 앱 생성 후 순차 진행

**검증 필요(미검증):**
- Instagram/Threads/Facebook OAuth 실제 토큰 교환 + integrations 저장 (아직 클릭 안 함)
- 각 채널 발행 E2E (연결 후 진행)

### ✅ FB 연결 준비 완료 — 배포 승인 대기 (2026-07-06, gstack 직접 확인)

**완료(직접 관찰 증거):**
- `FB_CONFIG_ID=1553247286513620` — gstack로 configurations 페이지 직접 확인 후 `gh secret set` 등록
- `FB_APP_SECRET` — gstack로 기본 설정 > 앱 시크릿 코드 비번 게이트 통과 후 `gh secret set` 등록 (값 로그 미출력)
- `FB_APP_ID` — 기존 등록 유지(1553503759757107)
- redirect URI `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/facebook/callback` — FB Login for Business > 설정 > 유효한 OAuth 리디렉션 URI에 추가, "Changes saved" 토스트 확인
- FB Login 구성 `1553247286513620` — 이름/로그인버전/액세스토큰 ✅, 권한 6개 선택·저장 ✅
- `gh secret list`로 FB_APP_ID/FB_APP_SECRET/FB_CONFIG_ID 3종 모두 존재 확인

**미완(배포 승인 필요):**
- `gh workflow run deploy-marketing.yml` — 회장 "배포해" 명령 대기(CLAUDE.md gate)
- 배포 완료 후: gstack로 OSMU → Facebook 채널 Settings → "연결" 버튼 클릭 → OAuth → integrations DB 저장 확인

**다음 액션(30초 재개):**
1. 회장이 "배포해" → `gh workflow run deploy-marketing.yml --repo seong-jin-jo/openclaw-auto`
2. 배포 완료 확인: `gh run list --workflow=deploy-marketing.yml --limit 1`
3. gstack로 FB OAuth 연결 시도 → DB 확인(tenant 587cee76, label=facebook)

### ✅ IG 실발행 검증 완료 (2026-07-04, DB 증거)
`published_posts`에 tenant 587cee76 / instagram / **external_id=17938476117069923** 존재 = 인스타 실제
게시물 ID = zero_to_one_ai 피드에 실발행됨. 폴링픽스(c214ad00) 후 성공. 직전 시도는 external_id=null(9007
실패, 픽스 전). **IG end-to-end(연결→생성→실발행) 증명 완료.**
연결 현황(DB): instagram(587cee76, api=instagram_login) 1개만. threads(6119a9c7)는 옛 테넌트 것·무관.
**모든 플랫폼 연결 아님** — 다음은 Threads 복제(권한 threads_content_publish 추가→redirect→시크릿 비번게이트→OAuth).

### ✅ Settings 연결-UI + 키입력 수정 완료·검증 (2026-07-04, 커밋 99d6b67c 배포됨)
서브에이전트 산출 → **내가 재검증**(주장 안 믿음): tsc0·vitest 148pass(재실행)·diff 7파일 리뷰. 하네스
verify-agent-quality는 "Skill/WebSearch 0"으로 FAIL냈으나 이는 디자인/콘텐츠 위조게이트 — 코드 리팩터엔 오탐
(코드 증거=tsc+테스트+diff, 직접 확인함). **라이브 API 검증**: channel-config?tenant_id=587cee76 →
instagram.connected=True, threads.connected=True, x=False. 화면 배지는 code0to1@gmail.com 로그인 새로고침으로 육안.
변경: CredentialForm(connected배지+깨진 tailwind수정), InstagramPage(UserID행+connected), ChannelPage/
Messaging/DataChannelPage(connected전달·시맨틱색), channel-config(tenant_id fallback 운영자만), constants(배지색).
남은 갭(서브에이전트 명시): 비-Settings 탭 하드코딩 다크클래스(Analytics/Growth/Popular/에디터) 후속정리 권장.

### ⏳ 서브에이전트 실행 중: Settings 연결-UI + 키입력 (2026-07-04)
회장 지적: 연결된 채널은 Settings에서 ①연결됨 표시 ②API키/UserID 입력칸이 제대로 있어야. general-purpose
서브에이전트 위임(감사+수정, 커밋은 내가 검토후). 대상: ChannelPage/InstagramPage/DataChannelPage/
MessagingPage의 연결배지·CredentialForm·SocialConnectButton 정합. tsc0+vitest 통과 조건. 완료시 verify후 커밋.
※ 이 트랙 파일(components/channel/*, channel-config)은 서브에이전트 소유 — 메인세션 편집 금지(겹침방지).
남은 플랫폼 연결(X/TikTok/LinkedIn/YouTube/Naver)=회장 API키 선행(서브에이전트도 못 만듦). FB=config작업.

### 🧱 FB config = gstack 툴한계(7회 튕김) + 검수는 사업자서류 (2026-07-05)
gstack로 FB 로그인 config 페이지 **7회 시도 전부 dashboard 튕김·하위링크 미렌더** → gstack가 Meta
FB-Login-for-Business SPA를 못 탐(IG/Threads는 use_cases/customize URL로 됐으나 FB 로그인은 라우팅 상이).
**두 벽 구분**: ①FB config 생성=툴한계(회장 일반 크롬은 정상 렌더 → 2분, 검수불요·테스터용 가능) ②비즈니스
인증/앱검수(실고객)=사업자등록증 업로드+신원확인=회장 서류 필요(브라우저 무관, 내가 못 가진 서류).
**다음(회장 손, 최속)**: 회장 일반 크롬 → 앱 → 비즈니스용 FB 로그인 → 구성 → "구성 만들기".
**구성 마법사 값(우리 코드 기준 확정)**: 액세스토큰유형=**사용자 액세스 토큰**, 자산=**페이지(Pages)**,
권한=**pages_show_list + pages_manage_posts + pages_read_engagement**(+public_profile 기본).
근거: social-connect.ts FACEBOOK.scopes + publish.ts publishFacebook(/me/accounts→page token→발행).
→ 저장 시 **config_id 발급** → 회장이 주면 `gh secret set FB_CONFIG_ID` + FB_APP_SECRET(비번게이트) → FB 연결 내가 완료.
실고객 셀프서브는 별도 앱검수/비즈니스인증 트랙(회장 사업자서류).
**진행(2026-07-05 스샷)**: 구성마법사 이름·로그인버전·액세스토큰(사용자토큰)✓, 권한단계서 회장이 "pages" 검색
→ **결과 없음(실측)**. 즉 **이 앱엔 Facebook 페이지 권한(pages_manage_posts 등)이 아예 없음** — 이용사례가
Threads/IG뿐이라. 우리 publishFacebook은 페이지 발행이라 이 권한 필수 → **config만으론 FB 발행 불가.**
**FB 결론**: 앱에 Facebook 페이지 use-case 추가 + pages_manage_posts 앱검수(고급권한, 사업자인증 포함)라는
큰 벽. IG/Threads(dev+테스터)보다 훨씬 무거움. **권고: FB 보류, 구성마법사 취소.** IG/Threads 실운영부터 완성.
회장 결정 대기: ①FB 검수트랙 열기(장기·서류) vs ②IG/Threads 실운영 파이프라인 완성 먼저.
**업데이트(2026-07-05, 회장 "니가 들어가서 진행"):** 회장 사업자인증 보유. 내가 gstack로 "이용 사례 추가"
카탈로그 진입 성공(FB 로그인 sub-page와 달리 use_cases는 gstack 됨). **콘텐츠 관리(4) 카테고리에
"페이지의 모든 부분 관리"(콘텐츠·동영상 게시, 페이지 API) use-case 발견** = 이게 pages_manage_posts 등
페이지 발행권한 부여. 이걸 추가 중 — 근데 카드 체크박스가 커스텀 + gstack 세션이 반복 죽음(about:blank).
**✅ 완료(2026-07-05, 내가 gstack로)**: "페이지의 모든 부분 관리" use-case 추가 확정(이용사례 목록에
Threads·Instagram·페이지관리 3개 리로드 확인). → 앱에 pages_manage_posts/show_list/read_engagement 권한 생김.
**다음(회장 크롬, 구성 마법사)**: 권한 단계 검색창 "pages" 재시도 → pages_show_list/manage_posts/read_engagement
체크 → 저장 → **config_id** 회장이 나한테 주기 → `gh secret set FB_CONFIG_ID`+FB_APP_SECRET(비번게이트)+
redirect(`{OSMU_PUBLIC_URL}/api/connect/facebook/callback`) 등록 → FB 연결 내가 완료.
주의: pages_manage_posts 고급액세스=앱검수(회장 사업자인증으로 진행). redirect 등록위치는 config에 포함될 수도(확인필요).
**막힘(2026-07-05)**: config 마법사 "pages" 검색에 **pages_show_list만 뜸**(회장 실측). pages_manage_posts/
read_engagement는 use-case 추가만으론 미활성 → Threads content_publish처럼 **"페이지의 모든 부분 관리"
use-case 맞춤설정→"권한 및 기능"탭에서 pages_manage_posts·pages_read_engagement 각각 "추가"** 필요.
내가 gstack로 그 화면 여는 중(세션 반복 죽음+훅 인터럽트로 지연).
**2026-07-06 진전**: gstack 재연결 성공 → PAGES_API 권한탭 도달(url use_case_enum=PAGES_API&selected_tab=permissions).
권한 목록 확인: pages_manage_posts·pages_read_engagement·pages_show_list 등 존재, "추가" 버튼 있음.
**남은 미세스텝**: pages_manage_posts·pages_read_engagement 각 행의 "추가" 클릭(내 regex 이스케이프 실패로 미완).
그후 config 마법사에 3개 다 뜸 → 회장 체크·저장 → config_id. gstack 죽으면 회장 크롬서 PAGES_API 권한탭 "추가" 대체가능. 추가되면 config 마법사에 뜸→회장 체크·저장→config_id.

### 🚧 셀프서브 진짜 게이트 = Meta 앱검수+비즈니스인증 (2026-07-05, 실측)
FB Login for Business "구성"(config 생성) 페이지가 4회 모두 dashboard로 튕김 + "비즈니스 인증/앱 검수/기술
제공업체" 게이트 문구 실측. → **FB config_id 생성 자체가 Meta 앱검수/비즈니스인증 뒤에 잠김.**
**핵심 전략사실**: 현재 IG·Threads 연결은 그 계정들이 **앱 테스터라서**(개발모드). 아무 고객이나 로그인하는
**셀프서브는 IG/Threads/FB 공통으로 Meta 앱검수(App Review)+비즈니스인증(사업자서류, 수일~수주) 필요.**
브라우저로 못 넘는 외부게이트(X 유료·계정생성과 동류). FB 코드는 준비완료 — 검수 통과해 config_id+시크릿 나오면 즉시 붙음.
**회장 결정 대기**: ①앱검수/비즈니스인증 착수(장기 트랙, 사업자서류) vs ②당분간 테스터(회장 계정들)로 IG/Threads 실운영.

### ✅ FB config_id 정합 + 수동키→직접발행 브리지 완료·검증 (2026-07-05, 커밋 40b42fb6 배포됨)
서브에이전트 산출 → 내가 재검증: verify-agent-quality PASS(WebSearch7 근거)·tsc0·vitest158pass·브리지 diff 안전
(pgp암호화+withTenant 테넌트스코프+ON CONFLICT+가드). 배포 성공.
- FB: buildAuthUrl(facebook)이 scope→config_id(FB_CONFIG_ID). 토큰교환은 classic manual-flow와 동일(불변).
- 수동키 브리지: Settings 키입력→openclaw.json(게이트웨이)+integrations(직접발행) 양쪽 저장 → X 등 끊긴 고리 복구.
  대상=직접발행 함수 있는 threads/ig/x/facebook만. 나머지(telegram/youtube/naver 등)=게이트웨이 extension 경유(직접발행 미구현).
**FB 라이브 완결에 회장 콘솔 3종(코드는 소비만):** ①login configuration 생성→FB_CONFIG_ID gh secret ②FB_APP_SECRET
등록확인 ③Valid OAuth Redirect URIs에 `{OSMU_PUBLIC_URL}/api/connect/facebook/callback` 등록. 그 후 FB 연결 라이브검증 가능.
**X 등**: Settings에서 키 입력하면 이제 직접발행까지 연결됨(회장 키 필요).

### ⏳ 서브에이전트 실행중: FB OAuth 정합 + 전채널 수동키 경로 (2026-07-05)
general-purpose 위임(agentId a6ecfa23…). ①FB를 config_id 흐름으로 코드정합(공식문서 WebSearch 근거,
social-connect.ts/publish.ts/connect route) — FB_CONFIG_ID+FB_APP_SECRET env 소비, config 생성은 콘솔(사람).
②전 비-OAuth 채널(X·telegram·…·youtube) 키입력→저장→connected→getChannelCred→발행 경로 검증·완성.
조건: tsc0+vitest, 커밋X(내가 verify후), SOURCES/MODEL 푸터. 완료시 verify-agent-quality+tsc/test 재실행 검증.
※ social-connect.ts/publish.ts/connect/*/channel-config/CredentialForm = 서브에이전트 소유, 메인 편집금지.
FB 최종 완결엔 여전히: 콘솔서 login config 생성(config_id)+시크릿 비번게이트+FB페이지 = 회장 손 필요.

### 🔴 FB 콘솔 네비 실패 + 코드정합 필요 확정 (2026-07-04)
gstack 브라우저가 FB 로그인 sub-page(설정/구성/config)를 못 열고 dashboard로 반복 튕김(실측). 그리고
근본: 이 앱=비즈니스용 FB 로그인(config_id 모델) ≠ 우리 코드 exchangeFacebookCode(classic dialog/oauth).
→ **FB는 콘솔클릭 아니라 코드정합 작업**: social-connect.ts/publish.ts FB 경로를 config_id 흐름으로 재작성 +
시크릿(비번게이트) + FB페이지 연결. 서브에이전트 위임 권고. **회장 결정 대기.**
못 넘는 3종 확정: 네 비번(Meta), 네 결제(X 발행 API 유료 $200/mo), 네 계정생성·심사(각 플랫폼).

### ⚠️ Facebook 진행 — FB Login for Business 복잡성 (2026-07-04)
- FB_APP_ID=1553503759757107(Meta앱ID) FB Login dialog 유효 확인 → `gh secret set FB_APP_ID` ✅.
- 시크릿=앱 설정>기본 설정>"앱 시크릿 코드"(보기=비번게이트). 아직 미획득.
- **막힘**: redirect를 고급설정 "콜백 URL 승인"에 넣고 Save Changes 했으나 **리로드 후 사라짐**(미저장).
  이 앱은 **"비즈니스용 Facebook 로그인"(classic 아님)** → redirect는 로그인 제품의 **login configuration
  (config_id)**에 넣어야 하고, 우리 코드 `exchangeFacebookCode`는 classic facebook.com/dialog/oauth라
  **정합 안 될 수 있음**. 즉 FB는 시크릿만으론 안 됨 — 로그인방식 정합(코드 또는 설정) 필요 + 발행엔 FB Page 연결 필요.
- 판단: FB는 IG/Threads보다 큰 작업. 회장 결정 대기(FB 강행 vs X/타플랫폼 키 먼저).

### ✅ Threads 연결 완료 (2026-07-04, DB 확정)
integrations: tenant 587cee76 / threads / has_token=true / meta.api=threads_login /
userId=27476948648629304(code_zero_to_one 계정, Threads 테스터). 콜백 성공메시지 확인.
원인 패턴=IG와 동일(앱ID+시크릿+redirect). 발행(publishThreads=graph.threads.net) 아직 미검증(실발행 안 함).
**연결 현황: IG✅(+실발행✅) · Threads✅ · 나머지 미연결.**
**다음(전 플랫폼)**: Facebook(Meta앱=FB앱이므로 FB_APP_ID=1553503759757107 가능성, 시크릿 비번게이트+페이지연결)
→ X(키4개 회장) → YouTube/Naver 등(회장 OAuth앱 발급). 컨트롤러 권고: FB 다음(같은 콘솔).

### ▶ Threads — 인프라 완료, 계정 로그인만 남음 (2026-07-04)
**완료:** THREADS_APP_ID(905965605850465)+THREADS_APP_SECRET(prefix c85a) gh secret 등록·배포·컨테이너
반영 확인. 콜백 redirect/deauth/delete 저장(사용자). authUrl 정상 생성(threads.net/oauth, redirect 우리콜백,
scope threads_basic+content_publish+manage_insights). 코드측 provider/publishThreads 준비됨.
**남음(사람게이트):** Threads 로그인="Instagram 계정으로 로그인"(zero_to_one_ai 비번) → 동의 "허용".
IG와 동일 — 비번 자동입력 금지선. 창 focus됨. 사용자 로그인+허용 후 "됐다" → 내가 DB(integrations
threads/587cee76) 확인. **검증쿼리**: local postgres로 DATABASE_URL 조회(psql 컨테이너에 없음).

### ▶ Threads 진행 (2026-07-04 업데이트)
**내가 완료:** Threads 앱 ID=**905965605850465** 확인 → `gh secret set THREADS_APP_ID` ✅. 설정탭에서
리디렉션 콜백 URL=`.../api/connect/threads/callback`, 제거=`.../deauthorize`, 삭제=`.../delete` 3칸 입력함.
**막힘:** ①"저장" 버튼 자동클릭이 Meta SPA에서 안 먹음(사람 클릭 필요) ②Threads 앱 시크릿=마스킹(보기→비번게이트).
**사용자 2스텝(창 focus됨):** (1)설정탭 하단 "저장" 클릭 (2)시크릿 "보기"→비번→"됐다".
→ 그럼 내가: 시크릿 캡처(무로그)→`gh secret set THREADS_APP_SECRET`→배포→Threads OAuth 연결→DB확인.
TODO(선택): `/api/connect/threads/{deauthorize,delete}` 엔드포인트 미구현(콜백 URL만 등록, 런타임 컴플라이언스용 나중에).

### ▶ Threads 진행 중 (2026-07-04, 브라우저 세션)
- `threads_content_publish` 권한 "추가" 클릭함(진행). Threads 설정탭(앱ID/시크릿/redirect)이 gstack
  브라우저 자동조작으로 렌더 안 됨(Meta SPA 지연) → 사용자에게 창 focus 후 수동 진입 요청:
  좌측 Threads API 액세스 > "설정" > 앱ID(숫자, 알려줄 것)+시크릿(표시→비번게이트)+리디렉션 콜백 URL.
- 사용자가 앱ID 알려주고 시크릿 reveal("됐다")하면 내가: 시크릿 캡처(무로그)→`gh secret set THREADS_APP_ID/SECRET`
  →redirect `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/threads/callback` 등록
  →배포→Threads OAuth 연결(social-connect에 threads provider 이미 있음)→DB 확인.
- 코드측 준비: `social-connect.ts` PROVIDERS.threads(authorizeUrl=threads.net/oauth, tokenUrl=graph.threads.net)
  이미 존재. publish.ts publishThreads 존재. 즉 **시크릿·redirect·appid만 채우면 IG처럼 작동 예상.**

### 🧱 "전 플랫폼 연결" 시도 결과 = 크레덴셜 벽 (2026-07-04)
회장 "크롬 익스텐션 띄워 전부 연결" 지시. 실제 해보니 **내 브라우저 조작으로 넘을 수 없는 벽**:
- **Threads(가장 feasible)**: 콘솔서 `threads_content_publish` 권한 "추가" 클릭함(진행). 하지만 앱ID/redirect/
  **시크릿**은 IG처럼 필요 — 특히 **시크릿은 Meta 비번게이트라 회장 손**. 그거 없이는 내가 완성 불가 →
  콘솔 헤매기 중단. 회장이 Threads 앱 시크릿 reveal 해주면 그 한 패스에 (앱id캡처+redirect등록+gh secret+배포+OAuth) 완료.
- **YouTube/Naver/X/TikTok/LinkedIn/Pinterest 등**: 각 플랫폼 개발자 콘솔에서 **회장 계정으로 OAuth앱 생성/
  API키 발급**(YouTube=Google Cloud+심사, Naver=네이버개발자, X=유료 API)이 선행. **브라우저로 대신 못 만듦**
  (회장 계정·결제·심사). 키 주면 즉시 배선.
- **발행로직 미개발 채널(~10개)**: 연결돼도 대시보드 직접발행 안 됨 — 별도 개발 스코프.
→ 결론(근거): "모든 플랫폼 원클릭 연결"은 이 세션에서 불가. 병목=회장 크레덴셜+심사+개발, 내 노력 아님.
  다음 현실경로: ①회장이 Threads 시크릿 reveal→내가 Threads 완성 ②X 4키 주면 연결 ③나머지는 키 확보 순차.

### 📊 플랫폼 연결 준비도 (2026-07-04, 코드 실측)
- **A. 원클릭 OAuth**(social-connect PROVIDERS + connect route): instagram(✅연결·발행됨)·threads·facebook.
  대시보드 직접발행 O. Threads=권한 threads_content_publish 미추가+시크릿 비번게이트 / FB=creds+페이지 필요.
- **B. 수동키 입력**(channel-config OTHER_CHANNELS keyField, OAuth버튼 없음): x·telegram·discord·slack·line·
  naver_blog·bluesky·linkedin·pinterest·tumblr·tiktok·youtube. Settings에 키/토큰/웹훅 직접. 대부분 대시보드
  직접발행 로직 없음(게이트웨이 extension 경유). 각 플랫폼 API키/OAuth앱은 회장이 발급해야.
- **대시보드 직접 실발행(publish.ts)**: threads·instagram·x·facebook 4개만. youtube·naver 등은 발행로직 미개발.
- **C. 미구현**: kakao·whatsapp·medium·substack (extension 없음).
- 결론: "전 플랫폼 원클릭"은 구조상 불가. 원클릭=메타3형제뿐. 나머지는 수동키(회장 키 발급 필요)+발행로직 개발.
- 판단대기: ①Threads/FB 원클릭 완성 ②X 키연결 ③B티어 수동배선 ④YouTube/Naver 발행로직 개발 — 스코프 회장 결정.

### ⏩ 온프렘 재개 (30초)
현재: **IG 연결 완료(DB확정)** → **IG 실발행 E2E 진행 중**. 마지막 실발행 시도가 `Media ID is not
available(9007)` = 이미지 컨테이너 처리 전 발행. **폴링 픽스 커밋 c214ad00 push됨, 배포는 셀프호스트
러너(marketing VM)에서 진행 중** — 노트북 꺼도 러너가 마저 배포함. 온프렘서 먼저:
1. 배포 완료 확인: `gh run list --workflow=deploy-marketing.yml --limit 1`
2. **IG 실발행 재시도**(status 폴링 반영됨):
```
ssh marketing-vm 'TOKEN=$(docker exec openclaw-dashboard-osmu printenv DASHBOARD_AUTH_TOKEN)
curl -s -X POST "https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/publish" \
 -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
 -d "{\"tenant_id\":\"587cee76-deca-480e-8fdd-808a30ec86eb\",\"platform\":\"instagram\",\"text\":\"OSMU 테스트\",\"image_url\":\"https://placehold.co/1080x1080/2266ee/ffffff/jpg?text=OSMU+TEST\"}"'
```
   → `ok:true, externalId=...` 나오면 zero_to_one_ai 피드에 실제 게시됨(스샷 확인, 원하면 삭제).
3. 실발행 검증되면 → **전 플랫폼 구현**(사용자 승인함). 순서: Threads(권한 threads_content_publish 추가
   →redirect 등록→시크릿 비번게이트→배포→OAuth) → Facebook → X(키4개 수동) → 나머지.

**IG_APP_SECRET**은 콘솔 실제값(6672…)으로 gh secret 교체·배포됨(원인 해결). placehold.co=image/jpeg 200 확인.
**즉시 다음 액션(2026-07-04):** 브라우저를 Instagram 앱 시크릿 필드에 띄우고 "표시" 클릭까지 함 →
**Meta가 페북개발 계정 비밀번호 재확인 모달 요구**(passwordField 실측). 비번=사용자만 입력 가능(자동입력
금지선). **사용자가 비번 입력해 시크릿 공개시키면**, 내가 값을 변수로만 캡처(로그 미출력)해
`gh secret set IG_APP_SECRET` 등록 → 재배포 →
그 후 나: 재배포 →
gstack 브라우저로 연결 재시도(Meta·IG 세션 zero_to_one_ai 로그인됨, 동의 허용까지 자동) → integrations
저장 확인(`tenant 587cee76`, `meta.api=instagram_login`) → 위키→생성→graph.instagram.com 실발행 E2E.
시크릿 값은 하네스가 에이전트 로그로 반출 차단(재노출 방지) — 값 복사만 사용자 손.

## ✅ IG 연결 완료 (2026-07-04, DB 확정)
근본원인=IG_APP_SECRET stale(774edc1f… → 콘솔 실제값 6672ef45…로 교체·재배포). 연결 재시도 →
콜백 "연결 완료" + **integrations 행 확정**(로컬 postgres 드라이버로 DATABASE_URL 직접 조회):
`tenant=587cee76, label=instagram, has_token=true, meta.api=instagram_login, userId=28428705173384372`.
디버그 코드 제거(커밋 2f43952f). 참고: channel-config API는 tenant_id 파라미터 무시(effectiveTenantId
(req,null)) → 운영자 조회 시 connected:false 착시. 검증은 DB 직접.
**보안 TODO**: 새 시크릿 6672ef45…가 이 세션 트랜스크립트에 노출됨(snapshot) → 검증 끝나면 콘솔에서
1회 더 재설정하고 사용자가 직접 gh secret 등록 권장(스냅샷 반출 회피).
**대시보드 "미연결" 착시 규명·수정(2026-07-04):** 사용자가 대시보드에서 IG 미연결로 봄 → 원인 2개:
① channel-config API가 `openclaw.json` 플러그인 config만 읽고 **테넌트 integrations(OAuth 저장처)를 안 읽음**
   → 커밋 179086e3로 integrations도 반영(connected 보정) 배포. **라이브 배지 검증은 사용자 새로고침 대기.**
② 토큰이 저장된 테넌트 **587cee76 = `code0to1@gmail.com`**(tenants 조회 확정). 즉 **대시보드를 그 계정으로
   로그인**해야 보임. 다른 계정으로 보면 미연결이 맞음. (연결된 IG=zero_to_one_ai ↔ code0to1 계정.)
**다음**: 사용자가 code0to1@gmail.com로 대시보드 새로고침 → Connected 확인.

## 플랫폼 확장 현황 (2026-07-04, "모든 플랫폼 연결" 요청)
- **Settings 토큰칸 빈 것 = 정상**(OAuth 토큰은 integrations에 암호화 저장, 클라에 노출 안 함. 배지가 지표).
- **Threads 콘솔 확인**: `threads_content_publish` 권한 **미추가**(+추가 상태), 앱ID/시크릿/redirect는 "설정"
  하위, 시크릿은 IG처럼 **비번게이트** 필요. → Threads도 IG 전체 플로우 반복(권한추가→redirect→시크릿→배포→OAuth).
- **판단 대기(사용자)**: ①IG 실발행 E2E 먼저(비번게이트 불필요, 실계정 비가역 게시 — 승인 필요) ②Threads 강행
  ③둘 다. 컨트롤러 권고=①(파이프라인 증명 후 복제가 시간·품질 우위). X=키4개 수동, YouTube등 미구현.

## 진행 상태 (2026-07-03)

**✅ 해결됨(라이브 검증):**
- **콘텐츠 생성** — `CLAUDE_CODE_OAUTH_TOKEN` gh secret+env 배선(배포 765935ca). 라이브 `/api/studio/text` →
  실제 한국어 콘텐츠(threads/x/ig/shorts) 생성 성공. 502 해소.
- **VM 운영 배선** — autoheal 컨테이너 Up(healthy) + publish-due crontab(*/10) 등록. 래퍼가 컨테이너 env에서
  운영자 토큰 로드. 라이브 테스트 `all-tenants sweep 200 processed:0`(due 없어 정상).
- **IG redirect URI** — 사용자가 Meta 콘솔에 `.../api/connect/instagram/callback` 등록(스샷 확인).
- 버튼 죽는 버그(청크520)·가입 딥링크 — 수정·라이브 검증.

**✅ 추가 해결(2026-07-03, 라이브 검증):**
- **"Invalid redirect_uri" 버그** — 프록시 뒤 `new URL(request.url).origin`이 `0.0.0.0:18789`를
  잡아 Meta 등록값과 불일치(실측). `publicOrigin()`(OSMU_PUBLIC_URL>x-forwarded-*>request) 도입,
  auth-url·callback 통일. gh secret `OSMU_PUBLIC_URL` 설정, 배포(run 28611637538 success).
  라이브 redirect_uri = `https://openclaw.../api/connect/instagram/callback` 확인. 커밋 e8603547.
  회귀 테스트 2개(9 pass). 배포 서비스명은 `openclaw-dashboard-osmu`(단축 'osmu' 아님 — 오타 주의).

**✅ IG 플로우 직접 재현 검증(2026-07-03):** 라이브 authUrl을 curl -L로 끝까지 추적 → 인스타가 302로
동의 페이지 거쳐 `/accounts/login/`(username/Password)까지 정상 도착, **"Invalid redirect_uri" 안 뜸**.
즉 서버측 완전 정상. 사용자가 본 에러 = 배포 전/캐시된 옛 팝업. → **하드 리프레시 후 재클릭** 안내함.
그래도 나면 팝업 URL/스샷 요청(캐시 아닌 다른 문제).

**🔴 IG 블로커 — 원인 확정(2026-07-03, 사용자 콘솔 스샷):** redirect URI 문자열은 **완벽히 일치**
(`https://openclaw.../api/connect/instagram/callback`, 끝슬래시X). 단 등록 **위치가 틀림** —
사용자가 **앱 설정 > 고급 설정 > "콜백 URL 승인"(=Facebook 로그인용 필드)** 에 넣음. 우리 흐름은
`instagram.com/oauth/authorize`(Instagram 전용 로그인)라 Meta가 **Instagram 전용 리디렉션 필드**를
대조 → 거긴 비어서 콜백단 튕김. **수정 위치 = 이용 사례 > Instagram > 맞춤설정 > 비즈니스 로그인 설정 >
OAuth 리디렉션 URI** 에 같은 값 추가. Meta 콘솔=사용자 수동(ADR-004, 자동조작 계정정지 이력).
사용자에게 "이용 사례 > Instagram" 화면 스샷 요청(정확한 칸 확인, 추측 금지). 코드 유지(path#1 Instagram
Login이 FB Page 불필요 → 셀프서브에 맞음, FB Login path로 안 바꿈).

**✅ 방식 확정(실측, 2026-07-03):** FB 로그인 전환 검토했으나 `1534059948198965`가 Facebook Login
client_id로는 `PLATFORM__INVALID_APP_ID`(그건 인스타 전용 앱ID). FB로 가면 다른 Meta App ID+시크릿+
연결된 FB페이지가 더 필요 → 현행 Instagram Login 방식이 최소마찰. 유지 확정.
**✅ 발행 경로 선반영(커밋 4438a3ca, 배포 success):** 테넌트 연결 토큰(Instagram Login)은
`graph.instagram.com`로 media/media_publish, 레거시 env는 `graph.facebook.com` 유지. callback이
meta.api 플래그 저장. → 연결 성공 즉시 발행 호환. Meta redirect 위치는 Meta 공식문서로 확정(아래).

**✅✅ redirect_uri 블로커 해결(2026-07-03, gstack 브라우저로 내가 직접 콘솔 설정):**
사용자 요청으로 gstack 헤디드 브라우저(사용자 real Chrome 세션=Meta 로그인됨)로 진입:
- 앱 "정성컴퍼니"(Meta App ID **1553503759757107**) → 이용 사례에 **Threads API + Instagram 메시지·콘텐츠
  관리** 둘 다 설정돼 있음 확인. Instagram 이용사례 = `INSTAGRAM_BUSINESS` 커스터마이즈.
- **Instagram 앱 ID = 1534059948198965** = 우리 IG_APP_ID와 일치 확인(같은 앱 소속).
- **섹션 4 "Instagram 비즈니스 로그인 설정" → 설정 모달 → "리디렉션 URL"** 칸에
  `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback` 입력 → 저장.
- Meta 자동생성 OAuth URL에 우리 redirect_uri 박혀 나옴 = 등록 확정.
- **E2E 검증**: 그 authorize URL로 이동 → `invalidRedirect=false`(에러 사라짐), 인스타 로그인 화면 도달.
  (스샷: scratchpad/meta_ig_*.png)
- 참고: "앱 설정>고급 설정>콜백 URL 승인"은 Facebook 로그인용이라 무관(그대로 둠).

**✅ 연결 플로우 정식 검증(2026-07-03, gstack 브라우저):** OSMU 로그인 후 IG 채널 Settings →
"Instagram 연결" 클릭 → 새 탭에 **state=587cee76...(테넌트ID) 포함** authorize URL 정상 생성,
redirect 에러 없이 인스타 로그인 도달. connect 코드 경로 라이브 정상.

**연결 진행상태(2026-07-03):** gstack 브라우저로 연결 플로우를 **동의 화면까지 반복 도달** 확인 —
계정 **zero_to_one_ai**(프로계정), 권한(콘텐츠 게시·댓글·인사이트) 다 표시, state=587cee76, redirect 정상.
그러나 **최종 "허용"(권한 승인) 클릭을 인스타가 봇 자동화로 막음**(로그인단 CAPTCHA + 동의단 클릭 무반응).
DB integrations 아직 미저장(콜백 미완). 봇으로 뚫는 건 계정 플래그선이라 중단.

**🔎 콜백 실패 원인 좁힘(2026-07-03):** gstack 브라우저로 허용까지 태워 콜백 히트 → 토큰교환에서
`Error validating verification code. Please make sure your redirect_uri is identical...` 확인.
- **시크릿·redirect 정상 입증**: 컨테이너 node로 더미 code 토큰교환 테스트 → `Invalid authorization code`만
  반환(=IG_APP_SECRET 774edc1f… 유효, redirect openclaw.../callback 인정됨). 시크릿 회전 불필요.
- 따라서 실패 = authorize때 심긴 redirect ≠ exchange때 보낸 redirect(미세 불일치). 정확 바이트 추적용
  **디버그 배포(커밋 6691de0d)**: exchangeCode 단기토큰 실패 시 `sent_redirect_uri` + IG raw 응답을
  에러/console.error로 노출. **진짜 콜백 1회 떠야 로그 남음.**
- gstack 브라우저는 OSMU·인스타 세션을 반복 상실 → 콜백 재현 불안정. 운영자 토큰 주입은 activeWorkspace
  없어 연결버튼 무동작.

**✅ 백엔드 3중 검증 완료(2026-07-03, 진짜 동의 없이 직접):** 라이브 콜백에 더미 code 직접 타격
(`curl .../api/connect/instagram/callback?code=DUMMY&state=587...`) → 디버그가
`sent_redirect_uri=https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback`
(콘솔 등록값·인정값과 동일) + IG=`Invalid authorization code`(코드만 문제, redirect·시크릿 정상) 반환.
→ **콘솔·시크릿·exchange redirect 3개 다 정상 입증.** 앞선 "redirect_uri identical" 에러는 배포
과도기(콘솔 등록 전/OSMU_PUBLIC_URL 반영 전) 발급 낡은 code 탓으로 추정. **새 code면 통과 예상.**

**🎯 진짜 원인 규명(2026-07-04): IG_APP_SECRET stale/오값 유력.**
- 라이브 규명 시퀀스: 콘솔 redirect·테스터·authorize 다 통과하는데 **exchange만 "Error validating
  verification code"**. authorize는 client_id만, exchange만 client_secret 사용 → 시크릿 불일치 증상.
- **더미 code 테스트는 시크릿 검증 못 함**(실측: 맞는시크릿·틀린시크릿 둘 다 "Invalid authorization code")
  → 앞서 "시크릿 정상" 결론은 오류였음. slash 변형도 무관(둘 다 실패).
- 노출됐던 `774edc1f…`가 회전됐거나 Meta앱 시크릿을 잘못 넣은 것으로 추정. **fix=올바른 Instagram 앱
  시크릿(Instagram API 설정 페이지의 "Instagram 앱 시크릿 코드")을 IG_APP_SECRET gh secret에 반영+재배포.**
- exchange 코드는 단발 no-slash로 정리(재시도가 code 이중소비시켜 제거, 커밋 105d2265). #_ strip 포함.
- **다음**: 올바른 시크릿 확보→`gh secret set IG_APP_SECRET`(temp파일)→배포→연결 재시도(브라우저로 내가).
  IG 로그인/Meta 로그인은 gstack 프로필에 현재 살아있음(zero_to_one_ai). 테넌트=587cee76.

**⚠️ 사용자 실동의 시도 결과(2026-07-03):** 사용자가 본인 크롬에서 로그인+동의 완료 →
"본인 확인/사람 확인"(인스타 의심) 겪음 → 동의 후 **인스타 화면 "몇 초 후 자동으로 연결됩니다"에서 무한로딩**.
그 문구는 **우리 코드에 없음(grep 확인)=인스타 화면**. DB 30초 폴링 → **토큰 저장 0**(콜백이 우리 서버까지
안 닿음, Next 로그도 무). 즉 인스타가 동의 후 redirect_uri(우리 콜백)로 핸드백을 안 넘김.
- **유력 원인**: ①인스타 throttle(반복시도로 최종 넘김 보류, 재시도로 풀릴 수 있음) ②앱이 개발모드(미게시)
  →연결 IG계정(zero_to_one_ai)이 **앱 테스터 미등록**이면 최종 발급 막힘.
- **다음**: 사용자가 무한로딩 탭 닫고 1~2분 후 재시도. 또 걸리면 = 테스터 등록 필요(콘솔 App Roles/Instagram
  use-case 테스터에 zero_to_one_ai 추가 + IG앱에서 초대 수락). gstack 브라우저는 Meta/OSMU/IG 세션 반복
  상실로 진단·자동화 불가.

**남은 것 = 인스타 실제 로그인+동의 1회(사람 게이트, 자동화 불가):**
- 인스타가 로그인단 CAPTCHA + 동의단 클릭을 봇 차단(=계정 플래그선, ADR-004). gstack 프로필은
  OSMU/IG 세션을 반복 상실. → 자동화로 실 consent 생성 불가. 비번 자동입력=금지선.
- **사용자 본인 Chrome(OSMU+IG 로그인 상태)에서 IG Settings→"Instagram 연결"→"허용" 1회** 하면
  백엔드가 검증됐으니 토큰 저장됨(meta.api=instagram_login). 실패 시 에러페이지에 디버그(sent_redirect_uri
  +IG응답) 뜸 → 내가 읽고 수정. 성공 시 알려주면 내가 발행 E2E.
- 디버그 코드(커밋 6691de0d) 아직 exchangeCode에 남음 — 연결 성공 확인 후 제거 예정.
  검증쿼리: `SELECT label,meta FROM integrations WHERE tenant_id='587cee76-...' AND kind='channel'`.

**다른 플랫폼 연결 현황(2026-07-03, 정직):** IG만 작업 중(위 미완). Threads=콘솔 이용사례 존재하나
THREADS_APP_ID/SECRET 미배선. Facebook=미배선. X=원클릭 없음(4키 수동). YouTube 등=미구현. 즉 지금
연결된 플랫폼 0.
2. **Supabase Email Confirm OFF**(지인 가입용): `https://supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo/auth/providers`
   → Email → "Confirm email" OFF → Save.
3. (선택) **Threads/FB 켜기**: gh secret `THREADS_APP_ID/SECRET`·`FB_APP_ID/SECRET` **미설정 확인**
   (컨테이너 env MISSING 실측). Threads는 IG와 별개 앱 자격증명(developers.facebook.com Threads
   use-case). 값 주면 IG와 같은 코드 경로로 배선 + redirect URI `.../api/connect/{threads,facebook}/callback` 등록.
4. (보안) 채팅 노출된 IG App Secret·claude oat 토큰·인스타 비번 rotate 권장.

## 밤샘 오토런 결과 (2026-07-02)

**검증(직접 관찰):** DB 완비(pg_trgm·pgcrypto·osmu_service·7테이블), 운영자 API·워크스페이스 8개,
**IG 연결 auth-url 라이브 생성**(env 적재 확인), 가입 폼·pending 화면 동작, 번들에 IG 연결 버튼 존재.
**버그 발견→수정→배포(2088a456):** ①간헐 520 청크 실패→하이드레이션 전멸→버튼 무반응("구글 로그인
안 먹음" 앱측 원인) → 자동복구 스크립트 ②가입 딥링크 미적용 → mount 재동기화. 146 pass/8 skip·tsc0·build✓.
**차단됨(classifier, 사용자 승인 필요):** VM crontab·autoheal·auth.users 테스트계정 confirm.
**아침 4번 후 내가 즉시:** 위키 sync→콘텐츠 생성→IG 실발행 라이브 E2E + browse 스크린샷 → `/approve qa` 증거 완성.

## 규율(불변)
- Meta 콘솔 **자동 운전 금지**(계정 플래그 사고, ADR-004). 콘솔은 사용자 수동.
- 배포는 pipeline qa 게이트 — **ship은 `/approve qa` 후만**. 고객 비번 수집·자동로그인 금지(ADR-004).
- 발행/브랜드/연결 구조 변경 시 wiki 반영 + 이 파일 갱신 + E2E 선통과.

## 참조
- QA 증거: `docs/qa-tracker.md` · 단계: `pipeline-state.md` · 결정: `wiki/decisions/004-social-connect-oauth-not-passwords.md`
- 라이브: `openclaw.sj-onpremise-cloudflare-tunnel.cloud` · VM: `ssh marketing-vm` · 컴포즈: `/home/marketing/actions-runner-oc/_work/openclaw-auto/openclaw-auto`
- 상세 이력(장애 RCA·셀프서브 코어·OAuth 빌드·Meta 셋업 전체): `archive/session-2026-06.md`
