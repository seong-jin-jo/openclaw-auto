# OpenClaw Auto Marketing Hub PRD v5.1.0

> 2026-08-06 · model: gpt-codex/gpt-5.6-sol · **v5.0 보존, critic MAJOR 6건 리테이크** · 기반: `wiki/product/marketing-hub-surface-map.md`, `tasks/osmu-full-ui-code-audit.output`, v5.0
> 상태: 계획 산출물. 현행 코드 존재는 운영/공급자 성공 증거가 아니다.

## One Thing·사용자·증거

고객이 하나의 원본에서 **11개 출력 카드(text 8 + video 3)** 를 만들고, 연결된 자기 계정별로 편집해 즉시/예약 처리한 뒤 같은 카드에서 permalink 또는 실패 복구를 확인한다. 고객은 자기 workspace만, 운영자는 고객·OAuth 지원만 다룬다(대리 발행 금지).

공식 IA 비교 근거: [Buffer scheduling](https://support.buffer.com/article/642-scheduling-posts), [Buffer all channels](https://support.buffer.com/article/861-how-to-use-the-all-channels-view), [Later Social Sets](https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets), [Later profiles](https://help.later.com/hc/en-us/articles/360043244733-Add-Remove-Transfer-Social-Profiles-in-Later), [Hootsuite calendar](https://help.hootsuite.com/hc/de/articles/1260804306069-Create-and-schedule-content-in-a-calendar). 이는 시장 UX 참고이며 현행 기능 증거가 아니다. BM은 외부 가격조사 없는 **가설**이다.

## 명시 결정: 7 현행 카드에서 11 출력 카드로의 additive migration

현행 Studio visual **7**(Threads/X/Facebook/Instagram/Shorts/Reels/TikTok)과 direct publish **4**(Threads/X/Facebook/Instagram)는 보존 baseline이다. target UI는 text **8** + video **3** 출력 카드 총 11개다. Discord·Slack은 현행 Studio card **0**이며 target text output card로 **추가**한다. extension 15나 adapter 존재는 capability가 아니다.

| 출력 카드 11 | 종류 | v5.0 대비 | 현행 baseline/소유 |
|---|---|---|---|
| Threads, X, Facebook, Instagram | text 4 | 보존 | visual7, direct4 |
| Telegram, Discord, Slack, LINE | text 4 | additive (Discord/Slack card0 포함) | messaging config-only |
| YouTube Shorts, Instagram Reels, TikTok | video 3 | explicit target | visual7 영상 3, `/videos` 소유 |

각 카드 capability 7 필드는 `output_kind`, `auth_mode`, `account_selectable`, `compose_validate`, `publish_now`, `schedule`, `readback_recover`다. UI는 false를 발행 가능처럼 보이지 않게 disabled/external/hand-off로 표기한다. 텍스트 8은 Studio에서 생성하되 true capability만 publish/schedule CTA를 가진다. video3의 발행·조회는 `/videos` capability가 소유하며 Studio는 hand-off 결과만 보인다.

## 25 route·26 sidebar 보존 매트릭스

표기: P 보존, F 흐름 연결, D disabled, E external, O operator. 모든 라우트는 1024·390에서 shell, loading/empty/error/permission, label-route-action delta를 검증한다. **AC 공통:** sidebar 26은 desktop 유지, 390 대체 nav·44px touch target·focus visible·overflow 0, 죽은 CTA/dead-end 0; `/services`는 terminal state까지 관찰한다.

| # | route | owner | current actions/API | P/F/D/E/O | v5 delta |
|---:|---|---|---|---|---|
|1|`/`|customer|metrics/activity|F|최근 작업 permalink/recover|
|2|`/login`|auth|Google auth|P|permission/return label|
|3|`/signup`|auth|login redirect|P|dead-end 없음|
|4|`/studio`|customer|draft/text/publish|F|11 cards/job bridge|
|5|`/inbox`|customer|queue draft approve/delete|F|legacy/job origin label|
|6|`/calendar`|customer|queue all/month|F|job schedule/recover link|
|7|`/channels/[channel]`|customer|provider variants|F|capability/status diff0|
|8|`/videos`|customer|generate/upload/publish|F|3 video hand-off/result|
|9|`/images`|customer|images CRUD|P|empty/error|
|10|`/blog`|customer|blog queue|P|separate authority|
|11|`/blog-performance`|customer|blog stats|P|loading/error|
|12|`/search-console`|customer|GSC analytics|P|390 overflow0|
|13|`/keyword-planner`|customer|research/bank|P|state labels|
|14|`/google-analytics`|customer|unavailable|D|disabled, no data claim|
|15|`/naver-trends`|customer|unavailable|D|disabled, no CTA|
|16|`/search-advisor`|customer|unavailable|D|disabled, no CTA|
|17|`/google-trends`|customer|external link|E|external destination label|
|18|`/performance`|customer|redirect|P|`/` compatibility|
|19|`/services`|customer|tenants switch/create|P|terminal load/error/permission|
|20|`/settings`|customer|8 tabs/connect|F|account SSOT/recovery|
|21|`/operator`|operator|token validation|O|customer shell never mounts|
|22|`/operator/customers`|operator|customer/OAuth admin|O|timed reveal/audit only|
|23|`/privacy`|legal|static|P|reachable/focus|
|24|`/terms`|legal|static|P|reachable/focus|
|25|`/data-deletion`|legal|static|P|reachable/focus|

Landing copy는 11 cards/15 extensions/API count를 “현재 발행 가능”으로 주장하지 않는 별도 copy audit 대상이다.

## Canonical account SSOT·상태기계

`account_id, workspace_id, provider, provider_account_id, display_name, auth_mode, capability_snapshot(version 포함), connection_state, state_reason, credential_ref, verified_at, created_at, updated_at`가 canonical account record다. 비밀 원문은 record/UI/audit에 없다. 상태는 `connecting → verifying → connected | reconnect_required | failed | disconnected`만 허용한다.

OAuth callback은 transaction으로 state/credential reference/account identity를 원자 저장하고, commit 뒤 canonical readback이 같은 workspace/provider/account인지 확인할 때만 connected를 보여준다. replay는 nonce+state 단회 소비, cancel은 disconnected/기존 connected 유지 정책을 명시, mismatch는 reconnect_required다. Settings·Studio·channel은 동일 read model로 **account/status/capability diff=0**을 만족한다. Meta wrong-session은 억지 계정선택을 약속하지 않고, 표시된 provider identity·재로그인/권한해제 안내·재인증 결과를 보인다. manual token은 advanced recovery로만 노출되고 OAuth와 같은 정본처럼 보이지 않는다.

## Workflow, provenance, schedule

invariants: `workspace_id` 불변, `source_draft_id` 불변, card는 `account_id+capability_version` 고정, job은 `intent_key` 단일, provider external call은 job attempt로 추적, success는 provider ID/permalink readback 또는 명시적 pending reconciliation뿐이다. job 상태는 draft→validated→queued/scheduled→dispatching→published|failed|uncertain|cancelled; repair/reconcile는 새 외부 post 전에 동일 intent를 provider/ledger로 조회한다.

queue-job bridge는 `workspace_id, source_draft_id, card_id, job_id, intent_key, queue_item_id?, schedule_id?, authority, origin, version, updated_at`를 가진다. 새 job이 완료 진실이고 legacy queue는 참조 projection이다. orphan은 source/job 없는 projection, missing은 projection 없는 job, stale은 version/updated_at 불일치로 표기·reconcile 큐에 넣으며 자동 성공 처리하지 않는다.

예약은 create/change/cancel/due 전부 intent/version을 검사한다. timezone/DST는 IANA timezone+instant를 함께 저장하고 nonexistent/ambiguous local time을 사용자가 확인한다. credential revoke는 dispatch 중단·reconnect_required, due race는 compare-and-set lease로 1회만 dispatch한다. 같은 intent의 concurrency 20 요청은 외부 call **≤1**이어야 한다.

## MVP·비목표·사업 판단

MVP은 SSOT 계정, 11 card UI/capability, 연결된 지원 provider의 draft→edit→per-card/bulk now/schedule→Inbox/Calendar→permalink/recovery, bridge reconcile, 1024/390 접근성이다. 비목표는 15 extension 전부 발행, disabled data route 활성화, provider가 지원하지 않는 계정선택, blog/video queue 강제 통합, 운영자 대리발행이다.

**7 planning 원칙:** One Thing 우선, 현행 surface 보존, capability truth, tenant/security first, 단일 provenance, failure-first recovery, evidence-gated rollout. Steelman: “지금은 Studio 단순화가 더 낫다”—맞다. 11 cards가 카드 수만 늘리고 연결 계정/실발행 성공을 늘리지 못하면 4 direct 지원만 명료화하는 편이 낫다. Pre-mortem: OAuth wrong-session, queue/job 이중정본, provider timeout 중복발행, 모바일 dead-end, 비디오 capability 과장으로 실패한다. 자기잠식: 비디오/블로그 독립 workspace를 Studio가 흡수하면 각각의 검증·BM 가치가 약해진다. 그래서 bridge/hand-off만 한다.

BM 가설: workspace 구독 + 연결계정/AI·video 사용량 tier. 가격·수요·마진은 조사되지 않아 수치 결정을 금지한다. 2주 제한 cohort appetite: 연결 완료율, 첫 workflow 완료율, recovery 성공률, 지원 티켓/고객을 관찰한다. circuit breaker: cross-tenant/secret 노출 1건, idempotency 위반 1건, provider 성공 미확정 중복 의심, 390 핵심 dead-end, 또는 2주 성공률 90% 미만이면 cohort 확장 중지·flag off·원인분석한다.

## FR/AC/TC 1:1 추적표

각 TC는 아래 압축 행을 그대로 두 개의 시나리오로 실행한다: **H(Given 정상 입력 / When 동작 / Then 성공 종료증거)** 와 **F(Given 행에 적힌 fault·경계 입력 / When 같은 동작 / Then 안전한 실패·복구 종료증거)**. 따라서 모든 ID는 Given/When/Then, happy+failure/edge, 입력·상태·external call count·종료증거를 갖는다. `C=n`은 두 시나리오 합산이 아니라 **각 요청/intent의 external provider call 상한**이다.

**TC 정식 ID:** MH-V51-TC-001, MH-V51-TC-002, MH-V51-TC-003, MH-V51-TC-004, MH-V51-TC-005, MH-V51-TC-006, MH-V51-TC-007, MH-V51-TC-008, MH-V51-TC-009, MH-V51-TC-010, MH-V51-TC-011, MH-V51-TC-012, MH-V51-TC-013, MH-V51-TC-014, MH-V51-TC-015, MH-V51-TC-016, MH-V51-TC-017, MH-V51-TC-018, MH-V51-TC-019, MH-V51-TC-020, MH-V51-TC-021, MH-V51-TC-022, MH-V51-TC-023, MH-V51-TC-024, MH-V51-TC-025, MH-V51-TC-026, MH-V51-TC-027, MH-V51-TC-028, MH-V51-TC-029, MH-V51-TC-030, MH-V51-TC-031, MH-V51-TC-032, MH-V51-TC-033, MH-V51-TC-034, MH-V51-TC-035, MH-V51-TC-036, MH-V51-TC-037, MH-V51-TC-038, MH-V51-TC-039, MH-V51-TC-040, MH-V51-TC-041, MH-V51-TC-042, MH-V51-TC-043, MH-V51-TC-044, MH-V51-TC-045, MH-V51-TC-046, MH-V51-TC-047, MH-V51-TC-048. 표의 `TC-002` 같은 축약은 이 정식 ID의 같은 숫자를 가리킨다.

| FR ID · requirement | AC ID · acceptance | TC ID · Given / When / Then (input; state; C; 종료증거) |
|---|---|---|
|FR-MH-001 tenant isolation|AC-MH-001 A/B 0 leak|MH-V51-TC-001 Given A/B When A job GET Then A만; A id/B id; connected; C=0; API+DOM 0 leak|
|FR-MH-002 role shell|AC-MH-002 shell 분리|TC-002 Given customer/operator When route Then menu 분리; role; ready; C=0; snapshots|
|FR-MH-003 account fields|AC-MH-003 canonical 필드 완전|TC-003 Given connect When persist Then required fields; account; verifying; C=1; DB schema evidence|
|FR-MH-004 state machine|AC-MH-004 허용 전이만|TC-004 Given connecting When verify Then connected/fail only; callback; C=1; transition log|
|FR-MH-005 callback atomic|AC-MH-005 partial 없음|TC-005 Given save fail When callback Then no success; fault; failed; C=1; rollback/readback|
|FR-MH-006 three-surface SSOT|AC-MH-006 diff0|TC-006 Given account When 3 views Then same fields; account; connected; C=0; diff report|
|FR-MH-007 Meta wrong session|AC-MH-007 identity 안내|TC-007 Given old Meta When connect Then displayed identity/relogin; session; reconnect_required; C=1; UI evidence|
|FR-MH-008 replay/cancel|AC-MH-008 nonce 단회|TC-008 Given callback twice/cancel When submit Then reject/retain; nonce; disconnected; C≤1; audit|
|FR-MH-009 two accounts|AC-MH-009 selectable true만|TC-009 Given 2 accounts When choose Then selected card only; account; connected; C=0; card proof|
|FR-MH-010 manual recovery|AC-MH-010 advanced 구분|TC-010 Given manual token When save Then OAuth와 분리; token ref; verifying; C=1; masked UI|
|FR-MH-011 target 11|AC-MH-011 8+3 named|TC-011 Given Studio When render Then 11 manifest; none; draft; C=0; inventory|
|FR-MH-012 baseline7/direct4|AC-MH-012 보존/분리|TC-012 Given current cards When migrate Then 7+direct4 labels; fixture; ready; C=0; snapshot|
|FR-MH-013 Discord/Slack additive|AC-MH-013 card0→target|TC-013 Given target When render Then Discord/Slack text; manifest; draft; C=0; card proof|
|FR-MH-014 capability7|AC-MH-014 false CTA 없음|TC-014 Given false capability When view Then disabled/hand-off; fields; ready; C=0; DOM|
|FR-MH-015 source draft|AC-MH-015 reload 보존|TC-015 Given text When save/reload Then source same; draft; draft; C=0; DB+UI|
|FR-MH-016 per-card edit|AC-MH-016 isolation|TC-016 Given two cards When edit one Then other unchanged; text; draft; C=0; diff|
|FR-MH-017 validation|AC-MH-017 invalid만 차단|TC-017 Given mixed limits When validate Then one error; cards; validated; C=0; result|
|FR-MH-018 per-card now|AC-MH-018 job 기록|TC-018 Given eligible card When now Then job ID; card; dispatching; C=1; ledger|
|FR-MH-019 bulk now|AC-MH-019 독립 결과|TC-019 Given 3 cards/1 fail When bulk Then 3 results; cards; mixed; C=3; result list|
|FR-MH-020 idempotency|AC-MH-020 20≤1|TC-020 Given 20 same intent When parallel Then C≤1; intent; dispatching; C≤1; provider log|
|FR-MH-021 502|AC-MH-021 failed/retry|TC-021 Given 502 When publish Then no success; response; failed; C=1; error/retry|
|FR-MH-022 timeout|AC-MH-022 uncertain|TC-022 Given timeout When publish Then uncertain; timeout; uncertain; C=1; reconcile CTA|
|FR-MH-023 repair|AC-MH-023 lookup first|TC-023 Given uncertain When repair Then provider lookup before post; intent; reconciling; C≤1; call trace|
|FR-MH-024 permalink|AC-MH-024 success proof|TC-024 Given provider ID When readback Then permalink stored; id; published; C=2; link evidence|
|FR-MH-025 failure recovery|AC-MH-025 failed card만|TC-025 Given partial fail When retry Then failed only; job; failed; C=1; ledger|
|FR-MH-026 provenance|AC-MH-026 invariant 유지|TC-026 Given source/card/job When mutate Then IDs fixed; ids; any; C=0; invariant audit|
|FR-MH-027 bridge authority|AC-MH-027 job canonical|TC-027 Given job/queue When conflict Then job wins label; keys; stale; C=0; UI/audit|
|FR-MH-028 orphan/missing/stale|AC-MH-028 visible reconcile|TC-028 Given 3 defects When open Then distinct states; fixtures; reconcile; C=0; report|
|FR-MH-029 schedule create|AC-MH-029 timezone valid|TC-029 Given IANA/date When create Then schedule; time; scheduled; C=0; stored instant|
|FR-MH-030 schedule change|AC-MH-030 version CAS|TC-030 Given v1 When change v2 Then old due ignored; versions; scheduled; C=0; audit|
|FR-MH-031 schedule cancel|AC-MH-031 no dispatch|TC-031 Given scheduled When cancel Then cancelled; job; cancelled; C=0; due proof|
|FR-MH-032 DST|AC-MH-032 ambiguity confirmation|TC-032 Given DST gap/fold When schedule Then choice/error; local time; draft; C=0; UI|
|FR-MH-033 due race|AC-MH-033 one lease|TC-033 Given two workers When due Then C≤1; job; dispatching; C≤1; lease log|
|FR-MH-034 revoke|AC-MH-034 dispatch block|TC-034 Given revoke When due Then reconnect; account; reconnect_required; C=0; state proof|
|FR-MH-035 Inbox bridge|AC-MH-035 origin label|TC-035 Given legacy/job When Inbox Then labels distinct; items; ready; C=0; screenshot|
|FR-MH-036 Calendar bridge|AC-MH-036 recover link|TC-036 Given scheduled job When Calendar Then link works; job; scheduled; C=0; navigation|
|FR-MH-037 video handoff|AC-MH-037 no fake publish|TC-037 Given video card When action Then `/videos`; card; handoff; C=0; route proof|
|FR-MH-038 disabled/external|AC-MH-038 truthful labels|TC-038 Given 4 routes When open Then disabled/external; route; ready; C=0; copy audit|
|FR-MH-039 landing audit|AC-MH-039 no overclaim|TC-039 Given landing copy When scan Then capability-aligned; strings; ready; C=0; audit diff|
|FR-MH-040 route 25|AC-MH-040 owner/action API|TC-040 Given matrix When smoke Then 25 route deltas; routes; any; C=0; manifest|
|FR-MH-041 sidebar26|AC-MH-041 all reachable|TC-041 Given 1024 When tab/click Then 26 paths; nav; ready; C=0; route log|
|FR-MH-042 mobile nav|AC-MH-042 390 usable|TC-042 Given 390 When navigate Then replacement nav; viewport; ready; C=0; tap video|
|FR-MH-043 overflow/accessibility|AC-MH-043 0/44/focus|TC-043 Given 390 When inspect Then overflow0+44+focus; viewport; ready; C=0; measurements|
|FR-MH-044 terminal states|AC-MH-044 L/E/E/P|TC-044 Given API variants When each route Then states/CTA; fixtures; any; C=0; 25-route report|
|FR-MH-045 services terminal|AC-MH-045 no endless load|TC-045 Given tenants loading/error When settle Then terminal; API; error/empty; C=0; screenshot|
|FR-MH-046 operator audit|AC-MH-046 timed secret|TC-046 Given operator When reveal Then timed/masked audit; role; ready; C=0; audit log|
|FR-MH-047 observability|AC-MH-047 correlation|TC-047 Given provider error When inspect Then correlation fields; error; failed; C=1; trace|
|FR-MH-048 E2E gate|AC-MH-048 happy+edge|TC-048 Given cohort When full flow Then evidence; all; terminal; C per case; signed QA record|

## Release evidence

fixture → one internal workspace → limited cohort → capability expansion 순서다. 각 단계에서 실제 supported account로 connect(정체성 확인)→draft→edit→per-card/bulk now/schedule→Inbox/Calendar→permalink/repair를 직접 관찰한다. 502/timeout/revoke/DST/race는 fixture와 staging에서 먼저 증명한다. 이 PRD는 DB/API 설계를 확정하지 않으며 그 선택은 eng-design 대화 게이트에서 한다.

## Self-redteam

7 visual=7 publish, extension=capability, callback success=connected, queue view=job SSOT, retry=안전한 재발행이라는 다섯 오해를 명시적으로 배제했다. 가장 강한 반론은 “11 output이 고객가치를 증명하기 전에 복잡성만 만든다”이며, 2주 appetite/circuit breaker가 이를 검증한다.
