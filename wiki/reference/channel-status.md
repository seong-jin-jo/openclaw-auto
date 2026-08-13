# Channel Status & Implementation

**최종 갱신: 2026-08-13** (근거: R-05·R-09 승인 계약, current-code UI audit, `ops/session-state.md`; source presence does not prove production operation.)

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

## 채널 capability SSOT

대시보드의 채널 그룹과 상세 탭은 `dashboard/src/lib/channel-capabilities.ts`가 단일 소스다.
Sidebar, Settings>Channels, Studio, generic 채널, Instagram, Messaging이 이 계약을 공유한다.
`constants.ts`는 기존 import 호환을 위해 발행 그룹을 재수출한다.

탭 원칙은 구조적으로 불가능한 기능만 제거하고, 가능한 미구현 기능은 탭을 유지한 채 비활성화해
`연동 예정`으로 표시하는 것이다. 비활성 탭 클릭은 `연동 예정입니다` 안내를 낸다. Threads의 Growth와
Popular, Instagram의 Editor, 기존 8개 발행 채널은 유지한다. Messaging은 구조적으로 불가능한 Queue,
Analytics, Growth, Popular를 제거하고 Settings만 노출한다.

### Video 그룹은 텍스트 예약과 분리

- YouTube/TikTok 영상 직접 발행은 `/api/video/publish`를 사용하며 각 채널 상세로 연결한다.
- 두 영상 provider가 채널 그룹에 보이는 사실은 텍스트 예약 발행 지원을 뜻하지 않는다.
- Studio의 실제 발행 대상은 `SCHEDULABLE_PLATFORMS`와 preview capability의 교집합으로 제한한다.

## 연결 readiness 상태 계약

`/api/connect/readiness`는 `connected`, `not_connected`, `opening_soon`, `publish_pending`, `error`를 반환한다.
중앙 앱 credential이 없거나 외부 심사가 필요한 공급자는 `opening_soon`, 앱 credential이 준비됐지만 tenant
계정이 없으면 `not_connected`다. 고객 화면은 `미연결`을 활성 연결 버튼으로, `오픈 준비중`을 회색 대기로
구분한다. 연결은 됐지만 발행 심사가 남으면 `발행 준비중`, 판정 실패는 재시도 가능한 오류로 표시한다.

### 운영자/고객 shell 경계

- `/api/me.isOperator=true`이면 Sidebar identity는 `Admin`이고 운영자 고객 관리 메뉴만 노출한다.
  persisted customer workspace는 AuthGate가 children mount 전에 제거하며 운영자 shell은 workspace
  switcher·고객 마케팅 메뉴를 렌더하지 않는다.
- 고객은 `/api/me.tenant`의 자기 workspace identity와 기존 마케팅 메뉴를 그대로 사용한다.

When adding channels, follow guides/gstack-procedures.md and update this reference + product/ docs.
