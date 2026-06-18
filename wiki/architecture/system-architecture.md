# System Architecture

## High Level

```
Cron Jobs (jobs.json)
    ↓
OpenClaw Gateway + Claude Agent
    ↓ (Tool Registry)
Extensions (publish, generate, insights, video, longform-to-shorts, search...)
    ↓
Dashboard APIs (Next.js) + Data (queue.json, wiki_docs per tenant, etc.)
    ↓
External: Threads/X/IG/YouTube/TikTok APIs + R2 + ElevenLabs + Midjourney
```

## Core Components

**1. Content Generation**
- prompt-guide.txt + channel-specific overrides
- search-keywords
- longform-to-shorts: chunk → claude -p → candidates (hook/body)
- studio/text: idea → multi-platform variants + shorts + image_prompt (wiki context injected)

**2. Publishing**
- multi-channel-publish cron
- Per-channel extensions (threads-publish, x-publish, instagram-publish, tiktok-publish, youtube-publish...)
- Queue schema v2 with per-channel status

**3. Insights & Learning**
- threads-insights, sync-insights
- threads-search (playwright scrape for external trends)
- growth tracking
- viral_signals table

**4. Video / Shorts Factory**
- video-generate extension → dashboard /api/video/generate (ffmpeg + TTS)
- slides model: text + duration + imageUrl
- Higgsfield path for advanced video

**5. Wiki (two kinds)**
- Product: tenant wiki_docs (GitHub sync, trgm search, prompt injection for facts)
- This Project Wiki: `wiki/` (internal dev knowledge, decisions, procedures)

**6. Dashboard (Next.js)**
- Studio (assisted gen + video)
- Channel pages (Queue/Analytics etc.)
- Brand setup (guide + wiki/repo sync)
- Tenants/workspaces

## Data Flow for Shorts Factory (target)

Longform (wiki page / blog) → longform_to_shorts → candidates
→ Studio review + visuals
→ video_generate (ffmpeg base)
→ Drafts → Approve → Publish (YouTube/TikTok + cross post)
→ Performance (gstack browse or API) → learnings → next prompt

## gstack Integration (now in this repo)

- Team mode activated (./setup --team)
- .claude/ hooks and settings for enforcement
- Follow procedures in wiki/guides/gstack-procedures.md
- Use for all product work: office-hours → plan reviews → autoplan → implement → review/qa/ship

See root CLAUDE.md for environment and cron details.

This architecture is service-neutral — custom per fork in data/ and config/.
