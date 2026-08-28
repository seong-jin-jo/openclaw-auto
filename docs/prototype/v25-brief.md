# v25 브리프 — 기존 v24를 이어 완성 (신규 제작 아님)

> STAMP | v25-brief | 2026-08-16 | opus-5 | 회장 지적 "기존 openclaw-auto에서 뺄 건 빼고 넣을 건 넣으면서 만들어라"
> 규율: **기존 v24를 복사해 편집(진화). 새 IA·화면 창작 금지. 실제 코드(dashboard/src)가 진실원. 재창조 금지.**
> 이빨: `.claude/hooks/no-reinvent-gate.sh`가 신규 프로토타입 파일 생성을 차단한다. v24 복사로만 진행한다.

## 왜 이 브리프가 다시 필요한가

v23이 재창조로 감사 불통과했고(회장 R-03/R-13), v25 1차 시도가 같은 위반을 반복해 폐기됐다. 원인은 위임 프롬프트에 기준 파일과 현행 화면 목록을 넣지 않은 것이다. 이 브리프가 그 해석 여지를 없앤다.

## 기준 파일 (이것을 복사해서 v25로)

`docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` (353KB, v15부터 9회 진화)

산출: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v25-gpt-codex.html`

## 진실원 (반드시 대조할 것)

| 층 | 경로 | 용도 |
|---|---|---|
| 실제 코드 | `dashboard/src/app/**/page.tsx`(25개 라우트), `dashboard/src/components/` | 코드에 없는 화면을 그리면 재창조 |
| 현행 화면 지도 | `wiki/product/marketing-hub-surface-map.md` | 사이드바 26항목, 라우트 25개, Studio 인벤토리의 정본 |
| 실측 스크린샷 | `docs/prototype/qa-v24/` | 픽셀 판정 기준 |
| 디자인 시스템 | `DESIGN.md` v16 | 토큰, 간격 6단, 글자 7단, 넘침 규칙 |
| 와이어프레임 계보 | `docs/WIREFRAMES/marketing-agent-v24-gpt-codex.md` | 화면 구조 이력 |

## 현행 구조 (바꾸지 말 것)

- 셸: `AuthGate`가 랜딩·고객 Marketing Hub·운영자 셸을 가른다.
- 고객 사이드바 26항목: Performance, OSMU Studio, Approval Inbox, Publishing Calendar, Social 5, Messaging 3, Video 2, Data 3, Keyword 4, Blog, Images, Videos, Midjourney, Settings.
- 채널 탭 규칙: 일반 소셜은 Queue/Analytics/Settings, Threads만 Growth/Popular 추가, Instagram은 Queue/Editor/Settings.
- 고객 Settings 8탭, 운영자 Settings 9탭(Video/TTS 추가).
- Studio 인벤토리: 시각 미리보기 7종, 직접 발행 4종, 텍스트 어댑터 8종, 영상 출력 3종. 이 숫자를 합치거나 바꾸지 않는다.

## 넣을 것 (신규 4개, 전부 기존 화면 안에 additive)

근거: `docs/제품구조-결정-2026-08-15.md` §9.6 §9.7, `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md`, PRD v8.2.1.

| 신규 | 어디에 붙이나 | 내용 |
|---|---|---|
| 타깃 시장·출력 언어 선택 | `/studio` 제작 시작 영역 | 한국/일본/영어권/태국, 한국어/English/日本語/ไทย. 선택값은 상단 요약으로 유지. 한국어와 English만 품질 보증 범위임을 명시 |
| 저해상도 후보 비교 | `/studio` 생성 결과 영역 | 후보 3개, 각 고해상도 예상 비용과 소요 시간. "선택한 하나만 고해상도로 만들어집니다", "나머지를 나중에 고해상도로 만들면 추가 과금입니다" |
| 요청 조립 4층 노출 | `/studio` 추천 근거 영역 | 타깃 시장(요청값), 마케팅 공통 지식(추천 근거), 개인 취향(언어별), 브랜드 제약(온보딩). 왜 이걸 추천했는지 볼 수 있어야 한다 |
| 추천 근거 카드 | 질문 영역 | 추천 1개 우선 제시 + 근거 + 예상 비용 범위 + 소요 시간. 질문 3개 상한, 건너뛰기 |

편집 화면에는 자막·컷 조정이 추가 크레딧 없음, 나레이션 변경과 소재 교체는 과금이라는 표시를 더한다. 발행 화면에는 승인 후 발행이 기본이고 자율 발행이 옵션임을 표시한다.

## 뺄 것 (근거 있는 것만)

| 대상 | 사유 |
|---|---|
| `/google-analytics`, `/naver-trends`, `/search-advisor`의 unavailable 패널 | 의도적 비활성 상태가 화면을 차지한다. 접기 또는 Settings로 이동 |
| 운영자 화면의 BI·세그먼트·예측 성격 요소 | 레드팀 판정. 잔액·실패·큐·토큰 만료·고객 막힘·환불 근거만 남긴다 |
| 근거 없는 성과 점수 표시 | 외부 표본이 없다. 가설 또는 내 계정 데이터로 표기 |
| "원클릭" 표현 | 고르게 해서 취향을 배우는 것이 우리 방식이다 |

관측된 시각 결함도 함께 고친다. 390px에서 사이드바 사라짐, `/videos` 14px 넘침, `/search-console` 89px 넘침.

## 완료 기준

- v24 대비 재창조 0건. 사이드바 26항목, 라우트 25개, Studio 인벤토리 숫자가 그대로일 것.
- 신규 4개가 기존 화면 안에 들어갔을 것. 별도 신규 화면 창작 0건.
- design-review 스킬 실호출, 등급 B+ 이상.
- 390·1024 라이트·다크 스크린샷을 `docs/prototype/qa-v25/`에 남기고 영역별 픽셀 대조표 작성.
- 컨트롤러가 스크린샷을 직접 열어 재확인한 뒤에만 회장에게 제출.
