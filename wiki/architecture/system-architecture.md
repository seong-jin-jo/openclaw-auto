# System Architecture

**이 문서는 wiki/ 의 공식 아키텍처 레퍼런스입니다.** 
root CLAUDE.md 는 이제 고수준 포인터 역할만 합니다 (상세는 wiki/ 참조).

gstack 사용 시 항상 "Load gstack. Read wiki/architecture/system-architecture.md + wiki/index.md 먼저" 하세요.

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
- schedule-publish-due dashboard cron endpoint for Studio reservations
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

**0차 아키텍처 포커스 (2026-06-19)**
- 단일 앱 + 테넌트 완전 격리 (UI + DB, RLS + withTenant).
- Cloudflare Custom Hostnames 지원 (고객 도메인 직접 사용).
- Multi-repo wiki context pulling (다른 레포 위키를 product context로).
- Reliability: 에러를 사용자가 설명/재현 가능하게.
- Shorts Factory + automation loop을 operator(0차)의 다중 서비스에서 안정 동작.

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
