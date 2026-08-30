## 2026-08-31 04:00 KST Codex 실제 LLM 생성 연동 build 완료

- 후보 3개와 글, 카드뉴스, 영상 파생을 실제 LLM 호출로 교체했다. 실패 시 템플릿 fallback은 없다.
- 로컬 Studio 화면 생성 HTTP 201과 서로 다른 후보 3개, 영상 파생 HTTP 201과 실제 대본 및 장면, 사용량 token과 비용 장부를 관찰했다.
- 운영 컨테이너의 Claude OAuth CLI JSON 호출도 성공했다. 임시 로컬 공유 AI 승인은 원상복구했다.
- 전체 Vitest 207파일 1,554건, TypeScript, build 177/177, design lint 0을 통과했다.
- 운영 배포와 운영 Studio UI 클릭은 미검증이다. 다음 행동은 커밋, push, QA 단계 재검증이다.
- 구현과 증거는 `7fa3fb55`, `65b6abf6`로 커밋했다. 요청한 원격 push는 실행 정책이 승인 필요로 차단했으며 이 세션은 승인 요청이 금지돼 미실행이다.

## 2026-08-31 KST Codex 실제 LLM 생성 연동 진행 중

핸드오프 기준: 회장이 이 세션에 직접 전달한 실제 LLM 연동 과제와 `osmu-llm0831:0.0` pane. `osmu-gen0830`과 `osmu-edit0830`은 종료 기록만 확인했고 생성 로직 범위와 겹치지 않는다.

### 무엇을 어디까지 했나

- `pipeline-state.osmu.md`의 실제 LLM 부재 게이트와 source-write 허용 범위를 확인했다.
- 기존 구현과 QA tracker에서 후보 및 파생 생성이 고정 템플릿이라는 NG를 재확인했다.
- 작업 범위는 `dashboard/src/lib/studio/generation/`의 생성 로직, 관련 계약 테스트, 증거 문서로 한정했다.

### 남은 이슈·블로커

- 실제 LLM 실행기, 사용량 기록, 실패 투명성, 후보와 파생 생성 연결은 아직 미구현이다.
- 로컬 Claude Code OAuth 폴백과 운영 컨테이너의 `/root/.claude` 마운트는 아직 실호출 미검증이다.

### 다음에 칠 명령

1. 생성 로직 전체와 일곱 칸 학습 정보 계약을 읽고 테스트를 먼저 추가한다.
2. Claude CLI 및 API provider 실행기와 사용량 기록을 구현한다.
3. 로컬 앱 실호출, 전체 테스트, TypeScript, build, design lint를 검증한다.

### 검증했나

- 근거 확인: build source-write 허용, 기존 템플릿 경로, 다른 두 worker 종료 상태.
- 미검증: 실제 LLM 응답, 화면, 전체 회귀, 운영 자격증명.

## 2026-08-30 23:10 KST Codex 학습 정보·생성실 build 완료, push 정책 차단

핸드오프 기준: 회장 2차 실사용 피드백 원문과 `osmu-gen0830` 위임.

### 무엇을 어디까지 했나

- 학습 정보 8건과 생성실 11건을 원문 기준으로 각각 대조해 구현했다. 상세 결과는 `docs/qa/2차피드백-학습정보와-생성실-대조-2026-08-30.md`다.
- 학습 정보는 Studio 진입 시 자동 팝업, 7개 직접 입력, 1개 자동 학습 설명, 검토와 명시적 저장으로 바뀌었다.
- 생성실은 6개 질문을 한 번에 하나씩 묻고, 형식 중복 선택과 학습 정보 중복 버튼을 제거했다. 저장하지 않은 질문 상태는 새로고침 시 초기화한다.
- 실제 생성은 여전히 LLM이 아니라 규칙 기반 구조 초안 3개다. 화면이 이를 `현재 제공`과 `준비 중`으로 분리해 완성 미디어가 나오는 것처럼 말하지 않게 했다.
- 코드와 테스트 11파일을 다섯 커밋으로 묶었다: `7441ea74`, `37d4ec33`, `97dd29ad`, `c785d934`, `35a5dff7`. 증거 문서와 캡처는 `603c652e`에 묶었다.

### 남은 이슈·블로커

- 실제 LLM, 완성 영상, 카드뉴스 이미지, 완성 글 생성은 미구현이다. 현재 화면은 규칙 기반 구조 초안 3개만 제공한다고 명시한다.
- 운영 배포와 운영 고객의 동일 19항목 재검증은 수행하지 않았다.
- `git push origin feat/design-system-and-missing-features`는 저장소 실행 정책이 별도 승인을 요구하지만 현재 세션은 승인 요청이 금지돼 차단됐다. 로컬 브랜치는 원격보다 앞선 상태다.

### 다음에 칠 명령

1. push 권한이 있는 세션에서 `git push origin feat/design-system-and-missing-features`를 실행한다.
2. QA 단계에서 운영 배포 전 동일 19항목을 캡처 기준으로 재검증한다.

### 검증했나

- 테스트됨: 전체 Vitest 206파일, 1,550건 통과, 조건부 1건 제외.
- 테스트됨: TypeScript 종료 코드 0, Web production build 정적 페이지 177/177, UI token audit 0, design lint 0. 기존 NFT 추적 경고 1건은 유지됐다.
- 관찰됨: localhost 3456, 지정 작업 공간, 학습 정보 자동 팝업부터 generation POST 201과 후보 3개까지 캡처 5장. 브라우저 401과 콘솔 오류 0건.
- 미검증: 운영 배포, 운영 고객 흐름, 실제 LLM과 완성 영상·카드 이미지·완성 글 생성.
- 차단됨: 원격 push는 실행되지 않았다.

## 2026-08-30 23:09 KST Codex 편집실·발행실 build 회수 대기

핸드오프 기준: 회장 2차 피드백 원문과 이 세션에 전달된 13개 항목.

### 무엇을 어디까지 했나

- R199·R204·2차 13번의 원인은 발행실 헤더에 이미 승인 인박스와 발행 캘린더가 있는데 본문에서도 `PublishTrip`을 다시 렌더한 중복이었다. `dashboard/src/app/studio/page.tsx`의 렌더와 미사용 import를 제거했다. 회장은 같은 이동 경로를 두 번 해석하지 않아도 된다.
- 13개 항목 대조와 중단 사유는 `docs/qa/2차피드백-편집실과-발행실-대조-2026-08-30.md`에 기록했다. 구현현황과 QA tracker도 갱신했다.
- 변경 5파일을 로컬 커밋 `4c1dcc3f`로 묶었다. 다른 조의 학습 정보·생성실 워커는 이후 별도 커밋 5개를 추가했고 이 커밋은 그대로 보존됐다.

### 남은 이슈·블로커

- 1번부터 12번은 미착수다. `pipeline-state.osmu.md`에 승인 프로토타입 핀이 없고 `DESIGN.md` 최상단은 v64, 부록은 v61을 현행 정본으로 적는다. 이 충돌을 임의 해석하면 편집실·발행실 구조가 다시 승인 시안에서 벗어날 수 있다.
- 후보는 `docs/prototype/openclaw-auto-4room-v61.html`부터 v64까지다. 추천 후보는 DESIGN 최상단과 최고 semver가 함께 가리키는 v64다.
- `git push origin feat/design-system-and-missing-features`는 실행 정책이 승인 필요로 차단했다. 다른 조 작업까지 합쳐 현재 HEAD는 `35a5dff7`이고 원격 브랜치는 로컬보다 7개 커밋 뒤다.
- 다른 조가 `docs/qa/qa-tracker.md`에 남긴 미커밋 변경이 있다. 이 세션은 해당 변경을 커밋하거나 되돌리지 않았다.
- 로컬 3456 실화면, 전체 `npm run test`, 플랫폼 7종 웹 조사, 1번부터 12번 구현은 미검증 또는 미착수다.

### 다음에 칠 명령

1. 컨트롤러가 `pipeline-state.osmu.md`의 `approved_artifacts`에 승인 프로토타입 한 개를 핀한다.
2. `git status --short --untracked-files=no`로 생성실 조의 동시 변경을 확인하고, 편집실·발행실 범위만 재개한다.
3. `cd dashboard && npm run test && npx tsc --noEmit && node scripts/ui-token-audit.mjs`로 전체 검증한다.
4. 제한시간 dev 서버와 브라우저를 묶어 3456 편집실·발행실을 캡처한 뒤 서버를 종료한다.
5. push 권한이 있는 세션에서 `git push origin feat/design-system-and-missing-features`를 실행한다.

### 검증했나

- 테스트됨: `npx vitest run tests/publish/studio-publish-ui.test.tsx`, 27건 통과.
- 테스트됨: `npx tsc --noEmit`, 종료 코드 0.
- 테스트됨: `node scripts/ui-token-audit.mjs`, 위반 0.
- 첫 Vitest 시도는 기존 설정과 `--maxWorkers=1`이 충돌해 테스트를 시작하지 못했다. 표준 명령으로 재실행해 통과했다.
- 미검증: 실제 3456 화면, 전체 테스트, 운영 배포, 원격 push.

## 2026-08-30 22:30 KST Claude 세션 (osmu 라인) ★★제품 핵심 부재 확인. codex 재가동.

핸드오프 기준: 이 파일(session-state.osmu.md).

★★★ 가장 중요한 사실. 이것부터 읽어라.

**콘텐츠 생성이 LLM 을 한 번도 부르지 않는다. 전부 하드코딩된 문자열 템플릿이다.**
- `src/lib/studio/generation/service.ts` 의 `buildCandidates()` 가 A/B/C 를 배열로 하드코딩.
  예: `title: `${topic}: 문제부터 여는 안``
- `src/lib/studio/generation/derivation.ts` 가 글·카드뉴스·영상을 템플릿으로 찍는다.
- 영상은 `asset_url: "pending:render"` 고정.
- 그 경로에 anthropic/claude/openai/fetch 호출 grep 0건.
- ★컨트롤러가 코드를 직접 열어 확인했다. 워커 주장이 아니다.

⇒ **회장이 "A, B, C 누르면 영상 후보 안나오는데?" 라고 한 것의 진짜 원인이 이것이다.**
⇒ **이 위에 쌓은 파생 생성, 편집실, 발행실이 전부 빈 껍데기 위에 있다.**
⇒ 파생 단가(카드 300원, 영상 1200원)도 실제 생성이 없으니 지금은 의미가 없다.
   회장 판단 필요: 실제 LLM 연동 전까지 0으로 둘지.

★★ 로그인은 깨져 있지 않다. 깨진 것은 **채널 계정 연결**이다.
회장이 "계정 연결 실패말하는거다" 로 확정해 줬다.
- 워커 실측: Playwright 로 /login 열고 Google 버튼 클릭 → Google 로그인 화면 도달, 콘솔 오류 0.
  그 뒤 계정 선택은 회장 계정이 필요해 못 밟았다.
- 운영 DB 실측: workspace badd844f 의 threads/instagram 계정이
  connectionStatus=invalid, connectionError=oauth_token_invalid, reconnectRequired=true.
  ⇒ 화면이 "연결됨" 이라고 거짓말하지는 않는다(앞선 내 우려는 정정).
- 24시간 로그에 connect 관련은 exchange-fail 단 1건. Threads 1회 시도가 전부.
- 운영 THREADS_APP_ID/SECRET 으로 Meta 엔드포인트 직접 호출 → 응답이
  "토큰/코드가 틀렸다" 이지 "앱이 틀렸다" 가 아니다. **앱 자격증명은 유효하다.**
- 공식 문서 대조: 우리 요청 형식은 현행 Threads 규격과 일치한다.

**고친 것 (PR #39 병합, 배포 33313508878 success)**:
| 파일 | 결함 |
|---|---|
| social-connect.ts:516 | long-lived 교환 실패 시 status·body 를 버리고 고정 문자열만 남김. **원인 불명의 진짜 원인** |
| 같은 파일 short 단계 | Meta 의 {error:{message}} 형식을 못 읽어 Graph 계열 오류가 뭉개짐 |
| login/page.tsx:43 | OAuth 콜백 error 를 마커만 지우고 화면에 아무 말도 안 함 |
| observability.ts:317 | 토큰 무효 실패가 전부 unknown. auth_invalid/decrypt_failed 추가 |

⇒ **이제 회장이 Threads 재연결을 한 번 시도하면 로그에 Meta 가 준 진짜 사유가 남는다.**
   그때 원인이 확정된다.

★미수정 후속: channel-config GET 이 폴링마다 severity:error 알림을 쏜다.
 로그가 수십 번 반복되던 정체이고 알림 설계 결함이다.

★회장이 확인해야 할 유일한 외부 항목: Supabase 콘솔 →
 Authentication → URL Configuration → Redirect URLs 에
 `<운영주소>/login` 과 `<운영주소>/login?**` 두 줄이 있는지.
 와일드카드가 없으면 `?returnTo=` 때문에 정확일치에 실패한다.

★★ 요청 전항목 대조표 완성: `docs/qa/회장-요청-전항목-대조표-2026-08-30.md` (커밋 009ffcad)
**266건 중 충족 128 · 부분 60 · 미충족 48 · 확인불가 30.**
★가장 중요한 숫자: **2차 실사용 피드백 31건 중 충족이 1건.** 어제 지적은 사실상 미착수다.
회장이 먼저 볼 것 넷(대조 조가 꼽은 것):
1. 발행실 상단 왕복 띠가 그대로. app/studio/page.tsx:970. R199·R204 로 두 번 지시, 세 번째 지적.
2. 학습 정보가 8칸이라 표시하고 3칸만 받는다. 3걸음 마치면 "3 / 8", 나머지 채울 화면 없음.
3. 학습 문답 질문 세 개가 어제와 한 글자도 안 바뀌었다.
4. 만든 콘텐츠를 볼 수 없다(위 LLM 부재가 원인).
★대조 조 셀프심문: 성과실 4건을 충족으로 적었으나 앞선 네 판에서도 같은 근거로
 충족을 줬다가 네 번 다 반려됐다. 회장이 열어 보기 전엔 충족이라 하면 안 된다고 자인.

★★ 2차 피드백 원문을 요청 원장에 verbatim 박제함(커밋 51c46549):
`wiki/거버넌스/요청-원문/2026-08-30-회장-2차-실사용-피드백.md`
★요약본만 있어 항목 수가 어긋나 있었다(생성실 10 vs 실제 11, 발행실 3 vs 실제 4).
 세는 단위가 어긋난 것이 누락의 씨앗이었다.
★요청 원문 폴더가 docs/requests/ 에서 wiki/거버넌스/요청-원문/ 으로 이동 중이다. 양쪽 확인할 것.

★★ 회장 지시: "Codex 토큰 많으니까 적극 시키고 요청 하나 하나씩 대조하며 작업해라."
codex 재가동. 두 판 발주(항목 번호를 붙여 대조 보고하게 했다):
- osmu-gen0830 (code-builder): 학습 정보 8건 + 생성실 11건. 프롬프트 /tmp/codex-gen.txt
  산출물 docs/qa/2차피드백-학습정보와-생성실-대조-2026-08-30.md
  ★웹 조사 최소 5곳 의무(한국어 서비스 2곳 포함). 회장이 "어디서 벤치마킹한 UX 라이팅이냐"고 물었다.
- osmu-edit0830 (code-builder): 편집실 8건 + 발행실 4건 + 왕복 띠 제거.
  프롬프트 /tmp/codex-edit.txt
  산출물 docs/qa/2차피드백-편집실과-발행실-대조-2026-08-30.md
  ★플랫폼별 표시이름·캡션·해시태그 실조사 의무.
   게시물 단위로 바꿀 수 있는 것과 없는 것을 갈라라. 표시 이름은 대부분 계정 설정이다.
★codex-in-pane.sh 는 프롬프트를 **파일 경로**로 받는다. 문자열을 그대로 넘기면
 "프롬프트 파일 없음" 으로 죽는다. 내가 한 번 틀렸다.

다음 액션:
1. 두 codex 판 회수 → 항목별 대조 보고 확인 → 병합·배포.
2. 회장이 Threads 재연결 1회 시도하면 로그에서 Meta 실사유 확인.
3. **LLM 연동을 언제 할지 회장 판단 필요.** 이게 없으면 나머지는 껍데기다.
4. 배포 후 컨트롤러가 직접 로그인부터 발행까지 밟는다.
