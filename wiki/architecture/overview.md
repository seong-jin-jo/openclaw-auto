# Architecture Overview

See root CLAUDE.md for the most detailed current reference. This is the high-level summary in the wiki.

## Core Loop

OpenClaw Cron → Claude Agent (with tools from extensions) → Actions on:
- Local data (queue.json, style, growth)
- External APIs (Threads, X, IG Graph, YouTube, etc.)
- Renders (video via dashboard ffmpeg + ElevenLabs, images)

Feedback: insights → viral signals → style / prompt-guide updates.

## Key Directories

- `extensions/`: All tools (publish, generate-drafts, longform-to-shorts, video-generate, search, etc.). Each is a plugin with plugin.json + tool.
- `dashboard/src/`: Next.js App Router UI + API routes. Studio for assisted gen, channel queues, settings.
- `data/`: Runtime (gitignored): queue, prompt guides, keywords, videos, etc.
- `config/`: Examples for cron, openclaw.json, docker.
- `wiki/`: This project knowledge base (new).
- `openclaw/`: Submodule (core runtime + many more docs).

## Multi-tenant / SaaS Direction

- Tenants/workspaces isolate data.
- Brand setup (guide + wiki sync from GitHub) for per-customer tone + facts.
- Usage recording, studio drafts per tenant.

## Video / Shorts Factory Seeds

- longform-to-shorts: text/URL → candidates (hook/body/...).
- video-generate: slides[] → vertical MP4 + TTS + BGM.
- Studio page supports shorts variants + video render.
- Publish paths exist but need hardening for TikTok/YouTube video.

## OAuth 소셜 연결 아키텍처 (2026-07-07)

고객이 각 소셜 플랫폼을 직접 연결하는 OAuth 2.0 자동 연결 흐름.

### 지원 채널 (12개)
| 채널 | 방식 | 환경변수 | 비고 |
|------|------|---------|------|
| Instagram | OAuth 2.0 | IG_APP_ID, IG_APP_SECRET | ✅ 운영중 |
| Threads | OAuth 2.0 | THREADS_APP_ID, THREADS_APP_SECRET | ✅ 운영중 |
| Facebook | OAuth 2.0 | FB_APP_ID, FB_APP_SECRET | ✅ 운영중 |
| X (Twitter) | OAuth 2.0 + PKCE | X_CLIENT_ID, X_CLIENT_SECRET | 시크릿 등록 대기 |
| YouTube | OAuth 2.0 | YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET | ✅ 시크릿 등록됨 |
| LinkedIn | OAuth 2.0 | LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET | 앱 등록 대기 |
| Naver Blog | OAuth 2.0 | NAVER_CLIENT_ID, NAVER_CLIENT_SECRET | 앱 등록 대기 |
| Pinterest | OAuth 2.0 | PINTEREST_APP_ID, PINTEREST_APP_SECRET | 앱 등록 대기 |
| Tumblr | OAuth 2.0 | TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET | 앱 등록 대기 |
| TikTok | OAuth 2.0 + PKCE | TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET | 앱 등록 대기 |
| Slack | OAuth 2.0 | SLACK_CLIENT_ID, SLACK_CLIENT_SECRET | 앱 등록 대기 |
| LINE | OAuth 2.0 | LINE_CLIENT_ID, LINE_CLIENT_SECRET | 앱 등록 대기 |

### 흐름
```
ChannelPage (OAUTH_CONNECT dict에 포함된 채널)
  → "연결" 버튼 → GET /api/connect/{provider}
  → PKCE 채널: code_verifier → httpOnly cookie(10분)
  → 플랫폼 인증 URL로 redirect
  → callback: GET /api/connect/{provider}/callback
  → 토큰 교환 → integrations(pgp 암호화) 저장
  → ChannelPage Settings 탭에 연결됨 표시
```

### 파일
- `dashboard/src/lib/social-connect.ts` — 프로바이더 설정(authUrl, tokenUrl, scopes 등)
- `dashboard/src/app/api/connect/[provider]/route.ts` — OAuth 시작 (PKCE verifier 생성)
- `dashboard/src/app/api/connect/[provider]/callback/route.ts` — 토큰 교환 + 저장
- `dashboard/src/components/channel/ChannelPage.tsx` — `OAUTH_CONNECT` dict (12채널)

환경변수 없으면 버튼 숨김. 있으면 즉시 활성화.
ADR: `wiki/decisions/004-social-connect-oauth-not-passwords.md`

### state 서명 (2026-07-10, commit eba54b36 — Codex 보안리뷰 3라운드)
- state = `base64url(JSON{t: tenantId, p: provider, ts: timestamp})` + `.` + `HMAC-SHA256(OSMU_SECRET_KEY)`.
- callback 검증 순서: HMAC 상수시간 비교(파싱 전) → JSON 파싱 → 타입 확인 → provider 교차검증 → 10분 만료.
- **OSMU_SECRET_KEY 설정 시 비서명(평문) state는 무조건 거부** — 다운그레이드/CSRF로 타 테넌트에 토큰 주입하는 공격 차단. 키 미설정(로컬 dev)만 평문 폴백.
- 키 회전·미설정→설정 전환 중 진행되던 OAuth 흐름은 fail-closed(재시도 안내), 오연결 없음.
- 후속(다음 사이클): one-time nonce(동일 provider 내 10분 창 재사용 차단).

### 발행 vs 연결 구분 (2026-07-10, 발행 8채널 확장 2026-07-11)
- **연결(OAuth)**: 12채널. **대시보드 직접 발행**(`lib/publish.ts`, `SCHEDULABLE_PLATFORMS`): **8채널**.
  - OAuth 앱 등록형(4): threads / instagram / x / facebook — 플랫폼 앱 등록 + 토큰 교환 필요.
  - credential·webhook 방식(4, 2026-07-11 추가): bluesky(handle+app password) / telegram(bot token+chat id) / discord(webhook URL) / slack(webhook URL) — 사용자가 Settings에서 자격증명 직접 입력, OAuth 앱 등록 불필요.
- credential은 `channel-config/[channel]` 라우트의 `toIntegration()`이 `integrations` 테이블(pgp 암호화)로 브리지 → `getChannelCred()`가 소비. 이 매핑이 없으면 UI 수동입력↔직접발행 경로가 끊긴다.
- 발행 미지원 채널은 `SocialConnectButton`에 "발행 준비 중 — 연결만 미리 가능" 배지 노출 (노출=발행가능 원칙, `tests/publish/schedulable-platforms.test.ts`로 SSOT 고정).
- 참고: 대시보드 직접 발행과 openclaw extension 발행(`openclaw/extensions/*-publish`)은 **이원화**된 경로 — extension 경로는 크론잡(gateway)용, 대시보드 `/api/publish`는 UI용. 온보딩 채널감지는 두 소스(파일 openclaw.json + DB integrations) OR 판정(2026-07-10).

## Browser / External Sensing

- Currently: raw playwright in threads-search.
- Future: gstack patterns for more reliable trend mining and verification.

For full details, start with root CLAUDE.md then drill into specific extensions or dashboard API routes.

See decisions/ for why certain choices were made.