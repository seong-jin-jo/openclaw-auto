# DESIGN 아카이브 · v15 ~ v31 (2026-08-18 이관)

이 파일은 DESIGN.md에 시간순으로 누적돼 있던 과거 판 본문을 **원문 그대로 옮긴 것**이다. 지우지 않았다.

- 이관일: 2026-08-18 · 옮긴이: product-designer
- 이관 전 DESIGN.md: 4,468줄 (v15부터 v31까지 17개 판이 append돼 있었음)
- 현행 시스템은 `DESIGN.md`에만 있다. 이 파일은 결정의 유래를 되짚을 때만 읽는다.

---

# Marketing Hub OSMU 디자인 시스템 v16

> STAMP: created_at=2026-08-06 00:28 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=actual Chrome empty/generated captures and current Studio source | deliberation=기존 preview UI를 그대로 두고 각 preview 바로 아래에만 발행 제어를 추가한다

## 1. 정본과 폐기

v11 디자인은 철회한다. v12의 유일한 시각 기준선은 다음 두 실제 Chrome 렌더다.

- empty: `/private/tmp/osmu-existing-studio-browser-baseline.png`
- generated visual7: `/private/tmp/osmu-existing-studio-generated-baseline.png`

구현 구조의 정본은 현재 `Studio/page.tsx`, `PlatformPreview.tsx`, `Sidebar.tsx`, `globals.css`다. PRD는 기능 범위 정본이며 시각 기준선을 덮어쓰지 않는다.

## 2. One Thing

기존 Studio 사용자가 익숙한 생성, 편집, 저장, bulk 발행 흐름을 잃지 않은 채 각 preview 카드 하나만 안전하게 발행하고 결과 링크를 확인한다.

## 3. 브랜드 형용사 3개

| 형용사 | 화면 발현 |
|---|---|
| 익숙한 | current toolbar, sidebar, history, native preview를 그대로 유지 |
| 정직한 | 발행 전, 처리 중, 성공, 거절, 결과 미확인 상태를 분리 |
| 통제되는 | 개별 카드 조작은 다른 6개 카드와 legacy bulk 선택을 바꾸지 않음 |

## 4. 기준선 보존 계약

삭제, 이동, 재해석 금지:

- 224px customer Sidebar와 26개 항목, 9개 그룹
- 첫 줄 `OSMU Studio`, `AI 확인 중`, source input, 브랜드 설정, 위키, OSMU 생성, AI 자동초안, Save, `Publish (4)`
- 둘째 줄로 wrap되는 예약 버튼
- amber Higgsfield 운영자 전용 notice
- 텍스트 section의 Threads, X, Facebook horizontal native previews
- 카드뉴스 section의 Instagram 380px large vertical preview
- 영상 section의 Shorts, Reels, TikTok 9:16 previews
- right 208px 발행 이력과 불러오기
- legacy direct4 checkbox와 top bulk Publish
- current color, typography, spacing, radius, preview dimensions

Discord와 Slack은 Sidebar 채널이다. Studio preview surface는 0개다.

## 5. Additive 계약

각 기존 preview 바로 아래에만 `CardPublishControl`을 추가한다. 프로토타입에서는 파란 점선과 `v12 추가 영역` 라벨로 신규 범위를 명시한다. 제품 구현 시 라벨과 점선은 QA 표시이며 출시 UI에는 제거한다.

구성:

- 상태 1줄
- 기존 플랫폼별 편집 진입
- 카드별 Publish
- processing spinner
- published provider permalink
- failed의 같은 카드만 재시도
- unknown의 재발행 없는 결과 확인

카드 제어가 preview 내부 레이아웃, section heading, rail width, history 위치를 변경해서는 안 된다. 추가 제어 때문에 다음 section의 y만 아래로 이동할 수 있다.

## 6. 토큰

### Color

| token | value | use |
|---|---:|---|
| bg | `#fbfbfc` | app background |
| surface | `#ffffff` | sidebar, panels |
| surface-2 | `#f4f4f5` | input and secondary surface |
| border | `#e4e4e7` | current borders |
| text | `#18181b` | primary text |
| muted | `#52525b` | secondary text |
| subtle | `#a1a1aa` | metadata |
| accent | `#2563eb` | current primary and QA outline |
| success | `#16a34a` | published and bulk Publish |
| warning | `#d97706` | processing and unknown |
| danger | `#dc2626` | failed |

### Typography

- family: current `Pretendard`, Apple system fallback
- title: 18/22, 700
- body preview: 15/1.4 to 1.45
- section: 13, 700
- metadata: 10 to 12
- status: 11, 600

### Spacing and dimensions

- base spacing: 4px
- main inset: 24px desktop, 16px mobile
- toolbar gap: 12px desktop, 8px compact
- preview rail gap: 20px
- preview width: 380px current, 360px at 1024, 340px at 390
- Sidebar: 224px desktop
- history: 208px at 1440, 190px at 1024
- Instagram media: square, preview width와 동일
- video: 9:16
- additive action target: minimum 44px

## 7. 컴포넌트 inventory

Existing:

- `Sidebar`
- `StudioToolbar`
- `RepoConnect`
- `SchedulePanel`
- `GenerationNotice`
- `PreviewSection`
- `PlatformPreview.Threads`
- `PlatformPreview.X`
- `PlatformPreview.Facebook`
- `PlatformPreview.Instagram`
- `PlatformPreview.Shorts`
- `PlatformPreview.Reels`
- `PlatformPreview.TikTok`
- `PublishHistory`
- `PlatformEditDrawer`

Additive (v25, `/studio` 안에서만 살고 새 라우트를 만들지 않음):

- `MarketLanguagePicker` — 타깃 시장 4개, 출력 언어 4개. 선택지는 `.platform-tabs`를 재사용하되 좁은 화면에서는 줄바꿈(`flex-wrap:wrap`). 한국어와 English는 품질 보증, 나머지는 경고 톤 안내.
- `MarketSummaryStrip` — 시장·언어·품질 판정·선택 후보 4항목. `--surface` 위 1px `--border`, `--radius`, 가로 넘치면 줄바꿈.
- `RecommendationCard` — 추천 1개 먼저, 근거·비용 범위·소요 시간 순. 질문은 최대 3개, 건너뛰기 버튼 상시.
- `AssemblyDisclosure` — 요청 조립 네 층(타깃 시장, 마케팅 공통 지식, 개인 취향, 브랜드 제약). 펼침·접힘 1개 버튼.
- `LowResCandidateGrid` — 후보 3개. 열 수 고정: 390에서 1열, 900px 이상에서 3열. 썸네일은 9:16 고정(모바일 108px, 데스크톱 132px 너비). 카드 안 텍스트는 `white-space:normal`로 전역 버튼 규칙(한 줄 고정)을 무효화한다.
- `EditCostNote` — 자막·컷 조정은 추가 크레딧 없음, 나레이션 변경·소재 교체는 과금. 성공/경고 배지 2줄.

Additive (v12):

- `CardPublishControl`
- `CardPublishStatus`
- `ProviderPermalink`
- `CardRetryAction`
- `CardReconcileAction`

## 8. 상태

| 상태 | 표시 | 가능한 행동 |
|---|---|---|
| empty | 기존 empty copy와 history | source 입력, history 불러오기 |
| draft | 초안 | 편집 |
| saved | 저장됨, 발행 준비 | 개별 Publish, bulk Publish, 예약 |
| processing | spinner, 해당 카드만 disabled | 다른 6개 편집/발행 |
| published | 발행됨, permalink | 게시물 보기 |
| failed | 플랫폼 거절 | 해당 카드만 다시 발행 |
| unknown | 발행 여부 확인 필요 | 결과 확인, 즉시 재발행 금지 |
| loading | 기존 생성/자동초안/예약 loading | 현재 작업만 busy |

## 9. 반응형

- 1440: 실제 기준선의 224 sidebar, 940 content, 208 history 유지
- 1024: 224 sidebar, 548 content, 190 history, preview rail horizontal scroll
- 390: Sidebar 항목을 상단 horizontal rail로 제공, toolbar 2열, content 340px rail, history는 마지막에 배치
- 모든 폭에서 page overflow 0. rail 내부 horizontal scroll은 current 기능이다.

## 10. 금지 패턴

- current preview를 generic white card로 교체
- visual7을 동일한 카드 템플릿으로 평준화
- top bulk Publish 삭제 또는 card Publish로 대체
- 예약, Save, Wiki, history 이동이나 삭제
- Discord/Slack Studio 카드 추가
- 결과 미확인 상태에서 안전 확인 없이 재발행
- 실제 provider 응답 없이 성공 또는 permalink 확정
- gradient, blob, bubbly dashboard, 카드 안 카드 장식
- em dash, en dash

## 11. 벤치마크 적용

| source | 차용 | 변경 |
|---|---|---|
| 실제 Marketing Hub Chrome | shell, toolbar wrap, preview hierarchy, dimensions | preview 아래 제어만 추가 |
| Buffer Post Groups | group 안 게시물 독립 동작 | visual7 각 card isolation |
| Later Multi-Profile | 공통 source 후 profile customization | current rail과 bulk를 유지 |
| Sprout approval | 상태 가시성과 실패 복구 | retry, reconcile를 카드에 한정 |

## 12. 레드팀

공격: 개별 발행을 넣는다는 이유로 기존 Studio가 다른 제품처럼 보이면 기존 사용자는 학습 비용과 bulk 효율을 동시에 잃는다.

수정: 실제 Chrome baseline mode에서는 신규 영역을 완전히 숨겼다. additive mode는 preview 자체를 건드리지 않고 아래 점선 영역만 더한다. top bulk, Save, 예약, Wiki, history는 동일 위치와 의미를 유지한다.

## 13. 셀프심문

이 결론이 틀렸다면 가장 그럴듯한 이유는 HTML prototype과 실제 React 렌더의 폰트 raster, icon SVG, 데이터 길이가 달라 pixel diff가 0이 아니기 때문이다. 이를 숨기지 않고 baseline PSNR과 DOM anchor를 기록한다. build에서는 current component를 복제하지 말고 기존 `PlatformPreview`에 sibling control을 주입해야 한다.

## 14. Design review

Design Score: B+

AI Slop Score: B+

- current visual fidelity: A
- feature preservation: A
- additive boundary clarity: A
- responsive usability: B
- exact raster parity: B

## 15. 회수 필요

- 회수 필요: 실제 provider adapter, idempotency, permalink result schema는 eng-design 합의 대상
- 회수 필요: unknown reconcile의 provider별 종료 조건
- 회수 필요: 390px Sidebar current product 구현 방식

SOURCES: /private/tmp/osmu-existing-studio-browser-baseline.png | /private/tmp/osmu-existing-studio-generated-baseline.png | dashboard/src/app/studio/page.tsx | dashboard/src/components/studio/PlatformPreview.tsx | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/app/globals.css | docs/openclaw-auto-osmu-prd-v4.3.1-gpt-codex.md | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html for actual Chrome baseline reconstruction and additive prototype | design-review for pixel, DOM, responsive, accessibility, and state audit

SKILLS_SKIPPED: 없음

---

# OSMU Marketing Agent 디자인 시스템 v15

> STAMP: created_at=2026-08-06 07:02 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=brand-positioning-kit, design-review method | evidence=PRD v6.1.1 SHA256 00beed4a47317b9f13a9ad80702af5d34540904fbd7f525832ec4c3a74111045, current code, actual Chrome baseline, official benchmarks | deliberation=새 에이전트 제품을 발명하지 않고 기존 owner route를 잇는 증거 기반 주간 루프를 선택했다

## v15의 권위와 범위

v15는 v12를 삭제하거나 시각적으로 재해석하지 않는다. v13과 v14의 invented visual은 입력으로 사용하지 않았다. 시각 권위는 `globals.css`, 현행 컴포넌트, 실제 Chrome baseline이다. 기능 권위는 승인된 PRD v6.1.1이다.

2주 proof의 디자인 범위는 Phase P39와 보존 회귀 R6뿐이다. D3은 화면, 탭, CTA, roadmap preview에 넣지 않는다.

## 브랜드 포지션과 톤앵커

한 문장 포지션: **확인된 브랜드 사실 하나를 실제 Threads 결과와 다음 주 실험까지 잇는, 사장님용 주간 마케팅 관제 루프.**

긴장: 더 많이 자동 발행하는 것보다, 왜 이 판단을 했고 실제로 무엇이 나갔는지 증명하는 쪽을 택한다.

| 형용사 | 이건 아님 | 화면 발현 |
|---|---|---|
| 믿음직한 | AI가 다 했다는 과장 | 사실과 추론 분리, 출처 경로, 계정 handle, 발행 permalink, 수집시각을 행동 반경 안에 표시 |
| 또렷한 | 8단계를 한 화면에 펼친 복잡한 대시보드 | 지금 필요한 결정 하나를 상단에 두고 각 행동은 기존 owner route로 이동 |
| 통제되는 | 무승인 자동 실행 | L2 초안, 게시물별 승인, 승인 후 변경 시 무효, 결과 미확인은 reconcile 우선 |

금기:

1. 출처 없는 기회와 사실을 추천 근거로 사용하지 않는다.
2. 미지원 capability에 연결됨, 발행 가능, 분석 가능 CTA를 표시하지 않는다.
3. 값 없음, 권한 부족, 수집 지연을 숫자 0으로 바꾸지 않는다.
4. 기존 Studio, Inbox, Calendar, Settings, provider별 탭을 새 generic Agent 탭으로 대체하지 않는다.
5. `OSMU`와 `OSMU 팩토리`의 현행 이름을 임의 변경하지 않는다.

## Color tokens

새 hex를 추가하지 않는다. 아래 값은 `dashboard/src/app/globals.css`를 그대로 상속한다.

| token | light | dark | use |
|---|---|---|---|
| `--bg` | `#FBFBFC` | `#0A0A0B` | app background |
| `--surface` | `#FFFFFF` | `#161618` | primary panel |
| `--surface-2` | `#F4F4F5` | `#1F1F23` | secondary panel, input |
| `--border` | `#E4E4E7` | `#27272A` | dividers |
| `--text` | `#18181B` | `#F4F4F5` | primary text |
| `--text-muted` | `#52525B` | `#A1A1AA` | secondary text |
| `--text-subtle` | `#A1A1AA` | `#71717A` | metadata, disabled |
| `--accent` | `#2563EB` | `#3B82F6` | primary action, active state |
| `--accent-hover` | `#1D4ED8` | `#60A5FA` | hover |
| `--accent-fg` | `#FFFFFF` | `#FFFFFF` | accent foreground |
| `--accent-soft` | `#EFF4FF` | `#172554` | selected evidence, info |
| `--success` | `#16A34A` | `#22C55E` | confirmed result |
| `--warning` | `#D97706` | `#F59E0B` | hold, stale, uncertain |
| `--danger` | `#DC2626` | `#EF4444` | failed, permission, destructive |

상태는 색만으로 전달하지 않는다. icon, label, reason을 함께 쓴다.

## Typography tokens

- family: Pretendard, `-apple-system`, BlinkMacSystemFont, system-ui, sans-serif
- page title: 20/28, 650
- decision title: 18/26, 700
- section title: 13/18, 700
- body: 14/21, 400
- action: 13/18, 600
- metadata: 11/16, 500
- metric: 24/30, 700. native name과 수집시각을 11/16으로 반드시 동반

## Spacing, size, responsive tokens

- spacing scale: 4, 8, 12, 16, 20, 24, 32
- radius: panel 12, control 8, status pill 999
- desktop sidebar: 224px, 삭제와 이동 없음
- page inset: 24px at 1440/1024, 16px at 390
- content max: owner route의 현행 너비를 유지. 새 command card는 최대 1120px
- primary action minimum: 44px height
- 390 repair target: 상단 `메뉴` 버튼과 full-height nav drawer. destination 26/26, current route label과 아이콘 보존
- overflow target: page horizontal overflow 0. 내부 preview rail만 의도된 horizontal scroll 허용

## Additive information architecture

`/`는 Marketing Agent Command Center로 확장한다. 새 route는 만들지 않는다.

| Loop node | summary surface | owner route deep-link |
|---|---|---|
| Brand Fact | `/` source strip | `/studio?setup=brand` 또는 현행 위키 연동 |
| Opportunity1 | `/` decision card | `/channels/threads` Popular 또는 해당 owned metric |
| Weekly Plan1 | `/` plan card | `/studio` |
| Threads Card1 | `/` progress item | `/studio` |
| Review/Approval | `/` due item | `/inbox` |
| Immediate/Schedule | `/` status | `/studio`, `/calendar` |
| Result/Permalink | `/` result item | provider permalink, `/inbox` result context |
| Metric or sample-hold | `/` learn card | `/channels/threads` Analytics |
| Experiment decision | `/` next decision | next Weekly Plan on `/` |

## Component inventory

### Preserve unchanged

- `AuthGate`, public/customer/operator shells, blocked screens
- `Sidebar`, 26 customer destinations, `OperatorSidebar`
- `ThemeToggle`, FOUC initialization, `getChannelIcon`
- Studio toolbar, RepoConnect, BrandSetupWizard, PlatformPreview visual7, direct4, edit drawer, history, Save, Publish, SchedulePanel
- Instagram Queue/Editor/Settings and CardNewsEditor
- generic social Queue/Analytics/Settings, Threads Growth/Popular
- Messaging credential/setup, Data credential/setup, Video connection page and `/videos` workbench
- `/inbox`, `/calendar`, `/images`, `/blog`, Search, Keyword owner routes
- Settings customer8/operator9

### Additive v15 components

- `AgentDecisionCard`: reason, evidence, confidence, one next action
- `FactSourceStrip`: fact/inference/unverified, source path, updated time
- `WeeklyPlanCard`: campaign1, 7-day window, goal, audience, offer, hypothesis, approval
- `LoopProgress`: fact to next plan lineage with current node only expanded
- `ReviewTruthPanel`: citations, selected account, capability, schedule, preview
- `PublicationProof`: terminal state, external ID, permalink, published time
- `MetricTruth`: native metric name, definition, source, collected_at, sample state
- `ExperimentDecision`: one changed variable, approve/hold, next plan deep-link
- `MobileNavTrigger` and `MobileNavDrawer`: current missing navigation repair
- `RoleStateBadge`: prototype inspection only, product role is still AuthGate owned

## State contract

| state | copy contract | action contract |
|---|---|---|
| loading | 무엇을 확인 중인지 명명 | cancel or wait, duplicate action disabled |
| empty | 아직 없는 데이터와 첫 행동 | owner route 1개 |
| error | failed phase와 safe reason | confirmed retry 또는 owner route |
| permission | 필요한 권한과 영향 | Settings 또는 provider 관리로 이동 |
| disabled | 미지원 이유 | 가짜 CTA 0 |
| stale | 마지막 확인 시각 | refresh, approval disabled |
| uncertain | 발행 여부 확인 필요 | reconcile first, publish adapter 0 |
| repair_required | 외부 발행 성공, 내부 기록 실패 | record repair only, repost 0 |
| published | external ID/permalink 확인됨 | 게시물 보기 |
| sample_hold | 표본 미달 또는 수집 대기 | 숫자 결론 없이 다음 확인시각 |

## Forbidden patterns

- generic agent chat composer를 제품 중심으로 만들기
- 8단계 lifecycle을 같은 크기 카드 8개로 나열
- provider별 capability를 동일 탭으로 일반화
- gradient, blob, emoji-only icon, bubbly cards, card inside card
- actual source 없는 가짜 숫자, permalink, connected badge
- action 없는 `더 알아보기`, `시작하기`
- loading spinner만 있고 종료 상태가 없는 화면
- mobile에서 sidebar를 숨기고 대체 탐색을 제공하지 않는 상태
- `/videos`와 `/search-console` overflow를 현재 정상으로 표현
- em dash, en dash

## Benchmark application

| source | borrowed principle | OSMU adaptation |
|---|---|---|
| Buffer Post Groups | 관련 게시물은 묶되 개별 edit/publish/status 유지 | campaign lineage는 묶고 Threads card1과 기존 sibling state는 독립 |
| Sprout approval | 외부 게시 전 명시 승인 | L2 draft와 게시물별 account/content/time/hash 승인 |
| Later Social Sets | 브랜드와 계정 경계를 명확히 | workspace와 selected handle을 Review까지 반복 표시 |
| Linear Insights | 요약에서 원본 데이터로 drill-down | metric, insight, next action이 기존 owner route로 deep-link |

## Design review

Design Score: A-

- fidelity and preservation: A
- evidence and state completeness: A
- responsive target: A-
- prototype raster parity with every current route: B, 전체 25 route 구현이 아니라 핵심 loop와 owner deep-link 표현임

## 회수 필요

- ⛔ 회수 필요: `tasks/original-requests-ledger.output`과 `tasks/marketing-agent-code-truth.output`이 레포에 없어 직접 Read 불가. PRD v6.1.1 ledger와 `tasks/osmu-full-ui-code-audit.output`으로 교차 대조했으며 부모가 두 파일의 실제 경로를 확인해야 한다.
- 회수 필요: prototype의 metric 값은 명확한 sample이며 실제 cohort threshold는 eng-design/QA 증거 전 확정 금지.
- 회수 필요: 실 provider publish, OAuth callback, permalink, native metric은 디자인에서 미검증.

SOURCES: docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md | wiki/product/marketing-hub-surface-map.md | wiki/product/studio.md | wiki/reference/channel-status.md | docs/ui-rules.md | dashboard/src/app/globals.css | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/components/shared/AuthGate.tsx | dashboard/src/components/layout/ThemeToggle.tsx | dashboard/src/lib/channel-icons.tsx | dashboard/src/app/settings/page.tsx | dashboard/src/app/channels/[channel]/page.tsx | dashboard/src/components/channel/* | dashboard/src/app/studio/page.tsx | dashboard/src/components/studio/* | tasks/osmu-full-ui-code-audit.output | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows | https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets | https://linear.app/docs/insights

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: brand-positioning-kit for tone anchors, taboo, tension, and competitor-substitution check | design-review method for fidelity, responsive, accessibility, and state audit

SKILLS_SKIPPED: imagegen, bitmap generation이 아니라 current HTML/CSS/component fidelity가 권위이므로 미사용

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=23/25

WEAKEST_LINE: "이번 초안에 쓸 확인된 사실" · 기능은 정확하지만 OSMU만의 긴장은 약해 UI section label로만 사용한다.

---

# OSMU Marketing Agent 디자인 시스템 v16

> STAMP: created_at=2026-08-06 14:56 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer / marketing_agent_v16 | skills=design-review | evidence=PRD v6.1.1, current wiki/code/Chrome authority, official Buffer/Sprout/Later/Hootsuite sources | deliberation=v15의 22개 home 오귀환을 제거하고 26개 메뉴 모두 현행 owner route를 가진 고유 화면으로 만들었다

## v16 판정과 One Thing

v15는 시각 토큰과 핵심 proof loop는 보존했지만, Sidebar 26개 중 22개가 성과 화면으로 되돌아갔다. 이는 메뉴가 존재한다는 모양만 복제하고 실제 제품의 길찾기와 provider별 차이를 지운 중대 결함이다. v16은 v15의 프로토타입 라우팅을 폐기하고, current wiki/code/Chrome을 시각과 동작 권위로 다시 고정한다.

One Thing: **사장님이 지금 해야 할 마케팅 판단 하나를 보고, 기존 제품 화면에서 연결, 제작, 승인, 발행, 결과 확인, 다음 실험까지 길을 잃지 않고 끝낸다.**

## 브랜드 형용사 3개

| 형용사 | 화면 발현 | 검증 질문 |
|---|---|---|
| 믿음직한 | handle, 상태, verified_at, 출처, permalink를 행동 옆에 표시하고 미검증은 수치 0으로 바꾸지 않음 | 이 계정과 숫자를 믿을 근거가 같은 화면에 있는가 |
| 또렷한 | 상단에 지금 할 일 하나, 그 아래 현행 owner action, 보조 정보는 접기 또는 우측 rail | 첫 3초에 다음 행동이 하나로 읽히는가 |
| 통제되는 | 개별 카드 edit/publish, 명시 선택 bulk, 승인 hash, uncertain의 reconcile 우선 | 사용자가 모르는 외부 호출이 생길 수 있는가 |

## Color tokens

새 색을 발명하지 않는다. `dashboard/src/app/globals.css`가 정본이다.

| token | light | dark | use |
|---|---|---|---|
| `--bg` | `#FBFBFC` | `#0A0A0B` | 앱 배경 |
| `--surface` | `#FFFFFF` | `#161618` | Sidebar, 기본 panel |
| `--surface-2` | `#F4F4F5` | `#1F1F23` | 보조 panel, 입력 |
| `--border` | `#E4E4E7` | `#27272A` | 구분선 |
| `--text` | `#18181B` | `#F4F4F5` | 본문 |
| `--text-muted` | `#52525B` | `#A1A1AA` | 보조 텍스트 |
| `--text-subtle` | `#A1A1AA` | `#71717A` | 메타, disabled |
| `--accent` | `#2563EB` | `#3B82F6` | 주 행동, 현재 위치 |
| `--accent-hover` | `#1D4ED8` | `#60A5FA` | hover |
| `--accent-soft` | `#EFF4FF` | `#172554` | 선택, 정보 |
| `--success` | `#16A34A` | `#22C55E` | provider 확인 성공 |
| `--warning` | `#D97706` | `#F59E0B` | stale, sample hold, uncertain |
| `--danger` | `#DC2626` | `#EF4444` | failed, revoked, permission |

상태는 색만으로 구분하지 않는다. 상태명, 이유, 다음 행동을 함께 둔다.

## Typography tokens

- family: 현행 `Pretendard`, `-apple-system`, BlinkMacSystemFont, system-ui, sans-serif를 그대로 상속한다. 이번 디자인은 신규 서체 도입이 아니라 현행 제품 fidelity가 우선이다.
- page title: 20/28, 650
- decision title: 18/26, 700
- section title: 13/18, 700
- body: 14/21, 400. 실제 제품 토큰을 보존하되 핵심 설명은 16px 이상을 사용한다.
- action: 13/18, 600
- metadata: 11/16, 500. handle, verified_at, source, collected_at 전용이다.
- metric: 24/30, 700. native metric 이름, 정의, 수집 시각을 반드시 동반한다.

## Spacing and responsive tokens

- spacing scale: 4, 8, 12, 16, 20, 24, 32
- radius: panel 12, control 8, status pill 999
- desktop Sidebar: 224px
- page inset: 24px at 1440/1024, 16px at 390
- content max: 1180px
- desktop layout: main workspace minmax(0, 1fr), truth rail 300px
- control and navigation target: minimum 44px
- mobile: sticky 54px header, 44px Menu trigger, full-height drawer, 26 destinations, focus return
- page horizontal overflow: 0. Studio preview rail과 tab rail만 내부 스크롤을 허용한다.

## 26 destination routing contract

26개 고객 메뉴는 각각 현행 owner route와 고유 화면을 가진다. 다른 메뉴 클릭이 `/` 성과 화면으로 돌아가는 경우는 0이다.

| group | destinations | owner contract |
|---|---|---|
| Overview 4 | `/`, `/studio`, `/inbox`, `/calendar` | 성과, 제작, 승인, 일정은 서로 대체하지 않음 |
| Social 5 | Threads, X, Instagram, Facebook, Bluesky | Threads 5탭, Instagram 3탭, 나머지 generic social 3탭 |
| Messaging 3 | Telegram, Discord, Slack | credential/setup 화면. Queue/Analytics 위조 금지 |
| Video 2 | YouTube, TikTok | 연결 화면. 제작과 발행 작업은 `/videos` owner |
| Data 3 | Blog Performance, Search Console, Google Analytics | GA4 disabled truth, 나머지 API 의존 상태 |
| Keyword 4 | Keyword Planner, Search Advisor, Naver Trends, Google Trends | disabled 또는 external을 integrated로 표현 금지 |
| Custom 1 | Blog | 별도 queue/editor/guide/keywords |
| Assets 3 | Images, Videos, Midjourney | gallery, workbench, operator capability 경계 |
| System 1 | Settings | customer8, operator9 |

## Platform connection and capability contract

모든 platform 화면은 계정이 있다면 `display_name`, `@handle`, `status`, `verified_at`, `기본 계정`, `관리`를 같은 header pattern으로 보인다. 계정이 없거나 만료되면 연결 또는 재연결 행동을 제공한다.

| family | tabs and actions | prohibition |
|---|---|---|
| Threads | Queue, Analytics, Growth, Popular, Settings | 다른 social과 동일 3탭으로 축소 금지 |
| Instagram | Queue, Editor, Settings | generic Analytics 삽입 금지, manual token은 Advanced recovery |
| X, Facebook, Bluesky | Queue, Analytics, Settings | 미연결이면 Settings가 첫 화면 |
| Telegram, Discord, Slack | credential, Channel Info, Setup Guide | Queue/Analytics 가짜 탭 금지 |
| YouTube, TikTok | connection/status, `/videos` handoff | Studio direct publish claim 금지 |
| data and external | disabled, permission, unavailable, external 중 실제 상태 | 빈 값을 0 또는 connected로 표현 금지 |

## Component inventory

Preserved shell:

- `AuthGate`, `GateBlockScreen`, public/customer/operator shell
- `Sidebar`, `OperatorSidebar`, `ThemeToggle`, FOUC initialization
- `getChannelIcon` provider SVGs and current inline route icons
- Settings customer8/operator9

Marketing Agent additive components:

- `NextDecision`: 쉬운 한국어의 지금 할 일 하나
- `BrandFactEvidence`: 확인된 사실, source path, updated_at
- `OpportunityReason`: 신호, 출처, 수집 시각, confidence
- `WeeklyPlanSummary`: 목표, 고객, 제안, 7일 범위, 승인
- `LoopBreadcrumb`: 브랜드 사실, 기회, 주간계획, OSMU 제작, 승인, 발행, 성과, 다음 실험
- `ExperimentDecision`: 변수 하나와 승인 또는 보류

Platform and publication components:

- `AccountTruthHeader`, `AccountManagerRow`, `CapabilityTabs`
- `StudioToolbar`, `RepoConnect`, `BrandSetupWizard`, `PlatformPreview` visual7
- `TextInventory` text8, `VideoHandoff` video3, `DirectPublishSelection` direct4
- `CardEditAction`, `CardPublishAction`, `BulkPublishBar`
- `SingleSchedulePanel`, `BulkSchedulePanel`
- `ApprovalTruthPanel`, `PublicationProof`, `ProviderPermalink`
- `RetryAction`, `ReconcileAction`, `RepairAction`
- `InboxOriginBadge`, `CalendarQueueProjection`
- `MobileNavTrigger`, `MobileNavDrawer`

## State contract

| state | visual contract | terminal action |
|---|---|---|
| loading | 확인 중인 대상을 명명한 skeleton 또는 progress | 기다리기, 취소 |
| empty | 아직 없는 데이터와 이유 | 연결, 만들기, owner route |
| error | 단계와 safe reason | confirmed retry 또는 설정 |
| permission | 필요한 권한과 영향 | 계정 관리 또는 operator 문의 |
| disabled | current capability가 지원하지 않는 이유 | handoff 또는 없음 |
| stale | 마지막 확인 시각 | refresh, 승인 disabled |
| uncertain | 외부 발행 여부 확인 필요 | reconcile only, repost 0 |
| repair_required | 외부 성공, 내부 기록 실패 | record repair only |
| failed_confirmed | provider가 거절을 확인 | 해당 item retry |
| partial | 성공 item 보존, 실패 item 분리 | 실패 item만 재시도 |
| published | external ID 또는 permalink 확인 | 게시물 보기 |
| sample_hold | 표본 부족 또는 수집 대기 | 다음 확인 시각, 실험 보류 |

## Forbidden patterns

- 26개 메뉴를 성과 home에 재사용 연결
- 내부 영어 운영 용어를 설명 없이 고객용 주 문구로 노출
- 8단계를 같은 크기 카드 8개로 펼치는 dashboard mosaic
- provider별 실제 탭 차이를 generic 탭으로 평준화
- 계정 handle, 상태, verified_at, 관리 행동이 빠진 연결됨 표시
- visual7, direct4, text8, video3을 한 숫자로 합치기
- 개별 edit/publish를 bulk action으로만 대체
- unknown 결과에서 재발행 먼저 제안
- Settings customer에게 operator Video/TTS 노출
- gradient, blob, emoji-only icon, colored icon circle 반복, card inside card
- 출처 없는 가짜 성과 수치, 가짜 provider link, 가짜 connected 상태
- action 없는 `시작하기`, `더 알아보기`
- 종료 행동 없는 loading, empty, error
- mobile navigation을 숨기고 대체 경로를 제공하지 않기
- em dash, en dash

## Benchmark application

| official source | borrowed | changed for OSMU |
|---|---|---|
| [Buffer Post Groups](https://support.buffer.com/article/961-using-post-groups-in-buffer) | 함께 만든 게시물을 묶되 개별 edit, reschedule, publish 상태 유지 | Studio text8/video3를 campaign context로 묶고 카드별 행동과 결과를 독립 유지 |
| [Sprout Message Approval](https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows) | Needs Approval, 수정 이력, reject 후 재제출 | 1인 사업자용 단일 승인으로 줄이고 fact/account/time/hash 변화를 승인 무효로 표시 |
| [Later Multi-Profile Scheduling](https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles) | profile 선택, 플랫폼별 customize, unsupported grey-out | explicit item IDs와 capability truth를 더해 single/bulk schedule을 분리 |
| [Later Social Sets](https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets) | brand identity 기준 profile 묶음과 access 경계 | workspace와 platform account handle을 전 surface에서 반복 확인 |
| [Hootsuite Approval Tool](https://www.hootsuite.com/platform/social-media-approval-tool) | draft, approve, post의 위험 감소 | 자동 승인 chain 대신 최종 사람 승인과 external result proof를 우선 |

## Design review and revision

Classifier: APP UI.

First impression target: `Marketing Hub 안에서 지금 할 일과 현재 위치가 즉시 보인다.` 눈의 순서는 현재 route title, primary action, account or evidence truth다.

Litmus: brand/product YES, strong anchor YES, headline scan YES, one job per section YES, necessary cards YES, motion hierarchy YES, shadow removal premium YES. Hard rejection 7종은 0이다.

Design Score: **A**

- hierarchy A
- typography A-
- spacing and layout A
- color and contrast A
- interaction states A
- responsive A
- content quality A
- AI slop A
- motion B+
- performance feel A-

AI Slop Score: **A**. 현행 제품의 차분한 surface와 provider 고유 구조를 보존하고, generic card grid와 agent chat UI를 사용하지 않는다.

Quick wins applied: 22개 home 오귀환 제거, 26개 active route label, mobile drawer, platform handle/status/verified_at/manage, Settings8/9 role switch.

## 레드팀과 셀프심문

레드팀 공격: 경쟁자는 v16도 기능을 한 HTML에 많이 넣어 보기 좋은 데모만 만들었다고 공격할 수 있다. 특히 platform 화면이 모두 비슷하면 v15와 같은 위조다. 수정: Threads5, Instagram3, generic social3, messaging setup, video handoff, disabled data, external guide를 각각 다른 renderer와 탭 구조로 고정하고 route audit 26/26을 자동화한다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 무엇인가? 실제 제품의 26개 화면은 데이터 길이와 API 상태가 더 다양해 단일 prototype renderer가 raster까지 동일할 수 없다는 점이다. 수정: prototype은 pixel clone을 완료로 주장하지 않고 owner, action, state, role, token fidelity를 검증 대상으로 삼는다. 실제 React raster와 provider 왕복은 build/QA의 별도 증거다.

## 회수 필요

- 회수 필요: 실 OAuth callback 뒤 네 surface의 handle/status/verified_at 일치 여부는 디자인에서 미검증이다.
- 회수 필요: provider별 retry, reconcile, repair 종료 조건과 adapter call 수는 eng-design 합의가 필요하다.
- 회수 필요: 실제 route25의 390px overflow0과 touch target 44px는 제품 build/QA에서 확인해야 한다.

SOURCES: `docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md`; `wiki/product/marketing-hub-surface-map.md`; `wiki/product/studio.md`; `wiki/reference/channel-status.md`; `tasks/osmu-full-ui-code-audit.output`; `dashboard/src/app/globals.css`; `dashboard/src/components/layout/Sidebar.tsx`; `dashboard/src/components/shared/AuthGate.tsx`; `dashboard/src/components/layout/ThemeToggle.tsx`; `dashboard/src/lib/channel-icons.tsx`; `dashboard/src/app/settings/page.tsx`; `dashboard/src/app/channels/[channel]/page.tsx`; `dashboard/src/components/channel/{ChannelPage,InstagramPage,MessagingPage,DataChannelPage,AccountManager}.tsx`; https://support.buffer.com/article/961-using-post-groups-in-buffer; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets; https://help.later.com/hc/en-us/articles/32581160979479-Later-s-Analytics-Data-by-Plan; https://www.hootsuite.com/platform/social-media-approval-tool

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-review for APP UI classification, hierarchy, responsive, state, AI slop and score audit

SKILLS_SKIPPED: imagegen, actual current HTML/CSS/component fidelity is the authority and no bitmap asset is required

---

# OSMU Marketing Agent 디자인 시스템 v17

> 🏷 STAMP | line: marketing-agent-design | 생성: 2026-08-06 18:43 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer / marketing_agent_design_v17 | skills: brand-positioning-kit | 근거: 승인 PRD v7.2.1, 현행 Marketing Hub 코드와 wiki, v12 browser baseline, v16 반려 기록, 공식 벤치마크 4종 | 고민: 새 대시보드를 만들지 않고 현행 셸과 행동을 유지한 채 생성부터 다음 개선까지 같은 콘텐츠임을 보이게 했다.

## v17 판정과 제품 한 문장

v17은 v12와 현행 Marketing Hub의 시각 체계, v16의 26개 목적지와 모바일 수리를 삭제하지 않는다. 승인된 PRD v7.2.1의 제품 의미를 그 위에 더하는 additive correction이다.

> 한 번 고른 브랜드 근거를 채널별로 고쳐 쓸 수 있는 콘텐츠와 확인 가능한 게시 결과로 바꾸고, 그 결과를 다음 콘텐츠에 반영하는 마케팅 자동화 에이전트.

대상은 월요일 45분과 평일 자투리 시간으로 Threads, Instagram, Facebook, Shorts, Reels, TikTok을 운영하는 1인 브랜드 대표다. 반대상은 무승인 대량 발송, 계정 확인 없는 자동 게시, 존재하지 않는 성과를 요구하는 운영자다.

긴장: 더 많이 자동 게시하는 속도보다, 어느 계정에 무엇이 나갔고 실제 결과가 무엇인지 확인하는 통제권을 택한다.

개봉 장면: 고객이 Studio의 Threads 카드에서 첫 문장 하나를 고치고 `저장`을 누른다. 같은 제목과 수정 번호가 Threads 작업 목록, 승인 인박스, 발행 캘린더, 실제 게시물 링크, 채널별 성과에 이어진다.

## 브랜드 형용사 3개

| 형용사 | 이건 아님 | 화면 발현 |
|---|---|---|
| 믿음직한 | 초록 배지만 붙인 낙관적 성공 | 계정 이름, 확인 시각, 필요한 권한, 게시 결과 링크, 미수집 이유를 행동 가까이에 둔다. |
| 또렷한 | 모든 기능을 같은 카드 크기로 펼친 관제판 | 현재 단계와 다음 행동 하나를 먼저 보이고 세부 관리 화면은 목적별로 분리한다. |
| 통제되는 | 승인 여부와 상관없이 버튼만 누르면 나가는 자동화 | 게시 정책에 맞는 네 가지 행동을 구분하고, 준비가 안 되면 문구를 바꾸지 않은 채 이유와 해결 행동을 보여준다. |

톤 단어: `확인`, `고치기`, `저장`, `승인 요청`, `지금 게시`, `예약`, `결과 확인`, `다시 연결`을 쓴다. 고객 화면에서 데이터 구조, 개발 명세, 내부 상태 코드는 말하지 않는다.

금기:

1. 연결, 게시, 성과 수집을 확인하기 전에 성공이라고 쓰지 않는다.
2. Telegram, Discord, Slack을 Studio의 네 번째 생성 레일로 넣지 않는다.
3. Threads와 TikTok처럼 능력이 다른 채널에 같은 탭을 강제로 붙이지 않는다.
4. 미수집 성과를 숫자 0, 가짜 게시물, 가짜 수집 시각으로 채우지 않는다.
5. 고객 화면에 제공사 원문 토큰, 운영자용 앱 비밀값, 내부 식별자를 노출하지 않는다.

경쟁사 치환 테스트: `같은 콘텐츠가 Studio에서 실제 게시물 링크와 다음 수정까지 이어진다`는 현행 분산 화면, 세 레일, 계정 진실, 증거형 결과를 함께 요구한다. 단순 예약 도구 이름으로 바꾸면 전체 문장이 성립하지 않으므로 통과다.

## Color tokens

새 hex와 새 그라디언트를 추가하지 않는다. 현행 `globals.css`를 상속한다.

| token | light | dark | use |
|---|---|---|---|
| `--bg` | `#FBFBFC` | `#0A0A0B` | 제품 배경 |
| `--surface` | `#FFFFFF` | `#161618` | 패널, 사이드바, 모달 |
| `--surface-2` | `#F4F4F5` | `#1F1F23` | 입력, 보조 영역, 선택 전 상태 |
| `--border` | `#E4E4E7` | `#27272A` | 구획선, 입력 경계 |
| `--text` | `#18181B` | `#F4F4F5` | 제목, 중요 값 |
| `--text-muted` | `#52525B` | `#A1A1AA` | 설명 |
| `--text-subtle` | `#A1A1AA` | `#71717A` | 보조 메타데이터, 비활성 |
| `--accent` | `#2563EB` | `#3B82F6` | 현재 선택, 주 행동 |
| `--accent-hover` | `#1D4ED8` | `#60A5FA` | hover |
| `--accent-soft` | `#EFF4FF` | `#172554` | 같은 콘텐츠 연결, 선택됨 |
| `--success` | `#16A34A` | `#22C55E` | 확인된 게시 결과만 |
| `--warning` | `#D97706` | `#F59E0B` | 승인 대기, 지연, 확인 필요 |
| `--danger` | `#DC2626` | `#EF4444` | 권한 거절, 게시 실패, 파괴 행동 |

상태는 색만으로 구분하지 않는다. 아이콘, 쉬운 이름, 이유, 다음 행동을 함께 쓴다.

## Typography tokens

- family: Pretendard, `-apple-system`, BlinkMacSystemFont, system-ui, sans-serif
- page title: 20/28, 650
- decision title: 18/26, 700
- section title: 13/18, 700
- body: 14/21, 400
- action: 13/18, 600
- metadata: 11/16, 500
- metric: 24/30, 700. 값 옆에 출처, 확인 범위, 확인 시각을 붙인다.

영어 고유명사는 채널과 외부 제품명에만 쓴다. `Queue`는 현행 탭 이름으로 보존하되 설명은 `작업 목록`으로 병기한다. 버튼은 고객 언어만 쓴다.

## Spacing, size, responsive tokens

- spacing scale: 4, 8, 12, 16, 20, 24, 32
- radius: panel 12, control 8, status pill 999
- Sidebar: 224px at 1024 and 1440
- page inset: 24px desktop, 16px at 390
- content max: 1180px
- account truth header: 7 fields, desktop two rows, 390 stacked definition list
- touch target: minimum 44px
- Studio desktop: `텍스트 게시물` 비교 grid 2 or 3 columns, `짧은 영상` 3-card rail, `카드뉴스` large preview one column
- Studio 390: 모든 레일을 one-column stack 또는 내부 가로 스크롤로 바꾸고 page overflow 0
- loading shimmer: 현재 화면에서 동시에 1개 이하

## Information architecture and 26 destination contract

고객 Sidebar는 현행 26개 목적지를 유지한다.

| group | destinations | purpose |
|---|---|---|
| Overview | 성과, OSMU Studio, 승인 인박스, 발행 캘린더 | 생성부터 결과와 다음 개선까지 |
| Social, 게시물 | Threads, X, Instagram, Facebook, Bluesky | 계정, 게시물 작업, 실제 지원 탭 |
| Social, 짧은 영상 | YouTube Shorts, TikTok | 계정과 영상 작업실 연결 |
| Messaging | Telegram, Discord, Slack | 연결과 후행 커뮤니티 발송 |
| Data & Analytics | Blog Performance, Search Console, Google Analytics | 각 데이터 소유자의 입력과 결과 |
| Keyword Research | Keyword Planner, Search Advisor, Naver Trends, Google Trends | 조사, 보관, 외부 이동, 미지원 진실 |
| Custom Integration | Blog | 별도 글 작업 목록과 편집기 |
| Assets & Tools | Images, Videos, Midjourney | 자산, 영상 작업, 안전 경계 |
| System | Settings | 고객 소유 설정과 승인 정책 |

Instagram Reels는 Instagram 계정의 짧은 영상 형식이다. Instagram 계정 화면에서 `/videos`의 Reels 필터로 이동하며 새 계정 목적지를 만들지 않는다. YouTube와 TikTok 계정 화면은 연결과 준비 상태만 소유하고 제작과 발행은 영상 작업실이 소유한다.

운영자는 별도 Admin 셸을 쓴다. 고객 workspace 이름, 26개 고객 메뉴, 고객의 게시 버튼을 렌더하지 않는다.

## Same-content visual thread

고객에게 내부 식별자를 노출하지 않고 같은 항목임을 다음 네 요소로 잇는다.

- title: `봄 클래스 모집, 마지막 확인` 고정
- revision: `수정 3` 고정
- source chip: `브랜드 소개와 가격표에서 확인` 고정
- status timeline: `저장됨`, `승인 대기`, `예약됨`, `게시됨`, `성과 확인` 중 하나

Studio의 한 번 생성은 플랫폼별 작업으로 나뉜다. Social 게시물은 각 채널 작업 목록에 투영되고, Shorts/Reels/TikTok은 영상 작업으로 이어지며, Telegram/Discord/Slack은 사용자가 검수를 마친 뒤 `커뮤니티로 보내기`를 켠 경우에만 별도 발송 항목이 생긴다.

## Platform account truth header

모든 계정 소유 화면은 같은 순서의 일곱 필드를 쓴다.

1. 채널 아이콘과 계정 이름
2. 연결 상태와 이유
3. 마지막 확인 시각
4. 지금 할 수 있는 행동
5. 허용된 권한
6. 만료와 자동 갱신 상태
7. 계정 관리 또는 다시 연결

웹훅, 봇, 외부 연결처럼 해당하지 않는 필드는 `해당 없음: 웹훅 연결`, `해당 없음: 봇 자격증명`, `해당 없음: 외부 도구`로 쓴다. 빈칸이나 오류처럼 보이는 가짜 상태를 만들지 않는다.

계정 전환은 현재 계정과 바꿀 계정을 같은 화면에 보여준다. `다른 계정으로 연결`을 누르면 연결 중, 취소, 계정 불일치, 연결 완료의 결과를 원래 안전 상태와 함께 보여준다. 제공사 액세스 토큰과 갱신 토큰 원문은 DOM에 넣지 않는다.

## Component inventory

Preserve:

- `AuthGate`, public/customer/operator shell, four block screens
- `Sidebar`, `OperatorSidebar`, 26 destinations, current SVG icons
- `ThemeToggle`, light/dark semantic tokens
- Studio toolbar, Brand setup, RepoConnect, wiki input, history, `저장`, selected publish, `예약`, `SchedulePanel`
- `PlatformPreview`의 Threads, X, Facebook, Instagram, Shorts, Reels, TikTok 고유 모양
- 채널별 카드 편집, 선택, 게시, 예약, 결과 확인
- Threads Queue/Analytics/Growth/Popular/Settings, Instagram Queue/Editor/Settings
- Messaging connection/setup, video account pages, `/videos`, Inbox, Calendar, Blog, Images, data and keyword owners
- customer Settings 8, operator Settings 9

Additive v17:

- `ContentContinuityChip`: 제목, 수정 번호, 출처 상태
- `RailSection`: text, short-video, card-news 세 영역
- `CommunityHandoff`: default OFF, destination picker, preview, approval/schedule action
- `PolicyActionSet`: 지금 게시, 승인 요청, 예약, 예약 승인 요청
- `DisabledActionReason`: 기존 버튼 문구, 이유, 해결 행동
- `ProjectionPath`: Studio to 작업 목록 or video work to Inbox/Calendar/result
- `AccountTruthHeader7`
- `AccountSwitchPanel`
- `NativeMetricTruth`: collected and not-collected schemas
- `NextChangeCard`: 관찰, 한계, 바꿀 것 하나, 다음 초안
- `TenantTokenPanel`: one-time reveal, list, revoke, four scopes with publish request default OFF
- `AdminWorkspaceTable`, `AdminOAuthApps`, `AdminUsage`, `AdminSupportRecovery`
- `PrototypeInspector`: viewport, state, role, theme. 고객 제품 기능이 아니라 디자인 검수 도구다. 기본 customer/operator 렌더에서는 `.qa-tools`와 `#qa-restore`가 모두 hidden이고 접근성·control audit에서도 제외된다. `?prototypeInspector=1`, `#prototype-inspector` 또는 `Ctrl+Alt+Q`로 명시적으로 opt-in한 검수 세션에서만 열린다. BODY 상태는 inspector-node selector와 충돌하지 않는 `data-prototype-inspector-mode`가 소유한다.

## State contract

| state | 쉬운 표시 | terminal action |
|---|---|---|
| ready | 준비됨 | 해당 행동 실행 |
| loading | 무엇을 확인 중인지 명명 | 기다리기 또는 취소 |
| empty | 아직 없는 것과 첫 행동 | 만들기, 연결, 업로드 중 하나 |
| partial | 일부만 준비 또는 게시 | 성공 보존, 실패만 확인 |
| blocked | 필요한 정보나 권리가 없음 | 근거 확인, 권리 확인, 계정 연결 |
| permission | 권한이 부족함 | 필요한 권한 보기, 다시 연결 |
| stale | 마지막 확인이 오래됨 | 새로 확인, 그 전 게시 차단 |
| degraded | 제공사 지연이나 일부 기능 제한 | 안전한 기능만 계속, 나머지 보류 |
| error | 실패한 단계와 이유 | 확인된 실패만 다시 시도 |
| success | 확인 가능한 결과가 있음 | 실제 게시물 보기, 성과 확인 |
| uncertain | 게시 여부 확인 중 | 결과 확인만, 재게시 금지 |
| repair | 외부 게시 성공, 내부 기록 실패 | 기록만 복구, 외부 재호출 금지 |

## Analytics truth

전체 성과는 게시 시도, 성공, 실패, 처리 중, 성과 수집 범위, 콘텐츠 묶음당 확인된 게시물 수, 계정 준비 상태만 합산한다. 제공사마다 정의가 다른 조회, 도달, 반응, 좋아요, 답글, 공유, 팔로워는 합산하지 않는다.

Threads, X, Facebook, Instagram Feed, Bluesky, YouTube Shorts, Instagram Reels, TikTok은 각자 한 행이다. 수집된 행은 지표 설명, 출처, 확인 기간, 수집 시각, 계정, 실제 게시물을 보여준다. 미수집 행은 `해당 없음: 미수집`과 이유, 확인 기준, 다음 행동을 보여준다.

## Settings and Admin boundary

고객 Settings 8개는 Channels, AI Engine, Storage, Design Tools, Notifications, Fork 연동, Keywords, System을 유지한다. System에는 workspace owner만 바꿀 수 있는 `게시 전 승인 필요`를 추가한다. 일반 구성원은 읽기 전용이다. 준비 상태가 나빠져도 이 정책과 Studio 버튼 이름은 바뀌지 않는다.

Fork 연동 토큰은 제공사 토큰과 별개다. 한 번만 원문을 보여주고 이후 목록은 이름, 만든 시각, 마지막 사용, 허용 범위, 폐기 상태만 보인다. 범위는 콘텐츠 읽기 ON, 초안 생성과 수정 OFF, 발행 요청 OFF, 성과 읽기 OFF가 기본이다.

Admin은 별도 셸에서 네 목적을 제공한다.

1. 고객과 작업 공간의 상태, 가입, 연결 계정, 사용량
2. 중앙 OAuth 앱 자격증명 세트, callback 주소, 준비 상태, 마스킹과 30초 확인
3. 생성과 게시 사용량, 실패 추이, 과금 또는 운영 상한
4. 고객 정지, 재개, 공유 AI 승인, 안전한 계정 연결 복구, 오류 상관 정보

Admin은 고객 대신 게시하지 않는다. 고객의 제공사 토큰 원문을 기본 노출하지 않는다.

## Forbidden patterns

- 현행 224px Sidebar와 아이콘을 새 브랜드 셸로 교체
- Studio 소셜 게시물을 한 줄 가로 카드로만 압축
- 영상 세 결과를 텍스트 placeholder나 버튼 한 줄로 축소
- Telegram, Discord, Slack을 생성 레일에 기본 포함
- Instagram, YouTube, TikTok에 backing 없는 작업 목록이나 성과 탭 생성
- 승인 정책과 계정 준비 상태를 같은 조건으로 취급
- 실패한 게시를 자동 재시도, 확인 중인 게시를 재게시
- 채널별 반응 수치를 전체 합계로 표시
- 미수집을 0, 빈칸, 가짜 수집 시각, 가짜 게시물로 표시
- 고객 DOM에 제공사 액세스 토큰, 갱신 토큰, 앱 비밀값 삽입
- 고객 화면에 개발 문서 번호, 내부 상태명, 데이터 구조명, 샘플 보류 같은 운영어 노출
- 고객에게 `사용 근거: PRD`, `updated_at`, 내부 파일 경로를 표시
- 모든 화면을 같은 generic 카드 grid로 렌더
- gradient, blob, emoji-only icon, colored icon circle 반복, card inside card
- 의미 없는 `시작하기`, `더 알아보기`
- 종료 행동 없는 loading, empty, error
- em dash, en dash

## Benchmark application

| official source | borrowed | changed for OSMU |
|---|---|---|
| [Buffer Scheduling](https://support.buffer.com/article/642-scheduling-posts) | 한 작성 화면에서 채널별 수정 후 지금 게시 또는 시각 선택 | 현행 Studio 세 레일과 카드별 편집, 선택 게시, SchedulePanel을 유지하고 승인 정책 분기를 추가 |
| [Sprout Message Approval](https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows) | 승인 대기, 캘린더, 수정과 재제출, 승인 활동 | 1인 브랜드가 이해할 수 있는 단일 승인과 쉬운 상태로 줄이고 같은 콘텐츠 연결을 강조 |
| [Google OAuth Web Server](https://developers.google.com/identity/protocols/oauth2/web-server) | 계정 선택, 범위, 오프라인 갱신, 상태 확인 | 고객에게 토큰을 보여주지 않고 계정 이름, 권한, 갱신 가능 여부, 마지막 확인을 같은 헤더에 표시 |
| [TikTok Login Kit](https://developers.tiktok.com/doc/login-kit-web) | 자동 계정 선택을 끄는 선택지 | 다른 계정 연결 과정에서 현재 계정과 바꿀 계정을 명시하고 취소와 불일치를 안전하게 종료 |

타사의 시각 자산, 문구, 역할 모델은 복제하지 않았다.

## Prototype review and revision

### Official product UI research trace, 2026-08-06

| searched and opened official document | observed UI structure | borrowed into v17 | deliberately not copied | v17 component diff |
|---|---|---|---|---|
| [Buffer Scheduling](https://support.buffer.com/article/642-scheduling-posts) | `+ New Post` opens Composer, channel avatars select destinations, publishing choice offers queue/date/now, scheduled items become separately editable | one source idea fans out to selected channel cards, then explicit `지금 게시` or `예약` | default posting action and queue prioritization are not copied because OSMU policy copy must remain visible and approval-aware | `StudioHeader`, selected-card bulk bar, per-card edit/save, `SchedulePanel` |
| [Sprout Message Approval](https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows) | Compose submits to Needs Approval, the review list filters work, Approval Activity records edits/comments/current step, expired approval requires a new time and resubmission | Inbox keeps review, edit request, hold, approval, history and recovery adjacent to the same content identity | multi-step enterprise workflow builder, external approver management and bulk approval are not copied for the one-owner core | `ApprovalInbox`, policy CTA, uncertain/repair paths, `검토 기록` action |
| [Later Multi-Profile Scheduling](https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles) | profile checkmarks precede Post Builder, `Customize X Posts` creates per-profile variants, unsupported media profiles are greyed out, scheduled posts are edited individually | Studio desktop uses a card grid for comparison, each card owns edit/save/readiness, disabled cards retain a reason and next action | ten-profile limit, Access Group terminology and media drag interaction are not copied because they are provider plan concepts | `TextCardGrid`, readiness copy, selected count, 390 one-column reading order |
| [Later Custom Analytics](https://help.later.com/hc/en-us/articles/33109662792471-Later-s-Custom-Analytics) | dashboard filters by analysis period, handle, platform and post type; metric definitions vary by platform | native performance rows always show period, account, source state and collection time before a next-change claim | cross-platform dashboard totals, plan upsell and saved report delivery are not copied; non-comparable native values stay separate | Home `NativeMetricRows`, visible context pills, provider owner Analytics |
| [Meta Business Suite Page post insights](https://www.facebook.com/help/131809553587433) | official search excerpt exposes left navigation `Insights` then `Content > Overview`, with post reach and engagement; direct open redirected to login | Facebook owner keeps content performance under the account owner instead of adding a fake global total | Meta navigation and metric names are not copied where the product does not collect them | Facebook Analytics capability and `해당 없음: 미수집` truth state |

Research action evidence: two `search_query` calls covered eight official-domain queries; one `open` call requested five official results. Buffer, Sprout, Later scheduling and Later analytics returned readable product documentation. Meta returned an official search excerpt, while direct open redirected to login. No conclusion relies on the redirected page body.

Classifier: APP UI.

첫 인상 목표: `내 브랜드 근거로 만든 같은 콘텐츠가 지금 어디 있고, 무엇을 누르면 되는지 보인다.`

Design Score: **A-**

- 현행 디자인 충실도 A
- 제품 의미와 same-content 흐름 A
- Studio 세 레일과 영상 작업 A-
- 계정, 성과, 설정, Admin 경계 A
- 상태 완전성 A
- 1440/1024/390 의도 A-
- 실제 React와 provider 왕복 일치 B, 디자인 산출물 범위 밖

AI Slop Score: **A**. 현행 플랫 블루 토큰과 제공사별 화면 구조를 유지하고, 그라디언트 장식과 generic agent chat을 추가하지 않았다.

## 레드팀

공격: 경쟁자는 이 프로토타입이 결국 게시 예약 대시보드이며, `다음 개선` 카드는 장식이라고 공격할 수 있다.

수정: Studio에서 저장한 `봄 클래스 모집, 마지막 확인 · 수정 3`을 작업 목록, 승인, 캘린더, 결과 링크, 채널별 성과에 같은 이름으로 반복했다. 성과 화면에서 수집된 Threads 한 건만 다음 첫 문장 변경으로 연결하고, 미수집 채널은 개선 근거로 쓰지 않는다.

공격: 까다로운 고객은 여러 채널을 보여주면서 실제 지원하지 않는 기능을 판매한다고 공격할 수 있다.

수정: Messaging은 연결과 후행 발송만, YouTube와 TikTok은 계정과 영상 작업실 연결만, Midjourney는 고객 안전 비활성, Google Trends는 외부 이동으로 끝낸다. backing 없는 탭과 성공 배지를 만들지 않는다.

## 셀프심문

**이 단계가 틀렸다면 가장 그럴듯한 이유는 무엇인가?**

가장 load-bearing한 가정은 26개 목적지를 유지하면서도 고객이 전체 흐름을 하나로 이해할 수 있다는 것이다. 같은 콘텐츠 표시가 너무 약하면 다시 분산 도구처럼 느껴질 수 있다. 그래서 `제목 + 수정 번호 + 출처 상태 + 단계`를 Studio, Queue, Inbox, Calendar, Videos, 결과, 성과에 반복하고 홈에는 합산 가능한 운영 상태와 다음 변경만 남겼다.

두 번째 이유는 신규 고객에게 승인 기본이 느리게 느껴질 수 있다는 점이다. 디자인은 승인을 숨기지 않고 Studio에서 바로 `승인 요청`과 `예약 승인 요청`을 제공한다. 기존 direct workspace는 `지금 게시`와 `예약`을 유지하고, 준비 장애는 버튼 이름을 바꾸지 않는다.

## 회수 필요

- ⛔ 회수 필요: 지정된 `tasks/original-requests-ledger.output`, `tasks/marketing-agent-code-truth.output`, `tasks/v17-auth-admin-audit.output`, `tasks/v17-ia-analytics-audit.output`이 레포에 없었다. current code, wiki surface map, Studio, Settings, Admin, v16 기록으로 대체했으며 파일이 뒤늦게 생기면 design diff 재검사가 필요하다.
- ⛔ 회수 필요: provider별 실제 계정 전환, callback 후 계정 이름과 권한 확인, 게시 결과 링크, native metric 수집은 디자인에서 검증할 수 없다.
- ⛔ 회수 필요: 데이터 저장 구조, 명령 계약, 중복 방지 방식, 복구 종료 조건은 eng-design에서 회장과 합의해야 한다.
- ⛔ 회수 필요: 실제 React의 390px 26개 화면 overflow와 44px target은 build와 QA에서 직접 측정해야 한다.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: "같은 콘텐츠 표시가 너무 약하면 다시 분산 도구처럼 느껴질 수 있다." 이유: 외부 고객 관찰 전 정보 구조 가설이다.
SOURCES: `pipeline-state.md`; `docs/openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md`; `docs/one-thing.md`; `docs/persona.md`; `docs/bm.md`; `docs/risks.md`; `tasks/marketing-agent-plan-critic-v7.2.1.output`; `wiki/product/marketing-hub-surface-map.md`; `wiki/product/studio.md`; `wiki/reference/channel-status.md`; `docs/ui-rules.md`; v12 browser baseline docs; v16 design, flow, wireframe, prototype; current Sidebar, constants, AuthGate, Studio, PlatformPreview, SchedulePanel, channel pages, Settings, Admin; https://support.buffer.com/article/642-scheduling-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/33109662792471-Later-s-Custom-Analytics; https://www.facebook.com/help/131809553587433; https://developers.google.com/identity/protocols/oauth2/web-server; https://developers.tiktok.com/doc/login-kit-web
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for audience, anti-audience, tension, 3 tone anchors, prohibitions, competition substitution test
SKILLS_SKIPPED: imagegen because current SVG icons and code-native product assets are the visual authority; no product-design skill was installed in the available skill registry

---

# Marketing Agent design system v18: agency loop

## STAMP

- line: openclaw-auto
- artifact: marketing-agent-design-v18
- version: v18
- generated_at: 2026-08-07 16:40 KST
- model: gpt-codex/gpt-5.6-sol
- agent: product-designer / marketing_agent_design_v17
- skills: brand-positioning-kit, openclaw-creative-brief, gstack design-review
- evidence: current Marketing Hub code/wiki, official Buffer, Sprout, Hootsuite, Later, Canva, HubSpot and Notion documentation, NN/g, Google PAIR, Microsoft HAX, cited behavioral research
- 고민 한 줄: 게시 버튼을 더하는 대신 브랜드 근거부터 다음 콘텐츠 제안까지 한 콘텐츠의 의사결정 고리를 보이게 만들었다.

## Product stance

v18의 제품 한 문장은 `내 브랜드 자료를 확인 가능한 캠페인과 채널별 콘텐츠로 바꾸고, 게시 결과를 다음 제안에 반영하는 마케팅 작업실`이다. 단순 예약 도구의 중심이 `언제 내보낼까`라면, 이 작업실의 중심은 `왜 이 메시지를 누구에게 내보내고 무엇을 배울까`다.

브랜드 형용사 3개:

1. **Grounded, 근거 있는**: 추천과 문구마다 사용한 브랜드 자료와 관찰 근거를 확인할 수 있다.
2. **Steady, 침착한**: 연결 실패와 AI 불확실성을 과장하지 않고 복구 가능한 다음 행동을 한 개 제시한다.
3. **Editorial, 편집자다운**: 많이 생성하는 대신 목적, 독자, 톤, 채널 맥락을 검토하고 확정하게 한다.

반대 고객은 검토 없이 대량 자동 게시만 원하는 사용자다. v18은 생성 속도보다 브랜드 책임, 승인, 결과 학습을 우선한다.

## Information architecture

고객 메뉴는 기존 26개를 유지한다. 순서는 다음과 같다.

1. Overview: 성과, OSMU Studio, 승인 인박스, 발행 캘린더
2. Social posts: Threads, X, Instagram, Facebook, Bluesky
3. Messaging: Telegram, Discord, Slack
4. Social short video: YouTube Shorts, Instagram Reels link, TikTok
5. Data and Analytics: Blog Performance, Search Console, Google Analytics
6. Keyword Research: Keyword Planner, Search Advisor, Naver Trends, Google Trends
7. Custom Integration: Blog
8. Assets and Tools: Images, Videos, Midjourney
9. System: Settings

`Messaging`은 `Social posts` 바로 다음, `Social short video` 바로 앞에 둔다. Instagram Reels는 Instagram 계정의 형식 링크로 `/videos` Reels 필터를 열며 27번째 목적지를 만들지 않는다. 가입, workspace 선택, 브랜드 자료 설정, 캠페인 브리프는 26번째 목적지를 늘리지 않고 Home과 Studio에서 여는 작업 흐름이다.

## Design tokens

### Color

| token | light | dark | use |
|---|---:|---:|---|
| `--bg` | `#FBFBFC` | `#0A0A0B` | app background |
| `--surface` | `#FFFFFF` | `#161618` | primary surface |
| `--surface-2` | `#F4F4F5` | `#1F1F23` | inset and disabled context |
| `--border` | `#E4E4E7` | `#27272A` | flat hierarchy |
| `--text` | `#18181B` | `#F4F4F5` | primary text |
| `--muted` | `#52525B` | `#A1A1AA` | explanatory text |
| `--subtle` | `#71717A` | `#A1A1AA` | metadata, WCAG contrast checked before build |
| `--accent` | `#2563EB` | `#3B82F6` | one primary action and current step |
| `--success` | `#15803D` | `#22C55E` | externally confirmed result only |
| `--warning` | `#B45309` | `#F59E0B` | review or attention |
| `--danger` | `#B91C1C` | `#F87171` | destructive or failed |

No gradient, decorative glow, or color-only state. Every semantic color is paired with text and icon.

### Typography

- family: Pretendard, system sans-serif fallback
- display: 24/32, 700, used once per screen
- title: 20/28, 650
- section: 16/24, 650
- body: 14/21, 400
- action: 13/18, 650
- metadata: 12/18, 400; 11px is reserved for nonessential prototype stamps only
- numeric performance: tabular numerals, 24/30, 700

### Spacing and shape

- spacing scale: 4, 8, 12, 16, 24, 32, 48
- page max width: 1180px; desktop padding 24px; mobile padding 16px
- Sidebar: existing 224px
- touch target: minimum 44 by 44px
- panel radius: 12px; controls 8px; pills 999px only for status/filter
- shadow: overlays only; task hierarchy uses type, spacing and border

## Agency loop and progressive disclosure

The visible loop is:

`로그인 → workspace → 브랜드 자료 → 브랜드 기준 확인 → 캠페인 → 텍스트 → 사진/카드뉴스 → 영상 → 채널별 검토 → 승인 → 게시/예약 → 작업 상태 → 결과 링크 → 성과 → 학습 → 다음 제안`.

New users see the next incomplete step and one primary action. Experienced users can jump directly to Studio, Inbox, Calendar, Videos, or a channel owner. Progress is earned from saved or confirmed state only; no artificial completion is shown.

OSMU Studio output order is fixed:

1. 소셜 게시물 텍스트
2. 사진과 카드뉴스
3. 짧은 영상

Community delivery is a later, explicit handoff. Telegram, Discord, and Slack are not auto-selected and messaging is default OFF.

## Current versus target boundary

| capability | current evidence | v18 design disposition |
|---|---|---|
| Google login | `/login`; `/signup` redirects to login | preserve; provider completion remains externally unverified |
| workspace list/create | `/services`, workspaces route | use as the second step; do not claim tenant outcome before response |
| existing brand material import | Studio `RepoConnect`, `sync-wiki` and `sync-repo` | show as available; supports a normal GitHub repository Markdown folder, not `repo.wiki.git` |
| six-question brand setup | `BrandSetupWizard` to `brand-setup` | preserve as the available no-repository path |
| direct paste | product contract exists but no complete current UI owner found | target design; named source, empty/error and review states required |
| non-GitHub Markdown/text bundle | no current importer found | target design; scope preview, eligible/selected/skipped counts and resolvable source locations |
| new wiki creation and structured editor | no dedicated current owner found | target design with create/edit/save/reload, version, archive, rollback-as-new-version and active approval. Prototype proves semantics only; persistence remains unimplemented/unverified |
| editable positioning, guide and tone confirmation | generated brand guide exists; full review/confirm workflow absent | target design. Prototype may edit locally but cannot claim server persistence |
| campaign brief owner | no dedicated current screen found | target design within Home/Studio flow; Studio idea remains the current fallback |
| OSMU text/image/video | Studio and Videos current surfaces with distinct readiness | preserve truth, reorder presentation only |
| unified result library | Images, Videos and queue/result locations are fragmented | target index that links to current owners; no invented nav entry |
| overall and channel performance | Home and provider owners, with data gaps | preserve native definitions; never add incomparable totals |
| learned next proposal | current Home next-change concept, full learning persistence unverified | recommendation must cite observed result and stay editable/dismissible |

## Psychology-to-interface contract

| problem | principle and source | UI decision | abuse prevention |
|---|---|---|---|
| a new user faces 26 destinations before having a brand basis | progressive disclosure and recognition over recall, NN/g | Home shows one `마케팅 준비 이어가기` action and a visible step list; full sidebar remains available | no forced tour; every step has skip/back and a direct destination link |
| users may over-trust generated brand claims | calibrated trust and efficient correction, Google PAIR and Microsoft HAX | show source names, missing evidence, editable fields, confirm before campaign use | no confidence theater; no invented percentage; human approval remains explicit |
| default actions influence behavior | default effect, Johnson and Goldstein 2003 | auto-publish and community delivery default OFF; channel, account and time are explicit | no prechecked marketing consent, hidden opt-out, or urgency copy |
| users abandon a long setup | endowed progress, Nunes and Drèze 2006 | show only actually completed steps such as login and workspace; explain imported progress | never prefill fake completion or award progress for viewing a screen |
| many channel variants can overwhelm a novice | choice-overload evidence is heterogeneous; use categorization in unfamiliar, high-information contexts | group by text, photo/card, video; recommend a small channel set, preserve `모두 보기` and expert bulk actions | do not claim fewer choices are universally better; recommendation is reversible |
| publishing is high impact and retries can duplicate content | error prevention, user control and freedom, NN/g | approval state, account truth, preflight, cancel, uncertain result check, repair-only path | never retry an uncertain publish; destructive actions require confirmation and undo where possible |

These principle names do not appear in customer UI.

## Component inventory

Preserve existing assets and behavior owners:

- `AuthGate`, public/customer/operator separation
- `Sidebar`, current SVG icons, ThemeToggle and light/dark semantic tokens
- `BrandSetupWizard`, `RepoConnect`, direct paste, Studio history
- Studio idea input, platform previews, selected publish, draft save, schedule panel
- Instagram card-news editor, Images gallery, Videos workbench
- Inbox, Calendar, provider-specific account pages and Header7 truth fields
- Customer Settings 8 and Operator Settings 9

Additive v18 design components:

- `AgencyJourneyLauncher`: Home and Studio entry; not a 27th nav destination
- `AgencyProgress`: actual completed state, current step, next action
- `BrandSourceChoice`: GitHub repository, Markdown/text export bundle, tone files, six questions, paste and product wiki
- `ImportScopeReview`: repository, branch, folder, Markdown count, exclusions, last sync, retry
- `KnowledgeEditor`: page title, confirmed information, interpretation, needs-confirmation statement, citation, unsaved/saved/error, version/archive/rollback
- `BrandEvidenceBoard`: audience desire, positioning, promise, differentiator, three tone anchors with counterexamples, taboo, vocabulary, visual rule and source coverage
- `BrandConfirmation`: edit, compare with source, confirm, reopen
- `CampaignBrief`: objective, audience situation, one desired action, offer, dates, channel hypothesis, success measure
- `OSMUOutputStack`: Text → Photo/Card → Video, each with readiness and channel adaptation
- `ChannelVariantEditor`: base draft, per-platform divergence, account, requirements, approval owner
- `PublishDecisionBar`: save, request approval, schedule, publish; auto-publish absent
- `WorkQueueLinker`: Queue, Calendar and Videos handoffs preserve title and revision
- `ResultLibraryIndex`: permalink, platform, account, published time, campaign, source owner
- `LearningCard`: observation, limitation, proposed single change, feedback controls
- `NextContentProposal`: evidence-linked, editable, dismissible, never self-publishes

## State and recovery contract

Every asynchronous surface covers loading, empty, success, partial, error, stale, permission, blocked, degraded, uncertain and repair where relevant. Each state names:

1. what happened,
2. what is preserved,
3. whether an external action may already have happened,
4. one safe next action,
5. one exit to Home or the owning surface.

New wiki target design must expose save/reload/error/version/archive/rollback semantics, while the report labels them prototype-observed rather than implemented. Existing repository import errors distinguish inaccessible repository, missing Markdown, folder outside scope, private permission, stored credential failure and unsupported GitHub Wiki clone.

## Responsive behavior

- 1440: 224px Sidebar, max 1180 content, output stack visible in full width.
- 1024: Sidebar preserved, two-column decision views collapse to one column, no horizontal page overflow.
- 390: mobile header and drawer, one-column text/photo sections, 44px controls. Only video comparison and seven-day calendar may scroll horizontally; ordinary copy, actions, tables and source names wrap.
- role parity: operator role hides customer Sidebar and customer mobile menu at every viewport.

## Forbidden patterns

- changing the existing brand shell, icon family, role boundary or 26 destination count
- placing Social short video before Messaging; exact order is Social posts → Messaging → Social short video
- output order text → video → card; v18 order is text → photo/card → video
- generic agent chat as the primary product
- reporting new-wiki, campaign or learning persistence as code-tested or production-observed when only the target prototype was exercised
- calling a GitHub Wiki clone supported
- preselected publish, hidden approval, automatic retry, or automatic Messaging delivery
- AI confidence percentages without validated calibration
- cross-platform engagement total that merges incompatible definitions
- empty/error/loading without an exit
- customer-facing internal document names, requirement codes, data field names, provider token strings or implementation labels
- fake customer numbers presented as collected data
- gradient decoration, blobs, excessive shadows, nested cards, emoji-only icons
- deceptive scarcity, forced continuity, cancellation obstruction or hidden costs

## Benchmark synthesis

- Buffer and Sprout: preserve draft → review → approve/reject → queue; adapt to a one-owner workspace while keeping approval history.
- Hootsuite: preserve approval notes and auditability; do not copy approval bypass as a casual shortcut.
- Later: preserve one base post with per-profile customization and disabled reasons; do not copy plan limits or Access Group language.
- Canva: connect brand assets, creation, calendar and review; retain current visual system instead of importing Canva templates.
- HubSpot: campaign groups related assets, Content Remix fans one source into formats; adapt to the fixed Text → Photo/Card → Video stack and current owner boundaries.
- Notion: import shows scope, progress and completion; adapt to GitHub Markdown repository truth and show exclusions before confirmation.

## design-review

Classifier: **APP UI**.

Design Score: **A- semantic, B+ visual evidence ceiling**.

- hierarchy: A
- flow coherence: A
- implementation truth: A
- state/recovery coverage: A
- responsive specification: A-
- accessibility intent: A-
- rendered visual polish: B+, pending actual browser screenshots

Hard rejection check: generic SaaS card-grid first impression NO; unclear action NO; decorative hero NO; unsupported success NO; stacked cards without task ownership NO; automation without user control NO.

## Red team and revision

Competitive attack: `This is still a scheduler with a longer onboarding.`

Revision: campaign intent, brand evidence coverage, a stable content identity, result permalink and a cited next-change proposal now form the primary loop. Calendar and queue are execution owners, not the product thesis.

Skeptical customer attack: `You say agency, but the tool invents my strategy and may post it.`

Revision: the generated positioning and proposal are drafts, evidence gaps remain visible, confirmation is explicit, publish defaults are OFF, and every AI result is editable and dismissible.

## Self-question

**If this is a simple publishing tool rather than a marketing agency, what is missing?**

The most plausible missing pieces are a client-quality strategic brief, an explicit reason for each asset, a reusable result library, and a closed learning loop. v18 adds all four at the design level: CampaignBrief, evidence-linked OSMU stack, ResultLibraryIndex, and LearningCard → NextContentProposal. It also designs the approved target knowledge lifecycle rather than disabling it. The load-bearing risk remains implementation ownership for new wiki, campaign persistence and learning storage; prototype interaction is not implementation evidence.

## 회수 필요

- ⛔ 회수 필요: new wiki create/edit/persist, campaign brief persistence, unified result index and learned-proposal persistence need plan/eng-design ownership before build.
- ⛔ 회수 필요: provider OAuth, publish permalink and native performance must be verified through actual external paths; a prototype cannot establish them.
- ⛔ 회수 필요: actual rendered screenshots at 390, 1024 and 1440 and all 26 destination clicks remain the design QA gate.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `CampaignBrief와 LearningCard가 예약 도구를 대행사로 바꾼다.` 이유: 실제 고객이 전략 산출물을 반복 사용한다는 관찰 전의 정보구조 가정이다.
SOURCES: current Marketing Hub code/wiki; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.hootsuite.com/whats-new/document-external-approvals; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://www.canva.com/learn/using-canva-content-planner-social-content/; https://knowledge.hubspot.com/blog/repurpose-content-using-ai-with-content-remix; https://knowledge.hubspot.com/campaigns/create-campaigns; https://www.notion.com/help/import-data-into-notion; https://www.nngroup.com/articles/progressive-disclosure/; https://www.nngroup.com/articles/ten-usability-heuristics/; https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/; https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/; DOI 10.1086/500480; DOI 10.1126/science.1091721; DOI 10.1086/651235
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for audience desire, tension, positioning, tone and taboo / openclaw-creative-brief for evidence hierarchy, state matrix, prompt constraints and validation contract / gstack design-review for APP UI classifier, litmus, hard rejection, responsive and AI-slop audit
SKILLS_SKIPPED: imagegen because current SVG icons and code-native product assets are the governing visual source / Product Design plugin was recommended but not installed or explicitly requested, so the available local design-review method was used

## v18 interaction retake addendum - 2026-08-07

The independent v18 review correctly found that the first prototype rendered the right nouns but did not preserve enough user state. The retake changes the prototype contract from route demonstration to same-item interaction:

- mobile customer drawer now exposes the same 9 groups and 26 destinations, closes with backdrop or Escape, and keeps the active route and draft state;
- campaign steps 2, 4, 6 and 10 preserve entered values across arbitrary jumps, close and reopen within the prototype session;
- product wiki preserves edited content through save/reload, shows version diff, archive/restore, rollback-as-new-version, review and active-version lineage;
- Studio exposes the current preview7 and direct4 owners, eight editable platform variants, exact bulk account rows and the fixed Text → Photo/Card → Video DOM order;
- Inbox and Calendar retain work #2047 / revision 7 while approval, schedule change, approval expiry and cancellation change visible state;
- result index, result detail and one-variable experiment share revision lineage; video post owners use video-job states rather than the text queue;
- Customer Settings8 and Operator Admin9 are clickable owners; OAuth, one-time workspace key, BYOK and bounded operator secret rules stay distinct;
- forty-eight owner-aware fixtures (8 owners × 6 required states) replace the single generic recovery card.

Non-GUI JSDOM evidence now passes 181 assertions, including 48 owner-state recovery fixtures and the 12-combination interaction contract, with failures 0. This is semantic prototype evidence only.

### Retake design-review boundary

Design Score: **B+ static semantic candidate with parent-observed Chrome core PASS; independent reviewer grade pending.**

Parent Chrome QA observed console errors 0; 26/26 unique destinations with at least one action; campaign 14/14; Studio DOM 1/2/3; exact group order; 1024 and 390 horizontal overflow 0; 390 sub-44px tap targets 0; customer drawer open/26 destinations/close; QA chrome hidden by default; wiki save v4 visible; operator customer-shell nodes 0; and Admin9 9/9 label-to-h1 transitions. Evidence images: /private/tmp/marketing-v18-1440-home.png, /private/tmp/marketing-v18-1024-studio-dark.png, /private/tmp/marketing-v18-390-wiki.png and /private/tmp/marketing-v18-390-operator.png.

The earlier independent reviewer’s prototype grade C/NO-GO is not silently overwritten. The parent evidence closes the enumerated Chrome core checks, while independent reviewer re-rating, full focus/contrast review and external behavior remain pending.

⛔ 회수 필요: the independent reviewer must re-run M01-M14/MINOR6 and issue the governing grade. Prototype interaction still does not prove external OAuth/publish/analytics or server persistence.

## v18 M09/M13/M14 closure contract - 2026-08-07

### Stable lineage, not positional UI

The prototype has one immutable demo identity and does not use array position as a result identity:

| field | demo value | visible owners |
|---|---|---|
| `campaign_id` | `cmp_fall_launch_2026` | Studio, Inbox, Calendar, Platform, Results, next experiment |
| `content_id` | `cnt_2047` | same |
| `revision_id` | `rev_7` | same; experiment apply creates `rev_8`, undo restores `rev_7` |
| `publish_attempt_id` | `pub_0071` | queue, result library/detail, experiment lineage |
| `external_result_id` | `ext_ig_8801` | result library/detail and experiment source; sibling results have their own immutable external IDs |
| `experiment_id` | `exp_hook_specificity_01` | source result, revision diff and next experiment |

Result selection uses `external_result_id`; reordering the library cannot change which detail opens. Applying the proposal creates `rev_8` with source IDs `ext_ig_8801` and `ext_th_8802`, changed variable `첫 문장의 구체성`, and held constants `이미지`, `게시 시간`, `행동 안내`. Undo restores `rev_7` and removes the applied revision object.

### Owner-specific recovery

The eight owners are Home, Studio, Inbox, Calendar, Platform, Results, Settings and Operator. Each renders loading, empty, partial, permission, uncertain and repair with inspectable `data-owner`, `data-state`, `data-preserved-id`, item, account and revision attributes. Every owner/state pair has a unique recovery action code and visible outcome. A recovery action may change the local screen state, but it must not change `cnt_2047`, the owner account or `rev_7`; uncertain and repair never retry an external publish.

### M14 measurable interaction contract

- customer and operator roots expose clean `data-role`, `data-theme` and `data-viewport` values;
- buttons, inputs, selects, textareas, navigation and checkboxes have a 44px minimum target contract;
- focus-visible uses a 3px accent outline with 2px offset;
- light and dark semantic text pairs expose 15 measured ratios; the lowest documented ratio is 4.79:1;
- mobile video groups expose a visible `옆으로 밀어 … 더 보기 →` affordance and `data-horizontal-scroll="true"`;
- every rendered interactive control is collected by `window.__V18_INTERACTION_AUDIT__`, which fails missing accessible names, unregistered/generic handlers or sub-44px browser rectangles;
- required render matrix is customer/operator × light/dark × 1440/1024/390 = 12 combinations.

Non-GUI evidence: `/private/tmp/marketing-v18-static-dom-qa.cjs` completed 181 assertions, 48 recovery fixtures and 12 interaction combinations with 0 failures. This proves DOM semantics and registered transitions, not screenshot pixels. The independent v3 review closed M01-M08 and M10-M12 but kept M09/M13/M14 open; this retake supplies static closure evidence for M09/M13 and the testable M14 contract. M14 remains browser-evidence pending until the parent captures and measures all 12 combinations.

### Red-team and self-question update

Attack: “The IDs are decorative labels and the recovery buttons are still the same reset.” The retake now selects results by external ID after a reordered fixture, records revision-8 source/diff/constant metadata, and emits 48 unique owner-state action codes with preserved-before/after evidence. A missing handler is an audit failure.

If this conclusion is wrong, the most plausible reason is that JSDOM accepts zero-sized rectangles and cannot prove the downloaded font, visible focus, computed contrast or mobile scroll cue. Therefore the design score remains a static candidate and the 12-combination Chrome screenshot/contrast/target pass is a release gate rather than an inferred success.

⛔ 회수 필요: parent must run the actual-browser 12-combination screenshot, computed contrast, focus and full interactive-target audit before M14 or the design gate can close.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `The lowest documented ratio is 4.79:1.` 이유: token arithmetic is verified, but rendered inheritance and overlays still require computed-style browser evidence.
SOURCES: `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.log`; current Marketing Hub code/wiki; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.hootsuite.com/whats-new/document-external-approvals; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://www.nngroup.com/articles/ten-usability-heuristics/; https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for evidence-led product tone / openclaw-creative-brief for lineage, negative constraints and validation schema / gstack design-review for APP UI interaction, accessibility, responsive and anti-slop review
SKILLS_SKIPPED: imagegen because existing code-native SVG/product assets govern the visual system / Product Design plugin was not installed or explicitly requested

## v18 FINAL M14 고객 언어 계약 - 2026-08-07

Independent v4의 마지막 MAJOR M14를 닫기 위한 최종 규칙이다. 불변 추적성은 제거하지 않고, 고객 기본 화면의 표현 계층에서만 사람이 이해하는 말로 번역한다.

| 내부 불변 필드 | 고객이 보는 값 | 고객 표면 노출 |
|---|---|---|
| campaign ID | `가을 신규 고객 안내` | 허용 |
| content ID | `텍스트·카드뉴스·짧은 영상` | 허용 |
| revision ID | `수정 7`, `수정 8` | 허용 |
| publish-attempt ID | `오늘 15:48 요청` | 허용 |
| external-result ID | `Instagram Reels · 게시 확인` | 허용 |
| experiment ID | `첫 문장 구체성 비교` | 허용 |

`cmp_`, `cnt_`, `rev_`, `pub_`, `ext_`, `exp_` 원시값은 `data-*`, frozen identity/result object, test API, operator/debug 영역에만 존재한다. 고객의 본문, 제목, 알림, 복구 카드, 결과 상세, 버튼 accessible name, 입력값에는 나타나지 않는다. 복구 후에도 내부 `data-preserved-id`는 동일하지만 고객은 `가을 신규 고객 안내 · @monostudio · 수정 7`로 확인한다.

NN/g의 system-real-world match를 적용해 시스템 내부 명명 대신 사용자의 업무 언어를 사용했고, GOV.UK 오류 문구 원칙을 적용해 오류 코드와 기술 용어 없이 무엇이 보존됐고 무엇을 할 수 있는지 말한다. Material 3 상태 원칙은 기존 loading/empty/partial/permission/uncertain/repair 구분에 유지했다.

정적 회귀는 338 assertions, 48 recovery fixtures, 12 role/theme/viewport 조합을 통과했다. 고객 언어 전용 감사가 157개 표면의 text, form value, aria-label, title, alt를 검사해 raw identifier 0, undefined implementation jargon 0을 확인했다. 불변 6-field lineage와 result reorder, revision 8 apply/undo 계약은 그대로 통과했다.

### Red team과 셀프심문

까다로운 고객의 공격: “ID를 숨기면 지원팀이 같은 게시 건을 찾지 못한다.” 수정: 원시값은 삭제하지 않고 DOM data attribute와 test/operator 계약에 남겼으며, 고객에게는 같은 레코드를 캠페인명·수정본·채널·요청 시각·상태로 보여준다.

이 결론이 틀렸다면 가장 그럴듯한 이유는? 긴 한국어 라벨이 실제 390px 화면에서 새 overflow를 만들 수 있다는 점이다. JSDOM 언어 감사와 기존 12조합 브라우저 PASS는 분리해 기록하며, 최종 독립 리뷰가 새 카피의 실제 렌더를 다시 확인해야 한다.

⛔ 회수 필요: independent reviewer가 M14 최종 카피 sweep을 재실행해 governing NO-GO를 해제해야 한다.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `오늘 15:48 요청`은 이해 가능한 예시지만 실제 구현에서는 사용자의 locale/timezone 포맷터가 소유해야 한다.
SOURCES: `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.json`; https://media.nngroup.com/media/articles/attachments/Heuristic_2_compressed.pdf; https://design-system.service.gov.uk/components/error-message/; https://m3.material.io/foundations/interaction/states/overview
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for customer vocabulary and taboo / openclaw-creative-brief for negative constraints and validation schema / gstack design-review for APP UI customer-language and responsive hard-rejection audit
SKILLS_SKIPPED: imagegen because no raster asset is required / Product Design plugin was not installed or explicitly requested

---

# OSMU Marketing Agent 디자인 시스템 v19

> STAMP: created_at=2026-08-08 19:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer/marketing_agent_design_v17 | skills=brand-positioning-kit, openclaw-creative-brief, gstack design-review | evidence=PRD v7.3.5, current UI/API/DB, v19 flow/wire/prototype, official NN/g·Material·Buffer·Sprout·RFC9700 sources | deliberation=채널마다 달라진 탭 위치를 통일하되 실제 capability와 영상·Messaging 차이는 숨기지 않는다

## v19 결정

플랫폼 화면의 공통 작업 위치는 `Create | Queue | Calendar | Analytics | Settings`다. Threads Growth·Popular는 Analytics 안에 둔다. Instagram 카드 편집은 Create 형식으로 흡수한다. YouTube·TikTok Queue는 영상 작업 상태를 쓴다. Messaging은 별도 동의 기능이며 Sidebar의 Social posts → Messaging → Social short video 순서를 유지한다.

Studio와 플랫폼 로컬 생성은 한 canonical content lifecycle을 쓴다. `OSMU에서 생성`과 `이 플랫폼에서 생성`은 출처 라벨이며 새 복제 레코드가 아니다. Create, Queue, Calendar, Analytics는 같은 identity와 상태를 투영하고, 불확실한 외부 결과는 재게시하지 않는다.

## 브랜드 형용사 3개

| 형용사 | 화면 발현 | 이건 아님 |
|---|---|---|
| 믿음직한 | 현재 확인과 목표 상태, 계정 연결과 실제 게시를 분리 | 연결됨을 게시 성공으로 과장 |
| 또렷한 | 플랫폼마다 같은 5개 작업 위치, 지금 필요한 한 행동 | 탭 이름과 위치가 채널마다 변함 |
| 통제되는 | 승인, 준비 확인, 지금 게시·예약, 결과 확인을 분리 | 숨은 자동 게시, 불확실 결과 재게시 |

## Tokens

### Color

현행 light/dark semantic token을 유지한다: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--subtle`, `--accent`, `--accent-soft`, `--success`, `--success-soft`, `--warning`, `--warning-soft`, `--danger`, `--danger-soft`. 상태는 색만 쓰지 않고 icon·label·reason을 함께 표시한다. 문서화된 semantic pair의 최소 대비 목표는 4.5:1이다.

### Typography

- family: Pretendard, Apple system, Noto Sans KR, sans-serif
- page title: 24/32, 700
- section title: 16/24, 700
- body: 16/25, 400
- action: 14/20, 650
- label·metadata: 12/17, 500
- metric: 26/32, 750. 출처·기간·확인 시각을 함께 둔다.

### Spacing

| token | value | use |
|---|---:|---|
| `space-1` | 4 | micro |
| `space-2` | 8 | inline gap |
| `space-3` | 12 | control group |
| `space-4` | 16 | section stack, Messaging left inset, connection-test top |
| `space-5` | 20 | Calendar time notice bottom |
| `space-6` | 24 | page inset |
| `space-8` | 32 | major separation |

Radius panel 12, control 8, status 999. Minimum target 44×44. Focus-visible 3px accent outline with 2px offset.

## Component inventory

### Layout primitives

- `PageShell`: Sidebar, Topbar, PageHeader, content max-width.
- `HeaderTabs`: 공통 5개 platform IA.
- `Section`, `Stack`, `Inline`, `ActionGroup`: spacing token만 사용.
- `Panel/Card`: content boundary. card-in-card 금지.

### Controls and feedback

- `Button`: primary, secondary, quiet, danger; sm/md/lg size contract.
- `FormField`: label, control, help, error.
- `Dialog/Drawer`: focus trap, Escape, cancel, destructive confirm.
- `Notice`: info, warning, danger.
- `Status/Readiness`: label, reason, owner, timestamp.
- `Empty`, `ErrorState`, `Loading`: exit와 preserved context. Loading은 shimmer.

### Product components

- `CanonicalProjection`: origin, human label, revision, lifecycle, internal identity data attributes.
- `PlatformCreate`, `PlatformQueue`, `PlatformCalendar`, `PlatformAnalytics`, `PlatformSettings`.
- `InstagramFormatPicker`: 피드·카드뉴스·Reels, Create 내부.
- `VideoJob`: 대본·권리·렌더링·업로드·게시 요청·늦은 결과·기록 복구.
- `OAuthReadinessLadder`: app ready → account connected → identity verified → scopes → refreshable → publish-capable → automation enabled → live publish verified.
- `AdminCurrentTarget`: 현재 수집과 설계 목표·미구현 분리.

## State contract

loading, empty, error, partial, permission, stale, blocked, uncertain, repair, success를 명명한다. 각 state는 무엇이 발생했는지, 무엇이 보존됐는지, 외부 행동 가능성, 한 안전 행동, owner로 나가는 출구를 갖는다. 게시 성공은 external result와 확인 시각이 있을 때만 쓴다.

## OAuth truth

- Threads: live publish verified까지 확인.
- Instagram: account connected까지만 확인.
- 그 외: operator credential과 live proof pending.
- central OAuth app credential, customer account token, customer automation consent, live proof는 별도 상태다.
- Meta 계정 전환은 provider session이 소유한다. 제품이 강제로 로그아웃하거나 account chooser를 보장하지 않는다.

## Admin truth

Admin 9개 section은 모두 clickable하다. 고객 pause/resume과 shared AI approve/revoke를 보존한다. 사용량 current는 생성·게시·cron·API count, period, quota, source, freshness다. 모델·input/output token·cost는 현행 exact field가 없어 `설계 목표 · 미구현`이다.

## 금지 패턴

- Instagram connected-only를 게시 가능 또는 live verified로 표시
- code-ready와 operator/customer/live proof를 한 초록 badge로 합치기
- OSMU item과 platform item을 복제해 Queue·Calendar·Analytics에 각각 만들기
- result uncertain에서 동일 콘텐츠 재게시
- video job을 text queue로 표시
- Messaging을 자동 전달하거나 content-platform tab으로 평준화
- 고객 화면에 raw requirement ID, DB field, `발행 근거`, 설명 없는 `permalink 확인`
- 정확 필드 없는 token/cost 숫자, incompatible metric 합계
- one-off margin·padding class, arbitrary spacing, card-in-card, gradient decoration, blob, emoji-only icon
- em dash, en dash, empty/error/loading without exit

## Benchmark 적용

| source | 차용 | v19 변경 |
|---|---|---|
| NN/g heuristics | system status, consistency, recognition | 5탭 위치 고정, origin/status/readiness visible |
| Material canonical layout/states | reusable scaffold와 상태 표현 | 현행 Sidebar와 semantic tokens 유지 |
| Buffer drafts/approvals | Create·Queue·Calendar에서 같은 draft와 approval | 한 canonical item과 explicit approval |
| Sprout approval | compose→submit→review→approve, edit history | 승인 뒤 내용·계정·시간 변경 시 재검토 |
| RFC 9700·OWASP | authorization code, PKCE, state, least scope, refresh protection | UI success를 technical/live ladder로 분리 |

## Design review

Classifier: APP UI. Design Score: B+ static contract candidate. AI Slop Score: B+.

- hierarchy and common IA: A-
- truth and recovery: A
- component reuse and spacing: A-
- responsive contract: B+
- actual Chrome screenshot and click evidence: 미검증. 설치된 headless Chrome이 screenshot 파일을 만들지 않아 parent browser QA 필요.

JSDOM evidence: 220 assertions, destinations 26, lifecycle 14, target platforms 4, role/theme/viewport matrix 12, console errors 0. 이 증거는 DOM·interaction contract이며 pixel, computed overflow, focus raster를 증명하지 않는다.

### v19 M13/M14 증거 경계

| 항목 | v19에서 확인된 것 | 닫지 않은 것 | 판정 |
|---|---|---|---|
| M13 recovery | Home, Studio, Inbox, Calendar, Platform, Results, Settings, Operator의 8 owner와 loading, empty, partial, permission, uncertain, repair의 6 state, 합계 48개 safe-transition 계약이 prototype test API에 보존됨 | 실제 브라우저에서 각 전환 뒤 campaign·account·revision identity가 보존되는지, uncertain에서 외부 재게시 0인지 | 정적 계약 확인, 실브라우저 회수 필요 |
| M14 고객 언어 | 고객 표면 audit가 `cmp_`, `cnt_`, `rev_`, `pub_`, `ext_`, `exp_` 원초성 식별자를 금지하고 immutable ID를 `data-*`와 test API에만 유지함 | customer/operator × light/dark × 1440/1024/390 12개 screenshot의 raw ID·구현 용어 0, inspector 2개 기본 hidden, contrast·touch·overflow·focus 실측 | 정적 계약 확인, 실브라우저 회수 필요 |

v18의 실제 브라우저 GO는 v19의 새 플랫폼 공통 5탭과 canonical projection에 자동 승계하지 않는다. v19는 기존 26 destinations, 14 campaign steps와 원초성 식별자 내부 보존 계약을 유지하지만, M13/M14의 governing closure는 v19 전용 브라우저 증거가 생길 때까지 주장하지 않는다.

## 레드팀·셀프심문

경쟁자 공격: “같은 5탭은 기능이 없는 채널을 완성품처럼 보이게 한다.” 수정: empty·blocked와 readiness ladder를 기본 구성으로 두고, 실제 evidence가 없는 publish와 analytics를 차단한다. 영상과 Messaging은 다른 본문 계약을 유지한다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 canonical projection이 현행 여러 DB table과 route owner를 가로지르는 데도 디자인이 한 identity 계약을 전제했기 때문이다. 구현 전 eng-design에서 source of truth, write owner, idempotency를 합의해야 한다.

⛔ 회수 필요: canonical content identity·projection write owner·publish idempotency의 eng-design 합의.

⛔ 회수 필요: parent가 실제 Chrome에서 1440/1024/390 light/dark, customer/operator, click routing, computed contrast·touch·overflow·focus와 screenshot을 검증해야 한다.

⛔ 회수 필요: v19 M13의 8 owner × 6 recovery state 48개를 실제 브라우저에서 전환하고 identity 보존·중복 외부 요청 0을 확인해야 한다.

⛔ 회수 필요: v19 M14의 고객 visible text에서 원초성 식별자와 미정의 구현 용어 0, `.qa-tools`와 `#qa-restore` 기본 hidden, screenshot `검수` 노출 0을 12개 조합에서 다시 확인해야 한다.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25

WEAKEST_LINE: “모든 콘텐츠 플랫폼은 5탭”은 일관성을 높이지만 연결 전 empty tab의 실제 탐색 비용은 사용자 관찰 전 가정이다.

SOURCES: `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; `docs/ui-rules.md`; `wiki/reference/channel-status.md`; `wiki/decisions/004-social-connect-oauth-not-passwords.md`; current channel, OAuth, usage and DB source; https://www.nngroup.com/articles/ten-usability-heuristics/; https://m3.material.io/foundations/layout/canonical-examples/overview; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.rfc-editor.org/info/rfc9700/; https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: brand-positioning-kit for positioning, tone and taboo / openclaw-creative-brief for component, lifecycle, state and validation contract / gstack design-review for APP UI, hierarchy, interaction, responsive, accessibility and anti-slop review

SKILLS_SKIPPED: imagegen because existing code-native UI is the visual authority / Product Design plugin was not installed or explicitly requested

---

# OSMU Marketing Agent 디자인 시스템 v20

> STAMP: created_at=2026-08-08 22:05 KST | line=marketing-agent-design | model=claude-opus-5[1m] |
> agent=product-designer/marketing_agent_design_v20 | skills=gstack design-review |
> evidence=PRD v7.3.5, DESIGN.md v19, 실제 코드 (docs/user-flow-marketing-agent-v20 §0의 19개 파일),
> Buffer·Hootsuite 공식 문서, 실브라우저 12조합 스크린샷 |
> 고민: 회장의 발명 금지 계약을 시스템 층에서 지키려면 "무엇이 지금 있고 무엇을 더했나"가
> 토큰이 아니라 컴포넌트로 존재해야 한다. 그래서 새 primitive 대신 표시 칩 하나를 만들었다.

## v20 결정

1. **v19 토큰을 그대로 상속한다.** 색, 타이포, 간격, radius, 포커스 계약을 한 줄도 바꾸지 않았다.
   신규 디자인 시스템을 만들지 않는다는 원칙(design.md §1-3)을 따른다.
2. **v19가 코드에 없는 것을 사실처럼 그린 두 곳을 되돌렸다.**
   Threads의 Growth·Popular를 Analytics 안으로 옮긴 것을 각자 탭으로 복원했고,
   운영자 9개 항목 중 코드에 없는 5개에 `아직 없음`을 붙였다.
3. **가입에서 운영자까지를 한 여정으로 이었다.** 새 목적지를 만들지 않고, 이미 코드에 있는
   온보딩 4단계와 시작 체크리스트 4항목을 홈의 첫 화면 요소로 승격했다. 목적지 수는 26개 그대로다.
4. **`저장된 값`이 아니라 `무엇이 저장됐는지`를 읽는 화면을 신설했다.** 회장 문구 `볼 수도 있고`의
   해석 근거는 user-flow v20 §3.2에 적었고, 해석이 틀릴 가능성을 회수 항목으로 올렸다.

## 브랜드 형용사 3개와 v20 발현

v19의 세 형용사를 유지하고, v20에서 새로 생긴 화면 요소로 어떻게 발현되는지 1:1로 적는다.

| 형용사 | v20 발현 | 이건 아님 |
|---|---|---|
| 믿음직한 | 계정 저장 내용 10필드 중 못 읽는 3개를 목록에서 빼지 않고 사유를 적어 남긴다. 운영자 5개 화면에 `아직 없음` | 빈칸·하이픈으로 두어 값 없음을 정상처럼 보이기 |
| 또렷한 | 시작 체크리스트에서 강조는 항상 정확히 하나. 주 버튼이 그 항목 이름을 그대로 읽는다 | 한 화면에 `다음 할 일`을 주장하는 요소 둘 |
| 통제되는 | 끊긴 채널을 맨 위로 올리고 서버 값이 없는 채널은 버튼을 잠근다. 눌러서 오류를 보게 하지 않는다 | 전부 눌리는 목록에서 실패로 학습시키기 |

## Tokens

v19와 동일하다. 추가·변경·삭제 0.

색은 `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--muted`, `--subtle`, `--accent`,
`--accent-soft`, `--success`, `--success-soft`, `--warning`, `--warning-soft`, `--danger`, `--danger-soft`.
타이포는 Pretendard 계열, 페이지 제목 24/32 700, 섹션 16/24 700, 본문 16/25 400, 동작 14/20 650,
라벨 12/17 500, 지표 26/32 750. 간격은 `space-1`~`space-8`. radius panel 12, control 8, status 999.
최소 목표 44×44. 포커스는 3px accent 외곽선 + 2px 오프셋.

### v20에서 지킨 한 가지 수치 규칙

캡션 최소 12px. v20 첫 구현에서 새 컴포넌트 두 곳이 11px이었고, 실브라우저 측정으로 잡아 12px로 올렸다.
`.origin-chip`과 `.start-steps small`이 그 대상이다.

## Component inventory

### 상속 (v19에서 변경 없음)

`PageShell`, `Section`, `Stack`, `Inline`, `ActionGroup`, `Panel/Card`, `Button`, `FormField`,
`Dialog/Drawer`, `Notice`, `Status/Readiness`, `Empty`, `ErrorState`, `Loading`,
`CanonicalProjection`, `PlatformCreate`, `PlatformQueue`, `PlatformCalendar`, `PlatformAnalytics`,
`PlatformSettings`, `InstagramFormatPicker`, `VideoJob`, `OAuthReadinessLadder`, `AdminCurrentTarget`.

### v20 신설 (4개, 전부 기존 primitive의 조합)

| 컴포넌트 | 무엇인가 | 기반 |
|---|---|---|
| `OriginChip` | 지금 제품에 있음 · 이번에 더함 · 아직 없음 3상태 표시. 12px, 제목보다 항상 뒤로 물린다 | 기존 status 칩 형태 |
| `startStrip` | 시작 체크리스트 4항목. 완료 잠금, 다음 한 항목만 강조, 4개 완료 시 DOM 제거 | Panel + Button + 기존 accent-soft |
| `accountReadback` | 계정 저장 내용 10필드. 저장 7 + 미구현 3, 미구현은 사유를 warning 색으로 | 정의 목록 + 기존 border 규칙 |
| `onboardingDialog` | 가입 직후 4단계. 3단계에서 저장될 항목을 미리 보여준다 | 기존 Dialog + accountReadback |

### v20 수정 (1개, CSS 한 줄)

```css
.grid > .panel + .panel{margin-top:0}
```

회장이 지적한 카드 불일치의 실제 원인이다. `.panel + .panel{margin-top:16px}`이 grid 안에서도 걸려서
한 줄에 놓인 카드 중 2번째·3번째만 16px 아래로 밀렸다. 실브라우저 측정 717 / 733 / 733이 719 / 719 / 719가 됐다.
이 한 줄이 v19의 모든 다중 패널 그리드에 적용된다.

### 변경한 컴포넌트 계약

| 컴포넌트 | v19 | v20 |
|---|---|---|
| `HeaderTabs` | 모든 콘텐츠 플랫폼에 5탭 고정 | 채널을 인자로 받아 Threads는 7탭, 나머지는 5탭. 기존 탭의 상대 순서 보존 |
| `PlatformAnalytics` | 안에 Growth·Popular 하위 탭 | 하위 탭 제거. Growth·Popular는 각자 탭 |
| `PlatformSettings` | 계정 한 줄 + 연결 버튼 | 계정 저장 내용 10필드 읽기 카드 추가 |
| 운영자 nav | 9개 동일 무게 | 코드에 없는 5개에 `아직 없음` |

## State contract

v19의 10개 상태를 유지한다: loading, empty, error, partial, permission, stale, blocked, uncertain, repair, success.
각 상태는 무엇이 일어났는지, 무엇이 보존됐는지, 한 개의 안전한 행동, 담당 화면으로 나가는 출구를 갖는다.
v20에서 더한 4개 흐름의 상태 계약은 user-flow v20 §8에 있다.

## OAuth truth

v19의 8단계 준비 사다리를 유지한다. v20이 더한 것은 **저장 뒤에 무엇을 읽을 수 있는가**의 경계다.

| 구분 | 항목 |
|---|---|
| 저장되고 읽을 수 있음 | 계정 표시명·사용자명, 외부 식별자 끝자리, 기본 계정, 상태(정상·만료됨·연결 해제됨), 연결일, 만료, 연결 방식 |
| 저장되지만 읽지 않음 | 액세스 값, 갱신 값. 서버 발행 경로에서만 복호화한다 |
| 저장 컬럼이 없음 | 허용 권한 목록, 갱신 성공 여부, 마지막 확인 시각 |

`연결됨`은 토큰 교환 성공 **그리고** 외부 신원 되읽기 성공 **그리고** 저장 행 존재일 때만 쓴다.
교환만 성공한 상태를 연결됨으로 표시하는 것이 과거 관찰된 결함이었다.

기본 경로에 고객의 키 붙여넣기는 없다. 예외는 Bluesky(앱 비밀번호), Telegram(봇 토큰), Discord(Webhook)
세 개뿐이고 화면에 플랫폼 표준이라는 이유를 함께 적는다.

## Admin truth

실제로 있는 4개: 상태(운영 요약 6숫자), 고객과 작업 공간(가입자·워크스페이스 카드·정지·재개·공유 AI),
중앙 연결 앱, 사용량(이벤트·초안·발행·실패·생성·쇼츠 카운트).

아직 없는 5개: 복구 작업, Video/TTS 상태, 보안 기록, 알림, 콘솔 설정. 목록에서 지우지 않고 표시한다.

계정별 모델·입력 토큰·출력 토큰·비용은 `설계 목표 · 미구현`이다. 예시 숫자를 쓰지 않는다.

## 금지 패턴 (v19 전량 유지 + v20 추가 8개)

v19 목록을 그대로 유지한다. 추가:

- 코드에 없는 화면·탭·필드를 표시 없이 그리기
- `아직 없음` 항목을 목록에서 조용히 지우기
- 미구현 필드를 빈칸이나 하이픈으로 두기
- 저장 내용 읽기 카드에 액세스·갱신 값 원문이나 복호화 결과를 넣기
- 끊긴 채널을 정상 채널과 같은 무게로 목록 중간에 두기
- 표본 4건 이하에서 평균을 계산해 보여주기
- 한 화면에 `다음 할 일`을 주장하는 요소를 둘 이상 두기
- 페이지 머리와 패널 안에 같은 칩을 반복하기

## Benchmark 적용

| 출처 | 차용한 원리 | v20에서 바꾼 것 |
|---|---|---|
| Buffer, 연결 유지 모범 사례 | 끊긴 채널을 목록 맨 위로 올리고 강조해 고객이 찾아 헤매지 않게 한다 | 이미 있는 `status` 컬럼으로 정렬만 했다. 새 데이터를 만들지 않았다. 왼쪽 색 테두리 대신 배경만 바꿔 슬롭 패턴을 피했다 |
| Buffer, 채널 새로고침 | 토큰은 비밀번호 변경·정책·기한으로 끊긴다는 사실을 사용자에게 미리 알린다 | 채널마다 왜 끊겼는지·다시 연결하면 무엇이 보존되는지를 그 줄에 적었다 |
| Hootsuite, 활성화 중심 온보딩 | 신규 사용자를 첫 활성화 사건까지 최단으로 밀어붙인다 | 새 온보딩을 만들지 않고 코드의 4항목 체크리스트를 홈 최상단으로 올려 강조를 하나로 제한했다 |
| Hootsuite, 계정 재연결 문서 | 재연결은 별도 기능이 아니라 같은 연결 흐름의 재진입이다 | `다시 연결`이 첫 연결과 같은 승인 경로를 쓰고, 초안·예약 보존을 문구로 약속했다 |
| 토큰 만료 운영 원문(Paragon) | 서비스 계정은 소유자·범위·만료·마지막 사용을 갖는다. 만료 UI는 실제 토큰 상태로만 띄운다 | 범위·마지막 확인은 컬럼이 없어 미구현으로 표시했다. 있는 척하지 않았다 |
| NN/g, Material (v19 상속) | 시스템 상태 가시성, 일관성, 재인지 | v20에서는 일관성을 코드 순서 보존으로 해석했다. 탭을 통일하려고 기존 배치를 옮기지 않는다 |

훔친 것은 구조와 원리다. 브랜드 자산·문구·일러스트는 가져오지 않았다.

## Design review

Classifier: APP UI.

Design Score: **A-**. AI Slop Score: **A-**.

| 항목 | 등급 |
|---|---|
| 시각 위계 | A- |
| 타이포그래피 | A- |
| 간격과 레이아웃 | A |
| 색과 대비 | A- |
| 상호작용 상태 | A |
| 반응형 | A- |
| 내용과 문구 | A |
| AI 슬롭 | A- |
| 모션 | B+ |

리뷰 루프에서 스크린샷을 보고 실제로 고친 것 4개:

1. grid 안 카드 윗변 어긋남. 원인이 `.panel + .panel` 마진임을 측정으로 특정해 고쳤다.
2. 홈에서 `다음 할 일`을 주장하는 요소가 둘이었다. 패널 kicker를 `확인이 필요한 문구`로 바꿨다.
3. 계정 읽기 카드의 경고가 대상 항목 **아래**에 있어 `아래 세 항목`이 방향이 틀렸다. 위로 옮기고 문구를 고쳤다.
4. 운영자 화면에서 페이지 머리와 패널이 같은 칩을 반복했다. 패널 쪽을 제거하고 기간·확인 시각으로 대체했다.

실측 증거는 wireframe v20 §7에 표로 있다. 12조합 전부에서 접근가능 이름·핸들러·44px·가로 스크롤 실패 0.

### 증거 경계

이번에는 실브라우저가 실행됐다. 12조합 스크린샷과 계산된 대비·목표 크기·오버플로 측정을 확보했다.
증명하지 못한 것: 실제 제공자 왕복(OAuth 실계정 연결부터 게시·permalink까지), 폰트 렌더 미학의 사람 판단,
그리고 이 표시 방식이 실사용자에게 어떻게 읽히는지.
v18·v19의 브라우저 증거를 v20 해시로 승계하지 않았고 v20 전용으로 다시 측정했다.

## 레드팀·셀프심문

**경쟁자의 공격**: "정직 표시를 잔뜩 붙인 화면은 미완성으로 보인다. 고객에게 파는 화면이 아니라 개발 보드다."
받아들인 수정: 칩 무게를 12px로 묶고 화면당 최대 2개로 제한했으며, 페이지 머리와 패널의 칩 중복을 금지했다.
그리고 이 표시가 설계 단계 장치인지 배포 UI인지를 회수 항목으로 회장에게 올렸다.

**이 결론이 틀렸다면 가장 그럴듯한 이유**: `발명 금지`를 `코드 보존`으로 번역한 것이 과할 수 있다.
Threads의 Growth·Popular를 각자 탭으로 되돌린 것은 코드에 충실하지만,
채널마다 탭 개수가 달라 길찾기 일관성은 v19보다 나빠졌다. 즉 이번 결정은 정확성을 위해 일관성을 팔았다.
이번 지시가 발명 금지였으므로 그 거래가 맞다고 판단했지만, 회장이 일관성을 더 중시한다면
Growth·Popular 배치는 별도 안건으로 다시 올려야 한다. 디자이너 임의로 옮길 사안이 아니다.

두 번째 흔들기: 계정 저장 내용 읽기 카드가 필드 10개짜리 표다. 표는 고객이 읽지 않는다.
반박은 이렇다. 이 카드는 평소 보는 화면이 아니라 문제가 생겼을 때 보는 화면이고,
문제 상황에서는 밀도가 친절함이다. 다만 평소에는 접혀 있어야 한다는 지적은 타당하고,
그 접힘 상태를 이 정적 프로토타입에 넣지 않았다. 구현 시 기본 접힘으로 갈지 결정이 필요하다.

⛔ 회수 필요: `볼 수도 있고`의 의도가 화면 확인인지 다른 도구로의 반출인지.

⛔ 회수 필요: `이번에 더함`·`아직 없음` 표시를 배포 UI에도 남길지, 설계 단계 장치로만 쓸지.

⛔ 회수 필요: Threads 탭 개수 차이(7 대 5)를 정확성 우선으로 유지할지, 일관성 우선으로 다시 통일할지.

⛔ 회수 필요: 한 콘텐츠 식별·쓰기 소유·게시 멱등, scope·갱신·확인 시각 컬럼 신설은 기술설계 합의 사항.

⛔ 회수 필요: 계정 읽기 카드 10필드를 기본 펼침으로 둘지 접힘으로 둘지.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: 정확성을 위해 탭 일관성을 팔았다는 판단은 근거가 코드 하나뿐이고, 실사용자 길찾기 관찰로 검증하지 않았다.

SOURCES: `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; `DESIGN.md` v19; `docs/ui-rules.md`;
`docs/user-flow-marketing-agent-v20-gpt-codex.md`; `docs/wireframes/marketing-agent-v20-gpt-codex.md`;
`wiki/reference/channel-status.md`; `wiki/ops/session-state.md` 2026-08-08;
실제 코드 19개 파일(user-flow v20 §0);
https://support.buffer.com/article/552-best-practices-for-keeping-your-social-channels-connected ;
https://support.buffer.com/article/573-refreshing-a-channel-in-buffer ;
https://goodux.appcues.com/blog/hootsuite-activation-onboarding ;
https://help.hootsuite.com/hc/en-us/articles/1260804308209-Reconnect-a-social-account ;
https://www.useparagon.com/blog/oauth-token-refresh-expiry-at-scale

MODEL: claude-opus-5[1m]

SKILLS_USED: gstack design-review for APP UI classifier, litmus checks, spacing and hierarchy findings, AI slop blacklist, fix loop

SKILLS_SKIPPED: design-consultation과 design-shotgun. v19 토큰 상속이 원칙이고 회장 지시가 v19 발전이라 방향 발산 금지

---

# OSMU Marketing Agent 디자인 시스템 v21

> STAMP: created_at=2026-08-09 00:05 KST | line=marketing-agent-design | model=claude-opus-5[1m] |
> agent=product-designer/marketing_agent_design_v21 | skills=gstack design-review |
> evidence=DESIGN.md v20, docs/platform-policy-matrix-v1-gpt-codex.md (16채널, 근거 URL 86개),
> 부모가 Google 공식 쿼터 문서로 확정한 videos.insert 1유닛 + 하루 100회 별도 상한,
> 회장 확정 지시 2건, 실브라우저 19장 |
> 고민: 상태 색과 버튼 유무가 곧 "이건 누구 책임인가"의 대답이 된다. 유저가 할 일이 없는 상태를
> 경고색으로 칠하면 유저는 자기 탓으로 읽고 헛수고를 한다. 그래서 색과 버튼을 사유의 주인에 묶었다.

## v21 결정

v20을 갈아엎지 않았다. 토큰 0변경, 목적지 0변경, 기존 컴포넌트 0삭제. 아래만 가산했다.

1. **상태 어휘의 축을 바꿨다.** v20까지 채널 상태는 토큰 관점(정상·만료됨·연결 안 됨)이었다.
   v21은 그 위에 **사유의 주인** 축을 얹는다. 발행 가능·미연결·오픈 준비중.
   토큰 상태는 사라지지 않고 계정 저장 내용 읽기 카드의 `연결 상태` 필드로 남는다.
2. **플랫폼 정책 사실을 화면 계약으로 옮겼다.** 앱 전체 공유 한도, 심사 전 비공개, 게시당 과금,
   자동 발행 불가, 중복 콘텐츠 금지. 전부 매트릭스의 `[공식]` 등급 사실만 썼다.
3. **중복 콘텐츠 대응을 단계로 만들었다.** OSMU가 같은 글을 여러 채널에 그대로 보내면
   플랫폼 정책 위반을 제품이 유도하는 셈이다. 채널별 다시 쓰기를 게시 앞 필수 단계로 넣었다.

## 브랜드 형용사 3개와 v21 발현

v19부터의 세 형용사를 유지한다. v21의 새 요소로 어떻게 발현되는지 1:1로 적는다.

| 형용사 | v21 발현 | 이건 아님 |
|---|---|---|
| 믿음직한 | 네이버 블로그를 초안까지만으로 강등하고 "우리도 못 합니다"라고 적는다. TikTok 심사 전 결과에 `게시됨`을 쓰지 않는다 | 안 되는 것을 곧 된다고 말하기 |
| 또렷한 | 세 단어(발행 가능·미연결·오픈 준비중)를 네 화면에서 같은 뜻으로만 쓴다. 목록 강조는 하나 | 화면마다 다른 이름으로 같은 상태 부르기 |
| 통제되는 | X 비용을 발행 전에 보여주고, 중복 위험을 게시 전에 한 번 더 읽게 한다. 막지는 않는다 | 비용과 위험을 사후에 알리기 |

## Tokens

v20과 동일. 추가·변경·삭제 0. 색·타이포·간격·radius·포커스 계약 모두 상속.

v21의 새 컴포넌트는 전부 기존 토큰만 조합했다. 새 색상값을 도입하지 않았고,
상태 색은 기존 `--success` / `--warning` / `--surface-2`의 의미를 재사용했다.

## Component inventory

### v21 신설 (5개, 전부 기존 primitive 조합)

| 컴포넌트 | 무엇인가 | 기반 |
|---|---|---|
| `StatusThree` | 상태 배지 + 사유의 주인 칩. 발행 가능은 주인 칩 없음 | 기존 `StatusBadge` + 12px 칩 |
| `statusReasonBlock` | 상태·뜻·구체 사유·해결 방법(또는 기다림 안내)의 4단 블록 | Notice + 기존 텍스트 스케일 |
| `channelPolicyRow` | 3분류 채널 행. 오픈 준비중에는 버튼 대신 평문 | 기존 `list-row` |
| `rewriteStep` | 게시 앞 채널별 다시 쓰기 단계와 건너뛰기 위험 게이트 | Panel + Notice + ActionGroup |
| 한도 게이지 | 남은 양 숫자 + 막대 + 근거 문장 | 기존 진행 막대 패턴 |

### v21 상태 색 계약 (새 규칙)

| 상태 | 배경 | 버튼 | 근거 |
|---|---|---|---|
| 발행 가능 | 기본 | 보조(연결 확인) | 할 일이 없으므로 시선을 끌지 않는다 |
| 미연결, 첫 하나 | `--accent-soft` + accent 테두리 | 주 버튼 | 지금 할 하나만 강조. v20 시작 체크리스트 장치 재사용 |
| 미연결, 나머지 | 기본 | 보조 | 절반 이상을 동시에 강조하면 강조가 사라진다 |
| 오픈 준비중 | `--surface-2` | **없음** | 유저가 할 일이 없다. 재촉색과 비활성 버튼 둘 다 거짓 신호다 |

## 상태 3분류 계약 (v21 핵심)

| 상태 | 사유의 주인 | 정의 | 유저 행동 |
|---|---|---|---|
| 발행 가능 | 없음 | 연결 완료 + 심사 통과 + 쿼터 여유 | 없음 |
| 미연결 | 고객 | 아직 연결 안 함, 또는 계정 종류 불일치 | 연결 또는 계정 종류 변경. **후자는 해결 방법을 반드시 동반** |
| 오픈 준비중 | 우리 | 앱 자격증명 미등록, 또는 등록했으나 플랫폼 심사·감사 진행 중 | 없음. 기다림 |

이 세 단어를 채널 목록·채널 상세·Settings·시작 체크리스트에서 같은 뜻으로만 쓴다.
정적 QA가 네 화면 모두에서 어휘 존재와 주인 표시를 검사한다.

## 플랫폼 사실 계약 (매트릭스 기반)

### 앱 전체 공유 한도 대 계정별 한도

| 구분 | 채널 | 화면 처리 |
|---|---|---|
| 전 회원이 나눠 씀 | YouTube, Pinterest, Tumblr, Discord, Telegram | 유저 화면에는 "오늘 보낼 수 있는지", 운영자 화면에는 "전체 잔여" |
| 회원이 늘어도 안전 | Threads, Instagram, Facebook, Bluesky, Slack, LINE | 운영자 화면에서 별도 패널로 분리 |

### YouTube (부모 확정 수치 고정)

- 업로드 호출 자체는 1 유닛이지만 하루 100회라는 별도 상한이 걸린다.
- 이 100건은 회원 1인당이 아니라 전 회원 합계다.
- 쇼츠 전용 API·엔드포인트·메타데이터가 없다. 일반 영상 업로드와 같은 경로다.
- 세로 또는 정사각 비율이면서 3분 미만이면 자동으로 쇼츠로 분류된다.
- `#Shorts` 해시태그는 필수가 아니다.
- 출처: https://developers.google.com/youtube/v3/determine_quota_cost
- **금지: `1600 유닛`과 `하루 6건`을 어느 화면에도 쓰지 않는다.** 정적 QA가 부재를 검사한다.

### 그 외 확정 사실

| 채널 | 화면 계약 |
|---|---|
| TikTok | 심사 전에는 비공개로만 게시된다. 결과에 `게시됨`을 쓰지 않는다. 주 버튼은 기다리기 |
| Naver Blog | 자동 발행 경로 없음(2020-05 종료). 초안까지만. `우리가 함`과 `사람이 함`을 나란히 표시 |
| X | 게시 1건 약 $0.015, 링크 포함 시 약 $0.20. 발행 전에 표시. 링크 체크박스 기본 켜짐 |
| Midjourney | 공식 API 없음, 약관이 자동화 금지. 발행 채널로 그리지 않음 |
| LinkedIn | 한도 수치가 비공개. 숫자를 만들지 않고 `수치가 비공개`로 표시 |

## 중복 콘텐츠 계약

| 플랫폼 | 규칙 | 결과 |
|---|---|---|
| YouTube | 최소한만 바꾼 유사 콘텐츠 대량 생성 명시 금지 | 수익 자격 상실, 계정 정지 |
| TikTok | 2025-09-15 원본성 정책으로 근사 중복 노출 감소 | 게시는 되나 덜 보임 |
| Pinterest | 동일 이미지 반복은 스팸 플래그 | 계정 노출 하락 |

**채널별 다시 쓰기는 선택이 아니라 게시 앞 단계다.** 건너뛰기를 차단하지는 않되,
건너뛰는 순간 위험을 명시한 danger 게이트를 한 번 더 통과하게 한다.
주 버튼은 항상 안전한 쪽이고 위험한 쪽은 danger 색이며 부차 위치다.

## 금지 패턴 (v20 전량 유지 + v21 추가 8개)

- 유저가 할 일이 없는 상태를 경고색으로 칠하기
- 누를 수 없는 버튼 남겨두기
- 목록에서 절반 이상 동시 강조하기
- 근거 없는 잔여 한도 숫자 표시하기
- 매트릭스 `[미확인]` 항목을 확정 사실로 쓰기 (특히 LinkedIn 한도, Facebook 25건/일)
- 심사 전 TikTok 결과에 `게시됨` 쓰기
- 네이버 블로그를 자동 발행 채널로 그리기
- 비싼 선택지를 싼 것처럼 기본값으로 숨기기

## Benchmark 적용

| 출처 | 차용 | v21에서 바꾼 것 |
|---|---|---|
| Buffer, 끊긴 채널 상단 정렬 (v20에서 도입) | 행동이 필요한 것을 위로 | 사유의 주인으로 확장. 미연결 → 발행 가능 → 오픈 준비중 순 |
| Buffer, Instagram 에러 라이브러리 | 실패를 원인별로 분해하고 각각 해결 방법을 준다 | 실패가 아니라 연결 전 단계에 먼저 적용. 거절마다 해결 방법 |
| 경쟁 5개 툴 (Later·Metricool·Buffer·Hootsuite·Publer) | 계정 요건을 우회하지 않고 공식 help에 그대로 문서화 | 요건을 도움말이 아니라 그 채널 행에 인라인으로 |
| Metricool, X 연결 별도 과금 | 원가를 제품 표면에 전가 | 과금이 아니라 먼저 비용 표시. 과금 방식은 회장 결정으로 회수 |
| 뱅크샐러드식 의도된 마찰 (design.md §3) | 신뢰가 필요한 지점에서 과정을 보여준다 | 중복 위험 게이트를 게시 직전에 |

## Design review

Classifier: APP UI.

Design Score: **A-**. AI Slop Score: **A-**.

| 항목 | 등급 |
|---|---|
| 시각 위계 | A |
| 타이포그래피 | A- |
| 간격과 레이아웃 | A |
| 색과 대비 | A- |
| 상호작용 상태 | A |
| 반응형 | A- |
| 내용과 문구 | A |
| AI 슬롭 | A- |
| 모션 | B+ |

실브라우저 스크린샷을 보고 고친 것 3건:

1. 오픈 준비중 행의 비활성 `준비 상황 보기` 버튼 제거. 하고 싶은 일을 이름으로 걸고 막는 구조였다.
   `기다리시면 됩니다` 평문으로 교체하고, 채널 목록 비활성 버튼 0을 QA로 강제했다.
2. 미연결 6개가 전부 경고 배경이라 강조가 무의미했다. 정렬은 유지하고 첫 하나만 accent 테두리로.
   목록 강조 정확히 1개를 QA로 강제했다.
3. 쇼츠 해시태그 행의 제목과 설명이 같은 말을 반복했다. 설명을 판정 이유로 교체했다.

### 증거 경계

실브라우저는 로컬 HTTP 서버 경유로 성공했다. `file://`과 `open`은 이 환경에서 여전히 막혀 있다.
12조합 스크린샷과 접근성·목표 크기·오버플로 측정을 확보했다.

증명하지 못한 것: 실제 제공자 왕복, 실제 쿼터 조회값, 실사용자 관찰,
그리고 매트릭스가 `[미확인]`으로 남긴 31건. 그 31건은 화면에 확정 사실로 그리지 않았다.

## 레드팀·셀프심문

**경쟁자의 공격**: "10개 채널 중 발행 가능이 1개다. 정직한 표시가 나쁜 상태를 좋게 만들지 않는다."

받아들인다. 3분류는 상태를 개선하지 않고 설명한다. 다만 설명이 없으면 유저는 이유도 모른 채 이탈하고,
우리는 무엇을 먼저 뚫을지 모른다. 운영자 화면의 `오픈 준비중 3`은 그 자체가 회사의 할 일 목록이다.
그래서 이 설계는 제품을 좋아 보이게 하는 장치가 아니라 우선순위를 강제하는 장치다.

**이 결론이 틀렸다면 가장 그럴듯한 이유**: `오픈 준비중`이 "곧 열린다"는 약속으로 읽힌다는 점이다.
YouTube 감사와 TikTok 감사는 신청조차 안 한 상태이고 공식 소요 기간도 없다.
"준비중"은 진행 중을 뜻하는데 실제로는 미착수다. 표현이 사실보다 반 발 앞서 있다.
사유 문장에 "아직 통과하지 못했습니다"를 넣어 진행 단계를 흐리지 않았지만,
어휘 자체는 회장이 정한 것이라 바꾸지 않고 회수 항목으로 올린다.

**두 번째 흔들기**: 다시 쓰기를 필수 단계로 만든 것이 OSMU의 약속을 스스로 깎는다는 반론이 가능하다.
반박: 약속의 핵심은 "한 번의 입력으로"이지 "같은 글자로"가 아니다.
다시 쓰기를 제품이 자동으로 해주면 약속은 그대로이고 정책 위반만 사라진다.
그래서 주 버튼이 `채널별로 다시 쓰기`이고 유저에게 직접 고치라고 요구하지 않는다.

⛔ 회수 필요: `오픈 준비중`이 미착수까지 포함하는지, 신청한 것만 그렇게 부를지.

⛔ 회수 필요: `내가 할 일`·`우리가 할 일` 표현을 유지할지 행동어로 바꿀지.

⛔ 회수 필요: YouTube 감사와 TikTok 감사 중 어느 것을 먼저 신청할지.

⛔ 회수 필요: X 비용 전가 방식(별도 부가금 대 회원별 게시 크레딧).

⛔ 회수 필요: 다시 쓰기를 자동으로 할지 유저 확인을 받을지. 자동이면 생성 비용이 채널 수만큼 늘어난다.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: 상태 3분류는 유저 행동을 정확히 가르지만, 발행 가능이 1개뿐인 현실 자체를 디자인으로 가릴 수는 없다.

SOURCES: `DESIGN.md` v19·v20; `docs/platform-policy-matrix-v1-gpt-codex.md`;
`docs/user-flow-marketing-agent-v21-gpt-codex.md`; `docs/wireframes/marketing-agent-v21-gpt-codex.md`;
`docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; `wiki/reference/channel-status.md`;
회장 확정 지시 2건 (2026-08-08); https://developers.google.com/youtube/v3/determine_quota_cost ;
`/tmp/marketing-v21-static-qa.log`; `/tmp/ma-v21/*.png` 19장

MODEL: claude-opus-5[1m]

SKILLS_USED: gstack design-review for APP UI classifier, hierarchy and dead-control findings, AI slop blacklist, fix loop

SKILLS_SKIPPED: design-consultation과 design-shotgun. v20 가산 지시이고 토큰 상속이 원칙이라 방향 발산 금지

---

# v22. 연결 통로와 흐름 연속성 (2026-08-09)

> 근거: 부모가 Chrome에서 v21을 직접 클릭해 재현한 결함 3건 + 그 계열로 실측된 55건.
> 산출: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v22-gpt-codex.html`,
> `docs/user-flow-marketing-agent-v22-gpt-codex.md`, `docs/wireframes/marketing-agent-v22-gpt-codex.md`.
> **토큰 변경 0.** v19~v21의 색·타이포·간격·radius·포커스를 그대로 상속한다.

## v22.1 이번에 배운 것

**상태를 정확히 부르는 일과 그 상태에서 나갈 문을 주는 일은 다른 일이다.**
v21은 채널 상태를 사유의 주인으로 3분류해 "누가 해결하는가"를 완벽하게 말했다.
그런데 `내가 할 일`이라고 말해놓고 그 일을 할 방법을 어느 화면에도 두지 않았다.
이름표는 완성됐고 문은 없었다.

원인은 하나였다. `connect` 동작에 전용 처리기가 없어서 모든 연결 버튼이
`동작을 기록했습니다`라는 접수증만 남겼다. **접수증은 반응이 아니다.**

## v22.2 새 규칙 4개 (DESIGN.md 계약에 추가)

### 규칙 1. 사유를 말한 블록은 그 사유에서 나가는 문을 같은 블록에 둔다

상태 배지·사유 문장·해결 방법까지 적고 행동을 안 주면 그 화면은 완성되지 않은 것이다.
사유의 주인이 고객이면 그 행동 버튼을, 우리면 기다림 안내와 그동안 할 수 있는 일을 준다.

### 규칙 2. 반드시 실패할 버튼은 비활성이 아니라 교체한다

두 방법 중 하나를 고른다.

- (버림) 버튼 이름을 그대로 두고 비활성으로 막는다
- (채택) 그 자리에 지금 실제로 가능한 행동을 놓고, 원래 버튼은 `연결 후 나타납니다` 예고로 바꾼다

하고 싶은 일을 이름으로 걸어놓고 막는 것은 신뢰를 깎는다(v21이 스스로 판정한 원칙의 확장).

### 규칙 3. 진행 표시는 방문이 아니라 사건으로만 켠다

경로를 밟았다는 이유로 완료 표시를 켜지 않는다. 연결됨·승인됨·게시 확인됨·열어봄 같은
실제 사건만 켠다. 켜지는 순간은 그 사건이 일어난 그 자리다.

### 규칙 4. 없는 데이터는 만들지 않고 무엇이 생길지를 알려준다

가입 직후 화면에 게시 18건과 다음 실험 제안이 있으면 그 화면 전체가 거짓말이 된다.
빈 상태는 `아직 없음` 네 줄로 무엇이 채워질지 예고하고, 지금 할 행동 하나를 준다.
빈 화면에 이유가 없으면 유저는 고장으로 읽는다.

## v22.3 토큰 사용 (신규 토큰 0, 조합만 추가)

| 컴포넌트 | 조합 | 근거 |
|---|---|---|
| `.next-action-card` | `--accent` 테두리 + `--accent-soft` 배경 + radius 12 | 시작 체크리스트의 다음 단계 테두리를 그대로 재사용 |
| `.next-action-card[data-owner="operator"]` | `--border` + `--surface-2` | 고객이 할 일이 없는 상태는 색으로 재촉하지 않는다 |
| `.connect-steps span[data-current]` | `--accent` 배경 + 흰 글자 | 현재 단계 |
| `.connect-steps span[data-passed]` | `--success` / `--success-soft` | 지나온 단계 |
| `.provider-consent .provider-bar` | `--surface-2` | 우리 화면이 아님을 회색으로 구분 |
| `.permalink-row` | `--success-soft` 배경, `code`는 `--success` | 확인된 결과만 성공색 |
| `.scope-list .scope-mark` | `--success` | 허용 항목 체크 |

## v22.4 반응형 계약 변경 (1건)

```
/* v21 */ @media(max-width:1100px){ .span-8,.span-7,.span-6,.span-5,.span-4{grid-column:span 12} }
/* v22 */ @media(max-width:1100px){ .span-8,.span-4{grid-column:span 12}
                                    .span-7{span 7} .span-5{span 5} .span-6{span 6} }
```

1024에서 전부 한 줄로 접으면 그 폭이 폰의 확대판이 된다(품질헌법 §1.4).
둘로 나뉘는 단은 살리고, 셋 이상으로 쪼개지는 단만 접는다. 1024에서 250px 열은 읽을 수 없다.

## v22.5 검증 계약 변경: "핸들러 등록"에서 "실제 반응"으로

v21의 QA는 `미등록 핸들러 0`을 봤다. 그것은 "누르면 예외가 나지 않는가"였다.
그래서 눌러도 아무 화면이 안 열리는 버튼 22개를 통과시켰다.

v22부터 화면 산출물은 **클릭 전수 반응 감사**를 통과해야 한다.

1. 화면 35개(고객 25 + 운영자 10)에서 눈에 보이는 클릭 가능 요소를 전부 누른다
2. 매 클릭마다 처음부터 다시 불러 상태 오염을 없앤다
3. 누르기 전후 화면을 비교해 세 갈래로 나눈다

| 갈래 | 판정 |
|---|---|
| 무반응(화면 변화 0) | **0이어야 한다.** 하나라도 있으면 반려 |
| 이미 그 상태(현재 탭·현재 메뉴) | 정상 |
| 접수증만(내용 그대로, 기록 문구만) | 통과하되 수를 보고한다. 개선 대상 |

실측: v21 무반응 122(그중 명백한 것 17) + 연결 계열 가짜 반응 22 → **v22 무반응 0**, 접수증만 38.

## v22.6 실패 문구는 만들지 않고 코드가 분류하는 것만 쓴다

연결 실패 화면의 5종은 `dashboard/src/lib/oauth-errors.ts`가 실제로 분류하는 범주다.
그 파일은 분류되지 않은 제공자 원문을 그대로 노출하지 않고 일반 문구로 바꾼다.
화면도 같은 규칙을 따른다. 실패 사유를 상상해서 늘리지 않는다.

모든 실패 화면에 고정 문장 하나를 둔다.
**`만들던 초안과 예약은 그대로 있습니다. 연결 실패로 잃은 것은 없습니다.`**
무엇을 잃었는지 모르면 다시 시도하지 않는다.

## v22.7 유지 (갈아엎지 않은 것)

사이드바 26목적지와 순서, 채널별 탭 구성과 상대 순서, Settings 고객용 8그룹,
상태 3분류 어휘와 사유의 주인 표시, 계정 저장 내용 읽기 10필드,
플랫폼 정책 사실(YouTube 전 회원 100건, X 단가와 13배, TikTok 심사 전 비공개, 네이버 반자동),
보존·가산·미지원 3분류 칩, 엠대시 전면 금지, 색·타이포·간격·radius·포커스 토큰 전량.

---

# v22 갱신 (2026-08-10) · 근거 보강과 관리자 여정 폐쇄

v22 프로토타입을 새로 만들지 않고 같은 파일을 갱신했다. 이유는 두 가지다.
첫째, v22의 핵심이 연결 흐름인데 경쟁 온보딩 벤치마크가 0건이라 3단계가 적당한지 근거가 없었다.
둘째, 회장이 역할 전환을 눌렀을 때 운영자 화면에 들어가지 못했다.

## v22.8 경쟁 연결 온보딩 실조사 (Reference 표)

이번 조사 전까지 이 흐름의 단계 수와 사전 안내는 우리 판단만으로 정해져 있었다.

| 항목 | Buffer | Metricool | Publer | 우리 v22 | 판정 |
|---|---|---|---|---|---|
| 연결 시작에서 완료까지 | 4동작 · 사전 설명 화면 없음 | 3단계 · 사전 설명 화면 없음 | 7단계 · 방식 선택 프롬프트 1개 | 3단계 (시작 · 승인 · 완료) | 우리가 적은 축. 3단계 유지 |
| 제공자 승인 전 안내 화면 | 없음 (도움말 문서로 뺌) | 없음 (도움말 문서로 뺌) | 방식 선택 + "다음 화면에서 계속" | 있음 (권한·계정요건·주의 2건) | 우리가 앞섬 |
| 계정 종류 요건 고지 시점 | 도움말 문서 (실패 후 검색) | 연결 전 명시 (Business/Creator) | 연결 전 명시 | 연결 전 화면 안에서 명시 | 우리가 앞섬 |
| 연결 실패 표현 | 도움말 3분류 · 제품 UI 문구는 문서화 안 됨 | 문서 빈약 · "잘못된 계정" 별도 문서 | 별도 FAQ | 화면 안 6분류 + 각각의 다음 행동 | 우리가 앞섬 |
| 미연결 채널의 게시 동작 | 채널 자체가 목록에 없음 (숨김) | 연결 전 미노출 (숨김) | 연결 전 미노출 (숨김) | 예고 + 연결 시작 배치 | 업계 표준은 숨김. 우리는 의도적 이탈 |
| 브라우저 로그인 계정 경고 | 도움말에만 (지원 1순위 문제) | 도움말에만 ("연결된 계정이 올바르지 않음" 별도 문서) | 문서 | v22 갱신에서 흐름 안으로 이동 | 이번에 따라잡음 |
| 권한 일부만 허용 경고 | 도움말에만 ("전부 승인하세요") | 언급 없음 | 언급 없음 | v22 갱신에서 흐름 안으로 이동 | 이번에 따라잡음 |

출처:
support.buffer.com/article/564-connecting-your-channels-to-buffer,
support.buffer.com/article/568-connecting-your-instagram-business-or-creator-account-to-buffer,
support.buffer.com/article/565-troubleshooting-instagram-connections,
help.metricool.com/en/article/how-to-connect-social-media-and-ad-platforms-to-metricool-o8xq71,
publer.com/help/en/article/how-to-connect-instagram-accounts-1ny3f7m.

### 우리가 뒤처졌던 지점과 이번 처리

세 곳 모두 연결 실패의 실제 1·2순위는 기능 결함이 아니라 두 가지였다.
브라우저에 로그인돼 있던 다른 계정이 연결된 것, 그리고 승인 화면에서 권한을 일부만 켠 것이다.
세 곳 다 이 경고를 도움말 문서에만 두고 흐름 안에는 두지 않는다.
그래서 사용자는 실패한 뒤에야 검색해서 알게 된다.
우리도 같은 상태였다. 실패한 뒤 고치는 것보다 승인 화면에 보내기 전에 막는 것이 싸다.
연결 시작 화면에 확인 2건을 하나의 블록으로 넣었다. 상자 4개를 쌓지 않고 1개 안에 2줄로 둔 것은
편집 원칙(무엇을 뺄지) 때문이다.

### 반영하지 않기로 한 것과 그 이유

미연결 채널을 숨기는 업계 표준은 따르지 않는다.
셋 다 숨기는 이유는 그들에게 채널 목록이 곧 상품 범위이기 때문이다.
우리는 채널이 열리지 않는 원인이 두 가지(운영자 앱 미등록, 플랫폼 심사)이고
그중 하나는 고객이 기다리면 풀린다. 숨기면 고객은 그 채널이 없는 줄 알고 떠난다.
그래서 예고 + 연결 시작을 유지한다. 다만 이것은 표준에서 벗어난 선택이므로
게시 4동작을 비활성 버튼으로 두지 않고 "연결 후 이 자리에 나타납니다"로 적는 규칙을 함께 유지한다.

## v22.9 실패 분류 5종에서 6종으로 (코드 대조 결과)

`dashboard/src/lib/oauth-errors.ts`를 다시 읽고 프로토타입과 대조했다.
코드는 "테스터 초대 미수락"(1349245 분기)과 "개발자 역할 없음"을 서로 다른 분기로 잡는데
프로토타입은 둘을 `role` 하나로 묶고 있었다. 고치는 사람이 다르다.
초대 수락은 고객이 직접 눌러야 하고 역할 추가는 운영자가 한다.
묶어두면 고객에게 "운영자에게 요청하세요"라는 틀린 다음 행동을 준다. `invite`를 분리했다.
`redirect_uri` 불일치는 운영자 사유라 고객 화면의 분류로 올리지 않았다.

## v22.10 역할 전환은 제품 요소다 (검수 도구가 아니라)

v22까지 역할 전환은 `#qa-role` 네이티브 select 하나뿐이었고,
그 select는 `?prototypeInspector=1` 없이는 숨겨지는 검수 바 안에 있었다.
프레젠테이션 상태에서 운영자 화면에 들어갈 방법이 아예 없었다.
고객 상단바의 `역할: 고객`은 클릭되지 않는 `<span>` 칩이었다.

새 규칙: **보는 사람을 바꾸는 조작은 검수 도구가 아니라 제품 화면 안에 둔다.**
- 고객·운영자 양쪽 상단 같은 자리에 분절 버튼 2개(`aria-pressed`)로 둔다. 네이티브 select 금지.
- 운영자 콘솔 상단바는 `sticky`. 표가 길어 아래로 내려가도 돌아올 문이 사라지지 않는다.
- 역할이 바뀌면 상대 역할의 열린 창(모달·오버레이 8종)을 전부 닫는다. 고객 모달이 운영자 화면 위에 남으면 거짓 화면이 된다.

## v22.11 조치 버튼은 대상을 이름으로 말한다

운영자 화면에서 `일시 정지`가 고객 상세와 아래 작업 공간 패널에 각각 있었다.
둘 다 같은 상태를 건드리는데 화면은 어느 고객이 멈추는지 말하지 않았다.
게다가 아래 패널은 어떤 고객을 골라도 모노스튜디오 값을 그대로 보여줬다.

새 규칙 2개:
- 한 화면에 같은 조치를 두 번 두지 않는다. 조치는 상세 한 곳으로 모으고 버튼에 대상 이름을 붙인다(`바른치과 일시 정지`).
- 특정 대상에서 옮겨온 값은 그 대상을 고른 경우에만 편다. 다른 대상에서는 "아직 옮기지 않았습니다"라고 적는다. 숫자를 돌려쓰지 않는다.

## v22.12 Design review 결과 (스킬 실행)

측정값 기반. Design Score **A-**, AI Slop Score **A**.

| 카테고리 | 가중 | 등급 | 근거 |
|---|---|---|---|
| Visual Hierarchy | 15% | A | 운영자 진입 불가(High)를 이번에 닫음 |
| Typography | 15% | A- | Pretendard 단일 서체, 블랙리스트 0. 사이드바 그룹 라벨이 `h2` 11px로 의미와 크기가 어긋남(Medium, 미수정) |
| Spacing & Layout | 15% | A- | 4px 스케일 토큰 일관, 가로 스크롤 0 |
| Color & Contrast | 10% | B- | 라이트 통과. **다크에서 `button.primary` 전량이 흰 글자 위 `#60a5fa` = 2.46:1로 AA 미달(High, 이월)** |
| Interaction States | 10% | A- | 44px 미만 터치 타깃 0(수정 후), focus-visible 전역, `aria-pressed` |
| Responsive | 10% | B+ | 390·1024·1440 확인. 390에서 운영자 nav 10개가 본문 위로 쌓임(Medium) |
| Content & Microcopy | 10% | A | 오류 문구가 원인+다음 행동, 빈 상태가 첫 행동, 로렘 0, 엠대시 0 |
| AI Slop | 5% | A | blob 0, 이모지 0, 강제 중앙정렬 0, 그라디언트 1(진행 바), 실서체 |
| Motion | 5% | B | 의도된 전이가 거의 없음 |
| Performance Feel | 5% | A | 단일 정적 파일 |

지적 중 이번에 고친 것:
1. 역할 전환 버튼이 34px로 44px 미만이었다. 페이지에서 유일한 미달 요소였고 내가 이번에 넣은 것이다. 44px로 올렸다.
2. 어두운 상단바에서 선택된 역할 버튼이 `#d4d4d8`로 떨어져 3.6:1이었다. 흰색으로 되돌려 5.35:1.
3. 연결 시작 화면에 상자가 4개 쌓여 벽이 됐다. 새 경고 2건을 1개 블록 2줄로 합쳤다.

고치지 않고 이월한 것:
- **다크 모드 primary 대비 2.46:1.** 내가 넣은 컴포넌트만의 문제가 아니라 `--accent` 다크값(`#60a5fa`)과 `button.primary{color:#fff}` 조합이라 화면 전역이다. 한 컴포넌트만 다르게 고치면 나머지와 어긋난다. 토큰 결정이므로 여기 적고 다음 판에서 `--accent` 다크값을 낮추거나 primary 전경색을 어둡게 바꾸는 것을 함께 정한다.
- 사이드바 그룹 라벨의 `h2` 11px. 시각 위계는 맞고 구조만 어긋난다. 26목적지 사이드바를 건드리면 보존 대상이 흔들려 이번에는 손대지 않았다.
- 390px 운영자 nav 스택. 운영자 콘솔은 데스크톱 작업이고 상단바를 sticky로 만들어 되돌아오는 길은 확보했다.

## v23 디자인 시스템 규칙 확정 (간격·글자·넘침·정보 위계)

회장 반려 사유 2번: "부품별로 어떤 건 여백이 있고, 어떤 건 따닥따닥 붙어있고, 어떤 건 텍스트가
흘러넘치고, 어떤 건 불필요한 정보가 많다." 이 네 증상은 한 뿌리에서 나왔다.
여백·글자 크기가 부품에 붙지 않고 화면마다 직접 박혀 있었다. 실제 코드 실측이 근거다.

`dashboard/src/**` 클래스 집계: `text-[10px]` 335곳, `text-[11px]` 93곳, `text-[9px]` 21곳,
`py-2` 137곳, `gap-2` 133곳, `py-1` 100곳, `mb-3` 77곳, `gap-3` 64곳, `mb-2` 61곳,
`py-1.5` 60곳, `mb-1` 60곳, `p-3` 59곳, `px-2` 57곳, `px-3` 56곳, `p-4` 55곳, `mb-4` 55곳,
`py-0.5` 51곳. 같은 성격의 값이 6단 이상 갈라져 있었다.
`dashboard/src/components/shared/`에는 Card·Badge·EmptyState는 있으나 버튼·간격·섹션을
강제하는 공통 부품이 없었다(BackButton·LoginModal뿐). 그래서 각 화면이 제 마음대로 값을 박았다.

### 규칙 1. 간격 단계표 (6단계)

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--stack-tight` | 8px | 같은 뜻의 줄 사이. 라벨과 값, 제목과 부제 |
| `--stack` | 12px | 부품 안의 블록 사이. 문단과 버튼 행, 탭 행과 프레임 |
| `--pad-inset` | 16px | 부품 내부 여백. 카드·패널의 안쪽 |
| `--stack-section` | 24px | 부품 사이. 패널과 패널, 묶음과 묶음 |
| (섹션 큰 분리) | 32px | 성격이 다른 영역의 위아래 분리 |
| (미세) | 4px | 아이콘과 숫자, 점 표시 사이처럼 붙어야 하는 것 |

- **허용 값은 4 · 8 · 12 · 16 · 24 · 32뿐이다.** 그 사이 값(5·6·7·9·10·11·13·14·18·20·22)을 쓰지 않는다.
- 예외는 3종만 선언한다. ①알약 버튼 인셋 2px ②고정 크롬 오프셋(모바일 상단바 58px, 묶음 번호 열 64px)
  ③컨트롤이 콘텐츠 위에 얹힐 때의 거터(캐러셀 좌우 48px = 컨트롤 44px + 위치 4px).
  이 셋은 간격이 아니라 특정 부품의 고정 치수에서 계산된 값이다. 계산식을 주석으로 남긴다.
- 터치 하한 44px은 간격 단계표보다 상위 규칙이다. 실제 코드가 28px(`w-7`)을 쓰더라도 44px로 올린다.
- **부품 내부 여백과 부품 사이 여백을 분리한다.** 부품은 자기 아래 여백을 갖지 않는다.
  여백은 부모가 정한다(`.stack-section > * + * { margin-top: 24px }`).
  이유: v21에서 카드가 16px 어긋난 원인이 `.panel + .panel{margin-top:16px}`였다.
  인접 규칙은 그리드 안에서 오작동한다. 부모가 정하면 그리드에서도 같은 값이 나온다.

### 규칙 2. 글자 크기 단계표 (7단계, 하한 12px)

| 등급 | 크기 / 줄높이 | 쓰는 곳 |
|---|---|---|
| 캡션 | 12px / 18px | 각주, 카운터, 보조 라벨, 배지. **이보다 작은 글자는 없다** |
| 보조 본문 | 13px / 20px | 탭 라벨, 목록 부제, 표 셀 |
| 본문 | 15px / 24px | 게시물 본문, 설명 문단 |
| 리드 | 17px / 26px | 강조 문단, 영상 장면 문구 |
| 소제목 | 20px / 28px | 패널 제목, 카드 슬라이드 문구 |
| 제목 | 24px / 32px | 화면 제목 |
| 대제목 | 30px | 최상위 표제 |

- **9px·10px·11px 금지.** 실제 코드의 `text-[10px]` 335곳이 줄높이를 어긋내고 좁은 버튼에서 넘쳤다.
  10px과 11px을 섞으면 같은 행의 두 라벨이 다른 기준선에 앉는다.
- 캡션 하한 12px은 이전 검수의 "11px 미만 금지"보다 한 단계 위로 올린 값이다. 한국어는 자모 밀도가
  높아 11px에서 받침이 붙어 보인다.
- 크기마다 줄높이를 짝으로 고정한다. 크기만 바꾸고 줄높이를 상속시키면 행이 어긋난다.

### 규칙 3. 넘침 규칙 (부품별로 못 박는다)

| 부품 | 넘칠 때 무엇을 하나 | 금지 |
|---|---|---|
| 버튼·탭·배지·나비게이션 라벨 | 아무것도 자르지 않는다. 부품이 자기 폭을 지키고(`flex:0 0 auto`) 컨테이너가 가로로 밀린다 | 줄임표, 줄바꿈, flex 축소 |
| 게시물 본문·설명 문단 | 줄바꿈한다(`overflow-wrap:anywhere`) | 줄임표 |
| 영상 캡션·목록 부제 | 2줄까지 보이고 그 뒤를 자른다(`.clamp-2`) | 1줄 자름 |
| 사용자가 입력한 값 (주제, 파일명) | 1줄 자름 허용(`.clamp-1`) | 없음 |

- **라벨이 잘려 뜻을 잃는 상태는 금지다.** v22의 `Threads 미라`는 이 규칙 위반이었다.
- 실제 뿌리는 글자 크기가 아니라 flex였다. 가로 스크롤 컨테이너 안의 버튼이 flex 기본값으로
  줄어들면서 라벨이 잘렸다. `flex:0 0 auto`가 진짜 수정이다.
- 데스크톱에서 탭이 컨테이너를 넘치면 스크롤이 아니라 줄바꿈으로 전부 보인다.
  가로 스크롤 힌트는 모바일에서만 뜨므로, 데스크톱에서 스크롤로 두면 숨은 채로 잘린다.

### 규칙 4. 정보 위계 규칙 (무엇을 항상 보이고 무엇을 접나)

한 화면의 요소를 3단으로 나눈다.

1. **항상 보인다** = 이 화면에서 사용자가 지금 할 결정과, 그 결정에 필요한 값.
   예: 문구, 미리보기 프레임, 글자수, 다음 조치 1개.
2. **한 번 눌러 편다** = 결정을 바꿀 때만 필요한 값. 예: 자료 계보, 자격증명 상세, 설정 파라미터.
3. **다른 화면으로 옮긴다** = 이 결정에 쓰이지 않는 값. 예: AI 엔진 이름, 크레딧 잔액, 운영 지표.

**"불필요한 정보 과다"의 판정 기준 3개.** 하나라도 걸리면 그 요소를 2단 또는 3단으로 내린다.

- 이 값을 지우면 사용자가 지금 할 결정이 바뀌는가. 안 바뀌면 1단에 있을 이유가 없다.
- 같은 조치가 한 화면에 두 번 있는가. 있으면 하나로 모으고 대상 이름을 붙인다(v22.11 규칙).
- 한 부품의 헤더에 요소가 4개 이상인가. 3개까지만 둔다(로고·라벨·수치). 넷째부터는 본문으로 내린다.

### 규칙 5. 미리보기 프레임은 발명하지 않는다

`dashboard/src/components/studio/PlatformPreview.tsx`가 미리보기의 진실원이다.
프로토타입은 그 파일의 `PREVIEW_PLATFORMS` 7종, `Logo()` 벡터, `Frame()` 카운터,
`IgCarousel()`, `VideoRail()` 구조를 그대로 옮긴다. 글자 한도는
`dashboard/src/lib/channel-text-limits.ts`가 진실원이다(x 280, threads 500, instagram 2200,
facebook 63206). 프레임을 새로 디자인하지 않는다. 화면을 줄여야 하면 폭을 줄이고 구조는 지킨다.

- 미리보기 안의 반응 수·시간은 실제 코드에 하드코딩된 예시 값이다. 프레임 하단에 각주로 밝힌다.
  각주 없이 숫자를 보이면 실제 성과로 오독된다.
- 플랫폼을 고르는 방식은 **탭 하나 + 프레임 하나**다. 플랫폼마다 버튼을 늘어놓지 않는다.
  버튼을 늘어놓는 것은 "무엇을 보여줄지 못 정한 상태"를 화면에 드러내는 것이다.

### 규칙 6. 다크 모드 강조색 전경 (v22 이월 항목 종결)

다크에서 `--accent`는 `#60a5fa`다. 그 위에 흰 글자를 얹으면 2.46:1로 WCAG AA에 미달했다.
v22가 "토큰 결정이므로 다음 판에서 정한다"고 이월한 항목이다. v23에서 정한다.

- **강조색은 바꾸지 않는다. 전경을 어둡게 돌린다.** `[data-theme="dark"] button.primary{color:#0a0a0b}`.
  실측 7.78:1. 같은 규칙을 역할 전환 선택 버튼, 묶음 번호 원, 브랜드 마크에 적용한다.
- 이유: `--accent` 값을 낮추면 다크 화면 전역의 링크·활성 탭·강조 테두리 톤이 함께 어두워진다.
  대비 미달은 배경이 아니라 전경 조합의 문제였으므로 전경만 고치는 것이 파급이 작다.

### v23에서 재사용한 기존 자산

- 승계: v22 프로토타입 전체(26목적지·14단계 여정·연결 3단계 모달·역할 전환·복구 24상태·전달 표·
  정책 경고·검수 도구 상단바), v22의 `--space-1..8` 토큰 골격, `.panel`·`.status`·`.notice` 부품.
- 실제 코드에서 옮김: `PlatformPreview.tsx`의 7프레임·로고·카운터·캐러셀·영상 레일,
  `channel-text-limits.ts`의 한도 4개, `app/studio/page.tsx`의 3묶음 분류와 2열 배치 발상.
- 새로 만든 것: 위 규칙 1~4의 단계표와 넘침·위계 규칙, `.pv-*` 부품군, 데스크톱 2열 그리드.
  이유는 규칙 없이 값이 난립한 것이 반려 사유였기 때문이다.
- 바꾼 것: `.panel + .panel` 인접 여백을 부모 기준(`.stack-section`)으로, 다크 primary 전경색,
  가로 스크롤 컨테이너 안 버튼의 flex 축소 차단.

### v23 Design review 결과 (스킬 실행, 스크린샷 루프)

측정값 기반. 모바일 390 / 데스크톱 1024 / 다크 1024 실촬영 후 재검.
스크린샷: `docs/prototype/qa-v23/studio-mobile-390.png`, `studio-desktop-1024.png`, `studio-dark-1024.png`

Design Score **A-**, AI Slop Score **A**.

| 카테고리 | 가중 | 등급 | 근거 |
|---|---|---|---|
| Visual Hierarchy | 15% | A | 미리보기 복원으로 "무엇을 보여줄지 못 정한 화면"(High) 종결. 데스크톱 2열로 결정과 결과 분리 |
| Typography | 15% | A | 글자 크기 12종 → 6종, 하한 12px, 크기마다 줄높이 짝 고정. 블랙리스트 0 |
| Spacing & Layout | 15% | A- | 간격 22종 → 10종(고정 크롬 2개 포함). 가로 스크롤 0. 사이드바 그룹 라벨 `h2` 12px 의미 불일치 이월(Medium) |
| Color & Contrast | 10% | A- | **다크 primary 2.46:1 → 7.78:1로 AA 통과, v22 이월 High 종결.** 라이트 통과 |
| Interaction States | 10% | A- | 44px 미만 터치 타깃 0, focus-visible 전역, 탭 `aria-pressed`, 캐러셀 버튼에 aria-label |
| Responsive | 10% | A- | 390·1024 실촬영. 26목적지 전수 잘린 라벨 0·가로 스크롤 0. 390 운영자 nav 스택 이월(Medium) |
| Content & Microcopy | 10% | A | 예시 값 각주 명시, 오류 문구가 원인+다음 행동, 로렘 0, 엠대시 0 |
| AI Slop | 5% | A | blob 0, 3열 카드 그리드 0, 강제 중앙정렬 0, 실서체 Pretendard, 그라디언트는 진행 바와 IG 슬라이드 배경 2곳(의미 있음) |
| Motion | 5% | B | 탭 전환이 즉시 교체다. 의도된 전이가 여전히 거의 없다 |
| Performance Feel | 5% | A | 단일 정적 파일, 콘솔 오류 0 |

이번에 고친 것 4건:
1. Studio 미리보기 0개 → 3블록 7플랫폼 프레임 복원 (High, 회장 반려 1번).
2. 잘린 라벨. 390에서 7곳(`공통 초안`·`Threads`·`Instagram`·`Facebook`·`Bluesky`·`YouTube Shorts`·
   `Instagram Reels`)이 flex 축소로 잘렸다. `flex:0 0 auto`로 0건 (High).
3. 데스크톱이 폭만 늘린 모바일이었다. 1024 이상 2열 배치로 바꿨다 (Medium).
4. 다크 primary 대비 2.46:1 → 7.78:1 (High, v22 이월 종결).

리뷰 중 추가로 잡아 고친 것 2건:
5. IG 캐러셀 좌우 화살표가 슬라이드 문구를 덮었다. 슬라이드 좌우 여백 48px로 물렸다 (Medium).
6. 데스크톱에서 변형 탭 6개가 가로 스크롤로 잘리는데 스크롤 힌트는 모바일에만 떴다.
   데스크톱은 줄바꿈으로 전환해 6개 전부 보인다 (Medium).

고치지 않고 이월한 것 3건:
- 사이드바 그룹 라벨의 `h2` 12px. 시각 위계는 맞고 문서 구조만 어긋난다. 26목적지 사이드바는
  보존 대상이라 이번에도 손대지 않았다.
- 390px 운영자 nav 스택. 운영자 콘솔은 데스크톱 작업이고 상단바 sticky로 돌아오는 길은 있다.
- 모션. 탭·캐러셀 전환에 전이가 없다. 정적 프로토타입의 한계이자 다음 판 대상이다.

## v23.1 규칙 7. 띄워 놓은 요소는 글자를 가리지 않는다 (회장 직접 관찰 결함)

회장이 v23.0 화면에서 찾은 결함: OSMU Studio 1024폭에서 파란 원형 번호 배지가 옆 라벨
`소셜 게시물 텍스트`와 아래 제목 `공통 초안과 채널별 문구` 위에 겹쳐 글자가 읽히지 않았다.
섹션 2·3도 같은 상태였다.

**실측한 원인 (추측 아님).** 두 갈래였고 둘 다 v23.0이 새로 만든 회귀다.

1. **데스크톱**: `.studio-family > *{grid-column:1}`이 절대 위치 배지에도 걸렸다.
   절대 위치 요소에 확정된 격자 위치가 생기면 **담는 상자가 부모의 패딩 박스에서 그 격자 칸으로 바뀐다.**
   그래서 `left:18px`의 기준점이 64px 오른쪽으로 밀려 배지가 글자 위에 얹혔다.
   실측: 배지 왼쪽 331px, 제목 왼쪽 313px, 겹침 32x12px. 고친 뒤 배지 267px, 겹침 0.
   → 규칙: **절대 위치 요소에 `grid-column`·`grid-row`를 주지 않는다**(`auto`로 유지).
2. **모바일 390**: 배지 자리를 `padding-top:58px`로 확보했는데, 그 값이 `.studio-family.secondary-section`의
   `padding-top`(클래스 2개, 더 강함)에 져서 2·3번 섹션에서만 자리가 사라졌다.
   → 규칙: **자리 확보를 매직 넘버로 하지 않는다.** 좁은 폭에서는 배지를 흐름 안으로 되돌린다
   (`position:static`). 덮을 수 있는 구조 자체를 없애는 것이 값을 맞추는 것보다 안전하다.

**전수 검사 방법 (다음 판에도 이대로 돌린다).** 눈으로 훑지 않는다. 검출기를 돌린다.
- 대상: `position:absolute|fixed` 또는 음수 마진을 가진 **불투명**(배경 alpha>0.15) 요소
- 판정: 그 요소가 자기 자손이 아닌 **글자를 가진 잎 요소**와 2px 이상 교차하고, 위에 그려지면 결함
- 의도된 겹침 제외: 영상 프레임 위 반응 레일, 이미지 위 캐러셀 표시, 모달 배경, 검수 도구 바, 고정 하단 바
- **검출기는 반드시 양성 대조를 통과해야 한다.** 고쳤던 규칙을 일부러 되돌려 넣고 검출되는지 확인한 뒤에만
  "0건"을 믿는다. v23.1에서 이 대조를 했고, 되돌린 상태에서 4건(섹션 1의 라벨·제목, 섹션 2, 섹션 3)을 잡았다.
  대조 없이 나온 0은 검출기가 죽었다는 뜻일 수 있다.

## v23.1 오른쪽 열은 탭 2개다 (발행 이력 복원)

v23.0에서 데스크톱 오른쪽 열을 미리보기가 차지해 실제 코드(`app/studio/page.tsx:521-535`)의
발행 이력 패널이 빠졌다. 결정: **오른쪽 열 상단에 탭 2개(`미리보기` / `발행 이력`), 한 번에 하나만.**

- 두 패널을 나란히 두지 않는 이유: 1024폭에서 왼쪽 편집 영역이 380px 아래로 눌려 "따닥따닥"이 재발한다.
- 탭으로 나누는 이유: 미리보기는 지금 만드는 것이고 발행 이력은 과거 것이다. 동시에 볼 이유가 없다.
  이것이 위계 규칙 2단(한 번 눌러 편다)의 정석 적용이다.
- 발행 이력 탭에 넣는 것은 실제 코드가 가진 것만이다. 제목, 안내 한 줄, 항목(글감·저장시각·상태),
  `불러오기` 버튼, 빈 상태. 검색·필터·삭제는 코드에 없으므로 만들지 않는다.
- 상태 4종은 코드의 분기를 그대로 따른다: `발행됨`(published) / `복구 필요 · 재발행 금지`(partial) /
  `중지됨`(stopped) / `초안`(draft). partial을 불러오면 코드의 문구 갈래대로
  "외부 게시는 이미 끝났고 내부 기록만 복구가 필요합니다. 다시 발행하지 않습니다."를 띄운다.
- 빈 상태만 코드보다 올렸다. 코드는 `없음` 한 단어인데, 빈 상태는 첫 행동을 가리켜야 하므로
  `저장한 초안이 없습니다. 왼쪽에서 문구를 저장하면 여기에 쌓입니다.`로 바꿨다. 이 1건은 의도된 개선이다.

---

# Marketing Agent 디자인 시스템 v24

> STAMP: created_at=2026-08-12 02:49 KST | model=gpt-codex/gpt-5.6 | agent=product-designer | skills=gstack design-review static phases | evidence=v24 brief, v23 prototype, dashboard/src, v23 crosscheck, R02 journey plan, official platform sources | deliberation=v23의 shell과 Studio visual7은 보존하고 실제 code owner와 어긋난 합성 IA만 교정

## 1. 권위와 변경 범위

v24는 v23을 삭제하거나 백지 재설계하지 않는다. 시각 기준은 기존 shell, Preview, panel, status, notice다. 기능 기준은 현재 `dashboard/src`다.

이번 변경:

- 고객과 Admin 연결 상태를 `channel_accounts` 한 소스로 통일.
- Home의 성과, 발행물 성과, 운영 현황, This Week를 한 운영 성과 블록으로 통합.
- Studio draft에 `body`를 필수로 포함하고 불러오기에서 편집 본문으로 복원.
- Admin 중앙 OAuth를 provider별 accordion으로 전환.
- 채널별 Create와 Calendar, Admin 10탭 등 v23 합성 IA 제거.
- R-06 정책, 경쟁, 포지셔닝, AARRR 요약 추가. 현재 기능과 설계 목표를 분리.

## 2. 브랜드 형용사 3개

| 형용사 | 화면 발현 |
|---|---|
| 정직한 | 연결, 게시 가능, 게시 확인, 미구현을 다른 상태로 표시 |
| 통제되는 | owner route 한 곳에서만 쓰고 나머지는 같은 record를 읽음 |
| 증거 중심 | source, revision, account, external result와 확인 시각을 연결 |

## 3. Color tokens

기존 v23 semantic token을 그대로 사용한다.

| token | light | dark | use |
|---|---|---|---|
| `bg` | `#fbfbfc` | `#0a0a0b` | app background |
| `surface` | `#ffffff` | `#161618` | panel, sidebar |
| `surface-2` | `#f4f4f5` | `#1f1f23` | secondary surface |
| `border` | `#e4e4e7` | `#303036` | boundary |
| `text` | `#18181b` | `#f4f4f5` | primary text |
| `muted` | `#52525b` | `#d4d4d8` | secondary text |
| `subtle` | `#71717a` | `#a1a1aa` | metadata |
| `accent` | `#2563eb` | `#60a5fa` | primary action, focus |
| `success` | `#15803d` | `#4ade80` | confirmed result |
| `warning` | `#b45309` | `#fbbf24` | action or verification needed |
| `danger` | `#b91c1c` | `#f87171` | destructive, failed |

규칙:

- 준비 완료와 외부 게시 확인에만 success.
- 플랫폼 심사와 account action은 warning.
- 운영자가 해결할 pending은 neutral. 고객을 재촉하지 않는다.
- dark primary foreground는 `#0a0a0b`.

## 4. Typography tokens

서체: Pretendard, Apple system fallback.

| role | size / line | weight |
|---|---|---|
| caption | 12 / 18 | 500 to 700 |
| body small | 13 / 20 | 400 to 700 |
| body | 15 / 24 | 400 to 700 |
| lead | 17 / 26 | 700 |
| h3 | 20 / 28 | 700 |
| metric | 20 / 24 | 750 |
| h2 | 24 / 32 | 750 |

- 실제 사용 크기: 12, 13, 15, 17, 20, 24.
- 11 이하 금지.
- 긴 한국어는 단어 단위 줄바꿈, 식별자와 callback은 `overflow-wrap:anywhere`.

## 5. Spacing tokens

| token | px | use |
|---|---:|---|
| `space-1` | 4 | icon, compact inset |
| `space-2` | 8 | inline gap |
| `space-3` | 12 | control group |
| `space-4` | 16 | panel stack, mobile inset |
| `space-5` | 24 | desktop inset, block gap |
| `space-6` | 32 | major separation |
| `space-8` | 48 | Studio family inset, exceptional separation |

- 20, 10, 14, 18, 58, 64 spacing 금지.
- `sr-only`의 1px과 음수 1px은 접근성 예외.
- radius: panel 12, control 8, pill 999.
- shadow: overlay와 sticky bulk bar만.

## 6. Layout 계약

| viewport | shell | content axis | dense region |
|---|---|---|---|
| 1440 | 224 sidebar + fluid main | row shell, column page | Studio 2 columns |
| 1024 | 224 sidebar + fluid main | row shell, column page | grids 2 columns |
| 390 | menu overlay + 1 column main | column | table and preview rail internal scroll |

- Home main metrics: desktop 4, tablet 2, mobile 1 column.
- Home details: desktop 2 columns, 1024 이하 1 column.
- Admin metrics: desktop 6, tablet 3, mobile 1.
- Admin accordion: 1 column, summary row, body column.
- Calendar: desktop 7 columns. 390에서는 날짜 grid 내부 가로 스크롤을 허용하고 페이지 넘침은 금지.
- Studio: desktop editor and preview, mobile sequential column.

## 7. Component inventory

보존:

- `Sidebar`, `Topbar`, `PageHeader`, `Panel`, `Notice`, `StatusBadge`.
- `StudioToolbar`, `GenerationNotice`, `PreviewSection`, `PlatformPreview` 7종, `PublishHistory`.
- `ChannelConnectBanner`, `OnboardingChecklist`, `PipelineTimeline`.
- `ChannelPage`, `InstagramPage`, `SchedulePanel`, `SettingsTabs`.
- `OperatorSummary`, `AuthUserList`, `WorkspaceList`.

v24 추가 또는 수정:

- `HomeOperationsBlock`: 네 개 패널을 한 위계로 묶음.
- `ConnectionSourceNote`: `channel_accounts` 공통 소스 표시.
- `DraftHistoryRow.body`: 본문 excerpt와 load contract.
- `OAuthProviderAccordion`: summary와 credential body의 progressive disclosure.
- `PolicyPositioningSummary`: current와 target 분리.
- `AARRRFunnelSummary`: Acquisition, Activation, Retention, Revenue, Referral.

삭제한 합성 패턴:

- per-channel Create.
- per-channel Calendar.
- Admin 10-tab console.
- fake workspace creation and invite inside login.
- Messaging Queue and Analytics.

## 8. 상태 계약

| state | meaning | next action |
|---|---|---|
| empty | 아직 record 없음 | owner route의 첫 행동 하나 |
| loading | 해당 owner 작업 중 | 중복 실행 금지, 다른 surface 읽기 가능 |
| error | 조회 또는 처리 실패 | 입력 보존, retry 또는 settings |
| blocked | 계정, 권한, 심사, quota 차단 | owner가 해결할 정확한 행동 |
| draft | body 저장됨 | edit, review request |
| approved | revision 승인됨 | publish or schedule |
| publishing | provider 처리 중 | same item disabled |
| published | external result 확인 | permalink, analytics |
| partial | 외부 성공, 내부 기록 실패 | record repair only |
| unknown | 게시 여부 불확실 | reconcile only, republish 금지 |

데이터량 상태:

- 0: 다음 행동 한 개와 빈 상태 설명.
- normal: 핵심 3개에서 8개 노출.
- excess: 최신 항목 제한, 내부 scroll, wrap, accordion. 페이지 전체 horizontal overflow 0.

## 9. UX 심리 근거

- Hick's Law: Home의 네 패널을 한 블록과 한 우선순위로 묶어 선택 분산을 줄임.
- progressive disclosure: Admin 12개 credential form을 accordion으로 접어 현재 작업만 펼침.
- visibility of system status: connected, publish-ready, publishing, confirmed를 분리.
- error recovery: draft input과 provider result를 보존하고 안전한 retry와 record repair를 구분.
- recognition over recall: 각 owner route에서 source, account, status, next action을 함께 표시.

## 10. R-06 정책과 포지셔닝

포지셔닝: OpenClaw는 채널 수를 파는 자동 게시기가 아니다. 승인된 브랜드 사실에서 외부 게시 결과까지 확인 가능한 마케팅 운영 체계다.

| 근거 | 차용 | 제품 적용 |
|---|---|---|
| Later OAuth와 data safety | provider 로그인, 승인 scope, 연결 건강 확인 | 고객에게 중앙 app key 입력을 넘기지 않음 |
| Metricool API limitations | 플랫폼별 불가 기능을 공개 | 연결됨과 게시 가능을 분리 |
| YouTube quota and audit | 기본 upload bucket과 증액 감사 | operator 잔여량과 차단 이유 우선 |
| WCAG Reflow, Text Spacing | 390 reflow, text wrap | 고정폭 압착과 clip 금지 |

AARRR current:

- Acquisition: positioning 일부.
- Activation: Google login, channel connect, first Studio draft.
- Retention: Threads 결과와 주간 흐름 일부.
- Revenue: 미구현.
- Referral: 미구현.

Revenue와 Referral을 현재 기능처럼 그리지 않는다.

## 11. 금지 패턴

- 실제 owner route 무시한 새 IA.
- 같은 데이터를 Home과 Settings에서 다른 source로 판정.
- 연결됨을 게시 가능 또는 실제 게시 성공으로 표현.
- draft body 없는 load와 publish.
- per-channel Create, per-channel Calendar.
- Admin 10-tab future console.
- 12개 코드 정의를 근거 없이 14개로 확장.
- inline style, 임의 spacing, 11px 이하 type.
- fixed text column에서 `nowrap + clip`.
- card-in-card 장식, gradient decoration, blob, emoji-only icon.
- em dash, en dash.

## 12. Design review

실호출 design-review 도구는 현재 세션에 노출되지 않았다. 동일 rubric의 정적 검사를 수행했다.

| dimension | score | evidence |
|---|---|---|
| hierarchy | A | Home 한 블록, R-06 current/target 분리 |
| layout | A- | 주축과 column 수 명시, actual render 미검증 |
| typography | A | 6 sizes, 12px floor, inline style 0 |
| color | A- | semantic tokens 유지, computed contrast 미검증 |
| states | A- | empty/loading/error/excess 계약, browser interaction 미검증 |
| responsive | B | CSS 계약 있음, 390/1024/1440 visual 미검증 |
| implementation readiness | A | actual route와 component owner 명시 |

Design Score: B+ static candidate.

AI Slop Score: A-.

## 13. Red team과 셀프심문

Red team 공격: 경쟁자는 “정책과 퍼널을 Home에 얹어 운영 화면을 다시 복잡하게 만들었다”고 공격할 수 있다.

수정: R-06은 운영 성과 블록과 분리하고 `설계 목표`, `현재 Home 코드에는 미구현`을 고정 표시했다. 구현으로 자동 승격하지 않는다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 R02의 14개 credential form과 현재 코드의 12개 정의가 서로 다른 배포 시점을 가리키기 때문이다. v24는 실제 코드에 없는 두 provider를 만들지 않고 회수 항목으로 남긴다.

## 14. 회수 필요

- R02의 Admin 14개와 현재 `OAUTH_CREDENTIAL_DEFINITIONS` 12개의 차이. 14개가 목표라면 provider 두 개와 credential 방식의 plan 결정을 다시 열어야 한다.
- R-06 요약을 실제 Home 구현에 넣는 범위는 design 승인 뒤 eng-design에서 합의해야 한다.
- 결과 파일 open 금지로 1440, 1024, 390과 light/dark 실제 렌더는 미검증.
- computed contrast, focus, target size, overflow는 브라우저 QA가 필요하다.

SOURCES: `docs/prototype/v24-brief.md` | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html` | `docs/audit/v23-codex-crosscheck.md` | `docs/audit/r02-journey-plan/r02-journey-fix-plan-v1-opus.html` | `dashboard/src` | `wiki/product/positioning.md` | `wiki/reference/channel-status.md` | https://help.later.com/hc/en-us/articles/360043244733-Add-Remove-Transfer-Social-Profiles-in-Later | https://help.later.com/hc/en-us/articles/29780709560343-Third-Party-Partner-Data-Safety-Compliance | https://help.metricool.com/api-limitations-per-social-network-n7zlr | https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits | https://www.w3.org/WAI/WCAG22/Understanding/reflow.html | https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack browse workflow를 전 화면 console·click 감사 설계에 사용

SKILLS_SKIPPED: gstack design-review 실호출은 현재 도구 목록에 없어 동일 rubric을 수동 적용. 실제 Chrome은 sandbox 권한 차단

## 15. v24.1 런타임·토큰 하드닝

> STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer | skills=gstack browse workflow | evidence=v24 prototype, dashboard/src, jsdom 26 routes | deliberation=빈 화면을 만드는 참조 오류와 렌더를 왜곡하는 HTML·token 결함을 분리해 제거

변경 범위는 v24 prototype의 런타임과 디자인 시스템 정합뿐이다. 실제 `dashboard/src`의 route, component, token 구조는 바꾸지 않았다.

- 렌더 helper와 상태 참조를 전수 확인했다. `channelStatusChip`은 모든 상태에 fallback을 갖는다.
- 문자열 template의 중복 `class` 속성을 0으로 만들었다. 같은 요소의 layout class와 spacing utility는 단일 속성에서 합성한다.
- `status warn`을 기존 semantic class인 `status warning`으로 교정했다.
- `--lh-h3:28px`를 정의해 `20/28` typography token을 완결했다. v24 caption은 기존 `12/18` token을 사용한다.
- spacing source는 `4, 8, 12, 16, 24, 32, 48`로 유지했다. 새 임의 px spacing은 추가하지 않았다.

검증 결과:

| 검증 | 결과 | 증거 등급 |
|---|---|---|
| 26개 route render | 26/26, 빈 root 0 | 테스트됨, jsdom |
| 상태·전환·탭 | 172/172 | 테스트됨, jsdom |
| 고유 `data-action` 실제 click | 60/60 | 테스트됨, jsdom |
| runtime error | 0 | 테스트됨, jsdom |
| 중복 `class` 속성 | 0 | 테스트됨, source audit |
| 미정의 CSS custom property | 0 | 테스트됨, source audit |
| 실제 Chrome console | 미검증 | sandbox가 localhost/CDP 차단 |
| 1440·1024·390 overflow와 줄바꿈 | 미검증 | 실제 Chrome 필요 |

Design Score는 **B+ 후보**로 유지한다. DOM 런타임이 통과했어도 실제 3개 viewport를 보지 않았으므로 responsive와 layout을 A로 올리지 않는다.

레드팀: 경쟁자는 “테스트용 API로 route를 열었을 뿐 실제 사용자가 누르는 버튼은 깨질 수 있다”고 공격할 수 있다. 그래서 DOM 감사에서 `data-route`, Settings tab, channel tab, role switch와 60개 `data-action`을 실제 `click()`으로 실행했다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 jsdom이 CSS layout과 Chrome 고유 동작을 재현하지 못하는 것이다. 실제 Chrome용 감사 스크립트에 26개 route 실제 click, 전체 action click, 1440·1024·390 overflow, console exception을 종료조건으로 고정했다.

회수 필요: coordinator가 localhost와 Chrome CDP를 사용할 수 있는 환경에서 `docs/prototype/qa-v24/v24-console-audit.mjs`를 실행해 `runtimeErrorCount=0`, `failed=[]`를 관찰해야 design gate를 열 수 있다.

SOURCES: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` | `docs/prototype/qa-v24/jsdom-audit-after.json` | `dashboard/src` | https://help.later.com/hc/en-us/articles/1500003115942-Social-Profile-Connection-Statuses | https://help.metricool.com/api-limitations-per-social-network-n7zlr

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack browse workflow를 console, click, viewport 감사 설계에 사용

SKILLS_SKIPPED: gstack design-review 실호출은 현재 도구 목록에 없어 동일 rubric을 수동 적용. 실제 Chrome은 sandbox 권한 차단

# Marketing Agent 디자인 시스템 v24.2: 1인 운영자 예외 우선 콘솔

> STAMP: created_at=2026-08-15 18:18 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-review 등록 호출 불가, design.md rubric 정적 review | evidence=user-flow v9.1, 제품구조 3.7·3.95, current operator code, Buffer·Stitch Fix·Spotify·OpenAI official UX | deliberation=기존 Admin 고객 관리와 OAuth를 보존하고 미확인 장애를 첫 결정으로 올림

## v24.2 권위와 변경 범위

v24.2는 v24·v24.1의 고객 셸, 운영자 셸, semantic color, typography, spacing, shape를 모두 상속한다. 새 토큰은 0개다. 신규 범위는 `docs/design-docs/user-flow-openclaw-service-v9.1-gpt-codex.md`의 O-00부터 O-12 운영 화면이다.

기존 보존:

- `Admin` 전용 224 sidebar와 customer shell 분리
- 고객·워크스페이스 요약, 정지·재개, 공유 AI 승인·회수
- 중앙 OAuth provider accordion, 마스킹, 30초 원문 확인, 전체 세트 저장
- `bg`, `surface`, `surface-2`, `border`, `text`, `muted`, `subtle`, `accent`, `success`, `warning`, `danger`
- typography 12·13·15·17·20·24, spacing 4·8·12·16·24·32·48, radius 8·12·full

## 브랜드 형용사 3개와 운영 화면 발현

| 형용사 | 운영 화면 발현 |
|---|---|
| 정직한 | 마지막 계산 시각, 데이터 지연, 기준 미설정, unknown을 숨기지 않음 |
| 통제되는 | 확인과 해결을 분리하고, 재시도·잔액 조정 전에 영향과 전후 상태 확인 |
| 증거 중심 | 알람, 고객, 요청, 원장, 지원, 정상 회복 근거를 하나의 사건 타임라인으로 연결 |

## 정보 위계 계약

운영 홈의 우선순위는 `미확인 치명·높음 장애 -> 오늘 기한 초과 지원·과금 -> 원가·큐 위험 -> 유저 막힘 -> 정상 지표`다. 정상 가입자·발행 총량은 미확인 치명 장애보다 위에 올리지 않는다.

전역 위험은 두 위치에 동시에 나타난다.

1. 운영자 sidebar의 `미확인 N` 배지
2. O-00 첫 접힘선의 `OperatorAlertRail`

두 위치는 같은 사건 소스를 읽어야 한다. 배지는 색만 쓰지 않고 심각도 텍스트와 마지막 감지 시각을 포함한다.

## Component inventory 추가

| component | purpose | mandatory states |
|---|---|---|
| `OperatorAlertRail` | 미확인 장애와 가장 오래된 사건을 운영 홈 첫 결정으로 노출 | empty, loading, error, critical, warning |
| `AlertRow` | 종류, 심각도, 영향, 최초·최근 시각, 다음 행동 표시 | unseen, acknowledged, active, watching, resolved, false-positive |
| `IncidentTimeline` | 감지·확인·조치·관찰·해결 확인을 최신순 표시 | empty, loading, error, excess |
| `IncidentActionRail` | 안전한 상태 조회, 재연결, 지원, 고객 알림 등 한 번의 주요 행동 | enabled, disabled-with-reason, loading, error |
| `TenantRiskSummary` | 한 테넌트의 연결·발행·과금·지원 위험 집계 | normal, warning, critical, unknown |
| `BalanceLedger` | 잔액, 보류, 차감, 환불, 수동 조정의 감사 원장 | empty, loading, error, excess |
| `BalanceAdjustmentReview` | 조정 전후, 고객용·내부 사유, 관련 증거 확인 | draft, invalid, submitting, uncertain, confirmed |
| `UsageCostBreakdown` | 고객 크레딧과 공급자 원가를 분리해 drill-down | empty, loading, error, stale, excess |
| `BlockageFunnel` | 질문·연결·생성·편집·발행별 이탈·오류·정상 종료 분리 | empty, loading, error, insufficient-sample |
| `OperationsLoopTable` | 제작 방식·실패 프롬프트·재시도·선택·성과 집계 | empty, loading, error, hypothesis, evidenced |
| `SupportInboxRow` | 상태, 기한, 고객, 영향, 다음 행동 표시 | new, active, waiting-customer, overdue, resolved |
| `SupportThread` | 고객 메시지와 시스템 사실, 복구·환불 분기 연결 | empty, loading, send-error, excess |

기존 `Panel`, `Notice`, `StatusBadge`, `Button`, `Field`, `Stack`, table/list primitive로 조합한다. 카드 안 카드, 별도 gradient, 신규 radius를 만들지 않는다.

## 상태 계약 추가

| state | meaning | allowed action |
|---|---|---|
| unseen | 운영자가 아직 열지 않은 사건 | 상세 열기 |
| acknowledged | 사실을 확인했지만 해결 전 | 처리 시작, 관찰 전환 |
| active | 조치 중 | 안전한 다음 행동, 지원 연결 |
| watching | 조치 뒤 정상 회복을 기다림 | 상태 재조회, 추가 조치 |
| resolved | 정상 신호와 확인 시각이 있음 | 타임라인·근거 보기 |
| false-positive | 오탐 사유와 근거가 있음 | 다시 열기 |
| stale | 집계 신선도 기준을 넘김 | 새로 계산 |
| uncertain | 금전·외부 게시 처리 결과가 불명 | 상태 조회만, 중복 실행 금지 |

`acknowledged`를 success 색으로 표시하지 않는다. `resolved`에만 success를 쓴다. `uncertain`은 warning이며 자동 재실행을 금지한다.

## Layout 계약 추가

| viewport | O-00 | O-02/O-04 | O-10/O-11 |
|---|---|---|---|
| 1440·1024 | 위험 8 + 오늘 할 일 4 | 본문 8 + 조치 4 | 요청 5 + 상세 7 |
| 390 | 위험, 오늘 할 일, 정상 지표 1열 | 사실, 보존, 행동, 근거 1열 | 목록과 상세를 별도 화면으로 전환 |

- 운영 테이블은 1024에서 12열 콘텐츠 시작선을 맞춘다.
- 390에서는 고객·알람·원장 행을 카드 행으로 reflow한다.
- sticky 행동 영역은 마지막 콘텐츠를 가리지 않게 16px 안전 여백을 둔다.
- 내부 ID·URL은 `overflow-wrap:anywhere`, 전체 복사 행동을 제공한다.
- 50개 알람, 200개 테넌트, 1,000개 원장 행은 필터·페이지·점진 공개를 사용한다.

## 알람 시각 계약

| severity | token | label rule |
|---|---|---|
| 치명 | danger | `치명` 텍스트 + 영향 + 최초 감지 시각 |
| 높음 | danger 또는 warning | `높음` 텍스트 + 고객·채널 범위 |
| 주의 | warning | 기한·임박 시간 + 예방 행동 |
| 정보 | subtle | 회복·관찰 사실, 기본 접힘 |

숫자 배지만 단독 사용하지 않는다. 치명 알람은 `모두 읽음`으로 일괄 해제할 수 없다. 같은 근본원인의 반복 이벤트는 사건 한 행에 횟수와 최초·최근 시각으로 묶는다.

## 과금 조정 의도된 마찰

`BalanceAdjustmentReview`는 다음 순서를 바꿀 수 없다.

1. 조정 유형
2. 금액 또는 크레딧
3. 관련 작업·결제·지원 증거
4. 고객용 사유와 내부 사유
5. 전후 잔액
6. 실행 확인
7. 원장·감사 ID

처리 결과가 `uncertain`이면 잔액을 다시 조정하지 않고 원장 상태를 조회한다. 환불 가능 범위와 권한은 product·eng-design 결정 전 UI 카피로 약속하지 않는다.

## 질문 엔진 pattern 추가

고객 질문 화면은 `ChoiceQuestion` pattern을 공유한다.

1. 3개에서 5개 선택지
2. 추천 배지와 한 줄 결과
3. 근거 유형과 시점
4. `다른 생각 적기` 보조 행동
5. 목적·비용·정책 충돌 시 반박과 대안

자유입력은 선택지보다 큰 면적·강한 색을 쓰지 않는다. 직접 입력 뒤에도 해석 후보와 추천을 다시 제시한다.

## 금지 패턴 추가

- 정상 지표가 미확인 치명 장애보다 위에 있는 운영 홈
- 알람 메뉴를 열어야만 장애를 알 수 있는 구조
- 확인함을 해결됨으로 표시
- 외부 게시 unknown 뒤 자동 재발행
- 연결 복구 뒤 실패 게시물 자동 재시도
- 잔액 조정 전후와 감사 ID 없는 성공 토스트
- 고객 크레딧과 공급자 원가를 한 숫자로 합침
- 이탈, 저장 종료, 오류를 한 `중단` 지표로 합침
- 고객 메시지와 시스템 사실을 같은 말풍선 스타일로 표현
- 1인 운영 콘솔에 무의미한 팀 배정·권한 장식 추가

## v24.2 Design review

| dimension | score | evidence |
|---|---|---|
| hierarchy | A- | 장애·기한·손실·막힘·정상 순서 고정 |
| consistency | A | v24 token·shell·primitive 전량 상속, 신규 token 0 |
| states | A- | 알람 6상태, stale·uncertain, 금전·게시 중복 방지 |
| responsive | B+ | 390·1024·1440 주축과 reflow 정의, 실제 렌더 미검증 |
| implementation readiness | B+ | component·상태·overflow 계약, 데이터 원장·임계값 미설계 |

**Design Score: B+ static candidate.** 등록 `design-review` Skill 실호출과 prototype 픽셀 검증은 미충족이다.

## v24.2 레드팀과 셀프심문

레드팀 공격: 운영 컴포넌트를 12개 추가하면 기존 단일 고객 관리 화면보다 복잡해져 1인 운영자가 더 느려질 수 있다.

수정: O-00 첫 접힘선은 위험·기한·금전·건강 네 블록으로 제한하고, 나머지는 사건·고객 상세로 점진 공개한다. 신규 메뉴를 모두 순회하지 않아도 전역 위험 배지와 `OperatorAlertRail`에서 첫 행동이 보인다.

셀프심문: 이 계약이 틀렸다면 가장 그럴듯한 이유는 사건·임계값·원가·지원 원장이 없어 화면만 정확해 보이는 것이다. 그래서 모든 집계 컴포넌트에 데이터 시각, 기준 미설정, stale, insufficient-sample 상태를 넣고, 원장 없는 기능은 구현 완료처럼 보이지 않게 한다.

SOURCES: `docs/design-docs/user-flow-openclaw-service-v9.1-gpt-codex.md` | `docs/제품구조-결정-2026-08-15.md` 3.7·3.95 | `dashboard/src/app/operator/customers/page.tsx` | `dashboard/src/components/layout/Sidebar.tsx` | `docs/prototype/qa-v22/v22-operator-1024.png` | https://support.buffer.com/en-us/articles/best-practices-for-keeping-your-social-channels-connected-UgsmoudZJj | https://support.buffer.com/en-us/articles/refreshing-a-channel-in-buffer-7oDS4jk7l1 | https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-free-go-plus-pro-sora | https://help.openai.com/en/articles/12289294-global-admin-console | https://multithreaded.stitchfix.com/blog/2016/11/30/us-design-capture-style-preferences-during-sign-up/

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 현재 Codex 등록 Skill 도구에 design-review·design-consultation이 없어 실제 호출 불가. design.md rubric 정적 review를 수행했으나 Skill 호출로 주장하지 않음.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵. openclaw-creative-brief는 제품 화면 설계와 범위가 달라 스킵.

# OpenClaw Service v16 프로토타입 v25 정합 갱신

> 🏷 STAMP | line: openclaw-service | 생성: 2026-08-16 00:12 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer
>
> skills: 제품 화면 HTML 프로토타입 전용 매칭 스킬 없음. `/Users/sj/.claude/standards/design.md`, `doc-review.md`, `benchmarks.md`, `artifact-stamp.md`를 직접 적용
>
> 근거: OpenClaw Service v16, user-flow v9.5, 제품구조 결정 §9.6·§9.7, 현재 Studio 코드, 직전 고객 프로토타입 v9, ContentStudio·Yardstick·Truffle 공식 화면 설명, 실제 Chrome 28장
>
> 고민: 390에서 후보 3개를 세로로 보여줘도 같은 비교 기준을 반복해 기억 부담을 줄이고, 상태·화면 선택기가 실제 콘텐츠를 가리지 않게 프로토타입 검수 chrome을 별도 점유 행으로 분리했다.

## 1. 권위와 범위

이 절은 `OpenClaw Service 디자인 시스템 v16`의 토큰·컴포넌트·상태 계약을 prototype v25의 실제 렌더에 맞춰 최신화한다. v16 본문을 대체하지 않으며, 신규 color·typography·spacing·radius token은 0개다.

prototype v25는 다음 파일이다.

- `docs/prototype/openclaw-auto-osmu-v25-gpt-codex.html`
- `docs/prototype/qa-v25/`의 390·1024 라이트·다크 캡처와 QA 보고서

제품 코드, API 계약, DB 스키마, 비용 계산 로직, 배포 상태는 변경하지 않았다. 화면에 사용한 비용과 시간은 프로토타입 예시 범위이며 실제 견적 계약이 아니다.

## 2. 브랜드 형용사 3개와 실제 화면 발현

| 형용사 | prototype v25 발현 |
|---|---|
| 차분한 | 첫 화면은 타깃 시장과 출력 언어 두 입력만 확장하고 추천 조합 1개를 우측 또는 다음 블록에 둔다. 화면당 주 행동은 1개다. |
| 근거 있는 | 추천, 후보, 발행, 취향, 운영 사건에 출처 유형, 확인 시각, 비용 범위, 소요 시간, 실제 사용 또는 보존 상태를 붙인다. |
| 통제 가능한 | 후보 선택과 고해상도 제작, 무료 편집과 유료 재생성, 승인 발행과 자율 발행, 언어별 취향을 서로 다른 행동으로 분리한다. |

## 3. 토큰 정합

prototype v25는 v16의 다음 토큰만 사용한다.

- color: `bg`, `surface`, `surface-2`, `border`, `text`, `muted`, `subtle`, `accent`, `accent-hover`, `accent-fg`, `accent-soft`, `success`, `warning`, `danger`
- typography: 12/18, 13/20, 15/24, 17/26, 20/28, 24/32
- spacing: 4, 8, 12, 16, 24, 32, 48
- shape: control 8, panel 12, pill full
- interaction: 최소 44px, focus 3px와 offset 2px, fast 120ms, base 200ms 이하

추천과 선택은 accent를 사용한다. success는 고해상도 제작 완료, 발행 준비 확인, 언어 검수 완료처럼 확인된 사건에만 사용한다. warning은 추가 과금, 승인 대기, 자율 발행 영향, 운영 예외에만 사용한다.

## 4. 실제 화면과 컴포넌트 조합

| prototype 화면 | v16 화면·컴포넌트 | 실제 조합 | 주축·열수 |
|---|---|---|---|
| 제작 요청 | ML-01, `MarketLanguagePair`, `RecommendationEvidenceCard` | 타깃 시장 4개, 출력 언어 4개, 추천·근거·비용·시간 | 1024 grid 7+5, 390 column 1 |
| 질문 3개 | RQ-02·RQ-03, `RecommendationEvidenceCard` | 질문 진행 1/3부터 3/3, 추천 1개, 건너뛰기, 직접 선택 | 1024 grid 7+5, 390 column 1 |
| 후보 비교 | LC-01, `LowResolutionCandidateComparison`, `CandidateCostDisclosure` | 동일 순서 후보 A·B·C, 비용·시간, 선택본 단일 고해상도, 미선택 추가 과금 | 1024 grid 3, 390 column 1 |
| 결과 편집 | LC-04·E-01, 기존 편집 drawer 계약 | 고해상도 결과, 자막 크기, 컷 순서, 나레이션·소재 변경 견적 | 1024 grid 5+7, 390 column 1 |
| 발행 설정 | M-01·V-02·P-04, `EffectiveModeBadge` 계승 | 승인 후 발행 기본, 자율 발행 toggle, 연결 계정, 예약 시각, 실제 사용 | 1024 grid 8+4, 390 column 1 |
| 언어별 취향 | PF-01, `LanguagePreferenceState` | 한국어·English·日本語·ไทย 탭, 선호·금지·근거·범위·사람이 읽는 diff | 1024 grid main+rail, 390 column 1 |
| 운영 예외함 | OP-01부터 OP-06, `OperatorExceptionSurface` | 잔액·실패·큐·토큰 만료·고객 막힘·환불 근거만 | 1024 column과 3개 사건 수치, 390 column 1 |

## 5. v25 신규 조합 패턴

### 5.1 `PrototypeControlBar`

화면과 데이터 상태를 바꾸는 프로토타입 검수 chrome이다. 제품 UI가 아니며 구현 backlog에 포함하지 않는다.

- 화면: 제작 요청, 질문 3개, 후보 비교, 결과 편집, 발행 설정, 언어별 취향, 운영 예외함
- 상태: 데이터 채움, loading, empty, error, overflow
- 위치: topbar 아래의 점유형 sticky 행
- 금지: viewport 위에 fixed overlay로 띄워 본문 CTA·카피를 가리는 방식
- 390: 화면 선택과 상태 선택을 양끝에 두고 둘 다 44px 이상 유지

첫 실제 캡처에서 fixed overlay가 추천 카드, 근거 행, 편집 버튼을 가리는 결함을 관찰했다. 점유형 상단 행으로 바꾼 뒤 28개 캡처에서 본문 가림 0으로 재확인했다.

### 5.2 `AlignedCandidateCard`

세 후보는 이미지 비율, 방향 라벨, 차이 제목, 시장 근거, 비용, 시간, 선택 CTA의 순서와 시작선을 공유한다. Yardstick의 동일 기준 side-by-side 구조만 차용하고 점수·등급은 사용하지 않는다.

- desktop: 정확히 3열, A -> B -> C
- mobile: 정확히 1열, A -> B -> C
- mobile 비교 보조: 각 카드에 동일 label과 비용·시간을 반복
- 선택: accent border와 `선택됨` 텍스트를 함께 사용
- 금지: 추천 후보를 DOM 첫 순서로 이동, 근거 없는 점수, 미선택 후보 선제 고해상도 제작

### 5.3 `EditCostBoundary`

편집 행동은 비용 경계로 두 묶음만 사용한다.

| 묶음 | 행동 | 표현 |
|---|---|---|
| 추가 크레딧 없음 | 자막 크기, 컷 순서 | success가 아니라 사실 label과 무료 조정 badge. 저장 전 diff 유지 |
| 추가 크레딧 발생 가능 | 나레이션 변경, 소재 교체 | warning label, 예상 비용 범위, 예상 시간, `견적 보기` |

무료 행동과 유료 행동을 같은 button group에 섞지 않는다. 실제 차감은 별도 견적 동의 전 시작하지 않는다.

### 5.4 `PublishModeDecision`

승인 후 발행은 선택 카드가 아니라 기본 적용 상태다. 자율 발행은 별도 toggle과 영향 설명을 가진다.

- 기본: 승인 후 발행, 현재 적용 badge
- 옵션: 자율 발행 toggle off
- on 상태: 채널, 계정, 출력 언어 품질 범위, 실패 시 승인 대기함 이동을 같은 화면에 표시
- 비보증 출력 언어의 검수 미완료 결과는 toggle on이어도 승인 대기함으로 이동
- toggle 활성은 성공 사건이 아니므로 success 색을 사용하지 않는다

### 5.5 `ReadablePreferenceDiff`

언어별 취향은 원시 event나 vector가 아니라 사람이 읽는 네 항목과 문장 diff로 보여준다.

1. 선호
2. 피해야 할 표현
3. 학습 근거
4. 적용 범위
5. 삭제·추가 문장 diff와 수정 이유

출력 언어가 바뀌면 해당 언어 profile만 다시 렌더한다. 전역 profile로 합치지 않는다.

### 5.6 `ExceptionOnlyOperatorWorkbench`

운영자 화면의 상단 수치는 예외 복구에 필요한 현재 조치 수, 보존된 작업 수, 가장 오래된 사건 시간만 허용한다. 그래프, 성장률, 매출 예측, 코호트, 채널 성과, 퍼널은 0개다.

## 6. 데이터량과 상태 렌더

모든 7개 화면은 상태 선택기에서 다음을 실제 렌더한다.

| 상태 | 실제 표현 | 종료·복구 |
|---|---|---|
| 정상 | 한국어 도메인 예시, 실제 범위형 금액·시간, 확인 시각, 계정, revision | 다음 화면, 수정, 저장 |
| loading | 대상이 명명된 skeleton 3줄과 보존 안내 | 기다리기, 이전 화면 |
| empty | 빈 대상 명명, 안전 기본값, 첫 행동 | 기본값 채우기, 이전 화면 |
| error | 실패한 것, 보존된 것, 다시 확인 | 재시도, 저장 후 종료 |
| overflow | 60자 시장, 다국어 요청, 근거 30건, 자막 50줄, 취향 100건 예시 | 상위 3건, 전체 보기, 검색·필터 계약 |

실제 Chrome 감사에서 7화면 × 5상태 × 2테마 × 2폭, 총 140조합의 page horizontal overflow는 0건이었다.

## 7. 벤치마크 적용

| 조사 URL | 확인한 사실 | 차용 | 비차용·변경 |
|---|---|---|---|
| https://docs.contentstudio.io/article/1183-navigating-the-dashboard | 제작, 브랜드 지식, 발행, 실패·부분 발행을 한 workspace 안에서 owner surface로 연결 | 기존 Studio shell과 제작·브랜드·발행의 연속성 | 범용 성과 dashboard와 AI chat 중심 구조는 사용하지 않음 |
| https://contentstudio.io/blog/contentstudio-home | AI Studio와 Brand Knowledge를 분리된 기능으로 설명하며 한 작업 공간에서 연결 | 브랜드 기준과 요청 입력을 분리하되 지속 context로 연결 | `One Click` 카피와 근거 없는 속도·성과 표현은 금지 규칙 때문에 비차용 |
| https://yardstick.team/compare-candidates | 동일 기준을 같은 열에 정렬해 side-by-side로 비교하고 최종 결정은 사람에게 둠 | 후보 A·B·C의 같은 정보 순서와 정렬선, 사용자의 명시 선택 | 인사 점수, 평균 대비, heatmap은 도메인과 근거가 달라 비차용 |
| https://www.hiretruffle.com/pricing | 크레딧 단위, 결과가 생길 때의 차감, 추가 사용 가격을 행동 전에 설명 | 비용 범위와 추가 과금의 사전 공개, 무료 편집과 유료 재생성 분리 | 타사 단가와 플랜 수치는 차용하지 않음 |

## 8. 픽셀 QA와 design review

실제 Chrome에서 2026-08-16 00:18 KST 기준 다음을 관찰했다.

- 7개 화면 × 라이트·다크 × 390·1024, 스크린샷 28장
- 7개 화면 × 데이터량 5상태 × 라이트·다크 × 390·1024, 런타임 감사 140건
- console error와 runtime exception 0건
- page horizontal overflow 0건
- 44px 미만 조작부 0건
- 첫 캡처 결함 2건: fixed 검수 bar의 본문 가림, `큐` 탭 폭 39px
- 수정 뒤 재캡처: 본문 가림 0, `큐` 탭 44px 이상, 기존 140조합 회귀 0

| 영역 | 의도 | 실제 픽셀 | 판정 |
|---|---|---|---|
| 공통 shell | 기존 224 sidebar, flat surface, blue accent, 390 상단 메뉴 | 1024는 sidebar와 content 시작선 유지, 390은 sidebar 없이 상단 2행 | PASS |
| 제작 요청 | 7+5와 1열, 추천 1개, 두 입력 분리 | 1024 입력과 추천 병렬, 390 입력 뒤 추천, CTA 가림 없음 | PASS |
| 질문 | 추천 우선, 3개 상한, 건너뛰기 | 진행 1/3부터 3/3과 추천 카드, 390 단일 열 | PASS |
| 후보 비교 | 3열·1열, 동일 비교 기준, 비용 고지 | 1024 A·B·C 정렬, 390 A->B->C, 고지 2개 분리 | PASS |
| 편집 | 무료·유료 경계, 결과 preview | 1024 preview+editor, 390 preview->무료->유료, 버튼 줄깨짐 없음 | PASS |
| 발행 | 승인 기본과 자율 옵션 분리 | 기본 카드와 toggle 분리, 결과·실비·계정·시각 readback | PASS |
| 취향 | 언어별 profile과 readable diff | 4개 언어 탭, 1024 rail, 390 세로 diff, dark 대비 유지 | PASS |
| 운영 | 예외 6개만, chart 0 | 6탭, 복구 사건, 최소 수치 3개, BI 비범위 notice | PASS |

**Design Score: A- prototype candidate.** hierarchy A-, consistency A, state completeness A, responsive A-, accessibility A-, visual polish B+. 기존 Studio의 실사 미리보기 수준보다 후보 visual이 추상적이므로 A 또는 A+로 올리지 않는다.

## 9. 레드팀과 셀프심문

### 9.1 까다로운 고객의 공격

공격: 화면이 비용을 많이 설명하지만 실제 차감값과 범위가 달라지면 오히려 신뢰를 잃는다.

수정: 첫 화면과 후보는 `예상 비용 범위`, 결과와 발행은 `실제 사용`으로 용어를 분리했다. 변경 행동에는 새 견적 보기를 두고, 이번 예시 수치를 실제 가격 계약으로 승계하지 않는다고 명시했다.

### 9.2 경쟁자의 공격

공격: 후보 3개 카드가 세로로 길고 시각 자산이 단순해 AI creative studio로서 매력이 부족하다.

수정: 비교 기준과 비용 통제가 One Thing이므로 미디어를 과장하지 않았다. A·B·C의 톤을 semantic surface로 구분하고 동일 기준 정렬을 우선했다. 실제 studio-service가 만드는 저해상도 실물이 생기면 flat placeholder를 그 결과로 교체해야 한다.

### 9.3 1인 운영자의 공격

공격: 운영 화면에 사건 수치 3개와 탭 6개도 많다.

수정: 현재 조치, 보존된 작업, 가장 오래된 사건만 남기고 나머지 metric과 모든 chart를 제거했다. 390에서 탭은 내부 scroll을 사용하며 page overflow를 만들지 않는다.

### 9.4 셀프심문

질문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 무엇인가?

답: 가장 load-bearing한 가정은 같은 label을 반복하면 390에서 후보 A·B·C를 세로로 비교해도 기억 부담이 감당 가능하다는 것이다. 실제 고객은 카드 A를 다시 보려고 긴 거리를 스크롤할 수 있다.

수정: 각 카드의 정보 순서를 고정하고 비용·시간을 같은 위치에 반복했으며, 선택 확인으로 이어지는 CTA에 선택 후보 이름을 다시 썼다. 단, sticky comparison tray는 현재 캡처에서 화면을 가릴 위험이 커 추가하지 않았다. 사용자 과제에서 비교 왕복이 반복되면 점유형 축약 tray를 다음 디자인 루프에서 검토한다.

## 10. 회수 필요와 다음 공정

- ⛔ 회수 필요: 저해상도 후보의 실제 미디어, 정확한 픽셀·길이·파일 크기는 실물 실험 전 미검증이다.
- ⛔ 회수 필요: 예상 비용 범위와 예상 소요 시간의 계산 계약은 studio-service 기술설계가 필요하다.
- ⛔ 회수 필요: 자율 발행의 채널·언어·검수별 허용 정책과 실패 보상은 제품·기술·운영 합의가 필요하다.
- ⛔ 회수 필요: prototype의 `PrototypeControlBar`는 QA chrome이며 제품 구현 범위가 아니다.

디자인 스테이지의 prototype v25와 실제 렌더 QA는 수행됐다. 기술설계 진입은 독립 디자인 리뷰와 회장 승인 뒤에만 가능하다.

RUBRIC_SCORE: completeness=5/5 precision=5/5 benchmark=5/5 traceability=5/5 professionalism=5/5 total=25/25

WEAKEST_LINE: `같은 label 반복으로 390 후보 비교의 기억 부담을 관리할 수 있다.` 실제 사용자 과제 전까지는 검증되지 않은 디자인 가정이다.

SOURCES: `DESIGN.md` OpenClaw Service v16 | `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` | `docs/제품구조-결정-2026-08-15.md` §9.6·§9.7 | `docs/구현현황.md` | `dashboard/src/app/studio/page.tsx` | `dashboard/src/components/studio/PlatformPreview.tsx` | `dashboard/src/app/globals.css` | `docs/prototype/openclaw-auto-osmu-customer-product-v9-gpt-codex.html` | `docs/prototype/qa-v25/runtime-audit-v25.json` | https://docs.contentstudio.io/article/1183-navigating-the-dashboard | https://contentstudio.io/blog/contentstudio-home | https://yardstick.team/compare-candidates | https://www.hiretruffle.com/pricing

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 설치된 스킬 중 기존 제품 토큰을 상속해 code-native HTML 제품 화면을 만드는 전용 매칭 스킬이 없었다. 디자인·문서 품질헌법을 직접 적용했다.

SKILLS_SKIPPED: `imagegen`은 bitmap 생성·편집이 아니라 기존 HTML·CSS 디자인 시스템을 계승한 code-native 프로토타입이므로 스킵했다. `openclaw-creative-brief`는 자동 생성 에이전트 브리프가 아니라 제품 화면 과제라 스킵했다.

## v24.4 타깃 시장·출력 언어·후보 선택 디자인 계약

### 권위와 변경 범위

정본은 `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` 35장과 `docs/제품구조-결정-2026-08-15.md` §9.6·§9.7이다. v24.4는 기존 Studio 셸, 224 사이드바, 7채널 미리보기, Pretendard, color·typography·spacing·radius token을 바꾸지 않는다. 제작 진입, 요청 근거, 후보 선택, 언어별 피드백, 운영 예외에 필요한 component와 state만 추가한다.

### 브랜드 형용사 3개

- 차분한: 타깃 시장과 출력 언어를 질문 하나로 보여주되 추천 1개를 먼저 둔다.
- 근거 있는: 마케팅 공통 지식, 개인 취향, 브랜드 제약의 출처와 적용 이유를 구분한다.
- 통제 가능한: 저해상도 후보 3개 중 선택본만 고해상도로 만들고, 추가 과금과 발행은 명시적 동의 뒤 진행한다.

### 토큰 상속

신규 color·typography·spacing·radius token은 0개다. spacing은 `4, 8, 12, 16, 24, 32, 48`, panel padding 16, section gap 24, desktop vertical padding 32, mobile inline padding 16을 사용한다. 정보 상태는 기존 accent, success, warning, danger semantic token과 텍스트 라벨을 함께 사용한다.

### Component inventory 추가

| component | anatomy | 필수 상태 | 금지 |
|---|---|---|---|
| `MarketLanguageRequest` | 질문 1/3, 추천 1개, 타깃 시장, 출력 언어, 근거, 비용 범위, 시간 범위, 건너뛰기 | ready, empty, recommendation-error, loading, mismatch | 국기로 언어 표시, 시장과 언어를 한 값으로 합침 |
| `RecommendationBasisDrawer` | 왜 추천했나, 우리 자산, 출처, 관찰일, 한계, 적용 여부 | ready, empty, stale, error, loading | 출처 없는 사실처럼 표시 |
| `BrandConstraintOnboarding` | 금지어, 필수 고지, 로고, 톤, 승인자, 자산 | ready, empty, upload-error, loading, incomplete | 필수 제약 실패를 숨김 |
| `AssemblyLayerReview` | 타깃 시장, 마케팅 공통 지식, 개인 취향, 브랜드 제약 4카드 | ready, layer-empty, conflict, error, loading | 충돌을 조용히 합성 |
| `LanguagePreferenceState` | 출력 언어 탭, 선호, 금지, 수정 diff, 버전, 되돌리기 | ready, empty, conflict, error, loading | 다른 출력 언어 취향 동시 변경 |
| `LowResCandidateSet` | 저해상도 후보 A·B·C, 시장 적합 근거, 언어 샘플, 비용·시간 | ready-3, partial-error, total-error, loading, excess | 후보 3개 전 고해상도 제작, 2개만으로 선택 강제 |
| `SelectedUpgradeReview` | 선택본, 미선택 2개, 고해상도 비용·시간, 추가 과금 고지 | ready, quote-error, quote-loading, selection-lost | 동의 전 차감, 미선택 후보 동시 제작 |
| `SelectedHighResProgress` | 선택본 단계, 미선택 보존 상태, 취소, 재시도 | loading, success, error, cancelled, recovery | 어떤 후보를 만드는지 숨김 |
| `MultilingualFeedback` | 타깃 시장, 출력 언어, 검수자 이해 여부, 평가, 직접 수정, 반영 범위 | ready, empty, draft, save-error, loading | 전역 취향으로 합침, 검수 미완료를 완료로 표시 |
| `OperatorExceptionSurface` | 고객, 사건, 근거, 영향, 한 행동 | ready, empty, partial-error, loading | BI 차트, 성장률, 코호트, 매출 예측 |

### 상태 계약 추가

| state | 의미 | 화면 행동 |
|---|---|---|
| market-language-ready | 타깃 시장과 출력 언어가 명시적으로 확정됨 | 다음 질문 활성 |
| locale-mismatch | 타깃 시장과 출력 언어가 다른 조합 | 현지화 영향 확인 뒤 계속 |
| non-native-review | 출력 언어 생성은 가능하나 원어민 검수 미제공 | ML-01, LC-01, LC-04, V-02에 고지 |
| assembly-conflict | 개인 취향과 브랜드 제약 등 요청 층 충돌 | 브랜드 제약 우선, 미적용 이유 표시 |
| low-res-three-ready | 저해상도 후보 3개가 모두 준비됨 | 후보 선택 활성 |
| low-res-partial | 일부 저해상도 후보 실패 | 실패 후보만 재시도, 선택 확정 잠금 |
| high-res-selected-only | 선택본 하나만 고해상도 제작 중 | 미선택 두 후보는 저해상도 보존 표시 |
| extra-upgrade-consent | 미선택 후보의 추가 고해상도 요청 | 추가 비용·시간 확인 뒤 동의 |
| language-preference-updated | 현재 출력 언어 취향만 새 버전으로 저장 | 다른 언어 미변경 readback |
| review-incomplete | 출력 언어를 이해하는 검수자가 없음 | 자율 발행 금지, 승인 대기 이동 |

### Layout·overflow 계약

- 1024 `MarketLanguageRequest`: flex-row, 입력 7열·추천 근거 5열. 순서는 추천, 타깃 시장, 출력 언어, 품질 고지, CTA다.
- 390 `MarketLanguageRequest`: flex-column 1열. 같은 순서를 유지하며 타깃 시장과 출력 언어를 탭이나 가로 스크롤로 숨기지 않는다.
- 1024 `LowResCandidateSet`: grid 3열 A, B, C. 세 카드의 제목, 미리보기, 비용, CTA 정렬선을 맞춘다.
- 390 `LowResCandidateSet`: flex-column 1열 A, B, C. 가로 스와이프로 후보를 숨기지 않는다.
- `AssemblyLayerReview`: 1024 grid 2열, 390 flex-column 1열. 순서는 타깃 시장, 마케팅 공통 지식, 개인 취향, 브랜드 제약이다.
- 긴 시장명·언어명, 200자 카피, 자막 50줄, 근거 30건, 취향 이력 100건은 줄바꿈·접기·검색·페이지로 수용한다. 페이지 가로 넘침은 0이다.
- 데이터량 0은 기본 추천 또는 첫 행동, 정상은 핵심 정보 전개, 과다는 요약+더 보기다. skeleton은 실제 card geometry와 같아야 한다.

### 금지 패턴 추가

- 제작 첫 화면에서 타깃 시장 또는 출력 언어를 숨은 기본값으로 확정
- 국기, 국가 코드, IP 추정으로 출력 언어를 대신 결정
- 타깃 시장과 출력 언어가 다른 조합을 오류로 차단
- 마케팅 공통 지식, 개인 취향, 브랜드 제약의 출처를 하나의 `AI 추천`으로 합침
- 출력 언어별 개인 취향을 전역 취향 하나로 병합
- 저해상도 후보가 3개 준비되기 전에 선택 확정
- 저해상도 후보 3개를 모두 고해상도로 선제 제작
- 미선택 후보의 추가 고해상도 비용을 결과 화면 뒤에 숨김
- 비보증 출력 언어의 검수 미완료 결과를 자율 발행
- 운영자 화면에 잔액·실패·큐·토큰 만료·고객 막힘·환불 근거 밖의 BI 지표 추가

### v24.4 UX 근거

- [USWDS 언어 선택](https://designsystem.digital.gov/patterns/select-a-language/two-languages/)의 원어 이름, 일관된 위치, 국기 금지 원칙을 출력 언어 선택에 적용했다.
- [Shopify 국가·언어 UX](https://shopify.dev/docs/storefronts/themes/markets/country-language-ux)의 두 선택기 인접 배치를 차용하되, 우리 제품에서는 매 요청 파라미터로 확인한다.
- [Adobe Firefly Fast mode](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/use-fast-mode-for-quick-image-generations.html)와 [Shape of AI Draft Mode](https://www.shapeof.ai/patterns/draft-mode)의 비교 초안, 비용 tradeoff, final로의 파라미터 보존을 저해상도 3개와 선택본 단일 고해상도 계약으로 제한했다.

### v24.4 Design review

| dimension | score | evidence |
|---|---|---|
| hierarchy | A- | 추천 1개, 시장·언어, 4층, 후보 선택, 제작 순서가 분리됨 |
| consistency | A | 기존 token·shell 전량 상속, 신규 token 0 |
| states | A | happy·empty·error·loading과 partial·conflict·consent 정의 |
| responsive | B+ | 390·1024 축·열·순서·과다 상태 명시, 실제 렌더 미검증 |
| trust | A | 출력 언어 검수 범위, 추가 과금, 발행 승인을 사전 고지 |
| implementation readiness | B+ | component·state·layout 계약 완성, 실제 견적·해상도 수치 미확정 |

**Design Score: B+ static candidate.** 실제 390·1024 프로토타입과 데이터량 0·정상·과다 픽셀 QA는 다음 디자인 루프에서 검증한다.

### v24.4 레드팀과 셀프심문

레드팀 공격: 시장, 언어, 근거, 취향, 브랜드 제약을 첫 제작에 모두 보여주면 초보 사용자가 설정 제품으로 오해할 수 있다.

수정: 질문은 3개로 제한하고 추천 1개를 항상 먼저 둔다. 요청 조립 4층은 AS-01에서 결과에 미치는 영향만 요약하며 세부 출처는 서랍과 설정으로 보낸다.

셀프심문: 이 계약이 틀렸다면 가장 그럴듯한 이유는 390에서 저해상도 후보 3개를 세로로 비교할 때 앞 후보를 잊는 것이다. 그래서 카드 제목, 시장 적합 근거, 비용, CTA의 순서를 고정하고 선택 확인 화면에서 선택본과 미선택 두 후보를 함께 readback한다. 실제 비교 기억 부담은 프로토타입으로 검증해야 한다.

SOURCES: `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` 35장 | `docs/제품구조-결정-2026-08-15.md` §9.6·§9.7 | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `studio/docs/prd-studio-service-v1.2.1-gpt-codex.md` | `dashboard/src/app/studio/page.tsx` | https://designsystem.digital.gov/patterns/select-a-language/two-languages/ | https://shopify.dev/docs/storefronts/themes/markets/country-language-ux | https://helpx.adobe.com/firefly/web/work-with-images/generate-images/use-fast-mode-for-quick-image-generations.html | https://www.shapeof.ai/patterns/draft-mode

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 제품 디자인 시스템 개정 전용 매칭 스킬이 없어 design.md와 doc-review.md를 직접 적용했다.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵했다. openclaw-creative-brief는 제품 화면 계약과 범위가 달라 스킵했다.

# OpenClaw Service 디자인 시스템 v16

> 🏷 STAMP | line: openclaw-service | 생성: 2026-08-15 20:46 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer
>
> skills: 제품 디자인 시스템 개정 전용 매칭 스킬 없음. `/Users/sj/.claude/standards/design.md`와 `doc-review.md`의 rubric을 직접 적용
>
> 근거: DESIGN.md 지정 기준선 2,694줄, 실제 작업 시작 시 보존 중인 2,984줄, user-flow v9.5, 제품구조 결정 §9.6·§9.7, PRD v8.2.1, 현재 Studio 코드·v24 프로토타입, USWDS·Shopify·GOV.UK·Adobe Firefly·Midjourney 공식 문서
>
> 고민: 타깃 시장과 출력 언어를 한 요청에서 함께 확인시키되 한 값으로 합치지 않고, 저해상도 후보 비교가 비용 절감 장치라는 사실을 선택 전에 이해시키는 데 설계 비중을 두었다.

## v16 목차

1. v16 권위와 additive 범위
2. 기존 구현 확인과 보존 계약
3. 브랜드 형용사와 토큰 상속
4. 제작 요청 첫 화면
5. 타깃 시장·출력 언어 선택 컴포넌트
6. 요청 맥락 지속 표시
7. 추천 근거 카드
8. 요청 조립 4층 노출 규칙
9. 저해상도 후보 비교 컴포넌트
10. 상태·인터랙션·접근성 계약
11. 반응형·밀도·overflow 계약
12. 컴포넌트 인벤토리 추가
13. 금지 패턴 추가
14. 벤치마크 반영
15. 추적성·수용기준
16. 레드팀·셀프심문
17. 정적 design review
18. 회수 필요와 다음 디자인 루프
19. 개정 검증

## 1. v16 권위와 additive 범위

v16은 기존 OSMU Studio를 새 화면으로 갈아엎지 않는다. `Sidebar`, 상단 Studio 툴바, 글감 입력, 브랜드 설정, 위키, 크레딧, 생성, 저장, 발행, 예약, 발행 이력, 7채널 미리보기, 편집 드로어를 모두 보존한다.

이번 개정의 기능 권위는 다음 순서다.

1. `docs/제품구조-결정-2026-08-15.md` §9.6·§9.7
2. `docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
3. `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` 35장
4. 현재 `dashboard/src/app/studio/page.tsx`와 `PlatformPreview.tsx`
5. 기존 v24 프로토타입의 224 sidebar, Studio 2열, 390 단일 열, 기존 토큰

v16은 다음만 additive로 더한다.

- 제작 요청 첫 화면의 타깃 시장과 출력 언어 선택
- 선택한 타깃 시장과 출력 언어의 지속 표시
- 추천 1개, 추천 근거, 예상 비용 범위, 예상 소요 시간 카드
- 요청 조립 4층의 출처·수명·영향 노출
- 저해상도 후보 3개 비교와 선택본 1개 고해상도 승격 확인
- 진행 중 요청에서 타깃 시장 또는 출력 언어를 바꿀 때의 영향 경고

신규 color·typography·spacing·radius token은 0개다. 기존 토큰 이름과 기존 컴포넌트 이름은 삭제·변경하지 않는다.

## 2. 기존 구현 확인과 보존 계약

### 2.1 현재 화면에서 실제 확인한 것

| 현재 요소 | 코드·프로토타입 근거 | v16 처리 |
|---|---|---|
| 224px 고객 sidebar와 모바일 상단 메뉴 | `Sidebar`, v24 1024·390 캡처 | 보존 |
| `OSMU Studio` 제목과 상단 툴바 | `studio/page.tsx` | 보존 |
| 글감 입력과 `OSMU 생성` | `idea`, `runOSMU` | 요청 첫 화면 완료 뒤 기존 툴바에 연결 |
| 브랜드 설정과 위키 | `BrandSetupWizard`, `RepoConnect` | 브랜드 제약층의 수정 진입점으로 연결 |
| 크레딧 잔액·사용 이력 | `/api/higgsfield/account`, transaction popover | 예상 비용 범위의 별도 사실원으로 보존 |
| 생성 진행·중지·실패 | `busy`, `lastError`, publish progress | 후보·고해상도 상태와 용어만 정합 |
| Threads·X·Facebook·Instagram·Shorts·Reels·TikTok 미리보기 | `PlatformPreview` 7종 | LC-04 이후 결과 검수로 보존 |
| 저장·예약·직접 발행 | `save`, `SchedulePanel`, `publish` | 선택본 고해상도 완료 뒤 기존 행동으로 연결 |
| 발행 이력·불러오기 | `hist.drafts`, `loadDraft` | 요청 맥락 요약도 함께 복원하는 목표 계약 추가 |
| 편집 드로어 | `editing`, 기존 필드와 재생성 | 결과 편집 기능 삭제 금지 |

### 2.2 현재 화면에 없는 것

현재 코드와 v24 렌더에는 타깃 시장 선택, 출력 언어 선택, 요청 조립 4층, 저해상도 후보 3개 비교, 선택본만 고해상도로 만드는 확인 단계가 없다. v16은 이 항목을 구현 완료로 표현하지 않는다. prototype v25 입력으로만 정의한다.

### 2.3 기준선 보존 목록

- 기존 semantic color token 11개
- typography `12, 13, 15, 17, 20, 24`
- spacing `4, 8, 12, 16, 24, 32, 48`
- control radius 8, panel radius 12, pill full
- 44px 이상 터치 목표, 주 CTA 48px 목표
- 1024의 224 sidebar와 fluid main
- 390의 page horizontal overflow 0
- 기존 Studio 결과 3개 영역과 7채널 프레임
- draft, published, partial, stopped 상태
- unknown 결과의 자동 재발행 금지
- 현재 편집·저장·예약·발행·이력 행동

## 3. 브랜드 형용사와 토큰 상속

### 3.1 브랜드 형용사 3개

| 형용사 | v16 화면 발현 |
|---|---|
| 차분한 | 첫 화면에서 추천 조합 1개를 먼저 보여주고 타깃 시장과 출력 언어를 두 결정으로만 제한한다. 모든 선택지를 한꺼번에 펼치지 않는다. |
| 근거 있는 | 추천 근거의 출처, 관찰 시점, 적용 층, 예상 비용 범위, 예상 소요 시간을 추천 카드와 후보 카드에 붙인다. |
| 통제 가능한 | 저해상도 후보 3개 중 하나를 명시적으로 선택하고, 선택본 1개만 고해상도로 만들며, 추가 과금과 영향 변경은 실행 전에 확인한다. |

### 3.2 color token 상속

| token | v16 사용 |
|---|---|
| `bg` | 페이지 배경 |
| `surface` | 선택기·추천·후보 panel |
| `surface-2` | 보조 근거·disabled·skeleton 배경 |
| `border` | 기본 경계와 후보 분리 |
| `text` | 제목·핵심 선택 |
| `muted` | 설명·비용·시간 |
| `subtle` | 출처·시점·보조 라벨 |
| `accent` | 현재 선택, 주 CTA, focus |
| `success` | 저장·고해상도 완료처럼 직접 확인된 상태만 |
| `warning` | 진행 중 요청 변경, 비보증 언어, 일부 후보 실패 |
| `danger` | 전부 실패, 차감 불일치, 복구 불가 오류 |

선택됨은 success가 아니라 accent다. 사용자의 선택은 성공 사건이 아니기 때문이다. 추천은 accent outline과 텍스트 `추천`을 함께 쓰며 색만으로 전달하지 않는다.

### 3.3 typography·spacing·shape 상속

- 제목: 24/32 또는 20/28, 기존 weight 750·700
- 카드 제목: 17/26 또는 15/24, 700
- 본문: 15/24
- 보조 정보·배지: 12/18 또는 13/20
- 카드 내부 padding: 16 또는 24
- 필드·카드 gap: 8, 12, 16
- 큰 section gap: 24 또는 32
- 전체 선택기, 추천 카드, 후보 카드: radius 12
- 내부 control: radius 8
- 신규 10px·14px·18px·20px spacing 금지

## 4. 제작 요청 첫 화면

### 4.1 화면 ID와 한 결정

화면 ID는 `ML-01`이다. 제목은 `누구에게, 어떤 언어로 보여줄까요?`로 고정한다. 고객 UI는 한국어로 유지하고 출력 언어만 결과물에 적용한다.

접힘선 위 정보 순서는 바꿀 수 없다.

1. `질문 1/3`, `최대 3개만 묻습니다`
2. 추천 조합 1개
3. 타깃 시장 선택
4. 출력 언어 선택
5. 추천 근거 요약
6. 예상 비용 범위와 예상 소요 시간
7. `다음 질문`

### 4.2 ML-01 레이아웃

| viewport | 주축 | 열수 | 순서 |
|---|---|---:|---|
| 1024 이상 | flex-row를 감싼 12열 grid | 입력 7 + 추천·영향 5 | 진행 -> 추천 -> 타깃 시장 -> 출력 언어 -> 근거·견적 -> CTA |
| 390 | flex-column | 1 | 진행 -> 추천 -> 타깃 시장 -> 출력 언어 -> 품질 고지 -> 근거·견적 -> CTA |

추천 카드가 타깃 시장과 출력 언어 필드보다 시각적으로 커져서는 안 된다. 추천은 빠른 시작 경로이지 강제 선택이 아니다.

### 4.3 ML-01 화면 상태

| 상태 | 화면 | 주 행동 | 탈출·복구 |
|---|---|---|---|
| 기본값 | 최근 선택이 없고 추천 조합이 보임 | `추천값 사용` 또는 직접 선택 | 저장 후 종료 |
| 선택됨 | 타깃 시장 1개와 출력 언어 1개가 accent로 선택 | `다음 질문` | 선택 수정 |
| 로딩 | 타깃 시장 추천과 출력 언어 견적을 독립 skeleton으로 표시 | 선택 목록 읽기 | 뒤로가기, 저장 후 종료 |
| 추천 실패 | 직접 선택은 유지, 근거 영역만 error | `직접 선택으로 계속` | 추천 다시 계산 |
| 진행 중 변경 | 기존 요청 영향 경고와 바뀌는 항목 표시 | `변경하고 후보 다시 만들기` | `기존 선택 유지` |
| 과다 | 타깃 시장 또는 출력 언어 8개 초과 | 검색·최근 사용·전체 목록 | 선택 영역 내부 스크롤 |

## 5. 타깃 시장·출력 언어 선택 컴포넌트

### 5.1 `TargetMarketSelector`

목적: 콘텐츠가 겨냥하는 타깃 시장을 요청 파라미터로 명시한다. 타깃 시장은 고객 locale, 결제 국가, 출력 언어를 대신하지 않는다.

필수 슬롯:

| 슬롯 | 내용 | 규칙 |
|---|---|---|
| label | `타깃 시장` | 항상 보이는 label |
| hint | `사례, 훅, 문화 금기, 채널 관행에 영향을 줍니다` | 타깃 시장의 downstream 영향 설명 |
| options | 한국, 일본, 영어권, 태국, 직접 입력 | 최대 4개 우선, 전체 목록 보조 |
| selection | 현재 타깃 시장 1개 | accent border + check + 텍스트 |
| provenance | 최근 요청, 브랜드 설정, 직접 선택 | 추천과 확정 출처 분리 |
| clear | `다시 선택` | 숨은 초기화 금지 |

필수 상태:

- `market-default`: 추천 타깃 시장은 보이지만 아직 확정 전
- `market-selected`: 사용자가 타깃 시장을 확정
- `market-custom`: 직접 입력한 타깃 시장, 정규화 전 원문 보존
- `market-searching`: 전체 타깃 시장 검색 중
- `market-empty`: 타깃 시장 목록을 불러오지 못해 직접 입력 제공
- `market-error`: 선택 저장 실패, 현재 타깃 시장 화면 값 보존
- `market-change-warning`: 진행 중 요청의 타깃 시장 변경 영향 확인 대기

`TargetMarketSelector`는 국기를 필수 시각요소로 쓰지 않는다. 타깃 시장 이름은 국가·권역의 한국어 명칭을 우선한다. 긴 타깃 시장 이름은 2줄까지 wrap하며 badge 안에서 잘라내지 않는다.

### 5.2 `OutputLanguageSelector`

목적: 결과물의 출력 언어를 요청 제약으로 명시한다. 출력 언어는 타깃 시장과 별도 값이며, 고객 UI 언어를 바꾸지 않는다.

필수 슬롯:

| 슬롯 | 내용 | 규칙 |
|---|---|---|
| label | `출력 언어` | 항상 보이는 label |
| hint | `카피, 자막, 음성, 캡션, 해시태그에 적용됩니다` | 출력 언어의 downstream 영향 설명 |
| options | 한국어, English, 日本語, ไทย, 직접 입력 | 각 출력 언어를 원어 이름으로 표시 |
| guarantee | 한국어·English 보증, 그 밖의 출력 언어 검수 미제공 | 선택 영역 바로 아래 고지 |
| preference | 현재 출력 언어 취향 version | 없으면 `학습된 취향 없음` |
| clear | `다시 선택` | 타깃 시장 변경과 별개 행동 |

필수 상태:

- `language-default`: 추천 출력 언어는 보이지만 아직 확정 전
- `language-selected`: 출력 언어 1개 확정
- `language-non-guaranteed`: 생성 지원, 원어민 검수 미제공
- `language-profile-empty`: 해당 출력 언어의 개인 취향 없음
- `language-profile-ready`: 해당 출력 언어 취향 version 확인
- `language-error`: 출력 언어 목록·취향 조회 실패
- `language-change-warning`: 진행 중 요청의 출력 언어 변경 영향 확인 대기

출력 언어를 국기, 국가 코드, 브라우저 locale, IP로 대신 결정하지 않는다. `English`, `日本語`, `ไทย`에는 해당 `lang` 정보를 전달할 수 있는 구현 주석을 요구한다. 화면 문서에서는 접근성 의미만 정하고 DOM 계약은 eng-design에서 확정한다.

### 5.3 `MarketLanguagePair`

`TargetMarketSelector`와 `OutputLanguageSelector`를 같은 panel 안에 두되 두 필드로 분리한다. 예: 타깃 시장 `일본`, 출력 언어 `English`는 허용한다.

조합이 일반적이지 않을 때 오류로 막지 않는다. 다음 경고를 사용한다.

`일본 시장에 English 결과를 만들도록 선택했습니다. 시장 관행은 일본 기준으로, 카피와 자막은 English로 적용됩니다.`

행동은 `이 조합 유지`, `출력 언어 바꾸기`, `타깃 시장 바꾸기`다. 자유입력은 한 필드만 바꾸며 다른 필드를 조용히 초기화하지 않는다.

## 6. 요청 맥락 지속 표시

### 6.1 `RequestContextSummaryBar`

목적: 첫 화면에서 확정한 타깃 시장과 출력 언어를 이후 제작·후보·고해상도·결과·발행 화면에서 계속 보이게 한다.

표시 순서:

1. `타깃 시장: 일본`
2. `출력 언어: English`
3. `취향: English v3`
4. `브랜드 제약: v7`
5. `변경`

1024에서는 한 줄 summary bar다. 390에서는 타깃 시장과 출력 언어를 첫 줄, 취향과 브랜드 제약을 둘째 줄에 둔다. chip이 줄바꿈되면 하나의 chip 내부 텍스트는 쪼개지 않는다.

표시 화면:

- `RQ-02`, `RQ-03`
- `AS-01`
- `LC-01`, `LC-02`, `LC-03`, `LC-04`
- `FB-01`, `FB-02`
- `V-02`, `P-03`, `P-06`
- 발행 이력의 요청 상세

### 6.2 진행 중 변경 경고

`RequestContextSummaryBar`의 `변경`을 누르면 `RequestContextChangeReview`를 연다. modal보다 같은 흐름의 review panel을 우선한다.

필수 표시:

| 바뀌는 값 | 영향 |
|---|---|
| 타깃 시장 | 사례, 훅, 문화 금기, 채널 추천, 발행 시각 후보 재계산 |
| 출력 언어 | 카피, 자막, 음성, 캡션, 해시태그, 출력 언어별 개인 취향 변경 |
| 둘 다 | 저해상도 후보 3개와 예상 비용 범위·소요 시간 재계산 |

진행 중 요청에서 타깃 시장 또는 출력 언어를 바꾸면 기존 저해상도 후보를 자동 덮어쓰지 않는다. `기존 후보 보존`, `새 조건으로 후보 다시 만들기`, `변경 취소`를 제공한다. 고해상도 제작이 시작된 뒤에는 변경 영향을 별도 요청으로 분리하고 현재 작업을 조용히 취소하지 않는다.

경고 tone은 warning이다. danger는 데이터 손실 또는 금전 불일치가 직접 확인된 경우만 쓴다.

## 7. 추천 근거 카드

### 7.1 `RecommendationEvidenceCard`

추천안 1개를 먼저 제시하고 근거·예상 비용 범위·예상 소요 시간을 붙이는 공통 패턴이다. ML-01, RQ-02, RQ-03, LC-01에서 재사용한다.

필수 슬롯:

| 순서 | 슬롯 | 예시 |
|---:|---|---|
| 1 | `추천` 배지 + 추천 제목 | `일본 시장 · English` |
| 2 | 한 줄 결과 | `일본의 시각 관행을 따르며 카피는 English로 만듭니다` |
| 3 | 근거 유형 | `우리 실험 로그`, `공개 사례`, `가설` |
| 4 | 근거 요약 | 2줄, 길면 `근거 보기` |
| 5 | 예상 비용 범위 | 값·포함 범위·확인 시각 |
| 6 | 예상 소요 시간 | 범위·현재 대기 영향·확인 시각 |
| 7 | 한계 | 표본 부족, 비보증 출력 언어, 견적 계산 중 |
| 8 | 행동 | `추천값 사용`, `다른 조합 선택` |

### 7.2 추천 상태

| 상태 | 표시 | 행동 |
|---|---|---|
| ready | 추천 1개와 근거·비용·시간 모두 표시 | 사용 또는 변경 |
| evidence-partial | 근거 일부 누락, 누락 층 표시 | 직접 선택, 다시 계산 |
| estimate-loading | 근거는 보이고 비용·시간 skeleton | 다음 CTA 잠금 |
| recommendation-error | 추천 생성 실패 | 직접 선택으로 계속 |
| conflict | 추천과 브랜드 제약·개인 취향 충돌 | 충돌 설명, 대안 2개 |
| stale | 관찰 시점이 기준을 넘김 | 최신 근거 다시 계산 |

추천 카드에는 근거 없는 `92점`, `바이럴 확률 87%`, `성과 점수`를 표시하지 않는다. 점수를 쓰려면 계산 정의, 데이터 기간, 표본, 신뢰 한계, 출처가 필요하며 이 조건이 없으면 텍스트 근거만 사용한다.

## 8. 요청 조립 4층 노출 규칙

### 8.1 `RequestAssemblyReview`

사용자가 `왜 이걸 추천했는지`를 확인하는 화면 ID는 `AS-01`이다. 4층은 저장 수명과 소유자가 다르므로 한 prompt 문장으로 합치지 않는다.

| 시각 위계 | 층 | 화면 라벨 | 출처 | 현재 요청에서 보이는 값 | 수정 위치 |
|---:|---|---|---|---|---|
| 1 | 타깃 시장 | `이번 요청` | ML-01 사용자 선택 | 시장명, 선택 시각, 시장이 바꾼 항목 | ML-01 |
| 2 | 마케팅 공통 지식 | `추천 근거` | 우리 자산, 공개 사례, 관찰 시점 | 훅 문법, 길이 감각, 금기, 플랫폼 관습 | 근거 drawer, 직접 수정 불가 |
| 3 | 개인 취향 | `내 취향 · 출력 언어별` | 선택·수정·성과 사건 | 선호, 비선호, version, 불확실성 | `PF-01 취향 상태` |
| 4 | 브랜드 제약 | `브랜드 기준` | 온보딩·브랜드 설정 | 고정 목소리·얼굴, 금지선, 필수 표현, version | 브랜드 설정·위키 |

### 8.2 시각 위계

- 타깃 시장은 `이번 요청` label과 accent border를 쓴다. 요청마다 달라지는 가장 가까운 입력이다.
- 마케팅 공통 지식은 `추천 근거` label과 neutral surface를 쓴다. 사용자가 직접 소유한 값처럼 보이지 않게 한다.
- 개인 취향은 출력 언어 badge를 반드시 포함한다. `English 취향 v3`처럼 표시하고 전역 취향으로 오독시키지 않는다.
- 브랜드 제약은 `브랜드 기준 v7`처럼 version과 수정 진입점을 붙인다.
- 네 층의 우선순위를 색의 강도로 표현하지 않는다. 번호, label, 출처, 영향으로 설명한다.

### 8.3 `RecommendationBasisDrawer`

`근거 보기`를 누르면 4층별로 다음을 보여준다.

1. 현재 값
2. 어디서 왔는지
3. 언제 확인됐는지
4. 추천의 어떤 부분을 바꿨는지
5. 사용자가 바꿀 수 있는지
6. 충돌 또는 불확실성

예시:

| 층 | 값 | 영향 |
|---|---|---|
| 타깃 시장 | 일본 | 첫 2초 훅과 세로 영상 사례를 일본 시장 기준으로 추천 |
| 마케팅 공통 지식 | 공개 사례 4건, 2026-08-15 관찰 | 길이와 금기 표현 후보에 반영 |
| 개인 취향 | English v3, 직접 수정 5건 | 짧은 문장과 빠른 나레이션을 우선 |
| 브랜드 제약 | v7, `가격 과장 금지` | 근거 없는 수치와 긴급성 카피 제외 |

### 8.4 4층 상태

| 상태 | 표현 | 복구 |
|---|---|---|
| ready | 네 층 모두 값·출처·영향 표시 | 다음 단계 |
| layer-empty | 비어 있는 층만 `없음`과 안전 기본값 표시 | 해당 수정 위치 |
| conflict | 충돌한 두 층과 적용 우선순위 후보 표시 | 사용자 선택 |
| stale | 오래된 공통 지식·브랜드 version 표시 | 다시 불러오기 |
| error | 실패한 층과 보존된 층 분리 | 해당 층만 재조회 |
| loading | 네 카드가 독립 loading | 준비된 층 읽기 가능 |
| excess | 근거 30건, 취향 이력 100건 | 요약 3건 + 전체 보기 |

## 9. 저해상도 후보 비교 컴포넌트

### 9.1 `LowResolutionCandidateComparison`

화면 ID는 `LC-01`이다. 동일 brief에서 저해상도 후보 A·B·C를 정확히 3개 나란히 비교하고 하나를 고른다. 저해상도의 실제 픽셀 수치와 길이는 실물 실험 전 확정하지 않는다.

각 후보 카드의 필수 정보 순서:

1. 후보 이름 `A`, `B`, `C`
2. 저해상도 또는 짧은 프리뷰
3. 방향 제목과 한 줄 차이
4. `왜 이 타깃 시장에 맞나`
5. 출력 언어 샘플 또는 자막·카피 요약
6. 예상 비용 범위
7. 예상 소요 시간
8. 비보증 출력 언어 고지
9. `이 후보 선택`

세 후보는 미디어 프레임의 비율, 카드 제목선, 비용 행, 시간 행, 선택 CTA 시작선을 맞춘다. 내용 길이 때문에 카드 높이가 달라질 수 있으므로 CTA를 absolute로 띄우지 않는다. 카드 내부 flex-column과 자연스러운 흐름으로 아래 정렬선을 맞춘다.

### 9.2 비용 안내 문구의 위치와 tone

후보 3개 grid 바로 아래, 선택 CTA 확인 영역 바로 위에 `CandidateCostDisclosure`를 둔다. 결과 화면 뒤나 결제 직전으로 미루지 않는다.

고정 문구:

`선택한 하나만 고해상도로 만들어집니다.`

`나머지를 나중에 고해상도로 만들면 추가 과금입니다.`

tone 규칙:

- 첫 문장은 neutral notice다. 비용 통제 방식의 사실을 설명한다.
- 둘째 문장은 warning notice다. future charge 가능성을 행동 전에 알린다.
- danger 색, 느낌표, 겁주는 문구를 쓰지 않는다.
- 문구를 tooltip·약관·drawer 안에만 숨기지 않는다.
- 1024에서는 grid 바로 아래 12열 전체 폭, 390에서는 후보 C 뒤와 선택 확인 앞에 둔다.

### 9.3 후보 상태

| 필수 상태 | 화면 표현 | 선택 행동 | 복구·종료 |
|---|---|---|---|
| loading | A·B·C 자리별 skeleton, 준비 수 `1/3` | 선택 비활성 | 저장 후 종료, 취소 |
| ready-three | 저해상도 후보 3개, 비용·시간, 근거 | 후보 하나 선택 | LC-02 |
| partial-failure | 성공 후보는 유지, 실패 후보에 원인·재시도 | 전체 선택 확정 잠금 | 실패 후보만 재시도 |
| total-failure | 공통 오류와 brief 보존 항목 | 선택 불가 | 세 후보 다시 만들기, 조건 수정, 저장 종료 |
| selected | 선택 카드 accent, 나머지 neutral | `선택한 후보 확인` | 선택 바꾸기 |
| selection-saving | 선택본과 요청 identity 고정, CTA loading | 중복 선택 금지 | 상태 조회 |
| selection-uncertain | 저장 여부 확인 중, 고해상도 시작 금지 | 상태 조회만 | 지원·저장 종료 |
| excess-copy | 200자 카피, 근거 30건 | 3줄 요약과 전체 보기 | 카드 폭 유지 |

일부 실패 상태에서 성공한 2개만으로 선택을 강제하지 않는다. 사용자가 `두 후보로 계속`을 원해도 제품구조 확정값은 후보 3개이므로 이 문서가 예외를 만들지 않는다.

### 9.4 `SelectedCandidateUpgradeReview`

화면 ID는 `LC-02`다. 선택본 1개, 미선택 저해상도 후보 2개, 고해상도 예상 비용 범위, 예상 소요 시간, 추가 과금 고지를 한 화면에서 readback한다.

필수 순서:

1. 선택한 저해상도 후보
2. 타깃 시장과 출력 언어
3. 선택 이유·추천 근거
4. 선택본 고해상도 예상 비용 범위
5. 선택본 고해상도 예상 소요 시간
6. 미선택 저해상도 후보 2개
7. 두 고정 비용 안내 문구
8. `선택한 하나를 고해상도로 만들기`

미선택 후보의 CTA는 이 화면에서 `고해상도로 만들기`가 아니다. `저해상도 후보 보기`만 허용한다. 나중에 승격할 때는 별도 견적과 명시 동의를 받는다.

### 9.5 `SelectedHighResolutionProgress`

화면 ID는 `LC-03`이다. 선택한 후보 하나만 고해상도로 진행한다.

- 현재 단계와 실제 완료 단계를 표시한다.
- 타깃 시장, 출력 언어, 선택 후보 identity를 지속 표시한다.
- 미선택 후보 두 개는 저해상도 상태로 보존됐다고 표시한다.
- 고해상도 실패 시 저해상도 후보 3개와 선택 기록을 보존한다.
- 결과가 uncertain이면 다시 생성하지 않고 상태 조회만 허용한다.

### 9.6 `HighResolutionResultSummary`

화면 ID는 `LC-04`다. 선택본 고해상도 결과와 기존 7채널 미리보기·편집·저장·예약·발행으로 연결한다.

결과 header에는 다음을 반복한다.

- 타깃 시장
- 출력 언어
- 적용 개인 취향 version
- 브랜드 제약 version
- 추천 근거 요약
- 실제 차감·예상 범위 대사 상태
- 미선택 저해상도 후보 2개와 `추가 비용 확인 후 고해상도로 만들기`

미선택 후보의 추가 승격은 이 화면에서 곧바로 실행하지 않는다. 별도 `AdditionalCandidateUpgradeQuote`에서 예상 비용 범위, 예상 소요 시간, 추가 과금, 새 작업 identity를 확인한 뒤 실행한다.

## 10. 상태·인터랙션·접근성 계약

### 10.1 통합 상태 이름

| state | 의미 | success 사용 여부 |
|---|---|---|
| default | 추천값은 보이지만 사용자 확정 전 | 사용 금지 |
| selected | 타깃 시장·출력 언어·후보가 사용자에게 선택됨 | 사용 금지, accent |
| loading | 추천·견적·후보·고해상도 진행 | 사용 금지 |
| partial | 일부 후보 또는 일부 근거 실패 | 사용 금지, warning |
| error | 재시도 가능한 실패 | 사용 금지, danger 또는 warning |
| uncertain | 저장·차감·생성 결과 확인 중 | 사용 금지, warning |
| completed | 선택본 고해상도와 결과 identity 확인 | success 허용 |

### 10.2 keyboard·focus

- 타깃 시장과 출력 언어 option은 keyboard로 이동·선택 가능해야 한다.
- 후보 A·B·C는 문서 순서와 focus 순서가 같다.
- 선택 시 focus를 갑자기 CTA로 이동하지 않는다. 화면 내 status announcement 후 사용자가 계속 탐색할 수 있게 한다.
- `RequestContextChangeReview`가 열리면 제목과 바뀌는 영향이 먼저 읽힌다.
- error·warning은 관련 field와 연결되고 원인·다음 행동을 함께 말한다.
- 색만으로 추천, 선택, 비보증 출력 언어, 실패를 전달하지 않는다.

### 10.3 motion

- option 선택: fast 120ms, standard ease-out
- 추천 근거 drawer: base 200ms, standard ease-out
- 후보 준비·선택 완료: base 200ms, 상태 피드백에만 사용
- 화면 전환: slow 320ms 이하
- `prefers-reduced-motion`에서는 이동 애니메이션을 제거하고 opacity 변화만 허용한다.
- 후보 카드를 과장해 튀게 하거나 장식 confetti를 쓰지 않는다.

## 11. 반응형·밀도·overflow 계약

### 11.1 1024

| component | 주축 | 열수 | 순서 |
|---|---|---:|---|
| `MarketLanguagePair` | flex-row 안 grid | 7 + 5 | 입력 -> 근거·견적 |
| `RequestContextSummaryBar` | flex-row, wrap 가능 | 1 | 타깃 시장 -> 출력 언어 -> 취향 -> 브랜드 제약 -> 변경 |
| `RequestAssemblyReview` | grid | 2 | 타깃 시장 -> 공통 지식 -> 개인 취향 -> 브랜드 제약 |
| `LowResolutionCandidateComparison` | grid | 3 | A -> B -> C -> 비용 안내 -> 선택 확인 |
| `SelectedCandidateUpgradeReview` | flex-row | 선택본 8 + 미선택 4 | 선택본 -> 견적 -> 미선택 -> 고지 -> CTA |
| `HighResolutionResultSummary` | flex-row | 결과 8 + 근거·행동 4 | 결과 -> 요청 맥락 -> 근거 -> 행동 |

### 11.2 390

- 모든 신규 component는 flex-column 1열이다.
- 타깃 시장 option과 출력 언어 option을 가로 carousel로 숨기지 않는다.
- 저해상도 후보는 A -> B -> C 세로 순서다. 추천 후보가 있으면 시각 label만 붙이고 DOM 순서는 바꾸지 않는다.
- 각 저해상도 후보 카드 끝에 같은 순서로 비용·시간·CTA를 둔다.
- `CandidateCostDisclosure`는 후보 C 아래에서 전체 폭으로 보인다.
- sticky CTA는 마지막 고지와 16px 이상 안전 여백을 둔다.
- 카드의 핵심 비교 label을 상단에 반복해 앞 후보를 잊는 부담을 줄인다.

### 11.3 데이터량 0·정상·과다

| 데이터 | 0 | 정상 | 과다 |
|---|---|---|---|
| 타깃 시장 | 기본 추천 + 직접 입력 | 최근 4개 + 전체 목록 | 8개 초과 검색·권역 필터 |
| 출력 언어 | 기본 추천 + 직접 입력 | 4개 우선 | 8개 초과 검색, 원어 이름 유지 |
| 추천 근거 | `추천 근거 없음`, 가설 라벨 | 1개에서 3개 요약 | 30건 중 상위 3개 + 전체 보기 |
| 개인 취향 | 해당 출력 언어의 취향 없음 | 현재 version + 근거 3건 | 이력 20건 이후 페이지 |
| 브랜드 제약 | 안전 기본값·온보딩 진입 | 필수·금지·고정 자산 요약 | 범주별 접기·검색 |
| 저해상도 후보 | 생성 전 empty | 정확히 3개 | 후보 수는 3 고정, 각 카드 내부 근거만 접기 |
| 결과 파생 | 마스터만 | 1개에서 7채널 | 문제 항목 우선, 내부 accordion |

### 11.4 overflow 수용기준

- 60자 타깃 시장 이름, 40자 출력 언어 이름, 200자 후보 카피에서도 page horizontal overflow 0
- 예상 비용 범위와 예상 소요 시간은 숫자·단위를 함께 줄바꿈한다.
- URL과 source ID는 `overflow-wrap:anywhere`와 전체 복사 행동을 제공한다.
- 배지는 한 줄을 유지하되 container 폭이 부족하면 배지 전체가 다음 줄로 간다.
- 미디어는 정해진 aspect ratio frame 안에서 contain 또는 crop 기준을 표시한다.
- 이미지가 없으면 깨진 placeholder 대신 `저해상도 후보 준비 실패` 상태를 쓴다.
- 390에서 표는 카드 행으로 reflow한다.

## 12. 컴포넌트 인벤토리 추가

기존 `Panel`, `Notice`, `StatusBadge`, `Button`, `Field`, `Stack`, `PlatformPreview`, `PublishHistory`, `SchedulePanel`을 조합한다.

| 신규 component | purpose | mandatory states |
|---|---|---|
| `TargetMarketSelector` | 요청별 타깃 시장 선택 | default, selected, custom, searching, empty, error, change-warning |
| `OutputLanguageSelector` | 결과물 출력 언어 선택 | default, selected, non-guaranteed, profile-empty, profile-ready, error, change-warning |
| `MarketLanguagePair` | 타깃 시장과 출력 언어를 함께 보되 분리 저장 | ready, mismatch, loading, error |
| `RequestContextSummaryBar` | 이후 화면에 타깃 시장·출력 언어 지속 표시 | ready, wrapped, stale, error |
| `RequestContextChangeReview` | 진행 중 요청 변경 영향 확인 | no-change, market-change, language-change, both-change, submitting, uncertain |
| `RecommendationEvidenceCard` | 추천 1개와 근거·비용·시간 | ready, evidence-partial, estimate-loading, error, conflict, stale |
| `RecommendationBasisDrawer` | 4층별 출처·시점·영향 설명 | ready, layer-empty, conflict, loading, error, excess |
| `RequestAssemblyReview` | 요청 조립 4층 확인 | ready, layer-empty, conflict, stale, loading, error, excess |
| `LowResolutionCandidateComparison` | 저해상도 후보 3개 비교 | loading, ready-three, partial-failure, total-failure, selected, uncertain |
| `LowResolutionCandidateCard` | 후보별 프리뷰·근거·비용·시간 | loading, ready, failed, selected, disabled |
| `CandidateCostDisclosure` | 선택본만 고해상도·미선택 추가 과금 고지 | visible, acknowledged |
| `SelectedCandidateUpgradeReview` | 선택본 1개 고해상도 전 readback | ready, estimate-loading, estimate-error, changed, submitting |
| `SelectedHighResolutionProgress` | 선택본 1개 고해상도 진행 | queued, generating, quality-check, completed, failed, uncertain |
| `HighResolutionResultSummary` | 결과·근거·요청 맥락·다음 행동 | ready, partial, error, loading, excess |
| `AdditionalCandidateUpgradeQuote` | 미선택 후보 추가 승격의 별도 견적·동의 | quote-loading, ready, changed, declined, submitting, uncertain |

## 13. 금지 패턴 추가

- `원클릭`, `한 번에 끝`, `클릭 한 번`처럼 선택·검수·비용 확인을 지우는 표현
- em dash와 en dash
- 계산 정의·기간·표본·출처 없는 성과 점수, 바이럴 점수, 추천 점수
- 타깃 시장을 브라우저 locale·IP·결제 국가로 조용히 결정
- 출력 언어를 국기·국가 코드만으로 표시
- 타깃 시장과 출력 언어를 하나의 `locale` badge로 합침
- 출력 언어 선택으로 고객 UI 언어까지 바꿈
- 비보증 출력 언어의 원어민 검수 미제공을 결과 뒤에만 표시
- 추천 1개를 강제하고 직접 선택을 숨김
- 추천 근거를 `AI 추천` 한 줄로 끝냄
- 예상 비용 범위·예상 소요 시간을 후보 선택 뒤로 숨김
- 저해상도 후보 3개가 준비되기 전에 선택 확정
- 일부 실패 후보를 제외하고 2개만으로 선택 강제
- 저해상도 후보 3개를 모두 고해상도로 선제 제작
- 선택한 하나만 고해상도로 만든다는 안내를 tooltip에만 숨김
- 미선택 후보의 추가 과금을 결과 뒤에 처음 고지
- 진행 중 타깃 시장·출력 언어 변경으로 기존 후보를 자동 삭제
- 요청 조립 4층을 prompt 문자열 하나로 보여줌
- 개인 취향을 출력 언어 구분 없이 전역 profile로 표시
- 카드 안 카드, generic 3열 장식, 신규 gradient, blob, emoji-only icon
- success 색을 추천·선택·처리 중에 사용
- 근거 없는 정확한 비용·시간·해상도 수치

## 14. 벤치마크 반영

| 공식 근거 | 확인한 사실 | 차용 | 우리식 변경 |
|---|---|---|---|
| [USWDS Language selector](https://designsystem.digital.gov/components/language-selector/) | 3개 이상 언어는 일관된 위치·행동, 각 언어의 `lang` 식별, 논리적 list, 대비를 요구한다 | 출력 언어 원어 이름, 일관된 위치, 접근성 상태 | 사이트 언어가 아니라 결과물 출력 언어이므로 요청마다 확인하고 downstream 영향을 표시 |
| [Shopify Country and language UX](https://shopify.dev/docs/storefronts/themes/markets/country-language-ux) | country와 language selector를 함께 제공하면 인접 배치해야 한다 | 타깃 시장과 출력 언어를 같은 결정 panel에 배치 | 두 값을 합치지 않고 별도 field와 별도 영향으로 유지 |
| [GOV.UK Select](https://design-system.service.gov.uk/components/select/) | public service 질문에서 select는 마지막 수단이며, 질문이면 미리 선택해 응답을 편향시키지 말라고 한다 | 선택지 수가 적은 타깃 시장·출력 언어는 보이는 option을 우선 | 완전한 무선택 대신 추천 조합을 명시적으로 제시하되 사용자가 확정해야 다음으로 이동 |
| [Adobe Firefly Fast mode](https://helpx.adobe.com/firefly/web/work-with-images/generate-images/use-fast-mode-for-quick-image-generations.html) | 낮은 해상도로 여러 변형을 빠르게 비교하고 나중에 upscale하며 credit 소비를 고지한다 | 저해상도 후보 비교, 선택 뒤 고해상도, 비용 tradeoff 선고지 | 외부 제품의 512·2K 숫자는 차용하지 않고 후보3·선택본1 계약만 적용 |
| [Midjourney Discord Quick Start](https://docs.midjourney.com/hc/en-us/articles/32631709682573-Discord-Quick-Start) | 4개 option grid에서 하나를 분리하고 이후 편집·변형 행동으로 간다 | 후보를 한눈에 비교하고 선택 identity를 유지 | 우리 제품은 후보3 고정, 예상 비용·시간·시장 근거를 각 카드에 추가 |

차용하지 않은 것:

- USWDS의 site-wide 언어 전환 위치를 그대로 쓰지 않는다. 출력 언어는 요청 입력이다.
- Firefly의 `Upscale all`을 쓰지 않는다. 모든 후보 고해상도는 제품구조 결정과 충돌한다.
- Midjourney의 번호 버튼만 쓰지 않는다. 후보마다 시장 근거·비용·시간을 읽을 수 있어야 한다.
- 타사 브랜드 색·로고·고유 문구는 복제하지 않는다.

## 15. 추적성·수용기준

| 상류 요구 | component·화면 | 정적 수용기준 |
|---|---|---|
| 타깃 시장을 요청마다 선택 | `TargetMarketSelector`, ML-01 | 기본값·선택됨·변경 경고 존재, 이후 summary bar 반복 |
| 출력 언어를 요청 제약으로 선택 | `OutputLanguageSelector`, ML-01 | 타깃 시장과 분리, 원어 이름, 비보증 언어 고지 |
| 타깃 시장·출력 언어 지속 표시 | `RequestContextSummaryBar` | AS-01·LC-01·LC-02·LC-03·LC-04·V-02에 표시 |
| 진행 중 변경 영향 | `RequestContextChangeReview` | 재계산 항목과 기존 후보 보존 선택 존재 |
| 추천 1개 먼저 | `RecommendationEvidenceCard` | 근거·비용 범위·소요 시간·한계·직접 선택 포함 |
| 요청 조립 4층 | `RequestAssemblyReview` | 네 층의 출처·수명·영향·수정 위치 모두 표시 |
| 왜 추천했는지 보기 | `RecommendationBasisDrawer` | 각 층이 추천의 어느 부분을 바꿨는지 설명 |
| 저해상도 후보 3개 | `LowResolutionCandidateComparison` | 정확히 A·B·C, 일부 실패 시 선택 잠금 |
| 선택본 1개만 고해상도 | `SelectedCandidateUpgradeReview`, LC-03 | 선택본 identity 1개, 미선택 저해상도 2개 보존 |
| 미선택 추가 과금 | `CandidateCostDisclosure`, `AdditionalCandidateUpgradeQuote` | 두 고정 문구 사전 노출, 별도 견적·동의 |
| 390·1024 계약 | §11 | 주축·열수·순서·0·정상·과다·overflow 정의 |
| 금지 표현 | §13 | `원클릭`, 긴 대시, 근거 없는 성과 점수 금지 |

## 16. 레드팀·셀프심문

### 16.1 레드팀 1: 까다로운 첫 사용자

공격: 첫 화면부터 타깃 시장과 출력 언어, 추천 근거, 비용, 시간이 보이면 다시 설정 제품처럼 느껴지고 백지공포가 선택 피로로 바뀐다.

수정: 추천 조합 1개를 먼저 보여주고 주요 입력을 타깃 시장 1개와 출력 언어 1개로 제한했다. 전체 목록은 보조 행동으로 내리고, 요청 조립 4층의 상세는 다음 확인 화면과 근거 drawer로 점진 공개한다.

### 16.2 레드팀 2: 회의적 투자자

공격: 저해상도 후보 3개도 공급자 원가가 들고, 실제 품질이 낮으면 선택 데이터가 무의미하다.

수정: 고해상도 선제 제작을 금지하고 실제 해상도 수치를 쓰지 않았다. 기술설계 전 동일 brief의 저해상도·고해상도 실물을 회장이 눈으로 비교해야 한다는 gate를 유지한다. 선택 불가능한 품질이면 이 패턴은 출시할 수 없다.

### 16.3 레드팀 3: 다국어 고객

공격: 일본 시장과 English 출력 언어를 허용하면 시장 적합성과 언어 품질 중 어떤 기준을 따르는지 모호하다.

수정: 타깃 시장은 사례·훅·금기·채널 관행, 출력 언어는 카피·자막·음성·캡션에 영향을 준다고 화면에 분리했다. 조합이 다르면 오류가 아니라 영향 확인을 요구한다.

### 16.4 셀프심문

질문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 무엇인가?

답: 가장 load-bearing한 가정은 390에서 저해상도 후보 3개를 세로로 보더라도 사용자가 앞 후보의 시각·비용·근거를 기억해 비교할 수 있다는 것이다. desktop 3열은 비교가 쉽지만 mobile은 기억 부담이 커진다.

수정: 각 카드의 정보 순서와 label을 동일하게 고정하고, 선택 확인 화면에서 선택본과 미선택 두 후보를 함께 readback한다. 다만 문서만으로 기억 부담을 증명할 수 없으므로 prototype v25에서 sticky compact comparison 또는 선택 tray가 필요한지 사용자 과제로 검증한다.

두 번째 질문: `RequestContextSummaryBar`의 반복이 화면을 답답하게 만들지 않는가?

답: 가능하다. 시장·언어·취향·브랜드 version을 매 화면에 모두 펼치면 주요 행동이 밀린다.

수정: 기본 bar는 타깃 시장과 출력 언어만 강하게 보이고 취향·브랜드 version은 작은 readback으로 둔다. 상세 근거는 drawer로 내린다. 390에서는 두 줄을 넘지 않으며 세 번째 줄이 필요하면 `설정 2개 더`로 접는다.

## 17. 정적 design review

| dimension | score | evidence |
|---|---|---|
| hierarchy | A- | 추천 1개 -> 타깃 시장·출력 언어 -> 근거·견적 -> 다음 행동 순서 고정 |
| consistency | A | 기존 color·type·spacing·shape·Studio 기능 전량 상속, 신규 token 0 |
| component completeness | A | selector·summary·4층·추천·후보·고해상도·추가 승격까지 inventory·상태 정의 |
| states | A | 기본값·선택·변경 경고, 후보 5상태, uncertain·excess·복구 정의 |
| responsive | B+ | 390·1024 주축·열수·순서·0·정상·과다 정의, 실제 렌더 미검증 |
| accessibility | B+ | 원어 이름, keyboard·focus·색 비의존·reduced motion 계약, DOM 구현 미검증 |
| trust | A | 비용·시간·추가 과금·비보증 출력 언어를 실행 전에 표시 |
| polish | B | 문서 명세 완성, prototype 픽셀·줄바꿈·실데이터 과다 상태 미검증 |

**Design Score: B+ static candidate.** 디자인 문서 기준 합격선 B를 넘지만 실제 화면 품질 등급은 아니다. prototype v25의 390·1024 렌더와 독립 design-review 전에는 A로 승격하지 않는다.

문서 rubric:

**RUBRIC_SCORE: completeness=5/5 precision=5/5 benchmark=5/5 traceability=5/5 professionalism=4/5 total=24/25**

**WEAKEST_LINE:** 저해상도 후보의 실제 선택 가능 품질과 비용 절감 폭은 같은 brief의 저해상도·고해상도 실물 비교 전까지 미검증이다.

## 18. 회수 필요와 다음 디자인 루프

- ⛔ 회수 필요: 저해상도와 고해상도의 정확한 픽셀·길이·파일크기는 실물 비교 전 확정하지 않는다.
- ⛔ 회수 필요: 예상 비용 범위와 예상 소요 시간의 실제 계산 계약은 studio-service 기술설계가 필요하다.
- ⛔ 회수 필요: 한국어·English 밖 출력 언어의 검수자 자격, SLA, 실패 환불 기준은 제품·기술·운영 합의가 필요하다.
- ⛔ 회수 필요: 진행 중 타깃 시장·출력 언어 변경이 기존 job을 취소·복제·version하는 방식은 API·DB 합의 대상이다.
- ⛔ 회수 필요: 이번 개정은 DESIGN.md 문서만 다뤘다. prototype v25의 ML-01, AS-01, LC-01부터 LC-04를 390·1024와 0·정상·과다 상태로 렌더해야 한다.

다음 디자인 루프는 가능하다. 기술설계 진입은 design 승인, prototype v25, 실제 렌더의 영역별 pixel review, 독립 Design Score B 이상 뒤에만 가능하다.

## 19. 개정 검증

### 19.1 회귀·분량

- 사용자 지정 개정 전 기준선: 2,694줄
- 실제 작업 시작 시 파일: 2,984줄. 같은 요구의 선행 미커밋 v24.4를 포함했고 삭제하지 않았다.
- 최종 v16 파일: 3,734줄
- v16은 기존 절·토큰·컴포넌트·상태·금지 패턴을 삭제하거나 이름 변경하지 않고 최신 additive 절로 추가했다.
- 기존 기능 삭제: 0개
- 신규 token: 0개
- 신규 component: 15개
- 기존 긴 대시 잔존: 0개로 정리한다.

### 19.2 키워드 검사 기준

최종 파일에서 아래 정확한 문자열을 `rg -o '<검사어>' DESIGN.md | wc -l`로 집계한다.

| 검사어 | 최소 | 판정 기준 |
|---|---:|---|
| 타깃 시장 | 10회 | 최종 실측 86회, 컴포넌트·상태·영향·반응형·추적성 문맥 포함, 통과 |
| 출력 언어 | 10회 | 최종 실측 107회, 컴포넌트·상태·보증·취향·반응형 문맥 포함, 통과 |
| 저해상도 | 10회 | 최종 실측 48회, 후보·비용·상태·고해상도·실물 gate 문맥 포함, 통과 |

최종 실측은 2026-08-15 20:46 KST에 수행했다. 긴 대시는 0건이며 `git diff --check -- DESIGN.md`도 통과했다.

### 19.3 SOURCES / MODEL / SKILLS

SOURCES:

- `/Users/sj/sj_code_master/openclaw-auto/DESIGN.md`, 작업 시작 시 2,984줄과 지정 기준선 2,694줄
- `/Users/sj/sj_code_master/openclaw-auto/docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/제품구조-결정-2026-08-15.md` §9.6·§9.7
- `/Users/sj/sj_code_master/openclaw-auto/docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/구현현황.md`
- `/Users/sj/sj_code_master/openclaw-auto/dashboard/src/app/studio/page.tsx`
- `/Users/sj/sj_code_master/openclaw-auto/dashboard/src/components/studio/PlatformPreview.tsx`
- `/Users/sj/sj_code_master/openclaw-auto/docs/prototype/v24-brief.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/prototype/qa-v24/studio-desktop-1024.png`
- `/Users/sj/sj_code_master/openclaw-auto/docs/prototype/qa-v24/studio-mobile-390.png`
- `/Users/sj/sj_code_master/openclaw-auto/wiki/product/studio.md`
- `/Users/sj/.claude/standards/design.md`
- `/Users/sj/.claude/standards/doc-review.md`
- `/Users/sj/.claude/standards/benchmarks.md`
- `/Users/sj/.claude/standards/artifact-stamp.md`
- https://designsystem.digital.gov/components/language-selector/
- https://shopify.dev/docs/storefronts/themes/markets/country-language-ux
- https://design-system.service.gov.uk/components/select/
- https://helpx.adobe.com/firefly/web/work-with-images/generate-images/use-fast-mode-for-quick-image-generations.html
- https://docs.midjourney.com/hc/en-us/articles/32631709682573-Discord-Quick-Start

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 설치된 스킬 중 기존 제품의 디자인 시스템·컴포넌트·상태 계약을 개정하는 전용 매칭 스킬이 없었다. `design.md`, `doc-review.md`, `benchmarks.md`, `artifact-stamp.md`는 스킬이 아니라 품질헌법으로 직접 읽고 적용했다.

SKILLS_SKIPPED: `imagegen`은 bitmap 생성·편집 과제가 아니므로 스킵했다. `openclaw-creative-brief`는 자동 생성 에이전트용 창작 브리프이며 제품 화면 컴포넌트 계약과 범위가 달라 스킵했다.

# Marketing Agent 디자인 시스템 v24.3: 발행 정책·체험·이동성·내부 테스트

> STAMP: created_at=2026-08-15 08:29 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=matching skill 없음, design.md rubric 정적 review | evidence=user-flow v9.3, 제품구조 결정 §9.5, current v24 implementation, Buffer·Later·Hootsuite·Stitch Fix·OpenAI·Twilio·시그마인 official UX | deliberation=기존 셸과 토큰을 보존하고 자동화·금전·리드·데이터 이동의 신뢰 장치만 추가

## v24.3 권위와 변경 범위

v24.3은 v24·v24.1·v24.2의 고객 셸, 운영자 셸, 브랜드 형용사, color, typography, spacing, shape, 상태 primitive를 모두 상속한다. 신규 color·typography·spacing·radius 토큰은 0개다. 신규 범위는 `docs/design-docs/user-flow-openclaw-service-v9.3-gpt-codex.md` 34장의 발행 모드, 품질 반려, 가입 전 체험, 데이터 내보내기, 내부 테스트 구분이다.

## 브랜드 형용사 3개와 신규 화면 발현

| 형용사 | 신규 화면 발현 |
|---|---|
| 정직한 | 실제 적용 발행 모드, 무과금, 연락처 목적, 제외된 내보내기 항목, 내부 테스트 표본을 숨기지 않음 |
| 통제되는 | 자율 발행 전 영향 확인, 승인 대기, 중복 실행 금지, 부분 내보내기 재시도, 분류 변경 감사 |
| 증거 중심 | 품질 반려 이유·기준 버전, 잔액 확인, 연락처 확인, 데이터 manifest, 분류 변경 전후를 연결 |

## 토큰 상속

- color: `bg`, `surface`, `surface-2`, `border`, `text`, `muted`, `subtle`, `accent`, `success`, `warning`, `danger`
- typography: 12·13·15·17·20·24. 11 이하 금지
- spacing: 4·8·12·16·24·32·48만 사용
- radius: control 8, panel 12, pill full
- motion: fast 120ms, base 200ms, slow 320ms. 상태 설명 없이 장식 모션 금지
- 44px 최소 터치 목표, `overflow-wrap:anywhere`, 페이지 전체 가로 overflow 0

## Component inventory 추가

| component | purpose | mandatory states |
|---|---|---|
| `PublishPolicyMatrix` | 테넌트·채널·유형별 발행 모드와 상속 출처 편집 | empty, loading, error, inherited, overridden, saving, uncertain |
| `EffectivePolicyReview` | 변경 뒤 최종 적용 모드와 영향 대기 건 확인 | no-change, changed, conflict, loading, error |
| `EffectiveModeBadge` | 현재 작업의 모드와 적용 출처 반복 | autonomous, approval-required, inherited, overridden, unknown |
| `ApprovalQueueRow` | 결과·채널·계정·기한·비용·revision 승인 대기 | waiting, overdue, blocked, loading, error |
| `ApprovalActionRail` | 승인·예약·즉시 발행·수정·미채택 중 한 결정 | enabled, disabled-with-reason, submitting, uncertain |
| `QualityGateRejectionNotice` | 반려 이유, 보존, 무과금, 다음 행동 | reason-known, reason-missing, repeated, ledger-loading, ledger-error |
| `TrialLeadCapture` | 이메일과 필수·선택 동의를 분리 | empty, invalid, submitting, sent, error |
| `TrialVerificationStatus` | 연락처 확인과 체험 크레딧 지급을 분리 | unverified, verifying, verified, grant-loading, granted, uncertain, error |
| `TrialBalanceSummary` | 체험 잔액, 이번 예상, 품질 반려 무과금 | normal, low, exhausted, stale, error |
| `ExportScopeList` | 결과물·소재·편집 지시서·취향·성과 범위와 수량 | empty, loading, normal, excess, partial, error |
| `ExportPackageStatus` | 스캔·패키징·검증·다운로드와 부분 실패 | queued, scanning, packaging, verifying, ready, partial, expired, error |
| `InternalTestBadge` | 운영자 전용 테넌트 구분 | internal-test, actual-user, unknown |
| `TenantClassificationReview` | 분류 변경 영향, 사유, 전후값 확인 | unchanged, changed, submitting, uncertain, confirmed, error |

모든 신규 component는 기존 `Panel`, `Notice`, `StatusBadge`, `Button`, `Field`, `Stack`, table/list primitive로 조합한다. 카드 안 카드, 신규 gradient, 신규 radius, 이모지 단독 아이콘을 만들지 않는다.

## 발행 정책 시각 계약

- 정책 우선순위는 `유형 override > 채널 override > 테넌트 기본`으로 표시한다.
- `EffectiveModeBadge`는 모드만 쓰지 않고 출처까지 쓴다. 예: `자율 발행 · Instagram 영상 override`.
- 자율 발행으로 바꿀 때 success 색을 쓰지 않는다. 활성화는 성공이 아니라 위험을 동반한 설정 변경이다.
- `EffectivePolicyReview`는 자동 발행 채널·유형, 계정, 시각, 실패 안전장치, 영향 대기 건을 접힘선 위에 둔다.
- 승인 대기 화면은 발행 예정이 가까운 순서와 오래된 순서를 사용한다. `모두 승인`은 영향 건수와 계정·시각을 확인한 뒤에만 가능하다.
- 승인 시각이 지나도 자율 발행으로 자동 전환하지 않는다.

## 품질 반려와 금전 시각 계약

`QualityGateRejectionNotice`의 정보 순서는 바꿀 수 없다.

1. `품질 기준을 통과하지 못해 결과를 전달하지 않았어요`
2. `이번 시도는 품질 게이트에서 반려되어 크레딧을 사용하지 않았습니다.`
3. 보존된 선택·자료·스타일·채널
4. 사용자 언어의 반려 이유와 위치
5. 잔액·원장 확인 상태
6. 같은 방향 보정, 선택 변경, 저장 종료, 지원

반려에 danger만 쓰지 않는다. 결과 전달 차단은 warning 또는 danger를 쓰되 `차감 0`은 success로 과장하지 않고 중립적 사실로 표시한다. 원장 상태가 uncertain이면 상태 조회만 허용한다. 품질 반려와 사용자의 미채택을 같은 배지·카피로 표현하지 않는다.

## 체험 연락처와 동의 시각 계약

- 이메일 필드는 한 화면의 유일한 primary input이다.
- 필수 동의와 선택 마케팅 동의는 별도 행, 별도 checkbox, 별도 설명을 쓴다.
- 선택 동의 미체크 상태에서도 primary CTA가 활성화돼야 한다.
- 연락처 입력 전에 목적, 보관 기간, 삭제·문의 경로를 보인다.
- 확인과 크레딧 지급은 같은 success 화면으로 합치지 않는다. `확인됨`, `지급 중`, `지급됨`, `지급 확인 필요`를 분리한다.
- 가입 모달은 제작 중 자동으로 열지 않는다. 결과 뒤 TR-04에서 데이터 보존 이득과 함께 제안한다.

## 데이터 내보내기 시각 계약

- 범주 순서는 결과물, 소재, 편집 지시서, 취향 프로파일, 성과 이력이다.
- 각 행은 수량, 기간, 예상 크기, 형식, 제외·확인 필요를 같은 열 순서로 보여준다.
- 기계용 JSON보다 사람이 읽는 README·Markdown·CSV·미리보기 인덱스를 먼저 설명한다.
- 부분 성공은 전체 실패처럼 막지 않는다. 성공 파일 다운로드와 누락 항목 재준비를 동시에 제공한다.
- 다운로드 링크 만료와 원본 데이터 삭제를 같은 상태로 표현하지 않는다.
- 파일명·URL·식별자는 `overflow-wrap:anywhere`와 전체 복사를 제공한다.

## 내부 테스트 시각 계약

- `InternalTestBadge`는 운영자 화면에만 표시하고 텍스트 `내부 테스트`를 포함한다.
- O-03 고객명과 같은 행에 배치한다. 390에서 폭이 부족하면 배지 전체를 다음 줄로 보낸다.
- O-09 기본 필터는 `실사용자만`이며 현재 필터를 결과 제목에 반복한다.
- `모두 비교`는 내부 테스트와 실사용자의 표본·기간을 병렬 표시한다.
- 분류 변경은 사유, 전후값, 변경 시각, 변경 주체, 영향 집계를 확인한 뒤 실행한다.
- 실제 원가 집계에서 내부 테스트를 조용히 제외하지 않는다. 추천 근거와 원가 관점의 기본 필터가 다름을 라벨로 구분한다.

## Layout 계약 추가

| viewport | 정책·승인 | 반려·체험 | 내보내기·운영 |
|---|---|---|---|
| 1440·1024 | 목록 8 + 적용/행동 4 | 이유·입력 7 또는 8 + 잔액·요약 5 또는 4 | 범주·파일 8 + 요약 4 |
| 390 | 기본·예외·최종 적용 1열, 승인 목록과 상세 별도 | 무과금·보존·이유·행동 1열, 이메일·동의·CTA 1열 | 범주 카드행 1열, 내부 테스트 배지 줄바꿈 |

- 1024에서 모든 신규 목록은 기존 main 12열 시작선을 따른다.
- 390에서 표를 축소하지 않고 카드 행으로 reflow한다.
- sticky action rail은 마지막 콘텐츠를 가리지 않게 16px 안전 여백을 둔다.
- 정책 예외 8개 초과, 승인 대기 20개 초과, 내보내기 이력 8개 초과, 테넌트 20개 초과부터 필터·페이지를 사용한다.

## 상태 계약 추가

| state | meaning | allowed action |
|---|---|---|
| inherited | 상위 발행 정책을 따름 | override 추가, 최종 적용 보기 |
| overridden | 현재 범위가 상위 정책과 다름 | 수정, 제거, 영향 보기 |
| approval-required | 품질 통과 뒤 사람 승인 대기 | 승인, 수정, 미채택 |
| rejected-no-charge | 품질 게이트 반려, 고객 차감 없음 | 보정, 선택 변경, 저장, 지원 |
| grant-loading | 연락처 확인 뒤 체험 크레딧 지급 중 | 상태 조회, 중복 요청 금지 |
| partial-export | 일부 범주 성공, 일부 실패 | 성공 다운로드, 실패 범주 재준비 |
| expired-download | 다운로드 파일 만료, 원본 데이터 유지 | 같은 범위 재준비 |
| internal-test | 운영 루프에서 실사용자와 분리 | 분류 영향 확인, 감사 변경 |

`uncertain`, `stale`, `unknown`은 v24.2 계약을 그대로 쓴다. success는 외부 발행 확인, 크레딧 지급 확인, 내보내기 검증 완료, 분류 저장 확인처럼 직접 확인된 상태에만 쓴다.

## 금지 패턴 추가

- 적용 출처 없이 `자율 발행 켜짐`만 표시
- 승인 기한 경과를 자율 발행으로 자동 전환
- 품질 게이트 반려인데 잔액 차감 여부를 숨김
- 품질 반려와 사용자 미채택을 같은 사건으로 합침
- 체험 크레딧과 마케팅 동의를 묶음
- 연락처 수집 목적·보관·삭제 경로를 제출 뒤에만 표시
- 내보내기에 내부 식별자 JSON만 제공
- 부분 내보내기 성공 파일까지 다운로드 차단
- 내부 테스트를 색 점만으로 표시
- 내부 테스트를 원가·추천 모든 집계에서 조용히 제외
- 설정 저장 success 토스트만 보여주고 실제 적용 모드를 재표시하지 않음

## v24.3 Design review

| dimension | score | evidence |
|---|---|---|
| hierarchy | A- | 발행 정책은 최종 적용, 반려는 무과금, 체험은 연락처 한 결정, 내보내기는 소유 범주가 먼저 |
| consistency | A | v24 token·shell·primitive 전량 상속, 신규 token 0 |
| states | A- | 모드 상속·승인·무과금·지급·부분 내보내기·내부 테스트 상태 정의 |
| trust and ethics | A | 선택 마케팅 동의 분리, 데이터 이동성, 무과금, 분류 감사 |
| responsive | B+ | 390·1024 주축과 reflow, 0·정상·과다 정의, 실제 렌더 미검증 |
| implementation readiness | B+ | component·state·copy·overflow 계약, 기술 정책값 미설계 |

**Design Score: B+ static candidate.** 등록 `design-review` 스킬 실호출과 v9.3 prototype 픽셀 검증은 미충족이다.

## v24.3 레드팀과 셀프심문

레드팀 공격: 발행 모드가 테넌트·채널·유형 세 층이면 기존 단순 Settings보다 설정 오류가 늘고, 잘못된 자율 발행이 브랜드 사고로 이어진다.

수정: 편집 화면보다 `EffectivePolicyReview`의 최종 적용 결과를 승인 대상으로 둔다. 모든 제작·검수·발행 화면에서 현재 모드와 출처를 반복하고, 변경 전 영향 대기 건을 먼저 보여준다.

셀프심문: 이 계약이 틀렸다면 가장 그럴듯한 이유는 사람에게 읽히는 내보내기와 운영에 필요한 기계 형식이 충돌해 한쪽이 부실해지는 것이다. 그래서 README·Markdown·CSV·미리보기 인덱스를 필수 사람용 층으로, JSON을 보조 호환 층으로 분리했다. 실제 패키지 형식과 최대 크기는 eng-design에서 정한다.

SOURCES: `docs/design-docs/user-flow-openclaw-service-v9.3-gpt-codex.md` | `docs/제품구조-결정-2026-08-15.md` §9.5 | `docs/구현현황.md` | `dashboard/src/components/channel/AccountManager.tsx` | `dashboard/src/components/channel/SocialConnectButton.tsx` | https://support.buffer.com/en-us/articles/connecting-your-channels-to-buffer-HvWLgAJvL9 | https://help.hootsuite.com/hc/pt-br/articles/1260804308109-Connect-an-X-account | https://multithreaded.stitchfix.com/blog/2016/11/30/us-design-capture-style-preferences-during-sign-up/ | https://help-lb.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-freegopluspro-sora | https://www.twilio.com/docs/usage/api/usage-trigger | https://help.later.com/hc/en-us/articles/360042869414-Why-Is-My-Connection-Expired | https://sigmine.ai/

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 현재 설치된 스킬 중 제품 디자인 시스템의 상태·컴포넌트 계약을 개정하는 전용 매칭 스킬이 없었다. design.md rubric을 직접 적용했다.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵. openclaw-creative-brief는 제품 화면 설계와 범위가 달라 스킵.

# Marketing Agent 디자인 시스템 v24.4: 시장·언어·4층 조립·후보 선택

> STAMP: created_at=2026-08-15 20:28 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=matching skill 없음, design.md·doc-review.md 직접 적용 | evidence=user-flow openclaw-service v9.5, 제품구조 결정 §9.6·§9.7, current Studio implementation, USWDS·Shopify·Adobe Firefly·Shape of AI | deliberation=기존 셸과 토큰을 유지하고 이번 요청의 시장·언어·비용 통제만 관찰 가능한 화면으로 만든다

## v24.4 최종 권위와 정합 선언

이 절은 문서 앞쪽의 `v24.4 타깃 시장·출력 언어·후보 선택 디자인 계약` 전체를 최종 최신 계약으로 선언한다. 파일 병합 순서상 그 상세 계약 뒤에 v24.3 기록이 이어지지만, 타깃 시장, 출력 언어, 요청 조립 4층, 언어별 개인 취향, 저해상도 후보 3개, 선택본 단일 고해상도, 운영 예외 6개에 관해서는 v24.4가 우선한다. 나머지 발행 정책, 체험, 이동성, 내부 테스트는 v24.3을 그대로 계승한다.

최종 신규 component는 `MarketLanguageRequest`, `RecommendationBasisDrawer`, `BrandConstraintOnboarding`, `AssemblyLayerReview`, `LanguagePreferenceState`, `LowResCandidateSet`, `SelectedUpgradeReview`, `SelectedHighResProgress`, `MultilingualFeedback`, `OperatorExceptionSurface` 10개다. 신규 token은 0개이며 기존 8pt spacing, Pretendard, semantic color, panel 12, control 8을 유지한다.

최종 금지 패턴은 국기로 출력 언어 표시, 타깃 시장과 출력 언어 합치기, 요청 조립 4층 출처 감추기, 출력 언어별 취향 병합, 저해상도 후보 3개 선제 고해상도 제작, 미선택 후보 추가 과금 사후 고지, 검수 미완료 자율 발행, 운영자 BI 추가다.

정합 대상은 `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` 35장이다. 다음 디자인 루프는 390·1024에서 ML-01, AS-01, LC-01부터 LC-04, FB-01부터 FB-02, PF-01, OP-01부터 OP-06을 데이터량 0·정상·과다로 렌더하고 픽셀 영역별 대조해야 한다.

SOURCES: `docs/design-docs/user-flow-openclaw-service-v9.5-gpt-codex.md` 35장 | `docs/제품구조-결정-2026-08-15.md` §9.6·§9.7 | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `studio/docs/prd-studio-service-v1.2.1-gpt-codex.md` | https://designsystem.digital.gov/patterns/select-a-language/two-languages/ | https://shopify.dev/docs/storefronts/themes/markets/country-language-ux | https://helpx.adobe.com/firefly/web/work-with-images/generate-images/use-fast-mode-for-quick-image-generations.html | https://www.shapeof.ai/patterns/draft-mode

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 제품 디자인 시스템 개정 전용 매칭 스킬이 없어 design.md와 doc-review.md를 직접 적용했다.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵했다. openclaw-creative-brief는 제품 화면 계약과 범위가 달라 스킵했다.

# OpenClaw Service 디자인 시스템 v16 최종

> STAMP: created_at=2026-08-15 20:46 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | authority=latest

이 파일의 최신 제품 디자인 계약은 앞의 `OpenClaw Service 디자인 시스템 v16` 본문이다. 타깃 시장, 출력 언어, 추천 근거, 요청 조립 4층, 저해상도 후보 3개 비교, 선택본 1개 고해상도 제작, 미선택 후보 추가 과금은 v16 명세를 따른다. 발행 정책, 체험, 데이터 이동성, 내부 테스트, 운영자 예외는 앞선 기록을 그대로 계승한다.

다음 디자인 입력은 ML-01, AS-01, LC-01부터 LC-04다. 390·1024와 데이터량 0·정상·과다 prototype v25가 렌더되기 전 실제 화면 품질은 미검증이다.

SOURCES: `DESIGN.md` v16 본문 | user-flow v9.5 | 제품구조 결정 §9.6·§9.7 | PRD v8.2.1 | USWDS | Shopify | GOV.UK | Adobe Firefly | Midjourney

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 제품 디자인 시스템 개정 전용 매칭 스킬 없음.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵. openclaw-creative-brief는 제품 화면 설계와 범위가 달라 스킵.

# OpenClaw Service 프로토타입 v25 최종 권위

> STAMP: created_at=2026-08-16 00:24 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | authority=latest

이 파일의 최신 OpenClaw Service 디자인 계약은 `OpenClaw Service 디자인 시스템 v16`과 앞의 `OpenClaw Service v16 프로토타입 v25 정합 갱신`을 함께 따른다. v16의 토큰·컴포넌트·상태 정의는 유지하고, 실제 prototype 구현·반응형·픽셀 QA 결과는 v25 정합 갱신이 우선한다.

prototype v25에서 실제 렌더된 화면은 제작 요청, 질문 3개, 저해상도 후보 비교, 결과 편집, 발행 설정, 출력 언어별 취향, 운영 예외함이다. 라이트·다크와 390·1024, 데이터 채움·loading·empty·error·overflow 상태를 제공한다.

실제 Chrome 재검증 결과는 스크린샷 28장, 상태 조합 140건, console error 0건, page horizontal overflow 0건, 44px 미만 조작부 0건이다. 상세 정본은 `docs/prototype/qa-v25/qa-report-v25.md`다.

기술설계 진입은 독립 디자인 리뷰와 회장 승인 뒤에만 가능하다. 비용·시간 계산 계약, 실제 저해상도·고해상도 규격, 자율 발행 정책은 회수 필요 상태다.

SOURCES: `DESIGN.md` OpenClaw Service v16 | `DESIGN.md` OpenClaw Service v16 prototype v25 정합 갱신 | `docs/WIREFRAMES/openclaw-service-v25-gpt-codex.md` | `docs/prototype/openclaw-auto-osmu-v25-gpt-codex.html` | `docs/prototype/qa-v25/runtime-audit-v25.json` | `docs/prototype/qa-v25/qa-report-v25.md`

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: 없음. 제품 HTML 프로토타입 전용 매칭 스킬 없음.

SKILLS_SKIPPED: imagegen은 bitmap 과제가 아니므로 스킵. openclaw-creative-brief는 제품 화면 설계와 범위가 달라 스킵.


---

# Marketing Agent 프로토타입 v26 최종 권위 (매거진 허브)

> STAMP: created_at=2026-08-16 14:53 KST | model=claude-opus-5[1m] | agent=product-designer | authority=latest (marketing-agent 라인)

## v26 권위와 변경 범위

정본 프로토타입은 `docs/prototype/openclaw-auto-marketing-agent-magazine-v26-gpt-codex.html`이다.
v25의 **화면 콘텐츠 계약은 전량 유효**하고, v26은 **바깥 리뷰 컨테이너와 신규 블록 2개만** 더한다. 토큰은 새로 만들지 않고 이 파일의 기존 팔레트를 상속한다.

## 상속한 토큰 (신규 발명 0)

허브 크롬은 이 파일에 이미 정의된 다크 토큰을 그대로 쓴다.

| 용도 | 토큰 | 값 |
|---|---|---|
| 허브 배경 | `--hub-bg` | `#0A0A0B` (= 기존 `--bg` dark) |
| 허브 패널 | `--hub-panel` / `--hub-panel2` | `#161618` / `#1F1F23` (= 기존 `--surface` / `--surface-2` dark) |
| 허브 구분선 | `--hub-line` | `#27272A` (= 기존 `--border` dark) |
| 허브 본문 | `--hub-text` | `#F4F4F5` (= 기존 `--text` dark) |
| 허브 보조 | `--hub-dim` | `#A1A1AA` |
| 허브 메타 | `--hub-meta` | `#9496A0` (신규 1개. 10~11px 보조 텍스트가 `--hub-subtle #71717A`로는 WCAG AA 4.5:1을 못 넘겨 추가) |
| 허브 강조 | `--hub-accent` | `#3B82F6` (= 기존 `--accent` dark) |

신규 토큰은 `--hub-meta` 하나뿐이며 추가 사유는 접근성이다.

## Component inventory 추가 (v26)

| 컴포넌트 | 어디에 | 정의 |
|---|---|---|
| `hub-stamp` | 프로토타입 최상단 | 접히지 않는 스탬프 줄. 좌측 3px accent 보더 + 모노스페이스 11px. 항상 노출이 계약이다. |
| `matrix` (3축 토글) | 헤더 하단 | 뷰포트 4 / 유저 타입 4 / 데이터 상태 8. 버튼 높이 32px, 활성 상태는 accent 채움. |
| `sidenav` 흐름 색인 | 좌측 266px | 흐름 단계 그룹 헤더 + 번호(모노 11px) + 라벨 + 조건 태그(다음 줄). 활성 항목은 panel2 배경. |
| `device` + `frame` | 가운데 | `container-type: inline-size` 프레임. 폭 390/768/1024/1440. 390만 radius 30px(기기 느낌), 나머지 16px. |
| `sidecard` 근거 패널 | 우측 312px | 실구현 경로(모노, 초록 강조) + 3축 칩 + 설명 + 심리 근거(좌측 accent 보더) + 벤치마크(좌측 warning 보더) + 이전/다음 44px 버튼. |
| `v26-taste-group` | Studio 안 (D6) | 언어별 학습 항목 묶음. 항목 = 문장 + 출처 줄 + 고치기·지우기. |
| `v26-outlet` 표 | Studio 안 (D8) | 플랫폼 8행. 열 = 플랫폼·형식·현재 사실·사유·이번 작업 토글. 390에서 열 삭제 금지, 가로 스크롤로 보존. |
| `v26-focus` | 강조 | 흐름 색인이 가리키는 블록에 `outline: 2px accent, offset 3px`. 프레임이 그 블록으로 자동 스크롤한다. |

## Component inventory 추가 (v26.1, 회장 직접 조작 결함 수선)

| 컴포넌트 | 어디에 | 정의 |
|---|---|---|
| `v26-flash` 인라인 알림 | 화면 상단 · 모달 안 | 브라우저 대화상자(alert)를 대체하는 화면 안 알림. 제목 굵게 + 본문 한 문단. 톤은 기본·warning·danger. 다음 행동이나 단계 이동에서 스스로 사라진다. 모달 안에서 눌린 확인은 그 모달 안에 뜬다. |
| `make-steps` 제작 단계 바 | Studio 상단 | 5단계 알약. 활성은 accent 채움, 지난 단계는 완료 표시(✓). `.step-row.make-steps`는 줄바꿈 허용이라 390에서도 5개가 전부 보인다(가로 스크롤로 숨기지 않는다). |
| `v26-make-summary` 고른 값 요약 | 단계 바 아래 | 라벨 위·값 아래 2줄 조합. 단계가 진행될수록 항목이 누적된다. 값은 자르지 않는다. 390에서만 2열로 눕힌다. |
| `v26-make-nav` 단계 이동 | 단계 화면 하단 | 좌 이전(첫 단계에서는 비활성 + 사유 문구), 우 다음(다음 단계 이름 병기). 마지막 단계에서는 다음이 "승인 인박스로 보내기"로 바뀐다. |

**계약 3개 (v26.1):**
1. 프로토타입과 제품 화면은 브라우저 기본 대화상자를 쓰지 않는다. 확인·경고·완료는 전부 `v26-flash`로 화면 안에 남는다.
2. 화면을 이동해도 사람이 고른 뷰포트를 바꾸지 않는다. 화면 정의의 폭은 "권장" 표기로만 쓴다.
3. 제작 흐름은 한 화면 누적이 아니라 단계 화면 이동이다. 단계 화면에는 진행 표시, 이전으로, 고른 값 요약이 반드시 함께 있다.

## 반응형 계약 변경 (중요)

**기기 프레임 안의 반응형은 미디어쿼리가 아니라 컨테이너쿼리로 쓴다.**
미디어쿼리는 브라우저 창 폭을 보므로 프레임 안에서는 아무 반응도 하지 않는다. 프로토타입은 `@media` 를 `@container frame` 으로 변환해 프레임 폭에 반응하게 한다.
예외: `prefers-reduced-motion` 같은 사용자 환경 설정 쿼리는 미디어쿼리로 유지한다.

## 금지 패턴 추가 (v26)

- 프로토타입 허브에서 스탬프를 접거나 주석에만 두는 것. 화면에 안 보이면 없는 것이다.
- 뷰포트 토글을 "폰 프레임 중앙 정렬 프리뷰"로 갈음하는 것. 폭이 실제로 바뀌지 않으면 반응형 시연이 아니다.
- 심리 근거와 벤치마크를 소스 주석에만 두는 것. 우측 패널의 화면 문구여야 한다.
- 프로토타입 화면 목록을 문서에 손으로 옮겨 적는 것. 레지스트리에서 뽑아 생성한다. 손으로 옮기면 반드시 어긋난다.
- 좁은 폭에서 표의 열을 삭제하는 것. 가장 먼저 지워지는 열이 대개 가장 중요한 열("왜 이 상태인가")이다.
- (v26.1) `alert`·`confirm`·`prompt` 같은 브라우저 기본 대화상자. 프로토타입에서 이걸 쓰면 판단할 화면이 그 순간 사라진다.
- (v26.1) 새 창·외부 사이트로 나가는 동작. 외부 결과는 주소와 확인 시각을 화면 안에서 보여준다.
- (v26.1) 화면을 넘길 때 프레임 폭을 자동으로 바꾸는 것. 사람이 고른 폭이 우선이다.
- (v26.1) 한 화면에 설정을 전부 쌓고 마지막에 생성 버튼 하나를 두는 것. 결정이 여럿이면 단계로 나눈다.
- (v26.1) 진행 표시를 가로 스크롤 안에 숨기는 것. 남은 단계 수는 항상 보여야 한다.

## v26 Design review

| 항목 | 실측 |
|---|---|
| Design Score | A- |
| AI Slop Score | A |
| 콘솔 오류 / 렌더 실패 | 0 / 0 (42화면 전수) |
| 가로 넘침 | 0 (390·768·1024·1440) |
| 최저 텍스트 대비 | 7.05:1 (AA 통과) |
| 라벨 잘림 | 0 |
| 리테이크 | 6건 수정 후 통과 (`docs/prototype/qa-v26/README.md` §4.1) |

## 회수 필요 (하네스 결함)

**이 DESIGN.md는 3974줄이고 v16·v24.3·v24.4·v25·v26 이력이 append로 쌓여 있다.**
디자인 시스템 정본은 "지금 유효한 시스템"만 담아야 하고 스프린트 이력은 CHANGELOG로 가야 한다. 지금 구조는 어느 절이 유효한지 읽는 사람이 알 수 없다.
이번 작업에서는 다른 라인의 절을 지우면 그 라인 세션의 작업을 훼손하므로 append 규칙을 따랐다. **정리는 회장 판단이 필요하다.**

SOURCES: `docs/prototype/openclaw-auto-marketing-agent-magazine-v26-gpt-codex.html` | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v25-gpt-codex.html` | `docs/WIREFRAMES/marketing-agent-v26-gpt-codex.md` | `docs/design-docs/user-flow-openclaw-service-v9.6-gpt-codex.md` | `docs/prototype/qa-v26/README.md` | `docs/제품구조-결정-2026-08-15.md` §9.8 | `wiki/product/marketing-hub-surface-map.md` | `dashboard/src/**`

MODEL: claude-opus-5[1m]

SKILLS_USED: design-html(허브 컨테이너 구조), design-review(대비·터치타깃·슬롭·잘림 루브릭 실렌더 적용)

SKILLS_SKIPPED: design-shotgun(형식이 회장 지목 예시로 확정), design-consultation(토큰 상속이라 신규 시스템 제안 불요)

---

# v27 (유저플로우 v10.0 프로토타입) — 현재 유효분

정본 흐름: `docs/design-docs/user-flow-openclaw-service-v10.0-gpt-codex.md`
프로토타입: `docs/prototype/openclaw-auto-marketing-agent-magazine-v27-gpt-codex.html` (화면 27, 흐름 6그룹)

## v27에서 확정된 것 (v26 대비 변경분만)

| 항목 | v26 | v27 |
|---|---|---|
| 고객 사이드바 | 21항목(코드 실측. 위키의 26항목 기술은 낡음) | 흐름 9항목 + `회장 결정 대기` 5항목(보류 배지). 성과 항목은 첫 발행 전 비노출 |
| 채널 탭 | Growth·Popular 비활성 탭 2개씩 노출, 클릭 시 "연동 예정" 토스트 | `disabledTabs` 폐기. 안 되는 기능은 탭을 안 그리고 Settings 하단 "이 채널에서 아직 안 되는 것"에 적는다 |
| 제작 | 단일 폼 | 5스텝(Q-01 주제 → Q-02 시장·언어 → Q-03 표현 → T-01 플랫폼 → D-01 후보) + J-01 판단 화면 |
| 학습 정보 | 화면 없음 | L-00~L-05. 항목 문장 + 근거 + 강함/약함 + 항목 단위 삭제 |

## 컴포넌트 추가분 (기존 토큰 상속, 신규 색·서체 없음)

| 컴포넌트 | 규격 |
|---|---|
| 진행 표시 `.steps` | 높이 4px 바 n분할, gap 4px. done=accent, now=accent 55%, 대기=border |
| 근거 칩 `.chip` | radius 99px, 11px/650. blue=추천·강함, gray=가설·미연결, green=완료·연결됨, amber=보류·표본 적음, red=실패 |
| 정직 고지 `.note` | 좌측 3px 보더. 기본=accent, warn=warning, bad=danger, ok=success. 금액·무과금·정책 고지 전용 |
| 채널 헤더 | 아바타 32px `rounded-lg` `bg-surface-2` 고정(그라디언트 금지) + 채널명 + 상태 배지 5종 + 주 행동 1개 + `···` |
| 소재 자리표시 `.thumb` | 9:16 기본, `.wide` 16:9. 데스크톱 max-height 320px, 390 max-height 184px (접힘선 보호) |

## 계약

- 터치 타깃: 프레임 안 버튼 min-height 36px, 390 뷰포트에서 44px. 주 CTA 48px.
- 상태 정의: 화면마다 지원 상태를 선언하고 미정의 상태는 억지로 그리지 않는다.
- 유저 타입과 데이터의 정합: 첫 사용자에게 성과·지난 설정 데이터를 채워 보여주지 않는다.
- 외부 이동 0: 프로토타입 안에 바깥 링크·새 창·브라우저 대화상자를 두지 않는다. 원문 주소는 텍스트 표기.
- em dash 0.

## v27 Design review

| 항목 | 실측 |
|---|---|
| Design Score | A- |
| AI Slop Score | A (그라디언트 0, 이모지 0, em dash 0, 서체 1종) |
| 콘솔 오류 | 0 (27화면 × 유저 3 × 상태 5 = 405 조합) |
| 브라우저 대화상자 / 새 창 / 외부 링크 | 0 / 0 / 0 |
| 뷰포트 드리프트 | 0 (405 조합 전수) |
| 모달·오버레이 | 0 |
| 리테이크 | 3건 (자리표시 높이 상한, 모바일 터치 44px, 위계 역전 h2 제거) |

증거: `docs/prototype/qa-v27/README.md` + 캡처 24장

---

# 정보구조 3안 비교판 v1 (선택 대기, 확정 아님)

> STAMP: created_at=2026-08-17 KST | model=claude-opus-5[1m] | agent=product-designer | 상태=회장 선택 대기

산출물: `docs/prototype/openclaw-auto-ia-shotgun-v1-gpt-codex.html`
목적: v25·v26·v27이 정보구조와 제작 흐름을 하나로 확정해 가져와 반려됐다. 이 비교판은 3안을 나란히 놓고 고르게 한다.
캡처: `docs/prototype/qa-shotgun-v1/` 7장.

## 상속한 토큰 (신규 발명 0)

- 색: v26 라이트 팔레트(`--bg #fbfbfc` ~ `--danger #b91c1c`) + 허브 크롬은 v26 다크 토큰.
- 글자 크기 7단: `--fs-caption 12 / --fs-body-sm 13 / --fs-body 15 / --fs-lead 17 / --fs-h3 20 / --fs-h2 24 / --fs-h1 30`. **v27에서 누락됐던 이 7단을 되살렸다.** 앞으로 화면 산출물은 이 토큰만 쓴다.
- 간격 8pt: 4·8·12·16·24·32·48. radius: 카드 12px, 컨트롤 8px, 칩 99px, 모바일 프레임 30px.

## 비교판 컴포넌트 (신규 3개)

| 컴포넌트 | 규격 |
|---|---|
| `sumcard` 안 요약 카드 | 안 이름 + 한 줄 요약 + 좋음 2줄 + 주의 2줄. 라벨은 색이 아니라 글자("좋음"·"주의")로 구분한다(색만으로 뜻을 싣지 않는다) |
| `tradeoff` 아래 설명 | 각 안 프레임 아래 고정. "고르면 바뀌는 것" / "고르면 잃는 것" 두 항목 |
| 3축 토글 | 화면 3(첫 화면·제작 시작·후보 고르기) / 폭 2(390·1024) / 사용자 2(처음 가입·두 번째 이후). 높이 32px |

## 레이아웃 계약 (실측으로 정한 것)

- 390 폭: 세 안을 가로로 나란히. 프레임 높이는 고정하지 않고 내용 전체를 편다(잘림 0).
- 1024 폭: 세 안을 위아래로 이어 놓는다. 1024를 셋 나란히 두면 글자가 읽을 수 없게 작아지기 때문이며, 화면에 그 사유를 문장으로 적는다.
- 프레임 안 반응형은 `@container frame`으로만 쓴다. **`container-type`만 주고 `container-name`을 빼면 규칙이 통째로 죽는다.** 이번에 실제로 죽어 있었고 실렌더 측정으로 잡았다.

## 금지 패턴 추가

- 화면 이름과 라벨에 내부 코드(H-01·Q-01·D-01류)를 노출하는 것. 회장 화면에는 한국어 평문만.
- 제작 순서를 바꾸는 것. 매체 종류 → 발행 플랫폼 → 결과 후보. 이 순서는 회장이 직접 정정했다.
- 프레임에 고정 높이를 주고 내용을 안쪽 스크롤로 밀어 넣는 것. 회장이 스크롤해야 보이는 것은 보여준 것이 아니다.

## Design review 실측

| 항목 | 값 |
|---|---|
| Design Score | B+ |
| AI Slop Score | A (그라디언트 0, 이모지 0, em dash 0, 서체 1종, 중앙정렬 남발 0) |
| 콘솔 오류 | 0 (화면 3 × 폭 2 × 사용자 2 = 12조합 전수) |
| 가로 넘침 / 내용 잘림 | 0 / 0 (12조합 전수) |
| 브라우저 대화상자 / 외부 링크 / a 태그 | 0 / 0 / 0 |
| 내부 코드 노출 | 0 |
| 빈 화면 | 0 |
| 리테이크 | 3건 (컨테이너쿼리 이름 누락, 1024 세 번째 열 잘림, 프레임 고정 높이로 내용 잘림) |


---

# v29 현재 계약 (2026-08-17, product-designer)

정본 프로토타입: `docs/prototype/openclaw-auto-marketing-agent-magazine-v29-gpt-codex.html`
기반: v28 파일을 그 자리에서 이어 편집(전량 재작성 0) + 회장 직접 지적 6건 + 요청 원문 `docs/requests/2026-08-16-회장-유저플로우-전면개정.md`
실측: `docs/prototype/qa-v29/README.md`

## 정보구조 (24항목)

사이드바 Overview는 다섯 항목이다. **성과 · OSMU Studio · 승인 인박스 · 발행 캘린더 · 학습 정보.**
학습 정보는 회장 지시로 설정 하위에서 최상위로 올라왔다(`/taste`). 나머지 그룹은 `Sidebar.tsx` 그대로다.
합계 24 = Overview 5 · Social 5 · Messaging 3 · Video 2 · Data 1 · Keyword 3 · Custom 1 · Assets 3 · System 1.
프로토타입 전 화면 실측에서 고객 화면 136조합 전부 24항목으로 렌더된다(로그인 8, 운영자 8 조합은 고객 사이드바가 없는 화면이라 0).

## OSMU Studio의 역할

OSMU Studio는 **제작 요청을 만들어 스튜디오 쪽에 보내는 창구**다. 결과물의 종착지가 아니다.
생성 결과는 **승인 인박스**로 올라가고, 일정이 잡힌 건은 **발행 캘린더**에 나타난다. 취향은 **학습 정보**가 소유한다.
이 관계를 Studio 화면 상단에 라벨과 값 네 칸으로 항상 띄운다(이 화면 / 결과 도착 / 예약된 건 / 취향 반영).

## 한 화면 한 질문 (제작 흐름 강제 규칙)

제작 단계 화면은 **질문 하나 · 선택지 한 벌 · 다음 버튼 하나**로 끝낸다. 설명 블록을 위아래로 쌓지 않는다.
- 1단계 = 매체 종류. 학습 정보가 없는 사용자에게는 그 앞에 "먼저 취향을 알려주시겠습니까" 한 질문만 놓는다.
- 2단계 = 발행 플랫폼. 시장과 언어는 같은 화면에 겹치지 않고 자기 화면으로 분리한다.
- 4단계 = 판단(이대로 올리기 / 다른 안 더 보기 / 품질 높이기). 학습 동의는 다음 화면에서 따로 묻는다.
- 5단계 = 미리보기 편집. 텍스트 · 사진과 카드뉴스 · 짧은 영상 · 전달과 요약을 탭으로 가른다(쌓지 않는다).
- 진행 표시는 맥락 줄이지 질문이 아니다. 큰 제목을 두지 않고 단계 알약과 값 요약만 둔다.

## 문체 규칙 (프레임 안 = 제품, 프레임 밖 = 해설)

- 화면 안에는 **라벨과 값**만 둔다. 두 줄을 넘는 서술형 문단은 금지한다. 실측 0건이 합격선이다.
- 근거·비용·소요 시간은 문단이 아니라 한 줄 수치 필드(`.factline`)로 쓴다. 예: `예상 비용 1,200~2,100원 · 예상 소요 4~7분 · 근거 최근 3회 영상 저장 1위`.
- 안내 문장은 별도 상자로 띄우지 않고 선택지 묶음 바로 아래 부제(`.choice-sub`)로 흡수한다.
- 설명이 더 필요하면 매거진 우측 해설 패널로 보낸다. 심리 근거와 벤치마크 줄은 우측 패널에만 둔다.

## 간격

블록 사이 여백은 8 · 16 · 24 단계만 쓴다. 임의 px 금지.
`.panel + .panel` 16px, 제작 블록 사이 24px, 선택지 묶음과 그 아래 알림 사이 16px, 선택지 묶음과 제목 사이 8px.

## 매거진 셸 3열 규칙

좌측 흐름 색인(266px) · 가운데 기기 프레임 · 우측 해설 패널(300px)은 **어느 뷰포트를 골라도 나란히 유지**한다.
1440 프레임은 폭을 줄이지 않는다. 1440 CSS 픽셀 그대로 그린 뒤 남는 자리에 맞춰 축소해 보여준다(`fitDevice`).
안쪽 반응형은 컨테이너 쿼리라 축소와 무관하게 고른 폭 기준으로 돈다. 창이 1180px 미만이면 그때만 한 열로 접는다.

## 이번 판에서 늘어난 토큰

**0개.** 색 · 서체 · 글자 크기 단(12 · 13 · 15 · 17 · 20 · 24) · 간격 · radius 전부 상속.
새로 만든 CSS는 규칙 세 건뿐이다: 프레임 밖 h2를 20px 단으로 고정(브라우저 기본 22.5px가 7단 밖 값을 만들고 있었다),
`.factline` 수치 필드, `.choice-sub` 부제. 색은 기존 토큰만 쓴다.

## 금지 패턴 (추가)

- 화면 안에 두 줄 넘는 설명 문단을 쓰는 것. 제품 UI는 라벨과 값이다.
- 한 제작 화면에 질문을 둘 이상 두는 것.
- 안내 문장을 선택지 묶음 옆에 별도 상자로 붙여 여백 없이 다닥다닥 세우는 것.
- 1440에서 우측 해설 패널을 아래로 떨어뜨리는 것. 매거진 형식의 요지가 "프레임 옆에 근거"다.
- 학습 정보를 설정 하위로 되돌리는 것.
- 화면 이름과 라벨에 내부 코드를 노출하는 것. 한국어 평문만.

## design-review 실측 (v29)

| 항목 | 값 |
|---|---|
| Design Score | A- |
| AI Slop Score | A (그라디언트 2건 모두 플랫폼 미리보기 모형, 이모지 0, em dash 0, 서체 1종) |
| 화면 × 뷰포트 | 38 × 4 = 152조합 전수 |
| 프레임 안 두 줄 초과 문단 | 0 |
| 가로 넘침 | 0 |
| 3열 유지 | 152/152 |
| 사이드바 항목 | 고객 화면 136조합 전부 24 |
| 콘솔 오류 · 페이지 오류 | 0 · 0 |
| 버튼 전수 클릭 | 1,042회, 오류 0 |
| 명암비 AA 미달 | 0 (수선 2건: 수치 필드 라벨, 미리보기 카드 본문) |

---

# v30 계약 (2026-08-17, 회장 지적 5건 수선) — 현재 유효 정본

정본 프로토타입: `docs/prototype/openclaw-auto-marketing-agent-magazine-v30-gpt-codex.html`
기반 산출물: PRD `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` · 요청 원문 `docs/requests/2026-08-16-회장-유저플로우-전면개정.md` · 결정서 §9.6 §9.7 §9.8

## 학습 정보 화면 = PRD 분류가 곧 화면 구조

임의 분류를 만들지 않는다. PRD 용어 정의를 그대로 탭으로 옮긴다.

| 탭 | PRD 근거 | 화면이 반드시 보여야 하는 것 |
|---|---|---|
| 소재 | PRD 379행 소재(asset) 정의 | 이미지·영상·음성·로고·문서, 그리고 "업로드만으로 취향을 바꾸지 않음"이라는 성질 |
| 학습신호 | PRD 380행 학습신호(signal) 정의 | 선택·제안 채택·성과·트렌드 사건 목록 |
| 학습신호 세기 | PRD 301행 | 후보 셋 중 선택 = 강한 신호, 편집 수정 지시 = 약한 신호. 배지로 구분하고 같이 세지 않는다 |
| 취향 프로파일 | PRD 377행·FR-OS82-031 | 출력 언어별 분리, 판 번호, 교차 언어 이식 금지, 근거 없는 언어는 근거 부족 표시 |
| 근거 표시 | PRD 283행·AC-020 | 항목마다 근거 ID·기간·표본·한계 |
| 승인 대기 | AC-020 silent preference mutation 0 | 승인 전에는 프로파일에 반영되지 않는 대기 상태가 화면에 존재 |
| 출력 언어 | PRD 376행 | 취향 값이 아니라 요청 제약. 학습 정보 화면에 값으로 두지 않고 제작 2단계에서 묻는다 |

## 제작 흐름 (플랫폼은 입구가 아니라 출구)

1 매체 종류 · 2 시장과 언어 · 3 결과 후보 · 4 판단 · 5 결과 확정. 다섯 단계로 끝난다.
발행 플랫폼 고르기를 제작 단계에 두지 않는다(결정서 §9.8 D8). 만든 결과 하나를 놓고 승인 인박스에서 곳마다 올림·올리지 않음을 정한다.

## 화면 소속 계약

| 화면 | 소속 | 하는 일 |
|---|---|---|
| OSMU Studio | 제작 | 요청 만들기와 결과 확정까지 |
| 승인 인박스 | 검수 | 검토 · 플랫폼별 미리보기 편집 · 올림 여부 · 발행 결과 (탭 4개) |
| 발행 캘린더 | 일정 | 예약된 건 |
| 학습 정보 | 취향 | 소재 · 학습신호 · 취향 프로파일 · 승인 대기 · 새로 넣기 (탭 5개) |

## 비로그인 경계

로그인 없이 되는 것: 예시 결과 보기, 매체 고르기, 후보 받기. 계정을 요구하는 지점은 저장과 발행 두 곳뿐이다.
그 경계를 체험 시작 화면에 미리 적는다. 예고 없는 로그인 벽 금지.

## 컴포넌트 추가분 (신규 토큰 0)

- `.step-row[data-v30-taste-tabs]` · `.step-row[data-v30-inbox-tabs]`: 기존 step-pill을 쓰되 `flex-wrap:wrap`. 좁은 폭에서 탭이 잘려 사라지는 것을 막는다.
- `details.hub-stampbox`: STAMP를 한 줄 요약으로 접는다. 접힌 상태가 기본, 눌러서 펼침.
- 신호 세기 배지는 기존 `.status`(success · neutral · warning) 3종을 재사용한다. 새 색을 만들지 않는다.

## 금지 패턴 (v30 추가)

- 소재와 학습신호를 한 목록에 섞는 것. 파일을 올리면 취향이 바뀌는 것처럼 보인다.
- 강한 신호와 약한 신호를 같은 무게로 표시하는 것.
- 취향 프로파일 항목에서 근거 ID·기간·표본·한계 중 하나라도 빼는 것.
- 승인 없이 성과·트렌드를 프로파일에 자동 반영하는 것.
- 출력 언어를 취향 값처럼 학습 정보 화면에 저장하는 것.
- 제작 단계에서 발행 플랫폼을 고르게 하는 것.
- STAMP를 펼친 상태로 상단에 고정하는 것.
- 로그인 전에 아무 화면도 보여주지 않는 것.

## design-review 실측 (v30)

| 항목 | 값 |
|---|---|
| Design Score | A- |
| AI Slop Score | A (그라디언트는 플랫폼 미리보기 모형 2건뿐, 이모지 0, em dash 0, 서체 1종) |
| 캡처 | `docs/prototype/qa-v30/` 40장 (핵심 10화면 × 390 · 768 · 1024 · 1440) |
| 프레임 안 두 줄 초과 문단 | 0 |
| 3열 유지 | 40/40 |
| 가로 넘침 | 0 (수선 1건: 390에서 탭 묶음이 잘리던 것을 줄바꿈으로 흡수) |
| 사이드바 항목 | 24 (학습 정보 포함, 전 고객 화면 동일) |
| 지운 화면 | 0 (미리보기 편집·올림 여부·발행 결과는 삭제가 아니라 승인 인박스로 소속 이동) |
| 신규 토큰 | 0 |

> ⛔ 회수 필요: 이 DESIGN.md는 4300줄이 넘고 v26부터의 판별 이력이 그대로 쌓여 있다. 품질헌법은 DESIGN.md를 "지금 유효한 디자인 시스템만 150~300줄"로 규정한다. 판별 이력은 `docs/session-logs/`로 옮기고 이 문서를 현재 계약만 남겨 재편해야 한다. 이번 작업 범위(프로토타입 수선)에서 임의로 지우면 상류 승인 없이 정본을 훼손하므로 손대지 않았다.

---

# v31 계약 (2026-08-17, 제작 흐름을 양식에서 제안으로) — 현재 유효 정본

정본 프로토타입: `docs/prototype/openclaw-auto-marketing-agent-magazine-v31-gpt-codex.html`
기반 산출물: 회장 원문 `docs/requests/2026-08-16-회장-유저플로우-전면개정.md` · `wiki/architecture/two-service-boundary.md` · PRD `docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
실측: `docs/prototype/qa-v31/README.md` (188조합 전수 · 캡처 41장)

## 이 판의 원칙: 화면은 묻지 않고 먼저 만들어 보여준다

회장 원문: "유저는 클릭 클릭 선택만으로 컨텐츠를 만든다는게 핵심. 백지공포해소를 해야하는데 화면 보면 더 공포스럽겠다."

앞판이 무서웠던 원인은 못생김이 아니라 **화면마다 사용자에게 답을 요구한 것**이다.
묻는 화면은 아무리 다듬어도 백지 공포를 줄이지 못한다. 그래서 순서를 뒤집었다.

- 제작 첫 화면은 **오늘의 제안 다섯 장**이다. 스튜디오가 취향·성과·트렌드로 미리 만들어 둔 후보이고, 카드 안에 실제 나갈 문구가 들어 있다.
- 카드마다 **근거 한 줄 · 예상 비용 · 예상 소요 · 올릴 수 있는 곳**을 값으로 붙인다. 고르는 자리에서 판단이 끝나야 한다.
- **고르는 것이 곧 진행이다.** 고른 뒤 "다음"을 또 누르게 하지 않는다. 그 한 번이 클릭 수를 두 배로 만든다.
- 직접 주제를 넣는 길은 **보조 경로**로 남긴다. 화면이 어느 쪽이 주 경로인지 먼저 밝힌다.
- 학습 입력은 **관문이 아니다.** 학습은 고르는 행동에서 쌓이고, 학습 정보 화면은 열람·교정용이다.

## 제작 단계 (5 → 4)

`1 오늘의 제안 · 2 결과 후보 · 3 판단 · 4 결과 확정`

매체 종류와 시장·언어는 삭제하지 않았다. 제안을 고르는 순간 함께 정해지고, 직접 정하고 싶으면 1단계 안의 **직접 넣기 보조 경로**에서 고른다.

## 최소 클릭 경로 (화면 문구와 실측이 같아야 한다)

**확정까지 클릭 3회 · 발행까지 클릭 4회.** 활성 고객과 첫 가입자 모두 같다.
이 수치를 제안 덱 화면에 값으로 적는다. 화면에 적은 수치와 실측이 어긋나면 그 자체가 결함이다.

## 첫 가입자 계약 (학습 0)

빈 화면을 보여주지 않는다. 업종 하나가 기본으로 골라져 있고 그 기준의 제안이 이미 깔려 있다.
브랜드 자료 반입은 "더 맞추기"이지 통과 조건이 아니다. **접힘선 위에 제안이 최소 한 장 보여야 한다**(390 기준).

## 신규 컴포넌트 (신규 색·서체·글자 크기 단 0)

| 컴포넌트 | 규격 |
|---|---|
| `.v31-deck` | 제안 격자. 1열 → 720px 2열 → 880px 3열. 컨테이너 쿼리 |
| `.v31-card` | 제안 카드. 배지 · 제목(15px) · 실문구 미리보기 · 값 두 줄 · 근거 한 줄 |
| `.v31-prev` | 카드 안 미리보기. 첫 문장 2줄 말줄임, 부속 2줄 말줄임. 길이가 달라도 카드 높이가 흔들리지 않는다 |
| `.v31-why` | 근거 한 줄. `--muted` (AA 4.5 이상) |
| `.v31-meta` | 값 줄. 예상 비용 · 소요 · 올릴 수 있는 곳 |

## Shapes (radius 토큰 전용)

`--radius:12px`(카드) · `--control:8px`(컨트롤) · `--pill:99px`(칩·알약) · `50%`(원형 아바타).
**리터럴 radius 금지.** v31에서 `9px` 2곳, `10px` 10곳, `999px` 8곳이 섞여 있던 것을 토큰 참조 47곳으로 정규화했다.

## 화면을 덮지 않는다

대화 상자로 화면을 덮지 않는다. 같은 내용을 **그 자리 아래 패널**로 편다.
덮는 방식은 지금 무엇을 보고 있었는지를 지워 백지 공포를 키운다.
`.overlay`는 `position:static`, `.dialog`는 일반 패널이다. 내용과 닫기 버튼은 유지한다.

## 금지 패턴 (v31 추가)

- 제작 첫 화면을 질문이나 빈 입력란으로 시작하는 것.
- 아직 아무것도 고르지 않았는데 요약에 값을 미리 채워 두는 것. 화면이 거짓말을 한다.
- 고른 뒤 "다음"을 또 누르게 해 클릭을 두 배로 만드는 것.
- 학습 입력을 제작의 관문으로 되돌리는 것.
- 제안 카드에 자리표시 문장을 넣는 것. 실제 나갈 문구만 넣는다.
- 첫 가입자 화면에서 제안을 접힘선 아래로 미는 것.
- 화면을 덮는 대화 상자를 다시 만드는 것.
- radius를 리터럴 값으로 쓰는 것.

## design-review 실측 (v31)

| 항목 | 값 |
|---|---|
| Design Score | A- |
| AI Slop Score | A (그라디언트는 플랫폼 모형 3건뿐 · 이모지 0 · em dash 0 · 서체 1종) |
| 화면 × 뷰포트 | 47 × 4 = 188조합 전수 |
| 프레임 안 두 줄 초과 문단 | 0 |
| 가로 넘침 · 3열 유지 | 0 · 188/188 |
| 버튼 전수 클릭 | 1,759회 · 오류 0 |
| 화면을 덮는 대화 상자 | 0 (14곳을 제자리 패널로 전환) |
| 제품 UI 명암비 AA 미달 | 0 (수선 2건) |
| 지운 화면 · 신규 토큰 | 0 · 0 (radius `--pill` 1개는 기존 값 99px의 이름 부여) |
| 리테이크 | 6건 |

미해결: **모션 토큰 부재.** 품질헌법 §11의 duration·easing 토큰이 없다. 다음 판 1순위.
