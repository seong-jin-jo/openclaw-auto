# 실제 셸 · 계정 진실 · 연결 wireframe v3

> 새 route를 만들지 않는다. 기존 `Sidebar`, `/`, `/channels/threads`, `/channels/instagram`, `/settings`에 계정 맥락과 연결 진실을 증분 배치한다.

## Desktop 1024: `/`

```text
┌ Sidebar 220 ───────┬────────────────────────────────────────────────────────┐
│ 홈                  │ 로그인 j.the.great.investor · J 투자 연구소            │
│ Studio              │ 게시 대상 Threads @j.the.great.investor · 연결됨       │
│ Inbox               ├────────────────────────────────────────────────────────┤
│ Calendar            │ 오늘 할 일                                              │
│ Social              │ [한 원문으로 채널별 초안 만들기]                        │
│ ├ Threads           │                                                        │
│ └ Instagram         │ 초안 3 → 발행 전 확인 1 → 예약 2 → 게시됨 8             │
│ Video               │                                                        │
│ Data & Analytics    │ 다음 예약 / 최근 게시물 링크 / 연결 다시 확인           │
│ Keyword Research    │                                                        │
│ Blog / Images       │ 기존 PipelineTimeline · 성과 · Queue · 알림 유지         │
│ Videos / Settings   │                                                        │
└─────────────────────┴────────────────────────────────────────────────────────┘
```

계정 불일치 상태:

```text
로그인 계정  j.the.great.investor
작업공간     J 투자 연구소
확인된 게시 계정  code_zero_to_one        [계정 불일치]
발행만 잠겼습니다. 초안과 과거 기록은 계속 사용할 수 있어요.
[계정과 작업공간 다시 확인] [발행 기록 보기]
```

## Mobile 390

- 기존 Sidebar 모바일 가로 메뉴를 유지한다.
- 계정 맥락은 제목 아래 2행으로 줄인다: `J 투자 연구소`, `Threads @handle · 상태`.
- 불일치에서는 handle 두 개를 생략하지 않는다. CTA는 세로 44px 이상이다.
- 경고가 떠도 Studio 초안, Calendar, 과거 게시물 링크는 계속 사용할 수 있다.

## `/channels/threads`와 `/channels/instagram`

플랫폼 고유 탭은 보존한다.

- Threads: Queue / Analytics / Growth / Popular / Settings.
- Instagram: Queue / Editor / Settings.

Settings 상단 `ConnectionTruthCard`:

```text
Threads 계정                                      재연결 필요
저장된 계정       @j.the.great.investor
마지막 확인       2026-08-03 16:42 KST
지금 게시 가능    확인되지 않음
지원 기능         TEXT · IMAGE
[Threads 다시 연결하기] [계정 변경 방법 보기]
```

Instagram은 `지원 기능 IMAGE · Reels`를 그대로 표시한다. `재연결 필요`는 현재 게시 가능 상태일 뿐 제품 기능 삭제가 아니다.

## 상태와 인터랙션

| 상태 | 영향 영역 | 주 행동 | 보조 탈출 |
|---|---|---|---|
| 연결 안 됨 | 계정 card | 계정 연결하기 | Studio 초안 저장 |
| 연결 확인 중 | 계정 행 1개 | 자동 확인 | 채널 탭, 홈 |
| 연결됨 | 없음 | Studio에서 글 만들기 | 계정 관리 |
| 재연결 필요 | 발행 CTA | 다시 연결하기 | 초안, 기록 |
| 계정 불일치 | 발행 CTA | 계정 변경 방법 | 작업공간 확인, 기록 |
| 상태 확인 불가 | 발행 CTA | 상태 다시 확인 | 채널 관리 |

연결 전 도움말은 현재 브라우저 계정이 사용된다는 제약을 말한다. 반환 handle이 목표와 다르면 `계정 불일치`이고, “연결 완료”라고 쓰지 않는다.

## 전역 Settings 일치

`/settings` Channels 탭은 채널 상세와 동일한 handle, 6상태, 마지막 확인 시각을 쓴다. account row의 `active`만으로 `연결됨`을 만들지 않는다. 다른 Settings 탭 8개와 영문 탭 구조는 이번 범위에서 삭제·이동하지 않는다.

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-03 02:56 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer

SOURCES:

- `dashboard/src/components/layout/Sidebar.tsx`
- `dashboard/src/components/channel/ChannelPage.tsx`
- `dashboard/src/components/channel/InstagramPage.tsx`
- `dashboard/src/components/channel/AccountManager.tsx`
- `dashboard/src/components/channel/SocialConnectButton.tsx`
- `tasks/osmu-stabilize-live.output`
- https://support.buffer.com/article/857-using-threads-with-buffer
- https://support.buffer.com/article/568-connecting-your-instagram-business-or-creator-account-to-buffer

MODEL: `gpt-codex/gpt-5.6-sol`

RUBRIC_SCORE: hierarchy=5/5 fidelity=5/5 states=5/5 accessibility=4/5 slop=5/5 total=24/25

WEAKEST_LINE: 모바일 Sidebar의 실제 가로 메뉴 밀도는 390px 렌더에서 항목 수가 많아 추가 사용성 검증이 필요하다.

SKILLS_USED: design-consultation, design-shotgun(외부 생성 실패 후 구조 비교 대체), design-html, design-review

SKILLS_SKIPPED: 없음

---

## DESIGN-004 additive correction

v3의 별도 identity strip을 새 shell처럼 보이게 만들지 않는다. 실제 Sidebar와 page header를 유지하고 본문 첫 줄에만 OSMUContextBar를 추가한다.

```text
┌ 기존 Marketing Hub Sidebar 224px ─┬ 기존 본문 px-8 py-6 ───────────────┐
│ Marketing Hub                      │ OSMU | 한 원문을 여러 플랫폼용으로 │
│ J 투자 연구소                      │ 만들고 발행·예약·분석하는 운영      │
│ OVERVIEW                            ├───────────────────────────────────┤
│ 성과                               │ 기존 Back / 아이콘 / Threads 제목  │
│ OSMU Studio                        │ Queue Editor Analytics Growth      │
│ 승인 인박스                        │ Popular Settings                   │
│ 발행 캘린더                        │ 기존 card와 content                │
│ SOCIAL ...                         │                                   │
└────────────────────────────────────┴───────────────────────────────────┘
```

- 유지: Marketing Hub, workspace, Overview/Social/Data/Keyword/Asset/System 그룹, theme/logout.
- 추가: OSMUContextBar와 동일 6탭.
- 수정: 연결 성공 시 OAuth CTA 제거, handle과 마지막 확인 표시.
- 제거: 0.

Visual source: `sns007-live-threads-account-manager-20260717.png`, `sns007-live-instagram-account-manager-20260717.png`.

MODEL: `gpt-codex/gpt-5.6-sol`

SKILLS_USED: design-consultation, design-html, design-review

SKILLS_SKIPPED: 없음
