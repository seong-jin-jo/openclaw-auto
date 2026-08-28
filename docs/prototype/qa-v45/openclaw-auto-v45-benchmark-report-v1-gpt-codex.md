<!--
STAMP
line: openclaw-auto
version: v1.0.0
created_at: 2026-08-23 17:59 KST
model: gpt-codex/gpt-5.6-sol
agent: product-designer
skills: 매칭되는 설치 제품 UI 디자인 스킬 없음. design.md, writing.md, doc-review.md 적용
basis: openclaw-auto-4room-v45.html, DESIGN.md v23, v45 390·1024 실렌더, 공식 제품 자료 5건
decision: 조사한 원리는 v45에 이미 반영돼 있어 제품 UI 변경 없이 근거 주석만 보강한다.
-->

# openclaw-auto v45 경쟁·레퍼런스 UI 벤치마크

한 줄 결론: 공식 제품 자료 5건을 다시 조사한 결과, v45의 네 방 흐름·접힌 대화·화면 저장과 미리보기 구조를 바꿀 근거는 없었다. URL과 차용·기각 판단을 프로토타입 우측 벤치마크 패널에 보강했고 제품 화면은 변경하지 않았다.

## 목차

1. [조사 범위와 판정 기준](#1-조사-범위와-판정-기준)
2. [실조사 결과](#2-실조사-결과)
3. [v45 변경 판단](#3-v45-변경-판단)
4. [보존·회귀 범위](#4-보존회귀-범위)
5. [레드팀과 셀프심문](#5-레드팀과-셀프심문)
6. [자기점검](#6-자기점검)

## 개정 이력

| 버전 | 일시 | 작성자 | 변경 |
|---|---|---|---|
| v1.0.0 | 2026-08-23 17:59 KST | product-designer · gpt-codex/gpt-5.6-sol | v45 벤치마크 반려 사유 보강. 공식 UI 5건의 차용·기각 판단 기록 |

## 1. 조사 범위와 판정 기준

이번 조사는 v45 게이트에서 부족했던 외부 UI 근거만 보강한다. 다음 세 화면군을 분리해 확인했다.

1. 콘텐츠 제작 과정을 단계로 보여 주는 제품
2. 접어서 호출하는 대화 위젯
3. 화면을 고르고 저장한 뒤 미리보는 보드

판정 기준은 `~/.claude/standards/design.md`의 한 화면 한 결정, 상태 가시성, 사용자 통제감, 무스크롤 정보 예산과 회장 확정 규칙이다. 확정 규칙은 한 줄 헤더, 학습 정보의 크레딧 왼쪽 고정, 디스플레이 내부 세로 스크롤 0, 대화 기본 접힘, 되짚어 보기와 내 에이전시 제거, 제품 화면의 층 코드 노출 금지다.

## 2. 실조사 결과

| 화면군 | 제품과 공식 URL | 확인한 UI 흐름 | 차용 판단 | 기각 판단 | v45 반영 위치 |
|---|---|---|---|---|---|
| 콘텐츠 제작 단계 | [Jasper Campaigns](https://www.jasper.ai/blog/social-media-marketing-guide-jasper) | 새 캠페인에서 자산 유형을 고르고, 자산을 개별 생성해 한 캠페인 폴더에 저장한다. 생성된 자산은 Kanban 초안 구역에서 열어 편집한다. | 자산 선택, 개별 생성, 한 묶음 저장, 편집의 순차성을 네 방 진행 띠와 방 사이 전달물에 반영 | Kanban 열을 그대로 쓰면 방 역할과 방 사이 전달물이 같은 계층으로 보여 기각 | 생성실, 편집실 우측 벤치마크 패널 |
| 콘텐츠 제작 단계 | [Canva Content Planner](https://www.canva.com/learn/using-canva-content-planner-social-content/) | 디자인을 만들고, 채널과 캡션을 정하고, 예약 또는 초안 저장을 한 뒤 성과를 확인한다. 제작부터 게시와 분석까지 한 공간에서 이어진다. | 생성실, 편집실, 발행실, 성과실을 하나의 순환 흐름으로 연결하는 근거로 사용 | 달력 중심 시작은 현재 방과 전달물보다 날짜를 먼저 읽게 해 기각 | 생성실, 발행실 우측 벤치마크 패널 |
| 접히는 대화 위젯 | [Intercom Messenger](https://www.intercom.com/help/en/articles/6612589-set-up-and-customize-the-messenger) | 화면 한쪽에 Messenger Launcher를 고정하고, 설정에 따라 Home을 건너뛰어 대화로 바로 진입할 수 있다. 위치와 여백을 조정할 수 있다. | 오른쪽 아래 고정 호출 단추, 필요할 때만 대화 펼침, 디스플레이 폭 유지에 반영 | Home, Messages, Tickets, Help 등 여러 공간을 먼저 노출하면 디스플레이 한 장을 가려 기각 | 디스플레이 기본 접힘과 대화 펼침 우측 벤치마크 패널 |
| 화면 선택·저장·미리보기 | [Google Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/) | 작업이 캔버스에 실시간으로 나타나고 완성 전에도 반복 조정할 수 있다. 결과 화면은 공유하거나 개발 단계로 내보낼 수 있다. | 화면을 고르고 저장한 뒤 복사 문장으로 넘기는 검수 고리에 반영 | 자유 캔버스는 발표형 디스플레이의 무스크롤 원칙과 충돌해 기각 | v45 상단 STAMP 벤치마크 기록 |
| 화면 선택·저장·미리보기 | [Figma prototype Preview](https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes) | 같은 탭의 인라인 미리보기, 여러 흐름 시작점, 화면 맞춤, UI 숨김을 제공한다. 별도 Present 보기로 전환할 수도 있다. | 선택한 실제 화면을 저장 직후 같은 보드에서 iframe으로 확인하고, 단계별 시작 화면을 유지하는 데 반영 | 별도 Present 탭은 선택과 확인을 갈라 회장 검수 동선을 늘리므로 기각 | 편집실과 디스플레이 기본 접힘 우측 벤치마크 패널 |

## 3. v45 변경 판단

제품 화면 변경은 0건이다. 조사에서 확인한 유효 원리는 이미 다음 요소에 들어 있다.

- 콘텐츠 제작 흐름: 생성실, 편집실, 발행실, 성과실의 네 단계와 세 개 전달물
- 접힌 대화: 모든 뷰포트의 오른쪽 아래 고정 호출 단추와 같은 자리 펼침
- 선택 보드: 현재 화면 담기, 선택 자동 저장, 저장 직후 실제 iframe 미리보기, 복사 문장
- 발표형 검수: 390·1024·1440 화면 맞춤과 디스플레이 내부 세로 스크롤 0

새로 넣을 수 있었던 Kanban, 달력, Messenger Home, 자유 캔버스, 별도 Present 탭은 모두 현재 화면의 주인공을 늘리거나 선택과 확인을 갈라 확정 규칙을 훼손한다. 따라서 기각했다.

변경한 것은 검수 셸의 근거 주석뿐이다.

- v45 STAMP의 벤치마크 목록을 5개 공식 자료로 확장
- 생성실, 편집실, 발행실, 디스플레이 기본 접힘, 대화 펼침의 우측 벤치마크 패널에 클릭 가능한 URL 추가
- 각 자료마다 차용한 원리와 기각한 UI 구조를 함께 명시

## 4. 보존·회귀 범위

| 확정 규칙 | 결과 |
|---|---|
| 헤더 한 줄 가로 | 변경 없음 |
| 학습 정보가 크레딧 왼쪽 | 변경 없음 |
| 디스플레이 내부 세로 스크롤 0 | 변경 없음 |
| 대화 기본 접힘 단추 | 변경 없음 |
| 되짚어 보기 제거 | 변경 없음 |
| 내 에이전시 제거 | 변경 없음 |
| 제품 화면 층 코드 노출 금지 | 변경 없음 |
| v45 화면 131개와 상호작용 | 변경 없음 |

화면 임팩트 맵: 제품 프레임 변화가 없어 교차 화면 영향도 0건이다. 검수 셸의 우측 설명 패널과 HTML 주석만 길어졌고, 제품 렌더·데이터·레이아웃·상태·동작에는 영향을 주지 않는다.

## 5. 레드팀과 셀프심문

레드팀 공격: 다섯 제품을 조사하고도 화면을 하나도 바꾸지 않았다면 형식적 조사가 아닌가.

수정 뒤 답: 바꾸지 않는 판단도 화면별 근거와 기각 이유가 있어야 유효하다. Jasper의 Kanban, Canva의 달력, Intercom의 Home, Stitch의 자유 캔버스, Figma의 별도 Present 탭을 v45에 더하면 네 방의 역할과 현재 전달물, 디스플레이 한 장이라는 정보 위계가 약해진다. 조사 결과는 새 요소가 아니라 기존 결정의 근거를 강화했다.

이 판단이 틀렸다면 가장 그럴듯한 이유는 무엇인가: 우측 벤치마크 패널이 길어져 검수자가 핵심 화면보다 설명을 더 오래 읽을 수 있다.

수정: 화면별 패널에는 해당 화면과 직접 관련된 제품 1개 또는 2개만 배치했다. 전체 근거와 다섯 제품 비교는 이 보고서로 분리했다. 제품 프레임 안에는 벤치마크 문구를 넣지 않았다.

## 6. 자기점검

- `~/.claude/standards/design.md`, `writing.md`, `doc-review.md`, `benchmarks.md` 실제 확인
- WebSearch 8개 검색어, 공식 페이지 5개 직접 열람
- 공식 URL, 확인 사실, 차용, 기각 판단 기록
- 기존 v45 화면 구조와 확정 규칙 변경 0
- 긴 대시 0

DESIGN_SCORE: B+ · 요구 충실도 A · 시각 위계 A- · 일관성 A- · 가독성 B+ · 공간 구성 A- · 반응형 B+ · 상호작용 A · 출고 준비 B+

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크반영=5/5 추적성=5/5 전문성톤=4/5 total=24/25

WEAKEST_LINE: "화면 임팩트 맵: 제품 프레임 변화가 없어 교차 화면 영향도 0건이다." 근거 주석 자체의 읽기 비용은 생기므로 바로 다음 문장에서 영향 범위를 검수 셸로 한정했다.

SOURCES: `docs/prototype/openclaw-auto-4room-v45.html` · `DESIGN.md` v23 · `docs/prototype/qa-v45/openclaw-auto-v45-390.png` · `docs/prototype/qa-v45/openclaw-auto-v45-1024.png` · <https://www.jasper.ai/blog/social-media-marketing-guide-jasper> · <https://www.canva.com/learn/using-canva-content-planner-social-content/> · <https://www.intercom.com/help/en/articles/6612589-set-up-and-customize-the-messenger> · <https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-updates/> · <https://help.figma.com/hc/en-us/articles/360040318013-Play-your-prototypes>

MODEL: gpt-codex/gpt-5.6-sol · agent: product-designer

SKILLS_USED: 없음

SKILLS_SKIPPED: 현재 설치 목록에 제품 UI 화면 제작과 독립 디자인 리뷰에 맞는 스킬이 없음. `design.md`, `writing.md`, `doc-review.md`, `benchmarks.md`와 실렌더 픽셀 검수로 대체
