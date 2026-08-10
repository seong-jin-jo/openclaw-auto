# OSMU v5 Wireframe 03: Global and Platform Settings

## Global Settings > Channels

```text
┌ Provider ┬ Accounts ┬ Default identity ┬ Customer state ┬ Readiness ┬ Verified ┬ Action ┐
│ Threads  │ 2        │ @code_zero...    │ 재연결 필요   │ hard stop │ 01:18    │ 진단   │
│ Instagram│ 1        │ @zero_to_one_ai  │ 연결됨         │ Feed 가능│ 01:17    │ 설정   │
│ Facebook │ 0        │ 없음             │ 준비 안 됨     │ review R │ 없음     │ 조건   │
│ X        │ 0        │ 없음             │ 준비 안 됨     │ cost R   │ 없음     │ 조건   │
│ YouTube  │ 1        │ Minseo Academy   │ 준비 안 됨     │ audit R  │ 00:51    │ 조건   │
│ TikTok   │ 0        │ 없음             │ 준비 안 됨     │ audit R  │ 없음     │ 조건   │
└──────────┴──────────┴──────────────────┴────────────────┴───────────┴──────────┴────────┘
```

Global은 요약과 routing만 제공한다. raw credential과 surface 세부값은 Platform Settings에만 있다.

## Platform Settings

```text
┌ Instagram Settings ───────────────────────────────────────────────────┐
│ 1 연결·인증          A  연결됨                                       │
│ 2 계정·기본값        A  @zero_to_one_ai                              │
│ 3 권한·심사          A  publish/insights                             │
│ 4 발행 준비도        A  Feed / Reels 별도                            │
│ 5 콘텐츠 규칙        A  IMAGE / VIDEO                                │
│ 6 예약               A/R Feed 지원 / Reels review-required           │
│ 7 알림               A  token/container failure                      │
│ 8 연결해제·삭제      A  revoke/unlink                                │
│ 9 고급 복구          A  Graph token diagnosis, 기본 비노출           │
├───────────────────────────────────────────────────────────────────────┤
│ 선택 상세: 고객 상태 / 이유 / official evidence / enable 조건 / CTA │
└───────────────────────────────────────────────────────────────────────┘
```

## 6×9 matrix

| Provider | 연결·인증 | 계정·기본값 | 권한·심사 | 발행 준비도 | 콘텐츠 규칙 | 예약 | 알림 | 연결해제·삭제 | 고급 복구 |
|---|---|---|---|---|---|---|---|---|---|
| Threads | A | A | A | A | A | A | A | A | A |
| Instagram | A | A | A | A | A | A/R | A | A | A |
| Facebook | A | A | R | R | A/R | A/R | A | A | A |
| X | A | A | R | R | A/R | A/R | A | A | A |
| YouTube | A | A | R | R | A | R | A | A | A |
| TikTok | A | A | R | R | A | R | A | A | A |

각 셀은 실제 선택 가능하며 customer state, 이유, evidence, enable 조건이 detail pane에 나온다. `N`이 필요한 provider별 상세값은 `이 플랫폼에는 적용되지 않음`을 표시한다.

## Recovery

- wrong-account: `계정 바꾸기`.
- token invalid: `다시 연결`, draft 보존.
- provider unreachable: `계정 다시 확인`, 저장됨과 연결됨 분리.
- review missing: `준비 조건 보기`, customer publish disabled.
- disconnect/delete: 영향 범위 확인, 외부 link 자동 삭제 가정 금지.

---
🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-04 01:28 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SKILLS_USED: design-html, design-review / SKILLS_SKIPPED: 없음
SOURCES: PRD v3.1 §8, QA TC-003~007·019·021
MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: 25/25
WEAKEST_LINE: A/R 조합은 surface마다 상태가 다른 경우이며 detail pane에서 Feed/Reels를 분리해야 한다.
