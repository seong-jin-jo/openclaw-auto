# Environment Variables & Configuration

## 현행 범주 (2026-08-25)

아래 목록은 대표값이며 완전한 목록이 아니다. 실제 사용 여부는 코드 검색과 배포 환경 inventory로 확인한다.

- 인증·테넌트: `OSMU_SECRET_KEY`, Supabase URL·anon/service-role 계열, operator/dashboard token 계열
- OAuth: Threads, Instagram, Facebook, X, YouTube, LinkedIn, Naver, Pinterest, Tumblr, TikTok, Slack, LINE provider별 client/app ID와 secret
- 분석·연동: GA, Google Search Console, Naver Search Advisor, Slack webhook 계열
- 미디어·생성: Higgsfield, R2, Midjourney, ElevenLabs·영상 runner 계열
- 공개 origin: `OSMU_PUBLIC_URL`

변수명은 `dashboard/src`, `scripts`, workflow·compose 예시의 환경 참조가 정본이며 실제 값은 문서에 기록하지 않는다.

## Core (from CLAUDE.md)
- `THREADS_ACCESS_TOKEN`, `THREADS_USER_ID`
- `X_API_KEY`, `X_API_KEY_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_TOKEN_SECRET`
- `INSTAGRAM_ACCESSTOKEN`, `INSTAGRAM_USERID`
- `MIDJOURNEY_DISCORD_TOKEN`, `MIDJOURNEY_CHANNEL_ID`, `MIDJOURNEY_SERVER_ID`
- `R2_*` (access, secret, bucket, endpoint, public url)
- `OPENCLAW_GATEWAY_TOKEN`
- `DASHBOARD_PORT` (default 3456)
- `DASHBOARD_AUTH_TOKEN`
- `VIRAL_THRESHOLD` (default 500)

## LLM / Agent
- `config/openclaw.json` → agents.defaults.model (primary + fallbacks)
- Per-job model override in jobs.json

## Shorts / Video
- `CLAUDE_BIN`
- `LONGFORM_*` (CHUNK_CHARS, PER_CHUNK, MAX_CANDIDATES, TIMEOUT)
- `VIDEO_DASHBOARD_URL`
- ElevenLabs config in data/elevenlabs-config.json

## Development
- Stage Controller 단계 게이트가 기본 절차다. gstack 설치 여부는 실행 환경별 선택 사항이다.

## Tenant-specific
Loaded via dashboard settings or data/ per workspace.

Never commit real values. Use .example files.

For full list and verification logic, see src/lib/verify-channel.ts and dashboard settings APIs.
