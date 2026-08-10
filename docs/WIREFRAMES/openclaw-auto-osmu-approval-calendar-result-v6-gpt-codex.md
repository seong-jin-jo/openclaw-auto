# WF-04 Existing Inbox, Calendar, Result Additions v6

## Purpose

기존 approval inbox와 month calendar를 보존하고 플랫폼별 독립 승인 및 결과 회수를 추가한다.

## Approval Inbox

```text
승인 인박스
[원문] [플랫폼별 버전] [승인] [발행과 결과]

원문: 8월 클래스 모집 안내             5개 버전 중 3개 준비됨
+------------------------------------------------------------------+
| Threads @handle     준비됨      [보기] [승인]                     |
| Instagram Feed      이미지 필요 [수정] [제외]                     |
| X @handle           준비됨      [보기] [승인]                     |
| YouTube Shorts      발행 준비 중 [지원 상태]                      |
+------------------------------------------------------------------+
[반려] [선택 승인] [시간 선택] [지금 발행]
```

Existing behaviors retained: draft list, video preview, tone sliders, AI seed, approve/reject, scheduling hour, A/R and arrow shortcuts.

## Calendar and result detail

```text
발행 캘린더                         [이전] [오늘] [다음]
+-----------------------------------+-------------------------------+
| existing month grid               | 8월 8일                       |
| draft approved scheduled          | 10:30 Threads 예약됨          |
| published failed                  | 10:30 Instagram 발행됨 [보기] |
|                                   | 10:30 X 일시 장애 [결과 확인] |
+-----------------------------------+-------------------------------+
```

## States and recovery

| State | Detail | Next action |
|---|---|---|
| draft | variant count, missing fields | Studio에서 수정 |
| approved | approver, approved version | 시간 선택 |
| scheduled | platform, account, due | 취소, 재예약 |
| publishing | requested-at | 결과 다시 확인 |
| processing | provider video processing | 자동 확인, 상세 |
| published | external result ID and 게시물 링크 | 게시물 보기 |
| failed | reason, correlation ID, duplicate guard | safe retry or edit |
| partial | each platform independent | failed only recovery |

## Interaction rules

- Group actions never silently include disabled variants.
- Success is immutable under failed-item retry.
- External result opens in a new tab with accessible label.
- 502 is rendered inside detail panel, never as a blank page.
- Empty date returns `새 콘텐츠 만들기` and `오늘로 이동`.

## Mobile 390

- Calendar becomes month grid then selected-day list.
- Result group uses one card per platform.
- Bottom sheet presents cancel, reschedule, result check.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 16:22 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer | skills: design-html, design-review, browse | evidence: inbox/page.tsx, calendar/page.tsx, Buffer Post Groups | 고민: partial failure에서 이미 성공한 플랫폼을 다시 누르지 못하게 했다.

SKILLS_USED: design-html - stateful screen specification / design-review - completeness and error review / browse - click QA method
SKILLS_SKIPPED: 없음
SOURCES: `dashboard/src/app/inbox/page.tsx`, `dashboard/src/app/calendar/page.tsx`, https://support.buffer.com/article/961-using-post-groups-in-buffer
MODEL: gpt-codex/gpt-5.6-sol
