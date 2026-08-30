## 2026-08-30 22:29 KST Codex 편집실·발행실 build 회수 대기

핸드오프 기준: 회장 2차 피드백 원문과 이 세션에 전달된 13개 항목.

### 무엇을 어디까지 했나

- R199·R204·2차 13번의 원인은 발행실 헤더에 이미 승인 인박스와 발행 캘린더가 있는데 본문에서도 `PublishTrip`을 다시 렌더한 중복이었다. `dashboard/src/app/studio/page.tsx`의 렌더와 미사용 import를 제거했다. 회장은 같은 이동 경로를 두 번 해석하지 않아도 된다.
- 13개 항목 대조와 중단 사유는 `docs/qa/2차피드백-편집실과-발행실-대조-2026-08-30.md`에 기록했다. 구현현황과 QA tracker도 갱신했다.
- 변경 5파일을 로컬 커밋 `5d54fbad`로 묶었다. 다른 조가 수정 중인 `dashboard/src/components/studio/learning-info.ts`는 건드리지 않았다.

### 남은 이슈·블로커

- 1번부터 12번은 미착수다. `pipeline-state.osmu.md`에 승인 프로토타입 핀이 없고 `DESIGN.md` 최상단은 v64, 부록은 v61을 현행 정본으로 적는다. 이 충돌을 임의 해석하면 편집실·발행실 구조가 다시 승인 시안에서 벗어날 수 있다.
- 후보는 `docs/prototype/openclaw-auto-4room-v61.html`부터 v64까지다. 추천 후보는 DESIGN 최상단과 최고 semver가 함께 가리키는 v64다.
- `git push origin feat/design-system-and-missing-features`는 실행 정책이 승인 필요로 차단했다. 원격 브랜치는 로컬보다 2개 커밋 뒤다.
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
