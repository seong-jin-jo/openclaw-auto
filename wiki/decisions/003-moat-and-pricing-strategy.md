# ADR-003: Dual-Wiki Moat + Retention-Aligned Hybrid Pricing for Solid AI SaaS

**Date**: 2026-06-18
**Status**: Proposed (following gstack review)
**Context**: After deep 2026 benchmarking (Opus/Munch/Pictory pricing & 20-40% discard, ChartMogul/Optifai NRR data by ACV, market CAGRs, Obsidian vs Notion for AI teams, gstack velocity). Targeting 1,000+ paying subscribers at ₩100k–200k/mo (≈$80–160 USD) with >110% NRR.

## Problem
- Existing shorts/video tools (Opus dominant) suffer high discard (20-40%), video-only focus, unpredictable credit pricing, and billing friction → poor retention at low ACV.
- Text AI tools (Jasper/Copy) are shallow on video + real multi-channel orchestration.
- AI-native SaaS shows collapsing retention at low prices: 32% NRR for sub-$50/mo plans, 61% for $50-249, 85% only above $250 (ChartMogul 2026).
- Internal knowledge is fragmented without a living "Company Brain" → slow iteration and risk of inconsistent decisions as we scale.
- Pure subscription or pure credit models fail to balance predictability for lean startups with value capture from heavy users.

## Decision
Adopt a **Dual-Wiki Knowledge Moat** combined with **Hybrid Base + Usage Pricing** as the core foundation for v4.0 SaaS:

1. **Dual-Wiki Moat**:
   - **Tenant Brand Wiki** (`wiki_docs`): Facts + brand knowledge injected at generation time for accuracy and on-brand output (anti-hallucination).
   - **Project Wiki** (`wiki/`): Obsidian-style local Markdown + Git as internal "Company Brain" for gstack/LLM agents, decisions, benchmarking, architecture. Compounds via /learn + insights.

2. **Pricing Model (target ₩100k–200k/mo)**:
   - **Base Subscription** (predictable floor):
     - Starter: ~₩80-100k — 3 channels, basic automation, limited shorts (50/mo), standard models.
     - Pro: ~₩150-200k — Unlimited channels, full Shorts Factory + insights, priority models, A/B, deeper wiki usage.
     - Team/Agency: Custom — multi-workspace, white-label, API, custom extensions.
   - **Usage Add-ons** (expansion):
     - Per extra 1,000 generations or per 10 shorts minutes.
     - Priority processing / advanced video models.
   - Goal: Land most customers in mid-tier ($50-250 equivalent) for 61%+ NRR base, drive expansion to >110% NRR overall.

3. **Execution Principles**:
   - Always benchmark (this page + reference/benchmarking.md) before pricing or moat changes.
   - Use gstack procedures (office-hours → plan reviews → autoplan) for all major SaaS work.
   - Instrument viral_signals + performance → feed back into prompts/styles + wiki.

## Rationale (from 2026 Deep Benchmark)
- **Retention Data**: Low-ACV pure credit (Opus-style) leads to 32% NRR. Hybrids win because base gives predictability for startup budgets while usage captures success. Mid-tier + expansion path is the only viable route to 1000+ subs with healthy NRR.
- **Competitor Gaps**: Opus ~20-40% discard + no facts grounding + billing complaints. Our wiki facts + agentic multi-channel directly attacks this. Project wiki + gstack gives internal velocity moat competitors can't easily copy.
- **Wiki as Moat**: Local Markdown (Obsidian pattern) wins for AI agents and compounding knowledge (Garry gbrain / Karpathy patterns). Tenant wiki solves product accuracy; project wiki solves dev speed. Dual setup is hard to replicate.
- **Market Timing**: AI content tools growing fast (13-32%+ CAGRs in segments). Vertical SaaS with strong data/knowledge flywheels commands premiums. gstack velocity (810x benchmark) lets us iterate faster than closed tools.
- Aligns with "pay for outcomes" (hours saved + viral posts) while keeping base affordable.

## Trade-offs
- More complex billing/usage tracking than pure sub or pure credit (mitigated by phased rollout).
- Requires strong instrumentation of insights loop early.
- Higher initial ACV target means we must deliver clear ROI (quality + time saved) from day one.
- Separating two wikis adds minor mental model load (but prevents confusion long-term).

## Consequences
- **Positive**:
  - Defensible moat: knowledge flywheel + data loop + velocity.
  - Path to >110% NRR and sustainable 1000+ subs.
  - Clear differentiation vs Opus (facts + multi-channel) and Jasper (full automation + shorts).
- **Immediate Next (gstack-enforced)**:
  - Deep wiki reflection of pricing + moat first (this ADR + vision.md + benchmarking.md).
  - Run full gstack /office-hours → reviews → /autoplan before any code.
  - Then implement usage tracking + shorts grounding with discipline (read files, plan comments, verify).
  - Update roadmap and learnings.
- All future pricing experiments or changes must follow gstack procedures and be recorded here.
- Re-benchmark quarterly or before any pricing change.

**gstack Process Note (2026-06-18 follow-up)**: Initial implementation was premature. Reverted to proper flow: office-hours + CEO/Eng review → deepened wiki reflection → concrete plan before further code. See learnings for details.

## Related
- wiki/reference/benchmarking.md (source data + tables)
- wiki/product/vision.md (updated with this strategy)
- decisions/002 (gstack + wiki adoption)
- guides/gstack-procedures.md
- architecture/data-model.md (will extend for usage)

This decision was reached after deep external benchmarking + internal gstack-style review (office-hours forcing questions on demand, retention reality, narrow wedge, and defensibility). All future SaaS monetization work follows gstack procedures.