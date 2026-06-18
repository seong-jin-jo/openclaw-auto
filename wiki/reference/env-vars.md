# Environment Variables & Configuration

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

## gstack / Development
- Global gstack installed at `~/.claude/skills/gstack`
- Team mode active via `.claude/` in this repo
- See guides/gstack-procedures.md

## Tenant-specific
Loaded via dashboard settings or data/ per workspace.

Never commit real values. Use .example files.

For full list and verification logic, see src/lib/verify-channel.ts and dashboard settings APIs.