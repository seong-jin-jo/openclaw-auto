# Marketing Hub surface map — current implementation

> 2026-08-28 코드 재계수: `dashboard/src/app/**/page.tsx` 25개, `dashboard/src/app/api/**/route.ts` 178개. 아래 과거 수치는 당시 스냅샷이며 현재 총계로 사용하지 않는다.

**Updated:** 2026-08-28. This is an implementation map, not a release note.

## Evidence boundary

- **Current local implementation:** the audit directly read 25 `page.tsx` entries, shell/components, and route wiring. It proves source presence only.
- **Browser-observed, visual-only auth:** the current baseline may render an authenticated shell, but it does not prove provider tokens, API success, persistence, or a completed customer journey.
- **Production/external unverified:** no deployment, third-party OAuth, publishing, analytics, or external API is asserted working unless separately labelled as a user observation below.

## Shells and navigation

- `AuthGate` selects landing, customer Marketing Hub, or the separate operator shell. Customer identity comes from the tenant; operator identity is **Admin** and customer workspace/menu is cleared rather than mounted.
- The customer Sidebar has **23 destination entries**: Performance, OSMU Studio, Approval Inbox, Publishing Calendar; Social 5; Messaging 3; Video 2; Blog Performance; Keyword Research 3; Blog; Images; Videos; Midjourney; Settings. `CHANNEL_GROUPS` supplies the 10 channel entries, while the remaining 13 are static destinations. The removed Data & SEO connection group is not counted. This is current local IA, not a claim that each destination works externally.
- 2026-08-28 최신 QA에서는 생성실·편집실·발행실·성과실을 390, 768, 1024, 1440에서 실제 이동했고 가로 넘침, 화면 401, 콘솔 오류가 모두 0건이었다. 다만 v63 시안과의 전체 디자인 정합은 NG다.

## Route inventory (25 page entries)

| Route | Current local surface | Truth boundary |
|---|---|---|
| `/` | Performance home: onboarding, channel banner, metrics/activity/usage/error cards | API-dependent local dashboard |
| `/studio` | assisted composition, previews, drafts, schedule panel | see Studio inventory below |
| `/inbox` | queue `draft` review/seed/approve/delete | legacy queue view, not Studio inbox |
| `/calendar` | queue-derived month/date view | read-only queue view, not universal schedule truth |
| `/channels/[channel]` | provider-type dispatcher | specialized tabs differ by provider |
| `/videos` | upload/generate/repurpose/refine and YouTube/TikTok actions | local workbench; external readiness unverified |
| `/images` | tenant image gallery | local API-dependent |
| `/blog` | blog queue, editor, guide/keywords | separate blog domain |
| `/blog-performance` | blog statistics | API-dependent |
| `/search-console` | GSC analytics table | configured credential/API required; 89px visual overflow observed |
| `/keyword-planner` | research + keyword bank | API-dependent |
| `/google-analytics` | unavailable panel | intentionally disabled customer GA4 |
| `/naver-trends` | unavailable panel | intentionally disabled tenant view |
| `/search-advisor` | unavailable panel | intentionally disabled pending tenant storage |
| `/google-trends` | Google Trends link and guidance | external destination, not integrated analytics |
| `/performance` | redirect | compatibility redirect to `/`; no dedicated performance page |
| `/services` | multi-service switch/create surface | local page; loading/auth/tenant outcome unverified |
| `/settings` | role-aware configuration tabs | customer 8 / operator 9 below |
| `/operator` | operator token entry | separate administrative shell |
| `/operator/customers` | customer/OAuth credential administration | local admin surface; authorization/operations unverified |
| `/login` | Google login | provider completion unverified |
| `/signup` | redirect to login | compatibility route |
| `/privacy` | policy | static legal page; legal sufficiency unreviewed |
| `/terms` | terms | static legal page; legal sufficiency unreviewed |
| `/data-deletion` | deletion instructions | static legal page; operational fulfilment unverified |

## Provider and workflow truth

- Generic social channels use **Queue / Analytics / Settings**; Threads alone additionally has **Growth / Popular**.
- Instagram uses **Queue / Editor / Settings**. Its Card News editor is a distinct current surface; it is not interchangeable with generic social tabs.
- Messaging channels are connection/setup surfaces, not Queue/Analytics pages. Data channels are likewise connection/setup surfaces. Video connection lives on channel pages while video creation/publish workbench lives at `/videos`; Blog has its own `/blog` queue.
- **Inbox** is a draft queue reviewer. **Calendar** derives dates from the same queue and shows a date list; neither proves one shared Studio-to-result lifecycle.
- Customer Settings exposes **8 tabs**: Channels, AI Engine, Storage, Design Tools, Notifications, Fork integration, Keywords, System. Operator Settings has **9**, adding **Video / TTS**; it is intentionally hidden for customers because its configuration is global rather than tenant-isolated.

## Studio inventory (do not merge these counts)

- **Visual previews: 7** — Threads, X, Facebook, Instagram, Shorts, Reels, TikTok.
- **Direct select/publish: 4** — Threads, X, Facebook, Instagram only.
- **Text API adapters: 8** — a generation/API inventory, not a Studio card or a publish promise.
- **Video outputs: 3** — Shorts, Reels, TikTok are generation/preview outputs and default to no direct publish selector.

Studio creation remains separate from account connection in Settings. The historic phrase “ready for 5 channels + video” is obsolete and must not be used.

## 운영에서 다시 확인할 관찰

아래 항목은 과거 운영 관찰에서 열렸고 최신 로컬 QA만으로 닫을 수 없다:

1. OAuth can show a false success: callback says connected while the subsequent customer state is not connected.
2. Instagram exposes duplicate token paths (OAuth and manual Graph credential UI), creating two apparent sources of truth.
3. Settings can omit the expected channel connection status.
4. 과거 OSMU 502는 최신 로컬 `/`와 health 200만으로 원인이 규명되거나 운영에서 해소됐다고 볼 수 없다.

These need a future browser + provider + production-log investigation; no fix is claimed here.

## Source and self-check

**Sources:** `docs/qa/qa-tracker.md`; `session-state.osmu.md`; current `dashboard/src/app`, `components/layout/Sidebar.tsx`, channel, Studio, Settings, Inbox and Calendar code.

**Model:** gpt-5.6-terra (mechanical wiki compilation).

**External benchmark:** intentionally not used. This task records supplied audit and current source truth; market comparison would not improve the factual status of an implementation.

**Self-check:** counts and classification are kept separate: local source presence ≠ browser operation ≠ production/provider verification; 25 route entries and 23 sidebar destinations are explicitly accounted for.
