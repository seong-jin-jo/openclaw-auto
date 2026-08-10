# Channel Status & Implementation

**최종 갱신: 2026-08-06** (근거: current-code UI audit + `ops/session-state.md`; source presence does not prove production operation.)

> Current UI truth is mapped in [Marketing Hub surface map](../product/marketing-hub-surface-map.md). In particular,
> provider connection/publish status is **not** inferred from a local component, landing copy, or an extension entry.
> User-reported production observations remain open: OAuth false-success, duplicate Instagram token UI,
> missing Settings status, and an OSMU 502.

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

### Video 그룹은 텍스트 예약과 분리

- YouTube/TikTok 영상 직접 발행은 `/api/video/publish`와 `/videos`의 provider별 연결/발행 카드를 사용한다.
- Current Sidebar routes to `/videos`; do not retain stale documentation that promises hash links such as
  `/videos#youtube-connect` or `/videos#tiktok-connect` unless that exact anchor is restored and verified.
- 두 영상 provider를 텍스트 예약 SSOT `SCHEDULABLE_PLATFORMS` 또는 그 그룹인
  `PUBLISH_CHANNEL_GROUPS`에 추가하지 않는다. 영상 연결 노출은 텍스트 예약 발행 지원을 뜻하지 않는다.

### 운영자/고객 shell 경계

- `/api/me.isOperator=true`이면 Sidebar identity는 `Admin`이고 운영자 고객 관리 메뉴만 노출한다.
  persisted customer workspace는 AuthGate가 children mount 전에 제거하며 운영자 shell은 workspace
  switcher·고객 마케팅 메뉴를 렌더하지 않는다.
- 고객은 `/api/me.tenant`의 자기 workspace identity와 기존 마케팅 메뉴를 그대로 사용한다.

When adding channels, follow guides/gstack-procedures.md and update this reference + product/ docs.
