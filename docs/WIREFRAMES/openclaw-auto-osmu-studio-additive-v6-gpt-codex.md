# WF-02 Existing OSMU Studio Additive Flow v6

## Purpose

기존 Studio의 idea, brand setup, AI generation, 7 preview, save, publish, schedule을 보존하면서 승인 가능한 one-source workflow를 추가한다.

## Desktop layout

```text
+--------------------------------------------------------------------------+
| OSMU Studio                                                              |
| [1 원문과 내 브랜드 정보] [2 플랫폼별 버전] [3 승인] [4 발행과 결과]     |
+--------------------------------------+-----------------------------------+
| 기존 idea input                      | 연결 및 발행 준비도               |
| 기존 brand setup + 내 브랜드 정보   | Threads @handle [연결 확인 필요]  |
| [AI로 플랫폼별 초안 만들기]          | Instagram @handle [연결됨]         |
| 기존 save / history                  | X [플랫폼 준비 안 됨]              |
+--------------------------------------+-----------------------------------+
| Existing preview rail: Threads X Instagram Facebook Shorts Reels TikTok |
| selected preview + existing edit drawer                                  |
+--------------------------------------------------------------------------+
| [초안 저장] [검수로 보내기] [예약] [지금 발행]                           |
+--------------------------------------------------------------------------+
```

## Elements

- Existing idea input, brand wizard, Wiki link, platform preview rail, edit drawer.
- Add `내 브랜드 정보`: 상품명, 가격, CTA, 금지 표현, last confirmed.
- Add readiness row: target identity, current support, action.
- Add final review summary before existing publish action.
- Customer copy uses `게시물 링크`, not `permalink`.

## States

| State | View | Action |
|---|---|---|
| empty | 원문 없음 | 원문 작성, 아이디어 불러오기 |
| generating | selected card skeleton only | 취소, background continue |
| generated | 7 existing preview cards | edit, save, review |
| unsupported | card remains visible and disabled | reason, settings or exclude |
| account mismatch | publish blocked | reconnect, verify result |
| dirty source | approved variants marked changed | regenerate, keep edit, compare |
| dispatch ready | target, content, privacy, time all shown | approve and dispatch |

## Interactions

- Editing one preview does not overwrite others.
- Selecting a platform updates existing edit drawer.
- `검수로 보내기` routes to `/inbox` with group context.
- `예약` routes to existing SchedulePanel, then `/calendar`.
- `지금 발행` opens review sheet before provider call.

## Current versus target

- Current direct publish 4: Threads, X, Facebook, Instagram.
- Existing preview 7: Threads, X, Instagram, Facebook, Shorts, Reels, TikTok.
- Video preview states remain `초안 생성 가능`, not falsely `발행 가능`.
- Full target 8 surface is visible as roadmap readiness inside Studio, not a new sidebar.

## Mobile 390

- Workflow strip horizontal scroll.
- Readiness summary collapses after identity line.
- Preview rail horizontal scroll, one selected card full-width.
- Sticky action bar has `초안 저장` and `검수로 보내기`; publish options open a sheet.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 16:22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer | skills: design-html, design-review, browse | evidence: dashboard/src/app/studio/page.tsx | 고민: 새 composer를 만들지 않고 기존 Studio에 검수와 truth만 붙였다.

SKILLS_USED: design-html - layout and state specification / design-review - content and responsive review / browse - interaction QA method
SKILLS_SKIPPED: 없음
SOURCES: `dashboard/src/app/studio/page.tsx`, `dashboard/src/components/studio/*`, Buffer scheduling official guide
MODEL: gpt-codex/gpt-5.6-sol
