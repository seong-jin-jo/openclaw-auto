<!--
STAMP
line: osmu
artifact: v24 디자인 검수 보수 정합 행렬
created_at: 2026-08-28 21:20 KST
model: gpt-codex/gpt-5.6-sol
agent: qa-verifier
skills: qa, 결함 재현과 실앱 회귀 검증에 사용
basis: docs/audit/v24-design-review.md, docs/prototype/openclaw-auto-4room-v63.html, docs/requests/회장-확정-요구사항-대장.md, wiki/product/사업좌표-OSMU와-ZERO-ONE.md
benchmark: https://playwright.dev/docs/next/test-snapshots, https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance
deliberation: 검수 지적 해소와 전체 v63 화면 정합을 분리해 거짓 PASS를 막았다.
-->

# OSMU v24 디자인 검수 보수 정합 행렬

## 판정

v24 검수 지적 8건은 수정 또는 근거 판정까지 끝냈다. 이 범위의 실제 앱 재현은 PASS다.
다만 네 방 전체가 승인 v63과 일치한다는 뜻은 아니다. `docs/qa/osmu-qa-2026-08-28.md`의
12개 전체 화면 정합 행은 여전히 NG이므로 design gate는 승인할 수 없다.

## 위험도순 지적 처리

| 우선순위 | 지적 | 처리 | 실제 관찰 | 범위 판정 |
|---|---|---|---|---|
| P1 기본 흐름 | V24-DR-001 실제 경로 충실도 | 최신 확정 R150의 공통 채널 탭과 비활성 탭 계약을 유지했다. 더 오래된 v24 문서의 플랫폼별 탭 삭제 제안은 적용하지 않았다. R201에 따라 사이드바와 모바일 헤더의 `지금 여기`를 제거했다 | 네 방 링크 4개를 4폭에서 클릭하고 실제 경로와 방 본문 확인. 현재 방은 `aria-current=page`와 색으로 표시. 중복 문구 0건 | PASS |
| P1 기본 흐름 | V24-DR-002 성과실 정보 중복 | `PerformanceRoom` 아래에 다시 붙던 파이프라인, 최근 활동, 채널 상태, 에러, 에이전트 로그 패널을 제거했다. 첫 사용자 인라인 온보딩은 보존했다 | 390, 1024, 1440에서 `[data-room=performance]` 1건. 레거시 패널 문구 0건. 4폭 가로 넘침 0건 | PASS |
| P1 기본 흐름 | V24-DR-003 저장 본문 연속성 | 현행 `studio_work`가 본문과 편집 줄을 복원하는 기존 구현을 유지하고 실앱 시나리오로 고정했다 | 본문 표식 `V24 본문 복원 관찰 증거`를 저장한 뒤 편집실 재진입. 390, 1024, 1440 모두 본문 표시 | PASS |
| P1 진실원 | V24-DR-006 OAuth 개수 불일치 | 없는 provider 두 개를 만들지 않았다. UI는 API의 등록 provider 목록을 그리고 고정 `14개` 주석을 제거했다 | API 12개, DOM 카드 12개, 기본 펼침 0개를 3폭에서 확인 | 조건부 PASS. 14개가 제품 결정이면 별도 상류 합의가 필요 |
| P2 시각 | V24-DR-004 디자인 토큰 이탈 | 현행 토큰 구현을 기계 검사했다 | `design-lint.sh dashboard/src` 결과 위반 0건 | PASS |
| P2 시각 | V24-DR-005 운영자 점진 공개 | 등록 provider 카드를 기본 접힘으로 유지했다 | API와 DOM 12개 일치, `aria-expanded=true` 0건, 390과 1024는 1열, 1440은 2열 | PASS |
| P2 의미 | V24-DR-007 현재와 목표 혼동 | v63 prototype의 R-06 섹션은 `설계 목표`로 표시돼 있다. 실제 앱에는 현재 기능인 것처럼 옮기지 않았다 | prototype source의 `data-r06-summary=target`과 문구 확인 | PASS. 코드 수정 대상 아님 |
| P2 증거 | V24-DR-008 렌더 증거 부재 | 승인 prototype과 실제 앱 캡처를 3폭으로 남기고 실제 앱은 추가로 768폭 네 방까지 캡처했다 | `docs/prototype/qa-v24-remediation/`의 prototype 3장, 실제 화면 25장, 관찰 JSON 2개 | PASS |

## 배치 속성 대조

| 화면 | 폭 | 주축 방향 | 요소 순서 | 열 수 | 정렬과 여백 | 표시와 숨김 | 글꼴 단계 | 버튼 위계 | 지적 범위 | 전체 v63 |
|---|---:|---|---|---|---|---|---|---|---|---|
| 성과실 | 390 | 세로 | 연결 안내, 진행, 표본, 판정, 제안, 반응, 온보딩 | 지표 2열, 제안 1열 | 가로 넘침 0 | 레거시 Home 패널과 `지금 여기` 숨김 | heading, body, caption 토큰 | 생성 큐 인계가 주 행동 | PASS | NG 유지 |
| 성과실 | 1024 | 세로 | 390과 동일 | 지표 4열, 제안 3열 | 사이드바 뒤 본문 정렬 | 레거시 Home 패널 숨김 | 토큰 단계 유지 | 생성 큐 인계가 주 행동 | PASS | NG 유지 |
| 성과실 | 1440 | 세로 | 390과 동일 | 지표 4열, 제안 3열 | 넓은 본문과 좌측 사이드바 | 레거시 Home 패널 숨김 | 토큰 단계 유지 | 생성 큐 인계가 주 행동 | PASS | NG 유지 |
| 편집실 본문 복원 | 390 | 세로 | 헤더, 목차, 미리보기, 도구, 대사, 담당 패널 | 1열 | 가로 넘침 0 | 저장 본문 3줄 표시 | heading, body, caption 토큰 | 선택 장면과 대사 편집 우선 | PASS | NG 유지 |
| 편집실 본문 복원 | 1024 | 가로와 세로 혼합 | 헤더, 목차와 미리보기, 담당 패널 | 본문 2열 | 고정 사이드바 뒤 정렬 | 저장 본문 3줄 표시 | 토큰 단계 유지 | 선택 장면과 대사 편집 우선 | PASS | NG 유지 |
| 편집실 본문 복원 | 1440 | 가로와 세로 혼합 | 1024와 동일 | 본문 2열 | 넓은 작업 영역 | 저장 본문 3줄 표시 | 토큰 단계 유지 | 선택 장면과 대사 편집 우선 | PASS | NG 유지 |
| 운영자 OAuth | 390 | 세로 | 요약, 장애, OAuth, 가입자, 작업 공간 | 1열 | 가로 넘침 0 | 12개 전부 접힘 | heading, body, caption 토큰 | 펼치기는 카드 헤더 전체 | PASS | 감사 범위 밖 |
| 운영자 OAuth | 1024 | 세로 | 390과 동일 | 1열 | 본문 폭 안 정렬 | 12개 전부 접힘 | 토큰 단계 유지 | 펼치기는 카드 헤더 전체 | PASS | 감사 범위 밖 |
| 운영자 OAuth | 1440 | 세로 | 390과 동일 | 2열 | 그룹별 정렬 | 12개 전부 접힘 | 토큰 단계 유지 | 펼치기는 카드 헤더 전체 | PASS | 감사 범위 밖 |

전체 v63 NG 근거는 생성실, 편집실, 발행실, 성과실 3폭을 배치 속성별로 대조한
`docs/qa/osmu-qa-2026-08-28.md`의 디자인 정합 행렬이다. 이번 보수는 그 전체 결함을
숨기지 않고 v24 audit의 재현 항목만 PASS로 전환했다.

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R08 | 사이드바에 네 방을 둔다 | V24-DR-001 | PASS | 실제 링크 4개 x 4폭 |
| R150 | 모든 채널은 공통 다섯 탭을 보이고 못 쓰는 탭만 흐리게 둔다 | V24-DR-001 | PASS | `channel-capabilities.test.ts` 7건, 오래된 v24 탭 삭제안 미적용 |
| R200 | 성과실을 이전 산출물과 논의를 보고 전면 보수한다 | V24-DR-002 | 부분 PASS | 중복 레거시 패널 제거. 전체 v63 정합은 NG 유지 |
| R201 | 사이드바의 `지금 여기`, `다음` 사족을 뺀다 | V24-DR-001 | PASS | 3폭 DOM과 실제 캡처에서 문구 0건 |
| R206 | 화면 충실도를 실제 수준으로 올린다 | CONF-ALL | NG 유지 | 기존 전체 v63 정합 행렬 |
| R207 | 성과실의 UX와 학습 정보를 제대로 구성한다 | V24-DR-002 | 부분 PASS | 한 성과실 블록과 제안 3건. 전체 시안 정합은 NG 유지 |

R01부터 R207까지 전건 승계표는 `docs/qa/osmu-qa-2026-08-28.md`의 요청 번호 승계를
정본으로 쓴다. 이번 표는 변경된 판정만 덧붙인 delta다.

## 실행 증거

| 항목 | 판정 | 증거 |
|---|---|---|
| backend build와 test | PASS | 별도 backend 없음. dashboard 전체 Vitest 185파일, 1,321건 PASS, 6건 조건부 SKIP |
| web build와 test | PASS | Next production build, 정적 경로 174개 생성. 기존 NFT 경고 1건 |
| mobile typecheck | 해당 없음 | 모바일 소스 없음. dashboard TypeScript exit 0 |
| curl health | PASS | `localhost:3456/api/health` HTTP 200, DB up |
| seed | PASS | 임시 PostgreSQL에 schema, seed, RLS 적용. `seed-a,seed-b`, seed draft 1건 관찰 후 임시 DB 폐기 |
| 주요 API와 기본 흐름 | PASS | 실제 앱 생성, 편집 인계, 장면 변경, 발행 큐, 제안 큐 11/11 |
| Studio API | PASS | 실제 앱 정상과 거절, 시간대 무료 몫 12/12 |
| Playwright 네 방 | PASS | 4방 x 4폭, 왕복 4건, 가로 넘침과 401과 콘솔 오류 0건 |
| Playwright v24 재현 | PASS | 성과실, 본문 복원, OAuth 각 3폭 |
| Maestro | 해당 없음 | 웹 전용 제품이며 Maestro flow와 모바일 대상 없음 |
| 디자인 lint | PASS | 디자인 토큰 위반 0건 |

## 페르소나 결정

질문: 콘텐츠 도구를 처음 쓰는 사람이 설명 없이 첫 한 편을 발행 직전까지 만들 수 있는가?

답: 이번 v24 지적 보수만으로는 그렇다고 판정할 수 없다. API 기본 흐름은 11/11이지만 실제 사람
동선의 전체 v63 정합과 첫 사용자 결함 재검증이 남았다. 따라서 전체 QA는 NG를 유지한다.

## 레드팀과 셀프심문

까다로운 고객은 테스트 수가 아니라 화면에서 중복 패널이 사라졌는지, 저장 본문이 돌아오는지,
운영 자격 카드가 한꺼번에 펼쳐지지 않는지를 본다. 세 항목을 mock 없이 실제 서버와 브라우저에서
3폭으로 확인했고 임시 고객 토큰을 폐기했다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 v24 audit PASS를 전체 v63 design PASS로 과장하는 것이다.
그래서 두 판정을 분리하고 기존 전체 정합 NG를 유지했다.

SKILLS_USED: qa, 결함 재현, 실제 브라우저 검증, 회귀 순서, 증거 기록에 사용 / SKILLS_SKIPPED: 없음

SOURCES: docs/audit/v24-design-review.md | docs/prototype/openclaw-auto-4room-v63.html | docs/requests/회장-확정-요구사항-대장.md | wiki/product/사업좌표-OSMU와-ZERO-ONE.md | docs/qa/osmu-qa-2026-08-28.md | https://playwright.dev/docs/next/test-snapshots | https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
