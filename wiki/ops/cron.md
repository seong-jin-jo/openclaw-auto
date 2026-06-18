# Cron Jobs & Automation

All background work is driven by cron definitions in `config/cron/jobs.json` (or equivalent in OpenClaw gateway).

## Current Jobs (from CLAUDE.md + config)

| Job | Interval | Model | Description |
|-----|----------|-------|-------------|
| threads-generate-drafts | 6h | Sonnet/Opus | prompt-guide + keywords + wiki context → batch drafts |
| multi-channel-publish | 2h | Haiku | approved queue items → publish to all connected channels (per-channel optimization) |
| instagram-generate-drafts | 6h | Sonnet | card news specific generation |
| instagram-auto-publish | 2h | Haiku | image posts for IG |
| threads-collect-insights | 6h | Haiku | views/likes/replies + viral detection + auto like/reply |
| threads-fetch-trending | weekly | Haiku | external popular posts via search (playwright or API) |
| threads-track-growth | daily | Haiku | follower count history |

## How It Works
1. Cron container calls OpenClaw gateway with job payload (including model override).
2. Agent uses registered tools (from extensions).
3. Results written to data/ or DB (tenant-scoped).
4. Cleanup of old published/failed items.

## Configuration
- Per-tenant automation toggles in dashboard Settings.
- Global defaults in openclaw.json.
- Model selection: quality (generation) vs cost (publish/insights).

## gstack / Product Notes
- All cron improvements must be documented in wiki/ops/cron.md.
- When adding new automation, follow full gstack pipeline (office-hours → plan-eng → autoplan → review + qa).
- Shorts factory cron (future): "generate-shorts-from-new-wiki-or-blog" + "publish-shorts".

## Monitoring
- Dashboard shows cron status, last run, errors.
- `/api/cron-status`, `/api/cron-runs`, alerts.

## For 1000+ Tenants
- Horizontal scaling of cron workers.
- Per-tenant job staggering to avoid rate limits.
- Usage-based throttling.

See architecture/ for data flow and guides/gstack-procedures.md for how we develop changes to this system.