# Data Model & Persistence

This is the reference for all persistent state. Most data is tenant-scoped for SaaS isolation.

## Core Tables / Files (DB in production path, files for simple runs)

### Tenant & Workspace
- `tenants` — id, slug, name, created.
- `workspaces` — linked to tenant.
- `tenant_tokens` — for API auth from frontends.

### Content & Queue (v2)
- `queue.json` (legacy) / `drafts` table — status, channels: { threads: {status, publishedAt, ...}, ... }
- Per-post: idea, payload (JSON with hook/body etc.), images.

### Brand Knowledge (Wiki)
- **Tenant Brand Wiki** (for AI content):
  - `wiki_docs` (DB): tenant_id, path, title, content, hash, updated_at.
  - Indexed with gin_trgm for similarity search.
  - Sync via GitHub (`/api/brand/sync-wiki`): incremental by hash.
  - Retrieval: full if small, else top-K word_similarity → prompt injection ("사실에 근거, 지어내지 마").
- **Project Wiki** (this `wiki/` folder): repo-based Markdown. For internal dev knowledge. Loaded directly via fs in sourcing for shorts (see product/shorts-factory.md).

### Insights & Signals
- `viral_signals`: tenant, source, content, score (trends, longform, reactions).
- `growth_metrics`: daily follower counts per channel.
- `drafts`: candidate shorts/posts saved for review.

### Automation State
- `cron-runs`, `cron-status`.
- Settings per tenant/channel (credentials, guide, keywords, toggles).
- `prompt-guide.txt` + `.channel.txt` overrides (in data/ or DB).

### Media & Assets
- R2 bucket for images/videos.
- `images/` API + local cache in data/.
- videos/ for rendered shorts.

## Key Files in Repo (git-tracked examples)
- `config/openclaw.json.example`
- `data/prompt-guide.txt.example`, `search-keywords.txt.example`
- `data/tenants.json.example`
- `dashboard/db/schema.sql` + `rls.sql` (RLS for tenant isolation)

## Relationships & Flows
- Tenant → many wiki_docs, drafts, signals.
- Draft → may reference signal_id.
- Wiki sync updates wiki_docs → used in text generation.
- Project wiki/ (fs) → used when wiki_path provided to sourcing (bypasses tenant for dev/internal use).

## Multi-Tenancy Guarantees
- All queries go through `withTenant()` + RLS policies.
- No cross-tenant leakage.
- Credentials and guides isolated.

## Evolution Notes (gstack context)
- Moved from pure file-based (queue.json) to hybrid DB for SaaS.
- Wiki_docs added specifically for factual grounding at scale.
- Project wiki/ added 2026-06 to solve internal knowledge fragmentation as we target 1000+ subscribers.

See architecture/system-architecture.md for runtime flow. See decisions/ for why certain persistence choices were made.

**gstack instruction**: When working on data changes, read this + decisions/ first.