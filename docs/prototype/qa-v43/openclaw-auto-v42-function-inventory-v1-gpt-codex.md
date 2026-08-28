# v42 기능 인벤토리

> STAMP | line: openclaw-auto | 생성: 2026-08-22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

v43 착수 전에 v42의 화면 정의 107개, 핵심 렌더 함수, 채널 15종, 상태와 반응형 계약을 읽어
보존 범위를 잠갔다. 아래 표의 `유지`는 v43에서도 경로·상태·상호작용을 지운다는 뜻이 아니다.

## 화면 그룹 107개

| v42 그룹 | 화면 수 | v43 처리 |
|---|---:|---|
| 디스플레이 v42 | 10 | 발표형 디스플레이로 수선 |
| 같이 보는 화면 v41 | 14 | 이력·회귀 대응용 보존 |
| 처음 시작 세 단계 | 5 | 유지 |
| 학습 정보 | 8 | 유지. 헤더 진입 위치만 이동 |
| 배운 규칙 승낙 | 2 | 유지 |
| 값을 바꾼 뒤 | 2 | 유지 |
| 제작 정보 | 2 | 유지 |
| 담당이 먼저 건네는 말 | 2 | 유지 |
| 칸 나눔 | 1 | 유지. 최신 작업 공간·스킬 계약으로 정합 |
| 네 개의 방 | 12 | 유지 |
| 진입 | 5 | 유지 |
| 학습 정보 시작 | 3 | 유지 |
| 제작 시작 | 7 | 유지 |
| 시장과 언어 | 1 | 유지 |
| 결과 후보 | 4 | 유지 |
| 판단과 확정 | 3 | 유지 |
| 미리보기 편집 | 4 | 유지 |
| 승인 인박스 | 4 | 유지 |
| 채널 | 4 | 유지 |
| 성과·학습 정보 | 8 | 유지 |
| 설정과 운영 | 4 | 유지 |
| 채널 운영과 요금 | 2 | 유지 |

## 핵심 기능 잠금

| 기능 | v42 구현 근거 | v43 처리 |
|---|---|---|
| 공통 셸 | `shell`, `gnb`, `stageBar` | 유지. GNB 한 줄 관계만 재배치 |
| 네 방 | `roomCreate`, `roomEdit`, `roomPublish`, `roomPerf` | 유지 |
| 작업물·단계 서랍 | `stageTray`, `works` | 유지 |
| 학습 정보 | `learnPage`, `gnbPanelBody('learn')` | 유지. 크레딧 바로 왼쪽으로 이동 |
| 디스플레이 | `togetherPage`, `stageBody`, `stageCard` | 유지. 카드 자체 선택·아이콘 확대 |
| 담당 대화 | `chatDock`, `talkBody`, `askBlock` | 유지. 기본 접힘·둥근 호출 단추·패널 전개 |
| 상태 5종 | success, empty, loading, error, overflow | 유지 |
| 테마 | light, dark | 유지 |
| 폭 | 390, 1024, 1440 | 유지 |
| 고객·운영자 | customer, operator | 유지 |
| 채널 15종 | Threads, Instagram, X, Facebook, LinkedIn, Bluesky, Pinterest, Tumblr, TikTok, YouTube, Naver Blog, Telegram, Discord, Slack, LINE | 전량 유지 |

## 회장 지시로 제거

| 제거 대상 | v42 남은 위치 | v43 처리 |
|---|---|---|
| 별도 브랜드 줄·브랜드 화면 | `brandStrip`, `brandPage` | 회장 지시로 제품 경로에서 제거. 브랜드가 다르면 작업 공간을 추가 |
| 되짚기·가리킴 목록 | v41 이력 화면·검수 대응표 | 회장 지시로 제품 기능 제거. 이력 문구는 검수 셸에서 제거 사실만 남김 |
| `내 에이전시` | 이력·검수 문구 | 회장 지시로 제품 문구 0 유지 |
| 문장형 보조 행동 | `stageCard`의 확대·담당 전달 단추 | 카드 자체 선택 + 아이콘 확대 한 개로 교체 |

SOURCES: `docs/prototype/openclaw-auto-4room-v42.html` · `docs/requests/회장-확정-요구사항-대장.md` R79~R90 · `DESIGN.md`

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음

SKILLS_SKIPPED: 현재 설치 목록에 제품 UI 프로토타입 제작·리뷰 스킬 없음. 디자인 품질헌법과 실렌더 검수로 대체
