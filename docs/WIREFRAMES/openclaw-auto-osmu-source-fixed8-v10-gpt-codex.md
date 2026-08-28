# OSMU Studio v10: source to fixed 8 workspace

> STAMP: created_at=2026-08-05 06:22 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=PRD v4.2.1, actual Studio and Sidebar | deliberation=생성 버튼 한 번 뒤 카드 8개가 누락 없이 같은 workspace에 남아야 한다

## Screen A: Studio source

```text
Marketing Hub sidebar | OSMU Studio
                      | 원문 한 번, 채널별 초안 8개
                      | [원문 textarea                              ]
                      | [브랜드 톤] [이미지] [Generate Drafts]
                      | 원문을 입력하면 8개 채널 초안을 만들어요
```

### Elements

- 기존 26개 Sidebar와 `/studio` active state
- `OSMU Studio` title과 10초 가치 문장
- source textarea, optional tone/image, Generate Drafts
- empty helper, recent save metadata

### States

- empty: Generate Drafts disabled
- ready: source nonempty, CTA enabled
- generating: spinner 1, duplicate click locked
- request error: source preserved, retry

### Interactions

- source type changes only source
- Generate Drafts one click creates exactly 8 card IDs
- no publish or bulk side effect

## Screen B: Fixed 8 workspace

```text
[8개 카드] [저장 6] [발행 가능 3] [발행됨 0]
[Threads][X][Facebook][Instagram][Bluesky][Telegram][Discord][Slack]
[Threads card       ][X card             ]
[Facebook card      ][Instagram card     ]
[Bluesky failed     ][Telegram card      ]
[Discord card       ][Slack empty        ]
[일괄 발행  접힘]
```

### Elements

- fixed summary count 8
- 8 focus tabs with same platform order and status
- desktop 2-column, mobile 1-column grid
- bulk disclosure below grid, default selection 0

### Partial fixture

- 6 editable payload
- Bluesky generation failed with card-only regenerate
- Slack empty with editable textarea and Publish disabled
- card DOM count remains 8

### 390

- sidebar becomes horizontal navigation strip
- first CTA visible before scroll
- tabs horizontal scroll with 44px controls
- card 1-column, action buttons full-width or wrapped

## Red-team and self-question

공격: failed card를 별도 error panel로 빼면 8개 count가 시각적으로 깨진다.

수정: 실패와 empty도 같은 card shell을 유지한다.

이게 틀렸다면 가장 그럴듯한 이유는? 8개 tab이 filter로 읽힐 수 있다. `카드로 이동` aria-label과 summary 8 count를 유지한다.

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.2.1-gpt-codex.md | dashboard/src/app/studio/page.tsx | dashboard/src/components/layout/Sidebar.tsx | https://support.buffer.com/article/961-using-post-groups-in-buffer

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, source and fixed-8 workspace | design-review, mobile and partial state audit

SKILLS_SKIPPED: 없음
