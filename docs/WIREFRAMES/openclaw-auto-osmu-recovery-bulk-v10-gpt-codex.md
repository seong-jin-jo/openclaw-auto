# OSMU Studio v10: safe recovery and explicit bulk

> STAMP: created_at=2026-08-05 06:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=PRD v4.2.1 retry taxonomy | deliberation=재발행, 결과 기록 복구, 결과 확인을 고객이 혼동하지 않게 서로 다른 문장과 행동으로 분리

## Recovery state A: provider declined

```text
플랫폼이 발행을 거절했어요
초안은 보존됐어요. 내용을 확인한 뒤 이 카드만 다시 보냅니다.
[초안 수정] [다시 발행]
```

## Recovery state B: result record incomplete

```text
게시물은 올라갔지만 결과 저장이 덜 됐어요
같은 게시물을 다시 보내지 않고 기존 결과만 복구합니다.
[결과 기록 복구]
```

## Recovery state C: outcome unknown

```text
발행 여부를 확인 중이에요
확인이 끝날 때까지 다시 발행하지 않습니다.
[결과 다시 확인]
```

## Published

```text
발행됐어요 · 방금
[실제 게시물 보기]
```

provider home fallback은 사용하지 않는다.

## Explicit bulk disclosure

```text
[일괄 발행 ▾]  기본 선택 0
  [ ] Threads  [ ] X  [ ] Instagram
  Facebook, Bluesky, Telegram, Discord, Slack은 조건 충족 전 선택 불가
  [선택한 0개 검토] disabled
```

### Interactions

- disclosure open has no dispatch
- selection has no dispatch
- review shows target account and content summary
- final confirm only dispatches selected ready cards
- cancel returns to workspace with card state unchanged

## Dead-end

- declined: edit or retry
- record incomplete: repair or help
- unknown: check result or help
- published: actual link or next card
- bulk review: cancel

## Red-team and self-question

공격: `결과 기록 복구`가 고객에게 추상적이다.

수정: `같은 게시물을 다시 보내지 않아요` 설명을 행동 바로 위에 둔다.

이게 틀렸다면 가장 그럴듯한 이유는? 고객이 unknown에서 반복 확인을 누를 수 있다. 확인 중에는 버튼을 잠그고 다음 확인 가능 시각을 표시한다.

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.2.1-gpt-codex.md | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, recovery and bulk interaction | design-review, duplicate-risk and dead-end audit

SKILLS_SKIPPED: 없음
