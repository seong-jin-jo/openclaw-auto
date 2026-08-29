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
deliberation: 기능 동선 PASS와 데이터 상태가 다른 디자인 대조의 미검증을 분리해 거짓 전체 PASS와 거짓 NG를 막았다.
-->

# OSMU 네 방 기본 흐름 QA

## 판정

네 방 기본 동선은 범위 PASS다. 지정 작업 공간의 실제 API 11단계, Studio v1 계약 12건,
실제 고객 토큰 브라우저의 네 방 4개 x 4폭, 성과실에서 생성실 복귀 4건이 통과했다.
가린 모달, 브라우저 401, 콘솔 오류, 가로 넘침은 각각 0건이다.

전체 QA 승인은 보류한다. 승인 프로토타입 v63 캡처와 현재 구현 캡처는 데이터 상태가 다르다.
생성실은 시안이 후보 선택 상태이고 dev는 초기 예시 상태다. 성과실은 시안이 표본 7건이고 dev는
표본 0건이다. 같은 상태의 매치드 페어가 아니므로 디자인 일치와 불일치를 모두 확정하지 않는다.

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
| 승인 v63 전체 디자인 정합 | 미검증 | 시안과 dev의 데이터 상태가 달라 `design.md` §14 동일 조건을 충족하지 못함 |

전환 가능 범위는 네 방 기본 동선뿐이다. 종료 증거는 health HTTP 200, 기본 흐름 11/11,
Studio v1 12/12, Playwright 16화면과 왕복 4건이다. 전체 QA와 design gate는 전환 불가다.

## 디자인 픽셀 대조 판정

`design.md` §14에 따라 시안과 dev PNG를 직접 열었다. 390 생성실과 390 성과실은 각각 시안과
dev 두 장을 원본으로 읽었다. 두 쌍의 가로 픽셀 비는 358/390으로 허용 범위 안이지만 데이터
상태가 달라 정합 판정의 동일 조건을 충족하지 못했다.

| 화면 | 폭 | 시안 상태 | dev 상태 | 픽셀 관찰 | 판정 | 증거 |
|---|---:|---|---|---|---|---|
| 생성실 | 390 | 후보 한 장을 고르는 상태, 담당 패널 접힘 | 후보 예시 3장과 빈 입력 폼 상태 | 상단 셸과 본문 길이 차이는 보이나 상태 차이의 영향 분리 불가 | 미검증 | `prototype-create-390.png`, `390-create.png` |
| 성과실 | 390 | 최근 30일 표본 7건과 실제 수치 | 표본 0건, 미수집 지표, 첫 콘텐츠 안내 | 요약과 제안 배치 차이는 보이나 empty와 populated 차이의 영향 분리 불가 | 미검증 | `prototype-performance-390.png`, `390-performance.png` |
| 생성실, 편집실, 발행실, 성과실 | 1024, 1440 | clean frame이 dev와 같은 데이터 상태로 고정되지 않음 | QA 작업 공간 현재 상태 | 동일 상태 매치드 페어 부재 | 미검증 | 기존 캡처는 기능 렌더 증거로만 사용 |

디자인 재검증 종료 조건은 네 방별로 같은 폭과 같은 데이터 상태의 clean 시안과 dev를 다시
캡처하고, 주축 방향, 요소 순서, 열 수, 정렬과 여백, 표시와 숨김, 글꼴 단계, 버튼 위계를
영역별로 판정하는 것이다. 그 전에는 design gate를 PASS 또는 NG로 확정하지 않는다.

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
| R200, R207 | 성과실 UX와 학습 정보 | FLOW-PERF-01 | 기능 PASS, 디자인 미검증 | 성과실 4폭 렌더와 제안 3건. v63과 같은 데이터 상태의 픽셀 대조는 미검증 |
| R201 | 사이드바 사족 제거 | FLOW-SIDEBAR-01 | PASS | 네 방 링크 클릭 경로에 `지금 여기`, `다음` 중복 문구 없음 |
| R206 | 승인 시안 수준 화면 충실도 | CONF-ALL | 미검증 | same-state clean 시안과 dev 매치드 페어 부재 |
| R01~R207 | 나머지 확정 요구 전건 | REQ-ALL | 이월 | 전건 정본 판정은 기존 요구 추적표와 `docs/qa/osmu-qa-2026-08-28.md`를 유지 |

## 페르소나 결정

질문: 첫 콘텐츠를 만드는 박도윤이 설명 없이 생성실에서 성과실까지 길을 잃지 않고 이동할 수 있는가?

답: 네 방 이동과 다음 행동 노출에는 PASS다. 4폭 모두 생성실에서 성과실까지 실제 링크로 이동했고
성과실에서 생성실로 돌아왔다. 그러나 승인 v63과 같은 데이터 상태의 픽셀 정합 및 실제 공개 채널
발행을 확인하지 않았으므로, 처음부터 발행과 성과 학습까지 완성할 수 있다고 판정하지 않는다.

## 레드팀과 셀프심문

까다로운 고객은 링크가 열린다는 사실보다 후보 생성, 실제 미디어 편집, 채널 선택, 성과 학습이
한눈에 이어지는지를 본다. 이번 기능 증거는 그 동선만 보증한다. 데이터 상태가 다른 시안과 dev의
차이를 제품 결함으로 과장하지 않고 design gate를 미검증으로 남겼다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 mock 기반 탐침과 exit 0을 실제 사용자 성공으로 오해하는
것이다. 탐침을 실제 고객 토큰과 visible assertion으로 바꾸고, 별도 4폭 실제 클릭 스크립트와 API
11단계로 교차 확인했다. 반대로 이 증거도 실제 외부 공개 발행과 운영 배포를 보증하지는 않는다.

## 벤치마크 적용

Playwright의 actionability 기준을 따라 force click을 쓰지 않고 요소가 보이고 안정적이며 이벤트를
받을 수 있을 때만 실제 클릭했다. viewport emulation 기준으로 390, 768, 1024, 1440을 각각 독립
browser context로 열었다. DOM 존재나 mock 탐침만으로 완료를 선언하지 않은 점을 차용했고,
승인 prototype 정합은 같은 데이터 상태의 screenshot pair가 확보될 때까지 미검증으로 분리했다.

SKILLS_USED: qa, 결함 등록, 실제 앱 회귀, 반응형 관찰, 증거 기록에 사용 / SKILLS_SKIPPED: 없음

SOURCES: docs/prototype/openclaw-auto-4room-v63.html | docs/requests/회장-확정-요구사항-대장.md | wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md | docs/fdd/test-plan-r02-v1.0.0-opus.md | docs/prd-openclaw-service-v8.2.1-gpt-codex.md | https://playwright.dev/docs/actionability | https://playwright.dev/docs/emulation

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
