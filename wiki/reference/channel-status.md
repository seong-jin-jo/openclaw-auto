# Channel Status & Implementation

**Live (production, verified)**: Threads, X, Instagram (core social + video publish + insights).

**Ready / Partial**: YouTube (upload works), TikTok (API limited), Blog queue, Naver, etc.

**Coming Soon / Extensions exist**: Facebook, LinkedIn, Bluesky, Pinterest, Telegram, Discord, Slack, LINE, etc.

Full list and UI rules in docs/feature-spec.md and wiki/product/.

For each channel the pattern is:
1. Extension (publish tool)
2. Credential verification
3. Guide + keywords support
4. Queue channel status
5. (Video channels) media handling

See extensions/ directory and dashboard/src/lib/constants.ts for IMPLEMENTED_PLUGINS.

## 발행 채널 그룹 SSOT (사이드바 = 연결가능 원칙)

대시보드에 **노출되는 발행 채널 그룹은 단일 소스** `dashboard/src/lib/constants.ts`의
`PUBLISH_CHANNEL_GROUPS`로 정의한다. 사이드바(`Sidebar.tsx`)와 Settings>Channels
(`ChannelsSettings.tsx`)가 **같은 상수를 소비**한다 — 정의를 한 곳에서만 바꾸면 둘 다 반영된다.
(과거 3중으로 갈려 드리프트가 있었음 — 죽은 `CHANNEL_CATEGORIES`는 제거됨.)

원칙: **사이드바에 보이는 채널은 실제 연결 가능해야 한다.** 연결 UI가 없는 채널
(GA/GSC 미구현, custom_api/rss stub 등)은 그룹에서 빼거나 동작하는 읽기 대시보드로 라우팅한다.
빈 연결폼/"준비 중" 노출 금지.

When adding channels, follow guides/gstack-procedures.md and update this reference + product/ docs.