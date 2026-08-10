# OSMU Marketing Agent wireframes v17

> 🏷 STAMP | line: marketing-agent-design | 생성: 2026-08-06 18:43 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer / marketing_agent_design_v17 | skills: brand-positioning-kit | 근거: DESIGN v17, user flow v17, 승인 PRD v7.2.1, current Marketing Hub shell and owner components | 고민: 현행 26개 화면을 같은 템플릿으로 평준화하지 않고 생성, 게시, 영상, 계정, 성과, 설정, Admin의 고유 목적을 보존했다.

## Shared shell

### WF-00 Customer shell

Purpose: 현재 위치, workspace, 전체 목적지를 잃지 않게 한다.

Elements:

- 224px current Sidebar with Marketing Hub stacked-square mark
- workspace `OSMU 팩토리`
- current SVG icons and semantic active state
- Overview, Social 게시물, Social 짧은 영상, Messaging, Data & Analytics, Keyword Research, Custom Integration, Assets & Tools, System groups
- 26 destination buttons
- Theme toggle and logout
- 390 sticky header, Menu button, full-height drawer
- prototype-only toolbar: 1440, 1024, 390, state, role, theme

States: workspace loading, workspace error, customer ready, drawer open, drawer closed, light, dark.

Interactions: destination click changes route title, active nav, view and terminal action. No destination bounces to home.

### WF-00A Operator shell

Purpose: customer product and operator administration are physically separate.

Elements:

- Admin identity and operator console label
- Customers, OAuth Apps, Usage, Support & Recovery local sections
- no customer workspace
- no customer 26-destination menu
- no Studio publish action

States: operator checking, invalid token, ready, repository unavailable, permission blocked.

Interactions: customer pause/resume, shared AI approve/revoke, OAuth credential set save/reveal/hide/delete, support recovery without external repost.

## Product loop screens

### WF-01 Performance home, `/`

Purpose: 합산 가능한 운영 상태와 다음 콘텐츠 변경 하나를 보여준다.

Above fold:

- title `성과`
- continuity chip `봄 클래스 모집, 마지막 확인 · 수정 3`
- primary decision `다음 초안은 첫 문장을 질문형으로 바꾸기`
- observation `Threads 답글이 지난 게시물보다 늘었지만 표본은 한 건`
- limitation `다른 채널은 아직 성과를 수집하지 못함`
- actions `다음 초안에 반영`, `표본 더 모으기`

Aggregate strip:

- 게시 시도
- 게시 성공
- 게시 실패
- 처리 중
- 성과 수집 범위
- 확인된 게시물 수 per content bundle
- account readiness

Native truth table:

- Threads, X, Facebook, Instagram Feed, Bluesky, YouTube Shorts, Instagram Reels, TikTok
- collected row: metric definition, source, window, collected time, account, publication link
- not-collected row: `해당 없음: 미수집`, reason, capability check, next action, three N/A fields
- no cross-provider reaction total

States: loading one shimmer, empty no publication, partial coverage, permission, stale, degraded, error, success.

Interactions: next change to Studio, collected row to platform Analytics, reconnect to account owner, publication link opens external result.

### WF-02 Studio, `/studio`

Purpose: 브랜드 근거에서 세 레일 콘텐츠를 만들고, 플랫폼별 수정, 저장, 정책별 실행을 한 화면에서 끝낸다.

Preserved toolbar:

- idea input
- brand setup
- GitHub RepoConnect and wiki input
- `OSMU 초안 만들기`
- `저장`
- selected publish action
- `예약` and SchedulePanel
- draft/history rail
- image and video operator notice

Grounding panel:

- `브랜드 소개와 가격표에서 확인`
- selected source names in customer language
- unknown claim warning with `근거 확인`
- continuity chip title and revision

Desktop layout:

```text
[Studio toolbar and source truth]

텍스트 게시물
[Threads card] [X card] [Facebook card]
[Bluesky card] [Instagram caption/card context]

짧은 영상
[Shorts 9:16] [Reels 9:16] [TikTok 9:16]

카드뉴스
[Instagram large preview + slide rail] [caption and slide controls]

[커뮤니티로 보내기 OFF]
[sticky selected action bar]
```

Text card elements:

- current native preview styling
- account handle
- character and media requirement
- source state
- Edit
- `저장`
- policy-derived action
- `예약` or `예약 승인 요청`
- result

Short video card elements:

- 9:16 preview or actual video controls
- hook and caption
- selected account
- source, license, person consent, AI disclosure
- readiness reason
- progress state
- `영상 작업으로 보내기`
- policy-derived execute action when ready

Card news elements:

- Instagram carousel preview
- topic, slides, caption, hashtags
- add, remove, reorder, upload
- queue draft save
- Midjourney customer raw token input 0

Community handoff:

- switch default OFF
- review-complete explanation
- Telegram, Discord, Slack destination checkboxes shown only after ON
- message preview
- policy-derived now, approval, schedule action
- cancel returns delivery count to 0

States: source missing, empty, generating, partial generation, blocked claim, over limit, missing media, video account needed, video rights unknown, saved, approval-required, direct, uncertain, repair, success.

Interactions: per-card edit changes one revision only; Save persists all selected revisions; policy action projects to Queue or Videos and Inbox/Calendar; hidden filtered selection 0.

### WF-03 Approval Inbox, `/inbox`

Purpose: 같은 콘텐츠를 외부 공개 전에 검수한다.

Elements:

- filters: 게시물, 짧은 영상, 커뮤니티 공지
- selected continuity chip
- native preview
- source truth
- account identity
- last checked
- required permissions
- content and media readiness
- schedule or immediate intent
- activity comments
- `승인`, `수정 요청`, `보류`
- result state after approval

States: empty, loading, ready, source blocked, account stale, permission, approval expired after edit, partial, uncertain, repair, success.

Interactions: edit opens Studio or Videos, approve executes same content, schedule opens Calendar, reject keeps content editable.

### WF-04 Publishing Calendar, `/calendar`

Purpose: Studio와 Inbox에서 시작한 예약을 같은 항목으로 관리한다.

Elements:

- month and list views
- continuity chip in each event
- platform icon and account
- requested, waiting approval, scheduled, processing, cancelled states
- change, cancel, open source actions
- `Studio에서 예약 만들기`

States: loading, empty, requested approval, scheduled, invalid past time, timezone ambiguity, revoked account, partial, error.

Interactions: change schedule, cancel one item, open same item in Studio, Inbox or Videos.

## Platform owner screens

### WF-05 Account truth header7

Used by Social5, Messaging3, YouTube, TikTok, Midjourney.

Exact order:

1. icon and account name
2. connection state and reason
3. last checked
4. action readiness
5. granted permissions
6. expiry and refresh health
7. manage or reconnect

Desktop uses a two-row definition grid. 390 stacks fields. Non-applicable values use `해당 없음: reason`.

### WF-06 Account switch panel

Purpose: 다른 계정을 안전하게 선택한다.

Elements:

- current account
- desired account or choose prompt
- provider account picker handoff
- returned account
- permissions and refresh health
- progress: 연결 시작, identity 확인, 권한 확인, 자동 갱신 확인
- actions: `다른 계정으로 연결`, `다시 선택`, `기존 계정 유지`

States: ready, connecting, cancel, mismatch, expired, revoked, success.

Constraint: provider access and refresh token strings do not exist in customer DOM.

### WF-07 Threads, `/channels/threads`

Tabs: Queue, Analytics, Growth, Popular, Settings.

Queue:

- continuity chip
- draft, approval, scheduled, processing, published, failed, uncertain, repair
- edit, policy action, schedule, result

Analytics:

- native metric definition
- source, window, collected time, account, publication
- next-change action only when evidence exists

Growth and Popular are preserved. Popular is an idea source, not a confirmed brand fact.

### WF-08 X, Facebook, Bluesky

Tabs: Queue, Analytics, Settings only when capability-backed.

Unique account truth:

- X: OAuth read and write state
- Facebook: Page identity and publish scope
- Bluesky: handle, DID-facing identity hidden behind customer label, App Password recovery

States: connected, not connected, permission, stale, provider unavailable, not-collected analytics.

### WF-09 Instagram, `/channels/instagram`

Tabs: Queue, Editor, Settings.

Elements:

- Header7 for Instagram account
- Feed queue
- existing Card News Editor
- `Reels 영상 작업 열기` to `/videos` filtered Reels
- Settings with OAuth primary; duplicate manual credential is advanced and clearly secondary if retained

No generic Analytics tab. No separate Instagram Reels account.

### WF-10 Telegram, Discord, Slack

Purpose: connection and community destination setup only.

Elements:

- Header7 with N/A reason per method
- bot, webhook or OAuth setup
- destination name
- setup guide
- `Studio에서 커뮤니티 공지 만들기`

No Queue and no Analytics.

### WF-11 YouTube Shorts and TikTok

Purpose: account readiness and video workbench handoff.

Elements:

- Header7
- channel or creator identity
- granted scopes
- expiry and refresh health
- content posting readiness
- provider review or permission reason
- `영상 작업실 열기`

No text Queue and no invented Analytics.

## Video workbench

### WF-12 Videos, `/videos`

Purpose: actual short-video job and publish flow.

Regions:

1. Library and upload
2. Long video URL or file
3. Candidate list
4. Selected clip refine
5. Ranking explanation
6. Add one or all to library
7. Shorts, Reels, TikTok variants
8. YouTube account and title, description, tags
9. TikTok account, privacy, comments, duet, stitch, AI disclosure
10. Reels readiness
11. rights, license, person consent
12. policy-derived immediate or approval action
13. async progress and result proof
14. uncertain result check and internal repair

Job card repeats `봄 클래스 모집, 마지막 확인 · 수정 3`.

States: upload, loading one progress, empty candidates, clips ready, operator generation unavailable, rights blocked, account needed, review needed, processing, partial, failed, uncertain, repair, success.

Interactions: upload, make candidates, refine one, add, select account, edit metadata, confirm rights, request approval or publish, poll result, open external proof.

## Analytics screens

### WF-13 Aggregate and native truth

Aggregate module includes only seven operational measures. Native rows are not summed.

Collected row visual order:

```text
[Channel + format] [native value]
뜻: ...
출처: ...
확인 기간: ...
수집: ...
계정: ...
게시물: [실제 게시물 보기]
```

Not-collected row visual order:

```text
[Channel + format] 해당 없음: 미수집
이유: ...
확인 기준: ...
확인 기간: 해당 없음: 미수집
수집: 해당 없음: 미수집
게시물: 해당 없음: 미수집
[권한 연결 or 다시 확인 or 다른 성과 보기]
```

States: collected, no data, partial, permission, stale, error, unsupported.

## Data and keyword owners

### WF-14 Blog Performance, Search Console, Google Analytics

- Blog Performance: period input, published posts, search visits, source and checked time, Blog link.
- Search Console: credential and cache state, query table, refresh, permission recovery, 390 table adaptation.
- Google Analytics: truthful unavailable state, no fake chart, Settings terminal action.

### WF-15 Keyword Planner, Search Advisor, Naver Trends, Google Trends

- Keyword Planner: seed, research action, keyword bank, `계획 후보로 보내기`.
- Search Advisor: tenant storage not ready, reason, Settings action.
- Naver Trends: unavailable reason, alternative research action.
- Google Trends: external guide, external link, integrated data claim 0.

### WF-16 Blog, `/blog`

Separate queue, editor, guide and keywords. New post, save draft, approve. Studio social queue does not absorb it.

## Assets and safe-disabled

### WF-17 Images, `/images`

Tenant gallery, upload, URL copy, delete confirmation, source and rights. Loading, empty, upload error, permission, success.

### WF-18 Midjourney, `/channels/midjourney`

Customer:

- Header7 with external tool N/A fields
- `현재 안전하게 제공하지 않습니다`
- reason: customer raw Discord token not accepted
- `Images 열기`
- no fake generate

Operator:

- credential status and service boundary in Admin only
- no customer asset mixing

## Settings and token screens

### WF-19 Customer Settings, `/settings`

Tabs preserved: Channels, AI Engine, Storage, Design Tools, Notifications, Fork 연동, Keywords, System.

Channels:

- platform account summary using Header7 condensed order
- manage and reconnect

System:

- `게시 전 승인 필요`
- owner editable, member read-only
- current value, consequence, save confirmation, audit line in customer language

Fork 연동:

- token name
- four scopes: 콘텐츠 읽기 ON, 초안 생성과 수정 OFF, 발행 요청 OFF, 성과 읽기 OFF
- issue button
- one-time reveal panel
- list with name, created, last used, scopes, status
- revoke confirmation
- provider tokens are not this token explanation

States: loading, no account, save error, permission read-only, one-time reveal, revoked, success.

### WF-20 Operator Settings and Admin

Customer Settings is not mounted inside Admin.

Admin regions:

- Customers: name, owner, status, accounts, generated, published, failed, last use
- OAuth Apps: provider groups, callback URL, required fields, configured source, masked value, 30-second reveal, save/update/delete
- Usage: generation, publish, failures, support limit, period filter
- Support & Recovery: customer selection, issue phase, safe customer message, operator detail, correlation, refresh connection, repair internal record, pause/resume

Operator Settings 9 retains Video / TTS. Admin has no publish-on-behalf action.

## Prototype inspector states

The single HTML must switch active screen without route bounce across:

- ready
- loading
- empty
- partial
- blocked
- permission
- stale
- degraded
- error
- success
- uncertain
- repair

Every state names the condition and provides one safe action. Loading shimmer count is at most one.

## Responsive wireframes

### 1440

- 224 Sidebar
- 1180 max page
- Home and approval use main plus truth rail
- Studio text grid 3 columns where space allows
- video rail 3 cards
- account header two rows
- Admin tables use full width

### 1024

- 224 Sidebar
- single main column where needed
- Studio text grid 2 columns
- internal video and tab rails
- account header wraps, page overflow 0

### 390

- 54 sticky mobile bar
- 44 Menu and Theme controls
- drawer width min(344px, 88vw)
- all 26 destinations
- one-column Studio stack or named internal rail
- table rows become definition blocks
- account header seven stacked fields
- page overflow 0
- touch target at least 44px

## Prototype interaction inventory

- 26 nav destination click and active state
- 1440, 1024, 390
- light, dark
- customer, operator
- 12 state fixtures
- mobile drawer open, route close, backdrop close, Escape, focus return
- home next change to Studio
- Studio source select, generate, edit one card, save
- Studio policy direct and approval copy
- readiness disabled reason and action
- schedule panel open and confirm
- community handoff OFF, ON, destination select, cancel
- video3 card to Videos job and progress
- Queue, Inbox, Calendar same title and revision
- approval, edit, reject, schedule
- result link, uncertain reconcile, repair internal record
- Header7 and capability tabs
- account switch success, cancel, mismatch, reconnect
- native collected and not-collected rows
- customer Settings 8, policy owner/member, token issue/reveal/revoke
- Admin sections and recovery
- unavailable and external terminal actions

## Semantic assertions

- destination count 26
- unique destination IDs 26
- distinct view ownership 26
- home bounce 0
- Social 게시물 and Social 짧은 영상 groups exist
- Messaging separate
- account header field count 7
- Studio rail count 3
- Studio social flat single row false
- short video cards 3
- messaging rail 0, default delivery 0
- fake Messaging Queue/Analytics 0
- fake YouTube/TikTok Queue/Analytics 0
- raw provider token input 0 customer
- native destination rows 8
- cross-provider native sum 0
- customer Settings tabs 8
- operator Settings tabs 9
- operator customer nav 0
- state fixtures 12
- mobile destination count 26
- dead-end 0

## Design review

## Official benchmark screen-level diff

| source UI observed through official docs | v17 screen/component | borrowed | not copied |
|---|---|---|---|
| Buffer Composer plus channel avatars and scheduling choices | WF-03 `StudioHeader`, selected bulk bar, `SchedulePanel` | select destinations, preserve per-channel edit, make now/schedule explicit | queue-priority controls and default action that could hide the approval policy |
| Sprout Needs Approval list and Approval Activity | WF-04 `ApprovalInbox`, `검토 기록`, expired-time recovery | review status, edit/reject/history, resubmit with new time | multi-approver workflow builder and enterprise permission matrix |
| Later profile selector, Customize X Posts and unsupported-profile grey state | WF-03 `TextCardGrid` and channel readiness | desktop comparison grid, card-owned save/edit, reason beside disabled action | ten-profile rule, Access Group labels and provider-specific media library drag |
| Later Analytics top filters | WF-02 and WF-13 native metric rows | period/account/channel context before interpreting performance | cross-platform metric sum, report-delivery controls and plan upsell |
| Meta Business Suite official search excerpt for `Insights > Content > Overview` | WF-10 Facebook account owner | performance entry belongs to selected Page/account | Meta shell recreation and invented Facebook metrics |

Tool evidence: two `search_query` calls ran eight official-domain queries. One `open` call requested five official documents; four returned readable product documentation and Meta redirected to login. The Meta row is intentionally limited to the official search excerpt.

Classifier: APP UI. First impression is continuity from source to actual result and next change, not a generic dashboard grid.

Design Score: **A-**. AI Slop Score: **A**.

Hard rejection patterns: 0. Home bounce target: 0. Fake capability target: 0. Customer internal jargon target: 0. Dead-end target: 0.

## Red team and self-question

Red team: a skeptical investor says a 26-screen prototype can hide shallow duplicated views. Revision: each destination declares user purpose, input, output, owner, state and terminal action. Platform families use different tabs and account methods.

Red team: a customer says short video is still a handoff label, not a product flow. Revision: Studio has three real 9:16 cards and Videos includes upload, repurpose, refine, metadata, rights, provider controls, progress, proof and recovery.

Self-question: if the wireframe is wrong, the likely reason is that desktop comparison density becomes overwhelming. Revision: text comparison uses 2 or 3 columns, video is a named rail, card news is large single focus, Messaging is collapsed and OFF. At 390, everything becomes one column or a labeled internal rail.

## 회수 필요

- ⛔ 회수 필요: missing requested audit task files need later semantic diff if created.
- ⛔ 회수 필요: real provider OAuth, publish, metrics and token secrecy need browser and network QA.
- ⛔ 회수 필요: actual current route raster density and overflow need React build validation.
- ⛔ 회수 필요: storage and command contracts remain eng-design dialogue.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: "Desktop comparison density becomes overwhelming." 이유: 실제 사용자 눈동선 테스트 전 위험 가설이다.
SOURCES: `DESIGN.md` v17; `docs/user-flow-marketing-agent-v17-gpt-codex.md`; PRD v7.2.1; current Marketing Hub shell, Studio, PlatformPreview, channels, Settings, Admin and wiki; v12 baseline; v16 artifacts; https://support.buffer.com/article/642-scheduling-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/33109662792471-Later-s-Custom-Analytics; https://www.facebook.com/help/131809553587433; https://developers.google.com/identity/protocols/oauth2/web-server; https://developers.tiktok.com/doc/login-kit-web
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for audience, tension, tone and taboo translated into screen rules
SKILLS_SKIPPED: imagegen because current SVG icons and code-native platform previews are the authority; no product-design skill was installed
