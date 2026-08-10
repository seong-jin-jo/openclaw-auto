# OpenClaw Marketing Agent v19 Retake 핵심 화면 Wireframe

> STAMP: created_at=2026-08-08 17:25 KST | line=marketing-agent-design | model=gpt-codex/gpt-5.6-sol | agent=product-designer/marketing_agent_design_v19_retake | skill=gstack design-review | evidence=PRD v7.3.5, v18 audit·blueprint, current v19 prototype, current product shell, official Buffer·Sprout·Google OAuth | deliberation=공통 운영 탭은 역할 간 길찾기를 맞추고 플랫폼 본문은 capability에 따라 분기했다

## 0. 화면 구성 원칙

- 기존 224px Sidebar, 9그룹, 26개 목적지를 유지한다.
- 고객과 운영자는 `운영 개요 | 계정 | 자동화 | 결과 증거 | 미구현`을 같은 순서로 쓴다.
- 콘텐츠 플랫폼은 `Create | Queue | Calendar | Analytics | Settings`를 쓴다.
- Threads Growth·Popular, Instagram Feed·Card-news·Reels, YouTube·TikTok video job, Messaging handoff 의미를 삭제하지 않는다.
- 현재·목표·미구현·외부 미검증을 한 badge로 합치지 않는다.

## 1. 공통 Customer PageShell

```text
┌ Sidebar 224 ──────────────┬ Topbar: workspace · customer · theme ───────────┐
│ Overview                  │ Page title · 설명 · primary action             │
│ Social posts              ├─────────────────────────────────────────────────┤
│ Messaging (꺼짐)          │ 운영 개요 | 계정 | 자동화 | 결과 증거 | 미구현 │
│ Social short video        ├─────────────────────────────────────────────────┤
│ Data / Keywords / Assets  │ role-scoped body                                │
│ Settings                  │                                                 │
└───────────────────────────┴─────────────────────────────────────────────────┘
```

상태: customer·operator, light·dark, 1440·1024·390, loading·empty·error·partial·permission·stale·blocked·uncertain·repair·success.

## 2. 고객·운영자 공통 운영 탭

```text
[운영 개요] [계정] [자동화] [결과 증거] [미구현]

고객: 내 workspace와 내 account만
운영자: 전체 account metadata와 support state
공통: 같은 순서, 다른 권한과 상세 수준
```

| 탭 | 필수 요소 | customer action | operator action |
|---|---|---|---|
| 운영 개요 | 현재 역할·범위·다음 행동 | Studio 이동 | 상태 상세 |
| 계정 | provider·identity·readiness·verified_at | reconnect·revoke | health·target 확인 |
| 자동화 | consent·approval·schedule·fail-closed | scope별 켜기·끄기 | app·job 진단 |
| 결과 증거 | request·confirm time·status | 결과 열기 | phase·impact 확인 |
| 미구현 | gap·현재·목표·owner·종료 증거 | 막힌 이유 확인 | owner별 추적 |

금지: operator 화면에 작성·승인·지금 게시·예약 버튼을 넣지 않는다.

## 3. OSMU Studio

```text
가을 신규 고객 안내 · 수정 7
사용한 브랜드 자료 v3 · 확인 필요/확인됨

1 Text
  공통 | Threads | X | Instagram | Facebook | Bluesky
  [비교 편집] [저장] [플랫폼별 미리보기] [게시 전 확인]

2 Photo / Card-news
  slide 1..N · crop · alt · caption · rights
  [카드뉴스 열기] [Images] [Instagram 게시 전 확인]

3 Video
  YouTube Shorts | Instagram Reels | TikTok
  script · source · rights · render · upload · result
  [Videos] [저장]

OSMU 플랫폼 실행 8행
Threads · X · Instagram Feed · Instagram Reels
Facebook · Bluesky · YouTube Shorts · TikTok
[게시 전 확인] [Create 열기]

Messaging handoff
Telegram · Discord · Slack · 기본 꺼짐
```

OSMU 실행 표는 같은 수정본의 platform projection을 연다. 외부 준비가 확인되지 않은 row는 preflight에서 막고 Settings exit를 준다.

## 4. 콘텐츠 플랫폼 Create

```text
Platform title                                  [새 초안]
[Create] [Queue] [Calendar] [Analytics] [Settings]

[OSMU에서 생성 또는 이 플랫폼에서 생성] [초안·검토·승인·예약·게시 확인]
가을 신규 고객 안내 · 수정 7
“Create, Queue, Calendar, Analytics가 같은 기록을 표시”

┌ Platform editor 7/12 ────────────────┬ Review and delivery 5/12 ─────────┐
│ text 또는 video job                   │ [검토 요청] [승인]                │
│ Instagram: Feed | Card | Reels        │ [지금 게시] [예약]                │
│ [이 플랫폼에서 만들기] [편집]        │ 결과 또는 정확한 blocker          │
└───────────────────────────────────────┴───────────────────────────────────┘
```

### 플랫폼별 본문 분기

| 플랫폼 | Create 본문 | Queue 의미 | Analytics 의미 | Settings 다음 행동 |
|---|---|---|---|---|
| Threads | text·thread | draft·approval·schedule | Summary·Growth·Popular | live 8/8 유지 |
| X | text·thread·length | draft projection | native 또는 explicit N/A | account·scope·live |
| Instagram | Feed·Card·Reels | post 또는 video job | Feed·Reels 분리 | Meta account·scope |
| Facebook | text·image·Page | post projection | Page-native | Page identity |
| Bluesky | text·session | post projection | native 또는 N/A | session health |
| YouTube Shorts | script·asset·metadata | video job | channel-native | offline refresh·upload |
| TikTok | script·privacy·AI·policy | video job | async native | account·scope·poll |

## 5. Queue·Calendar·Analytics projection

```text
Queue                        Calendar                      Analytics
[origin/status]              [origin/status]               [origin/status]
title · 수정 7               Seoul 18:30                   provider metric
same account                 same account                  source·window·checked_at
[편집 또는 Video job]        [일정 변경]                   [전체 성과]
```

같은 화면에 canonical card는 1개다. 고객은 사람이 읽는 제목·수정 번호·계정·시간·상태를 본다. machine ID는 DOM text가 아니라 test attribute에만 둔다.

## 6. Messaging

```text
Telegram / Discord / Slack
[전달 꺼짐]

Target identity
Bot/account health
Message preview
Approval
Schedule
Result

[전달 켜기] [Studio로]
```

Queue·Analytics 탭을 만들지 않는다. 동의하지 않으면 API call은 0이다.

## 7. Platform Settings와 OAuth API flow

```text
┌ Readiness 8 steps 7/12 ──────────────┬ Account and connection 5/12 ─────┐
│ 1 operator app ready                 │ provider icon·account identity    │
│ 2 customer account connected         │ scope·expiry·refresh health       │
│ 3 identity verified                  │ last verified                     │
│ 4 scopes                             │ Meta account-switch limitation    │
│ 5 refreshable                        │                                   │
│ 6 publish-capable                    │ [연결 상태 확인] [다시 연결]      │
│ 7 automation enabled                 │                                   │
│ 8 live publish verified              │                                   │
└──────────────────────────────────────┴───────────────────────────────────┘
```

각 step은 `확인됨 | 다음 | 대기 | 실패`와 owner를 같이 표시한다. callback 도착이나 route 방문만으로 progress를 올리지 않는다.

OAuth flow:

```text
connect intent
→ authorization code + state
→ account identity readback
→ minimum scope readback
→ offline refresh health
→ publish capability
→ customer automation consent, default OFF
→ live publish proof
```

## 8. Operator account targets

```text
OpenClaw Admin
[운영 개요] [계정] [자동화] [결과 증거] [미구현]

Platform | Account | Current | Token/refresh | Automation | Target | Evidence
Threads  | @mono   | live    | encrypted     | enabled    | 8/8    | external result
Instagram| @mono   | account | refresh check | blocked    | scope+live | 미구현
X        | connect | pending | status source | blocked    | OAuth+readback | 미구현
...
```

필수 column:

- provider와 canonical account identity
- current connection/readiness
- token raw 값이 아닌 scope·expiry·refresh·health·verified_at
- automation consent·approval·pause state
- target state와 종료 증거
- `미구현`, `부분`, `외부 미검증` 표시

Admin 9 sections는 상태, 고객과 작업 공간, 중앙 연결 앱, 사용량, 복구 작업, Video/TTS, 보안 기록, 알림, 설정을 유지한다.

## 9. Admin Current vs Target

```text
Current usage                         Target usage · 미구현
AI 생성 count                         model
게시·예약 job count                   input token
API call count                        output token
period·tier·quota                     cost
source usage_events·freshness         period·quota·source·freshness
```

정확한 field가 없는 target에는 예시 숫자를 쓰지 않는다.

## 10. Gaps table

```text
항목 | 현재 | 목표 | owner | 판정
canonical identity | prototype contract | cross-surface parity | eng-design | 미구현
projection owner   | route별 분산       | conflict 0           | eng-design | 미구현
Instagram live     | account only       | scope+refresh+publish | OAuth/QA   | 외부 미검증
...
```

Prototype은 12개 gap을 표시한다. gap 표는 고객과 운영자의 공통 `미구현` 탭에서 같은 순서로 열린다.

## 11. 상태 화면

| 상태 | 화면 요소 | CTA | 금지 |
|---|---|---|---|
| loading | 실제 layout과 같은 shimmer 2줄 | 취소 | 무한 spinner |
| empty | 없는 대상·preserved context | 첫 항목 만들기 | 빈 화면 |
| error | 단계·원인·correlation | 해당 단계 재시도 | 전체 초기화 |
| partial | 성공·실패 platform 분리 | 실패만 확인 | 전체 retry |
| permission | account·scope | Settings | draft 삭제 |
| stale | last verified·reason | 새로 확인 | 오래된 값을 current로 표시 |
| blocked | blocker·external request 0 | blocker 해결 | disabled 이유 숨김 |
| uncertain | same intent·reconcile | 결과 재확인 | 재게시 |
| repair | external success·internal gap | 기록만 복구 | provider call |
| success | external result·confirmed_at | 결과 열기 | callback-only 성공 |

## 12. Responsive

### 1440

- Sidebar 224, content max 1180, 12 columns.
- Create editor 7/12 + delivery 5/12.
- account/gap tables는 full-width이고 첫 column과 action column을 고정하지 않는다.

### 1024

- 2-column body를 1-column으로 접는다.
- Header7은 4 columns.
- tabs는 horizontal scroll 또는 wrap으로 label을 자르지 않는다.

### 390

- Sidebar drawer, content 16px inset, body 16px 이상.
- Create editor와 delivery는 한 column.
- Studio bulk control은 static flow에 두어 card를 가리지 않는다.
- video/role tabs만 의도적 horizontal scroll이며 scroll cue를 보인다.
- tap target 44px, focus-visible 3px + 2px offset.

### M13/M14 실브라우저 회수 경계

| gate | 정적 wire/prototype 계약 | 실제 브라우저에서 남은 확인 |
|---|---|---|
| M13 recovery | owner8 × state6 = 48, identity 보존, uncertain은 reconcile만, repair는 기록만 복구 | 48개 클릭 전환, identity 보존, duplicate external request 0 |
| M14 customer-ready | 고객 visible text의 원초성 식별자 `cmp_/cnt_/rev_/pub_/ext_/exp_` 0 계약, inspector 2개 기본 hidden | 12 screenshot raw ID·구현 용어·`검수` 노출 0, contrast·touch·overflow·focus 실측 |

v18 브라우저 증거는 v19 새 common tabs와 canonical projection을 자동 보증하지 않는다. 따라서 두 행은 v19 브라우저 matrix가 생성되기 전까지 회수 필요다.

## 13. Benchmark checklist

| source | 확인한 원리 | 적용 | 복제하지 않은 것 |
|---|---|---|---|
| Buffer multi-channel scheduling | composer에서 여러 channel 선택, channel slot 제약 | OSMU platform table과 per-platform Create | Buffer IA·copy·brand |
| Sprout approvals | profile permission, submit·approve·edit·expired recovery | account-bound approval와 stale 처리 | plan packaging·UI styling |
| Google OAuth web server | code·state·scope·offline refresh | readiness 8단계와 fail-closed | provider-specific console UI |
| Google OAuth best practices | encrypted token, incremental scope, revocation recovery | raw0, scope별 기능, reconnect | security claim without implementation proof |
| v18 local audit | 26 destinations, 14 steps, 96 rows, P0 8 | preservation contract와 gaps | fixture-only success claim |

## 14. Design review

Classifier: APP UI.

Litmus:

1. 제품·역할이 첫 화면에서 분명한가: YES
2. 한 강한 anchor가 있는가: YES, next action 또는 current blocker
3. heading scan만으로 이해되는가: YES
4. section별 job이 하나인가: YES
5. card가 interaction boundary일 때만 쓰였는가: YES
6. motion이 state 이해를 돕는가: YES, shimmer·drawer·dialog only
7. shadow를 제거해도 premium인가: YES

Hard rejection 7개: 0. AI slop blacklist hit: 0. Design Score: **B+**.

AI Slop Score: **B+**. 정적 구조 판정이며 실제 렌더의 시각 완성도는 v19 브라우저 증거 전까지 미검증이다.

레드팀: “공통 탭이 플랫폼 차이를 지운다.” 수정: 공통 탭은 위치만 맞추고 Threads, Instagram, video, Messaging의 본문 contract를 표와 component로 고정했다.

SOCRATIC_MARKER: 이 결론이 틀렸다면 가장 그럴듯한 이유는 prototype의 same-record promise가 실제 route/table write owner와 충돌하는 것이다. 그래서 gap 표와 plan reopen을 제품 화면에서 숨기지 않는다.

⛔ 회수 필요: canonical identity, projection write owner, schedule/publish idempotency는 eng-design 합의 전 확정 금지다.

⛔ 회수 필요: parent QA가 M13 48 recovery와 M14 고객 언어·inspector·12개 responsive matrix를 실제 브라우저에서 재검증해야 한다.

SOURCES: `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; `tasks/marketing-agent-v18-completeness-audit.output`; `tasks/marketing-agent-v18-agency-blueprint.output`; `docs/qa-tracker.md` REQUEST-OSMU-001; `DESIGN.md` v18/v19; current UI/API/DB source; https://support.buffer.com/article/644-how-do-i-schedule-posts-for-multiple-social-channels-at-the-same-time; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://developers.google.com/identity/protocols/oauth2/web-server; https://developers.google.com/identity/protocols/oauth2/resources/best-practices

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: gstack design-review for hierarchy, state, responsive, interaction, accessibility and anti-slop review

SKILLS_SKIPPED: imagegen because the governing surface is code-native UI

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: “같은 기록”의 UI는 명확하지만 실제 owner 충돌 0은 기술설계와 QA 증거가 필요하다.
