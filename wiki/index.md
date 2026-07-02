# openclaw-auto Project Wiki

**Single Source of Truth** for development knowledge, architecture, decisions, guides, and learnings.

**Before any significant work**: Read relevant sections here first. This keeps context consistent across sessions and team members.

## Quick Navigation

- [Overview](#overview)
- [How to contribute / use this wiki](#how-to)
- [Reference: Structure](#reference-structure)
- [Why this wiki? (Explanation)](#explanation)
- Subsections (deeper benchmark-informed structure for solid AI SaaS):
  - [architecture/](./architecture/) — technical reference & explanation (Obsidian-style markdown for AI/RAG/gstack agents)
  - [decisions/](./decisions/index.md) — ADRs: [002](./decisions/002-gstack-and-project-wiki-adoption.md) wiki+gstack 채택(001 supersede), [003](./decisions/003-moat-and-pricing-strategy.md) dual-wiki moat+하이브리드 프라이싱, [004](./decisions/004-social-connect-oauth-not-passwords.md) OAuth 연결(비번 수집 금지, Meta 실사고 로그 포함)
  - [product/](./product/) — vision, features, shorts factory, pricing (hybrid based on 2026 AI SaaS data: retention, Opus gaps) + plan-ga4-slack-central
  - [ops/](./ops/) — running the system (cron, deploy, multi-tenant) + **session-state.md** (라이브 핸드오프 정본)
  - [guides/](./guides/) — how-tos, especially gstack procedures + "benchmark deeply then decide"
  - [learnings/](./learnings/index.md) — 사고 RCA·패턴·함정 (**prompt-guide 미독 3-strike** 포함)
  - [reference/](./reference/) — [ssot-routing.md](./reference/ssot-routing.md)(**3원 SSOT 필독**) · env-vars · channel-status · brand-grounding · **benchmarking.md**(2026 경쟁·프라이싱·리텐션 데이터)

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

## Proposed Folder Structure & Rationale

**Final proposed layout** (concern-based, gstack-optimized):

```
wiki/
├── index.md                  # Hub + navigation + this rationale
├── architecture/             # "How it works" (reference + explanation quadrants)
│   ├── index.md
│   ├── overview.md
│   ├── system-architecture.md
│   └── data-model.md
├── decisions/                # History & tradeoffs (explanation)
│   ├── index.md
│   └── 00X-*.md (ADRs)
├── product/                  # What we build for users (vision + features)
│   ├── index.md
│   ├── vision.md
│   ├── shorts-factory.md
│   └── studio.md
├── ops/                      # Running & infra
│   ├── index.md
│   ├── cron.md
│   └── multi-tenant.md
├── guides/                   # Actionable "How to" (how-to + tutorial)
│   ├── index.md
│   ├── gstack-procedures.md  # THE process to follow
│   ├── contributing.md
│   └── wiki-maintenance.md
├── learnings/                # Evolving knowledge (from /learn)
│   └── *.md
└── reference/                # Fast lookup
    └── env-vars.md
```

**Why this structure (gstack principles applied):**

- **Concern/domain separation** (not flat or chronological): Agents (gstack) and humans can target precisely ("read wiki/guides/gstack-procedures.md + wiki/product/shorts-factory.md"). Matches gstack's own skill organization and "role-based" thinking (CEO=product, Eng=architecture, etc.).
- **Diataxis alignment**:
  - Reference/Explanation: architecture/, decisions/, reference/
  - How-to/Tutorial: guides/
  - Keeps content scannable and complete ("Boil the Ocean" without a 5000-line monster file).
- **Distinction from runtime tenant Brand Wiki**: Tenant wiki (in DB + sync-wiki) = facts for *generated social content* (anti-hallucination). This wiki/ = *internal dev + product knowledge*. Prevents confusion as we scale SaaS.
- **gstack workflow friendly**: /document-generate targets specific folders. /learn feeds learnings/. Procedures guide is prominent. "Before work: read wiki/..." rule in CLAUDE.md.
- **Scalable & discoverable**: Sub-index.md in every folder. Git grep friendly. Easy to grow (new feature → product/new-feature.md).  "2 clicks from root".
- **Alternatives rejected**:
  - Single flat docs/ : Becomes unnavigable.
  - By date or type only: Loses semantic grouping.
  - Merge with tenant wiki: Wrong audience and storage (repo vs DB).
- **Benefits for this project**: As we expand shorts factory + full SaaS (v4), this keeps architecture, decisions, and guides clean. Supports fork policy (service-neutral).

Start here when using gstack: "Load gstack. Read wiki/index.md and wiki/guides/gstack-procedures.md first."

## Reference: Structure

```
wiki/
├── index.md                 # This file (start here)
├── architecture/            # System design, data flow, cron, extensions
├── decisions/               # ADRs — index.md가 목차 (001은 002로 supersede)
├── product/                 # SaaS vision, shorts factory, studio, plan-ga4-slack-central
├── ops/                     # cron, multi-tenant, session-state.md(라이브 핸드오프 정본)
├── guides/                  # How-tos for common tasks (gstack procedures)
├── learnings/               # 사고 RCA·패턴 — index.md가 목차, 3-strike 승격 루프
└── reference/               # ssot-routing(3원 SSOT 필독) · env-vars · channel-status · brand-grounding · benchmarking
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

**Status**: This wiki has been comprehensively populated (architecture, product vision, ops, guides, decisions, learnings, reference) based on the full project state and development process discussions.

Last updated: 2026-07-02 (wiki-track) — ADR-004·reference 4파일·learnings 신규분 인덱스 반영, decisions/·learnings/ 서브 index 신설("2 clicks from root" 복구), 3원 SSOT 라우팅 추가. (최초 작성: 2026-06 — SaaS scaling context, target 1,000+ subscribers at ₩100k–200k/mo.)

**gstack starting instruction**: "Load gstack. Read wiki/index.md and wiki/guides/gstack-procedures.md before any work."