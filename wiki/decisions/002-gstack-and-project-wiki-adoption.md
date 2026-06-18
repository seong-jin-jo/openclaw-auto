# ADR-002: Adopt gstack for Development Process + Introduce Project Wiki for Knowledge Organization

**Date**: 2026-06
**Status**: Accepted
**Context**: Targeting early SaaS with 1,000+ subscribers paying ₩100k–200k/mo. Need velocity + knowledge as competitive advantage.

## Problem
- Knowledge fragmented → repeated explanations, context loss between AI sessions, slow onboarding for new contributors.
- Development was ad-hoc → quality variance, missed edge cases, slow iteration on complex features like shorts factory.
- As we scale to support many tenants, internal discipline becomes product moat.

## Decision
1. Install gstack (Garry Tan's toolkit) in team mode in this repo.
2. Create `wiki/` as project-level Single Source of Truth (distinct from tenant Brand Wiki).
3. Mandate gstack procedures for all medium+ work (office-hours → plan-* reviews → autoplan → implement + review/qa/ship + capture + document).
4. Wire project wiki into product features (e.g. wiki_path in sourcing for shorts).

## Rationale
- gstack encodes proven high-leverage builder judgment + structured delegation.
- Wiki + gstack learn/document tools turns every session into compounding knowledge.
- Matches our product philosophy: structured knowledge (wiki) + agent judgment (OpenClaw + gstack) = leverage.
- Directly supports monetization goal: faster, higher-quality shipping of features that let customers run content like a team of 20.

## Trade-offs
- Initial setup + learning curve (mitigated by this wiki and procedures guide).
- More ceremony for small changes (use "Simple" tier for <10 line fixes).
- Separate wiki from tenant system (correct — different users and persistence).

## Consequences
- CLAUDE.md updated with routing.
- wiki/ structure implemented (see index.md for details).
- First integration: project wiki as longform source in shorts pipeline.
- Future work (shorts enhancements, SaaS features) will be planned/executed via this system.

## Related
- decisions/001 (initial wiki structure)
- guides/gstack-procedures.md
- All major pages in wiki/ now reference this process.

This ADR was itself created following the gstack plan process.