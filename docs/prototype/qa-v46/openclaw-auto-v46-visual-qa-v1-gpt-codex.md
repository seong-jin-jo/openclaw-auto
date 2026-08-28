<!--
STAMP
line: openclaw-auto
created_at: 2026-08-23 21:55 KST
model: gpt-codex/gpt-5.6-sol
agent: product-designer
skills: 제품 UI 독립 리뷰 스킬 없음. design.md §14 픽셀 대조와 브라우저 실측 적용
basis: openclaw-auto-4room-v45.html, openclaw-auto-4room-v46.html, DESIGN.md v24, qa-results.json
-->

# v46 시각 QA

한 줄 결론: 390·1024·1440 실제 렌더를 직접 열어 확인했고, 디스플레이 넘침 0, 오른쪽 담당 상시 노출, 전체 사이드바 224→56px 전환, 본문 단계명 중복 0을 관찰했다.

## 1. 영역별 판정표

| 영역 | v45 | v46 실제 렌더 | 판정 | 사용자 결과 |
|---|---|---|---|---|
| 헤더 한 줄 | 학습 정보가 크레딧 왼쪽 | 390·1024·1440 모두 높이 61px, wrap `nowrap`, 가로 넘침 0 | 일치·보존 | 단계와 전역 정보 순서를 다시 배우지 않음 |
| 헤더 2층 진행 띠 | 네 단계 이름과 현재 단계 강조 | 네 단계 유지 | 일치·보존 | 본문에서 단계명을 빼도 현재 위치를 잃지 않음 |
| 왼쪽 사이드바 | 224px 고정 | 224px 펼침, 아이콘 클릭 뒤 56px, `사이드바 펼치기` 접근 가능한 이름, 저장값 `true` | 개선 통과 | 1024에서 본문 폭 168px 회복 |
| 디스플레이 본문 | 네 방 레일과 현재 방 이름 반복 | `받아온 묶음 / 다음 묶음`만 표시. 흐름 화면 12개에서 생성실·편집실·발행실·성과실 0건 | 개선 통과 | 같은 단계명을 두 번 읽지 않고 현재 결정에 집중 |
| 오른쪽 담당 | 원형 단추로 접힘 | 1024·1440 304px 오른쪽 열, 390 372px 본문 아래. 세 폭 모두 `persistent` | 개선 통과 | 도움을 찾기 위해 단추를 다시 열 필요 없음 |
| 390 밀도 | 접힌 담당 단추 | 디스플레이 높이 336px 뒤 담당 입력까지 한 프레임에 표시 | 개선 통과 | 카드와 44px 입력을 함께 보며 대화 가능 |
| 카드 여백 A | 출처 없는 높이 맞춤 | 세 카드 339/339/339px | 근거 보강 | 같은 종류 결과를 공통 기준선에서 비교 |
| 카드 여백 B | 출처 없는 내용 높이 | 세 카드 189/229/230px | 근거 보강 | 정보량 차이를 빈 공간 없이 훑음 |
| 선택·저장·미리보기·복사 | 2화면 저장과 iframe 2개 | 선택 2개, 미리보기 2개, 메모·B안 포함 문장, 저장 상태 확인 | 회귀 없음 | 화면을 고른 뒤 같은 패널에서 다음 명령으로 넘김 |

## 2. 실측 증거

`qa-results.json`의 모든 요약값이 `true`다.

- 131개 화면 전수: 금지 문구 `되짚어 보기 / 가리킴 목록 / 내 에이전시`와 층 코드 노출 0건.
- v46 흐름 화면 12개: 본문 단계명 중복 0건.
- 390·1024·1440: 전달 요약 가로 넘침 0, 흐름 보드 세로 넘침 0, 프로토타입 가로 넘침 0.
- 담당: 1024·1440 실제 폭 304px, 390 실제 폭 372px. 세 폭 모두 상시 표시.
- 콘솔 오류: 0건.

## 3. 캡처

클릭하면 원본 크기로 확인할 수 있다.

- [390 라이트](./openclaw-auto-v46-390.png)
- [1024 라이트](./openclaw-auto-v46-1024.png)
- [1024 사이드바 접힘](./openclaw-auto-v46-1024-sidebar-collapsed.png)
- [1440 다크](./openclaw-auto-v46-1440.png)
- [A · Stitch 높이 맞춤](./openclaw-auto-v46-card-space-a-1024.png)
- [B · Linear 내용 높이](./openclaw-auto-v46-card-space-b-1024.png)
- [선택·저장·미리보기·복사](./openclaw-auto-v46-screen-selection.png)

## 4. 벤치마크 차용·기각

| 출처 | 직접 확인 | 차용 | 기각 |
|---|---|---|---|
| Google Stitch | 본체 WebFetch는 본문 0줄. 공식 발표의 1928×1085 canvas와 1920×1080 Play 이미지를 직접 열어 확인 | A안의 동일 규격 프레임, 공통 위·아래선, 일정한 간격 | 무한 캔버스와 자유 스크롤 |
| Linear Board | 공식 문서에서 카드가 설명과 전체 속성을 상시 보이지 않고 Space Peek로 상세를 여는 구조 확인 | B안의 내용 높이와 필수 정보 밀도 | 모든 상세를 카드 안에 넣는 안 |
| Notion Sidebar | 공식 도움말에서 `<<`·`>>`, `Ctrl/Cmd+\` 전체 열기·닫기 확인 | 아이콘 하나, 접근 가능한 열기·닫기 이름 | hover만으로 상태를 바꾸는 안 |
| Microsoft 365 Copilot | 공식 도움말에서 앱 옆 side pane의 Copilot Chat 확인 | 작업물 옆 상시 대화 문맥 | 별도 팝업으로 분리 |
| Figma UI3 | 공식 글에서 collapsible·resizable panels와 hover-only 시도의 문제 확인 | 접어 캔버스 폭을 회복하는 원리 | 전체 UI 숨김, hover-only 패널 |

## 5. 레드팀과 셀프심문

레드팀: 1024 펼침 상태는 디스플레이 카드가 좁다. 그러나 텍스트는 넘치지 않고 선택·다음 행동은 유지된다. 사용자가 사이드바를 접으면 카드 폭이 즉시 회복되며 선택은 저장된다. 기본 자동 접힘은 사용자의 메뉴 맥락을 예고 없이 바꾸므로 넣지 않았다.

셀프심문: 390의 담당을 아래에 둔 것이 `오른쪽 상시 노출`을 어긴 것으로 읽힐 수 있다. 물리적 오른쪽 고정을 유지하면 390에서 카드와 입력이 동시에 읽히지 않는다. v46은 상시 노출이라는 행동 계약을 지키고 반응형 위치만 아래로 바꿨다. 이 해석이 다르면 `회수 필요`다.

DESIGN_SCORE: B+ · 요구 충실도 A · 시각 위계 A- · 일관성 A · 가독성 B+ · 공간 구성 B+ · 반응형 A- · 상호작용 A · 출고 준비 B+

SOURCES: docs/prototype/qa-v46/qa-results.json · docs/prototype/openclaw-auto-4room-v45.html · docs/prototype/openclaw-auto-4room-v46.html · DESIGN.md v24 · https://stitch.withgoogle.com/ · https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/ · https://linear.app/docs/board-layout · https://www.notion.com/en-gb/help/navigate-with-the-sidebar · https://support.microsoft.com/en-US/Microsoft-365-Copilot/how-copilot-chat-works-in-microsoft-365-apps · https://www.figma.com/blog/behind-our-redesign-ui3/
MODEL: gpt-codex/gpt-5.6-sol · agent: product-designer
SKILLS_USED: 없음
SKILLS_SKIPPED: 현재 설치 목록에 제품 UI 화면 제작과 독립 디자인 리뷰에 맞는 스킬이 없음. design.md §14 픽셀 대조와 브라우저 실측으로 대체
