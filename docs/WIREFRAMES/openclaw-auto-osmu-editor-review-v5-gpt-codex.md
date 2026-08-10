# OSMU v5 Wireframe 02: Source, Editor, Final Review

## Editor

```text
┌ Source v7, 사람이 승인함 ───────────────────────────────────────────────┐
│ “혼자 일할수록 콘텐츠를 시스템으로 남겨야 하는 이유”                 │
│ 사실 3 · 출처 2 · CTA 1                         [원문 수정] [승인 기록] │
└────────────────────────────────────────────────────────────────────────┘
┌ Capability variants ──────────────────────┬ Surface preview ──────────┐
│ CP-IGF-IMAGE     준비됨   직접 편집        │ Instagram Feed 4:5         │
│ CP-IGR-VIDEO     즉시 가능, 예약 미검증    │ @zero_to_one_ai            │
│ body/media/privacy/disclosure validation   │ caption, image/video       │
│ [이 초안 편집] [문제 위치로 이동]          │ validation 4/4             │
└─────────────────────────────────────────────┴───────────────────────────┘
                                              [선택한 2개 검수]
```

## Final Review Sheet

```text
┌ 최종 검수 2개 ────────────────────────────────────────────────────────┐
│ TARGET     Instagram @zero_to_one_ai, workspace Minseo Academy       │
│ CONTENT    Feed IMAGE / Reels VIDEO previews                          │
│ POLICY     공개, AI 사용 표시, 상업성 CTA 확인                       │
│ TIME       (●) 지금   ( ) 예약                                       │
│ READINESS  현재: Feed 가능, Reels 예약 미검증                        │
│ [Editor로 수정]                  [지금 발행 요청] [예약 조건 보기]     │
└────────────────────────────────────────────────────────────────────────┘
```

## provider별 Editor 필드

| Provider/surface | 편집 필드 |
|---|---|
| Threads Post | TEXT/IMAGE, 본문, alt text |
| Instagram Feed | IMAGE, caption, alt text, 4:5 |
| Instagram Reels | VIDEO, caption, share-to-feed, 9:16 |
| Facebook Page Feed | TEXT/IMAGE, Page identity, 공개 범위 |
| Facebook Page Reels | VIDEO, caption, 9:16 |
| X Post | TEXT/IMAGE/VIDEO, reply policy, media status |
| YouTube Shorts | VIDEO, title, description, audience, privacy, synthetic disclosure |
| TikTok Post | VIDEO, creator, privacy, AI/commercial disclosure, consent |

## 상태

- 미승인 source: dispatch 0, `원문 승인`으로 이동.
- invalid media/privacy/disclosure: field error와 provider call 0.
- 직접 편집: source 재생성이 덮어쓰지 않는다.
- current unavailable: generation/edit는 가능, publish는 enable 조건을 연다.
- target contract: `credential/review 완료 가정`을 sheet와 result까지 유지한다.

---
🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 01:28 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SKILLS_USED: design-consultation, design-html, design-review / SKILLS_SKIPPED: 없음
SOURCES: PRD v3.1 §9~11, Buffer customize, TikTok/YouTube official review requirements
MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: 25/25
WEAKEST_LINE: provider field 차이는 prototype에서 대표 필드로 보여주고 production validation 값은 FDD에서 고정해야 한다.
