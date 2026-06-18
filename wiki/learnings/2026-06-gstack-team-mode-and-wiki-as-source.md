# Learnings: gstack Team Mode + Project Wiki as Shorts Source

**Date**: 2026-06
**Type**: process + product

**Key Insight**:
Installing gstack in team mode + creating a dedicated project wiki solved two hard problems simultaneously:
1. Context fragmentation between sessions (the #1 productivity killer when using AI heavily).
2. Lack of structured development process as we move from private automation tool to SaaS product targeting 1,000+ subscribers.

**Specific Wins**:
- wiki/ structure makes it trivial for gstack agents to load exactly the right knowledge ("read wiki/product/shorts-factory.md").
- wiki_path support in /api/sourcing turned the internal knowledge base into a first-class source for the shorts factory. This is powerful for project updates, announcement variants, and dogfooding.
- gstack procedures (documented in guides/) give us a repeatable way to ship complex features (shorts integration, multi-tenant, etc.) with review gates.
- Separation of Project Wiki (dev knowledge) vs Tenant Brand Wiki (customer facts) is clean and prevents scope creep.

**Pitfalls Observed**:
- Initially under-estimated the value of sub-index.md files in every folder.
- Need to be disciplined about updating wiki immediately after architectural or process changes (otherwise it rots fast).

**Follow-up**:
- Continue migrating legacy docs into wiki/.
- Use wiki as source more broadly (e.g. generate release notes or blog posts about the platform).
- Run full gstack /autoplan + /qa on next major shorts or SaaS feature.

**Confidence**: 9/10 (early but already high leverage)

This pattern (structured knowledge base + rigorous agent procedures) is likely a core part of how we reach and support 1,000+ paying early-stage startup customers.