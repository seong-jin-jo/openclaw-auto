# Marketing Hub v13 — 화면 와이어프레임

기반: PRD v5.2.0, surface-map, v12 Studio baseline.

## 공통 셸

```
┌ Sidebar (26) ──────┬────────────────────────────────────────────┐
│ 성과 / Studio ...  │ [☰] 화면 제목                    [계정 ▾] │
│ Social · Message   ├────────────────────────────────────────────┤
│ Video · Data ...   │ 프로토타입 안내                              │
│ Assets · Settings  │ 라우트별 고객 화면                           │
└────────────────────┴────────────────────────────────────────────┘
```

390px에서는 `☰`가 우측을 제외한 화면 폭의 drawer로 26개 메뉴를 연다.

## Studio

```
[글감 입력________________] [브랜드 위키] [Generate] [전체 저장] [선택 발행]
[예약 만들기 / 예약 시간 변경 / 예약 취소 → Inbox · Calendar 링크]

텍스트 8개: Threads | X | Facebook | Instagram | Telegram | Discord | Slack | LINE
영상 3개: YouTube Shorts | Instagram Reels | TikTok (영상 파일 생성이 아닌 영상 원고)

텍스트 카드: 미리보기 → 편집 → 저장 → Publish → 발행 링크
               전송 전 실패=다시 발행 | 게시 여부 확인 필요=결과 확인 | 게시됨+기록 누락=기록 복구
영상 카드: 미리보기 → 원고 저장 → 영상 작업실로

영상 3개에는 Studio Publish가 없다. `failed_confirmed`만 다시 발행하며 `uncertain`과
`repair_required`는 새 발행 없이 각각 게시 결과 확인과 기록 복구를 수행한다.
```

## Settings

고객 8탭은 `Channels / AI Engine / Storage / Design Tools / Notifications / Fork 연동 / Keywords / System`이다.
Channels에서 현재 provider 계정을 확인하고 계정을 전환한다. 확인이 끝난 계정명은 Settings, Studio,
provider 화면에서 동일하게 표시한다. Meta 재인증 전에는 현재 계정과 시크릿 창 안내를 보여준다.

## 그 외 라우트

- Inbox와 Calendar는 Studio 콘텐츠로 돌아가는 링크를 제공한다.
- social은 플랫폼별 탭과 연결 상태를, Telegram·Discord·Slack은 연결·발행 권한만 제공한다.
- GA4·Naver Trends·Search Advisor는 연결 전 비활성 상태, Google Trends는 외부 이동 상태를 명확히 보여준다.
- Blog, Images, Videos, Midjourney는 고객용 독립 화면을 가진다.

## 25 route view

화면 둘러보기 선택기로 `/`, `/login`, `/signup`, `/studio`, `/inbox`, `/calendar`,
`/channels/[channel]`, `/videos`, `/images`, `/blog`, `/blog-performance`, `/search-console`,
`/keyword-planner`, `/google-analytics`, `/naver-trends`, `/search-advisor`, `/google-trends`,
`/performance`, `/services`, `/settings`, `/operator`, `/operator/customers`, `/privacy`, `/terms`,
`/data-deletion`을 모두 연다. 동적 channel 화면은 Sidebar의 실제 provider 10개 목적지로 전환한다.

## Provider 규칙

- 공통 헤더 위치: provider명, 연결된 계정, 연결 상태, `계정 및 연결 관리`.
- Threads: Queue, Analytics, Growth, Popular, Settings.
- Instagram: Queue, Editor, Settings.
- X, Facebook, Bluesky: Queue, Analytics, Settings.
- Telegram, Discord, Slack: 연결 설정만.
- YouTube, TikTok: 연결 설정과 영상 작업실만.
- capability가 없는 탭은 만들지 않는다.

## 상태와 출구

- loading: 대상 작업 버튼만 busy, 다른 카드와 navigation은 유지.
- empty: 첫 행동 또는 이전 화면 복귀 CTA.
- error: 원인과 다시 시도, 결과 확인, 기록 복구 중 하나를 제공.
- disabled: 사용 불가 사유와 성과 또는 Settings 복귀 CTA.
- external: 외부 이동임을 버튼에 표시.
- permission: 고객과 운영자 shell을 분리하고 허용된 화면으로 돌아가는 CTA.
- Inbox와 Calendar는 동일 작업 `MH-2048`을 표시하고 Studio의 변경/취소로 돌아간다.

## 검토 반영

레드팀 공격: 영상 원고 카드의 Publish는 Studio가 지원하지 않는 직접 발행을 암시하고 중복 상태기계를 만든다.
수정: video3를 Publish와 bulk 대상에서 제외하고 원고 저장과 영상 작업실 hand-off만 남겼다.

셀프심문: 이 설계가 틀렸다면 가장 가능성 높은 이유는 26개 Sidebar 목적지와 25개 route type을 같은 숫자로
오해하는 것이다. 둘을 별도 manifest로 두고 1440/390에서 nav26, route25를 각각 측정하도록 수정했다.

Design Score: B+

SOURCES: https://support.buffer.com/article/642-scheduling-posts | https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets | https://help.hootsuite.com/s/article/manage-content-calendar?language=en_US | docs/openclaw-auto-marketing-hub-prd-v5.2.0-gpt-codex.md | wiki/product/marketing-hub-surface-map.md

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: browse CLI for 1440/390 route, interaction, overflow, touch and console verification

SKILLS_SKIPPED: design-html and design-review are not installed in the Codex skill registry; their local rubric and browser method were applied manually
