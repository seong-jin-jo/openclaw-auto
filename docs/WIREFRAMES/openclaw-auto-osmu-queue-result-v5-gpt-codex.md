# OSMU v5 Wireframe 04: Queue, Calendar, Result, Recovery

## Queue and Result Group

```text
┌ Queue filters: 전체 초안 예약됨 발행 중 처리 중 결과 확인 중 발행됨 실패 ┐
│ Source v7 / CP-THR-TEXT / @code_zero... / 발행됨 / [게시물 보기]         │
│ Source v7 / CP-IGR-VIDEO / @zero_to...  / 처리 중 / [계속 확인]         │
│ Source v7 / CP-X-TEXT / @minseo...       / 결과 확인 중 / [결과 조회]   │
│ Source v7 / CP-TT-VIDEO / @minseo...     / 실패 / [실패만 복구]         │
└─────────────────────────────────────────────────────────────────────────┘

┌ Result Group: Source v7 ────────────────────────────────────────────────┐
│ 12 capabilities selected 4 / published 1 / processing 1 / reconciling 1│
│ external ID, link, target identity, published-at or next check           │
│ [성공 결과 열기] [실패 1건만 복구] [Calendar에서 보기]                  │
└──────────────────────────────────────────────────────────────────────────┘
```

## Recovery panel

```text
┌ 결과 확인이 필요합니다 ────────────────────────────────────────────────┐
│ 상태: 502 / timeout / partial                                            │
│ 영향: CP-X-TEXT 1건, 성공한 3건은 재발행하지 않음                       │
│ correlation ID: COR-OSMU-2804                                           │
│ idempotency key: source-v7:x:text                                        │
│ [외부 결과 먼저 확인] [Queue로 돌아가기]                                │
└──────────────────────────────────────────────────────────────────────────┘
```

## 상태 전이

`초안 → 예약됨 또는 발행 중 → 처리 중 또는 결과 확인 중 → 발행됨 또는 실패`

- processing terminal 전 published 0.
- timeout/502는 same dispatch reconciliation.
- duplicate click은 기존 Result Group을 연다.
- partial은 성공을 고정하고 실패만 복구한다.
- Calendar는 Queue와 같은 데이터, 다른 view다.

## Empty/loading/error

- Queue empty: `첫 원문 만들기`.
- Calendar empty date: `이 날짜에 발행이 없습니다`, `다른 날짜 보기`.
- local loading: 선택 row 한 곳만 skeleton.
- terminal error: 초안 편집, 다시 검수.

---
🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 01:28 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SKILLS_USED: design-consultation, design-html, design-review / SKILLS_SKIPPED: 없음
SOURCES: PRD v3.1 §9·10, TikTok status, YouTube processingDetails, Postiz draft/schedule/status
MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: 25/25
WEAKEST_LINE: provider별 cancel 가능 여부는 FDD가 official API 계약으로 고정해야 한다.
