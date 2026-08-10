# OSMU Marketing Agent wireframes v16

> STAMP: created_at=2026-08-06 14:56 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer / marketing_agent_v16 | skills=design-review | evidence=current Marketing Hub shell, route owner and provider component inventory | deliberation=26개 메뉴를 하나의 home 템플릿으로 속이지 않고 route family별 화면, 탭, 계정, 행동을 따로 고정했다

## Shared shell

### WF-00 Customer shell

Purpose: 26개 목적지의 위치와 역할을 항상 알게 한다.

Elements:

- 224px current Sidebar, Marketing Hub mark, workspace `OSMU 팩토리`
- current 9 navigation groups and 26 destinations
- active route background and right accent border
- ThemeToggle, logout
- top route chip, customer/operator inspector, state inspector, viewport inspector
- 390px sticky mobile header and full-height drawer

States: Sidebar loading, workspace error with retry, drawer open/closed, light/dark, customer/operator.

Interactions: nav click changes to unique route view, active state and route chip together. No item returns to another owner.

## Marketing Agent loop screens

### WF-01 Performance and next decision, `/`

Purpose: 성과 홈을 보존하면서 이번 주의 다음 결정 하나를 앞에 둔다.

Elements:

- header `성과`
- strong anchor `이번 주에 먼저 확인할 일`
- confirmed Brand Fact with source path and updated_at
- Threads opportunity with source, collected_at, scope, confidence
- 7-day plan summary and approval state
- customer-language progress: 사실, 기회, 계획, 제작, 승인, 발행, 성과, 다음 실험
- current overview, activity, alerts, weekly, usage and error summaries below

States: loading, no fact, no opportunity, ready, source error, sample hold, next experiment approved.

Interactions: brand setup to Studio, evidence to Threads Popular, plan to Studio, review to Inbox, schedule to Calendar, metric to Threads Analytics.

### WF-02 Studio, `/studio`

Purpose: current existing9 and inventories를 그대로 유지하며 plan context를 card1에 연결한다.

Preserved elements:

1. idea input
2. brand guide and wizard
3. GitHub RepoConnect
4. wiki-grounded generation and source citation
5. image generation operator boundary
6. video generation and handoff
7. visual7 previews
8. draft, history, local restore
9. direct4 publish, schedule, account selection, result

Inventory regions:

- text8: Threads, X, Facebook, Instagram, Telegram, Discord, Slack, LINE
- visual7: Threads, X, Facebook, Instagram, Shorts, Reels, TikTok
- direct4: Threads, X, Facebook, Instagram
- video3: Shorts, Reels, TikTok to `/videos`

Per card: account, citation, character/media status, Edit, individual Publish, individual Schedule.

Bulk: explicit checked IDs, Publish selected, Schedule selected. Hidden filtered selection 0.

States: empty, brand missing, generating, partial generation, saved, over limit, operator-only, published, failed_confirmed, uncertain, repair_required.

### WF-03 Approval Inbox, `/inbox`

Purpose: current legacy queue origin과 campaign review를 구분하고 공개 직전 진실을 확인한다.

Elements:

- origin filter `Legacy Queue` and `Marketing Agent`
- one selected Threads native preview
- fact citation, handle, status, verified_at, capability, timing, content count
- approval hash summary
- edit in Studio, approve immediate, approve schedule, hold
- result state with external ID and permalink

States: empty, loading, ready, stale account, missing citation, approval expired, partial, uncertain, repair_required, published.

### WF-04 Publishing Calendar, `/calendar`

Purpose: queue-derived calendar라는 current truth를 보존하고 exact schedule actions로 이동한다.

Elements:

- month and date navigation
- 7-column grid
- date list with item ID, channel icon, account handle, schedule state
- single schedule edit/cancel
- bulk schedule summary with explicit selected IDs
- `Studio에서 예약 만들기`

States: loading, empty, invalid past time, DST ambiguity, account revoked, partial schedule.

## Platform family screens

### WF-05 Threads, `/channels/threads`

Purpose: 현재 가장 넓은 social capability를 그대로 보여준다.

Header:

- Threads SVG, `OSMU 팩토리 @osmu.official`
- `정상`, `기본 계정`, `마지막 확인 2026-08-06 13:40 KST`
- `계정 관리`

Tabs: Queue, Analytics, Growth, Popular, Settings.

Queue interaction: draft opens Studio or Review. Analytics shows native metric definitions and collected_at. Growth shows follower history. Popular shows source and collected time. Settings shows OAuth primary and account rows.

States: connected, expired, revoked, mismatch, provider unreachable, no post, native zero, sample hold.

### WF-06 Instagram, `/channels/instagram`

Purpose: current specialized Editor를 generic social tab에 잃지 않는다.

Header: `@osmu.visual`, connected state, verified_at, Manage.

Tabs: Queue, Editor, Settings.

Editor: topic, AI outline, slide text, style, preview, drag order, queue draft save. Settings: OAuth primary, accounts, Advanced manual Graph token collapsed.

States: disconnected, reconnect required, missing media, card generation error, draft saved.

### WF-07 X, Facebook, Bluesky

Purpose: generic social family의 공통 3탭과 플랫폼 계정 차이를 같이 보여준다.

Tabs: Queue, Analytics, Settings.

Unique account rows:

- X: `@osmu_official`, OAuth 1.0a Read and Write
- Facebook: `OSMU 공식 페이지`, Page status
- Bluesky: `@osmu.bsky.social`, App Password recovery

States: connected, not connected defaults to Settings, permission, provider unavailable.

### WF-08 Telegram, Discord, Slack

Purpose: connection/setup surface를 Queue/Analytics처럼 위조하지 않는다.

Elements:

- platform title and exact route
- credential or OAuth panel
- Channel Info: status, handle or destination, verified_at
- Setup Guide
- text8 Studio handoff note

Unique connection:

- Telegram: bot token, `@osmu_notice_bot`
- Discord: webhook, `#marketing-publish`
- Slack: OAuth or webhook, `OSMU 운영`

States: no credential, verifying, connected, failed verification, revoked.

### WF-09 YouTube and TikTok channel connection

Purpose: connection owner와 `/videos` workbench를 분리한다.

Elements: provider account, status, verified_at, Manage, connection guide, `영상 작업실 열기`.

States: connected, review pending, expired, unsupported direct Studio publish.

## Data, keyword, blog and asset screens

### WF-10 Blog Performance, Search Console, Google Analytics

- Blog Performance: posts, views, sources, collected_at, API error.
- Search Console: credential/cache, query rows, refresh, permission error. 390 overflow target 0.
- Google Analytics: customer GA4 unavailable. No chart or zero metric. Terminal link to Settings or documentation.

### WF-11 Keyword Planner, Search Advisor, Naver Trends, Google Trends

- Keyword Planner: seed, research action, keyword bank table.
- Search Advisor: disabled pending tenant storage and reason.
- Naver Trends: unavailable tenant view and next action.
- Google Trends: external guide and external destination. Integrated claim 0.

### WF-12 Blog, `/blog`

Purpose: generic channel dispatch가 아닌 별도 blog domain을 보존한다.

Tabs and regions: queue, editor, guide, keywords. Actions: create, edit, approve. Studio bulk publishing does not absorb this queue.

### WF-13 Images, `/images`

Elements: tenant gallery, upload, copy URL, delete with confirmation.

States: loading, empty with upload action, upload error, permission.

### WF-14 Videos, `/videos`

Elements: file upload, YouTube URL, generate, repurpose, external clipper handoff, wiki refinement, Shorts/Reels/TikTok variants, YouTube/TikTok readiness and publish.

States: upload, processing, clips ready, silent narration warning, provider review pending, failed, published.

### WF-15 Midjourney, `/channels/midjourney`

Purpose: customer와 operator capability boundary를 정직하게 표시한다.

Customer state: `운영자 전용`, no generation call, operator contact.

Operator state: credential and status management only. Customer media is not mixed.

## Settings and role screens

### WF-16 Settings, `/settings`

Customer tabs 8:

1. Channels
2. AI Engine
3. Storage
4. Design Tools
5. Notifications
6. Fork 연동
7. Keywords
8. System

Operator tabs 9: customer set plus Video / TTS.

Channels tab repeats handle, status, verified_at, Manage for each platform. A disconnected account shows Connect. Manual secrets are masked and advanced.

### WF-17 Operator shell

Elements: Admin identity, operator customers only, no customer workspace, no Marketing Agent card. Settings role inspector shows 9 tabs.

## State inspector

The prototype toolbar can force these cross-screen fixtures:

- ready
- loading
- empty
- error
- permission
- uncertain
- repair

Each forced state changes the active owner screen without changing route identity. It never returns to home.

## Responsive wireframe

### 1440

- 224 Sidebar
- route body max 1180
- two-column workspace where useful
- account and evidence rail 300

### 1024

- 224 Sidebar
- route body single main column
- tabs and preview rails use internal scroll
- page overflow 0

### 390

- Sidebar replaced by 54px sticky top bar
- 44px Menu and Theme controls
- drawer width min(344px, 88vw), 26 destinations
- one-column content, no fixed-width tables
- Studio and tabs only use internal horizontal rails
- page overflow 0, touch target at least 44px

## Prototype interaction inventory

- nav 26 unique route destinations
- theme light/dark
- viewport 1440/1024/390
- role customer/operator
- state ready/loading/empty/error/permission/uncertain/repair
- provider tab switching with family-specific tabs
- account Manage and Connect feedback
- home opportunity to Threads Popular
- plan approval to Studio
- Studio draft generation, card edit, individual publish, bulk publish, single schedule, bulk schedule
- Studio to Inbox review
- Inbox approve immediate or schedule
- uncertain to result check only
- repair to internal record repair only
- Calendar item edit/cancel
- result permalink feedback
- experiment approve or hold
- Settings 8/9 role parity

## Design review

Classifier: APP UI. First impression is route identity and next action, not generic cards.

Design Score: **A**. AI Slop Score: **A**.

Hard rejection patterns: 0. 26 destination home bounce: 0. Provider family flattening: 0. Dead-end target: 0.

## Red team and self-question

Red team: A competitor would attack the shared renderer as a fake route implementation. Revision: every destination has unique route, title, capability family, tabs, account or state truth, and owner-specific primary action. Route audit checks uniqueness.

Self-question: If this wireframe is wrong, actual data-heavy screens may need more density than the prototype. Revision: preserve owner actions and state semantics now. Raster and data density remain build/QA evidence, not a design completion claim.

## 회수 필요

- 회수 필요: actual provider OAuth, publish and native metric are not verified by this prototype.
- 회수 필요: engine contracts for retry, reconcile and repair require eng-design.
- 회수 필요: actual React 390 route26 measurement requires build/QA.

SOURCES: `DESIGN.md` v16; `docs/user-flow-marketing-agent-v16-gpt-codex.md`; current `dashboard/src` shell/channel/Studio/Settings components; `wiki/product/marketing-hub-surface-map.md`; `wiki/product/studio.md`; https://support.buffer.com/article/961-using-post-groups-in-buffer; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets; https://www.hootsuite.com/platform/social-media-approval-tool

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-review for APP UI hierarchy, route and flow audit, responsive states and score

SKILLS_SKIPPED: imagegen, no bitmap asset required
