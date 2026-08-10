# WF-05 Existing Product Preservation RTM v6

## Navigation preservation

| ID | Existing label | Existing route | Prototype target | Result |
|---|---|---|---|---|
| N01 | 성과 | `/` | `home` | preserve |
| N02 | OSMU Studio | `/studio` | `studio` | additive |
| N03 | 승인 인박스 | `/inbox` | `inbox` | additive |
| N04 | 발행 캘린더 | `/calendar` | `calendar` | additive |
| N05 | Threads | `/channels/threads` | `channel-threads` | preserve |
| N06 | X | `/channels/x` | `channel-x` | preserve |
| N07 | Instagram | `/channels/instagram` | `channel-instagram` | preserve |
| N08 | Facebook | `/channels/facebook` | `channel-facebook` | preserve |
| N09 | Bluesky | `/channels/bluesky` | `channel-bluesky` | preserve |
| N10 | Telegram | `/channels/telegram` | `channel-telegram` | preserve |
| N11 | Discord | `/channels/discord` | `channel-discord` | preserve |
| N12 | Slack | `/channels/slack` | `channel-slack` | preserve |
| N13 | YouTube | `/channels/youtube` | `channel-youtube` | preserve |
| N14 | TikTok | `/channels/tiktok` | `channel-tiktok` | preserve |
| N15 | Blog Performance | `/blog-performance` | `route-summary` | preserve |
| N16 | Search Console | `/search-console` | `route-summary` | preserve |
| N17 | Google Analytics | `/google-analytics` | `route-summary` | preserve |
| N18 | Keyword Planner | `/keyword-planner` | `route-summary` | preserve |
| N19 | Search Advisor | `/search-advisor` | `route-summary` | preserve |
| N20 | Naver Trends | `/naver-trends` | `route-summary` | preserve |
| N21 | Google Trends | `/google-trends` | `route-summary` | preserve |
| N22 | Blog | `/blog` | `route-summary` | preserve |
| N23 | Images | `/images` | `route-summary` | preserve |
| N24 | Videos | `/videos` | `route-summary` | preserve |
| N25 | Midjourney | `/channels/midjourney` | `channel-midjourney` | preserve |
| N26 | Settings | `/settings` | `settings` | additive |

Result: `26/26`, orphan `0`, renamed `0`, invented top-level navigation `0`.

## Feature preservation by actual surface

| Surface | Existing feature group | v6 mapping | Result |
|---|---|---|---|
| Home | onboarding, performance, ideas, operations, alerts, activity | existing home route summary | preserve |
| Studio | idea, brand, Wiki, generation, preview 7, save, publish, schedule, edit, accounts, progress, history | full Studio frame | additive |
| Inbox | draft, AI seed, tone, preview, approve/reject, hours, shortcuts | full Inbox frame | additive |
| Calendar | month, statuses, selected date, navigation | full Calendar frame | additive |
| Settings | 8 customer tabs, 1 operator tab, channel grid | full Settings frame | additive |
| Threads channel | Queue, Analytics, Growth, Popular, Settings | channel frame | preserve |
| Instagram channel | Queue, Editor, Settings, CardNews, accounts, credential | channel frame | additive hierarchy |
| Generic channels | Queue, Analytics, Settings or specialized route | channel frame | preserve |
| Videos | generation and asset workflow | route summary plus Studio deep link | preserve |

## Forbidden invention check

| Check | Expected |
|---|---:|
| Text `OSMU PROVIDERS` | 0 |
| Sidebar group not found in actual Sidebar | 0 |
| Forced identical channel tabs | 0 |
| New brand color token | 0 |
| Existing sidebar removal | 0 |
| Existing Settings tab removal | 0 |

## Plan gap

⛔ 회수 필요: PRD v3.1의 6 provider identical tab contract를 그대로 prototype에 넣으면 N05 to N14의 existing channel behavior를 왜곡한다. 공통 workflow를 Studio, Inbox, Calendar에 두는 plan PATCH가 필요하다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 16:22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer | skills: design-html, design-review, browse | evidence: dashboard/src full route and sidebar audit | 고민: 요구 coverage뿐 아니라 기존 제품 coverage를 역추적했다.

SKILLS_USED: design-html - prototype routing matrix / design-review - source fidelity and completeness / browse - DOM route QA method
SKILLS_SKIPPED: 없음
SOURCES: actual Sidebar, 24 app page entries, Studio, Inbox, Calendar, Settings, ChannelPage, InstagramPage
MODEL: gpt-codex/gpt-5.6-sol
