---
title: openclaw-auto 위키
type: overview
owner: "@sj"
policy: living
updated: 2026-08-28
source: ["./0-meta/wiki-spec.md", "../session-state.osmu.md", "../session-state.studio.md"]
links: ["./0-meta/_index.md", "./1-team-brand/_index.md", "./2-product/_index.md", "./3-operations/_index.md", "./4-reference/_index.md", "./5-hubs/_index.md"]
visibility: private
---

# openclaw-auto 위키

## A안 전체 지도

| 축 | 카테고리 | 무엇을 찾는가 |
|---|---|---|
| 위키 운영 | [0-meta](./0-meta/_index.md) | 구조, 편집 규칙, 유지관리 |
| 왜 | [1-team-brand](./1-team-brand/_index.md) | 이름, 브랜드, 포지셔닝, 자산 |
| 무엇 | [2-product](./2-product/_index.md) | 제품 비전, 현재 상태, 고객·시장, 기능 |
| 어떻게 | [3-operations](./3-operations/_index.md) | 런북, 협업, 결정, 세션 이력 |
| 찾기 | [4-reference](./4-reference/_index.md) | 환경, 채널 상태, 그라운딩, 학습 기록 |
| 역할 입구 | [5-hubs](./5-hubs/_index.md) | PM, 개발, 디자인, 마케팅, 온보딩 |

## 여기서 시작하라

- 지금 제품이 실제로 어디까지 됐는지: [현재 제품·검증 상태](./2-product/build/current-state.md)
- 개발 구조를 파악하려면: [개발 허브](./5-hubs/hub-eng/_index.md)
- 운영을 재개하려면: [운영](./3-operations/_index.md)
- 콘텐츠를 만들려면: [마케팅 허브](./5-hubs/hub-mkt/_index.md)

## 현행 작업 진입점 (2026-08-28)

- 개발 절차: [guides/contributing.md](./3-operations/guides/contributing.md)
- 두 서비스 경계: [architecture/two-service-boundary.md](./5-hubs/hub-eng/architecture/two-service-boundary.md)
- 운영 runbook: [runbooks/_index.md](./3-operations/runbooks/_index.md)
- 경쟁·제작 연구: [research/2026-08-competitor-and-production-research.md](./2-product/insight/research/2026-08-competitor-and-production-research.md)

기본 공정은 Stage Controller 단계 게이트다. gstack은 선택적 보조 도구다.

**Single Source of Truth** for development knowledge, architecture, decisions, guides, and learnings.

**Before any significant work**: Read relevant sections here first. This keeps context consistent across sessions and team members.

## 과거 구조 설명

아래 설명은 2026년 6월부터 7월까지의 설계 이력을 보존한 것이다. 현재 경로와 진입점은 위 A안 전체 지도가 우선한다.

## Quick Navigation

- [Overview](#overview)
- [How to contribute / use this wiki](#how-to)
- [Reference: Structure](#reference-structure)
- [Why this wiki? (Explanation)](#explanation)
- Subsections (deeper benchmark-informed structure for solid AI SaaS):
  - [architecture/](./5-hubs/hub-eng/architecture/_index.md) technical reference and explanation.
  - [decisions/](./3-operations/decisions/_index.md) ADRs: [002](./3-operations/decisions/002-gstack-and-project-wiki-adoption.md) wiki+gstack 채택(001 supersede), [003](./3-operations/decisions/003-moat-and-pricing-strategy.md) dual-wiki moat+하이브리드 프라이싱, [004](./3-operations/decisions/004-social-connect-oauth-not-passwords.md) OAuth 연결(비번 수집 금지, Meta 실사고 로그 포함)
  - [product/](./2-product/_index.md) vision, features, shorts factory, pricing.
  - [marketing/](./5-hubs/hub-mkt/_index.md) 마케팅 실행 허브. 제품 OSMU, 계정 OSMU 팩토리의 채널·브리프·콘텐츠·실험 문서를 연결한다.
  - [operations/](./3-operations/_index.md) running the system, decisions, guides, and session history.
  - [guides/](./3-operations/guides/_index.md) how-tos and Stage Controller procedures.
  - [learnings/](./4-reference/learnings/_index.md) 사고 RCA·패턴·함정.
  - [reference/](./4-reference/_index.md) ssot-routing, env-vars, channel-status, brand-grounding, benchmarking.

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

- **Concern/domain separation** (not flat or chronological): Agents (gstack) and humans can target precisely ("read wiki/3-operations/guides/gstack-procedures.md + wiki/2-product/build/shorts-factory.md"). Matches gstack's own skill organization and "role-based" thinking (CEO=product, Eng=architecture, etc.).
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

Start here when using gstack: "Load gstack. Read wiki/index.md and wiki/3-operations/guides/gstack-procedures.md first."

## Reference: Structure

```
wiki/
├── index.md                 # This file (start here)
├── architecture/            # System design, data flow, cron, extensions
├── decisions/               # ADRs — index.md가 목차 (001은 002로 supersede)
├── marketing/               # 마케팅·브랜드 정본 — positioning · competitors · playbook · brand · growth-log · assets · proposals/
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

See [guides/gstack-procedures.md](./3-operations/guides/gstack-procedures.md) for the standard development workflow.

**Status**: This wiki has been comprehensively populated (architecture, product vision, ops, guides, decisions, learnings, reference) based on the full project state and development process discussions.

Last updated: 2026-07-16 — **워딩 재전환: 콘텐츠 공장 "OSMU 팩토리" 낙점**(ADR-005 재개정, marketing/ 전층 공장 워딩 재전파 + feedback-loop·viral-mechanics 신설) · **제품 디자인 정본 `/DESIGN.md` 신설**(토큰·컴포넌트 55·벤치마크·금지 패턴 — 하위모델 디자인 리허설 A- 실증). 이전: 2026-07-11 — 계정 브랜드 컨셉 전환(빌드로그 SJ veto → 비서 → 07-16 공장). 2026-07-07 — **marketing/ 신설**(positioning·competitors 2026-07·playbook·brand·growth-log·assets), benchmarking.md 중복 4-5회 dedupe 후 원자료 아카이브로 재정의, channel-status.md 실감사 반영. 이전: 2026-07-02 (wiki-track) — ADR-004·reference 4파일·learnings 신규분 인덱스 반영, decisions/·learnings/ 서브 index 신설("2 clicks from root" 복구), 3원 SSOT 라우팅 추가. (최초 작성: 2026-06 — SaaS scaling context, target 1,000+ subscribers at ₩100k–200k/mo.)

**gstack starting instruction**: "Load gstack. Read wiki/index.md and wiki/3-operations/guides/gstack-procedures.md before any work."
