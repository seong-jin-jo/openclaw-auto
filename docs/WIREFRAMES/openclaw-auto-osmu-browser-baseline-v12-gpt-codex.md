# OSMU Studio browser baseline wireframe v12

> STAMP: created_at=2026-08-06 00:33 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=actual Chrome captures | deliberation=기존 DOM의 sibling으로만 발행 제어를 추가

## 1440 generated

```text
┌ Sidebar 224 ┐┌ Main x248, width1168 ──────────────────────────────────────────┐
│ Marketing   ││ OSMU Studio | AI | source | 브랜드 | 위키 | 생성 | 자동 | Save | Publish(4)
│ 26 items    ││ 예약
│ 9 groups    ││ [amber Higgsfield notice]
│             ││ ┌ content 940 ──────────────────────────┐ ┌ history 208 ┐
│             ││ │ 텍스트: Threads | X | Facebook rail  │ │ 발행 이력   │
│             ││ │ [native preview]                      │ │ 불러오기    │
│             ││ │ [v12 additive control]                │ └─────────────┘
│             ││ │ 카드뉴스: Instagram 380 square       │
│             ││ │ [native preview]                      │
│             ││ │ [v12 additive control]                │
│             ││ │ 영상 9:16: Shorts | Reels | TikTok   │
│             ││ │ [native previews]                     │
└─────────────┘└─┴────────────────────────────────────────┴──────────────────────┘
```

## Baseline mode

`?baseline=1` hides all seven additive controls. It does not alter toolbar, notice, preview DOM, rails, history, tokens, or Sidebar.

Measured at 1440x1000:

- Sidebar: x0, y0, w224, h1000
- toolbar: x248, y20, w1168, h109
- text section: x248, y193, w940
- Instagram section: x248, y458, w940
- history: x1208, y193, w208
- visual surfaces: 7
- additive DOM nodes: 7 hidden
- Discord surfaces: 0
- Slack surfaces: 0
- page overflow: 0

Reference generated capture is 1440x1000. FFmpeg whole-frame PSNR between the reference and HTML baseline render is 13.275762. Raster diff is not zero because the prototype substitutes current React SVG/icon raster and live text with HTML equivalents. Load-bearing geometry, hierarchy, surface count, dimensions, and placement are measured separately above.

## Additive control

Elements:

- QA-only dashed blue outline and `v12 추가 영역`
- status
- existing edit entry
- card Publish or recovery action
- permalink after success

Interactions:

- Save enables Publish
- Publish changes only target to processing
- success displays provider permalink
- failed displays retry
- unknown displays result confirmation, not retry
- published displays post link

## Empty

Elements:

- same toolbar without Save, bulk Publish, schedule
- centered existing empty copy
- same history panel, `없음` when empty
- no preview section

## 1024

- Sidebar 224
- main x248, width752
- content 548, history 190
- native preview rails scroll horizontally
- page overflow 0

## 390

- Sidebar becomes top horizontal navigation rail without dropping the 26 entries
- toolbar buttons use two columns
- first action and source remain visible
- preview width 340 with internal rail scroll
- history follows video section
- page overflow 0
- primary/additive non-checkbox targets minimum 44px

## States

- empty
- generated draft
- saved
- card processing
- card published + permalink
- failed + retry
- unknown + reconcile
- schedule open, created, changed, cancelled
- history loaded

## 금지

- native preview를 generic white card로 치환
- top bulk Publish, Save, 예약, Wiki, history 제거 또는 이동
- text, card, video section 합치기
- Discord/Slack preview 추가

## 레드팀

경쟁사 composer를 닮게 정리한다며 current layout을 갈아엎는 것이 가장 큰 실패다. 이 wireframe은 실제 캡처 좌표를 고정하고 신규 영역을 preview 아래 sibling 하나로 제한한다.

## 셀프심문

이 설계가 틀렸다면 pixel metric만 보고 React 구조 보존을 오판했을 가능성이 가장 크다. 따라서 raster score와 별도로 DOM 수, anchor geometry, interaction isolation을 각각 기록한다.

SOURCES: /private/tmp/osmu-existing-studio-browser-baseline.png | /private/tmp/osmu-existing-studio-generated-baseline.png | dashboard/src/app/studio/page.tsx | dashboard/src/components/studio/PlatformPreview.tsx | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/app/globals.css

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html for pixel-referenced wireframe | design-review for visual and responsive audit

SKILLS_SKIPPED: 없음
