# OSMU Studio user flow v12

> STAMP: created_at=2026-08-06 00:31 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=actual Chrome empty/generated baseline and current components | deliberation=기존 생성부터 bulk까지 유지하고 card Publish만 sibling으로 추가

## Entry

`OSMU Studio` → current empty screen → source 직접 입력 또는 history 불러오기

## Happy path

1. source 입력 또는 Wiki 연결
2. `OSMU 생성`
3. text section에 Threads, X, Facebook native preview 생성
4. card section에 Instagram native preview 생성
5. video section에 Shorts, Reels, TikTok native preview 생성
6. preview 클릭 → 기존 편집 drawer → 해당 플랫폼만 Save
7. 선택 A: 카드 아래 Publish → 해당 카드만 processing → published → permalink
8. 선택 B: direct4 checkbox → top `Publish (4)` → 기존 bulk 발행
9. 선택 C: 예약 → create → change 또는 cancel
10. history에서 불러오면 같은 visual7 preview와 상태 복원

## Card publish state machine

`draft` → Save → `saved` → Publish → `processing`

- success → `published` → provider permalink → 게시물 보기
- provider rejection → `failed` → 같은 카드만 다시 발행 → `processing`
- timeout/ambiguous → `unknown` → 결과 확인 → `published` 또는 `failed`

`processing`, `failed`, `unknown` 전이 동안 다른 6개 카드의 draft, saved, publish state는 변경하지 않는다.

## 기존 기능 9개

| 기능 | happy | edge/error | recovery |
|---|---|---|---|
| Wiki RepoConnect | repo/path sync | auth 또는 path 실패 | 입력 보존, 다시 동기화 |
| direct source | source 입력 | 빈 source | 입력 요청, 기존 draft 보존 |
| OSMU 생성 | visual7 생성 | partial generation | 성공 surface 보존, 실패 surface만 재생성 |
| AI 자동초안 | history에 draft 저장 | timeout | 저장됨 표시 금지, 다시 시도 |
| image/video | asset 연결 | 권한, credit, NSFW | 원인 표시, 기존 asset 보존 |
| per-platform edit/save | 한 surface 저장 | concurrent edit | 비교 후 내 변경 또는 저장본 선택 |
| history load | visual7 복원 | 손상된 기록 | 결과 미확인으로 로드, 성공 추정 금지 |
| legacy bulk Publish | direct4 발행 | partial success | 성공 카드 재발행 금지, 실패 카드만 복구 |
| schedule | create/change/cancel | 과거 시각, 권한 실패 | 입력 유지, 수정 후 재시도 |

## Empty

- source 없음, history 없음: existing empty 안내를 유지
- source 없음, history 있음: history 불러오기가 출구
- generated false에서는 Save, bulk Publish, 예약, visual7을 표시하지 않음

## Loading

- generation: top OSMU 생성만 busy
- auto draft: AI 자동초안만 busy
- card Publish: 대상 카드 action만 spinner, 다른 6개 사용 가능
- bulk: existing global progress 사용

## Error and recovery

- failed: provider가 거절한 카드만 retry
- unknown: 결과 확인 전 재발행 금지
- published but local persistence failed: provider result 조회 후 local record repair, 재발행 금지
- permalink 누락: published 확정 금지, unknown으로 유지

## Responsive route

- 1440: Sidebar → toolbar → content rail + history
- 1024: Sidebar 유지, content rail horizontal scroll, history 유지
- 390: horizontal nav → toolbar 2열 → text → card → video → history
- 모든 branch에 Studio 복귀, retry, reconcile, cancel 중 하나가 있어 dead end 0

## Continuity

Inbox와 Calendar는 route를 유지한다. Studio와 source identity가 실제 연결되기 전에는 자동 연속성을 표시하지 않는다.

## 레드팀

가장 위험한 회귀는 card Publish가 top bulk를 대체하거나 preview를 generic control card로 바꾸는 것이다. v12는 card control을 preview sibling으로 제한하고 bulk direct4를 별도 happy path로 유지한다.

## 셀프심문

이 플로우가 틀렸다면 가장 그럴듯한 이유는 unknown을 단순 retry로 처리해 중복 게시하는 경우다. unknown에서는 retry를 숨기고 reconcile만 제공하도록 수정했다.

SOURCES: /private/tmp/osmu-existing-studio-browser-baseline.png | /private/tmp/osmu-existing-studio-generated-baseline.png | dashboard/src/app/studio/page.tsx | dashboard/src/components/studio/PlatformPreview.tsx | docs/openclaw-auto-osmu-prd-v4.3.1-gpt-codex.md

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html for actual baseline routing prototype | design-review for state and dead-end audit

SKILLS_SKIPPED: 없음
