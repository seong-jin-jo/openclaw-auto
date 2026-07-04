# 세션 작업 상태 (재실행 가능한 핸드오프)

> 작업 하네스 규칙 #3. 30초 재개. 상세 이력: [archive/session-2026-06.md](archive/session-2026-06.md) (2026-07-02 롤오버).
> 단계 진실원: 루트 `pipeline-state.md`(현재 **qa**, ship은 `/approve qa` 후). QA 증거: `docs/qa-tracker.md`.

**최종 갱신:** 2026-07-04 · `main`(c214ad00, 전부 push됨) · 노트북 끄고 온프렘서 재개.

### ✅ IG 실발행 검증 완료 (2026-07-04, DB 증거)
`published_posts`에 tenant 587cee76 / instagram / **external_id=17938476117069923** 존재 = 인스타 실제
게시물 ID = zero_to_one_ai 피드에 실발행됨. 폴링픽스(c214ad00) 후 성공. 직전 시도는 external_id=null(9007
실패, 픽스 전). **IG end-to-end(연결→생성→실발행) 증명 완료.**
연결 현황(DB): instagram(587cee76, api=instagram_login) 1개만. threads(6119a9c7)는 옛 테넌트 것·무관.
**모든 플랫폼 연결 아님** — 다음은 Threads 복제(권한 threads_content_publish 추가→redirect→시크릿 비번게이트→OAuth).

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
