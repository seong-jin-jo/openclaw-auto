# Learning: Deep 2026 Benchmark + Establishing Solid SaaS Foundation (Moat + Pricing)

**Date**: 2026-06-18
**Context**: User requested deeper benchmarking after initial wiki fill ("오 더 깊게 벤치해보자. 이왕 AI SaaS만드는거 탄탄하게 하게"). We executed comprehensive external research + updated wiki.

## Key Insights Captured
- AI SaaS retention is brutal at low ACV: 32% NRR for sub-$50 plans (ChartMogul/Optifai). Only mid-tier ($50-250) + hybrid models give a fighting chance at 61%+ base and >110% with expansion.
- Opus Clip (current leader): $15/29 pricing, ~20-40% user discard, video-only, billing complaints. Massive opportunity in facts grounding + multi-channel + predictable pricing.
- Wiki tools: Obsidian + local Markdown + Git wins for AI "Company Brain" (RAG, agents, gstack, portability). Notion is common but becomes a graveyard and lock-in risk.
- gstack velocity (Garry 810x) + dual-wiki is a real moat when combined with data flywheel.
- Market growth is real (13-32%+ CAGRs in content/video segments), but quality + retention problems in incumbents create wedge.

## What We Did (Sequence Executed)
1. Deep parallel web + page + X searches on competitors, NRR, markets, wiki patterns.
2. Cleaned and enriched reference/benchmarking.md with tables (pricing, NRR by tier, CAGRs, gaps).
3. Updated vision.md, shorts-factory.md, data-model.md, product/index.md.
4. Created ADR-003: Dual-Wiki Moat + Hybrid Pricing.
5. Followed gstack procedures mindset throughout (benchmark → review → document).

## Implications & Preferences
- Never decide pricing or major features without fresh benchmarking recorded here.
- Prioritize hybrid base + usage over pure credit.
- Project wiki (this repo) and tenant wiki must stay clearly separated.
- Shorts Factory must explicitly target "fact-grounded, low-discard" positioning.
- Use gstack /office-hours + plan reviews before implementing monetization or major product changes.

## Implementation Progress (continuous)
- DB schema extended with usage_events, subscriptions, usage_quotas (for hybrid base+usage per ADR-003).
- /api/usage + /api/usage/record enhanced: new events (shortsGeneration, shortsVideoMinute), tier + quota in responses.
- sourcing/route.ts (key Shorts Factory entry):
  - Loads tenant wiki_docs facts (recent) + supports project wiki_path.
  - Injects facts into prompts for better grounding (directly addresses 20-40% discard benchmark).
  - Auto-records shortsGeneration usage.
  - Strengthened rules for fact adherence.
- Dashboard main page: Usage card now shows tier badge, quota progress, updated labels for hybrid pricing.
- Fully backward compatible with existing usage.json.

## Next Actions (keep progressing)
- Add quota enforcement (e.g. limit candidates or 402 in sourcing if over quota).
- Integrate shortsVideoMinute in video/generate.
- Tenant settings / upgrade UI for tiers.
- Monthly quota reset cron + migrate usage to DB aggregates.
- /autoplan on next (e.g. billing reports or trend miner).
- Re-benchmark before pricing UI polish.

This proves "benchmark → decide (ADR) → implement continuously". Load wiki before next work.

**Captured via gstack-style process**. Related: decisions/003, reference/benchmarking.md, product/vision.md, architecture/data-model.md.