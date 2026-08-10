# OSMU Studio v11 existing 9 features wireframe

> STAMP: created_at=2026-08-05 07:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=current RepoConnect, Studio, SchedulePanel and historical commits | deliberation=기존 기능을 묶음 PASS하지 않고 각각 조작·실패·복구 surface로 고정

## Feature routing

```text
Topbar
 ├ Wiki -> RepoConnect modal -> sync / actionable error
 ├ direct source -> OSMU generate -> visual7 / partial7
 ├ AI auto draft -> History saved / timeout unknown
 ├ model+video -> drawer asset link / failure preserve old
 ├ global Save
 ├ legacy Publish(N) -> selected direct4 progress / partial
 └ Schedule -> create -> change -> cancel

Visual preview -> drawer edit -> one platform Save / conflict
History -> load -> source+payload+result / corrupt truth
```

## RepoConnect modal

- title `레포 위키 연동`
- tabs folder full / specific files
- repo, path, branch, token
- current source count
- success and error message
- sync CTA, close

## Edit drawer

- platform name
- textarea and character count where relevant
- image and video actions
- current preview
- selected surface Save
- conflict compare/resolve

## SchedulePanel

- future datetime
- current scheduled platform list
- account where applicable
- create
- schedule rows with change/cancel
- invalid time error, no create

## History

- recent rows, status, load
- partial/recovery label
- corrupt/legacy does not become published

## Red-team and self-question

공격: problem guide could look like a test toolbar. 수정: title and copy are customer troubleshooting language, and every state returns to the original surface.

이게 틀렸다면? nine rows may be long. modal scroll retains 44px actions and does not replace primary Studio UI.

SOURCES: DESIGN.md | docs/user-flow.md | dashboard/src/components/studio/RepoConnect.tsx | dashboard/src/components/studio/SchedulePanel.tsx | dashboard/src/app/studio/page.tsx | git e570442e

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, existing feature interaction map | design-review, happy, failure and dead-end audit

SKILLS_SKIPPED: 없음
