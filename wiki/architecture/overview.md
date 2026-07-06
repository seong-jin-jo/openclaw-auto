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

## Browser / External Sensing

- Currently: raw playwright in threads-search.
- Future: gstack patterns for more reliable trend mining and verification.

For full details, start with root CLAUDE.md then drill into specific extensions or dashboard API routes.

See decisions/ for why certain choices were made.