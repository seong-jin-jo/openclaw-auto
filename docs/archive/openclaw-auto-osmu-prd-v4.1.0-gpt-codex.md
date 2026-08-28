# openclaw-auto OSMU PRD v4.1.0 — 실제 런타임 수렴

> **상태:** v4.0.0 critic MAJOR 7건을 닫는 v4.1.0 MINOR retake · 승인 전 · DESIGN v6 입력 사용 금지  
> **제품 판단:** 현재 제품에는 하나의 연속된 `Studio → 승인 인박스 → 캘린더 → 결과 그룹`이 없다. 서로 다른 저장소와 실행기가 같은 화면 안에 공존한다. v4의 일은 새 메뉴를 발명하는 것이 아니라 이 분리를 고객이 잃거나 중복 발행하지 않는 하나의 source-to-result 계약으로 수렴시키는 것이다.

| STAMP | 값 |
|---|---|
| line | `openclaw-auto-osmu` |
| artifact | `prd` |
| version | `4.1.0` (MINOR retake) |
| created | `2026-08-04 23:23 KST` |
| model | `gpt-codex/gpt-5.6-sol` |
| agent | `prd-architect` |
| skills | 매칭 PRD skill 없음; planning/doc-review 기준 직접 적용 |
| evidence URLs | Buffer Post Groups, Later multi-profile scheduling/help (하단 SOURCES) |
| 고민 한 줄 | 기존 UI의 이름이 같다는 사실과 같은 데이터 흐름이라는 주장을 분리하고, 코드가 있는 것과 운영에서 되는 것도 분리했다. |

## 목차

1. [결정 요약](#1-결정-요약)
2. [정본과 폐기 근거](#2-정본과-폐기-근거)
3. [현재 상태 분류법](#3-현재-상태-분류법)
4. [핵심 페르소나](#4-핵심-페르소나)
5. [One Thing](#5-one-thing)
6. [As-is source-to-result](#6-as-is-source-to-result)
7. [채널 구현 지도](#7-채널-구현-지도)
8. [Target outcome](#8-target-outcome)
9. [MVP 기능 5개](#9-mvp-기능-5개)
10. [기능 요구사항](#10-기능-요구사항)
11. [비기능 요구사항](#11-비기능-요구사항)
12. [기술부채 우선순위](#12-기술부채-우선순위)
13. [비파괴 이관 슬라이스](#13-비파괴-이관-슬라이스)
14. [BM·운영 부하](#14-bm운영-부하)
15. [법적·시장·기술 리스크](#15-법적시장기술-리스크)
16. [6사업 자기잠식](#16-6사업-자기잠식)
17. [수용기준과 테스트](#17-수용기준과-테스트)
18. [요구 추적표](#18-요구-추적표)
19. [Steelman·Premortem·Kill criteria](#19-steelmanpremortemkill-criteria)
20. [셀프심문·레드팀 반영](#20-셀프심문레드팀-반영)
21. [Gate](#21-gate)

## 1. 결정 요약

- v3.1.1과 DESIGN v6는 `PLAN-007` 때문에 승인 불가다. 보존성 QA의 실패 증거로만 사용한다.
- 실제 고객 런타임은 ① Studio DB draft와 Next direct publish, ② `queue.json` 중심 Inbox/Calendar와 root extension, ③ DB schedule worker, ④ 별도 video publish로 갈라져 있다.
- 텍스트 publish/schedule 대상은 8개, Studio direct 대상은 4개, Studio preview는 7개, video target은 3개, root publish extension은 15개다. 숫자가 같은 ‘지원 플랫폼’ 한 목록은 현재 존재하지 않는다.
- 구현 코드의 존재, 부분 구현, 미구현, 운영 장애, 운영 미검증을 별도 상태로 기록한다. `extension directory exists`는 고객 발행 가능의 증거가 아니다.
- 목표는 source 하나가 tenant·account·capability별 독립 dispatch와 외부 결과를 공유 식별자로 묶고, timeout/재시도에서도 이미 성공한 외부 발행을 반복하지 않게 만드는 것이다.
- 구체 DB table/API/schema는 eng-design에서 회장과 합의한다. 이 PRD는 필요한 행동·불변식·종료증거만 확정한다.
- 최초 safety bet은 Threads·Instagram Feed·X 세 계정 경로만 다룬다. X는 non-Meta 후보 중 코드 접점이 가장 완전하지만 실제 credential readiness는 R0에서 확인해야 하며, 실패하면 enabled하지 않는다.
- video convergence, extension repair, external cohort는 52시간 총 appetite 안에서도 각각 별도 후속 bet으로 재승인한다.

## 2. 정본과 폐기 근거

### 2.1 읽은 정본

| 우선 | 출처 | 확인한 사실 |
|---|---|---|
| 1 | `pipeline-state.md`, `wiki/ops/session-state.md`, `docs/qa-tracker.md` | PLAN-007, 운영 OAuth/account 장애, 승인 artifact 상태 |
| 1 | `CHANGELOG.md` 2026-04-07~14 | Instagram queue/editor/settings, carousel·R2 과거 검증, queue schema/editor 흐름 |
| 2 | `dashboard/src/lib/constants.ts` | text 8, Studio/Video 상수 drift, plugin 목록 |
| 3 | `dashboard/src/app/studio/page.tsx`, `dashboard/src/app/api/studio/drafts/route.ts` | Studio DB draft, direct 4, preview 7 |
| 4 | `dashboard/src/app/inbox/page.tsx`, `calendar/page.tsx`, `lib/queue-store.ts` | Inbox/Calendar는 queue JSON view, DB는 best-effort mirror |
| 5 | publish/schedule/video API와 `dashboard/db/schema.sql` | idempotency·result persistence가 경로별로 불균일 |
| 6 | root `extensions/*-publish` | 15개 extension의 코드 존재와 별도 env/plugin runtime |

### 2.2 폐기·보류

- `docs/openclaw-auto-osmu-prd-v3.1.1-gpt-codex.md`: **rejected evidence**. 존재하지 않는 end-to-end 연속성을 전제했다.
- `DESIGN.md` v6: **rejected evidence**. Sidebar 보존 감사에는 참고하되 target workflow의 근거로 쓰지 않는다.
- `docs/openclaw-auto-osmu-prd-v3.1-gpt-codex.md`: 시장·페르소나 가설 중 코드와 충돌하지 않는 항목만 재검증해 계승한다.

## 3. 현재 상태 분류법

| 상태 | 뜻 | 제품 문구 원칙 |
|---|---|---|
| 운영 관찰 | 실제 provider/account/link를 직접 확인 | `운영 확인` 가능; 증거시각·계정 범주 명시 |
| 구현·테스트 | 코드와 자동/로컬 테스트가 있으나 실제 provider E2E는 별도 | `지원` 단정 금지, 환경별 readiness 표시 |
| 부분 구현 | happy path 일부 또는 저장/복구가 경로별 상이 | 가능한 범위와 빠진 경계를 같이 표시 |
| 미구현 | 필요한 code path/contract 없음 | disabled와 enable 조건 표시 |
| 운영 장애 | 구현 유무와 별개로 현재 실제 계정 흐름이 실패 | 고객 CTA를 닫고 owner/action 표시 |
| 운영 미검증 | 코드 존재만 확인, 실 provider 결과 미관찰 | `코드 존재·운영 미검증`으로 표기 |

**금지:** `연결됨`, `발행됨`, `지원됨`은 token 저장·HTTP 2xx·extension 디렉터리·내부 row만으로 표시하지 않는다.

## 4. 핵심 페르소나

김민서(34)는 강의와 컨설팅을 판매하는 1인 지식사업자다. 별도 마케팅팀, 영상 편집자, 개발자 없이 상품 제작·상담·정산·고객 응대까지 맡아, 한 아이디어를 여러 채널에 옮기는 시간이 곧 매출 활동의 손실이다. Threads와 X에는 관점형 글, Facebook에는 설명형 글, Instagram Feed에는 카드나 이미지, Reels·Shorts·TikTok에는 세로 영상을 내고 싶지만, 플랫폼마다 계정·권한·심사·미디어 규칙·예약 방식이 달라 매번 앱을 오간다. 그가 원하는 것은 AI가 8개 문안을 생성했다는 숫자가 아니라, 자신이 승인한 원문이 정확한 브랜드 계정에 한 번만 발행되고 실제 게시물 링크가 돌아오는 확신이다.

현재 화면에서 `OSMU Studio`, `승인 인박스`, `발행 캘린더`라는 이름을 보면 하나의 작업이 이어질 것으로 기대한다. 그러나 Studio 초안은 DB에 있고 Inbox/Calendar는 `queue.json`을 읽으며 schedule과 video도 별도 경로여서, Studio에서 만든 것이 Inbox에 안 보이거나 성공한 게시물이 한 결과로 모이지 않을 수 있다. 이때 김민서는 자기 실수인지 제품 결함인지 판단하지 못해 각 provider를 열어 중복 여부를 확인한다. 특히 Meta 로그인 세션에 다른 개인/브랜드 계정이 남아 있으면 ‘연결됨’이라는 초록 상태를 믿지 못한다. timeout 후 재시도를 눌렀다가 동일 게시물이 두 번 올라가는 것이 가장 두렵고, 반대로 실제 발행은 됐는데 내부 저장만 실패해 실패로 표시되는 것도 원치 않는다.

김민서는 게시 전 각 채널의 account identity, 변환된 본문·미디어, 공개범위, 예약시간을 검수하고 특정 채널만 제외하거나 수정하고 싶다. 일부 채널이 실패해도 성공 채널은 다시 보내지 않고 실패 채널만 안전하게 회수·재시도하기를 원한다. 성공한 결과는 provider가 돌려준 ID와 열리는 permalink로 확인하고, 처리 중이면 임의의 성공 표시가 아니라 다음 확인 시각을 보고 싶다. 첫 설정에 개발자 도움이 필요하거나 Settings·채널 화면·Editor의 계정명이 다르면 기존 복사붙여넣기로 돌아간다. 두 번째 원문에서도 같은 흐름을 반복해 총 운영시간과 확인 불안을 줄였을 때만 유료 구독을 검토한다. 연령·가격·전환율은 아직 외부 cohort로 검증되지 않은 가설이다.

**Pain:** 같은 제품 안의 분리된 저장소와 실행기를 고객이 직접 대조해야 해서, 자동화를 샀는데도 계정 관리자·중복 감시자·장애 복구자가 된다.

**JTBD:** “원문 하나를 승인했을 때 선택 계정별 결과를 독립적으로 보내고, 중복 없이 실제 외부 결과를 한 기록에서 확인·회수하고 싶다.”

## 5. One Thing

### 후보와 잘못된 답의 함정

| 후보 | 장점 | 함정/판정 |
|---|---|---|
| A. 모든 플랫폼 탭을 동일하게 만든다 | 표면 일관성 | 실제 capability·기존 탭을 덮어쓴 DESIGN-006 반복. **탈락** |
| B. 15개 extension을 전부 대시보드에 연결한다 | 넓은 로고 수 | 운영 미검증·불완전 코드까지 제품 지원으로 오인. **탈락** |
| C. Threads 하나를 완벽히 발행한다 | 빠른 E2E | OSMU 범위와 분리 런타임의 구조 문제를 가린다. 실험 slice로만 사용 |
| D. source identity와 account별 dispatch/result 계약을 통일한다 | UI 이름이 아니라 데이터·복구를 연결 | 이관 난도가 있으나 모든 채널에 재사용. **채택** |
| E. 새 OSMU PROVIDERS 메뉴를 만든다 | 발견성 | 존재하지 않는 IA를 발명하고 기존 Sidebar를 훼손. **금지** |

### 한 문장

> **사용자가 승인한 원문 하나를 선택한 계정들에 정확히 한 번씩 발행하고 실제 외부 결과를 한 기록에서 회수한다.**

## 6. As-is source-to-result

```mermaid
flowchart LR
  S[OSMU Studio] --> D[(DB drafts)]
  D --> N4[Next direct publish 4]
  N4 --> P1[Provider]
  N4 -. 경로별 .-> PP[(published_posts)]

  I[승인 인박스] --> Q[(queue.json primary)]
  C[발행 캘린더] --> Q
  Q -. best-effort .-> QM[(queue_posts mirror)]
  Q --> RX[root cron/extensions\nenv/plugin config]
  RX --> P2[Provider]

  SP[SchedulePanel] --> SC[(DB schedules)]
  SC --> W[publish-due 8]
  W --> P3[Provider]
  W --> PP

  V[Video publish API 3] --> P4[Provider]
  V -. YouTube/TikTok/Reels별 상이 .-> PP

  D -. 자동 연결 없음 .- Q
  Q -. canonical read 아님 .- SC
  PP -. universal result group 없음 .- Q
```

### 현재 끊김

1. Studio DB draft는 Inbox/Calendar의 `queue.json` item과 자동으로 같은 source가 아니다.
2. `queue_posts`는 정본이 아니라 best-effort shadow라 JSON write 이후 DB mirror 실패를 삼킨다.
3. text direct publish는 UUID draft의 순차 재시도 dedupe는 있지만 외부 호출 전 공통 reservation이 없다. draft가 없거나 동시 요청이면 중복 가능성이 남는다.
4. Threads/Instagram 일부만 permalink recovery가 있고, 모든 provider가 공유하는 result recovery·result-group retry는 없다.
5. schedule worker의 row claim과 video TikTok/Reels reservation은 유효한 구현이지만 다른 경로의 안전을 대변하지 않는다.
6. OAuth state는 tenant·provider·10분 만료 검증이 있으나 같은 provider state의 one-time consumption이 TODO다.

## 7. 채널 구현 지도

### 7.1 Text/feed 8

| 채널 | Next `/api/publish` | DB schedule worker | Studio direct | root extension | 결과·복구 현재 | 상태 |
|---|---|---|---|---|---|---|
| Threads | 있음 | 있음 | 있음 | 있음 | `published_posts`; permalink recovery 일부 | 부분 구현·운영 provider 장애 이력 |
| X | 있음 | 있음 | 있음 | 있음 | draft 기반 sequential dedupe, universal recovery 없음 | 구현·운영 미검증 |
| Facebook | 있음 | 있음 | 있음 | 있음 | 공통 result row, universal recovery 없음 | 구현·운영 미검증 |
| Instagram Feed | 있음 | 있음 | 있음 | 있음 | `published_posts`; permalink recovery 일부 | 과거 carousel/R2 운영 검증 기록 + 현재 OAuth/account 운영 장애 |
| Bluesky | 있음 | 있음 | 없음 | 있음 | 공통 result row, universal recovery 없음 | 구현·운영 미검증 |
| Telegram | 있음 | 있음 | 없음 | 있음 | 공통 result row, universal recovery 없음 | 구현·운영 미검증 |
| Discord | 있음 | 있음 | 없음 | 있음 | 공통 result row, universal recovery 없음 | 구현·운영 미검증 |
| Slack | 있음 | 있음 | 없음 | 있음 | 공통 result row, universal recovery 없음 | 구현·운영 미검증 |

**정확한 count:** Next text 8 / DB schedule 8 / Studio direct 4. Studio preview 7은 publish support 수가 아니라 Threads·X·Facebook·Instagram·Shorts·Reels·TikTok의 렌더 프리뷰 수다.

### 7.2 Video 3

| target | Next video path | 현재 persistence/idempotency | root extension과 관계 | 상태·gap |
|---|---|---|---|---|
| YouTube Shorts | upload code 있음 | 외부 URL 반환, `published_posts` 일관 기록 없음 | root YouTube tool은 video file 필요로 항상 실패 반환 | 부분 구현·운영 미검증 |
| TikTok | init/status code 있음 | `in_progress` reservation과 polling 있음 | root TikTok은 text schema+pull URL 불완전 | 부분 구현·audit/operational 미검증 |
| Instagram Reels | publish code 있음 | unique reservation, published/failed 기록 있음 | root Instagram은 image/carousel feed 중심 | 부분 구현·OAuth/account 장애 영향 |

### 7.3 root publish extension 15 — 실행 계약 전수표

모두 `definePluginEntry`로 OpenClaw plugin loader에 등록되며 compose의 `OPENCLAW_EXTENSIONS` 선택을 받는다. credential은 tenant DB가 아니라 plugin config 우선, process env fallback인 **runtime-global** 범위다. 따라서 같은 이름의 Next tenant adapter와 자동 통합된 것으로 보면 안 된다.

| # | extension | Runtime loader | Credential source | Tenant scope | Accepted media | External result 현재 | Permalink 현재 | root queue compatibility | Disposition |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | threads-publish | plugin entry/tool | plugin config→Threads env | runtime-global | text, image URL, quote ID | media ID·media type | 없음 | **예: threads** | initial bet에서는 legacy freeze; 공통 contract 뒤 integrate |
| 2 | x-publish | plugin entry/tool | plugin config→X API key/secret+token/secret env | runtime-global | text | tweet ID | 없음 | **예: x** | X credential probe 뒤 integrate 후보 |
| 3 | facebook-publish | plugin entry/tool | plugin config→FB token/page env | runtime-global | text | post ID | 없음 | 아니오 | follow-up integrate |
| 4 | instagram-publish | plugin entry/tool | plugin config→IG token/user env + R2 env | runtime-global | image 1개/2~10 carousel+caption | media ID | 없음 | **예: instagram** | Feed legacy 보존; result contract 뒤 integrate |
| 5 | bluesky-publish | plugin entry/tool | plugin config→handle/app-password env | runtime-global | text | URI·CID | 없음 | 아니오 | follow-up integrate |
| 6 | telegram-publish | plugin entry/tool | plugin config→bot token/chat env | runtime-global | text | message ID | 없음 | 아니오 | follow-up integrate |
| 7 | discord-publish | plugin entry/tool | plugin config→webhook env | runtime-global | text | success+length만 | 없음 | 아니오 | result ID 계약 없으므로 repair 후 integrate |
| 8 | slack-publish | plugin entry/tool | plugin config→webhook env | runtime-global | text | success+length만 | 없음 | 아니오 | result ID 계약 없으므로 repair 후 integrate |
| 9 | line-publish | plugin entry/tool | plugin config→channel token env | runtime-global | text broadcast | success+length만 | 없음 | 아니오 | hold-disabled; result/account 계약 후 재평가 |
| 10 | linkedin-publish | plugin entry/tool | plugin config→token/person URN env | runtime-global | text | post ID | 없음 | 아니오 | hold-disabled; review/tenant 계약 후 재평가 |
| 11 | naver-blog-publish | plugin entry/tool | plugin config→blog/user/API key env | runtime-global | text/XML-RPC | success+length만 | 없음 | 아니오 | hold-disabled; API 유효성·result 계약 재감사 |
| 12 | pinterest-publish | plugin entry/tool | plugin config→token/board env | runtime-global | image URL 필수+text | pin ID | 없음 | 아니오 | hold-disabled; media/result 계약 후 재평가 |
| 13 | tumblr-publish | plugin entry/tool | plugin config→OAuth1 keys/blog env | runtime-global | text | post ID | 없음 | 아니오 | hold-disabled; tenant/result 계약 후 재평가 |
| 14 | tiktok-publish | plugin entry/tool | plugin config→access token env | runtime-global | schema는 text; init은 URL 없는 PULL_FROM_URL | publish ID | 없음 | 아니오 | **repair-or-retire**; 고객 노출 금지 |
| 15 | youtube-publish | plugin entry/tool | plugin config→access token env | runtime-global | schema는 text, 실제 video file 미수용 | 명시적 `success:false` | 없음 | 아니오 | **retire/replace**; Next video와 통합 주장 금지 |

root `threads-queue`가 channel mutation으로 받는 값은 `threads`, `x`, `instagram` **3개뿐**이다. 위 표의 나머지 12개 extension은 queue-compatible이라고 추정하지 않는다. `midjourney`는 plugin 목록에는 있으나 publish extension 15개 count에는 포함하지 않는다.

M5 전까지 root-only 5와 불완전 2를 고객용 ‘연결 가능’으로 승격하지 않는다.

## 8. Target outcome

```mermaid
flowchart LR
  A[기존 Studio·Inbox·Calendar 진입] --> S[tenant-scoped source identity]
  S --> V[account/capability별 variant]
  V --> R[사람 승인]
  R --> K[idempotent dispatch reservation]
  K --> AD[검증된 provider adapter]
  AD --> E[external result]
  E --> G[source result group]
  K --> G
  G --> U[기존 화면에서 독립 상태·실제 링크·다음 행동]
  F[legacy queue/root runtime] --> M[비파괴 dual read/migration]
  M --> S
```

Target은 기존 Sidebar·route를 유지한다. 새 top-level `OSMU PROVIDERS`를 만들지 않는다. Studio·Inbox·Calendar가 같은 source를 읽는다는 요구는 target이며, 현재 구현 주장과 분리한다.

## 9. MVP 기능 5개

| MVP | One Thing 연결 | 고객 결과 | 제외 |
|---|---|---|---|
| M1. Current Truth & Route Contract | 잘못된 지원 약속 제거 | 채널/account/capability별 현재 상태·이유·다음 행동 | 15 extension 일괄 활성화 |
| M2. Shared Source Identity & Read Convergence | 모든 경로가 같은 원문을 참조 | 기존 Studio·Inbox·Calendar에서 같은 source·변경을 확인 | Big-bang JSON 삭제 |
| M3. Account Truth & OAuth Safety | 정확한 tenant/account에만 dispatch | 동일 handle/state/CTA, one-time OAuth state, explicit target | provider 계정 자동 추측 |
| M4. Idempotent Dispatch & Recovery | 선택 계정별 한 번만 외부 호출 | 동시·timeout·부분 실패에서 success 재발행 0 | provider 성공을 내부 2xx로 추정 |
| M5. Result Group & Workflow Projection | 외부 결과를 한 묶음으로 회수 | source별 독립 상태·provider ID·실제 link·재시도 action | 가짜 permalink/home URL |

## 10. 기능 요구사항

### 10.1 입력과 고객 출력 계약

| 기능 단위 | 입력(실질 데이터) | 고객 출력 |
|---|---|---|
| Source 승인 | tenant, raw source, variants, selected account/capability, approval actor/time | 승인된 target 목록과 변경 불가 payload hash |
| OAuth callback | signed state+nonce cookie, provider code, tenant/provider | 정확한 account identity·scope·verified-at·CTA 또는 external call 전 거절 |
| Dispatch | source ID, target account, capability, payload hash, schedule/now | account별 reservation, processing/published/failed, 실제 provider ID/permalink |
| Migration | snapshot checksum, legacy/canonical records, provenance | 단계·authority·parity·replay lag·rollback readiness |
| Cohort | versioned consent, external workspace, events, payment/refund record | activation/repeat/paid-intent 판정, export/delete 상태 |

| ID | 요구 | 현재 상태 | 현재 출처 | v4 종료증거 |
|---|---|---|---|---|
| FR-01 | 8 text·3 video·15 extension을 서로 다른 범주로 유지한다 | 부분 | constants, routes, extensions | count diff 0; readiness 독립 |
| FR-02 | 기존 Sidebar·route·provider별 실제 탭을 보존한다 | 구현됨(현 shell) | Sidebar, DESIGN-006 | 삭제/리네임/이동 0 또는 승인 migration |
| FR-03 | source에 tenant-scoped stable identity를 부여한다 | 부분·경로 분리 | drafts/queue/schedules schema | 네 경로가 같은 source 참조 가능 |
| FR-04 | Studio DB draft와 queue item의 explicit provenance/link를 둔다 | 미구현 | Studio/queue audit | 자동·수동 bridge가 traceable, orphan 0 |
| FR-05 | Inbox·Calendar가 canonical source/dispatch 상태를 읽도록 단계 이관한다 | 미구현 | pages, queue-store | dual-read parity 후 canonical read switch |
| FR-06 | queue JSON write와 DB mirror 불일치를 검출·복구한다 | 부분 | queue-store | silent mirror failure 0, reconciliation report |
| FR-07 | provider/account/capability별 variant와 승인상태를 독립 보존한다 | 부분 | Studio, schedules | 한 target 수정이 다른 target overwrite 0 |
| FR-08 | OAuth state를 tenant·provider·expiry뿐 아니라 1회만 소비한다 | 부분 | social-connect TODO | 같은 state 두 번째 callback 거절 |
| FR-09 | 연결 상태가 실제 identity/scope/verified-at/CTA와 네 surface에서 일치한다 | 운영 장애 | QA request ledger | Global/Channel/Editor/Queue diff 0 |
| FR-10 | dispatch 전 source·target account·capability·payload hash를 고정한다 | 미구현(일부 video만) | publish/video audit | 동일 intent의 공통 idempotency key |
| FR-11 | 외부 호출 전에 동시 요청을 막는 reservation을 확보한다 | 부분 | schedule/TikTok/Reels 있음, generic text 없음 | no-draft 포함 concurrent external result ≤1 |
| FR-12 | 외부 성공/내부 저장 실패를 `republish`와 분리해 repair한다 | 부분 | publish reconciliation | persistence-only repair로 duplicate 0 |
| FR-13 | timeout 후 provider result를 조회해 실제 ID/link를 회수한다 | 부분(Threads/IG) | publish route | enabled adapter 전부 recovery contract |
| FR-14 | multi-target 결과를 source result group으로 조회한다 | 미구현 | PLAN-007 | success/processing/failed 독립 상태·실 link |
| FR-15 | 실패 target만 재시도하고 성공 target은 재발행하지 않는다 | 미구현(경로별 dedupe 일부) | publish/schedule audit | partial retry duplicate 0 |
| FR-16 | processing video는 terminal 전 published로 표시하지 않는다 | 부분 | video route/status | accepted→processing→published/failed timeline |
| FR-17 | YouTube 결과도 다른 target과 같은 persistence/recovery 계약을 따른다 | 미구현 | video audit | provider ID/link/status row+recovery |
| FR-18 | root extension은 tenant/account/result 계약을 만족한 것만 adapter로 승격한다 | 미구현 | extensions audit | 15개 각각 integrate/repair/retire 결정+proof |
| FR-19 | 운영 미검증/장애 target은 disabled reason/action/owner를 보여준다 | 부분 | settings/readiness | false enabled 0 |
| FR-20 | disconnect/revoke/delete 후 새 dispatch를 막고 기존 evidence 보존 범위를 알린다 | 부분 | integration routes | revoked external call 0; evidence policy 표시 |
| FR-21 | 실제 provider ID/permalink가 없으면 home URL을 결과 링크로 대체하지 않는다 | 부분·Studio fallback 존재 | Studio `POST_URL` | 가짜 result link 0 |
| FR-22 | source/dispatch/result의 운영 감사와 correlation을 제공한다 | 부분 | DB rows/logs | incident 1건을 source→external까지 추적 |
| FR-23 | legacy queue/root 경로는 parity·rollback 증거 전 제거하지 않는다 | 구현 필요 | queue-store | destructive delete 0; fallback rehearsal |
| FR-24 | private service data를 공용 analytics에 섞지 않는다 | 정책 요구 | root constitution | raw source/token/handle/permalink leak 0 |
| FR-25 | 외부 cohort는 최소수집·30일 raw·180일 evidence·7일 export/delete·operator/subprocessor disclosure에 명시동의한다 | 미구현·승인 대기 | §14.5 | 회장 승인+versioned consent+철회/delete E2E |
| FR-26 | 최초 safety bet은 Threads·Instagram Feed·X만 enabled proof를 만들고 나머지는 후속 bet으로 분리한다 | 기획 보정 | code audit/appetite | X credential probe, 28h initial cap, 자동 확대 0 |

## 11. 비기능 요구사항

| ID | 요구 | 합격선 |
|---|---|---|
| NFR-01 Tenant isolation | read/write/dispatch/result 모든 key가 tenant 범위 | 2 tenant×2 account 교차 접근/호출 0 |
| NFR-02 Idempotency | 동일 intent 동시 20회와 timeout retry | 외부 result ≤1, 나머지 동일 결과 회수 |
| NFR-03 Recoverability | provider success 후 DB/JSON/log 장애 | republish 없이 15분 내 reconciled 또는 actionable |
| NFR-04 Truthfulness | connected/published/supported 표시 | 실 identity·scope·provider ID/link 없는 false-success 0 |
| NFR-05 Privacy | secret/private payload/log/analytics | 원문·token·handle·permalink raw leak 0 |
| NFR-06 Migration safety | dual-write/read-switch/rollback | record loss 0, destructive schema op 0 |
| NFR-07 Observability | source→dispatch→provider correlation | 실패 단계·owner·다음 행동 1분 내 식별 |
| NFR-08 UI preservation | 기존 navigation과 디자인시스템 | Sidebar/route/settings/provider tab orphan 0 |
| NFR-09 Data lifecycle | raw/evidence/export/delete lifecycle | 30일/180일/7일 timer와 access audit, overdue 0 |

## 12. 기술부채 우선순위

| 순위 | 부채 | 지금 위험 | 선행 종료증거 |
|---:|---|---|---|
| D0 | account truth·OAuth same-provider replay | wrong-account·state 재사용은 보안/신뢰 사고 | FR-08/09, TC-005~007 |
| D1 | 공통 source identity 부재·queue JSON primary | 화면 간 orphan과 silent mirror drift | FR-03~06, TC-008~011 |
| D2 | generic text/no-draft concurrent reservation 부재 | 실제 중복 게시 | FR-10~12, TC-012~014 |
| D3 | universal result/permalink recovery·group retry 부재 | 성공을 실패로 보고 재발행 | FR-13~15/21, TC-015~018 |
| D4 | video 3개 persistence/state 불일치 | Shorts/Reels/TikTok 결과 신뢰 불가 | FR-16/17, TC-019~021 |
| D5 | root 15 extension과 Next runtime의 중복·격리 | 지원 과장·credential/tenant 혼선 | FR-18, TC-022 |

D0는 현재 신규 외부 연결 hard stop이다. D1~D3은 ‘하나의 OSMU’의 필수 기반이며 로고 수 확대보다 먼저다.

## 13. 비파괴 이관 슬라이스

| Slice | 범위 | Exit | Rollback/stop |
|---|---|---|---|
| R0 Truth freeze | v4.1 matrix·feature flags·운영 장애 CTA, 기존 shell snapshot | 8/3/15 count, false-enabled 0, sidebar/route baseline | UI flag만 이전 상태로; 데이터 변경 없음 |
| R1 Account safety | 20-concurrent one-time OAuth state, identity/scope/CTA, 2-account 선택 | token endpoint/account write exactly 1, wrong-account 0 | 신규 OAuth/dispatch off; 기존 token 원문 노출 금지 |
| R2 Source convergence | 아래 M0~M8 이관, stable source ID, reconciliation | 7일 parity→canary→canonical, rollback record loss 0 | JSON snapshot/read fallback과 reverse replay 유지 |
| R3 Initial dispatch safety | **Threads·Instagram Feed·X만** reservation·repair·recovery·result group | 실제 credential target별 concurrent/retry/permalink E2E, duplicate 0 | 세 target별 flag off; success evidence 보존 |
| F1 Text expansion (후속 bet) | 나머지 text 5의 adapter convergence | adapter별 별도 proof·승인 | 초기 3 target의 안정성을 회귀시키면 중단 |
| F2 Video convergence (후속 bet) | YouTube·TikTok·Reels 공통 state/result | 3 target terminal/result/retry parity | target별 off; provider result 자동삭제 금지 |
| F3 Extension repair (후속 bet) | 15 disposition 중 승인된 1개씩 repair/integrate | 선택 extension의 tenant/result/queue proof | 미검증 extension 고객 노출 0 |
| F4 External cohort (후속 bet) | 권리정책 승인 후 opt-in 반복·실결제 | 아래 BM/kill threshold 충족 | 신규 모집·지출 중단; export/delete SLA 수행 |

### 13.1 Queue JSON → canonical read 이관 상태기계

| 단계 | Writer authority | Read authority | Copy/replay | 진입·종료 조건 | 실패 시 rollback |
|---|---|---|---|---|---|
| M0 Snapshot | 기존: queue는 JSON, Studio/schedule/video는 각 DB | 기존 화면별 store | JSON immutable snapshot+checksum | row/file count·hash 기록 | snapshot만 보존, 행동 변화 0 |
| M1 Backfill | **legacy writer**만 신규 write 권위 | legacy read | snapshot→canonical idempotent backfill, provenance 저장 | count/hash/orphan diff 0 | canonical backfill rows 폐기 가능; legacy 무변경 |
| M2 Dual-write | legacy 요청을 받아 canonical+JSON 모두 commit하는 gateway; ack는 둘 다 성공 시 | legacy read | canonical commit 후 JSON 실패는 outbox로 **reverse replay** | failure injection에서 silent divergence 0 | legacy read 유지, outbox drain |
| M3 Shadow-read | M2와 동일 | legacy가 고객 응답 권위, canonical은 shadow compare만 | 양방향 diff report; canonical→JSON reverse replay | 모든 state/payload/result field 비교 가능 | shadow off, dual-write 유지 |
| M4 7-day parity | M2와 동일 | legacy 권위 | 매 write·주기 checksum, reverse replay | **7일 연속 parity 100%, orphan/drift unresolved 0** | parity clock reset, M3 |
| M5 Canary read switch | canonical-first dual-write; JSON reverse replay 필수 | 승인 tenant 1곳만 canonical, 오류 시 request-level legacy fallback | cutover 후 신규 write도 JSON에 replay | canary 72h wrong-state/loss/duplicate 0 | tenant flag로 legacy read; JSON에 신규 write 존재 확인 |
| M6 Canonical switch | **canonical writer 권위**, JSON은 rollback replica | canonical read, legacy fallback on | canonical→JSON reverse replay+lag alert | 전체 tenant 7일 loss/drift 0 | legacy read로 복귀; cutover 후 write까지 JSON에 있어 loss 0 |
| M7 Legacy writer freeze | canonical writer만 허용; direct JSON write reject+audit | canonical read, JSON emergency fallback | reverse replay 계속 | direct legacy write 0, rollback drill PASS | freeze 해제 없이 canonical→JSON replica로 read rollback |
| M8 Fallback removal | canonical only | canonical only | final snapshot/export, JSON writer·reader 제거 | 회장 승인+30일 안정+restore rehearsal | archive snapshot으로 별도 복구; 자동 downgrade 금지 |

**Cutover 핵심:** M5~M7의 신규 write는 canonical commit 뒤 JSON rollback replica로 reverse replay된다. TC-011은 각 단계에서 canonical/JSON 한쪽 장애와 cutover 후 신규 100건을 주입하고 legacy read rollback 뒤 100/100 조회·상태 일치·외부 재발행 0을 직접 확인한다.

각 slice는 이전 slice의 exit가 관찰되기 전 다음 capability를 고객에게 enabled하지 않는다. 정확한 schema/API 선택은 eng-design 대화 게이트에서 확정한다.

## 14. BM·운영 부하

### 14.1 BM 가설

- 고객이 지불하는 대상은 생성 token 수가 아니라 account-safe approval, 중복 없는 dispatch, 실제 결과 회수에 드는 운영시간 절감이다.
- 가설 패키지: workspace 구독 + 고비용 AI/video usage credit. 가격과 원가 배분은 외부 cohort 전 확정하지 않는다.
- benchmark에서 차용: Buffer의 post group처럼 그룹 안의 각 채널 결과를 독립 편집·삭제·재예약하는 모델, Later의 multi-profile 작성 중 프로필별 customization과 미지원 미디어 비활성화. 변경점은 우리 제품에서 group의 기준을 UI 묶음이 아니라 source/dispatch/result의 복구 가능한 계약으로 둔 것이다.

### 14.2 운영 appetite — 총 52시간 고정, bet별 재진입 gate

| Bet | 대상 | SJ 시간 상한 | 다음 bet 진입조건 |
|---|---|---:|---|
| **Initial safety bet** | R0 truth 3h + R1 OAuth/account 7h + R2 migration 8h + R3 Threads/IG/X 10h | **28h** | 세 target exact-once+실 permalink, migration rollback PASS |
| F1 Text expansion | remaining text 5 | 6h | 초기 3 target 회귀 0, 대상 credential/recovery proof |
| F2 Video convergence | YouTube/TikTok/Reels | 8h | 별도 회장 승인, review/audit/credential 준비 |
| F3 Extension repair | 15 disposition 중 1개씩 | 6h | repair 대상 1개와 retire 비용 비교 승인 |
| F4 External cohort | 권리정책 동의+activation/repeat/paid pilot | 4h | **데이터 권리 추천안 회장 승인** |
| **합계** | 순차 bet, 자동 연속 아님 | **52h** | 상한 초과 금지 |

기간 상한은 종전 13주, 신규 현금 상한은 USD 500을 유지하되 두 값 모두 승인 전 appetite다. 주 4h 평균은 계획용 시간원이며 실제 6사업 일정표가 repo/wiki에 동기화돼 있다는 뜻이 아니다.

**왜 non-Meta는 X인가:** X는 Next `/api/publish`, DB schedule 8 목록, Studio direct 4, root `x-publish`, channel account/config test surface가 모두 존재하고 root credential도 API key/secret+access token/secret 네 필드로 명시돼 있어 non-Meta 중 code-path readiness가 가장 높다. 단 실제 유효 credential·API 비용·실 permalink는 아직 미검증이므로 R0 probe 실패 시 X를 대체 지원으로 꾸미지 않고 R3에서 disabled한다.

X 사용료, Meta/TikTok/YouTube review, storage/egress, 법률 비용을 0으로 가정하지 않는다. 상한을 넘으면 다른 사업 예산을 전용하지 않고 해당 target/slice를 disabled로 남긴다.

### 14.3 운영 부하

| 부하 | Owner | 상한/자동화 목표 |
|---|---|---|
| OAuth/app review·scope 변경 | SJ | 주 1회 readiness review; 장애 시 신규 연결 off |
| reconciliation queue | 운영자 | 평시 미해결 0, 장애 후 15분 내 action 분류 |
| provider policy/quota | 제품 운영 | 월 1회+공식 변경 알림; 근거시각 저장 |
| duplicate/wrong-account incident | SJ 즉시 | 1건이면 전체 affected dispatch hard stop |
| extension 15 inventory | tech owner | F3에서 15/15 disposition, 미검증 자동 승격 0 |

### 14.4 Cohort 지표의 계산 가능한 정의

| 지표 | 분자 조건 | 제외/중복제거 | 미달 시 실행 |
|---|---|---|---|
| Activation | 외부 workspace가 **계정 연결 완료 + 원문 1개 사람 승인 + 선택 account의 실제 permalink 1건**을 모두 충족 | SJ·6사업·test/app-review account 제외, workspace+email hash 중복 제거 | 10개 중 21일 activation <3이면 F1~F3 capability 확대와 paid acquisition 중단 |
| Repeat | activation source와 다른 **두 번째 source**가 첫 activation 후 14일 안에 실제 permalink 1건 생성 | retry/같은 source variant/동일 permalink 제외 | activation 10개 중 repeat <3이면 신규 adapter·video·extension bet 중단 |
| Paid intent | 환불 조건을 사전 고지한 **유료 pilot을 실제 결제**하고 7일 내 전액 환불 가능한 상태 | 구두 의향·설문·내부 결제·즉시 전액환불 제외 | paid intent <2이면 가격/BM 확정과 유료 acquisition 중단 |

TC-025는 threshold 계산만 하지 않고 feature flags·광고비·다음-bet 상태가 실제로 `stopped`가 되는지 확인한다. 지표 미달 뒤 사람이 수동으로 계속 확장할 수 있는 상태면 FAIL이다.

### 14.5 외부 cohort 데이터 권리 추천 기본값

> **의사결정 경계:** 아래는 추천 기본값이며 회장 승인 전 외부 cohort 모집·데이터 수집·유료 pilot은 금지한다. 나머지 v4.1 plan 계약은 이 결정과 무관하게 닫는다.

| 항목 | 추천 기본값 |
|---|---|
| 최소수집 | 발행에 필요한 raw source·선택 media·target account만 수집. 6사업 private 고객/학생/관계 데이터와 공용 analytics 반입 0 |
| Raw 보존 | raw source·variant·업로드 media는 마지막 dispatch 또는 draft activity 후 **30일 기본 보존**, 사용자가 더 짧게 선택 가능 |
| Evidence 보존 | raw 본문 없이 source hash, 승인시각·actor pseudonymous ID, provider/account non-secret ID, dispatch status, provider result ID, permalink, timestamps만 **180일** 보존해 duplicate/분쟁 복구. 법적 의무가 없으면 삭제 요청이 우선 |
| Export·해지/삭제 | 구조화 export를 먼저 제공하고 export 완료 또는 해지/삭제 요청 접수 중 빠른 시점부터 **7일 이내 active store 삭제**. backup은 최대 30일 내 만료, legal hold가 있으면 범위·근거·기간 통지 |
| Credential | token 원문은 export·analytics 대상 아님. revoke/delete 시 신규 dispatch 즉시 차단하고 secret store에서 삭제 |
| 운영자 접근 | least privilege, incident/support 목적·시간제한, 모든 raw access audit; 고객별 접근 이력 제공 가능 |
| Subprocessor | provider·AI·storage·analytics 업체와 처리 목적/국가/보존기간을 동의 전 공개하고 변경 사전 고지 |
| 책임 공개 | provider 전송과 AI 변환 여부, 최종 공개·저작권·플랫폼 정책에 대한 사용자 승인 책임, 제품의 보안·정확 발행·삭제 책임을 분리해 평문 고지 |
| Consent | unchecked explicit consent로 policy version·수집범위·provider/AI/subprocessor·30일/180일·7일 SLA 확인. 철회 즉시 신규 생성/dispatch 중단, export/delete 선택 제공 |

## 15. 법적·시장·기술 리스크

| 유형 | 리스크 | 방어/증거 |
|---|---|---|
| 법적/플랫폼 | 권한·심사·공개범위·AI/상업성 표시 위반 | capability별 공식 근거시각, 미충족 disabled, 사람 final review |
| 개인정보 | private 원문·token·handle·permalink의 공용 analytics 유입 | tenant/private store 분리, raw leak scan 0 |
| 계정 권리 | 잘못된 브랜드 계정 발행 | explicit identity+scope+target review, wrong-account hard stop |
| 시장 | 다중채널 도구가 이미 충분하고 고객은 migration을 원치 않음 | 외부 opt-in repeat/paid intent로 검증; 내부 dogfood 제외 |
| 기술 | JSON/DB dual write drift | reconciliation·dual-read parity·rollback 유지 |
| 기술 | provider timeout 후 중복 | reservation+recovery+provider ID evidence |
| 기술 | extension 코드 존재를 readiness로 오인 | 15/15 operational proof 없으면 disabled |
| 운영 | 15 adapter 유지보수가 1인 운영 한계 초과 | F3 disposition, low-use adapter retire, weekly cap |
| 데이터 권리 | cohort 참가자가 raw/evidence 보존과 provider·AI 전송을 모름 | §14.5 명시동의와 AC-27, 회장 승인 전 cohort 금지 |

## 16. 6사업 자기잠식

시간 충돌의 근거는 `docs/openclaw-auto-osmu-prd-v3.1-gpt-codex.md`의 **OSMU 주 4h/총 52h cap과 사업별 incident 우선 규칙**, 그리고 `docs/openclaw-auto-osmu-prd-v2.4-gpt-codex.md`의 사업별 운영 시나리오다. 실제 6사업 캘린더가 동기화됐다는 근거는 없으므로 `(unsourced)` 일정 예측을 하지 않고 사건 발생 조건으로 중단한다.

| 사업 | 시간 source·충돌 event | 즉시 중단할 OSMU slice | 계속 허용 |
|---|---|---|---|
| Romeo | v3.1 §6사업: 상담·incident·출시 주간이 SJ 주4h와 경합 | F1 text expansion, F2 video, F3 extension, F4 cohort·신규지출 | 기존 고객 duplicate/wrong-account 복구만 |
| Dark-Cupid | v2.4/v3.1: 신고·안전·privacy 사건은 SJ 시간 전량 우선 | **R0~R3 포함 모든 신규 OAuth/dispatch**, F1~F4 | affected OSMU dispatch off·evidence export만 |
| Yeon | v2.4/v3.1: 핵심 운영/온보딩·고객 장애 주간 | R3 신규 target, F1~F4, 신규 cohort onboarding | R1/R2의 데이터 안전 복구만 |
| OKgram | v2.4/v3.1: 동일 provider OAuth·infra·credential 대응 경합 | R3 X/Meta 신규 연결, F1~F3 및 F4 모집 | tenant/credential 격리 조사만 |
| Polyamory | v2.4/v3.1: 법률·안전·삭제·개인정보 이슈 절대 우선 | **R0~R3 포함 모든 신규 작업과 외부 dispatch**, F1~F4 | 삭제·revoke·증거 보존 의무만 |
| 교육 | v2.4/v3.1: 수업·학생사건·교재 마감, dogfood PMF 왜곡 | F1~F4와 internal dogfood 발행/계수 | 공개 승인 자료의 기존 고객 복구만 |

우선순위는 기존 사업 안전·고객 의무 > OSMU 기존 고객 복구 > 외부 pilot > 신규 extension이다.

## 17. 수용기준과 테스트

모든 AC는 같은 번호의 TC와 1:1이다. endpoint/component 이름은 FDD에서 추가하되 행동·증거는 약화할 수 없다.

| AC / TC | 연결 요구 | Given / When / Then 종료증거 |
|---|---|---|
| AC-01 / OSMU-V41-TC-001 | FR-01 | Given repo inventory, When matrix를 재생성하면, Then text=8/video=3/extensions=15이고 중복 범주가 분리된다. |
| AC-02 / OSMU-V41-TC-002 | FR-02,NFR-08 | Given 현재 shell, When v4 UI를 비교하면, Then sidebar/route/settings/provider-tab orphan·무승인 rename·invented top-level nav가 0이다. |
| AC-03 / OSMU-V41-TC-003 | FR-19,NFR-04 | Given 미검증·장애 target, When 고객이 readiness를 보면, Then enabled=false와 reason/action/owner/evidence time이 보인다. |
| AC-04 / OSMU-V41-TC-004 | FR-01,18 | Given root extensions 15, When code-derived audit를 실행하면, Then 15/15에 runtime loader·credential source·tenant scope·accepted media·external result·permalink·queue compatibility·disposition 8필드가 있고 queue-compatible은 threads/x/instagram 3개뿐이다. |
| AC-05 / OSMU-V41-TC-005 | FR-08 | Given 동일 signed state와 동일 nonce cookie를 가진 callback 20개, When barrier로 동시에 실행하면, Then nonce atomic consume·provider token endpoint 호출·account write가 각각 exactly 1이고 나머지 19개는 token endpoint 전 replay error로 거절된다. |
| AC-06 / OSMU-V41-TC-006 | FR-09 | Given 연결 account, When four surfaces를 보면, Then identity/scope/state/verified-at/CTA diff가 0이다. |
| AC-07 / OSMU-V41-TC-007 | FR-09,NFR-01 | Given provider에 같은 브라우저 세션의 계정 2개, When 목표를 선택·연결하면, Then 저장·review·발행 account가 목표와 같고 cross-tenant call 0이다. |
| AC-08 / OSMU-V41-TC-008 | FR-03 | Given Studio/queue/schedule/video source, When 생성하면, Then tenant-scoped stable source identity와 provenance가 있다. |
| AC-09 / OSMU-V41-TC-009 | FR-04 | Given Studio draft, When Inbox/Calendar 대상이 되면, Then 명시적 bridge 하나가 같은 source를 가리키며 복제 orphan이 없다. |
| AC-10 / OSMU-V41-TC-010 | FR-05 | Given M0 snapshot, When M1 backfill→M2 dual-write→M3 shadow-read→M4 7일 parity→M5 canary→M6 canonical→M7 writer freeze→M8 fallback removal을 진행하면, Then 각 단계의 writer/read authority가 §13.1과 일치하고 exit 전 다음 단계 진입이 0이다. |
| AC-11 / OSMU-V41-TC-011 | FR-06,23,NFR-06 | Given M2~M7 각 단계 한쪽 write failure와 M5 이후 신규 write 100건, When reverse replay 뒤 JSON legacy read로 rollback하면, Then 100/100 source·state·result가 조회되고 record loss·duplicate external call·silent drift가 0이다. |
| AC-12 / OSMU-V41-TC-012 | FR-07 | Given multi-target source, When 한 variant만 수정/승인하면, Then 다른 target payload/approval overwrite가 0이다. |
| AC-13 / OSMU-V41-TC-013 | FR-10,11,NFR-02 | Given no-draft 포함 동일 intent 20개, When 동시에 dispatch하면, Then provider external result가 최대 1개다. |
| AC-14 / OSMU-V41-TC-014 | FR-12,NFR-03 | Given provider success 후 persistence failure, When repair하면, Then republish 0이고 기존 provider result가 저장된다. |
| AC-15 / OSMU-V41-TC-015 | FR-13 | Given timeout/unknown, When reconcile하면, Then enabled text adapter 8개 각각 provider ID·permalink 또는 actionable terminal reason을 회수한다. |
| AC-16 / OSMU-V41-TC-016 | FR-14 | Given 3개 target의 mixed result, When source를 열면, Then 하나의 group에서 target별 status/provider ID/link/updated time이 독립 표시된다. |
| AC-17 / OSMU-V41-TC-017 | FR-15 | Given success 2·failed 1, When retry를 누르면, Then failed 1만 호출되고 success duplicate 0이다. |
| AC-18 / OSMU-V41-TC-018 | FR-21,NFR-04 | Given provider ID/permalink 없음, When 결과를 표시하면, Then provider home URL을 게시물 링크로 표시하지 않는다. |
| AC-19 / OSMU-V41-TC-019 | FR-16 | Given accepted video, When terminal 전 조회하면, Then processing이고 published가 아니다; terminal 뒤만 실제 link와 final status다. |
| AC-20 / OSMU-V41-TC-020 | FR-17 | Given YouTube upload success/timeout, When 저장·reconcile하면, Then TikTok/Reels와 같은 result fields와 duplicate 0을 충족한다. |
| AC-21 / OSMU-V41-TC-021 | FR-16,17 | Given video targets 3, When capability E2E를 실행하면, Then 각 target은 enabled proof 또는 disabled reason/action 중 하나이고 false-success 0이다. |
| AC-22 / OSMU-V41-TC-022 | FR-18 | Given F3, When extensions를 판정하면, Then 15/15 disposition과 owner/proof가 있고 root-only 미검증 고객 노출 0이며 한 번에 승인된 1개만 repair한다. |
| AC-23 / OSMU-V41-TC-023 | FR-20,22,NFR-07 | Given revoke 또는 incident, When dispatch/trace하면, Then 새 external call 0, evidence 보존, source→provider 단계·owner·action 식별이 된다. |
| AC-24 / OSMU-V41-TC-024 | FR-24,NFR-01,05 | Given 2 tenants×2 accounts와 synthetic private payload, When read/write/publish/log/analytics를 검사하면, Then cross-tenant와 raw private/secret leak가 0이다. |
| AC-25 / OSMU-V41-TC-025 | F4/BM | Given 권리정책에 동의한 외부 cohort 10개, When 30일 측정하면, Then activation=계정연결+사람승인+실 permalink 1건, repeat=14일 내 다른 두 번째 source 실 permalink, paid intent=7일 환불 가능한 pilot 실제결제로 계산되고 threshold 미달 시 F1~F3 확대·paid acquisition flags가 `stopped`다. |
| AC-26 / OSMU-V41-TC-026 | 전체 | Given PLAN-007·DESIGN-006·v4 sources, When RTM을 검사하면, Then orphan 0이고 v3.1.1/DESIGN v6가 target 근거로 연결된 행은 0이다. |
| AC-27 / OSMU-V41-TC-027 | FR-25,NFR-09 | Given 회장이 §14.5를 승인하고 unchecked consent를 한 외부 고객, When export 또는 해지/삭제를 요청하면, Then raw 30일·evidence 180일 범위와 provider/AI/subprocessor/책임을 사전 표시하고 active store는 7일 내 삭제되며 접근 audit·철회 후 dispatch 0을 증명한다. 승인 전에는 cohort create/collect/pay가 0이다. |
| AC-28 / OSMU-V41-TC-028 | FR-26 | Given 52h appetite, When initial bet을 시작하면, Then enabled proof 대상은 Threads·Instagram Feed·X뿐이고 X의 API key/secret+token/secret 유효성·비용·실 permalink 중 하나라도 실패하면 X disabled, F1~F4 자동 진입과 initial 28h 초과가 0이다. |

## 18. 요구 추적표

| 상류/근거 | 요구 | AC/TC | 상태 |
|---|---|---|---|
| PLAN-007 runtime split | FR-03~06,10~18,23 | AC/TC-008~022 | v4 재작성 |
| 코드 audit text 8 | FR-01,10~15 | 001,013~018 | count·contract 고정 |
| 코드 audit video 3 | FR-01,16,17 | 001,019~021 | 불균일성 고정 |
| 코드 audit extensions 15 | FR-01,18 | 004,022 | directory≠readiness 고정 |
| queue JSON primary+DB mirror | FR-03~06,23 | 008~011 | target 이관, 현재 연속성 주장 금지 |
| OAuth same-provider TODO/운영 account 장애 | FR-08,09 | 005~007 | D0 hard stop |
| DESIGN-006 Sidebar 누락 | FR-02,NFR-08 | 002 | 보존 baseline |
| DESIGN v6 | 거짓 연속성 반례만 | 026 | target 입력 0 |
| 사용자 “기존 구현 무시” | 전체 matrix·migration | 001~026 | orphan 0 목표 |
| critic OAuth concurrency | FR-08 | 005 | state+cookie 20 concurrent exactly 1 |
| critic migration authority/rollback | FR-05,06,23 | 010~011 | M0~M8+reverse replay+new writes 100/100 |
| critic initial bet/X | FR-26 | 028 | Threads/IG/X 28h, credential gate |
| critic cohort definition/action | BM/F4 | 025 | 계산식+stopped action |
| critic data rights | FR-25,NFR-09 | 027 | 추천안 승인 전 cohort 0 |

## 19. Steelman·Premortem·Kill criteria

### Steelman

가장 강한 반대안은 “DB 수렴을 하지 말고 기존 네 경로를 그대로 두되 화면에서 링크만 제공하자”다. 이미 일부 path가 작동하며 이관은 데이터 손실·회귀 위험이 있으므로 단기 운영복구에는 더 안전할 수 있다.

그러나 고객이 같은 source인지 확인할 stable identity와 공통 reservation이 없으면 링크 UI는 중복과 false-success를 숨기는 장식이 된다. 그래서 big-bang 통합은 거부하되 R2 dual-read parity와 rollback을 통과한 뒤에만 read switch하는 점진 수렴을 채택한다.

### Premortem

1년 뒤 실패했다면 첫째 원인은 15개 extension 로고를 살리느라 실제 고객이 쓰는 2~3개 adapter의 account/recovery가 끝나지 않은 것이다. 징후는 operational proof 없이 enabled 수만 늘고 reconciliation backlog가 쌓이는 것이며, F3 이전 승격 금지로 막는다.

둘째 원인은 queue JSON→DB 이관 중 두 정본이 생겨 Inbox와 Calendar가 다른 상태를 보여준 것이다. 징후는 parity <100%, orphan 증가, manual repair 증가이며, 즉시 read switch를 롤백하고 JSON fallback과 reconciliation evidence를 보존한다.

### Kill criteria

- wrong-account, cross-tenant, duplicate external result, private-data shared analytics leak 중 1건이면 affected dispatch와 외부 cohort를 즉시 중단한다. root cause와 실계정 회귀 증거 전 재개하지 않는다.
- F4에서 최대 100 qualified external prospects 중 권리정책 동의 workspace 10개를 못 모으거나, 10개 중 21일 activation(연결+승인+실 permalink) 3개 미만이면 F1~F3 capability 확대·유료 acquisition flag를 `stopped`로 전환하고 problem/segment를 재검토한다.
- activation 10개 중 14일 내 다른 두 번째 source의 실 permalink repeat가 3개 미만이거나 7일 환불 가능한 pilot 실제결제 paid intent가 2개 미만이면 BM·신규 adapter 확대를 중단한다. 내부 6사업과 SJ 계정은 분모에서 제외한다.
- R2 dual-read parity가 7일 연속 100%가 아니거나 orphan/drift가 1건이라도 unresolved면 canonical read switch를 하지 않는다.

## 20. 셀프심문·레드팀 반영

### 이 결론이 틀렸다면 가장 그럴듯한 이유는?

load-bearing 가정은 서로 다른 네 경로를 하나의 source/result 계약으로 묶는 것이 고객 가치라는 점이다. 실제로 고객은 Studio만 쓰고 Inbox/Calendar를 전혀 원하지 않을 수 있으며, 그러면 이관 비용이 과하다. 그래서 전면 이관을 즉시 확정하지 않고 R0 계측과 R2 dual-read로 실제 cross-surface 사용·orphan을 측정하며, 사용이 없더라도 duplicate/account safety에 필요한 identity/reservation까지만 남길 수 있게 슬라이스를 분리했다.

### 레드팀 공격과 수정

- **회의적 투자자:** “15개 extension 유지비가 구독 수익보다 크다.” → 15개 전부 출시 약속을 삭제하고 F3에서 15/15 disposition 후 승인된 1개씩만 repair하며, 운영 증거 전 disabled로 수정했다.
- **까다로운 고객:** “내 게시물이 올라갔는데 링크가 없으면 또 누르라는 건가?” → home URL fallback을 성공 증거에서 제외하고 persistence-only repair·provider recovery·성공 target 재시도 금지를 AC-14~18로 고정했다.
- **경쟁자:** “Buffer/Later도 multi-channel customization과 group을 한다.” → 로고 수가 아니라 tenant/account-safe source identity, concurrent reservation, external result recovery를 차별화 검증축으로 바꿨다. 시장 우월성은 아직 (unsourced)이며 cohort로 검증한다.

### planning.md 필수 7원칙 판정표

| # | 원칙 | PASS/FAIL | 실제 근거 | Closure |
|---:|---|---|---|---|
| 1 | 용어 통일 | **PASS** | §3 status taxonomy, §13.1 writer/read authority, §14.4 activation/repeat/paid intent 정의 | `지원/구현/운영`, `source/result`, `legacy/canonical` 혼용 의미를 고정 |
| 2 | 구체화 | **PASS** | text 8/video 3/extensions 15, OAuth 20, 7일 parity, write 100건, 52h | 숫자 없는 ‘충분히/안정적’ 종료조건 0 |
| 3 | 입출력 분리 | **PASS** | §10.1의 source/OAuth/dispatch/migration/cohort 입력·고객 출력 | 내부 row가 아니라 고객에게 보이는 identity/status/link/export로 출력 고정 |
| 4 | 정합성 | **PASS** | initial 3 target과 후속 5 text/3 video/15 extension을 분리, AC/TC 28쌍 | Studio direct 4·text 8·video 3·extension 15를 한 지원 수로 합치지 않음 |
| 5 | 정책 상세 | **PASS** | OAuth replay, timeout, persistence failure, partial retry, cutover rollback, revoke/delete, cohort 미달 | happy path 외 경계가 AC-05/11/14/17/23/25/27에 존재 |
| 6 | 추출 철저 | **PASS** | As-is·target flow의 source→approval→reservation→adapter→result가 FR-03~23 및 AC-08~23에 연결 | flow step orphan 0; rejected DESIGN v6 target link 0 |
| 7 | 논리 영역 | **PASS** | exact1, parity 100%, duplicate 0, permalink, 7일 SLA, stopped flag | ‘좋은 UX/편리하게/안정적으로’ 같은 비판정 문구를 종료조건으로 사용 0 |

**판정:** 7/7 PASS. 이후 critic이 증거 누락을 찾으면 해당 축을 FAIL로 되돌리고 closure 전 plan 승인하지 않는다.

## 21. Gate

### plan gate 통과 조건

- independent critic MAJOR 0
- 8 text + 3 video + 15 extension count와 status 분류 오류 0
- AC↔TC 28쌍·RTM orphan 0
- v3.1.1과 DESIGN v6를 target evidence로 사용한 행 0
- planning.md 7원칙 7/7 PASS
- **비차단 회장 결정:** §14.5 외부 cohort 데이터 권리 추천 기본값 승인/수정. 결정 전 F4 cohort만 금지하며 R0~R3와 F1~F3 plan 계약·design 진입을 막지 않는다.

### 다음 stage

현재는 **independent critic 전이라 design 진입 불가**다. critic MAJOR 0이면 데이터 권리 미결정과 무관하게 R0~R3 범위의 기존 Sidebar/route/design token additive prototype으로 진입할 수 있다. F4 cohort만 §14.5 회장 승인 전 금지한다. DB schema/API/adapter ownership은 design이 아니라 eng-design 대화 게이트에서 선택한다.

---

SKILLS_USED: 없음 — 사용 가능한 skill 목록에 PRD/제품기획 전용 skill이 없어 `planning.md`, `doc-review.md`, `benchmarks.md`, `artifact-stamp.md`를 직접 적용함  
SKILLS_SKIPPED: `brand-positioning-kit` 등은 본 과업이 브랜드 포지셔닝이 아니라 기존 런타임 감사 기반 PRD MINOR retake이므로 미적용

SOURCES: [Buffer — Creating and Managing Post Groups](https://support.buffer.com/article/662-creating-and-managing-post-groups) · [Later — Schedule a Post to Multiple Social Profiles](https://help.later.com/hc/en-us/articles/360043245633-Schedule-a-Post-to-Multiple-Social-Profiles) · `CHANGELOG.md` · `dashboard/src/lib/constants.ts` · `dashboard/src/app/studio/page.tsx` · `dashboard/src/app/api/studio/drafts/route.ts` · `dashboard/src/app/inbox/page.tsx` · `dashboard/src/app/calendar/page.tsx` · `dashboard/src/lib/queue-store.ts` · `dashboard/src/app/api/publish/route.ts` · `dashboard/src/app/api/schedule/publish-due/route.ts` · `dashboard/src/app/api/video/publish/route.ts` · `dashboard/src/lib/social-connect.ts` · `dashboard/db/schema.sql` · root `extensions/*-publish` · `extensions/threads-queue/src/threads-queue-tool.ts` · `docs/openclaw-auto-osmu-prd-v3.1-gpt-codex.md` · `docs/openclaw-auto-osmu-prd-v2.4-gpt-codex.md` · `docs/qa-tracker.md` PLAN-007/DESIGN-006 · `/Users/sj/.claude/standards/planning.md` · `/Users/sj/.claude/standards/doc-review.md` · `/Users/sj/.claude/standards/benchmarks.md` · `/Users/sj/.claude/standards/artifact-stamp.md`

MODEL: `gpt-codex/gpt-5.6-sol`
RUBRIC_SCORE: completeness=5/5 precision=5/5 traceability=5/5 readability=4/5 slop=5/5 total=24/25
WEAKEST_LINE: 180일 비원문 evidence 보존은 duplicate·분쟁 회수용 추천값이며 외부 cohort 전 회장이 승인하거나 줄여야 한다.
