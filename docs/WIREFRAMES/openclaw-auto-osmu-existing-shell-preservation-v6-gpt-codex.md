# WF-01 Existing Marketing Hub Shell Preservation v6

## Purpose

기존 Marketing Hub의 navigation과 visual shell을 OSMU 기능 추가 뒤에도 그대로 식별할 수 있게 한다.

## Desktop 1024

```text
+----------------------+--------------------------------------------------+
| Marketing Hub        | OSMU Studio                         [theme] [user]|
| Overview             |--------------------------------------------------|
|  성과                | Existing page content                            |
|  OSMU Studio         | Additive OSMU workflow strip                     |
|  승인 인박스         |                                                  |
|  발행 캘린더         |                                                  |
| Social 5             |                                                  |
| Messaging 3          |                                                  |
| Video 2              |                                                  |
| Data & Analytics 3   |                                                  |
| Keyword Research 4   |                                                  |
| Custom Integration 1 |                                                  |
| Assets & Tools 3     |                                                  |
| System 1             |                                                  |
+----------------------+--------------------------------------------------+
```

### Elements

- Sidebar width 224px.
- Actual group order and 26 customer route items.
- Existing footer theme and logout controls.
- Active route uses `--accent-soft` and `--accent`.
- No new platform group, no `OSMU PROVIDERS`.

### States

- default, active, hover, focus-visible, dark.
- operator role swaps to existing Admin shell. It does not mix operator links into customer shell.

### Interactions

- Every item opens its actual route target.
- OSMU workflow is reached through existing Studio, Inbox, Calendar.
- Platform-specific functions remain under existing channel route.

## Mobile 390

- Sidebar becomes full-width top region following current responsive behavior.
- Route links form horizontal scroll rows with 44px targets.
- Content is one column.
- No prototype-only bottom navigation is added.

## Acceptance

- Sidebar `26/26`, groups `9/9`, renamed `0`, moved `0`, removed `0`.
- Existing page entry inventory `24/24` documented.
- Invented top-level navigation `0`.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 16:22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer | skills: design-html, design-review, browse | evidence: dashboard/src/components/layout/Sidebar.tsx | 고민: OSMU 범위를 넓혀도 기존 Marketing Hub 전체를 축약하지 않았다.

SKILLS_USED: design-html - responsive shell specification / design-review - source fidelity review / browse - viewport QA method
SKILLS_SKIPPED: 없음
SOURCES: `dashboard/src/components/layout/Sidebar.tsx`, `dashboard/src/app/globals.css`
MODEL: gpt-codex/gpt-5.6-sol
