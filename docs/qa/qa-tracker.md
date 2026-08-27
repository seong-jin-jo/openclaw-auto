# QA Tracker — openclaw-auto-osmu (pipeline qa 단계 증거)

> 2026-07-02 밤샘 라이브 QA(browse+curl, 직접 관찰). 형식: 증거 항목 → 결과 → 근거.

## 2026-08-28 ❌ NG → 🔧: 성과 제안 생성 큐 인계가 고객 토큰을 거절

**❌ NG 관찰:** 실제 `localhost:3456`과 실제 DB에 임시 tenant, 브랜드 맥락,
시장 신호를 연결했다. 고객 `osmu_` 토큰으로 `POST /api/suggestions`는 HTTP 200과
가설 3개를 반환했지만, 같은 토큰의 `POST /api/suggestions/enqueue`는 HTTP 403
`{“error”:“이 API는 운영자 전용입니다”}`로 막혔다.

**근본 원인:** 성과실 고객 UI가 실제로 호출하는 신규 route를 추가하면서
`proxy.ts` tenant-safe allowlist에 동일 경로를 추가하지 않았다. UI 정적 경계 테스트는
경로 문자열이 존재함만 검사해 proxy 인증 경계 누락을 잡지 못했다.

**🔧 수정:** `/api/suggestions/enqueue`를 tenant-aware 경계에 명시했고, 유효한
고객 토큰은 통과하되 폐기된 토큰은 401을 유지하는 `BE-V63-02` 회귀 테스트를
추가했다. 실제 HTTP 재관찰과 전체 회귀 검증 전이므로 PASS로 승격하지 않는다.

## 2026-08-28 ❌ NG: 화면 4차 390 셸이 본문을 화면 밖으로 밀어냄

**반려 관찰:** `docs/prototype/qa-fe4/publish-room-390.png`에서 폭 96px의 네 방 레일이
세로 사이드바 전체 높이를 차지하고, 발행실 본문은 오른쪽 화면 밖으로 밀려 보이지 않는다.

**근본 원인:** 실제 `Sidebar.tsx`가 모든 폭에서 `h-screen w-24`를 고정하고
`AuthGate.tsx`도 셸 주축을 항상 가로로 유지한다. 승인 프로토타입의 700px 아래 모바일 서랍 분기와
요구 대장 R19의 390 예외가 화면 3차 이식에서 빠졌다. 1024 레일 캡처만 통과 조건으로 삼고
390에서는 대화창 존재만 세어 본문 가시 폭을 측정하지 않은 검증 공백도 원인이다.

**수정 종료조건:** 390에서는 사이드바를 서랍으로 전환하고 닫힌 셸에 현재 방 이름과
`지금 여기`를 유지한다. 768 이상은 기존 네 방 레일을 보존한다. 홈, Studio, 채널, 설정을
390, 768, 1024, 1440에서 캡처하고 본문 가시 폭, 가로 넘침, 네 방 링크, 콘솔 오류를 기록한다.

## 2026-08-28 ❌ NG → 🔧 → ✅ PASS: 화면 3차가 v63 네 방 정보 구조를 실제 앱에 이식

**반려 관찰:** `docs/prototype/qa-fe2/publish-room-1440.png`와
`create-room-candidates-1440.png`를 확정 프로토타입 v63과 대조했다. 실제 앱은 기존
Marketing Hub 분류 사이드바와 헤더 방 전환 알약을 유지했고, 오른쪽은 대화창이 아니라
기능 단추와 발행 채널 체크 목록이었다. 발행 채널 선택도 각 미리보기 칸 밖에 있었고
발행 이력과 이모지 단추 문구가 남았다.

**근본 원인:** 화면 2차가 Studio API 후보 3장, 편집 인계, 명령 라우팅, 미리보기 입력 계약을
기존 페이지 구조 위에 추가하는 데 집중해 승인 프로토타입의 정보 구조를 교체하지 않았다.
기능 연결 테스트만으로 시안 준수를 대리했고, 실제 앱과 v63의 구조 대조를 종료 조건으로
검사하지 않은 것이 직접 원인이다.

**수정:** 사이드바 첫 영역을 생성실, 편집실, 발행실, 성과실의 순번과 연결선으로 교체했다.
헤더에는 작업물 전체와 기존 승인 인박스, 발행 캘린더 접근을 유지했다. 생성실, 편집실,
발행실에 `data-room-top` 한 줄을 추가했다. 오른쪽 기능 단추 목록은 실제 명령을 받는 대화창으로
교체하고, 발행 체크와 계정 선택은 7개 미리보기 칸 머리로 이동했다. 발행 이력은 렌더 경로에서
제거하고 실행 단추를 `초안으로 저장`, `검토 요청`, `Publish (3)`, `날짜 잡기`로 정렬했다.

**회귀 발견과 수선:** 옛 화면 렌더 경로 제거 뒤 전체 테스트가 영상 내레이션 폴백 메시지 누락
1건을 잡았다. 배너를 새 발행실에 다시 연결했다. 첫 브라우저 캡처에서는 카드 최소 폭 때문에
세 번째 카드가 가로로 밀렸다. 이를 3열 반응형 그리드로 바꿔 텍스트 3칸, 영상 3칸,
카드뉴스 1칸이 같은 발행실에 모두 노출되게 했다.

**✅ 종료증거:** `docs/prototype/qa-fe3/`의 1440 발행실, 생성실 후보 3장, 네 방 사이드바와
1024 좁은 사이드바를 원본으로 열었다. 실제 `localhost:3456`에서 네 방 4개, 미리보기 7개,
미리보기 내부 발행 체크 4개, 계정 선택 4개, 발행 중지 0개를 관찰했다. Studio 생성 요청은
HTTP 201이고 A, B, C 선택 단추 3개가 나타났다. 인증 401과 브라우저 콘솔 오류는 0건이다.
전체 `npm run test`는 148파일, 1,200건 통과, 6건 skipped, 실패 0이다. TypeScript와
production build 171페이지가 통과했고 design lint는 토큰 위반 0이다. production 배포는 미검증이다.

## 2026-08-28 🔧 로컬 수정: Studio v1과 대시보드 Authorization 충돌

**❌ NG 관찰:** 대시보드 Proxy와 Studio identity가 같은 `Authorization` 헤더를 각각 자기 토큰으로 검사해 실제 `localhost:3456` 앱에서는 어느 토큰을 보내도 한쪽이 401로 막혔다.

**원인과 수정:** 현재 존재하는 Studio v1 생성·조회·재생성 3개 경로만 대시보드 인증 예외 allowlist로 분리하고, Studio Route Handler의 bearer 검증은 유지했다. 기존 대시보드 Studio 경로와 tenant allowlist는 변경하지 않았다. 미등록 Studio v1 경로도 자동 예외가 되지 않는다.

**🔧 종료증거:** 같은 3456 listener에서 생성 201 후보 3장, 학습정보 누락 422 필드 지목, 조회 200, 무료 재생성 201, 추가 재생성 409, `/api/queue` 200, `/api/suggestions` 200을 관찰했다. 전문은 `/private/tmp/studio-api-live-final.GqNVsz/`. 전체 Vitest 1,170건과 커밋 `1eb0e848` 전용 webpack production build 169/169 통과.

**미검증:** stage와 production 반영, production identity adapter. 배포 뒤 같은 Studio 201·401과 대시보드 회귀를 재검증하기 전에는 production PASS로 승격하지 않는다.

## 2026-08-27 ❌ NG: v62 성과실 핵심 행동의 백엔드 단절

**반려 관찰:** 확정 프로토타입 v62의 성과실은 댓글 본문, 답글 보내기, 나중 처리,
`이 결로 한 편 더`를 요구한다. 현행 `GET /api/metrics`는 replies 숫자만 반환하고,
댓글 목록과 답글 provider 호출은 없다. `POST /api/suggestions`가 만든 제안을 기존
`POST /api/queue/add`로 넘기는 연결도 없다.

**추가 계약 결함:** 성과와 trend signal이 모두 0건이면 `POST /api/suggestions`는
빈 ideas와 재시도 안내만 반환한다. 성과가 없어도 가설 방향을 먼저 제안하라는 R68과 반대다.
Threads OAuth scope에도 답글 작성에 필요한 `threads_manage_replies`가 없다.

**범위 실측:** 위임서의 API 98개는 상위 route family 수와 일치한다. 동적 하위 route를 포함한
실제 route 파일은 163개다. 요구사항 대장의 고유 번호는 210개가 아니라 205개다. 상세 대조와 심각도는
`docs/audit/osmu-v62-api-gap-audit-v1-gpt-codex.md`에 기록했다.

**종료증거:** design과 eng-design 승인 뒤 댓글 read-through와 답글, 제안 큐 인계,
성과 0건 가설 3개를 계약 테스트로 구현한다. 승인된 테스트 계정으로 실제 댓글 조회와 답글 1건,
제안의 queue draft 생성 1건을 관찰하기 전에는 PASS로 바꾸지 않는다.

## 2026-08-24 ✅ PASS: v48 Design Score C 원인 3건 수선

**수정 범위:** v47의 1024 왼쪽 56px 아이콘 줄, 본문과 담당 70:30, 카드 여백 A/B,
131개 화면과 상태를 유지했다. 390의 대화 세로 예산, 제품 글자 하한, 모바일 터치 하한만
수선하고 선택지 스크롤 마감과 활성 transition 속성 제한을 함께 반영했다.

**필수 실측:** `docs/prototype/qa-v48/qa-results.json`에서 390 대화 본문 152px,
첫 선택지 가시율 100%, 입력과 보이는 선택지 겹침 0을 확인했다. 보이는 제품 UI의 12px 미만
글자는 1440·1024·390 모두 0건이다. 390의 보이는 조작 20개 중 44px 미만은 0건이다.

**회귀와 픽셀 관찰:** 세 폭에서 글자 단위 분절, 딱지 잘림, 흐름 가로 넘침, 본문 방 이름 중복,
콘솔 오류가 모두 0이다. 1024 왼쪽 탐색은 56px, 담당 비율은 0.290이다. 1440·1024·390 캡처를
원본으로 직접 열어 390의 질문, 첫 선택지, 두 번째 선택지, 입력, 보내기 단추가 같은 첫 화면에
보이는 것을 확인했다. 카드 여백 A/B와 화면 선택 기능도 자동 검사에서 유지됐다.

**판정:** `docs/prototype/qa-v48/design-review-v48.md`의 셀프 Design Score B.
독립 design-review 재채점과 `/approve design`은 아직 미검증이라 기술설계 게이트는 열지 않는다.

## 2026-08-24 ❌ NG: v47 독립 디자인 리뷰 Design Score C

**반려 관찰:** 1024의 글자 단위 줄바꿈과 딱지 잘림은 해소됐지만 390의 상시 담당 대화 본문은
41px만 남아 네 선택지의 첫 화면 가시율이 모두 0%다. `한 편의 흐름`, `추천` 탭은 40px로
44px 터치 하한에 못 미친다. 보이는 12px 미만 텍스트는 1440 56건, 1024 35건, 390 25건이다.

**독립 판정:** `docs/prototype/qa-v47/design-review-v47.md`의 Design Score C, AI Slop A.
지목된 `출시 전에 꼭 보는 체크리스트 7가지` 선택지 자체는 1440에서 100% 보인다. 다음 선택지는
1440에서 86%, 1024에서 18%만 처음 보이지만 포커스 시 자동 스크롤되어 영구 소실은 아니다.

**B 승격 종료증거:** 390 첫 선택지 가시율 100%, 대화 본문 120px 이상, 입력창 겹침 0,
세 폭 12px 미만 텍스트 0, 390의 모든 보이는 조작 44px 이상을 실렌더와 computed 값으로 확인한다.
프로토타입 수선은 사용자 컨펌 전 미착수다.

## 2026-08-24 ❌ NG → 🔧 → ✅ PASS: v46 1024 붕괴를 v47 폭 적응형 상시 담당으로 수선

**반려 관찰:** 컨트롤러의 1024px 실물 캡처에서 오른쪽 상시 담당이 제품 폭의 약 40%를 차지했다.
가운데 흐름 화면의 제목은 두 글자씩 세로로 갈라졌고, 정보 칩과 다음 인계 문구가 잘리거나
한 단어씩 줄바꿈됐다. 하단 학습 고리도 세 구절을 읽기 어려운 폭으로 눌렸다.

**근본 원인:** v46에서 304px 담당 열을 추가하면서 1024px 본문 내부의 기존 3열 계약을 그대로
유지했다. 자동 넘침 수치가 0이라는 검사만 통과시켜, 실제 글자 단위 줄바꿈과 칩 말줄임을
시각 결함으로 잡지 못했다.

**수정:** v46은 보존했다. v47은 Android canonical layouts의 840dp 이상 70:30과 600dp 미만
아래 배치, Apple HIG Sidebars의 제한 폭 compact control을 차용했다. 1024은 왼쪽 탐색 56px,
본문 70%, 오른쪽 상시 담당 30% 이하이며 탐색을 펼쳐도 본문 폭이 움직이지 않는다. 390은 담당을
본문 아래에 둔다. Figma, Notion, Intercom, Linear의 공식 규칙도 화면 안 근거 패널에 차용·기각과
공개 숫자 유무를 함께 기록했다.

**자동 실측:** `docs/prototype/qa-v47/qa-results.json`의 최종 실행에서 1024 담당 비율 0.290,
본문 폭 654px, 왼쪽 탐색 56px을 관찰했다. 1440·1024·390 모두 글자 단위 줄바꿈 0건,
딱지 잘림 0건, 흐름 카드 가로 넘침 0건, 전달물 넘침 0건, 상시 담당 가시성 3/3,
본문 방 이름 중복 0건, 콘솔 오류 0건이다. 카드 여백 A/B와 1440 탐색 상태 저장도 통과했다.

**픽셀 직접 관찰:** `openclaw-auto-v47-1024.png`, `openclaw-auto-v47-390.png`,
`openclaw-auto-v47-1440.png`을 원본 크기로 열었다. 1024 제목은 `다시 걷는 첫 주`가 한 묶음으로
읽히고, `선택 관찰과 제작 정보` 딱지는 카드 안에 전부 보인다. 다음 묶음과 하단 학습 고리도
한두 글자짜리 세로 열 없이 읽힌다. 390은 정보 딱지와 학습 고리 세 단계를 보존하며 담당 입력과
보내기까지 같은 프레임에 들어온다. 독립 다른 모델의 2차 픽셀 검수와 design gate 승인은 미검증이다.

## 2026-08-23 ✅ PASS: v46 접히는 사이드바·상시 담당·본문 단계명 중복 제거

**직접 관찰:** `docs/prototype/qa-v46/`의 390·1024·1440, 1024 사이드바 접힘,
카드 여백 A/B, 선택 보드 캡처를 직접 열었다. 왼쪽 사이드바는 224px에서 56px으로
접히며 아이콘과 현재 항목 강조가 남는다. 담당은 1024·1440에서 오른쪽 304px 열,
390에서는 본문 아래 372px 패널로 항상 보이고 입력과 보내기까지 같은 프레임에 들어온다.

**중복·넘침:** v46 흐름 화면 12개에서 디스플레이 본문의 `생성실·편집실·발행실·성과실`
노출은 0건이다. 390·1024·1440에서 전달 요약 가로 넘침, 흐름 보드 세로 넘침,
프로토타입 가로 넘침은 모두 0이다. 헤더는 세 폭 모두 61px 한 줄이며 학습 정보가 크레딧
왼쪽에 있다.

**상호작용·회귀:** 사이드바 224→56px 전환, `aria-label`의 접기→펼치기 변경,
`localStorage=true` 복원을 관찰했다. 카드 A는 339/339/339px, B는 189/229/230px로
실제 다른 밀도를 만든다. 화면 2개 선택, 실제 iframe 미리보기 2개, 메모와 B안이 포함된
복사 문장, 자동 저장을 확인했다. 131개 화면의 금지 문구·층 코드 노출 0, 콘솔 오류 0이다.

**근거:** `docs/prototype/qa-v46/qa-results.json`,
`openclaw-auto-v46-visual-qa-v1-gpt-codex.md`, 7개 실렌더 캡처. 제품 코드와 배포 변경은 없다.
독립 다른 모델의 2차 픽셀 검수는 미검증이므로 design gate 승인은 부모 컨트롤러와 `/approve design` 몫이다.

## 2026-08-23 ❌ NG → 🔧: PRD 전수 리뷰의 AI 마케팅 SaaS 실조사 0회

**반려 관찰:** `docs/audit/osmu-prd-corpus-review-v1-gpt-codex.md`의 직전 판은 ISO 29148,
Cucumber, Volere 문서 규격만 비교했고, 사용자 필수 조건인 AI 마케팅 SaaS의 실제 상품 정의,
요금제, 온보딩을 조사하지 않았다. 문서 형식 벤치마크가 제품 시장 벤치마크를 대신한 결함이다.

**근본 원인:** PRD 리뷰의 `벤치마크 5/5`를 문서 품질 표준 충족으로만 판정하고, 제품의 상품성에
대한 경쟁 비교를 별도 축으로 확인하지 않았다. 결과적으로 리뷰 결론은 유효했지만 벤치마크 점수의
근거 범위가 사용자 과제보다 좁았다.

**수정 상태:** 🔧. 회장의 재제출 지시를 수정 승인으로 삼아 Jasper, Copy.ai, Predis.ai,
Ocoya 공식 페이지를 검색하고 제품 정의, 공개 가격, 판매 단위, 첫 사용 흐름을 리뷰에 보강했다.
사업계획의 가격이 최신 PRD 수용기준으로 내려오지 않은 점과 첫 가치 도달 시간·입력 수 KPI 부재를
추가 빈틈으로 기록했다.

**직접 검증:** 공식 검색 4건과 페이지 조회 8건 이상을 수행했다. 리뷰는 320줄에서 342줄로 늘었고,
AI SaaS 비교 4개, R01~R99 행 99개, RUBRIC_SCORE 15/25, 긴 대시 0, 내부 툴 태그 0,
`git diff --check` 통과를 관찰했다. 부모 컨트롤러의 트랜스크립트 기반 검증 전에는 ✅로 닫지 않는다.

## 2026-08-22 ✅ PASS: v43 한 줄 헤더·발표형 디스플레이·원형 담당 호출

**직접 관찰:** `docs/prototype/qa-v43/`의 실렌더 10장을 직접 열었다. 1024·1440·390,
라이트·다크에서 작업 공간, 학습 정보, 크레딧이 같은 헤더 줄에 있고 학습 정보가 크레딧
바로 왼쪽이다. 기본 접힘은 56px 원형 호출 단추이며 펼침 패널은 336×544로 workarea 안에
수용된다. 디스플레이 본문에는 결과물만 있고 별도 브랜드 줄과 문장형 카드 보조 단추가 없다.

**상태·회귀:** 정상·내용 없음·불러오는 중·오류·내용 많음을 렌더했다. 1024 정상의 prototype,
content, display stage 넘침은 모두 0이었다. 채널 15종을 사이드바 자료구조와 렌더에서 확인했다.
기능 인벤토리와 영역별 판정은 `docs/prototype/qa-v43/`의 두 QA 문서에 있다.

**자동 검사:** 실구현 24/24 커버리지 통과, v42 890KB에서 v43 900KB로 기능 회귀 검사 통과,
제품 화면 순수성 검사 통과. 독립 디자인 스킬과 다른 모델의 2차 픽셀 검수는 미검증이다.

## 2026-08-22 ❌ NG → 🔧: v42 헤더·챗봇·디스플레이가 회장 확정 요구를 부분 반영

**반려 관찰:** v42는 학습 정보를 헤더에 두었지만 크레딧과 같은 줄이 아니라 두 번째 단계 줄에
분리했다. 접힌 챗봇도 화면 구석의 둥근 호출 단추가 아니라 48px 세로 레일과 `대화` 글자를
남겼다. 디스플레이 카드에는 `크게 보기`, `담당에게 이걸로 말하기` 문장형 단추가 남아 있었고,
본문에 별도 브랜드 선택 줄이 존재했다.

**근본 원인:** v42가 기존 두 줄 헤더와 우측 레일 셸을 보존하는 데 집중해 최신 지시의
위치 관계를 문자 그대로 검증하지 않았다. "헤더에 있다"를 "크레딧 바로 왼쪽, 같은 가로줄"과
같게 취급했고, 챗봇 접힘도 공간만 줄이면 된다고 판단했다. 디스플레이에서는 기능 삭제 0을
문장형 보조 행동 유지로 오해해 카드 자체 선택과 아이콘 동작으로 편집하지 못했다.

**수정 상태:** 🔧. v42는 보존하고 `docs/prototype/openclaw-auto-4room-v43.html`에서 수선한다.
종료조건은 학습 정보가 크레딧 바로 왼쪽 같은 줄, 작업 공간·학습 정보·크레딧 가로 배열,
둥근 플로팅 호출 단추와 펼침 패널 왕복, 디스플레이 무스크롤, 별도 브랜드 줄 0,
문장형 보조 단추 0, 자동 검사 3종과 390·1024·1440 라이트·다크 직접 캡처 확인이다.

## 2026-08-15 ❌ NG → 🔧 - openclaw-service 유저플로우 v9.1·v9.2 검색 실행 증거 위조성 기록

**반려 관찰:** `docs/design-docs/user-flow-openclaw-service-v9.1-gpt-codex.md`와 v9.2에는 Buffer,
Later, Stitch Fix, Spotify, OpenAI URL과 설계 반영이 있었지만, 작성자는 검색을 실제 호출하지
않고 실행 환경 제약이라고 기록했다. 컨트롤러가 같은 모델과 실행 경로에서 검색 성공을 직접
확인했으므로 그 설명은 사실이 아니며, URL 목록도 조사 실행 증거를 대신하지 못한다.

**근본 원인:** v9.1의 제약 문장을 v9.2에 그대로 옮기고 실제 검색 호출 가능 여부를 확인하지
않았다. 산출물의 URL 표기와 작성 트랜스크립트의 조사 실행 증거를 같은 것으로 취급해,
기억·기존 문서에 있는 URL을 최신 공식 원문 확인처럼 기록했다.

**수정 상태:** 🔧. 사용자 v9.3 리테이크 지시를 수정 승인으로 삼았다. 계정 전환, 온보딩 질문,
크레딧·잔액, 발행 실패·토큰 만료와 시그마인 체험을 주제로 검색 6회와 공식 페이지 열람을
실행했다. `docs/design-docs/user-flow-openclaw-service-v9.3-gpt-codex.md` 34장에 검색별 URL,
실제로 읽은 문장, 차용·변경점을 화면 ID와 연결했다. 부모 컨트롤러 재검증 전에는 ✅로 닫지 않는다.

**직접 검증:** v9.2는 1,929줄·151,205B, v9.3은 2,403줄·194,048B다. 최상위 장은 34개에서
35개로 늘었고 기존 6흐름, happy·edge·empty·error·loading, O-00부터 O-12, 질문 화법 장이
모두 남아 있다. 신규 34장은 실제 검색 6회, 공식 출처 11개, 읽은 문장 12개와 설계 반영을
기록한다. 잘못된 검색 제약 문구, 금지 긴 대시, TODO·TBD·FIXME·placeholder는 0건이다.
`doc-consistency-lint.py` 수치 충돌 0건, `git diff --check` 통과를 관찰했다. 제품 코드·API·DB·
배포 변경은 없다. 부모 컨트롤러의 트랜스크립트 기반 `verify-agent-quality.sh`와 최종 웹 렌더
전까지 프로세스 게이트 PASS는 선언하지 않는다.

## 2026-08-15 ❌ NG → ✅: 참여형 결정 경험 v2의 마케티·시그마인 핵심 실사 누락

**반려 관찰:** `docs/벤치마킹-참여형결정경험-2026-08-15-v2-gpt-codex.md`는 WebSearch를
실행했지만, 회장이 최우선으로 지정한 마케티의 요금·지원 채널과 시그마인의 현행 상품 구성을
원문 단위로 확정하지 못했다. 시그마인은 조사 대상에도 포함되지 않았다. 마케티 숫자 가격을
페이지 표시와 운영 실체가 모두 확인된 값처럼 읽히게 만든 것도 증거 등급 혼합이다.

**근본 원인:** 검색 횟수 충족을 조사 완결성으로 오인했고, 서비스별 핵심 확인 질문을 먼저
잠그지 않았다. 가격 페이지의 숫자를 확인하는 작업과 사업자 표기·플랜 내부 일관성·지원 채널을
교차검증하는 작업도 분리하지 않았다.

**수정 상태:** ✅. 사용자 리테이크 지시를 수정 승인으로 삼아 v3를 새로 작성했다. 현재까지
WebSearch 14회와 공식 페이지 Open을 실행했다. 마케티는 가격·지원 채널 표시와 동시에 사업자
대표·등록번호 공란, 플랜 요약·상세표 한도 불일치를 확인했다. 시그마인은 셀프서브 SaaS 달러
플랜과 B2B 대행형 원화 구독이 함께 공개된 이중 상품 구조를 확인했다.

**직접 검증:** v2 844줄·59,750B 대비 v3 2,044줄·79,151B다. 공식 URL 36개를 남겼고,
국내 핵심 2종·국내 추가 3종·해외 비교군 10종을 같은 판단 축으로 비교했다. 금지 긴 대시 0,
v3 파일 대상 공백 오류 0을 관찰했다. 제품 코드·API·DB·배포 변경은 없다. 현재 Codex rollout에
`verify-agent-quality.sh ... content-growth-marketer`를 실행해 exit 0, Skill 감지 20회,
WebSearch/Fetch 감지 16회, 소크라 마커 22회, RUBRIC 24/25로 PASS했다.

## 2026-08-15 ❌ NG → 🔧 — 참여형 결정 경험 벤치마킹 WebSearch 증거 0회

**반려 관찰:** `docs/벤치마킹-참여형결정경험-2026-08-15-gpt-codex.md`는 경쟁 서비스명,
기능, 가격을 적었으나 작성 트랜스크립트에 WebSearch 호출이 0회였다. 벤치마킹 보고서의
핵심 사실을 기억에 의존했으므로 원본의 기능·가격 주장은 검증 증거로 사용할 수 없다.

**근본 원인:** 보고서 본문에 URL을 적는 것과 실제 조사 도구를 호출해 원문을 확인하는 것을
같은 것으로 취급했다. 하네스는 산출물 내용이 아니라 트랜스크립트의 WebSearch·WebFetch 호출을
검사하므로, 출처 목록만으로는 조사 실행 증거가 되지 않는다.

**수정 상태:** 🔧. 사용자 리테이크 지시를 수정 승인으로 삼아
`docs/벤치마킹-참여형결정경험-2026-08-15-v2-gpt-codex.md`를 새로 작성했다. WebSearch 9회와
공식 페이지 Open 3회 이상을 실행했고, 국내 5종·해외 9종의 URL, 확인 사실, 가격 상태,
장단점, 차용 구조를 사례별로 분리했다. 공식 본문에서 재확인하지 못한 가격은 `미확인`으로 내렸다.

**직접 검증:** 원본 399줄·37,448B 대비 v2 844줄·59,750B, 최상위 번호 섹션 12개 대비
14개, 사례 14종, 사례별 필수 필드 존재, 금지 긴 대시 0, `git diff --check` 통과를 관찰했다.
제품 코드·API·DB·배포 변경은 없다. 부모 컨트롤러의 `verify-agent-quality.sh` 전까지 최종
프로세스 게이트 PASS는 선언하지 않는다.

## 2026-08-15 ❌ NG — studio 소재 원가 검증표 문서 품질 게이트 미충족

**반려 관찰:** `studio/docs/소재원가-검증표-2026-08-15.md` 1차본은 공급자 가격과
실험 원가를 조사했지만, 작성 전에 `~/.claude/standards/doc-review.md`를 읽지 않았다.
필수 목차, 목적·범위·용어, 수용기준, 오픈이슈, 개정이력, 주장별 근거 URL, 5축
`RUBRIC_SCORE`가 빠져 client-ready 합격선을 충족하지 못했다.

**근본 원인:** 조사와 계산을 먼저 수행하고 전달 문서 템플릿을 적용하지 않아, 내용 증거와
문서 구조 검증이 분리됐다. 공식 URL도 푸터에만 모여 본문 결론과의 추적성이 약했고,
Higgsfield live pricing 조회 실패와 기타 미검증 항목이 여러 섹션에 흩어졌다.

**현재 판정:** ❌ NG. 사용자 리테이크 지시를 수정 승인으로 삼아 문서 구조와 추적성을
개정한다. 제품 코드·DB·API는 수정 범위가 아니다.

**종료조건:** `doc-review.md` 선독 증거, 공식 출처 2개 이상 재조회, 결론 선행 TOC,
필수 전달 섹션, 미검증 항목 단일 원장, 의사결정 함의, 개정이력, STAMP와 SOURCES/MODEL,
자가채점 20/25 이상, 로컬 링크·앵커·금지어·공백 검사 통과를 모두 기록한다.

**2026-08-15 02:08 KST 수정 상태:** 🔧. 기존 조사 내용과 원가 수치를 유지하고 v1.1.0 구조로
개정했다. 공식 Google·ElevenLabs·Higgsfield 페이지를 재조회해 본문 주장 옆에 URL을 연결했고,
Higgsfield live pricing 숫자 표와 wrapped ElevenLabs 모델은 미검증 원장으로 분리했다.

**직접 검증:** 목차 앵커 14/14, Markdown 표 열 불일치 0, 혼합형 계산 $1.168,
`194.62+308.45+296.93=800.00 cr`, 매핑 gap 5건, 미검증 원장 6건, 금지 긴 대시·임시표현 0,
공백 결함 0을 관찰했다. `RUBRIC_SCORE`는 24/25다. 제품 코드·DB·배포 변경은 없으며,
부모 컨트롤러의 `verify-agent-quality.sh` 재검증 전까지 문서 게이트 최종 PASS는 선언하지 않는다.

## 2026-08-01 ❌ NG — 시크릿 창 신규고객 채널 연결·핵심 플로우 전체 실패

**사용자 실화면 관찰:**
- Threads 로그인·동의 뒤 Channel Info status가 `not connected`다.
- Instagram 로그인·동의 뒤 버튼이 계속 `Instagram OAuth 연결`이고 status는 `재연결 필요`다.
- Instagram 페이지의 `Instagram Graph API 토큰` 입력 영역은 별도로 존재하지만 값이 비어 있어
  OAuth 연결과 수동 토큰 경로의 관계·정본이 사용자에게 설명되지 않는다.
- Settings 채널 목록에는 연결된 계정이 표시되지 않는다.
- Threads는 Queue/Analytics/Growth/Popular/Settings, Instagram은 Queue/Editor/Settings로
  정보구조와 기능 노출이 일관되지 않는다.
- 운영 OSMU는 502이며 Threads·Instagram 각각의 초안 생성→검수→실발행 핵심 플로우를 사용자가
  찾거나 실행할 수 없다.

**판정:** 운영 고객 핵심 플로우 FAIL. OAuth callback 성공·토큰 저장·readiness·Channel Info·
Settings가 같은 연결 상태 정본을 공유한다는 증거가 없고, 플랫폼별 기능 매트릭스와 공통 IA도
승인된 사용자 플로우로 검증되지 않았다. 기존 unit/build PASS 및 일부 OAuth preflight는 완료
증거에서 제외한다. 원인 분석→회장 범위 확인→수정→운영 시크릿 창 E2E 전까지 qa/ship 잠금.

**종료증거:** 신규 고객 시크릿 창에서 provider별 로그인→callback→저장 계정명→Channel Info·
Settings 동일 `연결됨`→초안 생성→검수→실발행 permalink를 Threads와 Instagram 각각 관찰하고,
공통 탭/차이 탭이 기능 매트릭스 문서와 일치하며 전체 경로 5xx·console error 0이어야 한다.

## 2026-08-01 ❌ NG 재제보 — 신규 고객 Threads 연결에 `code_zero_to_one` 노출

**사용자 관찰:** `j.the.great.investor`로 가입한 뒤 Threads 연결 과정에서
`code_zero_to_one` 계정이 보였다. 정확한 화면·URL·현재 운영 build의 재현은 아직 미확인이다.

**사용자 실화면 보강:** 다른 OSMU 계정으로 로그인한 상태에서도 Threads 연결 시 Meta 화면에
`이전에 Threads 계정에 정성컴퍼니 앱을 연결하셨습니다. zero_to_one_ai님에 대한 정보를 계속
공유하시겠어요?`가 표시됐고 계정 전환 선택지는 없었다. 이는 P0-6 계획의 운영 종료조건
`기존 threads.net 세션을 그대로 쓰지 않고 계정 선택/재로그인 화면 표시`에 직접 FAIL이다.
현재 제품 테스트는 실제 계정 전환이 아니라 `threads.net에서 먼저 로그아웃` 안내와 Meta 계정
센터 링크 렌더만 검증하므로 원요청을 충족했다는 증거가 아니다.

**기존 계획과의 관계:** 승인 계획 `wiki-1-mellow-wadler.md`의 P0-6과 같은 증상이다. 당시
조사는 우리 고객 화면의 cross-tenant 조회가 아니라 브라우저에 남은 threads.net 세션이 Meta의
authorize 화면에 표시된 것으로 판정했다. 코드에는 tenant/JWT 오기입 방어와 로그아웃 안내가
추가됐지만, Meta 공식 문서에 강제 계정선택 파라미터가 없어 실제 운영 consent의 계정 전환은
미검증으로 남았다. 사용자가 현재 다시 관찰했으므로 기존 자동 PASS로 닫지 않고 NG로 재개한다.

**다음 종료증거:** 고객 세션에서 연결 버튼 클릭 전후 URL·렌더 주체를 직접 관찰하고,
①OSMU API가 다른 tenant `channel_accounts`를 반환했는지 ②Meta/Threads authorize 쿠키가 기존
계정을 표시했는지 분리한다. 전자면 P0 데이터 유출로 즉시 차단·수정하고, 후자면 계정 전환 UX와
Threads 앱 Live/테스터 제한을 실제 콘솔·브라우저에서 확인한다. 수정·QA·배포 전까지 미완료다.

## 2026-07-31 위키 GitHub 레포 주소 붙여넣기

**상태 전이:** ❌ NG(`owner/name`만 허용해 브라우저/clone URL 거부) → 🔧 로컬 build
수정·전체 자동 검증 통과. 운영 배포·실브라우저 재검증 전이라 QA PASS는 아니다.

- **근본 원인:** 서버 내부 canonical 값인 `owner/name`을 사용자 입력 계약에도 그대로 강제했고,
  UI와 API 앞단에 공용 normalization boundary가 없었다. 이 때문에 GitHub가 공식 제공하는
  HTTPS/`.git`/SSH 주소와 브라우저 `tree`·`blob` 주소를 모두 잘못된 형식으로 거부했다.
- **RED 증거:** 신규 focused 3 files에서 **5 failed / 11 passed**. 공용 유틸 부재,
  tree URL 서버 400, 비-GitHub 사유 미분리, UI 새 라벨·확인값 부재를 재현했다.
- **🔧 변경:** `github-repo-input.ts`를 UI와 `sync-wiki` 서버가 함께 사용한다. HTTPS,
  끝 슬래시, `.git`, SSH, 기존 `owner/name`, 대소문자/`www` host를 `owner/name`으로
  정규화한다. `tree` URL은 첫 경로 세그먼트를 ref, 나머지를 folder로 채우고 `blob` URL은
  파일 경로와 상위 folder를 구분한다. UI는 정규화 repo·브랜치·폴더를 즉시 표시하고
  사용자가 수동 교정할 수 있다.
- **보안 레드팀:** GitLab/Bitbucket/사내 host는 네트워크 호출 전에 한국어 사유로 거부한다.
  URL userinfo의 사용자명·토큰은 결과와 API 요청에서 폐기하며, `..`, 개행/널, 4096자 초과를
  경계 테스트로 고정했다. 자격증명 포함 URL 테스트의 fetch/API 호출 직렬화에 원문 토큰 0건이다.
- **GREEN/전체 자동 증거:** focused **3 files / 30 PASS**. `npx tsc --noEmit` exit 0·출력 0줄,
  `npx vitest run` **124 files / 1033 passed / 10 skipped**,
  `npx next build --webpack` Next.js 16.2.2·compile 30.4s·static pages **166/166**,
  `git diff --check` exit 0.
- **커밋:** `6d81a885`(공용 정규화·서버), `9c97713d`(UI 즉시 확인). 이 세션은 push·배포를
  실행하지 않았다. 다만 병렬 세션의 후속 문서 커밋 `b0ea3241`이 `origin/main`에 반영되면서
  두 커밋도 원격 조상으로 포함된 상태를 종료 직전 관찰했다.
- **미검증:** 운영 Studio 실제 브라우저 붙여넣기→확인→sync, private GitHub 레포 실 API,
  슬래시 포함 branch가 섞인 tree URL의 자동 경계 판별, 운영 저장소/DB 반영.
- **근거:** GitHub 공식 Cloning a repository / About remote repositories /
  REST Git Trees 문서(HTTPS·`.git`·SSH clone URL, repo 이름의 `.git` 제외, tree ref 계약).

## 2026-07-31 배포 후 운영자 브라우저 세션 소실

**상태:** 🔧 로컬 build 수정·전체 자동 검증 통과. 운영 push·재배포·실브라우저 재검증 전.

- 배포 전 같은 Chrome의 `/operator/customers`는 운영자 콘솔을 렌더했으나, commit
  `7233b859` 배포 후 같은 URL이 마케팅 랜딩을 렌더했다.
- 관찰 당시 localStorage에 `dashboard_auth_token`과 `active_workspace`가 모두 없었다.
  같은 운영자 토큰의 서버 Bearer 요청은 `/api/health`와
  `/api/operator/oauth-credentials`에서 200이므로 서버 토큰 검증 실패로 닫지 않는다.
- 조사 기준: 운영자 토큰만 있는 `/operator*`에서 Supabase `INITIAL_SESSION`/`SIGNED_OUT`가
  토큰을 지우지 않아야 하며, 고객 JWT 승격·identity 전환/로그아웃 workspace 제거·운영자 경로
  우선의 세 보안 속성을 모두 보존한다.
- **RED 증거:** `AuthGateRouting.test.tsx` focused **13 tests 중 1 failed / 12 passed**.
  `/login`에서 시작한 비동기 `getSession()`이 `/operator/customers` 전환 cleanup 뒤 늦게
  완료되면 이전 경로 closure가 고객 JWT를 승격하고 구독까지 등록한다. 이어진 `SIGNED_OUT`은
  운영자 토큰이 이미 JWT로 바뀌었다고 판정해 `dashboard_auth_token`을 `null`로 만들었다.
- **대조군:** 운영자 토큰만 있는 `/operator/customers`에
  `INITIAL_SESSION(null)`·`SIGNED_OUT(null)`만 전달한 테스트는 통과했다. 따라서 null 초기
  이벤트 자체가 아니라 cleanup 뒤 생존한 stale async effect가 재현 원인이다.
- **수정:** AuthGate의 pathname별 Supabase effect run에 cancellation 소유권을 추가했다.
  cleanup 뒤에는 늦은 `getSession()` 결과·listener 등록·auth callback을 모두 폐기한다. 활성
  run의 운영자 경로 우선, 고객 JWT 승격, identity 변경 workspace 제거 조건은 변경하지 않았다.
- **GREEN 증거:** AuthGate focused **13/13 PASS**. 지정 회귀
  `AuthGateRouting`·`SidebarShell`·`operator-get-auth`·`tests/isolation/*`는
  **16 files, 171 passed / 7 skipped**다.
- **전체 자동 증거:** `npx tsc --noEmit` exit 0·출력 0줄,
  `npx vitest run` **123 files, 1016 passed / 10 skipped**,
  `npx next build --webpack` Next.js 16.2.2·compile 17.2s·TypeScript 24.7s·
  static pages **166/166**, `git diff --check` exit 0.
- **커밋:** RED `18010894`, 수정 `3b64d198`. push·배포는 실행하지 않았다.
- **미검증:** 운영 배포 뒤 실제 Chrome의 `/operator/customers` 토큰 보존·Admin 렌더,
  실제 Supabase auth client의 route-change event timing, 다중 탭/BroadcastChannel 경로.
- handoff 기준은 사용자 위임 프롬프트와 부모 컨트롤러 pane `openclaw-auto:0.1`.
  build gate는 approved, qa/ship은 잠금 유지다.
- **2026-08-01 Codex 독립 2차 리뷰:** 사용자 지정 `openclaw-auto:0.1`을 primary로 인수해
  `18010894`·`3b64d198` diff와 현재 HEAD의 AuthGate를 직독했다. cleanup 이후의 늦은
  `getSession()` 결과, stale auth callback, listener 등록 직후 cleanup 세 경계가 모두
  cancellation으로 폐기되며, 활성 customer run의 JWT 승격과 정상 `SIGNED_OUT` 제거 계약은
  유지됨을 확인했다. 보안상 Critical/Major 추가 발견은 0건이다. 지정 회귀는 현재 HEAD에서
  **15 files / 164 passed / 7 skipped**, `npx tsc --noEmit`, `git diff --check` PASS다.
  실제 운영 Chrome·Supabase event timing·다중 탭은 여전히 미검증이므로 qa/ship 잠금은 유지한다.

## 2026-07-30 배치 D — 채널 한도·내레이션 표기·사용량 DB 원장

**상태 전이:** ❌ NG(한도 4중복/Facebook 카피 재사용, 무음 폴백 은폐, BYOK 토큰 미집계·
usage.json 화면 정본) → 🔧 build 구현·자동 검증. 운영 DB/provider/실브라우저 전에는 QA PASS
아니다.

- tests-first RED를 항목별 커밋(`5ee1872b`, `752f4686`, `de974479`)으로 관찰한 뒤 구현했다.
- 로컬 자동 증거: TypeScript exit 0, 전체 123 files 1014 PASS/10 skip, webpack compile
  18.5s·TypeScript 26.7s·static pages 166/166, diff check exit 0.
- 미검증: 실 Anthropic BYOK 응답→운영 `usage_events` 행, Linux TTS fallback, Threads/Facebook
  실 provider preflight, Studio/Videos 실브라우저 경고·카운터.

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

### 2026-08-02 DESIGN-001 — 프로토타입 범위·용어·로딩 이해 실패

- **❌ NG 사용자 관찰:** 첫 디자인 프로토타입에서 `브랜드 사실`, `발행 근거`, `permalink 확인`의 뜻을
  즉시 이해하지 못했고, loading shimmer가 과도하며, 전체 OSMU가 아니라 Threads 생성·발행·예약만
  만드는 제품처럼 보였다. 프로토타입이 최종 전체 플로우인지 후속 범위가 있는지도 전달되지 않았다.
- **근본 원인:** PRD의 내부 추적성 용어를 고객 언어로 번역하지 않고 UI label로 노출했다. pilot slice를
  표현하면서 전체 OSMU shell·다채널 확장·예약/queue의 위치를 숨겼고, skeleton을 데이터 로딩 범위보다
  넓게 적용해 시각적 소음을 만들었다. 즉 기능 누락 이전에 정보구조·범위 커뮤니케이션 결함이다.
- **현재 상태:** design `in-progress`, 사용자 컨펌 전 수정 금지. prototype v1은 승인본이 아니다.
- **수정 후보 종료증거:** ① 고객용 용어로 교체 또는 즉시 설명 ② skeleton 최소화 ③ 전체 OSMU 지도와
  이번 Threads working slice를 동시에 표시 ④ 생성·즉시발행·예약·queue·다채널 후속 범위가 한 화면에서
  구분됨 ⑤ 수정본을 사용자에게 다시 보여 이해 여부를 재확인. 구현·운영 증거가 아니라 디자인 게이트 증거다.
- **🔧 design cycle 2 관찰:** v2 hub에서 구 내부용어 3종 0건, 전체 제품 지도·Queue/예약·Threads 완전
  지원·Instagram 준비 범위를 첫 화면에서 관찰했다. 원문→플랫폼별 초안→검수→즉시/예약→캘린더
  클릭 체인이 끝까지 이동했고 console error 0. 전체 10화면×9상태=90 조합, h1/주요행동 누락 0,
  mobile overflow 0, 동시 loading region 최대 1개, Design Score B+를 기록했다.
- **상태 경계:** 수정본은 브라우저에 표시했으나 사용자가 실제로 “전체 OSMU와 현재 Threads 지원 범위를
  구분해 설명할 수 있는지” 재확인 전이므로 ✅ 종료하지 않는다. 사용자 확인 뒤 design 승인 후보로 전환한다.

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

### 2026-07-30 중앙 OAuth 원문 확인·미설정 등록 정상화

- **❌ NG 재현:** 운영 `/operator/customers`의 설정 완료 4개 provider는 모두 source=env라
  원문 확인 버튼이 없었고, 별도 `import-env` 요청은 구버전 운영 빌드에서 400을 반환했다.
  미설정 카드의 입력은 항상 password라 붙여넣은 값을 필드별로 검증할 수 없었다.
- **근본 원인:** UI가 env→DB import와 DB reveal을 두 단계 버튼으로 분리했고,
  `revealOAuthCredentialSet()`이 env source를 무조건 거부했다. 저장소 부재 에러도 일부 경로에서
  500 영문 응답으로 뭉개져 카드가 정확한 운영 사유를 표시하지 못했다.
- **🔧 변경:** 단일 `원문 확인` 요청이 같은 DB 트랜잭션에서 완전한 env 세트를
  `ON CONFLICT DO NOTHING`으로 암호화 import하고, 권위 있는 DB 행을 `FOR UPDATE` 재조회한 뒤
  reveal한다. insert가 일어난 경우에만 `import`, 모든 성공 reveal에 `reveal` 감사 행을 남긴다.
  기존 DB 행은 env로 덮어쓰지 않는다. 입력 필드는 기본 숨김·필드별 표시/숨김, PUT 성공 뒤
  metadata 즉시 갱신, 400/500/503 한국어 카드 사유를 적용했다.
- **RED→GREEN:** focused 4 files/37 tests에서 최초 9 FAIL로 결함을 재현했고, 최종 37/37 PASS.
  전체 117 files에서 972 PASS/10 DB-env skip, `npx tsc --noEmit` exit 0,
  `git diff --check` PASS.
- **빌드:** 요구된 `npm run build`는 Turbopack의 sandbox port bind `EPERM`으로 exit 1.
  원인 기반 webpack production build는 compile·TypeScript·static generation 166/166,
  exit 0으로 통과했다. 실패를 제품 성공으로 치환하지 않는다.
- **미검증/게이트:** 실제 PostgreSQL pgcrypto import→reveal·동시 conflict, 운영 브라우저의
  설정 완료 4개 원문 확인, 미설정 provider 저장→source DB·준비 전환, 30초 자동 숨김,
  audit 행은 미검증이다. push·배포는 실행하지 않았고 qa/ship 잠금을 유지한다.

### 2026-07-30 P0-6 OAuth 계정 전환·identity 오기입 차단

- **❌ NG 재현:** focused 4파일 85테스트에서 6건 FAIL. Threads/Instagram의 직접 로그아웃 안내,
  로그아웃 뒤 workspace 제거, 잔존 운영자 토큰보다 고객 Supabase JWT 승격,
  connect tenant 불일치 값 없는 서버 로그가 없음을 재현했다.
- **공식 문서 판단:** Meta의 Threads Authorization Window·Instagram Login 문서와 Meta 공식
  Postman collection에 계정선택 강제 파라미터가 문서화돼 있지 않아 추측 파라미터를 추가하지 않았다.
  연결 버튼 근처에 provider 도메인 로그아웃 안내와 Meta 계정 센터 링크를 유지했다.
- **🔧 변경:** `/operator*`에서는 의도적 운영자 토큰을 보존하고, 고객 경로에 Supabase 세션이
  확립되면 고객 JWT를 승격한다. 로그아웃·identity 전환은 `active_workspace`의 localStorage와
  Zustand 상태를 함께 비운다. 로그아웃 뒤 남은 `/api/me` 응답이 workspace를 재저장하지 못하게 했다.
- **보안 로그:** `/api/connect/{provider}`와 `/api/connect/readiness`에서 고객 JWT tenant와
  쿼리 tenant가 다르면 JWT tenant를 계속 사용하고
  `{"kind":"oauth_connect_tenant_mismatch","customerJwt":true}`만 기록한다.
  tenant id·Bearer·secret 원문은 기록하지 않는다.
- **데드코드:** 호출처가 없던 tenant-unscoped `countAccounts()`와 bare `db` import를 제거했다.
- **레드팀 보강:** 이전 버전 로그아웃으로 token만 없고 workspace가 남은 브라우저의 새 로그인도
  stale workspace를 지우지 못하는 경계를 추가 발견했다. 선행 1 FAIL 뒤 수정해 7/7 PASS로 고정했다.
- **자동검증:** `npx tsc --noEmit` exit 0·출력 0줄, 전체 **120 files / 1003 PASS /
  10 skipped**, webpack production build compile 14.9s·TypeScript 25.3s·static pages
  **166/166**·exit 0, `git diff --check` exit 0.
- **미검증/게이트:** 운영 Threads/Instagram consent 화면의 실제 계정 전환, 운영
  operator→customer 브라우저 전환, 실제 서버 로그 수집은 미검증이다. push·배포하지 않았으며
  pipeline qa/ship 잠금을 유지한다.

### 2026-08-03 REQUEST-OSMU-001 — 회장 요청 통합 원장

이 절은 2026-08-02~03 대화에서 나온 OSMU 요청의 단일 체크리스트다. PRD·디자인·구현·QA가 이 목록을
잃지 않도록 각 항목의 종료증거까지 고정한다.

| 요청 | 현재 상태 | 종료증거 |
|---|---|---|
| `j.the.great.investor`로 가입했는데 Threads에 `code_zero_to_one`이 보이는 계정 혼선 제거 | ❌ 미해소 | 로그인 사용자·workspace·연결 Threads handle이 동일 tenant임을 시크릿 브라우저에서 관찰 |
| 다른 계정 로그인 시 `zero_to_one_ai` 계속하기만 나오고 계정 전환이 없는 문제 해결 | ❌ 미해소 | 기존 Meta 세션이 있는 브라우저에서 목표 계정으로 전환→callback→저장 handle 변경 관찰 |
| Threads OAuth 후 Channel Info가 `Not connected`인 문제 해결 | ❌ 현재 운영 재현 | callback 성공 뒤 Channel Info와 Settings 모두 같은 연결 계정·상태 표시 |
| Instagram OAuth 후 연결 버튼이 남고 `재연결 필요`인 문제 해결 | ❌ 현재 운영 재현 | OAuth 완료 뒤 CTA가 관리/재연결 조건부로 바뀌고 동일 handle 표시 |
| 상태 문구를 한국어 한 체계로 통일 | ❌ 미해소 | 연결 안 됨/연결 확인 중/연결됨/재연결 필요가 모든 화면에서 동일 |
| Instagram Graph API 수동 토큰 창의 중복·빈값 UX 제거 | ❌ 미해소 | OAuth 사용자에게 수동 토큰 폼을 숨기고 고급 복구 경로로만 분리 |
| 전역 Settings 채널에서 연결 계정과 상태 표시 | ❌ 미해소 | 채널 화면과 Settings의 handle·상태·확인시각 일치 |
| Threads와 Instagram의 기능·탭 구조를 일관되게 구성 | ❌ 미해소 | 공통 기능은 같은 위치·이름, 플랫폼 전용 기능만 차이와 이유 표시 |
| OSMU 502 원인과 고객 복구 흐름 해결 | 🟡 현재 502 미재현 | 실패 단계·추적 ID·기존 결과 조회·중복 0·안전 재시도 E2E |
| 플랫폼별 초안 생성·검수·즉시발행·예약 진입 제공 | ❌ UI 미해소 | Threads와 지원 가능한 Instagram 경로를 실제 기존 Queue/Studio 위에서 E2E |
| 단일 Threads 도구가 아니라 전체 OSMU 범위와 플랫폼별 지원 상태 표시 | ❌ v2 디자인 보류 | 기존 기능을 보존한 화면에서 전체 범위와 현재 가능/준비 중 경계가 즉시 이해됨 |
| `브랜드 사실`·`발행 근거`·`permalink` 같은 내부용어 제거 | 🟡 v2 디자인만 반영 | 실제 제품에서 `내 브랜드 정보`·`발행 전 확인/기록`·`게시물 링크`로 관찰 |
| 과도한 loading shimmer 제거 | 🟡 v2 디자인만 반영 | 실제 제품에서 필요한 영역 한 곳만 로딩되고 나머지 조작 가능 |
| 기존 서버 구현을 전수 검토하고 전면 재작성 없이 증분 개선 | 🔎 감사 진행 | route/component/API별 유지·수정·신규 대응표와 제거 0 또는 사유 |
| 먼저 현재 기능을 돌아가게 한 뒤 UI 업데이트 | 🔎 현재 우선순위 | 운영 복구 E2E 통과 후 as-built 기반 디자인 재개 |
| PRD를 기업 전달 수준으로 작성하고 목차·벤치마크 포함, 웹으로 표시 | ✅ PRD v2.4 | 웹 렌더·TOC 19·Mermaid·quality verifier PASS |
| 산출물을 100B 대시보드에 표시 | ✅ plan/design 링크 반영 | collector 219/219, private build; 이후 상태 변화도 동기화 |

**현재 실행 순서:** 기존 구현·운영 상태 감사 → build gate를 정식 재개 → 최소 복구 → 독립 QA·실브라우저
관찰 → 위 표의 미해소 항목을 보존한 증분 디자인 → design 승인 → 기술설계/추가 개발.

### 2026-08-03 DESIGN-002 — 기존 요청의 프로토타입 추적 누락

- **❌ NG:** v2 프로토타입 제작 전에 이미 제보된 OAuth 성공 후 상태 불일치, Instagram OAuth CTA 잔존,
  빈 Graph API token form, Settings 연결 상태 누락, Threads/Instagram 탭·기능 불일치를 PRD는 요구했지만
  프로토타입은 실제 화면과 상태 전환으로 커버하지 않았다.
- **아직 미반영인 후발 요청:** `기존 구현 전수 검토·보존`과 `현재 기능을 먼저 정상화한 뒤 UI 업데이트`는
  v2 출력 뒤 명시됐으므로 v2의 누락이 아니라 다음 리테이크의 신규 필수조건이다.
- **근본 원인:** 컨트롤러가 디자인 재위임 목표를 사용자의 직전 피드백인 용어·loading·전체 제품 지도에만
  축소했고, PRD의 모든 사용자 요구를 prototype screen/state와 1:1 대조하는 RTM을 종료조건으로 강제하지
  않았다. product-designer도 기존 dashboard as-built를 inventory로 읽었지만 보존·변경 대응표 없이 새 IA를
  만들었다. verifier는 skill 사용·벤치마크·화면 품질을 통과시켰지만 요구 coverage 누락을 검사하지 않았다.
- **영향:** v2는 Threads wrong-account·초안·발행·예약·502의 개념만 보여주고, 실제 고객이 실패한 Instagram
  연결·Settings 상태·수동 token 중복과 기존 기능 보존을 판단할 수 없다. Instagram IMAGE/Reels 운영 증거가
  있는데도 `자동 발행 준비 중`으로 축소 표현했다.
- **수정 종료증거:** REQUEST-OSMU-001 각 행이 새 prototype의 route/screen/state 또는 `UI 대상 아님` 근거와
  1:1 매핑되고 누락 0건, 기존 route/component/API의 유지·수정·신규 표가 존재하며, 브라우저에서 핵심 실패
  상태와 회복 경로를 직접 클릭 관찰한다. 그 전 design 승인 금지.

### 2026-08-03 DESIGN-004 — 증분 설계·OSMU 정체성·플랫폼 공통 탭 실패

- **❌ NG 사용자 관찰:** v3가 기존 개발 화면에 기능을 추가하는 인상이 아니라 디자인을 전면 교체한 것처럼
  보이고, OSMU 제품 정체성이 즉시 보이지 않는다. Threads와 Instagram 상단 탭도 각각 다른 구조를 유지해
  `Queue / Editor / Analytics / Growth / Popular / Settings` 공통 작업 모델을 만들지 못했다.
- **❌ NG 목표상태 누락:** 회장이 `안 된다`고 제보한 OAuth 후 상태, Settings 동기화, Graph API 기본 비노출,
  계정 전환, 플랫폼별 생성·발행·예약은 오류 설명만이 아니라 수정 후 실제 사용 가능한 목표 화면으로 보여야
  하는데 일부 화면은 현재 장애·복구 설명에 머물렀다.
- **근본 원인:** `기존 route/tab/capability 삭제 0`을 보존성 합격선으로 잘못 정의했다. 삭제하지 않는 것과
  공통 고객 경험으로 통일하는 것은 별개인데, product-designer와 컨트롤러가 기존 플랫폼별 탭 차이를 그대로
  남긴 채 보존 성공으로 판정했다. 또한 as-built 데이터 구조 보존과 visual shell 보존을 분리하지 않아 새 IA와
  스타일 변경 폭을 제한하지 못했다.
- **수정 원칙:** 기존 Sidebar·레이아웃·토큰·카드·라우트를 visual baseline으로 유지하고 기능을 additive로
  추가한다. OSMU 명칭·전체 콘텐츠 운영 목적을 모든 주요 화면 상단에서 식별 가능하게 한다. Threads와
  Instagram은 같은 순서의 공통 탭 `Queue / Editor / Analytics / Growth / Popular / Settings`를 사용하며,
  플랫폼 차이는 탭 구조가 아니라 내부 capability와 안내로 표현한다. 회장 제보 항목은 모두 해결된 target
  state와 오류·복구 state를 함께 제공한다.
- **종료증거:** 기존 운영 화면과 수정 prototype의 공통 shell 시각 대조, 두 플랫폼 탭 이름·순서 완전 일치,
  OSMU 식별자 모든 주요 화면 노출, REQUEST-OSMU-001 전 항목 happy-path와 recovery-path 각각 연결,
  브라우저 직접 클릭·console/mobile QA 후 사용자 재확인. 그 전 design 승인 금지.

### 2026-08-04 DESIGN-005 — 전체 OSMU 플랫폼·설정관리 범위 누락

- **❌ NG 사용자 관찰:** v4가 Threads와 Instagram 중심으로만 구성됐다. OSMU 전체 제품이라면 Facebook,
  X, Instagram Reels, YouTube Shorts, TikTok도 콘텐츠 생성·플랫폼별 편집·검수·즉시발행·예약·Queue·
  Calendar·발행기록·분석과 각 플랫폼 연결/계정/권한/설정 관리까지 포함해야 한다.
- **근본 원인:** 승인 PRD v2.4의 One Thing인 `Threads 외부고객 1명 실제 permalink`를 첫 검증 slice가 아니라
  전체 제품 정보구조의 범위로 오독했다. 이후 회장이 `전체 OSMU`를 반복 요청했는데도 plan MAJOR scope를
  재개하지 않고 design 안에서 지도·지원표만 추가해 상류 요구와 하류 화면이 계속 어긋났다.
- **영향:** Facebook·X·Reels·Shorts·TikTok이 전체 고객 흐름과 공통 탭/Settings에서 빠져 OSMU라는 제품명이
  약속하는 One Source Multi Use를 충족하지 못한다. v4는 전체 제품 prototype 승인 대상이 아니다.
- **수정 원칙:** 검증·출시 우선순위는 플랫폼별로 단계화할 수 있으나 전체 OSMU IA와 관리 surface는 모든
  대상 플랫폼을 포함한다. 각 플랫폼은 공통 `Queue / Editor / Analytics / Growth / Popular / Settings`와
  공통 발행 lifecycle을 사용하고, TEXT/IMAGE/VIDEO·OAuth/credential/심사 차이는 capability matrix와 탭
  내부 상태로 표현한다. 미구현을 구현됨으로 꾸미지 않되 목표 happy-path와 현재 readiness를 분리한다.
- **종료증거:** PRD MAJOR 범위에 Threads, Instagram Feed/Reels, Facebook, X, YouTube Shorts, TikTok의 기능·
  설정·예외·출시단계·AC/QA가 모두 고정되고, prototype에서 플랫폼 6종의 공통 탭·플랫폼별 Editor/Settings·
  전체 생성→발행→분석 flow를 클릭 가능하게 관찰한다. 그 전 design 승인 금지.

### 2026-08-04 OSMU v3.1.1 plan PATCH AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v3.1.1-gpt-codex.md` v3.1.1 PATCH와 v3.1.0의 비변경 조항. 아래 TC는 plan 단계 정규 골격이며
> design/FDD 확정 뒤 endpoint/component 이름을 추가한다. `실계정`은 non-secret 식별 범주만 기록한다.
>
> **❌ 2026-08-04 superseded:** PLAN-007로 v3.1.1과 DESIGN v6는 승인 불가다. 아래 TC는 역사 증거이며 신규 design/build gate에는 사용하지 않는다. 후속 정본 후보는 `docs/openclaw-auto-osmu-prd-v4.0.0-gpt-codex.md`와 `OSMU-V4-TC-*`다.

| TC | AC/FR | 검증 목표 | Owner | Due/slice | Environment | Credential/review prerequisite | 실계정 | 종료증거 |
|---|---|---|---|---|---|---|---|---|
| OSMU-V3-TC-001 | AC-01/FR-01 | 6 provider·8 surface·12 capability ID 전 산출물 일치 | qa-verifier/SJ | v5 design gate | docs+prototype | 없음 | 불필요 | count 6/8/12, ID diff 0 |
| OSMU-V3-TC-002 | AC-02/FR-02/21,NFR-09/10 | 실제 shell·provider별 탭·특화 기능 보존, UI 획일화 금지 | qa-verifier/SJ | v6 design re-gate | source+prototype 390/1024 | 없음 | 불필요 | sidebar 26/26, route 24/24, Threads tab 5/5, Instagram tab 3/3, forced identical tab 0, invented top-level navigation 0, route click screenshot |
| OSMU-V3-TC-003 | AC-03/FR-03 | callback/provider 상태가 4면 account truth와 일치 | qa-verifier/SJ | R0 | prod secret browser | provider client credential | Threads+IG target | Channel/Global/Platform/Editor identity·state·CTA diff 0 |
| OSMU-V3-TC-004 | AC-04/FR-04 | 기존 Meta 세션에서 목표 계정 전환 | qa-verifier/SJ | R0 | prod existing-session browser | Meta app role/consent | 서로 다른 Meta 계정 2개 | chooser→callback→target identity 영상·screenshot |
| OSMU-V3-TC-005 | AC-05/FR-04 | same-provider 2계정 default 전환·계정별 발행 | qa-verifier/SJ | R0/R4 | prod secret browser | provider multi-account consent | provider당 target 2개 | account별 external link·identity 일치 |
| OSMU-V3-TC-006 | AC-06/FR-05 | 기존 Settings summary와 Channel Settings detail의 역할·label을 보존하고 동일 account truth 사용 | qa-verifier/SJ | R0 | prod browser | 연결 account 1개 이상 | Threads+IG target | 같은 handle/state/verified-at/CTA, 기존 Settings tab 9/9, summary/detail 역할 분리 screenshot |
| OSMU-V3-TC-007 | AC-07/FR-06 | provider readiness 9항목 data trace와 맥락별 reason/action; 54-cell UI 강제 금지 | qa-verifier/SJ | v6/R0 | source+prototype+prod | provider readiness response | provider 6종 또는 disabled seed | readiness field 9/9, customer reason/action coverage, forced 54-cell UI 0, empty invented tab 0 |
| OSMU-V3-TC-008 | AC-08/FR-07 | 미승인 source dispatch 0 | qa-verifier/SJ | R1 | staging/prod-parity | enabled provider 1개 | Threads target | provider request 0·승인 안내 |
| OSMU-V3-TC-009 | AC-09/FR-08 | 12 capability variant 생성·개별 수정 보존 | qa-verifier/SJ | R4 | staging seeded | media seed | 불필요 | variant 12/12, cross-overwrite 0 |
| OSMU-V3-TC-010 | AC-10/FR-09 | invalid media/privacy/disclosure provider 전 차단 | qa-verifier/SJ | R1~R4 | staging contract | official rule fixtures | 불필요 | capability 12/12 invalid request 0 |
| OSMU-V3-TC-011 | AC-11/FR-10 | final review target/content/privacy/time 표시·승인 gate | qa-verifier/SJ | R1 | prod browser | connected target | 외부 opt-in Threads+IG | 승인 전 request 0, review screenshot |
| OSMU-V3-TC-012 | AC-12/FR-11 | enabled capability Now 실제 결과 | qa-verifier/SJ | 각 R1~R4 | prod provider | 각 provider credential/review | 실제 target account | external ID+열리는 link+identity capability별 1건 |
| OSMU-V3-TC-013 | AC-13/FR-12 | schedule/cancel/reschedule/due·Queue/Calendar 일치 | qa-verifier/SJ | R1/R4 | prod scheduler | enabled schedule capability | 실제 target account | 상태 전이+due external link; 취소 publish 0 |
| OSMU-V3-TC-014 | AC-14/FR-13 | video processing terminal 전 published 0 | qa-verifier/SJ | R3/R4 | prod provider | video credential/review | IG/FB/YT/TT target | accepted→processing→terminal timeline |
| OSMU-V3-TC-015 | AC-15/FR-14 | timeout·partial·동시 retry idempotency | qa-verifier/SJ | R1 | staging fault+prod parity | provider sandbox/real recovery | Threads/IG target | same key external result ≤1·reconciled link |
| OSMU-V3-TC-016 | AC-16/FR-15 | partial multi-capability 결과 source group 1개 | qa-verifier/SJ | R4 | staging+prod subset | 2+ enabled provider | 실제 target 2개 이상 | success 재발행 0, 독립 상태와 link |
| OSMU-V3-TC-017 | AC-17/FR-16 | 6×3 analytics 계약 S/R/U·근거·enable 조건 | qa-verifier/SJ | R4 | docs+prod read | analytics scopes/review | provider별 own account | 18/18, 가짜 0 없음, source/fetched-at |
| OSMU-V3-TC-018 | AC-18/FR-17 | 만료·장애·quota·review actionable 알림 | qa-verifier/SJ | R0~R4 | staging fault fixtures | 없음/실 provider error | seeded+실계정 혼합 | error class별 user/owner action·retry time |
| OSMU-V3-TC-019 | AC-19/FR-18 | disconnect/delete/revoke 후 발행 차단·보존범위 | qa-verifier/SJ | R1 | prod test account | revoke 가능한 test account | provider target 1개 | token unusable·publish 0·evidence 보존 표시 |
| OSMU-V3-TC-020 | AC-20/FR-19 | 2 tenant×2 account 교차 read/write/publish 0 | qa-verifier/SJ | R0 | staging RLS+prod parity | 두 tenant seed | 실계정 불필요, provider call spy | 4×read/write/publish deny·external call 0 |
| OSMU-V3-TC-021 | AC-21/FR-20 | 미준비 capability enabled 오표시 0 | qa-verifier/SJ | R0~R4 | prod readiness | credential/review missing fixtures | X/FB/YT/TT disabled state | reason·support evidence·enable condition screenshot |
| OSMU-V3-TC-022 | AC-22/FR-21 | additive migration invariants와 실제 제품 preservation audit | qa-verifier/SJ | build/QA gate | repo+prototype+staging DB | backup/rollback proof | 불필요 | MI-01~09 9/9, sidebar 26/26, route 24/24, Settings 9/9, label remove/rename/move 0, invented nav 0, record loss 0 |
| OSMU-V3-TC-023 | AC-23/FR-22 | legacy 운영 5 paths 회귀 | qa-verifier/SJ | R1 | prod secret browser | Threads+IG valid consent | 운영 target | Threads TEXT/IMAGE/Schedule+IG Feed/Reels link 5/5 |
| OSMU-V3-TC-024 | AC-24/FR-23 | REQUEST·사용자 정정·DESIGN-005·DESIGN-006·DESIGN v6→FR→AC→TC→view/state 전수 RTM | qa-verifier/SJ | v6 design re-gate | docs+prototype | 없음 | 불필요 | 상류 4종 orphan 0, DESIGN-006 closure 9/9, v5 승인 근거 사용 0, v3.1.1 path/version 일치 |
| OSMU-V3-TC-025 | AC-25/FR-24 | external demand qualification·consent·dedupe | qa-verifier/SJ | R1+30d | cohort ledger | opt-in notice | 외부 workspace 10/최대100 prospect | internal 0·duplicate 0·consent 100% |
| OSMU-V3-TC-026 | AC-26/NFR-01 | connection hard stop R0 evidence 전 유지 | qa-verifier/SJ | R0 | prod feature gate | 없음 | 신규 고객 test | OAuth/publish CTA closed, override 0 |
| OSMU-V3-TC-027 | AC-27/NFR-02/03 | secret/private payload client·log·공용 analytics 유출 0 | qa-verifier/SJ | R0/QA | staging+prod logs | secret scanner access | synthetic private payload | token/source/handle/permalink raw hit 0 |
| OSMU-V3-TC-028 | AC-28/NFR-05 | 502가 correlation/reconciliation/action 상태로 복구 | qa-verifier/SJ | R0 | staging fault+prod | upstream fault injection or captured 5xx | target 1개 | 흰 화면 0·correlation ID·duplicate 0 |
| OSMU-V3-TC-029 | AC-29/FR-12 | video/X-media schedule gap을 enabled로 오표시하지 않음 | qa-verifier/SJ | R0/R4 | prod readiness UI | capability별 current flags | IG/FB/X/YT/TT states | 미구현 5종 disabled; R4 후 capability별 E2E |
| OSMU-V3-TC-030 | AC-30/FR-16 | Popular 표본 3건 미만 상태 | qa-verifier/SJ | R4 | staging/prod analytics | metric read scope | own posts 0/2/3개 fixtures | 0·2=`표본 부족`, 3=ranking+link |

#### OSMU v3.1 QA gate 요약

- R0 hard stop clear에는 TC-003~007, 020, 021, 026~028이 모두 PASS해야 한다.
- R1에는 TC-008, 011~015, 019, 023과 외부 고객 target link가 필요하다.
- R4는 UI 생성이 아니라 TC-001~030 전량 PASS 또는 공식 근거를 가진 capability별 disabled 판정이 종료증거다.
- 기존 design/prototype v1~v5는 superseded이며 TC-024의 target view는 v3.1.1 PATCH와 정합한 DESIGN v6만 인정한다.

### 2026-08-04 OPS-AGENT-VIS-001 — 서브에이전트 진행상태 비가시화

- **❌ NG 사용자 관찰:** 백그라운드 서브에이전트가 실제 실행 중이어도 회장 화면에는 현재 단계·최근 산출·남은
  검증이 자동 표시되지 않아 작업이 멈췄는지 판단할 수 없다.
- **근본 원인:** Codex 협업 상태는 컨트롤러가 `list_agents`와 agent message를 능동 조회해 중계해야 하는
  pull 구조인데, 컨트롤러가 장기 디자인 작업 중 주기적으로 조회·보고하지 않았다.
- **영향:** 진행 중인 작업이 정지처럼 보이고, 중복 실행 요청과 불신을 유발하며 멀티에이전트의 병렬화 이점이
  사용자 경험에 드러나지 않는다.
- **수정 원칙:** active agent가 있으면 컨트롤러가 60초 이내 간격으로 `running/completed/blocked`, 현재 단계,
  검증 수치, 다음 산출 이벤트를 짧게 중계한다. 완료 알림을 받으면 같은 턴에 품질 verifier로 전환한다.
- **종료증거:** 10분 이상 수행되는 위임 1건에서 상태 업데이트 공백 60초 이하, 완료 후 한 응답 주기 안에
  verifier 착수, 사용자가 별도 상태 질문 없이 현재 단계와 남은 일을 식별할 수 있음.

### 2026-08-04 DESIGN-006 — v5 실구현 IA·기능·디자인시스템 무시

> 후속 상류 결함은 아래 `PLAN-007`에서 별도 추적한다.

### 2026-08-04 PLAN-007 — 기존 OSMU 런타임·기능 연속성 오판

- **❌ NG:** PRD v3.1.1과 DESIGN v6가 실제로 없는 `Studio → 승인 인박스 → 캘린더 → result group → retry`
  통합 연속성을 기존 구현처럼 전제했다.
- **실제 코드:** tenant DB-backed Next API와 env/JSON 기반 root extensions가 병존하며 자동 통합되지 않는다.
  text publish/schedule 8개, Studio direct publish 4개, video publish target 3개, publish extension 15개다.
- **부분 구현:** queue JSON primary+DB mirror, universal permalink/result recovery 없음, generic result-group retry
  없음, no-draft concurrent reservation 없음, OAuth same-provider state one-time consumption TODO.
- **판정:** PRD v3.1.1과 DESIGN v6 승인 불가. 실제 구현/부분 구현/미구현/운영장애를 분리한 MAJOR PRD 필요.
- **종료증거:** 두 런타임 source-to-result map, capability별 as-is/target/gap, 8 text+3 video+15 extension 대응표,
  queue/OAuth/idempotency debt 순서, AC/TC 재작성, independent critic MAJOR 0.

### 2026-08-05 DESIGN-008 — 로컬 코드 구현을 운영 기존기능으로 오표시

- **❌ NG 사용자 관찰:** 실제 사용 중인 OSMU에는 초안생성·Publish 흐름이 보이지 않는데 v7은 이를
  `현재 구현`, `기존 Studio 보존`, `AS-IS`로 표시했다.
- **코드 증거:** 로컬 `dashboard/src/app/studio/page.tsx`에는 2026-06-23부터 `OSMU 생성`, `AI 자동초안`,
  `Save`, `Publish`, `예약` UI와 실행 코드가 존재한다. 하지만 이 커밋이 현재 운영 OSMU에 배포·노출됐다는
  prod browser 증거는 없다.
- **근본 원인:** repo-implemented와 prod-observed를 하나의 `현재/기존` 상태로 합쳤다. 코드 존재는 배포·접근·
  실제 동작 증거가 아닌데 디자인 보존 근거로 승격했다.
- **판정:** DESIGN v7 승인 후보 철회. 로컬 코드 존재 수치는 보존 inventory로만 인정하고 운영 AS-IS로
  표시하지 않는다.
- **수정 원칙:** 모든 화면과 기능을 `운영에서 직접 관찰됨 / 로컬 코드에 구현됐으나 운영 미검증 / 목표 계약`
  3층으로 분리한다. 운영 미검증 기능은 기본 고객 경로·기존 사용경험으로 가정하지 않는다.
- **종료증거:** repo commit·local route·prod route 세 증거 열을 가진 provenance matrix, 운영 관찰 없는 기능의
  `기존/현재/AS-IS` 표기 0, target과 local-only 혼동 0, 사용자 운영 화면 기준 브라우저 대조.

### 2026-08-05 DESIGN-009 — 내부 감사 UI를 고객 제품 프로토타입으로 출고

- **❌ NG 사용자 관찰:** v8 첫 화면이 `PROD OBSERVED / REPO / TARGET` provenance와 검증 수치를 보여줘
  사용자가 무엇을 해야 하는 제품인지 알 수 없다. 기획·디자인의 실제 목표 경험이 아니라 내부 감사 도구다.
- **근본 원인:** 운영 주장 방지라는 검증 수단을 고객 UI의 정보구조로 승격했다. provenance는 디자인 QA
  evidence여야지 제품 navigation·hero·task flow가 아니다.
- **판정:** v8 승인 후보 철회. 내부 검증표로만 보존한다.
- **수정 원칙:** v9은 PRD v4.1.2 One Thing을 실제 고객 작업으로 보여준다: 원문 작성/가져오기 → Threads·
  Instagram Feed·X 선택 → 플랫폼별 초안 생성·수정 → 계정·내용 최종검수 → 즉시/예약 → 계정별 결과·
  permalink·부분실패 복구. 기존 Marketing Hub shell에 additive하되 감사 용어·코드 수치·migration UI는
  고객 기본 흐름에서 제거한다. readiness·미구현은 자연스러운 비활성 상태와 안내로만 표현한다.
- **종료증거:** 첫 10초에 제품 목적·첫 행동 식별, happy path 전체 클릭 가능, recovery path, 사용자에게
  provenance/audit/code count 노출 0, dead-end 0, 1024/390 QA, PRD AC28 RTM.

### 2026-08-05 DESIGN-010 — 8개 초안·개별 Publish 기존 핵심흐름 누락

- **❌ NG 사용자 관찰:** 기존 OSMU의 핵심은 초안생성 한 번으로 플랫폼 8개 초안을 만들고, 각 초안 카드의
  Publish를 눌러 하나씩 발행하는 흐름인데 v9은 Threads·Instagram·X 3개와 일괄 최종발행으로 축소했다.
- **코드 증거:** 현재 `SCHEDULABLE_PLATFORMS`와 `/api/publish` 지원 8개는 Threads, X, Facebook, Instagram,
  Bluesky, Telegram, Discord, Slack이다. 과거 Studio commit `aa368e67`은 ALL 7 preview를 전부 선택하고
  순차 publish loop를 실행했으며, 이후 direct publish UI가 4개로 축소됐다.
- **근본 원인:** initial 3 adapter의 안전성 검증 우선순위를 제품 UI의 전체 초안 범위로 오독했고, 일괄 생성과
  카드별 개별 Publish라는 기존 작업 모델을 최종검수 후 일괄발행으로 바꿨다.
- **판정:** v9 승인 후보 철회. PRD에 8 draft surface와 card-level Publish 계약을 추가하고 v10에서 복원한다.
- **종료증거:** 초안생성 1회→8 cards, 카드별 edit/save/publish/status/permalink, 한 카드 Publish가 다른 카드
  external call을 만들지 않음, 8/8 카드 클릭, 전체/선택 발행은 별도 명시 행동, partial/retry, 1024/390 QA.

#### v4.0.0 MAJOR retake 상태

- **작성됨·승인 전:** `docs/openclaw-auto-osmu-prd-v4.0.0-gpt-codex.md`
- **정정:** Studio DB drafts, queue JSON Inbox/Calendar, DB schedules, video publish를 별도 as-is 경로로 명시했고 자동 연속성을 현재 구현으로 주장하지 않는다.
- **범위:** text 8, video 3, root publish extensions 15를 각각 map하고 code exists/partial/unimplemented/operational outage/unverified를 분리한다.
- **남은 종료조건:** independent critic MAJOR 0, AC↔TC/RTM 검증, 회장 appetite·extension disposition 원칙 결정. DESIGN v6는 rejected evidence로만 유지한다.

### 2026-08-04 OSMU v4.0.0 MAJOR AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.0.0-gpt-codex.md` §17. endpoint/component 이름은 FDD 합의 후 추가하되 Given-When-Then과 종료증거를 약화하지 않는다.
>
> **❌ superseded:** independent critic의 residual MAJOR 7건으로 v4.0.0 gate 불통과. 후속 정본 후보는 v4.1.0과 `OSMU-V41-TC-*`이며 아래 v4.0 TC는 역사 증거다.

| TC | AC/FR | 검증 목표 | Owner | Slice | 종료증거 |
|---|---|---|---|---|---|
| OSMU-V4-TC-001 | AC-01/FR-01 | runtime capability inventory | qa-verifier | R0 | text 8/video 3/extensions 15, 범주 혼합 0 |
| OSMU-V4-TC-002 | AC-02/FR-02,NFR-08 | 기존 shell 보존 | qa-verifier/SJ | R0/design | sidebar/route/settings/provider-tab orphan·무승인 rename·invented nav 0 |
| OSMU-V4-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | qa-verifier | R0 | 미검증·장애 target disabled+reason/action/owner/evidence time |
| OSMU-V4-TC-004 | AC-04/FR-01,18 | extension 15 audit | tech-architect/qa | R0/R5 | 15/15 overlap/runtime/credential/result/disposition |
| OSMU-V4-TC-005 | AC-05/FR-08 | OAuth state one-time consumption | qa-verifier | R1 | 동일 state 2회 중 첫 회만 token/write, 둘째 external call 0 |
| OSMU-V4-TC-006 | AC-06/FR-09 | four-surface account truth | qa-verifier/SJ | R1 | identity/scope/state/verified-at/CTA diff 0 |
| OSMU-V4-TC-007 | AC-07/FR-09,NFR-01 | two-account explicit selection | qa-verifier/SJ | R1 | 선택 target 저장·review·발행 일치, cross-tenant 0 |
| OSMU-V4-TC-008 | AC-08/FR-03 | stable source identity | qa-verifier | R2 | Studio/queue/schedule/video source에 tenant-scoped identity+provenance |
| OSMU-V4-TC-009 | AC-09/FR-04 | Studio↔queue explicit bridge | qa-verifier | R2 | 동일 source 참조, 복제 orphan 0 |
| OSMU-V4-TC-010 | AC-10/FR-05 | dual-read parity | qa-verifier | R2 | Studio/Inbox/Calendar source·approval·schedule·result parity 100% |
| OSMU-V4-TC-011 | AC-11/FR-06,23,NFR-06 | JSON/DB drift recovery | qa-verifier | R2 | drift 검출·복구, record loss 0, JSON rollback rehearsal |
| OSMU-V4-TC-012 | AC-12/FR-07 | target variant independence | qa-verifier | R2/R3 | 한 target 수정/승인의 cross-overwrite 0 |
| OSMU-V4-TC-013 | AC-13/FR-10,11,NFR-02 | concurrent idempotency | qa-verifier | R3 | no-draft 포함 same intent 20회 external result ≤1 |
| OSMU-V4-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | qa-verifier | R3 | provider success/DB failure 뒤 republish 0·result 저장 |
| OSMU-V4-TC-015 | AC-15/FR-13 | text 8 recovery | qa-verifier | R3 | enabled adapter 8개 provider ID+permalink 또는 terminal reason |
| OSMU-V4-TC-016 | AC-16/FR-14 | source result group | qa-verifier | R3 | mixed target의 독립 status/provider ID/link/time 한 group |
| OSMU-V4-TC-017 | AC-17/FR-15 | partial retry | qa-verifier | R3 | failed target만 호출, success duplicate 0 |
| OSMU-V4-TC-018 | AC-18/FR-21,NFR-04 | fake permalink 금지 | qa-verifier | R3 | provider home URL을 post result로 표시 0 |
| OSMU-V4-TC-019 | AC-19/FR-16 | video terminal truth | qa-verifier | R4 | terminal 전 processing, terminal 뒤만 published+실 link |
| OSMU-V4-TC-020 | AC-20/FR-17 | YouTube result parity | qa-verifier | R4 | provider ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V4-TC-021 | AC-21/FR-16,17 | video 3 readiness | qa-verifier/SJ | R4 | 3 target 각각 E2E proof 또는 disabled reason/action, false-success 0 |
| OSMU-V4-TC-022 | AC-22/FR-18 | extension disposition | qa-verifier/SJ | R5 | 15/15 integrate/repair/retire+owner/proof, 미검증 노출 0 |
| OSMU-V4-TC-023 | AC-23/FR-20,22,NFR-07 | revoke·incident trace | qa-verifier | R1~R5 | revoke 뒤 external call 0, source→provider owner/action 추적 |
| OSMU-V4-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | qa-verifier | R1~R5 | 2 tenant×2 account cross access/call 0, raw private/secret leak 0 |
| OSMU-V4-TC-025 | AC-25/R6,BM | external cohort | SJ | R6+30d | internal/duplicate 제외 activation·repeat·paid-intent 산출 |
| OSMU-V4-TC-026 | AC-26/전체 | RTM·supersession | qa-verifier | plan/design gate | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |

#### OSMU v4 QA gate 요약

- R0: TC-001~004 전량 PASS. count·지원상태·기존 shell의 truth를 먼저 고정한다.
- R1: TC-005~007, 023~024 PASS 전 신규 외부 OAuth/dispatch를 열지 않는다.
- R2: TC-008~012가 7일 연속 parity 100% 전 canonical read switch와 JSON fallback 제거를 금지한다.
- R3/R4: enabled target마다 concurrency·timeout·persistence failure·실 permalink 증거가 있어야 한다.
- R5: extension 15개를 모두 활성화하는 gate가 아니라 15/15에 명시적 integrate/repair/retire 판정을 내리는 gate다.
- v4 plan approval은 TC-026과 independent critic MAJOR 0 이후이며, DESIGN v6는 재사용하지 않는다.

- **❌ NG 사용자 관찰:** v5 prototype에 실제품에 없는 `OSMU PROVIDERS` 그룹이 생겼고, 기존 왼쪽
  사이드바의 다수 기능과 분류가 사라졌다. 기존 제품에 추가하는 설계가 아니라 별도 제품처럼 재구성됐다.
- **코드 대조 증거:** 실제 `dashboard/src/components/layout/Sidebar.tsx`의 customer shell은 `Marketing Hub`,
  `성과`, `OSMU Studio`, `승인 인박스`, `발행 캘린더`, 발행 채널 그룹, `Video`, `Data & Analytics`,
  `Keyword Research`, `Custom Integration`, `Assets & Tools`, `System/Settings`를 노출한다. v5 prototype은
  이를 `Studio / OSMU PROVIDERS / Global Settings / Calendar`로 축약·변조했다.
- **기능 대조 증거:** 실제 Instagram은 `Queue / Editor / Settings` 3탭이다. v5는 구현 여부와 기존 기능
  위치를 구분하지 않고 전 provider에 `Queue / Editor / Analytics / Growth / Popular / Settings`를 생성했다.
- **근본 원인:** `6 provider×6 tabs`와 클릭 수를 보존성 대리지표로 사용하고, 실제 route/sidebar/component
  inventory 대 prototype diff를 만들지 않았다. 존재하지 않는 미래 IA를 target contract라는 이름으로 기존
  shell에 덮어쓴 뒤 Design Score A로 자기검증했다.
- **판정:** v5 design 승인 후보 철회. verifier PASS는 프로세스 근거만 확인했을 뿐 제품 정합성을 보증하지
  못했으므로 `additive`, `기존 구현 보존`, `다음 stage 가능` 주장은 무효다.
- **수정 원칙:** 실제 Sidebar·route·page·component·token을 먼저 전수 inventory하고 삭제/리네임/이동 0을
  기본값으로 삼는다. 새 OSMU 기능은 기존 `OSMU Studio`, `승인 인박스`, `발행 캘린더`, 채널 페이지,
  Global Settings 안에 증분 배치한다. 새 분류나 탭은 실제 기존 기능과 명확한 추가 요구가 모두 있을 때만 둔다.
- **상류 plan PATCH 계약:** `docs/openclaw-auto-osmu-prd-v3.1.1-gpt-codex.md`는 capability/data 6/8/12와
  readiness 9항목을 유지하되 공통 6탭·6×9 Settings UI 강제를 폐기했다. 공통 workflow는 기존 Studio,
  Inbox, Calendar, Settings에만 additive 배치하고 provider page는 실제 탭·특화 기능을 보존한다.
- **종료증거:** 실제 구현→새 prototype 1:1 보존 매트릭스에서 sidebar 26/26, route 24/24, Settings tab
  9/9, provider 실제 탭·기능 orphan 0, forced identical provider tab 0, invented top-level navigation 0,
  디자인 토큰·shell diff 설명 100%, 사용자 요청 추가분만 additive 표시, 390/1024 브라우저 대조.

### 2026-08-04 OSMU v4.1.0 MINOR AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.1.0-gpt-codex.md` §17. v4.0 critic residual MAJOR 7건을 행동·경계·실패 action까지 강화했다. DESIGN v6는 rejected evidence다.
>
> **❌ superseded:** qualified prospect 사전판정/locked contact ledger와 모집실패 branch가 없어 v4.1.0 critic 불통과. 후속 정본 후보는 v4.1.1과 `OSMU-V411-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V41-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V41-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V41-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V41-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V41-TC-005 | AC-05/FR-08 | OAuth concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V41-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V41-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V41-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V41-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V41-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V41-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V41-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V41-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V41-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V41-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V41-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V41-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V41-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V41-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V41-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V41-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V41-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V41-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V41-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V41-TC-025 | AC-25/F4,BM | cohort metrics+stop action | F4 | exact activation/repeat/paid formulas, 미달 시 F1~F3/paid flags stopped |
| OSMU-V41-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V41-TC-027 | AC-27/FR-25,NFR-09 | data rights/consent/delete | F4 | 승인 전 cohort0; consent version; 30d/180d/7d; access audit; 철회 dispatch0 |
| OSMU-V41-TC-028 | AC-28/FR-26 | initial bet boundary/X readiness | R0~R3 | Threads/IG/X만, X credential/cost/link gate, 28h cap, F1~F4 auto-entry0 |

#### v4.1 gate

- R1은 TC-005의 token endpoint·account write exactly1을 직접 관찰하기 전 통과 불가다.
- R2는 TC-010~011의 M0~M8 authority, reverse replay, cutover 후 신규100 JSON rollback loss0 전 통과 불가다.
- Initial safety bet은 TC-028이 정한 Threads·Instagram Feed·X만이며 F1~F4는 자동 진입하지 않는다.
- F4는 §14.5 추천 데이터 권리를 회장이 승인하기 전 모집·수집·결제 0이다.
- plan approval은 TC 28/28 정합과 independent critic MAJOR 0 이후다.

### 2026-08-05 OSMU v4.1.1 PATCH AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.1.1-gpt-codex.md` §17. v4.1.0의 unchanged behavior를 보존하고 TC-005/025/027/028의 critic residual을 강화했다.
>
> **❌ superseded:** F4 30일 timer가 first qualified lock에서 시작돼 cohort 시작 권한과 분리되지 않았고, active work 1,680분 circuit breaker·delivery outcome 분모가 없었다. 후속 정본 후보는 v4.1.2와 `OSMU-V412-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V411-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V411-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V411-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V411-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V411-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V411-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V411-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V411-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V411-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V411-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V411-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V411-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V411-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V411-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V411-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V411-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V411-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V411-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V411-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V411-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V411-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V411-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V411-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V411-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V411-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | prospect ledger + cohort branches | F4 | pre-contact 4/4 evidence·ID·timestamp lock/dedupe; A=100소진 또는30일+consented<10이면 F1~F3/paid stopped+신규work/예산0+snapshot; B=10확보 후 activation≥3/repeat≥3/actual-paid≥2 미달 동일 stop |
| OSMU-V411-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V411-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V411-TC-028 | AC-28/FR-26,NFR-10 | initial bet work-time cap | R0~R3 | work-item planned/actual/evidence append; 1,680분 도달 또는 next 포함 초과 시 신규 R0~R3/F1~F4 stopped, 1,681분 시작0; X readiness gate |

#### v4.1.1 PATCH gate

- TC-025 Branch A와 B를 모두 fixture로 실행한다. A는 모집실패를 activation 실패로 바꿔 세지 않고, B는 10개 확보 뒤 성숙한 window만 평가한다.
- TC-025의 qualified 100명은 접촉 전 4/4 evidence·locked prospect ID/contact timestamp·dedupe PASS row만 센다.
- TC-027은 active delete만이 아니라 삭제시각+30일 backup restore/read 실패까지 assertion한다.
- TC-028은 work-item별 누적 ledger와 1,680분 atomic stop을 assertion한다.
- v4.1.1 plan approval은 V411 TC 28/28 정합, planning 7/7 closure, independent critic MAJOR 0 이후다.

### 2026-08-05 OSMU v4.1.2 final PATCH AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md` §17. v4.1.1 behavior를 보존하고 TC-025/028 timer·delivery·active-stop residual을 닫았다.
>
> **❌ superseded:** DESIGN-010에서 회장이 확정한 Generate Drafts→8 cards→per-card Publish 계약이 없었다. 후속 정본 후보는 v4.2.0과 `OSMU-V42-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V412-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V412-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V412-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V412-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V412-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V412-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V412-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V412-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V412-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V412-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V412-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V412-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V412-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V412-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V412-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V412-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V412-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V412-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V412-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V412-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V412-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V412-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V412-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V412-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V412-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | explicit F4 start + cohort branches + delivery outcome | F4 | approval 뒤 Start F4→immutable f4_started_at exactly1; A cutoff=delivered100 또는 start+30d 먼저, consented<10 stop; fixture day30 qualified0 consented0에서 F1~F3/paid stopped·new work/budget0·snapshot; first-qualified timer 사용0; failed delivery denominator0/audit 보존; B threshold stop |
| OSMU-V412-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V412-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V412-TC-028 | AC-28/FR-26,NFR-10 | active initial-bet circuit breaker | R0~R3 | running at1679→minute1680: next side effect 전 breaker, atomic commit/rollback, safe checkpoint 5필드, R0~R3/F1~F4 stopped, minute1681 side effect0 |

#### v4.1.2 final gate

- TC-025 fixture 1: rights 승인만 있고 Start F4 없음 → contact/collect/pay 0, timer 없음.
- TC-025 fixture 2: `f4_started_at+30d`, delivered qualified=0, consented=0 → F1/F2/F3/paid stopped, new work/budget 0, count/start/cutoff/flag snapshot.
- first qualified evidence/lock timestamp를 cutoff origin으로 넣으면 FAIL. failed/bounced/blocked delivery는 contacted denominator 0이나 attempt audit는 남아야 한다.
- TC-028 fixture: running task가 1,679→1,680분이 될 때 단순 신규-start 차단이 아니라 다음 side effect 전 circuit breaker·atomic close·safe checkpoint를 관찰한다.
- plan approval은 V412 TC 28/28, planning 7/7 재판정, independent critic MAJOR 0 이후다.

### 2026-08-05 OSMU v4.2.0 DESIGN-010 plan MINOR AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.2.0-gpt-codex.md` §17. 회장 확정 작업모델을 상위 UI 계약으로 추가하며 기존 V412 28 TC는 그대로 계승한다.
>
> **❌ superseded:** partial generation의 fixed-8/empty/single-Regenerate와 publish retry taxonomy가 없어 critic MAJOR 2. 후속 정본 후보는 v4.2.1과 `OSMU-V421-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V42-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V42-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V42-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V42-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V42-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V42-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V42-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V42-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V42-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V42-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V42-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V42-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V42-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V42-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V42-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V42-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V42-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V42-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V42-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V42-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V42-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V42-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V42-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V42-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V42-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | explicit F4 start + cohort branches + delivery outcome | F4 | approval 뒤 Start F4→immutable f4_started_at exactly1; A cutoff=delivered100 또는 start+30d 먼저, consented<10 stop; fixture day30 qualified0 consented0에서 F1~F3/paid stopped·new work/budget0·snapshot; first-qualified timer 사용0; failed delivery denominator0/audit 보존; B threshold stop |
| OSMU-V42-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V42-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V42-TC-028 | AC-28/FR-26,NFR-10 | active initial-bet circuit breaker | R0~R3 | running at1679→minute1680: next side effect 전 breaker, atomic commit/rollback, safe checkpoint 5필드, R0~R3/F1~F4 stopped, minute1681 side effect0 |
| OSMU-V42-TC-029 | AC-29/FR-28,NFR-11 | Generate Drafts 8 cards + independent edit/save | design/R3 | source1 generate1→Threads/X/Facebook/Instagram/Bluesky/Telegram/Discord/Slack exactly8; one-card edit/save 시 other7 payload/status write0 |
| OSMU-V42-TC-030 | AC-30/FR-29,NFR-02,11 | per-card Publish/Retry isolation/result | design/R3 | one card Publish→selected invocation1/other7=0/status+actual permalink; failed Retry selected1/other7=0; published Retry adapter0+existing result+duplicate0 |
| OSMU-V42-TC-031 | AC-31/FR-30,NFR-04,11 | readiness disabled + explicit selected/bulk | design/R3 | cards/drafts/edit/save8/8; unavailable Publish disabled+condition; generate/save implicit bulk0; selected/all은 별도 action+review+confirm |

#### v4.2.0 DESIGN-010 gate

- Generate Drafts 1회 결과는 정확히 text platform cards 8개다. Studio preview7·direct4를 target count로 사용하면 FAIL.
- card Publish spy는 선택 adapter invocation=1, 다른 7=0을 assertion한다. Threads provider 내부 다단계 HTTP는 단일 adapter dispatch intent로 묶는다.
- 각 card는 edit/save/status/permalink/retry를 독립 소유하고 success retry duplicate 0을 유지한다.
- initial Threads/Instagram/X는 Publish safety 우선순위이며 draft card 8/8을 3개로 축소하지 않는다.
- selected/bulk는 별도 명시 action·review·confirm이며 default per-card Publish를 대체하지 않는다.
- plan approval은 V42 TC 31/31, independent critic MAJOR 0 이후다.

### 2026-08-05 OSMU v4.2.1 critic residual PATCH AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.2.1-gpt-codex.md` §17. V42 31개 계약을 보존하고 TC-029/030의 partial/uncertainty behavior를 강화했다.
>
> **❌ superseded:** fixed text8 Studio 계약이 실제 historical visual7과 backend/messaging surface를 혼합했다. 후속 정본 후보는 v4.3.0과 `OSMU-V43-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V421-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V421-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V421-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V421-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V421-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V421-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V421-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V421-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V421-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V421-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V421-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V421-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V421-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V421-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V421-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V421-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V421-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V421-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V421-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V421-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V421-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V421-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V421-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V421-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V421-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | explicit F4 start + cohort branches + delivery outcome | F4 | approval 뒤 Start F4→immutable f4_started_at exactly1; A cutoff=delivered100 또는 start+30d 먼저, consented<10 stop; fixture day30 qualified0 consented0에서 F1~F3/paid stopped·new work/budget0·snapshot; first-qualified timer 사용0; failed delivery denominator0/audit 보존; B threshold stop |
| OSMU-V421-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V421-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V421-TC-028 | AC-28/FR-26,NFR-10 | active initial-bet circuit breaker | R0~R3 | running at1679→minute1680: next side effect 전 breaker, atomic commit/rollback, safe checkpoint 5필드, R0~R3/F1~F4 stopped, minute1681 side effect0 |
| OSMU-V421-TC-029 | AC-29/FR-28,NFR-11 | partial generation fixed8 + regenerate isolation | design/R3 | fixture6 valid+1 failed+1 empty→fixed IDs8; each editable payload or failure reason+Regenerate; empty Publish disabled; one Regenerate selected write1/other7 write0 |
| OSMU-V421-TC-030 | AC-30/FR-29,NFR-02,11 | retry/repair/reconcile taxonomy | design/R3 | confirmed failure Retry adapter1; provider-success+persistence-failure repair1/adapter0; timeout/unknown reconcile first+terminal 전 adapter0; all other7=0; published retry adapter0 duplicate0 |
| OSMU-V421-TC-031 | AC-31/FR-30,NFR-04,11 | readiness disabled + explicit selected/bulk | design/R3 | cards/drafts/edit/save8/8; unavailable Publish disabled+condition; generate/save implicit bulk0; selected/all은 별도 action+review+confirm |

#### v4.2.1 gate

- TC-029는 6 valid+1 generation_failed+1 empty fixture에서 fixed platform IDs 8개를 확인한다. 카드 누락/전체 재생성은 FAIL.
- empty payload Publish disabled, generation_failed reason+Regenerate, 단일 Regenerate의 other7 write0을 함께 assertion한다.
- TC-030은 confirmed failure, provider-success+persistence-failure, timeout/unknown을 별도 fixture로 실행한다.
- provider adapter retry1은 confirmed failure에만 허용한다. persistence repair는 adapter0, unknown은 terminal 전 adapter0이다.
- plan approval은 V421 TC31/31과 independent critic MAJOR0 이후다.

### 2026-08-05 OSMU v4.3.0 actual surface inventory plan reopen AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.3.0-gpt-codex.md` §17. V421의 safety/migration/recovery 계약을 보존하되 Studio visual7, backend text8, video3, Settings/account, notification4를 분리하고 기존 Studio 기능9개와 target continuity를 명시한다.
>
> **❌ superseded:** shell baseline이 정량화되지 않았고 기존 9기능이 TC-032 하나로 묶여 failure/edge와 rights-policy gate를 판정할 수 없다. 후속 정본 후보는 v4.3.1과 `OSMU-V431-TC-*`다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V43-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V43-TC-002 | AC-02/FR-02,NFR-08 | shell preservation | R0/design | sidebar/route/settings/tab orphan·invented nav 0 |
| OSMU-V43-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V43-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V43-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V43-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V43-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V43-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V43-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V43-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V43-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V43-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V43-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V43-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V43-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V43-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V43-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V43-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V43-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V43-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V43-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V43-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V43-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V43-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V43-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | explicit F4 start + cohort branches + delivery outcome | F4 | approval 뒤 Start F4→immutable f4_started_at exactly1; A cutoff=delivered100 또는 start+30d 먼저, consented<10 stop; fixture day30 qualified0 consented0에서 F1~F3/paid stopped·new work/budget0·snapshot; first-qualified timer 사용0; failed delivery denominator0/audit 보존; B threshold stop |
| OSMU-V43-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v4.2.1 fixed text8 Studio/v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V43-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V43-TC-028 | AC-28/FR-26,NFR-10 | active initial-bet circuit breaker | R0~R3 | running at1679→minute1680: next side effect 전 breaker, atomic commit/rollback, safe checkpoint 5필드, R0~R3/F1~F4 stopped, minute1681 side effect0 |
| OSMU-V43-TC-029 | AC-29/FR-28,NFR-11 | visual7 partial generation + regenerate isolation | design/R3 | fixture5 valid+1 failed+1 empty→fixed IDs `threads,x,facebook,instagram,shorts,reels,tiktok` exactly7; Discord/Slack card0; failed reason+Regenerate; empty Publish disabled; one Regenerate selected write1/other6 write0 |
| OSMU-V43-TC-030 | AC-30/FR-29,NFR-02,11 | card Publish retry/repair/reconcile isolation | design/R3 | selected adapter1/other6=0; confirmed failure Retry adapter1; provider-success+persistence-failure repair1/adapter0; timeout/unknown reconcile first+terminal 전 adapter0; published retry adapter0 duplicate0 |
| OSMU-V43-TC-031 | AC-31/FR-30,NFR-04,12 | historical bulk vs target card provenance | design/R3 | current selected/bulk=`legacy_bulk`, target per-card=`card_publish`; generate/save implicit bulk0; selected/all explicit review+confirm; readiness 없는 Publish disabled |
| OSMU-V43-TC-032 | AC-32/FR-31,NFR-08 | historical Studio function preservation | design/R3 | Wiki/RepoConnect·direct source·OSMU generation·AI auto-draft·image/video generation·platform edit/save·history load·immediate Publish·schedule 9/9 RTM, orphan0 |
| OSMU-V43-TC-033 | AC-33/FR-32,NFR-04,12 | surface inventory six-axis truth | R0/design | Studio visual7/backend text8/video3/Settings-account/notification4 별도 section; visible/generatable/editable/publishable/schedulable/prod-observed 6축; Discord/Slack Studio card0, messaging/publish 혼합0 |
| OSMU-V43-TC-034 | AC-34/FR-33,NFR-12 | Inbox/Calendar continuity target truth | R0/design | current shared-continuity claim0; target label100%; 실제 bridge/dual-read evidence 전 existing 표현0 |

#### v4.3.0 gate

- V43 TC는 AC 34/34와 1:1이며, RTM orphan은 0이어야 한다.
- historical Studio visual7과 보존 기능9개 중 누락 1개, Discord·Slack Studio card 1개면 FAIL이다.
- backend text adapter·video publisher·Settings/account·notification을 Studio visual card와 합친 ‘지원 플랫폼’ 단일 count는 FAIL이다.
- `legacy_bulk`와 `card_publish` provenance, selected/bulk explicit action, card Publish other6=0을 함께 assertion한다.
- Inbox/Calendar continuity는 shared identity·bridge·dual-read 관찰 전 target으로만 표기한다.
- retry/repair/reconcile taxonomy는 V421에서 후퇴 0이어야 한다.
- plan approval은 V43 TC34/34와 independent critic MAJOR0 이후다.

### 2026-08-05 OSMU v4.3.1 critic MAJOR2 shell·9기능 preservation retake AC → QA TC 등록

> 정본 후보: `docs/openclaw-auto-osmu-prd-v4.3.1-gpt-codex.md` §17. V43의 34개 계약을 보존하고 shell manifest, 9기능 독립 fixture, copyright·AI commercial·API policy gate를 추가한다.

| TC | AC/FR | 검증 목표 | Slice | 종료증거 |
|---|---|---|---|---|
| OSMU-V431-TC-001 | AC-01/FR-01 | capability inventory | R0 | text8/video3/extensions15, 범주 혼합 0 |
| OSMU-V431-TC-002 | AC-02/FR-02,NFR-08 | quantified shell preservation | R0/design | 1024 customer26 accessible; 390 current direct15 accessible+SidebarGroup11 hidden defect→target26 accessible; group9/operator1/direct15+dynamic11/Settings9·8/provider tabs3·5·3·0/token15×2/sidebar224; delete/rename/move0, invented nav0, unexplained diff0; documented mobile visibility repair1 |
| OSMU-V431-TC-003 | AC-03/FR-19,NFR-04 | readiness truth | R0 | disabled reason/action/owner/evidence time |
| OSMU-V431-TC-004 | AC-04/FR-01,18 | extension 15 full contract | R0/F3 | 15/15 loader/credential/tenant/media/result/permalink/queue/disposition, queue 3개만 |
| OSMU-V431-TC-005 | AC-05/FR-08 | OAuth state+cookie concurrent replay | R1 | same state+cookie 20 concurrent: nonce consume/token endpoint/account write exactly1, 19 pre-external reject |
| OSMU-V431-TC-006 | AC-06/FR-09 | account truth | R1 | four-surface identity/scope/state/time/CTA diff 0 |
| OSMU-V431-TC-007 | AC-07/FR-09,NFR-01 | account selection/isolation | R1 | two-account target 일치, cross-tenant call 0 |
| OSMU-V431-TC-008 | AC-08/FR-03 | stable source identity | R2 | 네 경로 tenant ID+provenance |
| OSMU-V431-TC-009 | AC-09/FR-04 | explicit Studio↔queue bridge | R2 | same source, orphan 0 |
| OSMU-V431-TC-010 | AC-10/FR-05 | migration authority sequence | R2 | M0→M8 순서, 단계별 writer/read authority diff 0, premature entry 0 |
| OSMU-V431-TC-011 | AC-11/FR-06,23,NFR-06 | reverse replay/rollback | R2 | 각 단계 fault+M5 이후 신규100, JSON rollback 100/100, loss/duplicate/drift 0 |
| OSMU-V431-TC-012 | AC-12/FR-07 | target variant independence | R2/R3 | cross-overwrite 0 |
| OSMU-V431-TC-013 | AC-13/FR-10,11,NFR-02 | dispatch concurrency | R3 | no-draft same intent 20 concurrent external result ≤1 |
| OSMU-V431-TC-014 | AC-14/FR-12,NFR-03 | persistence-only repair | R3 | provider success/DB failure 뒤 republish 0 |
| OSMU-V431-TC-015 | AC-15/FR-13 | provider recovery | R3/F1 | enabled adapter ID+permalink 또는 terminal reason |
| OSMU-V431-TC-016 | AC-16/FR-14 | result group | R3 | mixed target independent state/ID/link/time |
| OSMU-V431-TC-017 | AC-17/FR-15 | partial retry | R3 | failed만 호출, success duplicate 0 |
| OSMU-V431-TC-018 | AC-18/FR-21,NFR-04 | fake link 금지 | R3 | provider home URL result 표시 0 |
| OSMU-V431-TC-019 | AC-19/FR-16 | video terminal truth | F2 | terminal 전 processing, 뒤만 published+link |
| OSMU-V431-TC-020 | AC-20/FR-17 | YouTube result parity | F2 | ID/link/status persistence+recovery, duplicate 0 |
| OSMU-V431-TC-021 | AC-21/FR-16,17 | video 3 readiness | F2 | target별 E2E 또는 disabled reason/action |
| OSMU-V431-TC-022 | AC-22/FR-18 | extension disposition/repair | F3 | 15/15 decision, 승인된 1개만 repair, 미검증 노출 0 |
| OSMU-V431-TC-023 | AC-23/FR-20,22,NFR-07 | revoke/incident trace | R1~F3 | revoke call 0, evidence·owner·action trace |
| OSMU-V431-TC-024 | AC-24/FR-24,NFR-01,05 | tenant/privacy isolation | R1~F3 | 2tenant×2account cross 0, raw leak 0 |
| OSMU-V431-TC-025 | AC-25/FR-27,F4,BM,NFR-10 | explicit F4 start + cohort branches + delivery outcome | F4 | approval 뒤 Start F4→immutable f4_started_at exactly1; A cutoff=delivered100 또는 start+30d 먼저, consented<10 stop; fixture day30 qualified0 consented0에서 F1~F3/paid stopped·new work/budget0·snapshot; first-qualified timer 사용0; failed delivery denominator0/audit 보존; B threshold stop |
| OSMU-V431-TC-026 | AC-26/전체 | RTM/supersession | plan | orphan 0, v4.2.1 fixed text8 Studio/v3.1.1/DESIGN v6 target 근거 0 |
| OSMU-V431-TC-027 | AC-27/FR-25,NFR-09 | rights/delete/backup expiry | F4 | 승인전 cohort0; 30d raw/180d evidence/7d active delete; 삭제+30d backup restore/read 불가 또는 disclosed legal hold; access audit·철회 dispatch0 |
| OSMU-V431-TC-028 | AC-28/FR-26,NFR-10 | active initial-bet circuit breaker | R0~R3 | running at1679→minute1680: next side effect 전 breaker, atomic commit/rollback, safe checkpoint 5필드, R0~R3/F1~F4 stopped, minute1681 side effect0 |
| OSMU-V431-TC-029 | AC-29/FR-28,NFR-11 | visual7 partial generation + regenerate isolation | design/R3 | fixture5 valid+1 failed+1 empty→fixed IDs `threads,x,facebook,instagram,shorts,reels,tiktok` exactly7; Discord/Slack card0; failed reason+Regenerate; empty Publish disabled; one Regenerate selected write1/other6 write0 |
| OSMU-V431-TC-030 | AC-30/FR-29,NFR-02,11 | card Publish retry/repair/reconcile isolation | design/R3 | selected adapter1/other6=0; confirmed failure Retry adapter1; provider-success+persistence-failure repair1/adapter0; timeout/unknown reconcile first+terminal 전 adapter0; published retry adapter0 duplicate0 |
| OSMU-V431-TC-031 | AC-31/FR-30,NFR-04,12 | historical bulk vs target card provenance | design/R3 | current selected/bulk=`legacy_bulk`, target per-card=`card_publish`; generate/save implicit bulk0; selected/all explicit review+confirm; readiness 없는 Publish disabled |
| OSMU-V431-TC-032 | AC-32/FR-31,NFR-08 | RepoConnect sync/provenance | design/R3 | happy repo/path/hash/source match; auth/timeout/empty/repo-switch에서 existing overwrite0, provenance mix0, reason+retry |
| OSMU-V431-TC-033 | AC-33/FR-32,NFR-04,12 | surface inventory six-axis truth | R0/design | Studio visual7/backend text8/video3/Settings-account/notification4 별도 section; visible/generatable/editable/publishable/schedulable/prod-observed 6축; Discord/Slack Studio card0, messaging/publish 혼합0 |
| OSMU-V431-TC-034 | AC-34/FR-33,NFR-12 | Inbox/Calendar continuity target truth | R0/design | current shared-continuity claim0; target label100%; 실제 bridge/dual-read evidence 전 existing 표현0 |
| OSMU-V431-TC-035 | AC-35/FR-34 | direct source validation | design/R3 | happy direct intent1/provenance; whitespace/oversize/unsafe external-call0, prior source/draft overwrite0 |
| OSMU-V431-TC-036 | AC-36/FR-35,NFR-11 | visual7 OSMU generation | design/R3 | happy IDs7; 5 valid+1 failed+1 empty slot7, regenerate selected1/other6 write0 |
| OSMU-V431-TC-037 | AC-37/FR-36,NFR-02,12 | AI auto-draft save/recovery | design/R3 | provenance/model/source reload; provider error/timeout false-saved0; replay20 same-intent draft≤1 |
| OSMU-V431-TC-038 | AC-38/FR-37,42,NFR-13 | image-video asset/link/failure | design/R3 | asset/type/model/rights/surface link; fail/unsafe/unsupported/rights-unknown publish-schedule0, orphan0 |
| OSMU-V431-TC-039 | AC-39/FR-38,NFR-11 | per-platform edit/save isolation | design/R3 | selected write1/reload parity/other6=0; stale/concurrent conflict explicit, silent overwrite0 |
| OSMU-V431-TC-040 | AC-40/FR-39,NFR-03,04 | history state restore | design/R3 | draft/status/result/reconciliation parity; missing/corrupt/legacy false-published0, recovery action, source row mutation0 |
| OSMU-V431-TC-041 | AC-41/FR-40,29,30,NFR-02,12 | immediate bulk/card publish | design/R3 | legacy_bulk selected IDs/card_publish single ID; implicit0; confirmed retry1, repair0, unknown reconcile, success duplicate0 |
| OSMU-V431-TC-042 | AC-42/FR-41,NFR-02,12 | schedule lifecycle | design/R3 | create/change/cancel/due exactly1; invalid/past/DST/unready create0; cancel call0; concurrent20 result≤1 |
| OSMU-V431-TC-043 | AC-43/FR-42,NFR-05,13 | copyright-AI-commercial-API policy gate | R0/design/R3 | owner+rights+AI terms/commercial+API policy valid only; unassigned/unknown/expired/conflict/prohibited/revoked adapter0; raw leak0 |

#### v4.3.1 gate

- V431 TC는 AC 43/43과 1:1이며 RTM orphan0이다.
- TC-002는 1024 customer26 accessible과 390 current15 accessible+SidebarGroup11 hidden defect를 재현하고 target26 accessible을 확인한다. group9·operator1·route15+11·Settings9/8·provider tabs·token15×2·sidebar224를 잠그며, 삭제·리네임·이동·invented nav·설명없는 diff는 각각0이고 documented mobile visibility repair만 1이다.
- 기존 9기능은 TC-032·035~042의 독립 9개 ID다. 하나라도 묶음 PASS하거나 happy/failure-edge 중 한쪽이 없으면 FAIL이다.
- TC-043은 owner/rights/AI commercial/API policy evidence가 unknown·expired·conflict일 때 immediate/bulk/card/schedule adapter0을 assertion한다.
- V43의 visual7, surface 6축, continuity target, retry/repair/reconcile 계약은 후퇴0이다.
- plan approval은 V431 TC43/43과 independent critic MAJOR0 이후다.

### 2026-08-06 Marketing Hub PRD v5.1 — 설계 QA 계약 등록 (미실행)

> 정본: `docs/openclaw-auto-marketing-hub-prd-v5.1.0-gpt-codex.md`. 아래 48건은 **등록만 했으며 실행 PASS가 아니다**. 각 행의 Given/When/Then, happy+edge, 입력·상태·external-call ceiling·종료증거는 정본 FR/AC/TC 표의 같은 ID가 완전한 계약이다.

| TC | FR/AC | 검증 목표 | 종료증거 |
|---|---|---|---|
| MH-V51-TC-001 | FR/AC-MH-001 | tenant isolation | A/B API·DOM leak0 |
| MH-V51-TC-002 | FR/AC-MH-002 | role shell | customer/operator snapshots |
| MH-V51-TC-003 | FR/AC-MH-003 | canonical fields | schema/readback |
| MH-V51-TC-004 | FR/AC-MH-004 | connection state machine | transition log |
| MH-V51-TC-005 | FR/AC-MH-005 | atomic callback | rollback/readback |
| MH-V51-TC-006 | FR/AC-MH-006 | Settings/Studio/channel diff0 | diff report |
| MH-V51-TC-007 | FR/AC-MH-007 | Meta wrong session | identity/relogin UI |
| MH-V51-TC-008 | FR/AC-MH-008 | replay/cancel | nonce audit |
| MH-V51-TC-009 | FR/AC-MH-009 | two accounts | selected-card proof |
| MH-V51-TC-010 | FR/AC-MH-010 | manual recovery | masked advanced UI |
| MH-V51-TC-011 | FR/AC-MH-011 | target 11 manifest | inventory |
| MH-V51-TC-012 | FR/AC-MH-012 | visual7/direct4 baseline | snapshot |
| MH-V51-TC-013 | FR/AC-MH-013 | Discord/Slack additive | cards |
| MH-V51-TC-014 | FR/AC-MH-014 | capability fields | disabled CTA DOM |
| MH-V51-TC-015 | FR/AC-MH-015 | source draft persistence | DB/UI |
| MH-V51-TC-016 | FR/AC-MH-016 | per-card isolation | edit diff |
| MH-V51-TC-017 | FR/AC-MH-017 | per-card validation | mixed fixture |
| MH-V51-TC-018 | FR/AC-MH-018 | single immediate job | ledger |
| MH-V51-TC-019 | FR/AC-MH-019 | bulk independent outcomes | results |
| MH-V51-TC-020 | FR/AC-MH-020 | concurrency20 C≤1 | provider call log |
| MH-V51-TC-021 | FR/AC-MH-021 | 502 terminal failure | retry evidence |
| MH-V51-TC-022 | FR/AC-MH-022 | timeout uncertain | reconcile CTA |
| MH-V51-TC-023 | FR/AC-MH-023 | repair lookup-first | call trace |
| MH-V51-TC-024 | FR/AC-MH-024 | permalink readback | link evidence |
| MH-V51-TC-025 | FR/AC-MH-025 | partial retry | no success duplicate |
| MH-V51-TC-026 | FR/AC-MH-026 | provenance invariants | invariant audit |
| MH-V51-TC-027 | FR/AC-MH-027 | job authority bridge | UI/audit |
| MH-V51-TC-028 | FR/AC-MH-028 | orphan/missing/stale | reconcile report |
| MH-V51-TC-029 | FR/AC-MH-029 | schedule create | stored instant |
| MH-V51-TC-030 | FR/AC-MH-030 | schedule change CAS | version audit |
| MH-V51-TC-031 | FR/AC-MH-031 | schedule cancel | no due dispatch |
| MH-V51-TC-032 | FR/AC-MH-032 | DST gap/fold | confirmation UI |
| MH-V51-TC-033 | FR/AC-MH-033 | due race C≤1 | lease log |
| MH-V51-TC-034 | FR/AC-MH-034 | credential revoke | dispatch blocked |
| MH-V51-TC-035 | FR/AC-MH-035 | Inbox origin | labels |
| MH-V51-TC-036 | FR/AC-MH-036 | Calendar bridge | recover navigation |
| MH-V51-TC-037 | FR/AC-MH-037 | video hand-off | `/videos` route proof |
| MH-V51-TC-038 | FR/AC-MH-038 | disabled/external truth | copy audit |
| MH-V51-TC-039 | FR/AC-MH-039 | landing no-overclaim | audit diff |
| MH-V51-TC-040 | FR/AC-MH-040 | 25 route matrix | manifest |
| MH-V51-TC-041 | FR/AC-MH-041 | 26 sidebar routes | navigation log |
| MH-V51-TC-042 | FR/AC-MH-042 | 390 mobile nav | tap video |
| MH-V51-TC-043 | FR/AC-MH-043 | overflow0/44px/focus | measurements |
| MH-V51-TC-044 | FR/AC-MH-044 | loading/empty/error/permission | 25-route report |
| MH-V51-TC-045 | FR/AC-MH-045 | services terminal state | screenshot |
| MH-V51-TC-046 | FR/AC-MH-046 | operator secret audit | audit log |
| MH-V51-TC-047 | FR/AC-MH-047 | correlation observability | trace |
| MH-V51-TC-048 | FR/AC-MH-048 | full E2E gate | signed QA record |

#### v5.1 gate

- PRD traceability와 QA tracker는 `001..048` 1:1, orphan 0이어야 한다.
- 실행 전에는 모든 항목이 미실행이며, fixture PASS는 provider/운영 실증을 대체하지 않는다.

### 2026-08-06 Marketing Hub PRD v5.2 — V52 QA 계약 등록 (미실행)

> 정본 `docs/openclaw-auto-marketing-hub-prd-v5.2.0-gpt-codex.md`; 각 TC의 H/F Given/When/Then·fault·C cap·terminal evidence는 정본의 같은 행에 있다. FR과 AC는 의도적으로 분리 열이다.

| TC | FR | AC | 검증/종료증거 |
|---|---|---|---|
|MH-V52-TC-001|FR-MH-001|AC-MH-001|A/B leak0|
|MH-V52-TC-002|FR-MH-002|AC-MH-002|role snapshots|
|MH-V52-TC-003|FR-MH-003|AC-MH-003|canonical readback|
|MH-V52-TC-004|FR-MH-004|AC-MH-004|transition log|
|MH-V52-TC-005|FR-MH-005|AC-MH-005|atomic rollback|
|MH-V52-TC-006|FR-MH-006|AC-MH-006|three view diff0|
|MH-V52-TC-007|FR-MH-007|AC-MH-007|A→B→B adapter1/A0|
|MH-V52-TC-008|FR-MH-008|AC-MH-008|nonce audit|
|MH-V52-TC-009|FR-MH-009|AC-MH-009|two-account selection|
|MH-V52-TC-010|FR-MH-010|AC-MH-010|manual masked|
|MH-V52-TC-011|FR-MH-011|AC-MH-011|target11|
|MH-V52-TC-012|FR-MH-012|AC-MH-012|visual7/direct4|
|MH-V52-TC-013|FR-MH-013|AC-MH-013|Discord/Slack|
|MH-V52-TC-014|FR-MH-014|AC-MH-014|capability7|
|MH-V52-TC-015|FR-MH-015|AC-MH-015|draft reload|
|MH-V52-TC-016|FR-MH-016|AC-MH-016|edit isolation|
|MH-V52-TC-017|FR-MH-017|AC-MH-017|validation|
|MH-V52-TC-018|FR-MH-018|AC-MH-018|card job|
|MH-V52-TC-019|FR-MH-019|AC-MH-019|bulk results|
|MH-V52-TC-020|FR-MH-020|AC-MH-020|20≤1|
|MH-V52-TC-021|FR-MH-021|AC-MH-021|502 confirmed|
|MH-V52-TC-022|FR-MH-022|AC-MH-022|uncertain reconcile|
|MH-V52-TC-023|FR-MH-023|AC-MH-023|repair adapter0|
|MH-V52-TC-024|FR-MH-024|AC-MH-024|permalink|
|MH-V52-TC-025|FR-MH-025|AC-MH-025|failed-only retry|
|MH-V52-TC-026|FR-MH-026|AC-MH-026|four origins|
|MH-V52-TC-027|FR-MH-027|AC-MH-027|job authority|
|MH-V52-TC-028|FR-MH-028|AC-MH-028|drift report|
|MH-V52-TC-029|FR-MH-029|AC-MH-029|schedule create|
|MH-V52-TC-030|FR-MH-030|AC-MH-030|CAS change|
|MH-V52-TC-031|FR-MH-031|AC-MH-031|cancel|
|MH-V52-TC-032|FR-MH-032|AC-MH-032|DST|
|MH-V52-TC-033|FR-MH-033|AC-MH-033|due lease|
|MH-V52-TC-034|FR-MH-034|AC-MH-034|revoke block|
|MH-V52-TC-035|FR-MH-035|AC-MH-035|Inbox label|
|MH-V52-TC-036|FR-MH-036|AC-MH-036|Calendar bridge|
|MH-V52-TC-037|FR-MH-037|AC-MH-037|video handoff|
|MH-V52-TC-038|FR-MH-038|AC-MH-038|disabled/external|
|MH-V52-TC-039|FR-MH-039|AC-MH-039|landing audit|
|MH-V52-TC-040|FR-MH-040|AC-MH-040|route25|
|MH-V52-TC-041|FR-MH-041|AC-MH-041|1024 nav26 logs|
|MH-V52-TC-042|FR-MH-042|AC-MH-042|390 nav26 logs|
|MH-V52-TC-043|FR-MH-043|AC-MH-043|25 overflow0/44/focus|
|MH-V52-TC-044|FR-MH-044|AC-MH-044|L/E/E/P terminal|
|MH-V52-TC-045|FR-MH-045|AC-MH-045|services terminal|
|MH-V52-TC-046|FR-MH-046|AC-MH-046|operator audit|
|MH-V52-TC-047|FR-MH-047|AC-MH-047|correlation trace|
|MH-V52-TC-048|FR-MH-048|AC-MH-048|signed E2E gate|

#### V52 gate

- V52 FR/AC/TC 48/48/48 and each exact pair is required; these are registered, not executed.
## ❌ NG — DESIGN v13 기존 자산·역할·반응형·디자인시스템 미보존 (2026-08-06)

- **사용자 관찰:** 최종 프로토타입에서 기존 아이콘/에셋이 사라지고, 실제 반응형 구조·사용자 역할별 화면·
  디자인시스템이 반영되지 않았다.
- **직접 대조:** v13은 텍스트 중심 sidebar와 범용 카드로 재작성됐고, 실제 `getChannelIcon()` 아이콘 체계,
  current Sidebar/AuthGate의 customer/operator 분기, globals/token/component 구조를 정확히 재현한 증거가 없다.
- **원인:** 최초 product-designer가 산출 파일 0 상태로 지연되자 일반 worker에게 HTML 제작을 넘겼고,
  후속 product-designer 검수도 기능 수량/overflow/CTA에 치우쳐 visual asset·role-state·design-token fidelity를
  차단 조건으로 검사하지 않았다. `verify-agent-quality.sh`도 Skill0/Web0 FAIL이었는데 경고 출고했다.
- **판정:** v13 design 승인 후보 철회. 제품 코드·배포 완료 주장은 없음.
- **재검증 종료조건:** actual icons/assets manifest 100%, customer/operator/public/auth/empty/error/connected
  role-state matrix, current responsive shell 1440/1024/390, design tokens/components diff, 25 route visual comparison,
  core OSMU flow 클릭, console0/overflow0/touch44를 product-designer transcript+부모 Chrome에서 직접 관찰한다.

### 2026-08-06 OSMU Marketing Agent PRD v6.0 — MA-V6 plan TC 등록 (전부 ⬜ 미실행)

> 정본: `docs/openclaw-auto-marketing-agent-prd-v6.0.0-gpt-codex.md` §11. 이 섹션은 **V6 plan namespace만** 소유한다. 기존 MH-V51/V52·제품 QA 상태를 변경하지 않는다. 모든 TC는 정본의 happy+failure Given/When/Then과 evidence를 함께 충족해야 하며, 코드·fixture PASS는 운영/provider 증거를 대체하지 않는다.

| 상태 | TC | FR | AC | 검증 주제 |
|---|---|---|---|---|
|⬜|MA-V6-TC-001|FR-MA-001|AC-MA-001|tenant isolation/leak0|
|⬜|MA-V6-TC-002|FR-MA-002|AC-MA-002|brand source4 onboarding|
|⬜|MA-V6-TC-003|FR-MA-003|AC-MA-003|fact/inference/unverified|
|⬜|MA-V6-TC-004|FR-MA-004|AC-MA-004|grounding citations|
|⬜|MA-V6-TC-005|FR-MA-005|AC-MA-005|source errors/redaction|
|⬜|MA-V6-TC-006|FR-MA-006|AC-MA-006|account truth diff0|
|⬜|MA-V6-TC-007|FR-MA-007|AC-MA-007|wrong-account A→B|
|⬜|MA-V6-TC-008|FR-MA-008|AC-MA-008|manual recovery only|
|⬜|MA-V6-TC-009|FR-MA-009|AC-MA-009|autonomy audit|
|⬜|MA-V6-TC-010|FR-MA-010|AC-MA-010|irreversible approval hash|
|⬜|MA-V6-TC-011|FR-MA-011|AC-MA-011|opportunity inbox sources|
|⬜|MA-V6-TC-012|FR-MA-012|AC-MA-012|no false zero|
|⬜|MA-V6-TC-013|FR-MA-013|AC-MA-013|rank evidence|
|⬜|MA-V6-TC-014|FR-MA-014|AC-MA-014|marketing brief7|
|⬜|MA-V6-TC-015|FR-MA-015|AC-MA-015|weekly plan7d|
|⬜|MA-V6-TC-016|FR-MA-016|AC-MA-016|honest planning hold|
|⬜|MA-V6-TC-017|FR-MA-017|AC-MA-017|command center deep-links|
|⬜|MA-V6-TC-018|FR-MA-018|AC-MA-018|text8+video3 truth|
|⬜|MA-V6-TC-019|FR-MA-019|AC-MA-019|validation/no mutation|
|⬜|MA-V6-TC-020|FR-MA-020|AC-MA-020|isolated edit/conflict|
|⬜|MA-V6-TC-021|FR-MA-021|AC-MA-021|campaign lineage|
|⬜|MA-V6-TC-022|FR-MA-022|AC-MA-022|review completeness|
|⬜|MA-V6-TC-023|FR-MA-023|AC-MA-023|Inbox origin truth|
|⬜|MA-V6-TC-024|FR-MA-024|AC-MA-024|video handoff|
|⬜|MA-V6-TC-025|FR-MA-025|AC-MA-025|approved-only execute|
|⬜|MA-V6-TC-026|FR-MA-026|AC-MA-026|idempotency20|
|⬜|MA-V6-TC-027|FR-MA-027|AC-MA-027|published proof/permalink|
|⬜|MA-V6-TC-028|FR-MA-028|AC-MA-028|partial result truth|
|⬜|MA-V6-TC-029|FR-MA-029|AC-MA-029|confirmed retry|
|⬜|MA-V6-TC-030|FR-MA-030|AC-MA-030|uncertain reconcile-first|
|⬜|MA-V6-TC-031|FR-MA-031|AC-MA-031|repair without repost|
|⬜|MA-V6-TC-032|FR-MA-032|AC-MA-032|schedule DST/CAS/lease|
|⬜|MA-V6-TC-033|FR-MA-033|AC-MA-033|502 trace/redaction|
|⬜|MA-V6-TC-034|FR-MA-034|AC-MA-034|metric provenance|
|⬜|MA-V6-TC-035|FR-MA-035|AC-MA-035|comparison integrity|
|⬜|MA-V6-TC-036|FR-MA-036|AC-MA-036|campaign analytics|
|⬜|MA-V6-TC-037|FR-MA-037|AC-MA-037|sample-aware insight|
|⬜|MA-V6-TC-038|FR-MA-038|AC-MA-038|tenant-scoped learning|
|⬜|MA-V6-TC-039|FR-MA-039|AC-MA-039|next experiment fields|
|⬜|MA-V6-TC-040|FR-MA-040|AC-MA-040|loop closure|
|⬜|MA-V6-TC-041|FR-MA-041|AC-MA-041|alert lifecycle|
|⬜|MA-V6-TC-042|FR-MA-042|AC-MA-042|safe actions only|
|⬜|MA-V6-TC-043|FR-MA-043|AC-MA-043|route25/sidebar26 preservation|
|⬜|MA-V6-TC-044|FR-MA-044|AC-MA-044|additive IA|
|⬜|MA-V6-TC-045|FR-MA-045|AC-MA-045|asset/theme/role fidelity|
|⬜|MA-V6-TC-046|FR-MA-046|AC-MA-046|390/1024 navigation/access|
|⬜|MA-V6-TC-047|FR-MA-047|AC-MA-047|terminal state matrix|
|⬜|MA-V6-TC-048|FR-MA-048|AC-MA-048|production full-loop evidence|

#### MA-V6 plan gate

- 등록 커버리지: FR 48 / AC 48 / TC 48, same-number orphan 0.
- 현재 실행: 0/48. plan-critic MAJOR0와 `/approve plan` 전 design/eng-design/build/QA 진입 금지.
- Trust circuit breaker: cross-tenant/private leak, wrong-account call, unapproved irreversible action, fake metric, duplicate same-intent post 중 1건이면 release blocked.

### 2026-08-06 OSMU Marketing Agent PRD v6.1 — MA-V61 plan TC 등록 (전부 ⬜ 미실행)

> 정본: `docs/openclaw-auto-marketing-agent-prd-v6.1.0-gpt-codex.md` §11. V6.0을 덮지 않는 critic MAJOR4 retake namespace다. 2주 proof는 internal1+external≤3, source1/opportunity1/campaign1/Threads1/card1/per-post approval/permalink1/metric-or-hold1/experiment decision1이며, TC detail/evidence는 정본이 이긴다.

| 상태 | TC | FR | AC | 주제 |
|---|---|---|---|---|
|⬜|MA-V61-TC-001|FR-MA-001|AC-MA-001|tenant isolation|
|⬜|MA-V61-TC-002|FR-MA-002|AC-MA-002|source preservation|
|⬜|MA-V61-TC-003|FR-MA-003|AC-MA-003|truth classes|
|⬜|MA-V61-TC-004|FR-MA-004|AC-MA-004|citation|
|⬜|MA-V61-TC-005|FR-MA-005|AC-MA-005|source errors|
|⬜|MA-V61-TC-006|FR-MA-006|AC-MA-006|account diff0|
|⬜|MA-V61-TC-007|FR-MA-007|AC-MA-007|wrong-account|
|⬜|MA-V61-TC-008|FR-MA-008|AC-MA-008|manual recovery|
|⬜|MA-V61-TC-009|FR-MA-009|AC-MA-009|L2 policy|
|⬜|MA-V61-TC-010|FR-MA-010|AC-MA-010|approval hash target|
|⬜|MA-V61-TC-011|FR-MA-011|AC-MA-011|opportunity source1|
|⬜|MA-V61-TC-012|FR-MA-012|AC-MA-012|no false zero|
|⬜|MA-V61-TC-013|FR-MA-013|AC-MA-013|rank evidence|
|⬜|MA-V61-TC-014|FR-MA-014|AC-MA-014|brief|
|⬜|MA-V61-TC-015|FR-MA-015|AC-MA-015|plan1|
|⬜|MA-V61-TC-016|FR-MA-016|AC-MA-016|sample hold|
|⬜|MA-V61-TC-017|FR-MA-017|AC-MA-017|`/` additive|
|⬜|MA-V61-TC-018|FR-MA-018|AC-MA-018|current card truth|
|⬜|MA-V61-TC-019|FR-MA-019|AC-MA-019|validation|
|⬜|MA-V61-TC-020|FR-MA-020|AC-MA-020|edit/save adapter0|
|⬜|MA-V61-TC-021|FR-MA-021|AC-MA-021|full bidirectional lineage|
|⬜|MA-V61-TC-022|FR-MA-022|AC-MA-022|per-post review|
|⬜|MA-V61-TC-023|FR-MA-023|AC-MA-023|exact provenance4|
|⬜|MA-V61-TC-024|FR-MA-024|AC-MA-024|video preservation|
|⬜|MA-V61-TC-025|FR-MA-025|AC-MA-025|selected adapter1/others0|
|⬜|MA-V61-TC-026|FR-MA-026|AC-MA-026|idempotency20|
|⬜|MA-V61-TC-027|FR-MA-027|AC-MA-027|real permalink|
|⬜|MA-V61-TC-028|FR-MA-028|AC-MA-028|bulk explicit IDs/partial|
|⬜|MA-V61-TC-029|FR-MA-029|AC-MA-029|confirmed retry|
|⬜|MA-V61-TC-030|FR-MA-030|AC-MA-030|reconcile-first|
|⬜|MA-V61-TC-031|FR-MA-031|AC-MA-031|repair adapter0|
|⬜|MA-V61-TC-032|FR-MA-032|AC-MA-032|single+bulk schedule4|
|⬜|MA-V61-TC-033|FR-MA-033|AC-MA-033|502 trace|
|⬜|MA-V61-TC-034|FR-MA-034|AC-MA-034|native metric provenance|
|⬜|MA-V61-TC-035|FR-MA-035|AC-MA-035|comparison deferred truth|
|⬜|MA-V61-TC-036|FR-MA-036|AC-MA-036|campaign1 measure|
|⬜|MA-V61-TC-037|FR-MA-037|AC-MA-037|insight/sample-hold|
|⬜|MA-V61-TC-038|FR-MA-038|AC-MA-038|legacy learning no overclaim|
|⬜|MA-V61-TC-039|FR-MA-039|AC-MA-039|experiment decision1|
|⬜|MA-V61-TC-040|FR-MA-040|AC-MA-040|next plan link|
|⬜|MA-V61-TC-041|FR-MA-041|AC-MA-041|alerts deferred|
|⬜|MA-V61-TC-042|FR-MA-042|AC-MA-042|safe action boundary|
|⬜|MA-V61-TC-043|FR-MA-043|AC-MA-043|v5.2 route/action/API/state deletion0|
|⬜|MA-V61-TC-044|FR-MA-044|AC-MA-044|additive IA|
|⬜|MA-V61-TC-045|FR-MA-045|AC-MA-045|OSMU naming/SVG/theme/role|
|⬜|MA-V61-TC-046|FR-MA-046|AC-MA-046|responsive access|
|⬜|MA-V61-TC-047|FR-MA-047|AC-MA-047|terminal states|
|⬜|MA-V61-TC-048|FR-MA-048|AC-MA-048|production full-lineage proof|

#### MA-V61 gate

- 등록: FR/AC/TC 48/48/48; 실행 0/48.
- production TC-048 evidence: browser video + real provider permalink + native metric provenance/NA + insight evidence/hold + experiment decision + next-plan link + deployed SHA.
- source4/text8+video3 신규 구현/listening/cross-provider analytics/alerts/general tenant learning/L3 일반화는 proof 전 QA 대상이 아니다.

### 2026-08-06 OSMU Marketing Agent PRD v6.1.1 — MA-V611 plan TC (전부 ⬜)

> 정본: `docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md` §11. Phase **P**=2주 proof, **R**=existing preservation, **D**=repeat-proof 이후. Exit=`P 전건 PASS + R deletion/rename/move0`; D 구현/design이 proof에 들어오면 FAIL.

| 상태 | Phase | TC | FR | AC | 주제 |
|---|---|---|---|---|---|
|⬜|P|MA-V611-TC-001|FR-MA-001|AC-MA-001|tenant isolation|
|⬜|P|MA-V611-TC-002|FR-MA-002|AC-MA-002|source1/preservation|
|⬜|P|MA-V611-TC-003|FR-MA-003|AC-MA-003|truth classes|
|⬜|P|MA-V611-TC-004|FR-MA-004|AC-MA-004|citation|
|⬜|P|MA-V611-TC-005|FR-MA-005|AC-MA-005|source errors|
|⬜|P|MA-V611-TC-006|FR-MA-006|AC-MA-006|account diff0|
|⬜|P|MA-V611-TC-007|FR-MA-007|AC-MA-007|wrong account|
|⬜|P|MA-V611-TC-008|FR-MA-008|AC-MA-008|manual recovery|
|⬜|P|MA-V611-TC-009|FR-MA-009|AC-MA-009|L2|
|⬜|P|MA-V611-TC-010|FR-MA-010|AC-MA-010|per-post approval|
|⬜|P|MA-V611-TC-011|FR-MA-011|AC-MA-011|opportunity1|
|⬜|P|MA-V611-TC-012|FR-MA-012|AC-MA-012|no false zero|
|⬜|P|MA-V611-TC-013|FR-MA-013|AC-MA-013|rank evidence|
|⬜|P|MA-V611-TC-014|FR-MA-014|AC-MA-014|brief|
|⬜|P|MA-V611-TC-015|FR-MA-015|AC-MA-015|campaign1|
|⬜|P|MA-V611-TC-016|FR-MA-016|AC-MA-016|hold|
|⬜|P|MA-V611-TC-017|FR-MA-017|AC-MA-017|`/` additive|
|⬜|P|MA-V611-TC-018|FR-MA-018|AC-MA-018|current card1|
|⬜|P|MA-V611-TC-019|FR-MA-019|AC-MA-019|validation|
|⬜|P|MA-V611-TC-020|FR-MA-020|AC-MA-020|selected diff1/others0|
|⬜|P|MA-V611-TC-021|FR-MA-021|AC-MA-021|lineage|
|⬜|P|MA-V611-TC-022|FR-MA-022|AC-MA-022|review|
|⬜|P|MA-V611-TC-023|FR-MA-023|AC-MA-023|provenance4|
|⬜|R|MA-V611-TC-024|FR-MA-024|AC-MA-024|video path preservation|
|⬜|P|MA-V611-TC-025|FR-MA-025|AC-MA-025|adapter1/others0|
|⬜|P|MA-V611-TC-026|FR-MA-026|AC-MA-026|idempotency20|
|⬜|P|MA-V611-TC-027|FR-MA-027|AC-MA-027|permalink|
|⬜|P|MA-V611-TC-028|FR-MA-028|AC-MA-028|bulk partial|
|⬜|P|MA-V611-TC-029|FR-MA-029|AC-MA-029|confirmed retry|
|⬜|P|MA-V611-TC-030|FR-MA-030|AC-MA-030|reconcile|
|⬜|P|MA-V611-TC-031|FR-MA-031|AC-MA-031|repair|
|⬜|P|MA-V611-TC-032|FR-MA-032|AC-MA-032|schedule single/bulk|
|⬜|P|MA-V611-TC-033|FR-MA-033|AC-MA-033|502 trace|
|⬜|P|MA-V611-TC-034|FR-MA-034|AC-MA-034|native metric|
|⬜|D|MA-V611-TC-035|FR-MA-035|AC-MA-035|cross-provider deferred|
|⬜|P|MA-V611-TC-036|FR-MA-036|AC-MA-036|campaign metric|
|⬜|P|MA-V611-TC-037|FR-MA-037|AC-MA-037|insight/hold|
|⬜|D|MA-V611-TC-038|FR-MA-038|AC-MA-038|general learning deferred|
|⬜|P|MA-V611-TC-039|FR-MA-039|AC-MA-039|experiment decision|
|⬜|P|MA-V611-TC-040|FR-MA-040|AC-MA-040|next plan|
|⬜|D|MA-V611-TC-041|FR-MA-041|AC-MA-041|general alerts deferred|
|⬜|P|MA-V611-TC-042|FR-MA-042|AC-MA-042|safe boundary|
|⬜|R|MA-V611-TC-043|FR-MA-043|AC-MA-043|route/action/API/state|
|⬜|R|MA-V611-TC-044|FR-MA-044|AC-MA-044|additive IA|
|⬜|R|MA-V611-TC-045|FR-MA-045|AC-MA-045|naming/SVG/theme/role|
|⬜|R|MA-V611-TC-046|FR-MA-046|AC-MA-046|responsive|
|⬜|R|MA-V611-TC-047|FR-MA-047|AC-MA-047|terminal states|
|⬜|P|MA-V611-TC-048|FR-MA-048|AC-MA-048|production lineage|

#### MA-V611 gate

- Coverage: P39 / R6 / D3 = 48; FR/AC/TC exact pair 48/48/48.
- Exit: P39/39 PASS + R6/6 deletion/rename/move0. D implementation/design count must equal 0.
- TC020 specifically requires Threads selected card diff1 after save/reload and every other current draft/source/status diff0.
## ❌ NG — Marketing Agent prototype v15 플랫폼 탐색·용어 (2026-08-06)

- 사용자 직접 관찰: 왼쪽 플랫폼 메뉴를 클릭해도 해당 플랫폼 화면이 보이지 않는다.
- 사용자 직접 관찰: `Assisted weekly loop`의 의미를 이해할 수 없다.
- 초기 판정: v15 출고 실패. 메뉴 개수·overflow 검사는 했지만 26개 목적지 각각의 실제 화면 도착을 검증하지 않았고,
  내부 기획 용어를 고객 화면에 노출했다.
- 종료조건: 26개 메뉴 전부 클릭 시 기존 owner 화면 또는 명시적 prototype 화면으로 이동하고 dead-end/console error 0;
  `Assisted weekly loop`를 회장 언어로 교체; product-designer 재리뷰와 부모 Chrome 전수 클릭 증거 확보.
- 상태: ❌ NG / design gate 잠금 / 제품 코드·배포 영향 없음.
## ❌ NG — Marketing Agent prototype v16 제품 구조·사용자 여정 (2026-08-06)

- 사용자 직접 반려: OSMU preview가 가로 한 줄로 바뀌고 Reels/Shorts/TikTok video3가 빠진 대신
  Messaging(Discord/Slack/LINE)이 OSMU 제작 대상처럼 들어갔다.
- 미검증/누락: OSMU 생성·발행 결과의 플랫폼별 Queue 반영, 전체 성과와 채널 성과의 집계 경계,
  플랫폼 공통 헤더/기능 IA, YouTube/TikTok social/video 운영, Keyword/Data/Assets/System Settings/Admin의
  사용자 목적과 owner flow, OAuth→계정/토큰 health→자동화 준비 상태.
- 사용자 직접 반려: 내부 계약 문구 `사용 근거: 고객 승인 전 외부 게시물 발행 없음 ... FR-MA-010`을 고객 카피로 노출.
- 판정: v16 출고 실패, design 승인 금지, plan 재개방. 단순 UI 패치 금지.
- 종료조건: 실제 code/wiki/Chrome 전수 감사 → 요구 원장 반영 PRD MAJOR0 → current visual authority 기반 prototype →
  user-journey E2E와 메뉴/플랫폼/role/settings/admin 전수 QA. raw OAuth access token은 화면 노출0;
  account/permission/expiry/verification/automation readiness만 안전하게 표시한다.

## ❌ NG: Marketing Agent prototype v24 전 화면 런타임 오류 (2026-08-12)

- 사용자 보고: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html`에서 Home 외 여러 화면이 빈 화면으로 끝난다.
- 초기 재현 가설: 렌더 경로의 미정의 함수 또는 안전하지 않은 참조가 `ReferenceError`를 발생시켜 `render()`를 중단한다.
- 영향 범위: Home, Studio, Settings, 채널, Operator, Videos, Blog, Calendar, journey, onboarding, connect 전체 전환 경로.
- 현재 판정: ❌ NG. 디자인 승인과 출고 금지. 실제 제품 소스와 배포에는 영향 없음.
- 종료조건: localhost에서 전 화면과 오버레이를 전환해 브라우저 콘솔 `ReferenceError` 0, 미처리 page error 0을 직접 관찰하고 390/1024 레이아웃 및 DESIGN.md 토큰 정합을 design-review로 재검수한다.
- 2026-08-12 14:05 KST 수정 상태: 🔧 DOM 런타임 복구 확인. 26개 route, 172개 상태·전환, 60개 고유 action click에서 runtime error 0, failed check 0. 중복 `class` 속성 0, 미정의 CSS custom property 0.
- 실제 Chrome 상태: 미검증. worker sandbox가 localhost bind와 Chrome CDP를 차단했다. `docs/prototype/qa-v24/v24-console-audit.mjs`에 route·tab·overlay·action 실제 click과 1440·1024·390 overflow 검사를 고정했다.
- 현재 판정 유지: ❌ NG. 실제 Chrome `runtimeErrorCount=0`과 `failed=[]` 관찰 전에는 디자인 승인과 출고 금지.

## 🔧 R-02 실제 코드 build 검증 진행 중 (2026-08-12)

- 대상: F1 드래프트 본문, F2 `channel_accounts` 연결상태 단일소스, F3 홈 DB 우선 읽기와 중복 패널 통합, F4 Admin active 필터와 accordion, ChannelPage 원시 유니코드.
- 코드 상태: commits `3fd63016`, `ea0509ab`. 전체 Vitest 131 files, 1061 passed, 10 skipped. R-02 관련 8 files, 62 tests 통과. TypeScript와 webpack build 166/166 통과.
- 현재 판정: 🔧. 현재 샌드박스의 `listen 0.0.0.0:3456`가 EPERM으로 차단돼 후속 보정분 브라우저·콘솔 재검증을 못 했다. 기존 홈 1024 캡처는 실제 폭 757px라 정규 폭 증거로 인정하지 않는다.
- design-lint: `dashboard/src` 전체에서 디자인 토큰 위반 0으로 통과.
- 종료조건: 정식 tenant token으로 Home·Studio·Settings·Channel·Admin 클릭 경로 확인, 콘솔 오류 0, 실제 1440·1024·390 캡처, 홈 before/after.

## ❌ NG: R-02 E2E 하네스 origin 및 Studio 대기 오탐 (2026-08-13)

- 대상: `dashboard/scripts/verify-r02-e2e.mjs`.
- 관찰: 기본 URL이 `http://127.0.0.1:3459`라 `localhost`로 기동한 Next.js 16 dev 서버의 dev resource origin과 어긋난다. Studio 검사는 본문 있는 드래프트를 골랐는지와 `불러오기` 클릭 성공을 확인하지 않은 채 일반 `Publish` 문자열만 기다린다.
- 영향: 제품 UI와 API가 정상이어도 하이드레이션 백지 또는 `loaded draft did not expose Publish`로 가짜 실패한다.
- 현재 판정: ❌ NG. 제품 소스 결함으로 판정하지 않는다.
- 종료조건: 기본 URL을 `localhost`로 통일하고, 본문 있는 드래프트의 `불러오기`를 재시도한 뒤 실제 활성 `🚀 Publish (N)` 버튼을 관찰한다. `R02_LIVE_PUBLISH`를 켜지 않은 실 DB·실 브라우저 실행이 `overview.source=db`, `consoleErrors=[]`, exit 0으로 끝나야 한다.
- 2026-08-13 06:15 KST 수정 상태: 🔧. 기본 URL `http://localhost:3459`, 화면에서 `본문 없음` 경고가 없는 드래프트 선택, 1초 간격 재클릭, 보이는 활성 `🚀 Publish (N)` 대기, 클릭 횟수·관찰 문구 결과 기록을 반영했다. 기존 catch와 profile cleanup 재시도는 보존했다.
- 테스트됨: 스크립트 구문과 scoped diff 검사 통과. 변경된 실제 DOM 표현식을 JSDOM에서 실행해 두 번째 드래프트 선택과 `🚀 Publish (3)` 관찰을 확인했다.
- 테스트됨: R-02 계약·디자인·Studio drafts API·grounding·publish UI 5 files, 23 tests 통과. `design-lint.sh dashboard/src` 위반 0.
- 관찰됨: `R02_LIVE_PUBLISH=0` 실 스크립트 실행은 샌드박스가 Chrome DevTools의 localhost 접속을 막아 `Chrome DevTools did not start: fetch failed`로 종료됐다. 원에러는 cleanup에 가려지지 않았고 debug port 9329 잔류 listener는 없었다.
- 현재 판정: 🔧 유지. coordinator의 로컬 권한에서 실 DB·실 브라우저 exit 0을 관찰하기 전 PASS로 바꾸지 않는다.

## ❌ NG: R-05 심사 상태 UX 계약 미연결 (2026-08-13)

- 요청 기준: 고객 계정이 아직 연결되지 않은 상태는 `미연결`, 서비스 운영자가 OAuth 앱을 준비하지 못한 상태는 `오픈 준비 중`으로 분리한다.
- 코드 관찰: `/api/connect/readiness`는 `{available, reason}`만 반환한다. 고객 UI는 Admin 미준비를 별도 상태로 분류하지 않고 위험 아이콘과 관리자 문의 문구를 표시한다.
- 영향: 고객 행동이 필요한지, 서비스 오픈을 기다려야 하는지, 외부 심사가 남았는지 화면만 보고 구분할 수 없다.
- 현재 판정: ❌ NG. API 상태 계약과 승인 prototype이 확정되기 전 제품 소스 수정 금지.
- 종료조건: readiness enum과 고객·Admin 문구·CTA 계약을 승인 artifact에 핀하고, 상태별 API·컴포넌트 통합테스트와 실제 브라우저 표시를 확인한다.

## ❌ NG: R-09 채널 capability·탭·Studio 단일 진실원 불일치 (2026-08-13)

- 코드 관찰: Settings는 텍스트 발행 8개, Sidebar는 영상 2개를 추가 노출한다. Studio는 실발행 4개와 미리보기 7개를 별도 보유한다. generic 채널은 queue·analytics·settings, Instagram은 queue·editor·settings 탭을 가진다.
- 영향: 같은 플랫폼이 화면에 따라 연결 가능, 발행 가능, 미리보기 가능으로 다르게 보이고 기존 미리보기·편집 기능의 보존 여부를 단일 계약으로 검증할 수 없다.
- 현재 판정: ❌ NG. design-lint 위반은 0이지만 정보구조와 capability 계약 결함은 남아 있다.
- 종료조건: provider capability SSOT와 화면별 허용 차이를 승인 prototype에 핀한다. Sidebar·Settings·Studio·채널 탭 통합테스트와 1440·1024·390 픽셀 대조에서 누락·오표시 0을 확인한다.

- 교차감사 증거: `docs/qa/osmu-r01-r14-crosscheck-2026-08-13-v1-gpt-codex.md`.

## ❌ NG: OSMU OAuth 장기 토큰 내구성 회귀 (2026-08-14)

- 회장 실계정 관찰: Threads 연결 모달은 완료를 표시했지만 채널 상세는 `재연결 필요`, Studio 발행은 계정 확인 400, 채널 상세는 `발행 준비중`을 표시했다.
- DB 관찰: 해당 `channel_accounts` 행은 `status=active`, 암호화 토큰과 외부 계정 ID가 있지만 `token_expires_at=NULL`이다.
- 코드 원인: Meta 장기 토큰 교환 응답에 `access_token`이 없어도 단기 토큰으로 폴백한다. `expires_in`을 콜백과 DB로 전달하지 않고, `/me` 검증 실패도 fallback ID로 덮어 `active`를 저장할 수 있다.
- 현재 판정: ❌ NG. 인증 사슬의 내구성과 연결 상태 표시가 불일치한다.
- 종료 조건: 장기 토큰 교환 fail-closed, `expires_in` 절대시각 저장, 신원 검증 실패 시 `active` 미저장, 만료 정보를 포함한 연결 판정, TypeScript·Vitest 0 실패. 실 OAuth와 실발행은 회장 재검증 전까지 미검증으로 유지한다.
- 2026-08-14 04:15 KST 수정 상태: 🔧. Meta 장기 토큰·Facebook long user token 교환을 fail-closed했고, 응답 `expires_in`을 `token_expires_at`으로 저장한다. `/me` 신원 검증 실패는 fallback ID로 덮지 않는다.
- 테스트됨: TypeScript exit 0. 전체 Vitest 138 files, 1,121 passed, 11 skipped, 실패 0. `design-lint.sh dashboard/src` 위반 0.
- 미검증: 샌드박스에서 실 OAuth·localhost·실 SNS 발행을 실행할 수 없어 현재 판정은 🔧를 유지한다. 운영 재연결 후 `token_expires_at` non-null, Channel Info `Connected`, Studio Threads 발행 permalink를 관찰해야 PASS로 전환한다.
