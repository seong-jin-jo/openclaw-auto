# OSMU Studio v10: common card and isolation

> STAMP: created_at=2026-08-05 06:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=PRD v4.2.1 and Buffer Post Groups | deliberation=카드 구조는 같고 플랫폼 내용만 다르며 어떤 행동도 다른 7개를 바꾸지 않는다

## Common card anatomy

```text
[icon] Threads                 [저장됨]
@brand_account                발행 가능
[platform-specific draft textarea                 ]
대화형 첫 문장 · 링크 허용
[Edit] [Save]                 [Publish]
처리 시각 또는 실제 게시물 permalink
```

## Elements

1. icon and platform
2. account identity or enable condition
3. card status
4. editable payload
5. platform metadata
6. Edit
7. Save
8. Publish or recovery action
9. timestamp or actual link

## States

| State | Copy | Primary action |
|---|---|---|
| nonempty | 초안 준비됨 | Edit, Save |
| empty | 내용을 입력해 주세요 | direct edit, Save |
| generation failed | 이 채널 초안을 만들지 못했어요 | 이 카드만 다시 만들기 |
| saved ready | 저장됨, 발행 가능 | Publish |
| saved unavailable | 저장됨, 연결 필요 | Settings에서 연결 |
| publishing | 이 카드만 발행 중 | locked |
| published | 발행됐어요 | 실제 게시물 보기 |

## Isolation interaction

Before a card action, capture all 8 visible snapshots: platform, text, saved label, publish state. After Threads Edit, Save, Publish only Threads snapshot may change. Other 7 must remain byte-equivalent in visible state.

### Readiness unavailable

- textarea remains editable
- Save remains enabled
- Publish disabled
- reason and enable condition beside Publish
- existing Settings > Channels route

### Platform tabs

All tabs share icon, name, state dot, card focus behavior. Tab click never filters or mutates cards.

## Red-team and self-question

공격: global toast가 저장 대상을 모호하게 만든다.

수정: toast와 card status 모두 `Threads 초안을 저장했어요`처럼 대상을 명시한다.

이게 틀렸다면 가장 그럴듯한 이유는? Publish disabled만으로 이유가 충분하지 않을 수 있다. 버튼 바로 위에 enable condition을 문장으로 둔다.

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.2.1-gpt-codex.md | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.buffer.com/article/642-scheduling-posts

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, common card structure | design-review, isolation and disabled-reason audit

SKILLS_SKIPPED: 없음
