# OSMU Studio v11 additive card Publish wireframe

> STAMP: created_at=2026-08-05 07:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=PRD v4.3.1 visual7 and retry taxonomy | deliberation=existing preview와 legacy bulk를 건드리지 않고 surface 하나의 결과와 복구를 바로 아래에 붙인다

## Additive anatomy

```text
[existing PlatformPreview and existing publish checkbox]
--------------------------------------------------------
저장됨 · 발행 준비       [편집] [Publish]
```

Published:

```text
발행됨                   [편집] [게시물 보기]
https://actual-provider/permalink
```

## Safety states

```text
플랫폼 거절              [편집] [다시 발행]
거절이 확인된 이 카드만 다시 보냅니다.

결과 기록 복구 필요      [편집] [결과 기록 복구]
같은 게시물을 다시 보내지 않고 결과만 복구합니다.

발행 여부 확인 중        [편집] [결과 다시 확인]
결과 확인 전에는 다시 발행하지 않습니다.
```

## Isolation

- card Publish selected surface adapter1, other6 0
- edit/save/regenerate selected write1, other6 visible snapshot diff0
- retry only confirmed failure
- repair provider adapter0
- unknown reconcile first
- published duplicate0

## visual7

Threads, X, Facebook, Instagram, Shorts, Reels, TikTok each has the additive strip. Discord and Slack card count remains zero.

## Red-team and self-question

공격: legacy bulk and card Publish both say Publish. 수정: topbar retains selection count, card status repeatedly says `이 카드만`.

이게 틀렸다면? permalink sample may be mistaken for live output. Implementation must replace prototype sample with provider-returned actual link; without it published link is hidden.

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.3.1-gpt-codex.md | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, additive result strip | design-review, isolation and recovery audit

SKILLS_SKIPPED: 없음
