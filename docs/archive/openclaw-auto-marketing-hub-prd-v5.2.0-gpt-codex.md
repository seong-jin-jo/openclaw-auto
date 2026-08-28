# Marketing Hub PRD v5.2.0 — final retake

> 2026-08-06 · model: gpt-codex/gpt-5.6-sol · 기반: v5.1, UI audit, surface map, `~/.claude/standards/planning.md` 직접 열람 · 계획 산출물, 구현/배포 증명 아님.

## One Thing·결정·경계

고객이 하나의 원본에서 연결된 자기 계정의 **text 8 + video 3 = output UI 11** 카드를 편집하고 즉시/예약 발행한 뒤 permalink 또는 안전한 복구를 같은 카드에서 확인한다. 현행 visual7(Threads/X/Facebook/Instagram/Shorts/Reels/TikTok)과 direct4(Threads/X/Facebook/Instagram)는 보존 baseline이며 target은 additive다: text=`Threads,X,Facebook,Instagram,Telegram,Discord,Slack,LINE`, video=`YouTube Shorts,Instagram Reels,TikTok`. Discord/Slack 현행 card0도 target text card로 추가한다. 카드 capability 7 fields는 `output_kind,auth_mode,account_selectable,compose_validate,publish_now,schedule,readback_recover`; false는 disabled/external/hand-off로 표시한다. extension15/API/landing copy는 capability 주장 근거가 아니다.

고객은 자기 workspace만 보고 운영자는 지원·timed secret reveal/audit만 한다(대리발행 금지). 공식 비교 근거: [Buffer](https://support.buffer.com/article/642-scheduling-posts), [Later](https://help.later.com/hc/en-us/articles/360044369654-Create-Manage-Social-Sets), [Hootsuite](https://help.hootsuite.com/hc/de/articles/1260804306069-Create-and-schedule-content-in-a-calendar). BM은 가격조사 없는 **가설**이다.

## Account SSOT·workflow invariants

Canonical account=`account_id,workspace_id,provider,provider_account_id,display_name,auth_mode,capability_snapshot(version),connection_state,state_reason,credential_ref,verified_at,created_at,updated_at`. 상태는 `connecting→verifying→connected|reconnect_required|failed|disconnected`만 허용한다. callback은 nonce/state 단회 소비 후 credential ref+identity+state를 atomic save하고 canonical readback이 같은 workspace/provider/account일 때만 connected다. Settings/Studio/channel의 account/status/capability diff=0이며 manual token은 advanced recovery다.

Wrong session은 A가 아닌 target B를 보장하지 못하는 provider 경계를 숨기지 않는다: 기존 Meta A를 표시하고 reauth/권한해제 안내→B callback→canonical B readback→세 화면 B→B adapter만 1 call/A=0을 release evidence로 요구한다. 두 계정은 account_selectable=true일 때만 선택한다.

Provenance origin은 정확히 `legacy_bulk`, `card_publish`, `card_schedule`, `bulk_schedule` 네 값이다. `workspace_id/source_draft_id/card_id/account_id/capability_version/intent_key`는 불변; job이 완료 authority, queue는 projection이다. orphan/missing/stale은 reconcile 대상으로 표시한다. 502 **pre-dispatch**는 `failed_confirmed` 후 retry 가능; unknown은 `uncertain`+reconcile first+adapter0; provider success/persistence fail은 `repair_required`+adapter0이다. repair/reconcile는 새 post 전 ledger/provider lookup을 한다. 동일 intent concurrency20은 external call≤1이다. schedule create/change/cancel/due는 version/CAS lease, IANA instant+timezone, DST gap/fold 확인, revoke block, due race≤1을 요구한다.

## 25 route·26 sidebar / mobile acceptance

25 routes(`/`,login,signup,studio,inbox,calendar,channels,videos,images,blog,blog-performance,search-console,keyword-planner,google-analytics,naver-trends,search-advisor,google-trends,performance,services,settings,operator,operator/customers,privacy,terms,data-deletion)은 v5.1의 owner/current-action/API/PFDEO matrix를 그대로 보존한다. `/studio`=11 card/job bridge, Inbox/Calendar=legacy queue label+job reference, `/videos`=video3 hand-off, data3=disabled, Trends=external, operator2=role-only, `/services`=tenant terminal state다.

1024에서 sidebar destination **26/26**을 click과 keyboard로 route log에 남긴다. 390에서 alternate navigation으로 destination **26/26** click+keyboard, 25/25 route의 `scrollWidth-clientWidth=0` 측정, 모든 interactive target≥44px, focus visible, label-route-action 일치, dead-end CTA=0, loading/empty/error/permission terminal state를 요구한다. `/services`는 loading 무한이 아닌 ready/empty/error/permission 중 terminal evidence가 있어야 한다.

## standards/planning.md §2 exact 7 principles

|#|원칙|판정 질문|PASS/FAIL|v5.2 증거|
|---:|---|---|---|---|
|1|용어 통일|'정보'·'관리' 같은 추상어가 하나의 정의로 고정됐나|PASS|account/job/queue/card origin 정의 고정|
|2|구체화|개수·한도가 숫자로 박혔나 (해시태그 N개, 목록 M행)|PASS|11/8/3/7/4/25/26/20/44/390/2주|
|3|입출력 분리|입력=실질 데이터 / 출력=엔드유저 관점으로 나눠 썼나|PASS|canonical input→card/result/permalink output|
|4|정합성|기능 간 서술이 앞뒤 모순 없나 (교차 확인 했나)|PASS|FR/AC/TC/QA 48 1:1|
|5|정책 상세|경계 케이스 명시했나 (임시저장 글이 목록에 뜨나?)|PASS|502/unknown/revoke/DST/replay/queue drift|
|6|추출 철저|유저플로우 각 스텝에 대응 기능이 있나 (빠짐 0)|PASS|connect→draft→edit→now/schedule→Inbox/Calendar→recover|
|7|논리 영역|감상·희망 표현("좋은 UX", "편리하게")이 판정 가능 문장으로 바뀌었나|PASS|call cap, diff0, 44px, overflow0, terminal evidence|

Steelman: 11 cards는 고객이 연결·발행하기 전부터 선택피로와 QA 비용만 키울 수 있다. 그 경우 지원된 direct4를 더 명료하게 만드는 편이 높은 신뢰를 만든다; 그래서 cohort가 output 수가 아니라 완결 workflow로 가치를 증명할 때만 확대한다.

Premortem: 2주 뒤 고객이 Meta A 세션 때문에 B 브랜드에 잘못 발행했다고 신고하면, callback 성공 문구와 canonical B 검증 사이의 빈틈이 원인이다. 즉시 B adapter call=1/A=0 증거가 없는 연결은 cohort에서 막고 reconnect_required로 돌린다. 또 502 뒤 사용자가 Retry를 눌러 두 번 게시됐다면 pre-dispatch와 unknown을 한 상태로 뭉갠 설계가 원인이다; uncertain은 adapter0 reconcile-first, confirmed failure만 retry로 분리한다.

자기잠식: Romeo/Dark-Cupid/Yeon/OKgram/Polyamory의 관계·커뮤니티별 운영 맥락을 범용 카드가 대체한다고 말하면 각 벤처의 차별화된 콘텐츠 운영가치를 깎는다. 교육 사업도 교육 커리큘럼·강사 신뢰를 단순 자동발행 기능에 종속시키면 전환 논리가 약해진다; Marketing Hub는 공통 배포 인프라와 provenance만 제공하고 각 사업의 브랜드/교육 surface를 흡수하지 않는다.

2-week appetite는 제한 cohort에서 14일 동안 `연결 시작 대비 canonical connected≥70%`, `connected 고객 대비 첫 end-to-end workflow≥50%`, `failed/uncertain 카드의 recovery terminalisation≥90%`, `잘못된 계정/중복 외부발행=0`을 관찰한다. circuit breaker는 cross-tenant 또는 secret 노출 1건, A가 아닌 계정 adapter call 1건, 동일 intent external call>1 1건, 390 dead-end 1건, 또는 day14 지표 하나라도 미달이면 즉시 신규 cohort/유료 확장 flag off, 원인분석·수정·재검증 전 재개0이다.

## FR / AC / TC one-to-one

각 행은 독립 ID이며 **H/F 모두 Given/When/Then, fault, external-call cap(C), terminal evidence**를 가진다. QA tracker는 FR과 AC를 별도 열로 같은 번호에 연결한다.

|FR|AC|TC — H / F|
|---|---|---|
|FR-MH-001 tenant isolation|AC-MH-001 A/B leak0|MH-V52-TC-001 H: Given A job When GET Then A만(C0) API+DOM; F: Given B id When A GET Then 403/leak0(C0) audit|
|FR-MH-002 role shell|AC-MH-002 shell split|MH-V52-TC-002 H customer route→customer shell(C0)snapshot; F operator menu on customer→absent(C0)route log|
|FR-MH-003 canonical fields|AC-MH-003 all fields|MH-V52-TC-003 H connect→record fields(C1)readback; F missing workspace→failed(C0)no row|
|FR-MH-004 state machine|AC-MH-004 valid transitions|MH-V52-TC-004 H connecting verify→connected(C1)log; F illegal transition→reject(C0)audit|
|FR-MH-005 atomic callback|AC-MH-005 partial0|MH-V52-TC-005 H callback save/readback→connected(C1)row; F save fault→failed(C1)rollback|
|FR-MH-006 SSOT diff0|AC-MH-006 3 surface equal|MH-V52-TC-006 H B read→three B(C0)diff0; F stale view→refresh(C0)diff0|
|FR-MH-007 wrong session|AC-MH-007 A→B exact|MH-V52-TC-007 H Given Meta A,target B When reauth callback Then canonical B/Settings-Studio-channel B/publish B(C1) A0; F cancel/mismatch→reconnect_required(C0)proof|
|FR-MH-008 replay cancel|AC-MH-008 nonce once|MH-V52-TC-008 H callback once→connected(C1)audit; F replay/cancel→reject/retain(C0)nonce log|
|FR-MH-009 two accounts|AC-MH-009 select exact|MH-V52-TC-009 H A/B select B→B card(C0)proof; F select false capability→disabled(C0)DOM|
|FR-MH-010 manual recovery|AC-MH-010 advanced only|MH-V52-TC-010 H manual save→verifying(C1)masked; F bad token→failed(C1)no raw|
|FR-MH-011 target11|AC-MH-011 8+3 names|MH-V52-TC-011 H render→11 named(C0)manifest; F missing name→build fail(C0)inventory|
|FR-MH-012 baseline|AC-MH-012 visual7/direct4|MH-V52-TC-012 H migrate→7/4 labels(C0)snapshot; F unsupported publish→no CTA(C0)DOM|
|FR-MH-013 additive DS|AC-MH-013 DS card|MH-V52-TC-013 H Discord/Slack render(C0)cards; F unconnected→disabled(C0)label|
|FR-MH-014 capability7|AC-MH-014 truthful CTA|MH-V52-TC-014 H true→action(C0)UI; F false→disabled/hand-off(C0)DOM|
|FR-MH-015 draft persist|AC-MH-015 reload equal|MH-V52-TC-015 H save/reload→same(C0)DB; F empty→validation(C0)error|
|FR-MH-016 card edit|AC-MH-016 isolated|MH-V52-TC-016 H edit B→B only(C0)diff; F stale edit→conflict(C0)terminal|
|FR-MH-017 validate|AC-MH-017 per card|MH-V52-TC-017 H valid→validated(C0)result; F overlimit→that card blocked(C0)error|
|FR-MH-018 card now|AC-MH-018 job|MH-V52-TC-018 H eligible→job(C1)ledger; F unready→no job(C0)disabled|
|FR-MH-019 bulk now|AC-MH-019 independent|MH-V52-TC-019 H 3→3 results(C3)list; F one fail→others terminal(C3)trace|
|FR-MH-020 idem20|AC-MH-020 C≤1|MH-V52-TC-020 H 20 same→one post(C≤1)log; F replay→same result(C0)ledger|
|FR-MH-021 502 confirmed|AC-MH-021 retry only confirmed|MH-V52-TC-021 H pre-dispatch502→failed_confirmed/retry(C1)trace; F retry before confirmed→adapter0(C0)state|
|FR-MH-022 unknown|AC-MH-022 uncertain reconcile|TC-022 H timeout→uncertain(C1)CTA; F retry unknown→reconcile/adapter0(C0)trace|
|FR-MH-023 repair|AC-MH-023 repair_required|TC-023 H provider success+DB fail→repair_required(C1)ledger; F repair→adapter0(C0)persist proof|
|FR-MH-024 permalink|AC-MH-024 readback|TC-024 H id readback→permalink(C2)link; F no link→not published(C1)terminal|
|FR-MH-025 recovery|AC-MH-025 failed only|TC-025 H confirmed fail retry→one(C1)ledger; F success retry→adapter0(C0)duplicate0|
|FR-MH-026 provenance|AC-MH-026 four origins|TC-026 H each action→exact origin(C0)audit; F other origin→reject(C0)invariant|
|FR-MH-027 bridge authority|AC-MH-027 job wins|TC-027 H conflict→job label(C0)UI; F orphan→reconcile(C0)report|
|FR-MH-028 drift|AC-MH-028 states visible|TC-028 H missing/stale→named(C0)report; F auto-success→prohibited(C0)audit|
|FR-MH-029 schedule create|AC-MH-029 instant|TC-029 H future→scheduled(C0)instant; F past→reject(C0)error|
|FR-MH-030 change|AC-MH-030 CAS|TC-030 H v1→v2(C0)audit; F v1 due→ignored(C0)log|
|FR-MH-031 cancel|AC-MH-031 no due|TC-031 H cancel→cancelled(C0)proof; F due after cancel→adapter0(C0)trace|
|FR-MH-032 DST|AC-MH-032 confirm|TC-032 H valid zone→instant(C0)store; F gap/fold→confirm/reject(C0)UI|
|FR-MH-033 due race|AC-MH-033 lease1|TC-033 H two workers→one(C≤1)lease; F lease loss→adapter0(C0)trace|
|FR-MH-034 revoke|AC-MH-034 block|TC-034 H revoke→reconnect_required(C0)state; F due→adapter0(C0)proof|
|FR-MH-035 Inbox|AC-MH-035 origin label|TC-035 H job/legacy→labels(C0)UI; F missing job→reconcile(C0)link|
|FR-MH-036 Calendar|AC-MH-036 bridge|TC-036 H scheduled→recover link(C0)nav; F stale→warning(C0)terminal|
|FR-MH-037 video|AC-MH-037 hand-off|TC-037 H video→videos(C0)route; F unsupported→no publish(C0)DOM|
|FR-MH-038 D/E|AC-MH-038 truthful|TC-038 H route→D/E label(C0)copy; F CTA→none(C0)DOM|
|FR-MH-039 landing|AC-MH-039 no overclaim|TC-039 H copy scan→aligned(C0)audit; F claim unsupported→fail(C0)diff|
|FR-MH-040 route25|AC-MH-040 matrix|TC-040 H 25 smoke→owner/action(C0)manifest; F delta missing→fail(C0)report|
|FR-MH-041 sidebar26|AC-MH-041 click/key|TC-041 H 1024 26/26 click+key(C0)logs; F destination fail→deadend(C0)report|
|FR-MH-042 mobile26|AC-MH-042 click/key|TC-042 H 390 26/26 click+key(C0)logs; F hidden nav→fail(C0)video|
|FR-MH-043 overflow/access|AC-MH-043 25/25 zero|TC-043 H 390 25/25 overflow0+44+focus(C0)measure; F overflow/deadend→fail(C0)report|
|FR-MH-044 terminal states|AC-MH-044 L/E/E/P|TC-044 H each fixture→terminal(C0)25 report; F endless load→fail(C0)screen|
|FR-MH-045 services|AC-MH-045 terminal|TC-045 H tenants resolve→ready(C0)screen; F error/empty/permission→terminal(C0)proof|
|FR-MH-046 operator audit|AC-MH-046 timed|TC-046 H reveal→masked/audit(C0)log; F customer reveal→403(C0)proof|
|FR-MH-047 observability|AC-MH-047 correlation|TC-047 H error→correlation(C1)trace; F absent ID→fail(C1)log|
|FR-MH-048 E2E|AC-MH-048 gate|TC-048 H full workflow→signed evidence(C per card); F edge suite fail→release blocked(C0)record|

## Rollout

fixture→one internal account→limited cohort→capability expansion. MVP은 SSOT, target11, supported workflow, bridge/recovery, 1024/390; 비목표는 extension15 전부 지원·data disabled 해제·blog/video 강제 통합·운영자 대리발행이다. DB/API/스키마 확정은 eng-design 선택지 합의 전까지 하지 않는다.
