<!--
STAMP
line: openclaw-auto
created_at: 2026-08-23 01:20 KST
model: gpt-codex/gpt-5.6-sol
agent: product-designer
skills: 설치된 제품 UI 디자인·독립 리뷰 스킬 없음. design.md · writing.md · doc-review.md 적용
basis: v44, v45, DESIGN.md v23, user-flow v45, 브라우저 캡처 6장, qa-results.json
decision: 흐름 전달물, 카드 여백 두 안, 화면 저장과 미리보기는 실제 렌더·상호작용 증거가 모두 있어 디자인 검토 가능 상태다.
-->

# openclaw-auto v45 시각 QA

한 줄 결론: v45는 390·1024·1440에서 흐름 띠와 디스플레이가 넘치지 않았고, 카드 여백 A/B 및 화면 2개 저장·미리보기·복사 문장이 실제 브라우저에서 동작했다.

## 1. 검증 조건

- 브라우저: Chrome Headless Shell 151.0.7922.47
- 데이터: 한 편 `산후 회복, 다시 걷는 첫 주`, 정상 상태
- 화면: 생성실 1024 라이트, 성과실 1440 다크, 편집실 390 라이트
- 카드 비교: 같은 생성실 1024 화면에서 A와 B만 전환
- 화면 선택: 생성실·편집실 1024 두 화면, 메모 1건, 카드 여백 B

## 2. 영역별 픽셀 판정

| 영역 | v44 기준 | v45 렌더 | 판정 | 사용자 결과 |
|---|---|---|---|---|
| 검수 셸 | 폭·상태·역할 토글과 좌우 패널 | 기존 조작을 전량 유지하고 카드 여백·화면 고르기만 추가 | 통과 | 기존 검수 경로를 잃지 않음 |
| 제품 헤더 390 | 한 줄, 학습 정보가 크레딧 왼쪽 | 61px 한 줄, 가로 넘침 0, 순서 일치 | 통과 | 좁은 폭에서도 핵심 계정 정보가 잘리지 않음 |
| 제품 헤더 1024·1440 | 한 줄 | 각 61px, `nowrap`, 가로 넘침 0 | 통과 | 디스플레이 높이가 흔들리지 않음 |
| 네 방 진행 띠 | 생성·편집·발행·성과 4단계 | 방 4개 사이에 전달물 3개 교차 배치 | 통과 | 다음 방으로 무엇이 가는지 이동 전에 앎 |
| 390 전달물 | 방 4개 유지 | 현재 전달물 한 줄, 방 사이 캡슐은 숨김 | 통과 | 가로 폭을 넘기지 않고 현재 인계를 이해함 |
| 디스플레이 | 한 화면에 현재 방 결정 | route overflow 0, board overflow 0 | 통과 | 가운데 스크롤 없이 현재 결정을 끝냄 |
| 카드 A | 같은 행 바닥선 | 333·333·333px | 통과 | 비교 리듬을 우선 |
| 카드 B | 내용만 감쌈 | 189·229·194px | 통과 | 빈 공간을 줄인 안을 같은 조건에서 비교 |
| 화면 선택 | 없음 | 생성실·편집실 선택 칩 2개 | 통과 | 고른 화면의 범위를 잃지 않음 |
| 저장 뒤 미리보기 | 없음 | 실제 iframe 2개 | 통과 | 선택 결과를 저장 직후 눈으로 확인 |
| 복사 문장 | 없음 | 화면 2개·카드 B·메모 포함, 복사 성공 상태 | 통과 | 명령창에 바로 붙여넣을 수 있음 |
| 대화 | 오른쪽 아래 둥근 단추, 기본 접힘 | 390·1024·1440 모두 유지 | 통과 | 디스플레이를 가리지 않고 필요할 때만 호출 |

## 3. 상태와 회귀

| 검사 | 결과 |
|---|---|
| 브라우저 예외·console error | 0건 |
| 기존 화면 커버리지 | 실구현 24개 중 24개 등장 |
| v44 회귀 | 소실·반감 0, 파일 923KB에서 942KB로 증가 |
| 제품 프레임 순수성 | 금지 메타 문구 0건 |
| 화면 규칙 전수 검사 | 131개 화면에서 금지 목록·층 코드 노출 0건 |
| UTF-8 | valid, 대체문자 0 |
| 긴 대시 | 0건 |
| dead-end | 0개. 선택 없음·복사 차단·잘못 고름·초기화 경로 존재 |

## 4. 캡처

- `openclaw-auto-v45-390.png`
- `openclaw-auto-v45-1024.png`
- `openclaw-auto-v45-1440.png`
- `openclaw-auto-v45-card-space-a-1024.png`
- `openclaw-auto-v45-card-space-b-1024.png`
- `openclaw-auto-v45-screen-selection.png`

원시 측정값은 `qa-results.json`에 있다.

## 5. 레드팀과 셀프심문

까다로운 고객은 전달물 캡슐이 너무 작으면 흐름 개선이 설명 패치에 그치고, 너무 크면 네 방보다 더 강해진다고 공격할 수 있다. v45는 1024·1440에서 캡슐을 선 위의 보조 계층으로 낮추고, 390에서는 현재 전달물 하나만 독립 행으로 올렸다.

이 판단이 틀렸다면 왜 틀렸나:

1. 방 사이 전달물이 1024에서 작아 읽기 어려울 수 있다. 답: 결과물과 기록을 두 명사로 줄이고 활성 전달물만 파란 강조를 주었다. 문장을 늘리지 않았다.
2. 카드 B의 큰 하단 공백이 카드 내부 공백보다 더 거슬릴 수 있다. 답: 그것이 비교 목적이다. A와 B를 같은 화면에서 보존하고 이 판에서 정본을 자가 확정하지 않았다.
3. 미리보기가 정적 이미지처럼 보일 수 있다. 답: 저장된 해시를 여는 실제 iframe이며, 자동 QA에서 두 프레임의 생성과 선택 상태 보존을 확인했다.

DESIGN_SCORE: B+ · 요구 충실도 A · 시각 위계 A- · 일관성 A- · 가독성 B+ · 공간 구성 A- · 반응형 B+ · 상호작용 A · 출고 준비 B+

SOURCES: `docs/prototype/openclaw-auto-4room-v44.html` · `docs/prototype/openclaw-auto-4room-v45.html` · `DESIGN.md` v23 · `docs/user-flow.md` v45 증분 · `docs/prototype/qa-v45/qa-results.json` · <https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/> · <https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/> · <https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes> · <https://www.w3.org/WAI/ARIA/apg/patterns/button/> · <https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText> · <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>

MODEL: gpt-codex/gpt-5.6-sol · agent: product-designer

SKILLS_USED: 없음

SKILLS_SKIPPED: 현재 설치 목록에 제품 UI 화면 제작·독립 디자인 리뷰에 맞는 스킬이 없음. `design.md` · `writing.md` · `doc-review.md`와 직접 브라우저 픽셀 검수로 대체
