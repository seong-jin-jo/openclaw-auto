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

## Browser / External Sensing

- Currently: raw playwright in threads-search.
- Future: gstack patterns for more reliable trend mining and verification.

For full details, start with root CLAUDE.md then drill into specific extensions or dashboard API routes.

See decisions/ for why certain choices were made.