# How to Develop with gstack Procedures

This guide defines the standard process for all significant work in openclaw-auto.

**Always follow this** for features, refactors, wiki improvements, shorts factory work, etc. It turns the AI + human into a virtual engineering team (Garry Tan's gstack model).

## Standard Pipeline

1. **Prepare**
   - Update to latest gstack if needed.
   - Ensure you have read the relevant `wiki/` sections + CLAUDE.md.

2. **Start with /office-hours**
   ```
   Load gstack. Run /office-hours "Describe the goal or idea in detail"
   ```
   This surfaces assumptions, scope, and forcing questions.

3. **Run reviews**
   - `/plan-ceo-review` (vision, scope, ambition)
   - `/plan-eng-review` (architecture, tech choices)
   - `/plan-design-review` + `/plan-devex-review` (UX, DX, if UI involved)

4. **Generate plan**
   ```
   Load gstack. Run /autoplan
   ```
   Produces a concrete, reviewed execution plan. Save it (often to wiki/decisions/ or plans/).

5. **Implement following gstack-lite discipline**
   - Read every relevant file before editing.
   - Write a tiny 5-line plan comment at top if complex.
   - Self-review before marking done.
   - Use todo lists for multi-step.

6. **Rigorous verification**
   - `/review` on the changes.
   - `/qa` (use gstack browse for any flows, dashboards, or external interactions; capture annotated screenshots).
   - `/cso` for security-sensitive.

7. **Ship**
   - `/ship` or `/land-and-deploy`.
   - Update wiki/ (new decisions, guides, learnings).

8. **Capture & Document**
   - `/learn` (patterns, pitfalls, preferences).
   - `/document-generate` for any new feature docs.
   - Add to wiki/learnings/ or wiki/ as appropriate.

## OpenClaw Integration

When OpenClaw spawns Claude Code sessions for heavy work:
- "Load gstack. Run /office-hours ..."
- "Load gstack. Run /autoplan ..."
- "Load gstack. Run /qa [url]"

See root CLAUDE.md for full routing and dispatch tiers.

## Principles (Boil the Ocean)

- Completeness is cheap with AI — do the full thing (tests, edge cases, docs, verification).
- One lake at a time, but reach the ocean.
- Context is king: wiki/ + gstack learnings prevent amnesia.
- Evidence over assertion: screenshots, command outputs, test results.

## Examples in this project

- Introducing this Project Wiki: followed office-hours → reviews → autoplan → this guide + ADR.
- Shorts factory enhancements: Always start from wiki/product/ + longform-to-shorts + video-generate docs.

Start every new initiative by invoking the pipeline. No exceptions for medium+ scope.