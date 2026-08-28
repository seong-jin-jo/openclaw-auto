# OSMU Marketing Agent user flow v16

> STAMP: created_at=2026-08-06 14:56 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer / marketing_agent_v16 | skills=design-review | evidence=PRD v6.1.1, current owner routes and provider components, official product benchmarks | deliberation=v15의 22개 home 오귀환을 제거하고 고객 언어의 폐루프와 26개 고유 목적지를 함께 닫았다

## Scope and authority

- Visual and functional fidelity: current wiki, current source components, actual Chrome observations.
- Functional authority: PRD v6.1.1.
- Proof: Brand Fact1, Opportunity1, Weekly Plan1, current Threads card1, per-post approval, Threads result, native metric or sample hold, next experiment decision.
- Preservation: Sidebar 26 destinations, provider family tabs, Studio existing9, visual7, direct4, text8, video3, Settings customer8/operator9.
- D3 surface: 0.

## Customer language loop

고객에게는 내부 단계명 대신 다음 순서로 보인다.

`브랜드 사실 확인 → 이번 주 기회 선택 → 7일 계획 승인 → OSMU 초안 제작 → 마지막 검수 → 발행 또는 예약 → 실제 결과 확인 → 다음 실험 결정`

각 단계는 새 generic 화면으로 대체하지 않고 current owner route로 이어진다.

| step | summary | owner destination | 완료 증거 |
|---|---|---|---|
| 1 | 브랜드 사실 | `/studio?setup=brand` | confirmed fact, source path, updated_at |
| 2 | 이번 주 기회 | `/channels/threads`, Popular | source, collected_at, scope, confidence |
| 3 | 7일 계획 | `/` additive module | goal, audience, offer, action, constraint, channel, window |
| 4 | OSMU 제작 | `/studio` | Threads card1, citation1, adapter call0 |
| 5 | 마지막 검수 | `/inbox` | fact, account, time, capability, preview, approval hash |
| 6 | 발행 또는 예약 | `/studio`, `/calendar` | explicit item IDs, selected account, job status |
| 7 | 실제 결과 | `/inbox`, provider permalink | external ID or permalink, published_at |
| 8 | 다음 실험 | `/`, Threads Analytics | native metric or sample hold, one variable decision |

## Entry and role paths

### Public

1. `/` without token shows current landing shell.
2. `로그인` opens `/login`.
3. Loading names `로그인 상태 확인 중`.
4. Provider failure ends with `Google 로그인을 다시 시도` and `/operator` remains a separate link.
5. Public legal routes `/privacy`, `/terms`, `/data-deletion` remain reachable.

### Customer

1. AuthGate verifies account before mounting customer children.
2. `checking` shows account verification.
3. `service_error` offers refresh and logout.
4. `access_paused` explains the restriction and offers logout.
5. `account_unavailable` offers refresh and operator contact.
6. Success mounts customer workspace, ThemeToggle, and all 26 destinations.

### Operator

1. `/operator` accepts operator identity only.
2. Success opens `/operator/customers` with Admin shell.
3. Customer workspace, customer Sidebar, Marketing Agent loop are not mounted.
4. Settings, if entered by operator, exposes 9 tabs including Video / TTS.

## Happy path

1. Customer opens `/` and sees `이번 주에 먼저 확인할 일`.
2. The card names one opportunity and its evidence. `근거 보기` opens Threads Popular, not home.
3. Customer returns and chooses `이번 주 계획에 쓰기`.
4. The 7-day plan displays goal, audience, offer, desired action, constraint, Threads, date window. Missing fields block approval.
5. `계획 승인하고 초안 만들기` opens current `/studio` with campaign context.
6. Studio preserves idea input, brand setup, GitHub wiki loading, generation, history, edit, Save, Publish, SchedulePanel.
7. The generated inventory shows text8 names and truthful capability, visual7 previews, direct4 selections, video3 handoff. Unsupported direct publish is disabled.
8. Customer edits only Threads card1. Sibling cards, source, selection, history are unchanged.
9. `마지막 검수로 보내기` opens `/inbox` and carries exact item ID.
10. Review repeats `OSMU 팩토리 @osmu.official`, active status, verified_at, content, fact source, publish timing and capability.
11. Customer approves. Any later content, account, time or channel change invalidates the approval.
12. Customer chooses card publish, card schedule, explicit bulk publish or explicit bulk schedule.
13. Each selected item retains an independent status. One failure does not erase success siblings.
14. Published appears only when external ID or permalink exists. Customer can open `실제 게시물 보기`.
15. Threads Analytics shows the native metric name, definition, source and collected_at, or an explicit sample hold.
16. The product proposes one changed variable for next week. Customer chooses approve or hold.
17. Approve links the experiment to the next 7-day plan. Hold leaves the plan unchanged and names the next review time.

## Platform connection to individual publish paths

### Threads

1. `/channels/threads` opens a unique Threads owner view.
2. Tabs are Queue, Analytics, Growth, Popular, Settings.
3. Header shows `OSMU 팩토리 @osmu.official`, active, verified_at, default, Manage.
4. Wrong Meta session or identity mismatch keeps state at reconnect required.
5. Settings connects or manages accounts. Queue and Studio then use the selected handle.
6. Queue draft can open Studio, move to Review, and publish individually.

### Instagram

1. `/channels/instagram` opens Queue, Editor, Settings only.
2. OAuth is primary. Manual Graph token is under Advanced recovery.
3. Editor retains card-news creation, slide edit, queue draft save.
4. Direct capability is shown only when current account and media requirements are satisfied.

### X, Facebook, Bluesky

1. Each route opens its own unique provider view.
2. Tabs are Queue, Analytics, Settings.
3. If disconnected, Settings is the default and Queue/Analytics show a connection gate.
4. Connected account displays handle, state, verified_at and Manage.
5. X and Facebook may be current Studio direct targets. Bluesky is text adapter or queue capability only unless current capability says otherwise.

### Telegram, Discord, Slack

1. Each route opens a credential/setup surface.
2. Queue and Analytics tabs are absent.
3. Telegram bot token, Discord webhook, Slack OAuth or webhook state is named.
4. Connected account identity and verified_at appear when available.
5. Studio text8 output may be copied or handed off, but direct Studio publish is not invented.

### YouTube and TikTok

1. Channel route manages provider connection.
2. `영상 작업실 열기` deep-links to `/videos`.
3. `/videos` owns upload, generation, repurpose, refine and provider publish readiness.
4. Studio video3 cards are preview or handoff until direct provider proof exists.

## 26 destination wayfinding audit

Every item has a unique destination key and current owner route. Clicking never sends a different item to `/`.

| # | label | owner route | unique view contract |
|---:|---|---|---|
| 1 | 성과 | `/` | next decision, proof loop, current performance modules |
| 2 | OSMU Studio | `/studio` | existing9, text8, visual7, direct4, video3 |
| 3 | 승인 인박스 | `/inbox` | legacy queue origin plus campaign review truth |
| 4 | 발행 캘린더 | `/calendar` | queue projection and schedule actions |
| 5 | Threads | `/channels/threads` | 5 tabs, active account, Popular and Growth |
| 6 | X (Twitter) | `/channels/x` | generic social 3 tabs, X account |
| 7 | Instagram | `/channels/instagram` | Queue, Editor, Settings |
| 8 | Facebook | `/channels/facebook` | generic social 3 tabs, Facebook Page |
| 9 | Bluesky | `/channels/bluesky` | generic social 3 tabs, App Password management |
| 10 | Telegram | `/channels/telegram` | credential/setup only |
| 11 | Discord | `/channels/discord` | webhook/setup only |
| 12 | Slack | `/channels/slack` | OAuth/webhook setup only |
| 13 | YouTube | `/channels/youtube` | connection and Videos handoff |
| 14 | TikTok | `/channels/tiktok` | connection and Videos handoff |
| 15 | Blog Performance | `/blog-performance` | blog metric data view |
| 16 | Search Console | `/search-console` | GSC credential/cache/error table |
| 17 | Google Analytics | `/google-analytics` | disabled customer GA4 truth |
| 18 | Keyword Planner | `/keyword-planner` | research and keyword bank |
| 19 | Search Advisor | `/search-advisor` | disabled pending tenant storage |
| 20 | Naver Trends | `/naver-trends` | unavailable tenant view |
| 21 | Google Trends | `/google-trends` | external guide and external link |
| 22 | Blog | `/blog` | separate queue/editor/guide/keywords |
| 23 | Images | `/images` | tenant gallery, delete, copy URL |
| 24 | Videos | `/videos` | video workbench |
| 25 | Midjourney | `/channels/midjourney` | operator capability boundary |
| 26 | Settings | `/settings` | customer8 or operator9 |

## Single, bulk and schedule paths

| action | selection | happy | partial or error | recovery |
|---|---|---|---|---|
| card publish | exact card1 and account1 | selected adapter call1, permalink | failed_confirmed or uncertain | retry only confirmed failure, uncertain reconcile first |
| legacy bulk | explicit selected IDs | each result independent | partial keeps successes | failed item retry, uncertain item reconcile |
| card schedule | exact card1, account1, instant | Calendar projection | invalid past time, DST ambiguity, revoked account | correct time, choose offset, reconnect |
| bulk schedule | explicit IDs and accounts | independent schedules | partial or per-item conflict | edit/cancel affected item only |

Provider success with internal persistence failure enters `기록 복구 필요`. It offers internal repair and never reposts.

## Empty, loading, error, permission and disabled paths

| owner | loading | empty | error | permission | disabled or external | terminal action |
|---|---|---|---|---|---|---|
| `/` | 사실과 신호 확인 중 | confirmed fact 없음 | source unavailable | source access denied | sample hold | Studio setup, refresh, hold |
| `/studio` | generation step named | idea or draft 없음 | 502, validation | operator-only generation | unsupported publish | restore, retry, Videos handoff |
| `/inbox` | account and capability refresh | pending item 없음 | stale approval | account permission | publish unsupported | Studio, Settings, hold |
| `/calendar` | queue dates loading | scheduled item 없음 | schedule projection error | workspace denied | read-only projection | Studio schedule, refresh |
| social | config or queue loading | post/account 없음 | provider unreachable | scope missing | capability false | connect, manage, retry |
| messaging | account check | credential 없음 | verification failed | webhook/OAuth denied | no queue/analytics | connect, setup guide |
| data | metric loading | no rows | cache/API error | credential denied | disabled/external | setup, refresh, external link |
| assets | media loading | asset 없음 | upload/generation error | operator-only | unsupported format | upload, operator contact |
| settings | me/config loading | no account | save failed | operator-only tab | unavailable integration | retry, return to owner |

## Mobile, keyboard and theme paths

1. At 390px Sidebar is replaced by a visible 44px Menu trigger.
2. Drawer contains all 26 current destinations and closes after route selection.
3. Escape closes the drawer. Focus returns to Menu.
4. Tabs scroll inside their rail. The page itself has horizontal overflow 0.
5. Primary actions are at least 44px. Visible focus is preserved.
6. ThemeToggle changes semantic tokens only. Light and dark keep status meaning and contrast.
7. 1024px retains the 224px Sidebar and uses one main column plus compact truth rail.

## Dead-end audit

- Happy loop returns next experiment to the next weekly plan.
- Every empty, error, permission, stale, uncertain, repair and disabled state has one safe action.
- Every Sidebar item reaches its own route key.
- External-only routes say `외부 서비스 열기`.
- Unsupported actions have no fake CTA.
- Dead-end target: 0.

## Red team and self-question

Red team: A skeptical customer can say the prototype still fakes platform support because shared visual components make routes look similar. Revision: platform family controls tab count, primary action, account method, capability and next owner. Unique route identity is shown in title, active navigation and route chip.

Self-question: If this flow is wrong, the likely reason is that customers bypass planning and enter Studio directly. Revision: direct Studio entry remains unchanged. The Marketing Agent flow is additive guidance, not a mandatory funnel.

## 회수 필요

- 회수 필요: actual OAuth account readback and four-surface status parity need production browser evidence.
- 회수 필요: provider retry, reconcile and repair adapter contracts need eng-design.
- 회수 필요: actual route26 mobile overflow and touch targets need build/QA measurement.

SOURCES: `DESIGN.md` v16; `docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md`; `wiki/product/marketing-hub-surface-map.md`; `wiki/product/studio.md`; `wiki/reference/channel-status.md`; `tasks/osmu-full-ui-code-audit.output`; current `dashboard/src` shell/channel/Studio/Settings components; https://support.buffer.com/article/961-using-post-groups-in-buffer; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets; https://www.hootsuite.com/platform/social-media-approval-tool

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-review for route wayfinding, flow feel, responsive, state and dead-end audit

SKILLS_SKIPPED: imagegen, no bitmap asset required
