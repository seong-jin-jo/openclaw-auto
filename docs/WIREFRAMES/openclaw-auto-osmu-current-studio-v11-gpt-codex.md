# OSMU Studio v11 current baseline wireframe

> STAMP: created_at=2026-08-05 07:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=current Studio, Sidebar, PlatformPreview, history | deliberation=현행 topbar, visual groups, history, drawer를 먼저 복제해 additive 경계를 고정

## 1024 current structure

```text
[Customer Sidebar 224]
  Marketing Hub       | OSMU Studio | AI | source | model | video
  Overview            | 브랜드 | 위키 | OSMU 생성 | AI 자동초안
  Social              | 생성 후 Save | Publish(N) | 예약 | 문제 해결
  Messaging           | [progress]
  Video               | [SchedulePanel]
  Data                | ┌ text rail: Threads X Facebook ┐ [History]
  Keyword             | ├ video rail: Shorts Reels TikTok┤
  Assets              | └ card rail: Instagram           ┘
  Settings            | [edit drawer on preview click]
```

## Elements

- exact customer nav 26 / headings9
- Studio topbar labels and order preserved
- visual7 group and order preserved
- right History 208px
- current global Save, checkbox, `Publish(N)`, Schedule preserved
- additive card strip directly under each preview only

## States

- before generate: guidance + History
- generated: visual7
- partial: 5 valid, Reels failed, TikTok empty, slots7
- bulk running/partial
- schedule open
- edit drawer

## Interactions

- Wiki opens current 2-mode modal
- preview opens drawer
- History load restores source and states
- card Publish changes one surface
- top Publish changes selected direct4 only

## 390

- existing labels/routes remain in horizontal customer nav
- all 26 accessible after wrapper visibility repair
- topbar wraps, source full width
- rails scroll internally, document overflow0
- History below rails, drawer full width

## Red-team and self-question

공격: card action strip changes preview silhouette. 수정: it begins after current preview frame and does not enter PlatformPreview.

이게 틀렸다면? visual video height dominates 390. current aspect is preserved and horizontal rail prevents stacking all three video surfaces.

SOURCES: DESIGN.md | docs/user-flow.md | dashboard/src/app/studio/page.tsx | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/components/studio/PlatformPreview.tsx

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, current layout wireframe | design-review, preservation and responsive audit

SKILLS_SKIPPED: 없음
