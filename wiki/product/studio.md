# Studio: Assisted Content Creation

Studio is the "power user" surface for one-off or assisted generation, complementing the fully automated cron/queue flow. It is the primary place where operators interact with the AI engine + wiki grounding + multi-platform output + video rendering.

## Purpose in the SaaS
- Quick idea → publishable assets (text variants + visuals + shorts video).
- Experiment with tones, wiki facts, or new hooks.
- Onboarding hook: first value in < 2 minutes.
- For 1000+ subscriber startups: power users (founders, marketers) use Studio for high-leverage posts while cron handles volume.

## Core Flow
1. Enter idea or load from blog/wiki.
2. Select brand guide (or let wiki provide facts).
3. Generate:
   - Text variants for Threads / X / IG / Shorts hook-body-cta.
   - Image prompt.
   - (Optional) Video via Higgsfield/Midjourney or ffmpeg path.
4. Edit, preview per platform.
5. Save as draft or export to queue.
6. (New) wiki_path support via sourcing for pulling project knowledge directly.

**Wiki Integration** (recent):
- Tenant Brand Wiki injected for "facts only, no invention".
- Project wiki (this one) now loadable via `wiki_path` in sourcing API for internal/project-related content.
- "Common from copy" + per-channel overrides.

## UI Components
- Idea input + guide selector.
- Platform preview cards (grouped: Text, Video 9:16, Card News).
- Generation buttons (text / image / video).
- Draft history (per workspace).
- Brand setup wizard (guide + repo/wiki sync).
- Schedule panel (future).

See studio-mock*.html in public/ for visual references.

## Technical Implementation
- Frontend: `dashboard/src/app/studio/page.tsx` + components (PlatformPreview, RepoConnect, BrandSetupWizard).
- Backend:
  - `POST /api/studio/text` — idea + guide + tenant wiki context → multi-variant JSON.
  - `POST /api/studio/drafts` — save/restore work.
  - `POST /api/sourcing` — longform → shorts candidates (now accepts `wiki_path`).
  - Video: `/api/video/generate`, `/api/video/publish`.
- gstack note: When developing Studio features, always "Load gstack. Read wiki/product/studio.md + wiki/guides/gstack-procedures.md".

## For Scaling to 1000+ Users
- Workspace isolation.
- Usage metering on generations/publishes.
- Template library from successful wiki + guide combos.
- Export to queue for cron handoff.

Studio turns "I have an idea" into "this is ready for 5 channels + video" in minutes. Combined with the automated loop, it is the complete content operating system for lean teams.