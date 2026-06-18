# Wiki Maintenance Guide

This wiki/ is the living knowledge base for the project. Treat it with the same rigor as production code.

## Daily / Per-Session Habits (gstack)
- Before any work: `Load gstack. Read relevant sections of wiki/`.
- After any significant change: update the corresponding wiki page + add to learnings/ if it's a pattern/pitfall.
- Use `/document-generate` (gstack) when creating new reference material.

## When to Create / Update
- New architecture decision → decisions/ (ADR format).
- New feature area (e.g. new video engine) → product/ + architecture/.
- Process change → guides/ + this file.
- Insight from shipping → learnings/.
- Env or command change → reference/.

## Structure Rules
- Every subfolder has index.md.
- Use Diataxis: reference facts in architecture/reference, how-to steps in guides, rationale in decisions/explanation.
- Link aggressively (relative paths).
- Keep service-neutral.

## Migration from Legacy
- CLAUDE.md and docs/ are being consolidated here.
- Keep short "see wiki/xxx" pointers in legacy files during transition.
- Goal: CLAUDE.md becomes thin pointer + high-level architecture; details live in wiki/.

## Quality Bar
- Accurate (every claim traceable to code or decision).
- Discoverable (index + links).
- gstack-readable (clear headings, code blocks, lists).

## Tools
- gstack /learn → learnings/
- gstack /document-generate → new pages
- grep + editor for search

Maintaining this wiki is how we scale knowledge alongside the product to support 1,000+ paying startup customers.