	# Marketing Hub OSMU 디자인 시스템 v12

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

Additive:

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

## v18 interaction retake addendum — 2026-08-07

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

⛔ 회수 필요: the independent reviewer must re-run M01–M14/MINOR6 and issue the governing grade. Prototype interaction still does not prove external OAuth/publish/analytics or server persistence.

## v18 M09/M13/M14 closure contract — 2026-08-07

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

Non-GUI evidence: `/private/tmp/marketing-v18-static-dom-qa.cjs` completed 181 assertions, 48 recovery fixtures and 12 interaction combinations with 0 failures. This proves DOM semantics and registered transitions, not screenshot pixels. The independent v3 review closed M01–M08 and M10–M12 but kept M09/M13/M14 open; this retake supplies static closure evidence for M09/M13 and the testable M14 contract. M14 remains browser-evidence pending until the parent captures and measures all 12 combinations.

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

## v18 FINAL M14 고객 언어 계약 — 2026-08-07

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
