# OpenClaw Marketing Agent v19 Retake 사용자 흐름

> STAMP: created_at=2026-08-08 17:25 KST | line=marketing-agent-design | model=gpt-codex/gpt-5.6-sol | agent=product-designer/marketing_agent_design_v19_retake | skill=gstack design-review | evidence=PRD v7.3.5, v18 completeness audit, v18 agency blueprint, REQUEST-OSMU-001, current v19 prototype, official Buffer·Sprout·Google OAuth sources | deliberation=고객과 운영자의 찾는 순서는 통일하되 플랫폼별 실제 기능과 권한 경계는 유지했다

## 1. 제품 한 줄 흐름

고객이 브랜드 근거와 캠페인을 확정하고 OSMU Studio 또는 플랫폼 페이지에서 초안을 시작한 뒤, 같은 수정본을 검토·승인·게시 또는 예약하고 외부 결과를 확인해 다음 한 가지 실험으로 잇는다.

운영자는 같은 순서로 계정, 자동화, 결과 증거, 미구현을 찾지만 고객 대신 작성·승인·게시하지 않는다.

## 2. 보존 기준

v19 Retake는 새 플랫폼 셸을 발명하지 않는다. 아래 v18 및 현행 의미를 그대로 둔다.

| 보존 대상 | 고정 계약 | 회귀 판정 |
|---|---|---|
| 목적지 | Sidebar 9그룹, 고유 목적지 26개 | 삭제·합침·Home 오귀환 1건이면 실패 |
| Sidebar 순서 | Social posts → Messaging → Social short video | 순서 변경 또는 Messaging 혼입이면 실패 |
| Studio 순서 | Text → Photo/Card-news → Video | 순서 변경 또는 4번째 Messaging rail 생성이면 실패 |
| Threads | Queue, Analytics, Growth, Popular, Settings 의미 | Growth·Popular 삭제 또는 다른 지표로 대체하면 실패 |
| Instagram | Feed, Card-news, Reels 편집 의미 | Reels를 정적 이미지로 평준화하면 실패 |
| YouTube·TikTok | video job, metadata, account, async result | text queue로 표현하면 실패 |
| Messaging | Telegram·Discord·Slack handoff, 기본 꺼짐 | 자동 전달 또는 가짜 Queue·Analytics면 실패 |
| Video | V01~V24의 library·upload·rights·job·result·recovery | 상태 또는 복구 출구 누락이면 실패 |
| 역할 | customer·approver·operator 권한 분리 | operator publish control 노출이면 실패 |

## 3. 고객·운영자 공통 운영 탭

고객 Home과 Operator에는 같은 다섯 탭을 같은 순서로 둔다.

`운영 개요 | 계정 | 자동화 | 결과 증거 | 미구현`

| 탭 | 고객이 보는 것 | 운영자가 보는 것 | 권한 경계 |
|---|---|---|---|
| 운영 개요 | 내 작업 공간의 다음 행동 | 전체 계정 운영 상태 | operator 작성·승인·게시 0 |
| 계정 | 내 계정 identity·readiness | 계정별 current·target·token metadata | OAuth raw token 0 |
| 자동화 | 내 동의, 승인 정책, 예약 조건 | provider app·scope·refresh·job health | 고객 동의 우회 0 |
| 결과 증거 | 내 게시 결과·확인 시각 | provider phase·correlation·impact | 미확인 성공 0 |
| 미구현 | 내 작업을 막는 사실과 다음 owner | 전체 gap, owner, 종료 증거 | 목표를 현재처럼 표현 0 |

플랫폼 작업 탭 `Create | Queue | Calendar | Analytics | Settings`는 콘텐츠 플랫폼 내부의 작업 위치다. 공통 운영 탭과 플랫폼 작업 탭은 서로 대체하지 않는다.

## 4. 14단계 happy path

| 단계 | 고객 행동 | 시스템 응답과 보존 | 다음 화면 |
|---:|---|---|---|
| 1 | Google 로그인 후 새 작업 공간 생성 또는 초대 참여 | active workspace·role 확인 전 완료 표시 0 | 작업 요청 |
| 2 | 목표·담당자·완료 기준 입력 | 입력 저장, 빈 필드 이유 표시 | 브랜드 자료 |
| 3 | GitHub Markdown, 파일 묶음, 6문항, 붙여넣기, 새 자료 중 선택 | scope preview와 source pointer 보존 | 브랜드 기준 |
| 4 | positioning·audience·promise·proof·tone·taboo 확인 | 승인 버전과 적용 시각 고정 | 조사 |
| 5 | 시장·채널 자료 확인 | 사실·관찰·제안 분리 | 캠페인 브리프 |
| 6 | 목표·독자·offer·CTA·기간·예산 처분·권리·안전 확정 | 승인된 brief version 고정 | Text |
| 7 | 공통 text와 Threads·X·Instagram·Facebook·Bluesky variant 편집 | sibling variant 보존, 선택 항목만 수정 | Photo/Card |
| 8 | slide·crop·alt·caption·rights 확인 | 미확인 권리 항목만 차단 | Video |
| 9 | Reels·Shorts·TikTok 대본·asset·render·metadata 확인 | job 상태와 재개 지점 보존 | 피드백 |
| 10 | 항목별 의견과 수정 요청 | feedback ledger와 새 revision | 최종 승인 |
| 11 | content·account·time·rights snapshot 승인 | 이후 변경 시 approval stale | 게시·예약 |
| 12 | 지금 게시 또는 예약 | readiness와 멱등 확인 후 platform별 실행 | 결과 |
| 13 | external result·account·확인 시각·native truth 확인 | Images·Videos·Analytics와 같은 lineage | 다음 실험 |
| 14 | evidence에서 변수 하나 적용·수정·보류 | changed variable 1, held constants, undo revision | 다음 root |

## 5. 이중 시작, 한 기록

### 5.1 OSMU Studio에서 시작

1. Text, Photo/Card-news, Video 중 작업 rail을 고른다.
2. 플랫폼별 variant와 format을 편집한다.
3. OSMU 플랫폼 실행 표에서 `게시 전 확인` 또는 `Create 열기`를 누른다.
4. 플랫폼 페이지는 `OSMU에서 생성` origin과 같은 캠페인명·수정 번호를 표시한다.
5. 검토 요청 → 승인 → 지금 게시 또는 예약으로 이동한다.

### 5.2 플랫폼 페이지에서 시작

1. 플랫폼 Create에서 `이 플랫폼에서 만들기`를 누른다.
2. local draft는 새 OSMU root를 만들지 않고 같은 content lifecycle에 origin만 기록한다.
3. Queue·Calendar·Analytics는 그 기록의 projection이다.
4. Studio에서 다시 열어도 하나의 수정본만 보인다.

### 5.3 중복 방지

| 상황 | 허용 | 금지 |
|---|---|---|
| 같은 root를 Studio와 platform에서 편집 | 새 revision 1개 | record 복제 |
| 지금 게시 중 timeout | 같은 intent reconcile | 즉시 재게시 |
| 외부 성공, 내부 기록 실패 | 기록만 복구 | provider call 반복 |
| 일부 platform 성공 | 성공 보존, 실패 platform만 repair | 전체 batch 반복 |
| schedule 변경 | 동일 intent의 schedule revision | duplicate job |

## 6. 플랫폼별 Create·Publish 흐름

| 플랫폼 | OSMU 시작 | 플랫폼 시작 | 고유 의미 보존 | 현재 publish truth | edge·error 출구 |
|---|---|---|---|---|---|
| Threads | text variant → 게시 전 확인 | local text draft | Analytics 안 Growth·Popular | live publish 확인 | 실패 사유, 같은 결과 확인 |
| X | text variant → 게시 전 확인 | local text draft | 280자·thread 제약 | 자격증명·실증 필요 | Settings, export |
| Instagram Feed | photo/card → 게시 전 확인 | Feed·Card Create | slide·alt·rights | account connected only | scope·media 확인 |
| Instagram Reels | video → 게시 전 확인 | Reels Create | video job·rights·async result | account connected only | Videos, reconnect |
| Facebook | text/image → 게시 전 확인 | local post draft | Page identity | 자격증명·실증 필요 | Page·scope 확인 |
| Bluesky | text → 게시 전 확인 | local text draft | session·character constraint | 자격증명·실증 필요 | reconnect, export |
| YouTube Shorts | video → 게시 전 확인 | local video job | title·description·tags·channel | live proof pending | Videos, direct export |
| TikTok | video → 게시 전 확인 | local video job | privacy·comment·duet·stitch·AI·poll | scope·account 재확인 | reconnect, late result |
| Telegram·Discord·Slack | Studio 밖 handoff | message setup | bot·target·preview·approval | default OFF | 설정 또는 취소 |

## 7. OAuth readiness와 API 자동화

| 순서 | owner | 완료 증거 | loading | error·edge | 안전한 출구 |
|---:|---|---|---|---|---|
| 1 운영자 앱 준비 | operator | provider app metadata·redirect 확인 | app health 확인 중 | app 없음·review 필요 | Admin 중앙 연결 앱 |
| 2 고객 계정 연결 | customer | callback 뒤 stored account row | provider 이동 중 | 취소·state mismatch | 이전 안전 계정 |
| 3 계정 신원 확인 | product | handle·channel·page identity readback | identity 확인 중 | wrong account | 계정 전환·reconnect |
| 4 scope 확인 | customer+product | 필요한 scope exact set | scope readback 중 | partial denial | 해당 기능만 disabled |
| 5 refresh 확인 | product | refresh health·expiry·verified_at | refresh test 중 | revoked·expired | reconnect |
| 6 publish capability | product | provider capability readback | capability 확인 중 | app review·permission | blocked reason |
| 7 automation consent | customer | named account·scope·policy consent | 저장 중 | 취소·권한 상실 | default OFF 유지 |
| 8 live publish proof | QA·provider | external result·permalink·confirmed_at | 결과 확인 중 | timeout·uncertain | reconcile, 재게시 0 |

API automation은 1~8을 하나의 `연결됨` badge로 축약하지 않는다. 예약 시점에도 3~7을 다시 확인한다. Threads는 8/8, Instagram은 2/8, 다른 provider는 필요한 현재 증거를 표에 그대로 표시한다.

Google OAuth 공식 흐름에서 차용한 원리는 authorization code, state, 최소 scope, offline access, refresh invalidation이다. 고객 화면에는 access/refresh 원문을 표시하지 않는다.

## 8. Operator 흐름과 계정별 목표

1. `계정` 탭에서 provider·account·현재 상태·token metadata·automation·목표·증거를 본다.
2. `자동화` 탭에서 customer consent와 provider app readiness를 분리한다.
3. Admin 9개 section으로 상세 owner를 연다.
4. 외부 성공 뒤 기록 누락만 `기록만 복구`한다.
5. 고객 작업을 확인해야 하면 workspace owner 승인, reason, 15/30/60분 만료가 있는 bounded support를 쓴다.

| Admin section | happy | edge·error | 금지 |
|---|---|---|---|
| 상태 | account별 current·target 확인 | stale·unknown 표시 | 초록 badge 평준화 |
| 고객과 작업 공간 | pause/resume, shared AI approve/revoke | 권한 상실·지원 만료 | 고객 대신 publish |
| 중앙 연결 앱 | encrypted DB source·health | env import conflict, app review | customer token reveal |
| 사용량 | current counts·period·source | stale·partial | 미구현 token/cost 숫자 |
| 복구 작업 | record-only repair | uncertain은 reconcile | external retry |
| Video/TTS | provider job health | late·expired·failed | fake success |
| 보안 기록 | actor·reason·time | audit write failure | secret 기록 |
| 알림 | OAuth·provider·limit incident | delivery failure | success 침묵 |
| 설정 | session·support boundary | policy conflict | global mutation 무감사 |

## 9. empty·loading·error·edge 완전성

| 상태 | 사용자에게 보이는 것 | 보존되는 것 | 한 안전 행동 | 종료 위치 |
|---|---|---|---|---|
| loading | 실제 layout과 같은 2줄 shimmer | 마지막 정상 화면 | 취소 또는 기다림 | 현재 owner |
| empty | 무엇이 없는지, 첫 행동 | campaign·filter·account | 첫 초안 만들기 | Create·Studio |
| error | 실패 단계·원인·correlation | 입력·마지막 저장본 | 해당 단계만 재시도 | Settings·owner |
| partial | 성공/실패 platform 분리 | 성공 결과·실패 초안 | 실패한 platform만 확인 | Queue·Calendar |
| permission | 필요한 account·scope | draft·revision | scope 또는 account 연결 | Settings |
| stale | 마지막 확인 시각과 오래된 이유 | last-good | 새로 확인 | owner |
| blocked | 외부 요청 0과 blocker | approval·content·schedule | blocker 해결 | Settings·Inbox |
| uncertain | provider가 받았을 가능성 | publish intent | 같은 결과 reconcile | Results |
| repair | external result와 누락된 내부 필드 | external ID·revision | 기록만 복구 | Admin·Results |
| success | external result·confirmed_at | immutable snapshot | 결과 열기 | Results·Analytics |

Dead-end는 0이다. 모든 상태는 back/cancel, owner route, preserved context 중 최소 두 개의 탈출을 가진다.

## 10. 명시적 gap과 plan reopen

| gap | 현재 | 종료 증거 | next owner |
|---|---|---|---|
| canonical content identity | prototype contract | Studio·Create·Queue·Calendar·Results ID parity | eng-design |
| projection write owner | route별 분산 | concurrent edit conflict 0 | eng-design |
| publish idempotency·reconcile | 부분 | replay20 external≤1 | eng-design·QA |
| Instagram·X·Facebook·Bluesky live | 미검증 | account/scope/refresh/publish/readback | OAuth·QA |
| YouTube·TikTok async publish | 미검증 | upload·poll·external result | Video·QA |
| Messaging full handoff | 미구현 | bot·target·approval·schedule·result 1 record | Messaging |
| per-account token metadata | 부분 | scope·expiry·refresh·health·verified_at | Admin·OAuth |
| operator reauth audit | 부분 | reauth·intent·reason·actor/time, secret0 | Security |
| model/input/output/cost | 미구현 | exact usage source and period | Usage |
| native analytics8 | 미구현 | provenance or explicit unsupported 8/8 | Analytics |
| actual browser matrix | 미검증 | 12 role/theme/viewport screenshots·focus·overflow·target | QA |
| provider production parity | 미검증 | real OAuth·publish·result observation | QA |

⛔ 회수 필요: canonical identity, projection write owner, schedule/publish attempt idempotency는 API·DB 계약에 영향을 주므로 plan을 reopen하고 회장 합의 뒤 기술설계에서 확정해야 한다.

### M13/M14 retake 경계

- M13: 8 owner × 6 recovery state = 48개 safe-transition 계약과 preserved identity 필드는 정적으로 유지한다. 실제 브라우저 전환, uncertain 상태의 외부 재게시 0, repair 상태의 provider 재호출 0은 미검증이다.
- M14: 고객 화면은 캠페인명·수정 번호·채널·시각·상태만 노출하고 `cmp_`, `cnt_`, `rev_`, `pub_`, `ext_`, `exp_` 원초성 식별자는 내부 lineage와 test API에만 둔다. 12개 screenshot에서 raw ID·구현 용어 0과 inspector 기본 hidden을 확인하는 일은 미검증이다.
- v18의 실제 브라우저 결과는 v19 새 5탭·canonical projection의 증거로 대체하지 않는다.

⛔ 회수 필요: parent QA가 v19 전용 customer/operator × light/dark × 1440/1024/390 12개 조합에서 M13 48 recovery, M14 고객 언어·inspector·contrast·touch·overflow·focus를 직접 관찰해야 한다.

## 11. 레드팀·셀프심문

SOCRATIC_MARKER: 이 설계가 틀렸다면 가장 그럴듯한 이유는 공통 탭이 플랫폼 capability 차이를 가리는 것이 아니라, 실제 route·table이 서로 다른 write owner를 가지는데 화면이 단일 record를 약속한다는 점이다.

까다로운 고객 공격: “OSMU와 플랫폼 양쪽에 만들기 버튼이 있으면 두 번 게시될 수 있다.” 수정: origin은 metadata이고 canonical item은 하나다. uncertain에서는 publish button을 없애고 reconcile만 제공한다.

운영자 공격: “token 원문을 안 보여주면 장애를 찾기 어렵다.” 수정: account identity, scope, expiry, refresh health, verified_at, provider phase와 correlation을 보여준다. 원문 없이도 진단 가능한 metadata가 목표이며, operator app DB-secret만 별도 재인증·사유·30초 계약을 따른다.

## 12. Design review

Classifier: APP UI. Design Score: **B+**.

AI Slop Score: **B+**. 카드 모자이크·보라 그라디언트·blob·장식 아이콘·기본 system font를 새로 도입하지 않았다는 정적 판정이며, 렌더 미학의 governing grade는 실브라우저 전까지 미검증이다.

- hierarchy: A-
- platform semantics preservation: A
- state and recovery: A
- OAuth·Admin truth: A-
- responsive contract: B+
- actual provider behavior: 미검증, design score 근거에 포함하지 않음

SOURCES: `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; `tasks/marketing-agent-v18-completeness-audit.output`; `tasks/marketing-agent-v18-agency-blueprint.output`; `docs/qa-tracker.md` REQUEST-OSMU-001; `DESIGN.md` v18/v19; current prototype and current channel/OAuth/Admin source; https://support.buffer.com/article/644-how-do-i-schedule-posts-for-multiple-social-channels-at-the-same-time; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://developers.google.com/identity/protocols/oauth2/web-server; https://developers.google.com/identity/protocols/oauth2/resources/best-practices

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: gstack design-review for APP UI hierarchy, platform semantics, state, responsive, interaction, accessibility and anti-slop review

SKILLS_SKIPPED: imagegen because existing code-native UI and HTML prototype are the visual authority

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=5/5 voice=5/5 slop=5/5 total=25/25

WEAKEST_LINE: “한 기록”은 고객에게 가장 단순한 모델이지만 API·DB write owner 합의 전에는 구현 사실이 아니다.
