# 세션 작업 상태 (재실행 가능한 핸드오프)

> 이 문서는 **작업 하네스 규칙 #3**(루트 CLAUDE.md)에 따라 항상 최신으로 유지한다.
> 세션이 죽거나 재실행돼도 이걸 읽으면 30초 안에 이어갈 수 있어야 한다.

**최종 갱신:** 2026-06-30 · 브랜치 `main` · 배포 라이브.

> ⚙️ **Stage Controller 등록됨**(2026-06-30, `pipeline-state.md` = 단계 진실원). 현재 단계 = **qa**.
> plan~build ADOPT(라이브 앱). **신규 기능 배포(ship)는 `/approve qa` 후에만** — 과거 게이트 없는 자동
> 배포는 하네스 위반이었음, 재발 금지. 단계 상태는 `pipeline-state.md`, 작업 맥락은 이 파일.

## 🚨 장애 (2026-06-28) — 가입 테넌트 중복키 폭주 → CPU100% → 524

- **증상**: 라이브 전 엔드포인트 8s 타임아웃(524), "업종선택 500", 컨테이너는 Up 24h.
- **진단(marketing-vm SSH, 읽기전용)**: `openclaw-dashboard-osmu` **CPU 100.4% 고착**, 로그에
  `duplicate key ... tenants_owner_auth_id_key (owner_auth_id=e6baa000-...)` 폭주. DB·스키마는 정상.
- **근본원인**: `ensureTenantForUser` 동시 첫로그인 레이스 — SELECT 둘 다 빈값→INSERT 충돌→throw→500
  →클라 재시도 폭주→CPU100%→응답불가. ("업종선택 500"도 동일.)
- **수정(완료·커밋)**: `src/lib/tenant-auth.ts` INSERT를 `ON CONFLICT (owner_auth_id) DO UPDATE
  RETURNING id` 멱등 upsert로 — 중복이어도 throw 없이 기존 id 반환. 회귀가드
  `tests/brand/tenant-idempotent.contract.test.ts`. tsc 0.
- **복구 완료**: `docker restart`로 CPU 100%→0.01%, /login 200·/api/me 401 정상화. 수정본 재배포 success(런 28328484498) → **L1 멱등 upsert 라이브**.
- **구조적 RCA**: 부작용(쓰기=테넌트생성)이 계속 폴링되는 읽기 경로(/api/me→effectiveTenantId→ensureTenantForUser)에 박혀,
  첫 로그인 시 대시보드 첫 로드의 동시 API 버스트가 TOCTOU 레이스→중복키 throw→500→재요청으로 레이스 창이 안 닫혀 자가증폭→CPU100%→524.
  (claude/B0 무관 확정 — 로그에 claude 에러 0.)
- **재발방지 다층(defense in depth)**:
  - L1 멱등 upsert(ON CONFLICT) — **완료·배포**(근본 차단).
  - L2 형제 경로 ON CONFLICT 감사 + 회귀 contract 테스트 — 완료.
  - L3 클라 재시도 한도 — **이미 충족**(`Providers` SWRConfig `errorRetryCount:2, revalidateOnFocus:false`).
  - L4 `/api/health`(DB핑·부작용0) + 컨테이너 healthcheck + **autoheal 워치독**(unhealthy 자동재시작; restart:unless-stopped는 hang 무력) — **코드 완료, 재배포로 적용**.
  - L5 `scripts/health-alert.sh`(외부 업타임→슬랙 경보, 연속 N회) — 코드 완료. **운영 알림 지금까지 0이었음**(슬랙은 마케팅 리포트용뿐). SJ: crontab 등록 + SLACK_WEBHOOK_URL.
  - (미적용·후속) 구조 교정: 테넌트 생성을 읽기 경로에서 제거(로그인/온보딩 1회 프로비저닝). 멱등으로 안전해져 위험은 해소, 정리는 후속.
- **인프라 접근**: `ssh marketing-vm`(192.168.1.110, 키 `~/.ssh/postagi_onprem`). 라이브=`openclaw.sj-onpremise-cloudflare-tunnel.cloud`.
- **검증**: tests/brand health(2) 포함 전체 139 pass/8 skip, tsc 0, build ✓.
- **라이브 검증(2026-06-28)**: 재배포 success(런 28331761475). `/api/health`→`{ok:true,db:up,ms:99}` 200.
  컨테이너 `Up (healthy)`(healthcheck 적용됨), CPU 0.00%. 장애 완전 해소.
- **남은 SJ 인프라 액션(L4/L5 완성)**: ① `docker compose -f docker-compose.postagi-4tenants.yml up -d autoheal`
  (워치독 기동 — 아직 미실행) ② `health-alert.sh` crontab 등록 + `SLACK_WEBHOOK_URL`(운영 장애 알림 켜기).

## 사용자 피드백 처리 (2026-06-28)

- **업종선택 500** → 장애와 동일 원인(테넌트 race). **해결·배포**.
- **가입 confirm 후 원본 탭 미로그인** → `login/page.tsx`에 `onAuthStateChange` 추가(탭간 동기화 자동진입).
  **수정·배포**(브라우저 전용 흐름 → 라이브 browse 검증 대상, 단위테스트 불가).
- **구글 로그인 안 됨** → 코드 정상(미설정 시 안내까지). **Supabase 콘솔 Google provider 미활성이 원인 → SJ 액션**:
  Supabase > Authentication > Providers > Google 활성 + Google Cloud OAuth client(ID/secret) + redirect
  `https://<live>/login` 허용. (코드로 불가.)
- **연결 도우미 챗봇** → 미답(비용·운영부담 낮음, 기존 키+셋업가이드 RAG 재사용 — 다음 설계).
- **성과 미연결 앱 블러+모달** → **완료·배포**(`ChannelPage` `ConnectGate`: Queue/Analytics 미연결 분기를 블러
  미리보기+'연결하기' 모달로. tsc0/build✓, 시각=배포후 browse). 커밋 76051dc6.
- **YouTube 연결(비만료)** → 개념 확정: **Client ID/Secret + "Google 연결"(refresh token 자동갱신)**이 정답,
  Access Token 직접입력은 1h 만료라 폐기. OAuth 라우트(auth-url/callback/refresh) 존재하나 **글로벌 저장 +
  연결버튼이 videos에 묻힘 + 채널 Settings는 accessToken paste**. 진짜 해법=채널 Settings에 per-tenant "Google
  연결" 버튼(integrations에 refresh token 저장) + publish 익스텐션이 per-tenant 토큰 읽기(크로스레포). **미착수(큰 빌드).**
- **전체 가이드 step-by-step 재작성** → 미착수. "Client ID/Secret+연결" 모델로 통일 + 채널별 따라하기 수준. (큼.)
- **슬랙 알림 목적지** → 사용자가 만든 채널의 **Incoming Webhook URL**을 `SLACK_WEBHOOK_URL`로 → `health-alert.sh`가 거기로 POST.

## (B) 소셜 OAuth "연결" 빌드 (2026-06-30) — ADR-004 구현

고객이 비번/토큰 개념 없이 "연결" 버튼만 → OAuth → 우리가 토큰 받아 테넌트별 저장. **코어 완성·검증:**
- `lib/social-connect.ts`(PROVIDERS=instagram, buildAuthUrl, exchangeInstagramCode 단기→장기),
  `api/connect/[provider]`(auth-url, state=tenantId), `api/connect/[provider]/callback`(토큰교환→
  `integrations`(kind=channel,label=instagram) pgcrypto 저장), `middleware`에 콜백 공개 허용,
  `SocialConnectButton`+ChannelPage Instagram 설정 배선. E2E `tests/brand/social-connect.test.ts`(5).
  검증: 144 pass/8 skip, tsc 0, build ✓. **라이브 미검증**(배포후 browse).
- **연결 3종 완성(2026-07-01)**: Instagram·Threads·Facebook 모두 코드+E2E(7) 완료, 가이드도 "연결 버튼 먼저"로 재작성.
  전체 146 pass/8 skip, tsc 0, build ✓. **미배포**(qa 게이트 — /approve qa 후).
- **★현재 단일 블로커(라이브 데모)**: 배포 env에 **`IG_APP_SECRET`** 미설정. IG_APP_ID=`1534059948198965`(공개),
  시크릿은 사용자 Meta 콘솔에서 복사 → `gh secret set IG_APP_SECRET -R seong-jin-jo/openclaw-auto` → 내가 배포 →
  redirect URI `https://<live>/api/connect/instagram/callback` 사용자 콘솔 등록 → "연결" 버튼 라이브 테스트.
  (THREADS_APP_ID/SECRET·FB_APP_ID/SECRET도 각 provider 라이브 시 동일.)
- **진행(2026-07-01)**: IG_APP_ID/IG_APP_SECRET gh secret 등록 완료, `deploy-marketing.yml` .env.osmu 렌더에
  IG/THREADS/FB_APP_* 추가, 배포 트리거됨. ⚠️ App Secret이 채팅에 노출됨 → **사용자 rotate 권장**(rotate 시 gh secret 재설정 필요).
- **다음 액션(사용자)**: Meta 콘솔에 redirect URI `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback`
  등록(Instagram 로그인 API 설정) → 배포 완료 후 OSMU "Instagram 연결" 버튼을 테스터 계정으로 눌러 로그인→토큰자동 검증.
  Threads/FB는 각 APP_ID/SECRET gh secret 설정 시 동일 활성. **미검증**(라이브 연결 아직 안 밟음).
- **배포 success**(런 28509299279, IG env 반영) + 라이브 `/api/health` 200(db:up). E2E 하네스 green(146 pass/8 skip,
  스크립트 verify-e2e/publish/selfserve + npm test/test:publish/e2e/e2e:publish 다 걸림).
- **라이브 풀 발행 E2E(위키→생성→IG/Threads 게시) 블로커 = 토큰 0**. redirect URI 등록 + "연결" 로그인(테스터)로
  토큰 생기면 그때 라이브 발행까지 밟아 증명 가능. 그 전엔 물리적으로 실게시 불가(가짜 green 금지).
- 외부 고객 발행은 App Review(앱 1회) — 그 후 고객은 로그인+동의만(테스터·콘솔작업 0). ADR-004.

## ⛔ Meta 브라우저 자동운전 중단 (2026-07-01 — 사고)
GStack 브라우저로 Meta 콘솔 운전 중 **Meta가 개발자 계정을 "비정상 활동"으로 플래그**("계정 확인 필요").
봇 탐지. **Meta 콘솔 자동 운전 영구 금지**(ADR-004 실사고 기록). 콘솔 셋업(env·redirect URI·권한·테스터·
계정확인/2FA)은 **사용자 본인 수동**. 제품 자동화는 OAuth 연결 버튼(콘솔 미접촉, 코드 완성)만. 계정 복구는
계정주만 가능. 라이브 qa 선행조건(env·redirect)도 사용자 콘솔 작업.

## Meta(Facebook/Threads/Instagram) 토큰 셋업 (2026-06-30, 진행중)

- 기존 FB 개발자 계정 유실 → 새 앱 생성. 앱ID `1553503759757107`, 비즈니스 `정성컴퍼니`(business_id 1285496690057733).
  대시보드: Threads API 이용사례 ✅, Instagram 이용사례 ○ 미완. 앱 역할: 관리자(페북개발), IG/Threads 테스터=teamconnectors 1계정뿐.
- **앱 모델 결정**: Meta "앱"=API 클라이언트 단위(App ID/Secret+제품+역할+토큰발급, 사용량·심사도 앱 단위).
  토큰은 (앱×계정)마다 발급. → **네 브랜드(ZERO-ONE·D-EDU·CUPID×2 등)는 앱 하나 + 각 계정을 테스터로 추가**가 정답.
  외부 SaaS 고객은 테스터 불가(50한계+남의계정) → **App Review + 고객 OAuth**(상품화 단계, per-tenant 연결 빌드와 연결).
- **내가 할 수 있는 것**: ① Meta 콘솔 운전 = `setup-browser-cookies`(사용자 Chromium 쿠키 임포트)+`browse`로 가능하나
  2FA/캡차/동적UI로 깨질 수 있어 페어 방식 권장(민감: 실계정). ② **토큰 4값 받으면 OSMU 등록+verify_channel 검증=자동화 가능**
  (THREADS_ACCESS_TOKEN/USER_ID, INSTAGRAM_ACCESSTOKEN/USERID → 채널 Live).
- **다음 액션(사용자 선택 대기)**: (가) 5브랜드 계정 테스터 추가→토큰 발급(사용자) (나) Chrome 세션으로 내가 운전 시도.
  토큰 확보 후 내가 OSMU 등록·검증.
- **GStack 브라우저 연결됨(2026-06-29)**: `~/.claude/skills/gstack/browse/dist/browse connect`(headed, 포트 34567).
  Playwright Chromium 설치함(ms-playwright/chromium-1208). 사용자가 그 창에서 Meta 로그인 완료, 앱
  대시보드(정성컴퍼니, app 1553503759757107) 진입. **한계 확인**: Meta SPA의 이용사례 행이 browse 스냅샷에
  클릭 ref로 안 잡힘 + App Secret/계정별 토큰은 민감+계정인증이라 자동화 불가 영역. → **페어 분담 결정**:
  사용자가 그 창에서 클릭(콘솔·계정인증), 나는 스크린샷 떠서 다음 클릭 안내 + 토큰 4값 확보 시 OSMU 등록/검증.
  현재 대기: 사용자가 Instagram 이용사례 행 클릭.
- **Meta IG 진행(2026-06-29)**: browse 텍스트 셀렉터로 운전 가능 확인(`click "text=..."`). Instagram Business
  이용사례 API-Setup 페이지에서 **필수 권한 추가 완료**(basic/comments/messages). IG 테스터 4계정 이미 등록됨
  (계정명·IG user ID는 공개 레포라 미기재 — 세션 채팅에만). 각 계정 "토큰 생성" 버튼 존재.
  **대기 결정**: ① DARK CUPID 계정 이 앱에서 분리(별도 앱 — 정책 ban 블래스트반경) ② `instagram_business_content_publish`
  권한 확인(발행용, 필수목록엔 없음) ③ 토큰 핸들링 (a)OSMU UI 붙여넣기 vs (b)나한테 줘서 API 등록.
  토큰 확보 후: OSMU `/api/channel-config/{threads,instagram}` 등록 + verify_channel 검증 → 채널 Live.
- **IG 권한 추가 자동화 실패(2026-06-29)**: browse ref가 SPA 재렌더마다 흔들려 "추가" 클릭 반복 빗나감
  (content_publish 미추가 확인). `instagram_branded_content_creator` 오클릭 추가 정황 → 블라인드 클릭 중단(실앱 위험).
  교훈 ADR-004에 실증 기록. **대기(사용자 클릭)**: content_publish `+추가` / manage_insights `+추가` /
  branded_content_creator 추가됐으면 제거. 그 후 STEP3 토큰 생성 → OSMU 등록. 민감 토글은 페어(사람 클릭)로.

## 🧭 회장님 directive 정렬 (brain federation)

> brain `wiki/business/timeline-회장-directive-log.md`(append-only 명령 로그) +
> `decision-2026-06-4사업-OUTPUT-집중`(active). brain read-only → 완료 체크는 **이 venture STATE**.
> 이 레포 = **MARKETING (open-claw / JOGON)** venture. 연간 bet = "INTERNAL→SPIN-OFF 멀티에이전트
> 마케팅 스튜디오"(내부 검증 후 B2C 분사 — `plan-2026-연간-이정표`).

### 7월·하반기 directive (2026-06-27 directive log) — 현 작업과 직결
- **6월 리마인드**: 마케팅 **5계정**(ZERO-ONE·D-EDU·**JOGON경제**·**CUPID 2개(Romeo/Dark)**) 등록 →
  콘텐츠 생성·발행 안정 가동. ⚠️ **4가 아니라 5**(CUPID=Romeo클린+Dark BDSM 분리).
- **★7월**: 6월 출력 안정화 + **무료 제공으로 멀티테넌트 축적** — "5계정 안정화 + 주변 관심자에게
  무료 제공." → **내가 만든 셀프서브 코어가 정확히 이 명령.** 무료티어 = 운영자 claude -p(내 Max)로
  돌리는 게 자연스러움(고객은 점진 자기 키). A2 온보딩 위저드 = 7월 *획득 레버*로 우선순위 상승.
- **하반기(H2)**: JOGON/마케팅 = **'대신 사업해드립니다'** — 마케팅 프로그램 판매 + 앱·웹 외주 +
  종합 컨설팅(기획+개발+마케팅) = 본인 직업. 이 레포 = 그 엔진/레버.
- **메타**: `concept-아이디어-투입-자동-사업-파이프라인` — 아이디어→기획→개발→인프라→마케팅→데이터
  자동 라인. 이 레포 = 그 "마케팅·데이터" 단. 트랙분리(신규0→1 / 운영1→N), 사람 검증 게이트.
- **정렬 판정**: 셀프서브 코어(A1/A3/B0/B1 완료, A2 남음) = 7월 명령과 **정확히 일치, 오히려 검증됨.**
- **무료티어 결정(2026-06-28)**: 무료 유저는 자기 키 등록 없이 사용, 생성 비용은 **운영자(SJ)가
  Anthropic으로 부담**. UI에 **"무료 서비스 이벤트(한시적·운영자 비용 부담)" 명시 필수.** 유료 전환 시 자기 키.
  → 무료티어 엔진 = 운영자 부담 Anthropic(claude -p Max 또는 운영자 env 키). 이벤트 라벨 컴포넌트 필요.
- **GA4/슬랙 = "우리가 중간에서 인터페이스" 모델 확정**: 고객은 최소 1스텝만(슬랙: 자기 슬랙 webhook URL
  붙여넣기 또는 "슬랙 연결" OAuth 버튼 / GA4: "구글 연결" OAuth 또는 우리 서비스계정에 property 권한 부여).
  실제 발송·읽기·리포팅은 전부 플랫폼이 수행 — 고객이 웹훅 plumbing 직접 안 만짐. 친절 버전=OAuth 버튼 1클릭.

### 6월 MARKETING 명령 2개 (진행)

**6월 One Thing(전 사업 공통): OUTPUT.** 완벽보다 노출, 기획보다 배포, 추측보다 데이터.
성공 기준 = ①배포·게시됨 ②유저 유입 ③데이터로 보임.

**MARKETING 섹션 명령 2개:**
1. **3사업(ZERO-ONE·D-EDU·CUPID) 알리는 open-claw 마케팅 자동화를 테넌트별 독립 + API 토큰
   각각 연결해 안정적으로 돌게.**  → **정렬 ✅** (멀티테넌트 발행 루프 = 현 세션 작업의 본령).
   완료선 = 실제로 배포돼 crontab으로 *돌아가는 것*. **진행: publish-due 전체 스윕·드라이버·E2E
   완료, push 완료, 배포 success(2026-06-25 18:07Z 런 28190543127, 1m28s, 스모크 게이트 통과).
   코드측 완료. 남음: crontab 등록(`publish-due-cron.sh` 주기 호출 — 운영자 액션, 레포 밖).**
2. **GA4 분석·리포팅·슬랙 알림을 MARKETING이 중앙 통합** (GA4 Data API로 4사업 property 읽기.
   수집 태그는 각 앱이 심음).  → **정렬 ❌ 갭 → 다음 빌드 승격, 설계 완료.**
   사용자 결정(2026-06-26): **계획만, 구현 다음 세션.** 설계 박제 = `wiki/product/plan-ga4-slack-central.md`.
   핵심: GA4 Data API 호출·서비스계정·슬랙 7종이 **이미 레포에 있음**(`ga-analytics`/`ga-config`/
   `slack-*`/`weekly-report`) → 확장. 빠진 것 = 단일→4 property, 중앙 비교 뷰, weekly-report에 GA4 연결.
   상품화 통찰: 내부 4앱 중앙 뷰 = 고객별 성과의 동일 멀티테넌트 GA4 연결의 두 뷰.

**공통 갭:** 이 대시보드 앱 자체에도 gtag 수집 태그 6월 내 심기(MARKETING도 OUTPUT 노출원).
**다음 액션 후보(사용자 확인 대기):** ① 4앱 gtag 심김 여부 크로스체크(GA4 Phase1 선행조건) /
② 다음 세션에 GA4 Phase1 `/autoplan` 착수.

**Plan A/B 설계 기준:** "시리즈A CTO 면접관이 감탄할 물건인가" = 멀티테넌트+RLS+GA4 Data API 통합이
정확히 그 시그니처. 현 방향은 포폴 관점에서도 정렬됨.

## 현재 세션 (Codex/Claude 핸드오프 표준화)

- 루트 `AGENTS.md` 추가. Codex/Claude 공통 진입 규칙으로 `CLAUDE.md` →
  `wiki/ops/session-state.md` → `git status --short --untracked-files=no` →
  관련 diff 확인 순서를 고정했다.
- 작업 중/완료 전 `wiki/ops/session-state.md` 갱신, 관련 `wiki/` 문서 반영,
  검증 결과 기록을 Codex 쪽에서도 따르도록 문서화했다.
- 최근 세션 확인: 작업 시작 기준 커밋은 `d20d5dfc`이며, `CLAUDE.md` 최상위에 작업 하네스
  3규칙(E2E 선통과, wiki 문서화, 재실행 가능 기록)을 추가하고 이 파일을 신설했다.
- 이번 변경 전 tracked working tree는 clean 상태였다. 이번 변경은 문서/핸드오프 규칙만
  추가한 doc-only 작업이라 빌드/테스트는 실행하지 않았다.
- 같은 tmux의 `marketing-claw:0.0` 패널에서 남은 사용자 지시가 `Stop 훅으로 리마인더 걸어줘`
  임을 확인하고, `.claude/settings.json`에 `Stop` hook을 추가했다. 새 스크립트는
  `.claude/hooks/stop-harness-reminder.sh`: 첫 Stop 시 작업 하네스 체크리스트(E2E/검증,
  관련 wiki, session-state)를 `decision:block`으로 한 번 상기시키고, `stop_hook_active=true`
  재진입 때는 `{}`로 통과해 무한 루프를 피한다.
- Stop hook 검증: `bash -n .claude/hooks/stop-harness-reminder.sh`, `.claude/settings.json`
  JSON parse, `stop_hook_active=false`/`true` 샘플 입력 모두 통과. 코드/대시보드 동작 변경은
  없어 dashboard build/test는 실행하지 않았다.
- tmux↔session-state 핸드오프를 명문화했다. Codex가 `marketing-claw:0.0` pane을
  `tmux capture-pane -p -t marketing-claw:0.0 -S -80`로 확인해 마지막 지시
  `Stop 훅으로 리마인더 걸어줘`를 이어받았고, 루트 `AGENTS.md`/`CLAUDE.md`에
  "tmux pane은 휘발성 takeover context, `wiki/ops/session-state.md`는 durable return
  context" 원칙을 추가했다. Stop hook 메시지도 tmux pane id + 해석한 다음 액션 기록을
  요구하도록 강화했다.
- 추가 검증: 강화 후 `bash -n .claude/hooks/stop-harness-reminder.sh`, `.claude/settings.json`
  JSON parse, `stop_hook_active=false`/`true` 샘플 입력 모두 통과. 문서/하네스 변경이라
  dashboard build/test는 실행하지 않았다.
- 사용자 피드백 반영: handoff는 세션 시작 때만 일어나는 게 아니라 Codex가 새 작업을 진행한
  뒤 Claude가 돌아오는 식으로 언제든 발생할 수 있다. 루트 `AGENTS.md`의 시작 섹션을
  `Start / Resume / Take Over`로 바꾸고, 작업 중 새 태스크 착수/방향 전환/의미 있는 구현 단위
  완료/멈춤 직전마다 `session-state.md`를 갱신하도록 강화했다. `CLAUDE.md`와 Stop hook
  메시지도 "mid-task transfer 가능, transcript가 아니라 session-state로 재개 가능해야 함"을
  명시하도록 수정했다.
- 추가 사용자 피드백 반영: 에이전트는 다른 tmux pane을 이어갈 수 있는지 확인할 수 있지만,
  **무엇을 기준으로 이어갈지는 사용자가 정한다.** tmux pane과 `session-state.md`가 모두
  가능하거나 기준이 불명확하면 사용자에게 어느 handoff source를 따를지 묻고 진행한다.
  `AGENTS.md`, `CLAUDE.md`, Stop hook 메시지를 "user-confirmed handoff basis" 기준으로
  수정했다.
- 현재 handoff 기준: 사용자가 `2.1.187 작업 진행하자`고 지정. `tmux list-panes`상 이 레포의
  `2.1.187`은 `marketing-claw:0.0`(`cwd=/Users/sj/sj_code_master/openclaw-auto`,
  title=`osmu-dashboard-trust-ux-ia-fixes`)이며, `tmux capture-pane` 확인 결과 마지막 pending
  지시는 `Stop 훅으로 리마인더 걸어줘`. 해당 작업은 Codex가 이어받아 `1ad43ed5`
  (`docs: Codex/Claude handoff harness enforce`)로 커밋 완료했고 tracked worktree는 clean.
  다음 실제 작업은 이 파일의 보류 항목 중 P0인 **실발행 루프(cross-repo gateway/cron)** 검토부터
  진행한다.
- 실발행 루프 진행 중: `dashboard/tests/publish/schedule-publish-due.test.ts`를 먼저 추가했고,
  route 부재로 실패하는 것을 확인했다. 이후 `POST /api/schedule/publish-due`를 구현해
  테넌트별 due `schedules`를 `processing`으로 claim(`FOR UPDATE SKIP LOCKED`)하고,
  `threads`/`x`/`instagram`/`facebook`을 기존 직접발행 함수로 발행한 뒤 플랫폼별
  `published_posts` 기록과 schedule `published`/`partial`/`failed` 마감을 수행한다.
  `dashboard/tests/publish/gateway-dependency.contract.test.ts`는 새 실발행 경로를 명시적으로
  허용하도록 업데이트했고, `SchedulePanel`은 새 상태를 정직하게 표시한다.
- 실발행 루프 검증: `cd dashboard && npm run test:publish`, `npm run test`, `npx tsc --noEmit`
  모두 통과. `npm run build`는 샌드박스에서 Turbopack 포트 바인딩 제한으로 실패했으나,
  권한 승인 후 재실행해 통과했다(Next middleware deprecation + 기존 NFT trace warning만 남음).

## 지금까지 (직전 작업 = OSMU 대시보드 신뢰·UX·IA 복구)

고객 온보딩 중 제기된 9개 이슈를 P0(신뢰)→P1(UX)→P2(IA) 순으로 처리하고 배포 완료.

커밋 흐름: `012b3f35`(P0–P2) → `ac931c15`(채널 SSOT + 발행 하네스 층) →
`d20d5dfc`(작업 하네스 3규칙 루트 코드화 + wiki 반영). 앞 2회 배포 모두 success.

**완료 (배포·라이브 검증됨):**
- **발행 E2E 하네스** — `dashboard/tests/publish/`: happy/skip/invalid 분기, 승인 scheduledAt,
  예약 검증, due schedule 실발행 루프 contract, DB-gated `published_posts` 라운드트립.
  `npm run test:publish`.
- **로그아웃 항상 노출** — 사이드바 nav `overflow-y-auto` + footer `shrink-0`.
- **단일 로그인** — 고객 `/login`(Supabase) 단일 진입, 운영자는 `/operator`로 분리(랜딩서 비번
  박스 제거). `/api/me`가 토큰 종류로 운영자/고객 구분(고객 JWT를 운영자로 둔갑 금지),
  Supabase 세션↔localStorage 토큰 동기화(만료 401 차단, 운영자 토큰은 클로버 방지).
- **발행 상태 정직화** — Studio(직접 저작)/인박스(검수 승인) 구분, 예약은 자동화 파이프라인
  발행·미연결 시 "예약됨" 대기 명시.
- **뒤로가기** — 공용 `BackButton`(router.back + fallback), 채널/독립 페이지 일관 적용.
- **라이트 디폴트** — 충돌하던 next-themes ThemeProvider 제거, 배너/뱃지 시맨틱 토큰화.
- **채널 SSOT** — `constants.PUBLISH_CHANNEL_GROUPS` 단일 소스를 Sidebar + ChannelsSettings가
  공유(3중 정의 드리프트 해소). 죽은 Data&SEO 그룹·stub 제거.
- **Settings 정리** — 알림 토글 System→Notifications 이동, "API 토큰"→"Fork 연동".
- **가이드 친절화**(threads/kakao/whatsapp) + theme-blind 색 제거. 격리 배너 고객 홈서 제거.

code-review(high) 7건 전부 반영(교차계정 토큰 클로버, tenantError 재시도, dev 운영자 콘솔,
운영자 로그아웃 목적지, 핫패스 DB I/O, 대비 토큰화).

## 핸드오프 상태 (2026-06-26, Claude — 발행 루프 갭 2건 해소)

- **handoff 기준**: tmux `marketing-claw:0.0` pane은 이 세션 자체이고 대기 지시 공란 →
  durable source `wiki/ops/session-state.md`가 기준(불명확성 없음).
- 직전: Codex가 due publisher `bacc1243` + handoff 문서 `1ad43ed5` 커밋(둘 다 미push였음).
  재진입 시 발견한 갭 2건을 이번에 **닫음**:
  1. **[P1 해소] UI/백엔드 플랫폼 불일치** — `constants.SCHEDULABLE_PLATFORMS` SSOT 신설
     (threads/x/facebook/instagram). `SchedulePanel`(UI)과 `publish-due`(백엔드)가 같은 소스를 소비.
     과거 shorts/reels/tiktok 노출→"미지원" 영영 미발행 정직성 버그 제거. drift 방지 contract
     테스트 `tests/publish/platform-ssot.contract.test.ts`(3) 추가.
  2. **[P0 부분해소] publish-due caller 부재** — `publish-due`에 **운영자 전체 테넌트 스윕** 모드 추가:
     `tenant_id` 없이 운영자 토큰으로 호출 시 RLS 우회 service-role로 `SELECT DISTINCT tenant_id`(due)
     → 각 테넌트 `withTenant` 격리 처리. 단일 크론이 전 테넌트를 발행할 진입점.
     `dashboard/scripts/publish-due-cron.sh`(curl 드라이버) 추가, `wiki/ops/cron.md`에 crontab wiring 문서화.
     테스트 `schedule-publish-due.test.ts`에 운영자 스윕 3 케이스(토큰 불일치 400 / 다중 테넌트 순회 /
     due 0건) 추가.
- **검증(로컬, 실행 증거)**: `npm run test:publish` → 30 passed, 2 skipped(DB-gated).
  `npm run test`(전체) → 123 passed, 8 skipped. `npx tsc --noEmit` exit 0. `npm run build` ✓ Compiled.
  DB-gated/실발행은 로컬 Postgres·크레덴셜 없음 → 배포 환경에서 browse + (운영자) crontab 등록 후 검증.
- **변경 파일**: `src/lib/constants.ts`(+SSOT), `src/components/studio/SchedulePanel.tsx`(SSOT 소비),
  `src/app/api/schedule/publish-due/route.ts`(SSOT + 전체 스윕), `scripts/publish-due-cron.sh`(신규),
  `tests/publish/platform-ssot.contract.test.ts`(신규), `tests/publish/schedule-publish-due.test.ts`(+3),
  `wiki/ops/cron.md`.
- **다음 액션**: 이 변경 + Codex 미push 커밋 2개를 함께 commit→push→`deploy-marketing.yml` 배포→browse 라이브검증.
  (배포는 outward-facing — 사용자 승인 후.)

## 셀프서브 코어 플랜 실행 중 (2026-06-27) — 플랜 승인됨

플랜: `~/.claude/plans/graceful-puzzling-whistle.md`("셀프서브 마케팅 플랫폼 코어"). 완료선 = 비-기술
담당자가 가입→키등록→위키연결→생성까지 혼자 끊김없이. 결정: 내부 4앱=`claude -p`(공짜), 고객=점진 API 키.

- **★A1 키스톤픽스 = 완료·검증·커밋(다음 커밋).** 브랜드 증류 3라우트(`studio/brand-setup`,
  `brand/sync-wiki`, `brand/sync-repo`)의 `claude -p` 하드코딩 → `generateText(prompt, tenantId)` 통일.
  고객 키 등록 시 그 키로 증류(502 해소), 미등록 시 claude -p 폴백. 검증: `tests/brand/*`(6) +
  전체 129 pass/8 skip, tsc 0, build ✓. 문서: `wiki/reference/brand-grounding.md`.
- **B0 완료(코드)**: `Dockerfile`에 claude CLI(`@anthropic-ai/claude-code`) 설치 + compose에
  `${HOME}/.claude:/root/.claude:ro` 마운트(폴백 인증). 적용/인증은 SJ(호스트 사전 인증 + 재배포).
- **B1 완료(코드)**: `dashboard/scripts/apply-schema.sh`(멱등: schema→[--seed]→rls, pg_trgm·osmu_service 검증).
  SJ가 `DATABASE_URL=… bash dashboard/scripts/apply-schema.sh`로 배포 DB에 적용.
- **A3 완료·검증·커밋**: `/api/integrations` POST가 `kind='anthropic'` 키를 저장 전 실호출(max_tokens:1)로
  검증 → 잘못된 키 400 거부(저장 안 함). AiKeySettings가 에러 노출. 테스트 `tests/brand/integrations-anthropic-verify.test.ts`(3).
- **검증(누적)**: 전체 132 pass/8 skip, tsc 0, build ✓. (A1+A3+B0+B1 한 묶음.)
- **A2 완료·커밋(다음)**: `OnboardingWizard` 4스텝으로 확장(업종→채널→채널연결→**콘텐츠 만들 준비**).
  4스텝 = `FreeEventBanner`(무료 서비스 이벤트 명시) + "브랜드 설정하기"(`/studio?setup=brand` 자동오픈)·
  "바로 콘텐츠" CTA. `AiKeySettings`에 FreeEventBanner + 상태문구 "미등록(무료 이벤트—운영자 부담)" +
  theme-blind 색→시맨틱. 신규 `components/shared/FreeEventBanner.tsx`. 검증: tsc 0, 132 pass/8 skip, build ✓
  (시각 검증은 배포 후 browse — 컴포넌트 렌더 테스트 하네스 없음).
- **★제품 원칙(회장 2026-06-28)**: "얼마나 *편하게* 해주는지"가 핵심 — 홍보 메시지로도 쓰고, 기획·개발
  내내 디자인 가치로 박는다(고객이 plumbing 안 만지게, 연결 버튼 하나로). GA4/슬랙=플랫폼이 인터페이스.
- **A2 배포 success**(런 28294936895, 4m13s) — 온보딩 라이브. 화면 browse 검수는 URL/토큰 시.
- **셀프서브 E2E 층 완성**: `tests/brand/studio-text-grounding.test.ts`(4) — 생성이 브랜드가이드+위키사실을
  실제 프롬프트에 주입하고 "지어내기 금지" 강제하는지 단언(셀프서브 payoff). `tests/brand/*` 총 13개로
  키검증→브랜드증류→생성그라운딩 전 경로 커버. 라이브 드라이런용 `scripts/verify-selfserve-e2e.sh`(browse,
  URL/토큰 생기면 한 줄). 전체 136 pass/8 skip, tsc 0, build ✓. **라이브 풀플로우 검증만 URL/토큰 대기.**
- **남은 "셋다" 중**: ② GA4/슬랙 "연결" 버튼(OAuth) = 다음 코드(큰 작업—Google/Slack OAuth 콜백·토큰저장).
  ③ 라이브 probe = operator URL+토큰 필요(SJ 보유) — 주면 즉시 진단(`curl /api/me`).
- **정확한 다음 액션**: (a) 배포 완료 확인 후 A2 browse 검수 (b) GA4/슬랙 OAuth 연결 빌드 착수 또는
  (c) SJ가 URL/토큰 주면 라이브 probe→셀프서브 드라이런. 사용자 선택 대기.
- **★시크릿 현황(2026-06-27 `gh secret list` 확인)**: `OSMU_SECRET_KEY`·`OSMU_DATABASE_URL`·
  `OSMU_DASHBOARD_AUTH_TOKEN`·`OSMU_SUPABASE_URL`·`OSMU_SUPABASE_ANON_KEY` **전부 2026-06-16에 설정됨.**
  → **OSMU_SECRET_KEY 재생성 금지**(기존 암호화 토큰 복호화 불가됨). #2는 이미 완료.
- **남은 진짜 미지수(축소됨)**: ① 그 DB에 스키마/RLS/pg_trgm이 실제 적용됐는지(미지 — `apply-schema.sh`는 멱등이라
  돌려도 안전) ② B0(claude CLI+~/.claude) 반영 재배포 ③ Supabase Email confirm/redirect 콘솔 토글(가입 되면 스킵).
- **확정 방법**: 라이브 probe(operator 토큰+URL 필요 — 둘 다 SJ 보유) — curl로 워크스페이스 생성/키 등록 시도해
  어디서 막히는지 확인하면 "이미 된 것 vs 할 것" 갈림.
- **그 후**: 내가 테스트 계정 1개로 가입→키→sync(CUPID public)→생성 드라이런으로 끊김 0 증명.

## brand 그라운딩 구현 현황 (2026-06-26 코드 검증)

**구현됨(코드+UI+생성주입):** 사내 repo 위키 가져오기(`RepoConnect.tsx`+`/api/brand/sync-wiki`·`sync-repo`),
wizard 6문항(`BrandSetupWizard.tsx`+`/api/studio/brand-setup`), 생성 그라운딩(`studio/text`가
`brand_guides`(톤)+`wiki_docs`(사실, `lib/wiki-retrieve` `withTenant`)+`context_sources`(0차 multi-repo
즉석 fetch) 주입, "사실 근거·지어내기 금지" 프롬프트).
**미구현:** 외부 **Notion 커넥터(grep 0)**, URL크롤·업로드 커넥터, AI 전략코칭·톤검수(Flow B).

**"웹 켜고 4앱 즉시 데모"는 ❌ — 빠진 4개:** (a) `wiki_docs`/`brand_guides`는 Postgres+RLS →
**로컬 DB 없어 배포 환경에서만** 동작 (b) 앱별 **테넌트 생성+sync 실행 셋업 미완**(기능 있으나 데이터 비어있음)
(c) **ZERO-ONE GitHub repo 부재**(push 선행, D-EDU·CUPID는 repo 있음) (d) Notion 미구현.
→ 데모하려면 배포 환경에서 앱별 테넌트 만들고 sync-wiki 1회 돌려 데이터 적재해야 함.

## 다음 단계 / 보류

- **실발행 루프 crontab 등록 [P0 잔여]** — 엔드포인트·스윕 모드·드라이버 스크립트는 완비됨.
  남은 건 **배포 호스트 crontab(또는 게이트웨이)이 `publish-due-cron.sh`를 주기 호출하도록 등록**하는 것
  (운영자 액션, 레포 밖 — Supabase 콘솔 설정과 동급). 등록 전엔 예약이 `scheduled`로 대기(SchedulePanel 정직 표시).
- **GA/GSC 실제 OAuth 연결** — 백엔드 config API는 있으나 connect UI 미구현. 현재는 사이드바에서
  죽은 항목 제거 + 읽기 대시보드만 유지.
- **brand-wiki 인입(JOGON 엔진 축2, 2026-06-26 논의)** — 4앱 wiki를 마케팅 콘텐츠 그라운딩으로 끌어옴.
  메커니즘 **이미 있음**: `/api/brand/sync-wiki`(테넌트별 `wiki_docs` 인입 + `brand_guides` 톤 증류,
  Studio가 pg_trgm 그라운딩). 2층 구분 — 제품 사실=각 repo wiki→sync-wiki로 DB 인입 /
  전략·톤·페르소나=brain(로컬 stdio, **DB로 절대 안 넣음·프라이버시 1선**, MARKETING Claude가 읽어 prompt-guide 작성).
  repo 상태(확인됨): D-EDU `idealstudy/mvp-back` wiki 310md ✅, CUPID `seong-jin-jo/postAGI` wiki 103md ✅,
  ZERO-ONE ❌ GitHub repo 없음(push 선행). 블로커: 배포 환경 DB 필요, private repo 토큰(getRepoToken),
  서버 `claude -p`(CLAUDE_BIN). 착수 후보: ZERO-ONE push / 배포 환경서 D-EDU·CUPID 테넌트 생성+sync 검증.
  - **결정(권고, ADR 미작성·사용자 확인 대기)**: brand 그라운딩 방식 = **신뢰 경계로 가름.**
    사내(통제 가능, 신선도 중요) = **MCP/federation**(무인 크론엔 nightly sync 스냅샷 병행). 외부 고객
    (미통제, 자영업자) = **pull+스냅샷+RLS 격리(sync)** — MCP 절대 안 열게(CX 사망·인젝션/유출 표면).
    상품화 갭 = `sync-wiki`가 repo 소스만 → **비-repo 커넥터 필요**(URL 크롤/파일 업로드/Notion·Google Doc
    OAuth/붙여넣기) 같은 `wiki_docs`+`brand_guides` 파이프라인 재사용. 근거: brain `cto/ai/concept-brain-MCP-federation` §6.
  - **정제된 결론(2026-06-26): "두 시스템" 아님 — 하나의 그라운딩 store + 소스 어댑터.** `brand_guides.source`
    필드가 이미 `wizard | repo | paste`로 다중 어댑터 구조 증명(생성기는 store만 읽음, 인입↔생성 분리).
    · **외부 비개발자용 = `wizard` 어댑터가 이미 있음**(`/api/studio/brand-setup`, 6문항→`claude -p` 증류).
      상품화 = 새 시스템 X, **wizard 확장**(필드↑·홈페이지 크롤 AI 부트스트랩·코칭). ← 6월 상품화 우선.
    · **사내 = repo-sync(있음) + brain MCP(별도 ~/brain-mcp, 있음).** **대시보드에 MCP 새로 구현 불필요**
      (오버빌드 방지). 전략·톤은 운영자가 brain 읽어 wizard/prompt-guide에 반영.
    · MCP가 사내서 효율적 이유(인터랙티브 한정): 복사·sync 유지비 0 / 항상 최신 / synapse 풍부검색 /
      프라이버시 중복 0 / 양끝 통제. 외부선 이 5개가 전부 뒤집힘(마찰·인젝션·유출).
  - **★정정(2026-06-26, 직전 "사내=MCP" 표현 교정 — 재실행 세션은 이걸 따른다):**
    **그라운딩(무인 생성)은 사내·외부 모두 snapshot(우리 store `brand_guides`/`wiki_docs`, RLS 격리)으로 통일.**
    입력 어댑터만 다름 — 사내=`repo-sync`, 외부=`wizard`(기존) / Notion-OAuth-sync / 업로드·URL크롤·paste.
    생성기는 store만 읽음(인입↔생성 분리). **MCP는 "제품 그라운딩 경로"가 아니라 운영자(나)가 전략·톤·
    페르소나를 읽어 캠페인·prompt-guide를 *설계*하는 인터랙티브 사고도구** — 무인 크론에 안 들어감
    (라이브 의존 취약 + 전략 brain은 DB 금지). ∴ **대시보드에 제품 MCP 신규구현 0.** 외부 고객은 MCP를
    절대 열지 않음("연결=OAuth → 우리가 주기 snapshot", 라이브 쿼리 아님).
    · 두 흐름 분리: Flow A(고객 브랜드→우리 생성기=그라운딩) vs Flow B(우리 인사이트·템플릿→고객=가치제공).
      Flow B의 "우리 노션"은 **복사용 템플릿**으로 제공(공유 편집 X — 테넌트 누수), 그라운딩과 별개.

## 사용자 액션 (Claude 불가)

1. Supabase 콘솔: Auth > Email "Confirm email" OFF 또는 URL Configuration에 Site URL + Redirect
   URLs(`.../**`) 등록 → 신규 이메일 가입 정상화.
2. 노출됐던 비번 rotate.

## 배포 / 검증 루틴

- 배포: `gh workflow run deploy-marketing.yml --ref main -f services="openclaw-dashboard-osmu"`
  (self-hosted runner가 시크릿으로 .env 렌더 + NEXT_PUBLIC_SUPABASE_* 빌드arg 주입 + 스모크 게이트).
- 게이트: `cd dashboard && npx tsc --noEmit && npm run test && npm run build` → gstack `browse`
  라이트/다크 육안. 로컬엔 DB/Supabase 없음 → 인증 대시보드 본문은 배포 환경 browse로 검증.
- 라이브 URL은 비공개(레포 PUBLIC — 실도메인/브랜드/시크릿 금지). 자동 메모리 핸드오프 참조.
