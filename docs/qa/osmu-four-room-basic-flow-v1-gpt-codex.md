<!--
STAMP
line: osmu
artifact: 네 방 기본 흐름 QA와 디자인 정합 행렬
created_at: 2026-08-29 10:39 KST
model: gpt-codex/gpt-5.6-sol
agent: qa-verifier
skills: qa, 결함 등록, 실제 앱 회귀, 반응형 관찰, 증거 기록에 사용
basis: docs/prototype/openclaw-auto-4room-v63.html, docs/requests/회장-확정-요구사항-대장.md, wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md
benchmark: https://playwright.dev/docs/actionability, https://playwright.dev/docs/emulation
deliberation: 기능 동선 PASS와 승인 프로토타입 정합 NG를 분리해 거짓 전체 PASS를 막았다.
-->

# OSMU 네 방 기본 흐름 QA

## 판정

네 방 기본 동선은 범위 PASS다. 지정 작업 공간의 실제 API 11단계, Studio v1 계약 12건,
실제 고객 토큰 브라우저의 네 방 4개 x 4폭, 성과실에서 생성실 복귀 4건이 통과했다.
가린 모달, 브라우저 401, 콘솔 오류, 가로 넘침은 각각 0건이다.

전체 QA 승인은 NG를 유지한다. 승인 프로토타입 v63과 현재 구현은 주축 방향 일부만 같고,
요소 순서, 열 구성, 표시 상태, 글꼴 단계, 버튼 위계가 화면별로 다르다. 기본 동선 PASS를
디자인 정합 PASS로 확대하지 않는다.

## 발견과 수정

최초 `probe-four-room-flow.mjs`는 네 방을 모두 `false`로 출력하고도 종료 코드 0을 반환했다.
mock한 `/api/me`와 현재 인증 경계가 맞지 않았고 렌더 assertion도 없었다. 탐침을 실제 임시 고객
토큰 발급, 네 방 visible assertion, 가린 모달, 브라우저 401, 콘솔 오류 검사, 토큰 폐기로 바꿨다.
수정판 재실행은 네 방 4개 렌더와 오류 0건으로 종료 코드 0을 반환했다.

최초 Turbopack 장기 개발 서버는 `/api/health`가 5초 안에 응답하지 않았고 생성 요청은
`GENERATION_DB_TIMEOUT`으로 끝났다. 같은 소스를 제한 시간 webpack 개발 서버에서 실행하자
health HTTP 200, DB `up`, 기본 흐름 11/11이 재현됐다. 제품 코드는 수정하지 않았다. 이는 장기
개발 서버 정체라는 환경 위험이며, 운영 배포 안정성 증거로 쓰지 않는다.

## 실행 증거

| 검증 | 판정 | 직접 관찰 증거 |
|---|---|---|
| backend build와 test | PASS | Next 통합 backend를 포함한 `npm run test`, 198파일, 1,443건 PASS, 조건부 1건 제외 |
| web build와 test | PASS | `npm run build`, 정적 페이지 174/174. 기존 NFT 추적 경고 1건 유지 |
| mobile typecheck | 해당 없음 | 대상은 dashboard 웹 제품이며 별도 mobile 화면 계약이 없음 |
| TypeScript | PASS | `npx tsc --noEmit`, 종료 코드 0 |
| curl health | PASS | 제한 시간 서버의 `/api/health` HTTP 200, `db: up` |
| seed | 범위 PASS | 기본 흐름이 지정 작업 공간에 실제 생성 작업, 초안, 발행 큐, 성과 제안 인계를 생성. 합성 mock이나 별도 demo seed를 완료 근거로 쓰지 않음 |
| 주요 API 기본 흐름 | PASS | `verify-basic-flow-e2e.mjs`, 생성실부터 성과실까지 11/11 |
| Studio v1 계약 | PASS | `verify-studio-v1-e2e.mjs`, 401, 400, 422, 201, 조회, 무료 재생성 경계 12/12 |
| 요청된 네 방 탐침 | NG 후 수정, PASS | 수정 전 네 방 `false`인데 exit 0. 수정 후 네 방 `true`, 가린 모달, 401, 콘솔 오류 각각 0 |
| Playwright 사람 동선 | PASS | 390, 768, 1024, 1440에서 실제 링크 클릭으로 생성실, 편집실, 발행실, 성과실 16화면과 성과실에서 생성실 복귀 4건 |
| 디자인 lint | PASS | `design-lint.sh dashboard/src`, 8pt 밖 px, 인라인 style, 토큰 밖 hex 위반 0 |
| Maestro | 해당 없음 | dashboard 웹 제품 범위. `optional:true` 우회 없음 |
| 승인 v63 전체 디자인 정합 | NG 유지 | 아래 12행 모두 요소 순서 또는 열 수, 표시 상태, 버튼 위계 불일치 |

전환 가능 범위는 네 방 기본 동선뿐이다. 종료 증거는 health HTTP 200, 기본 흐름 11/11,
Studio v1 12/12, Playwright 16화면과 왕복 4건이다. 전체 QA와 design gate는 전환 불가다.

## 디자인 정합 행렬

승인 프로토타입 캡처는 `docs/prototype/qa-2026-08-28/prototype-{room}-{width}.png`, 현재 구현
캡처는 `docs/qa/osmu-four-room-flow-20260829/{width}-{room}.png`를 사용했다. 768폭은 기능과
가로 넘침을 별도 실측했고, 필수 디자인 판정은 웹 1440, 태블릿 1024, 모바일 390 세 폭으로 했다.

| 화면 | 폭 | 주축 방향 | 요소 순서 | 열 수 | 정렬과 여백 | 표시와 숨김 | 글꼴 단계 | 버튼 위계 | 판정과 근거 |
|---|---:|---|---|---|---|---|---|---|---|
| 생성실 | 390 | 둘 다 세로 | prototype은 후보 카드와 접힌 대화창, 구현은 후보 3장, 학습 정보, 입력 폼 순 | 1열 동일 | prototype은 화면 안 카드 집중, 구현은 2,220px 전체 문서 | prototype 접힌 담당, 구현 전체 폼 노출 | 제목 크기와 밀도 불일치 | prototype `화면 고르기`, 구현 `후보 세 장 만들기` 중심 | NG, 두 캡처의 첫 화면 구성 자체가 다름 |
| 생성실 | 1024 | prototype은 작업과 담당 분할, 구현은 후보, 학습, 담당 분할 | 요소 순서 불일치 | prototype 2열 중심, 구현 3열 | 구현 가운데 학습 열이 추가됨 | prototype 대화 흐름과 구현 입력 폼 노출 차이 | 카드 제목 단계 불일치 | 주 행동 위치가 우측 폼으로 이동 | NG |
| 생성실 | 1440 | 둘 다 가로 작업 영역 | 후보, 맥락, 담당의 구성이 prototype과 다름 | 구현 3열, prototype 작업과 담당 중심 | 구현 좌측 사이드바와 넓은 공백 비중이 큼 | prototype 실제 후보 미디어, 구현 예시 카드 | prototype 시각 제목이 더 큼 | 선택 행동과 생성 행동 위계 불일치 | NG |
| 편집실 | 390 | 둘 다 세로 | prototype은 목차, 실제 플레이어, 대사, 접힌 담당. 구현은 목차, 빈 구조 초안, 도구, 대사, 담당 | 1열 동일 | 구현은 플레이어 자리에 빈 placeholder | 실제 플레이어와 자막 상태 미표시 | prototype 미디어 제목과 타임라인 강조가 더 큼 | prototype 재생과 편집, 구현 저장 단추 중심 | NG |
| 편집실 | 1024 | 둘 다 가로와 세로 혼합 | 목차, 플레이어, 대사, 담당 순은 유사 | 둘 다 3영역 | 구현 플레이어와 대사 폭이 작고 공백 큼 | prototype 재생기와 실제 자막, 구현 구조 초안 placeholder | 제목과 제어 단계 불일치 | prototype 재생과 자막 편집, 구현 저장 중심 | NG, 골격만 유사 |
| 편집실 | 1440 | 둘 다 가로 작업 영역 | prototype 상세 도구와 대화, 구현 단순 제어와 대화 | 3영역 유사 | 구현 본문 높이와 여백이 과도함 | 핵심 플레이어 상태 누락 | 미디어 정보 단계 불일치 | prototype 편집 행동 다수, 구현 저장 단일 강조 | NG |
| 발행실 | 390 | 둘 다 세로 | prototype은 선택 요약, 채널 연결, 플랫폼 미리보기, 담당. 구현은 플랫폼 카드 전수 나열 뒤 담당 | 1열 동일 | 구현 문서 높이 6,779px로 탐색 부담 큼 | prototype 선택된 플랫폼 중심, 구현 7플랫폼 전부 표시 | 플랫폼 카드 정보 단계 불일치 | prototype 발행 주 행동 상단, 구현 담당 행동 하단 | NG |
| 발행실 | 1024 | prototype은 미리보기와 담당 병렬, 구현은 플랫폼 카드 중심 긴 문서 | 요소 순서 불일치 | prototype 2영역, 구현 카드 2열과 긴 세로 | 구현 여백과 카드 높이가 과다 | 연결 상태와 선택 상태 표현 차이 | 채널 헤더 단계 불일치 | 발행 주 행동이 첫 화면에서 약함 | NG |
| 발행실 | 1440 | prototype은 텍스트 채널 가로 미리보기와 우측 담당 | 구현은 플랫폼군별 카드 그리드 | prototype 작업과 담당 2영역, 구현 플랫폼 2열 중심 | prototype 한 화면 판단, 구현 전체 페이지 탐색 | prototype 선택 플랫폼, 구현 전 플랫폼 | prototype 주요 수치와 본문 단계가 선명 | prototype `Publish (3)`, 구현 연결과 개별 미리보기 중심 | NG |
| 성과실 | 390 | 둘 다 세로 | 연결 안내, 표본, 판정, 제안 흐름은 유사하나 구현에 첫 콘텐츠 온보딩 추가 | 1열 동일 | 구현 문서 높이 2,995px | prototype 상단 학습 정보, 구현 하단 온보딩 노출 | 판정 제목과 카드 본문 단계 차이 | 제안 인계는 유사, 연결 단추 위계 차이 | NG, 기능 순서는 가장 가깝지만 화면 계약이 다름 |
| 성과실 | 1024 | prototype은 성과 요약과 담당 병렬, 구현은 본문 단일 흐름 | 요소 순서 일부 유사 | prototype 2영역, 구현 본문 중심 | 구현 우측 담당 영역이 없음 | prototype 담당 대화, 구현 온보딩 노출 | 요약 수치 단계 차이 | prototype 대화 행동, 구현 제안 인계 중심 | NG |
| 성과실 | 1440 | prototype은 한 화면 성과 결론과 우측 담당 | 구현은 세로 전체 성과와 하단 첫 콘텐츠 온보딩 | prototype 2영역, 구현 1영역 | 구현 본문 폭과 세로 길이가 큼 | 우측 담당 숨김, 온보딩 추가 | prototype 결론과 수치 강조가 더 큼 | prototype 담당 행동과 구현 생성 큐 행동 위계 불일치 | NG |

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R08 | 사이드바 네 방과 방 이동 | FLOW-UI-01 | PASS | 4방 x 4폭과 성과실에서 생성실 복귀 4건 |
| R27 | 후보 거절 뒤 무료 재생성 | STUDIO-V1-REGEN | PASS | Studio v1 경계가 첫 호출 허용 또는 당일 몫 소진과 복구 시각을 반환 |
| R89 | 제작 후 발행 시점 채널 연결 | FLOW-PUBLISH-01 | 부분 PASS | 발행실 렌더와 연결 안내 확인. 실제 외부 채널 발행은 미검증 |
| R104 | 고객 인증 경계 | FLOW-AUTH-01 | PASS | 실제 임시 고객 토큰으로 16화면, 401 0건, 토큰 폐기 HTTP 200 |
| R132 | 영상과 글 편집 흐름 | FLOW-EDIT-01 | 부분 PASS | 편집실 렌더와 다음 행동 확인. 이번 범위는 영상 기본 상태이며 글 전체 편집은 이월 |
| R150 | 플랫폼별 지원 기능 계약 | FLOW-11-CAP | PASS | 기본 흐름의 채널별 지원 여부 단계와 capability API HTTP 200 |
| R168 | 첫 생성과 학습 정보 | FLOW-11-GEN | PASS | 후보 3장, 생성 결과 편집실 인계, 실제 작업 공간 기록 |
| R193 | 성과 제안에서 생성실 재진입 | FLOW-UI-RETURN | PASS | 4폭 모두 성과실 방향 제안 3건과 생성실 복귀 |
| R200, R207 | 성과실 UX와 학습 정보 | FLOW-PERF-01 | 기능 PASS, 디자인 NG | 성과실 4폭 렌더와 제안 3건. v63 배치 정합은 NG |
| R201 | 사이드바 사족 제거 | FLOW-SIDEBAR-01 | PASS | 네 방 링크 클릭 경로에 `지금 여기`, `다음` 중복 문구 없음 |
| R206 | 승인 시안 수준 화면 충실도 | CONF-ALL | NG | 위 12행 디자인 정합 NG |
| R01~R207 | 나머지 확정 요구 전건 | REQ-ALL | 이월 | 전건 정본 판정은 기존 요구 추적표와 `docs/qa/osmu-qa-2026-08-28.md`를 유지 |

## 페르소나 결정

질문: 첫 콘텐츠를 만드는 박도윤이 설명 없이 생성실에서 성과실까지 길을 잃지 않고 이동할 수 있는가?

답: 네 방 이동과 다음 행동 노출에는 PASS다. 4폭 모두 생성실에서 성과실까지 실제 링크로 이동했고
성과실에서 생성실로 돌아왔다. 그러나 승인 v63과 화면 구성은 다르며 실제 공개 채널 발행도 하지
않았으므로, 처음부터 발행과 성과 학습까지 완성할 수 있다고 판정하지 않는다.

## 레드팀과 셀프심문

까다로운 고객은 링크가 열린다는 사실보다 후보 생성, 실제 미디어 편집, 채널 선택, 성과 학습이
한눈에 이어지는지를 본다. 현재 화면은 기본 동선을 제공하지만 특히 발행실의 긴 플랫폼 전수 나열과
승인 prototype의 작업 집중 구조가 다르다. 그래서 기능 범위만 PASS하고 design gate는 NG로 남겼다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 mock 기반 탐침과 exit 0을 실제 사용자 성공으로 오해하는
것이다. 탐침을 실제 고객 토큰과 visible assertion으로 바꾸고, 별도 4폭 실제 클릭 스크립트와 API
11단계로 교차 확인했다. 반대로 이 증거도 실제 외부 공개 발행과 운영 배포를 보증하지는 않는다.

## 벤치마크 적용

Playwright의 actionability 기준을 따라 force click을 쓰지 않고 요소가 보이고 안정적이며 이벤트를
받을 수 있을 때만 실제 클릭했다. viewport emulation 기준으로 390, 768, 1024, 1440을 각각 독립
browser context로 열었다. DOM 존재나 mock 탐침만으로 완료를 선언하지 않은 점을 차용했고,
승인 prototype 정합은 별도 screenshot pair와 배치 속성 표로 더 엄격하게 분리했다.

SKILLS_USED: qa, 결함 등록, 실제 앱 회귀, 반응형 관찰, 증거 기록에 사용 / SKILLS_SKIPPED: 없음

SOURCES: docs/prototype/openclaw-auto-4room-v63.html | docs/requests/회장-확정-요구사항-대장.md | wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md | docs/fdd/test-plan-r02-v1.0.0-opus.md | docs/prd-openclaw-service-v8.2.1-gpt-codex.md | https://playwright.dev/docs/actionability | https://playwright.dev/docs/emulation

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
