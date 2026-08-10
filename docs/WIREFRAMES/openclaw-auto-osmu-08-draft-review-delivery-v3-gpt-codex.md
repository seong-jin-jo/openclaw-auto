# 실제 Studio 기반 초안 · 검수 · 발행 wireframe v3

> `PlatformPreview`, `BrandSetupWizard`, `SchedulePanel`, `/api/studio`, `/api/publish`, `/api/schedule`를 재사용한다. Review/Delivery는 새 URL이 아니라 `/studio` 안의 단계다.

## Desktop 1024: `/studio`

```text
┌ Sidebar ─┬ 로그인 j.the.great.investor · J 투자 연구소 · 게시 대상 확인됨 ┐
│ 기존 IA  ├─────────────────────────────────────────────────────────────┤
│          │ 내 브랜드 정보                    플랫폼별 초안              │
│          │ ┌──────────────────┐             ┌ Threads ─────────────┐   │
│          │ │ 상담 50분          │             │ TEXT / IMAGE          │   │
│          │ │ 숫자는 확인된 것만  │             │ 본문 편집 · 글자수     │   │
│          │ └──────────────────┘             │ [발행 전 확인]         │   │
│          │ 원문                              └───────────────────────┘   │
│          │ ┌──────────────────┐             ┌ Instagram ───────────┐   │
│          │ │ 8월 상담 일정...  │             │ IMAGE / Reels          │   │
│          │ └──────────────────┘             │ Editor와 미리보기 유지  │   │
│          │                                  │ [발행 전 확인]          │   │
│          │                                  └───────────────────────┘   │
└──────────┴─────────────────────────────────────────────────────────────┘
```

선택한 플랫폼 초안만 loading shimmer를 보인다. 다른 초안, 원문, Sidebar는 계속 조작 가능하다.

## 발행 전 확인: 같은 `/studio`

```text
발행 전 확인
게시 대상     Threads @j.the.great.investor       연결됨
최종 내용     8월 상담 일정을 열었습니다…          84/500
사용한 정보   상담은 50분 · 숫자는 확인된 것만
미디어        이미지 1장

[내용을 확인했습니다]       [초안으로 돌아가기]
```

계정·내용·내 브랜드 정보·미디어가 바뀌면 기존 확인을 해제한다. 계정 불일치나 재연결 필요에서는 검수본을 보존하고 발행 선택만 잠근다.

## 지금 발행 / 예약: 기존 `SchedulePanel` 통합

```text
어떻게 보낼까요?

지금 발행
검수한 버전을 Threads @j.the.great.investor에 보냅니다.
[지금 발행하기]

예약
2026-08-03 20:00 KST
Queue와 Calendar에서 변경할 수 있습니다.
[예약 확정하기]

[발행 전 확인으로 돌아가기]
```

## Queue · Calendar 연결

- 즉시 발행: `/studio` 게시 중 → publication 결과 조회 → `/` 최근 발행 또는 채널 Queue 기록.
- 예약: `/api/schedule` 성공 뒤 `/channels/[channel]` Queue와 `/calendar` 양쪽에서 같은 시각·계정·상태 표시.
- Queue 행동: 수정, 승인, 지금 발행, 예약 변경, 취소, 게시물 링크.
- Calendar 행동: 날짜 이동, Queue 상세, 게시물 링크. 실제 Queue 데이터를 재사용한다.

## 상태 계약

| 상태 | Studio | Queue | Calendar | 탈출 |
|---|---|---|---|---|
| empty | 첫 원문/내 브랜드 정보 | Studio로 | 검수된 글 예약 | 홈 |
| loading | 선택 preview만 shimmer | 해당 행만 progress | 해당 event만 progress | 다른 작업 |
| wrong-account | 발행 잠금, 초안 유지 | 예약 유지, 실행 잠금 | 이벤트 유지 | 계정 관리 |
| reconnect | 발행 잠금, 초안 유지 | 재연결 CTA | 예약 보존 | 채널 Settings |
| scheduled | Queue 위치·시각 | 변경/지금 발행/취소 | 날짜·Queue 링크 | 초안 |
| publishing | 중복 CTA 잠금 | 게시 중 | 게시 중 | 기록 |
| failed | 원인과 보존 초안 | 내용/계정별 복구 | 실패 event | Studio/채널 |
| published | 게시물 링크 | 게시물 링크 | 게시됨 event | 분석/다음 글 |

## Mobile 390

- `내 브랜드 정보 요약 → 원문 → Threads lane → Instagram lane` 단일 열.
- 발행 전 확인은 별도 full-width panel이지만 URL은 `/studio`를 유지한다.
- 지금 발행과 예약은 각각 44px 세로 카드로 두고, 두 CTA를 가로로 압축하지 않는다.
- 대상 handle과 연결 상태는 sticky CTA 바로 위에 다시 표시한다.

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-03 02:56 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES:

- `dashboard/src/app/studio/page.tsx`
- `dashboard/src/components/studio/PlatformPreview.tsx`
- `dashboard/src/components/studio/SchedulePanel.tsx`
- `dashboard/src/components/queue/QueueList.tsx`
- `dashboard/src/components/queue/UnifiedPostCard.tsx`
- `dashboard/src/app/calendar/page.tsx`
- https://docs.postiz.com/public-api/posts/create
- https://help.later.com/hc/en-us/articles/8843980454295-About-Draft-Posts
- https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: hierarchy=5/5 fidelity=5/5 states=5/5 accessibility=5/5 slop=5/5 total=25/25

WEAKEST_LINE: 검수 상태를 현재 API가 어떤 필드로 보존하는지는 eng-design 합의가 필요하다.

SKILLS_USED: design-consultation, design-shotgun(외부 생성 실패 후 구조 비교 대체), design-html, design-review

SKILLS_SKIPPED: 없음

---

## DESIGN-004 additive correction

Studio를 새 2열 제품으로 바꾸지 않는다. 실제 글감, brand guide, platform preview, media generation, account selector, schedule panel, history를 유지한다.

추가되는 순서:

1. 기존 Studio 제목 위 OSMUContextBar.
2. 기존 platform preview 안 `발행 전 확인` action.
3. 기존 SchedulePanel 앞 대상 handle과 검수 version 요약.
4. Threads와 Instagram channel page의 Editor tab에서 같은 저장 초안을 연다.

플랫폼 성공:

- Threads TEXT/IMAGE: 편집, 검수, 즉시/예약, 게시물 링크.
- Instagram IMAGE/Reels: 편집, 검수, 즉시/예약, 게시물 링크.

실패 시 원문, platform version, 계정 선택, 예약 시간을 보존한다. 제거 0.

MODEL: `gpt-codex/gpt-5.6-sol`

SKILLS_USED: design-consultation, design-html, design-review

SKILLS_SKIPPED: 없음
