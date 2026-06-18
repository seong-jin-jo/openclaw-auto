# openclaw-auto Project Wiki

**Single Source of Truth** for development knowledge, architecture, decisions, guides, and learnings.

**Before any significant work**: Read relevant sections here first. This keeps context consistent across sessions and team members.

## Quick Navigation

- [Overview](#overview)
- [How to contribute / use this wiki](#how-to)
- [Reference: Structure](#reference-structure)
- [Why this wiki? (Explanation)](#explanation)
- Subsections:
  - [architecture/](./architecture/)
  - [decisions/](./decisions/) — ADRs and key choices
  - [product/](./product/)
  - [ops/](./ops/)
  - [guides/](./guides/)
  - [learnings/](./learnings/)

## Overview

openclaw-auto is a service-neutral multi-channel SNS/content automation platform built on OpenClaw + Claude Agent.

Key components:
- Cron-driven generation + multi-channel publish (Threads, X, IG, video, blog, etc.).
- Next.js dashboard (studio for one-off, queue for approved).
- Extensions for publish, insights, longform-to-shorts, video-generate.
- Existing **product Brand Wiki** (tenant wiki_docs) for factual content grounding in SaaS.
- **This Project Wiki** (here): Internal dev knowledge organization.

**구분 참고**:
- Tenant/Brand Wiki: runtime에서 AI 콘텐츠에 사실 주입 (dashboard wiki_docs + sync + retrieve).
- Project Wiki: 개발/아키텍처/프로세스 지식 (gstack 절차 + docs 마이그레이션).

## How to

**Contribute**:
1. Edit or add .md files in the appropriate subdirectory.
2. Update this index if adding major sections.
3. For decisions: Add ADR in decisions/ (use template).
4. After changes, run gstack /learn to capture insights if using the toolkit.

**Search**:
- Use grep or editor search.
- Key terms: architecture, shorts, wiki, gstack, tenant.

**Migrate legacy docs**:
- Content from root CLAUDE.md / README / docs/ should move here gradually.
- Keep short summaries + link back in original if needed.

## Reference: Structure

```
wiki/
├── index.md                 # This file
├── architecture/            # System design, data flow, cron, extensions
├── decisions/               # ADRs (Architecture Decision Records)
├── product/                 # SaaS vision, shorts factory, studio
├── ops/                     # Cron, docker, deploy, env, multi-tenant
├── guides/                  # How-tos for common tasks
└── learnings/               # Patterns, pitfalls, preferences (from gstack /learn)
```

## Explanation

**Why a dedicated project wiki?**

Previously knowledge was fragmented across:
- CLAUDE.md (tech reference)
- docs/*.md (specs)
- README
- Code comments
- gstack learnings (external)

This led to context loss between sessions, hard onboarding, and repeated explanations.

**Wiki solves**:
- Central, discoverable, versioned in git.
- Complements the **product Brand Wiki** (which powers AI content generation for end-users/tenants).
- Works with gstack: /document-generate populates it, /learn feeds learnings/, procedures reference it.
- Enables "Boil the Ocean" completeness without chaos.

Follow gstack procedures for all major changes to this wiki and the product.

See [guides/gstack-procedures.md](./guides/gstack-procedures.md) for the standard development workflow.

Last updated: following gstack plan execution.