# Channel Status & Implementation

**최종 갱신: 2026-07-07** (근거: 2026-07-06 전채널 Settings UI 브라우저 직접 감사 — `ops/session-state.md` 참고)

**Live (연결 + 자동화 동작)**: Threads.

**Connected (연결만, 자동화 미시작)**: Instagram (팔로워 2,390).

**구현 완료 + 미연결 (credential/OAuth 대기)**: X, Facebook, LinkedIn, Bluesky, Pinterest, Tumblr, TikTok, YouTube, Naver Blog, Telegram, Discord, Slack, LINE — 전부 `IMPLEMENTED_PLUGINS` 포함, Settings 폼 존재.

**OAuth 자동 연결 (2026-07-06 확정, ADR-004)**:
- 9채널 OAuth 코드 구현 완료 (X PKCE, LinkedIn, YouTube, Naver, Pinterest, Tumblr, TikTok PKCE, Slack, LINE — commit 5b21197d) + env 배선 완료. **플랫폼별 Developer Portal 앱 등록 후 활성화** (env 없으면 버튼 숨김).
- 수동 입력 유지(플랫폼 표준): Telegram(봇토큰), Discord(Webhook), Bluesky(App Password).
- X 주의: OAuth 로그인 무료, 발행은 고객 각자 Developer Portal 등록 (우리가 $100/월 Basic 대납 안 함 — 2026-07-06 결정).

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