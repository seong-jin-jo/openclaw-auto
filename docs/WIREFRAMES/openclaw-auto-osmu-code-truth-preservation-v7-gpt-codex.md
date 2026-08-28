# OSMU v7 Wireframe 01: Code Truth and Shell Preservation

> STAMP: created_at=2026-08-05 02:04 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://support.buffer.com/article/961-using-post-groups-in-buffer | deliberation=기존 26개 내비게이션을 지키면서 current와 target truth를 첫 화면에서 읽히게 하는 방법

## 목적

실제 제품 표면과 목표 설계의 경계를 첫 10초 안에 이해하게 한다. 새 최상위 메뉴는 추가하지 않는다.

## Desktop 1024

```text
┌──────────────────────┬───────────────────────────────────────────────────────┐
│ Marketing Hub        │ OSMU 발행 진실                                       │
│                      │ 현재 구현과 마이그레이션 후 목표를 분리해 봅니다      │
│ Overview             ├──────────────────────────┬────────────────────────────┤
│  Dashboard           │ 현재 구현                │ 목표 설계                  │
│  Studio              │ text publish 8           │ Initial 3 상세             │
│  Inbox               │ Studio direct 4          │ source once                │
│  Calendar            │ Studio preview 7         │ account once               │
│ Social               │ queue JSON primary       │ actual result once          │
│  Threads             │ DB best-effort shadow    │ retry failed only           │
│  X                   │ universal source 없음    │ 마이그레이션 후             │
│  Instagram           └──────────────────────────┴────────────────────────────┤
│  Facebook            │ 보존 원장                                             │
│  Bluesky             │ Sidebar 26/26 · routes 24/24 · new top-level 0        │
│ Messaging            │ Threads tabs 5/5 · Instagram tabs 3/3 · Settings 9/9 │
│ Video                ├───────────────────────────────────────────────────────┤
│ Data                 │ [Studio에서 흐름 보기] [현재 authority 보기]          │
│ Keyword              └───────────────────────────────────────────────────────┘
│ Blog / Assets        │
│ Settings             │
└──────────────────────┴───────────────────────────────────────────────────────┘
```

### 요소

- 실제 `Sidebar`의 26개 링크, 동일 그룹
- H1 제목 `OSMU 발행 진실`
- `현재 구현` 카드: text8/direct4/preview7/video3/extensions15, queue JSON primary, DB shadow
- `목표 설계` 카드: Initial 3, source/result/retry, `마이그레이션 후`
- preservation ledger: sidebar/routes/tabs/settings counts
- 기존 Studio와 authority 상세로 가는 44px 버튼

### 상태

- `current`: 흰 표면, warning authority badge
- `post-migration`: accent-soft 표면, target badge
- `future`: surface-2 표면, CTA 없음
- `loading`: 수량 placeholder 대신 `코드 진실 확인 중`
- `error`: 읽지 못한 inventory 항목만 `미확인`, 기존 수량을 추정하지 않음

### 인터랙션

- Sidebar 링크 클릭은 기존 route 의미를 유지한다.
- Studio, Inbox, Calendar, Settings는 프로토타입의 해당 설계 화면으로 간다.
- 나머지 링크는 `보존됨` route detail을 열고 원래 route label을 보여준다.
- 목표 카드 클릭은 migration 전에는 활성 기능이 아니라 설명 패널을 연다.

## Mobile 390

```text
┌──────────────────────────────────┐
│ Marketing Hub                    │
│ [Dashboard] [Studio] [Inbox] ... │
├──────────────────────────────────┤
│ OSMU 발행 진실                   │
│ 현재와 목표를 분리해 봅니다      │
├──────────────────────────────────┤
│ 현재 구현                        │
│ text8 · direct4 · preview7       │
│ JSON primary · DB shadow         │
├──────────────────────────────────┤
│ 목표 설계 · 마이그레이션 후      │
│ Threads · Instagram Feed · X     │
│ source once · result once        │
├──────────────────────────────────┤
│ 보존: 26/26 · 24/24 · 0 new      │
│ [Studio에서 흐름 보기]           │
│ [현재 authority 보기]            │
└──────────────────────────────────┘
```

- 링크는 44px 높이로 줄바꿈한다.
- 두 truth 카드는 세로 배치한다.
- 숫자와 label이 잘리지 않는다.

## 금지

- `OSMU`를 Sidebar의 새 그룹으로 추가
- 목표 설계를 녹색 성공 상태로 표현
- `DB synced`처럼 best-effort shadow를 강한 보장으로 표현
- 보존 카운트 하나라도 생략

## acceptance

- current/target 구분을 첫 화면에서 읽을 수 있음
- sidebar 26, app routes 24, Threads 5, Instagram 3, Settings 9가 모두 보임
- 신규 top-level 0
- desktop/mobile dead-end 0

## 레드팀과 셀프심문

**공격:** 첫 화면이 개발 감사 도구처럼 보여 일반 사용자가 발행을 시작하지 못할 수 있다.

**수정:** 기술 용어를 카드 보조 정보로 낮추고, 첫 행동을 기존 Studio 진입으로 유지했다.

**이게 틀렸다면 가장 그럴듯한 이유는?** 실제 사용자는 authority보다 작성물을 먼저 보고 싶을 수 있다. 그렇더라도 현재와 목표가 혼재한 과도기에는 거짓 성공보다 truth boundary가 더 load-bearing하다. 이후 migration 완료 시 이 화면은 운영자 진단으로 낮출 수 있다.

SOURCES: DESIGN.md | docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | dashboard/src/components/layout/Sidebar.tsx | dashboard/src/app/studio/page.tsx | dashboard/src/app/settings/page.tsx | dashboard/src/components/channels/ChannelPage.tsx | dashboard/src/components/channels/InstagramPage.tsx | https://support.buffer.com/article/961-using-post-groups-in-buffer

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, 1024/390 shell 배치 | design-review, 정보 계층과 보존 감사

SKILLS_SKIPPED: 없음
