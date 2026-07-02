# ADR-001: Introduce Project Wiki for Organization and Adopt gstack Procedures for Product Development

**Date**: 2026-06 (during planning session)
**Status**: Superseded by [ADR-002](./002-gstack-and-project-wiki-adoption.md) — 같은 결정의 초안본, 002가 정본 (2026-07-02 wiki-track 정리)
**Deciders**: User + AI agent following gstack plan

## Context

- Knowledge was fragmented: CLAUDE.md, 4 files in docs/, README, code, gstack learnings (external).
- Existing `dashboard` tenant wiki_docs is for *product* (brand facts for AI content generation in SaaS).
- User requested: Introduce wiki into the *project* itself to organize, and develop product following gstack (Garry Tan) procedures.
- Goal: Better onboarding, consistent context for AI sessions, high-quality development for SaaS/short-form factory expansion.

## Decision

1. Create `wiki/` at repo root as the **project-level Single Source of Truth** (separate from tenant Brand Wiki).
2. Structure with Diataxis-friendly folders + index.
3. Formalize gstack procedures as the mandatory workflow for all medium+ work.
4. Migrate/consolidate docs over time.
5. Record this as the first ADR.

## Consequences

**Positive**:
- AI and humans start from same knowledge.
- gstack /document-generate + /learn integrate naturally.
- Clear separation: project wiki (dev) vs brand wiki (runtime content).
- Enforces thorough, role-based development (CEO/Eng/Design/QA).

**Negative / Trade-offs**:
- Initial migration effort (docs are small today).
- Discipline required to keep wiki updated (mitigated by gstack pipeline).
- One more place to check (but index + "read wiki first" rule helps).

## Alternatives Considered

- Put everything in root docs/ or CLAUDE.md: Too monolithic, hard to navigate/grow.
- Use external tool (Notion/Obsidian only): Loses git versioning and fork-friendliness.
- Merge into tenant wiki system: Wrong scope (customer vs internal dev).

## Implementation Notes

- See `wiki/index.md` and `wiki/guides/gstack-procedures.md`.
- Updated CLAUDE.md with routing and wiki priority.
- Follow full gstack pipeline for this and future work.

## Related

- wiki/guides/gstack-procedures.md
- CLAUDE.md (gstack section)
- Existing tenant wiki: dashboard/src/lib/wiki-retrieve.ts and sync-wiki API (for contrast).