<!--
STAMP
line: openclaw-auto
created_at: 2026-08-22 08:13 KST
model: gpt-codex/gpt-5.6-sol
agent: product-designer
skills: 매칭되는 설치 디자인 제작 스킬 없음. design.md · ux-writing.md · doc-review.md 방법론 직접 적용
evidence: v42 실렌더 22장 · 자동 검사 3종 · Figma · Gamma · Apple HIG · Anthropic · Microsoft · OpenAI 공식 문서
deliberation: 모바일 후보 세 장 축소를 폐기하고 후보 탭과 선택한 한 장으로 수정했다.
-->

# v42 디스플레이 QA

## 한 줄 판정

1024·1440·390의 라이트·다크, 정상·내용 없음·불러오는 중·오류·내용 많음을 실제 렌더로 확인했다. 자동 검사 3종 통과, 프레임 내 가로 잘림 0, 디스플레이 내부 세로 스크롤 0이다.

## 픽셀 영역별 대조

| 폭 | 영역 | v41 | v42 직접 관찰 | 판정 |
|---|---|---|---|---|
| 1440 | 헤더 | 작업 공간 세로 표기, 학습 정보는 헤더 | 작업 공간 가로 표기, 네 단계 뒤 학습 정보 | 통과 |
| 1440 | 디스플레이 | 긴 안내와 2열, 대화 보조 목록 | 설명 없이 3열 한 장, 선택 상태 직접 반영 | 통과 |
| 1440 | 담당 레일 | 펼침 320px | 같은 열과 폭, 보조 목록만 제거 | 통과 |
| 1024 | 헤더 | 학습 정보가 접힌 줄 뒤로 밀릴 수 있음 | 생성·편집·발행·성과·학습 정보 5칸 고정 | 통과 |
| 1024 | 디스플레이 | 세로 적층 가능 | 3열 한 장, 접힌 대화 48px | 통과 |
| 390 | GNB | 우측 계정이 잘림 | 작업 공간 가로, 작업물·알림·계정 모두 노출 | 통과 |
| 390 | 전역 헤더 | 성과와 학습 정보가 보이지 않음 | 생성·편집·발행·성과·학습 정보 모두 노출 | 통과 |
| 390 | 디스플레이 | 카드 3열 축소로 글자·행동 과소 | 후보 탭 3개 + 선택한 카드 한 장 + 44px 행동 | 통과 |
| 390 | 하단 | 담당 대화가 접힘선 밖 | 접힌 대화가 같은 화면 하단에 노출 | 통과 |

## 대표 캡처

- 1440 라이트: `display-1440-light.png`
- 1440 다크: `display-1440-dark.png`
- 1024 라이트: `display-1024-light-r2.png`
- 1024 다크: `display-1024-dark-r2.png`
- 390 라이트 최종: `display-390-light-approved.png`
- 390 다크 최종: `display-390-dark-approved.png`
- 내용 없음: `display-empty-approved.png`
- 불러오는 중: `display-loading-approved.png`
- 오류: `display-error-approved.png`
- 내용 많음: `display-overflow-approved.png`

## 자동 검사

| 검사 | 결과 |
|---|---|
| `prototype-coverage-check.sh` | 통과. 실구현 화면 24/24 |
| `check-regression.sh` | 통과. v41 870KB → v42 889KB, 이전 요소 전부 생존 |
| `check-frame-purity.sh` | 통과. 제품 화면 설명물 0 |

## 기능 보존

- 유지: v41 화면 99개, 네 방, 채널 15종, 라이트·다크, 추천·예시·편집·자세한 설명, 정상·빈 상태·불러오는 중·오류, 직접 입력, 브랜드 전환, 학습 정보 열람·교정·승낙·갱신 기록.
- 추가·변경: 디스플레이 명명, 발표형 한 장, 내용 많음 상태, 390 후보 탭 + 한 장, 작업 공간 가로 배열, 전 폭 학습 정보 헤더, 일곱 칸과 별도 제작법 면.
- 확정 제거: 헤더 `내 에이전시`, 챗봇 되짚기와 가리킴 목록.
- 전체 대응: 기기 밖 검수 패널의 `v41 화면·기능 → v42 대응표 99건`.

## Design Score

| 항목 | 점수 | 근거 |
|---|---:|---|
| Brief fidelity | A | 직접 요구 7건과 일곱 칸 계약 반영 |
| Visual hierarchy | A- | 한 장면, 후보 3개 또는 모바일 1개 |
| Consistency | A | 기존 토큰·셸·상태 유지 |
| Readability | A- | 390에서 전문을 숨기고 제목·근거 라벨·행동 유지 |
| Spatial composition | A- | 8pt 스케일, 3열 정렬, 모바일 한 장 |
| Responsive | A | 390·1024·1440 라이트·다크 직접 확인 |
| Interaction | A- | 후보 탭, 장면 탭, 대화 선택이 같은 상태를 공유 |
| Professional readiness | A- | 세 검사와 픽셀 재검수 완료. 제품 구현은 별도 단계 |

DESIGN_SCORE: A-

UX_WRITING_SCORE: A- · 뜻말 사용 A · 원인/보존/다음 행동 A · 줄바꿈 A- · 안티슬롭 A

## 레드팀

회의적 고객의 공격: “스크롤을 없앤다는 명목으로 필요한 근거를 숨겼다.”

수정: 데스크톱 카드에는 근거 종류와 표본을 남겼다. 모바일은 선택한 카드의 근거 라벨을 유지하고 긴 이유 문단만 숨겼다. 전체 근거는 자세한 설명 장면과 담당 대화로 접근한다.

## 셀프심문

이 결론이 틀렸다면 가장 그럴듯한 이유는 모바일에서 후보 한 장만 보여 비교가 느려지는 것이다.

수정: 같은 접힘선 안에 후보 1·2·3 탭을 두고, 탭을 누르면 카드가 즉시 교체되게 했다. 세 장을 축소해 동시에 보이는 것보다 읽고 누를 수 있는 한 장을 우선했다.

## 남은 gap

- 프로토타입 산출물이다. 실제 `dashboard/src/app/together/page.tsx` 구현과 제품 E2E는 다음 build·QA 단계 범위다.
- 현재 세션에 design-review 호출 도구가 없어 스킬 기반 독립 등급은 미검증이다. 같은 캡처를 컨트롤러가 2차 픽셀 검수했다.

SOURCES: https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes · https://help.gamma.app/en/articles/8032935-what-s-the-best-way-to-present-my-gamma · https://developer.apple.com/design/human-interface-guidelines/disclosure-controls · https://developer.apple.com/design/human-interface-guidelines/split-views · https://support.anthropic.com/en/articles/9487310-what-are-artifacts-and-how-do-i-use-them · https://support.microsoft.com/en-US/Microsoft-365-Copilot/get-started-with-microsoft-365-copilot-pages · https://help.openai.com/en/articles/9930697-what-is-the-canvas-feature-in-chatgpt-and-how-do-i-use-it

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음

SKILLS_SKIPPED: design-shotgun · design-html · design-review 호출 불가. 품질헌법·자동 검사·실렌더·컨트롤러 2차 픽셀 검수로 대체했으나 스킬 증거는 미검증
