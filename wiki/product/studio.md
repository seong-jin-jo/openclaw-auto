# Studio: Assisted Content Creation

Studio is the "power user" surface for one-off or assisted generation, complementing the fully automated cron/queue flow. It is the primary place where operators interact with the AI engine + wiki grounding + multi-platform output + video rendering.

## Purpose in the SaaS
- Quick idea → publishable assets (text variants + visuals + shorts video).
- Experiment with tones, wiki facts, or new hooks.
- Onboarding hook: first value in < 2 minutes.
- For 1000+ subscriber startups: power users (founders, marketers) use Studio for high-leverage posts while cron handles volume.

## Core Flow
1. Enter idea or load from blog/wiki. **또는 기존 Long Video (로컬 파일 / YouTube URL) 입력 (0차 Video Repurposing)**.
2. Select brand guide (or let wiki provide facts).
3. Generate:
   - Text variants for Threads / X / IG / Shorts hook-body-cta.
   - Image prompt.
   - (Optional) Video via Higgsfield/Midjourney or ffmpeg path **또는 외부 클리핑 API로 기존 영상에서 후보 Shorts 추출 후 OSMU refinement**.
4. Edit, preview per platform (wiki/brand tone 반영).
5. Save as draft or publish to the four Studio-supported targets (Threads / X / Facebook / Instagram).
6. (New) wiki_path support via sourcing for pulling project knowledge directly.
7. (0차 추가) Long video repurpose: 클립 후보 수신 → 위키 컨텍스트로 다듬기 → queue로.

## Generation and publish boundaries

- Higgsfield image/video generation, credit balance, and transaction history are operator-only.
  Studio first confirms `/api/me`; customer sessions receive no `/api/higgsfield/*` SWR key or
  generation request and see a Korean operator-only notice. The proxy allowlist remains closed
  because the credit pool and generation log are not tenant-isolated.
- Studio publish supports Threads, X, Facebook, and Instagram. These four targets default ON.
  Shorts, Reels, and TikTok remain generation/preview outputs in Studio, default OFF, and show
  `발행 미지원(생성 전용)` instead of a publish selector.
- Publish progress counts only confirmed `ok:true` results. A failed target carries a danger-token
  badge and its server reason. Mixed or all-failed runs persist as `partial`, never `published`;
  only an all-success run displays `발행 완료` and stores `published`.
- The existing external-publish/internal-record failure path remains a reconciliation state:
  it stores `partial`, preserves the permalink/recovery metadata, and blocks automatic republish.

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
