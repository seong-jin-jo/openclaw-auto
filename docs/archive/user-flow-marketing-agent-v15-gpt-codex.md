# OSMU Marketing Agent user flow v15

> STAMP: created_at=2026-08-06 07:02 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=brand-positioning-kit, design-review method | evidence=approved PRD v6.1.1 and current owner routes | deliberation=proof의 한 줄을 모든 상태에서 dead-end 없이 닫되 D3은 제외했다

## Scope lock

P39 proof: `fact1 → opportunity1 → weekly plan1 → Threads card1 → per-post approval → real publish/permalink → native metric or sample-hold → insight/hold → experiment approve/hold → next plan`.

R6 preservation: current routes, actions, API/state semantics, shell, tokens, provider differences, Studio existing9, text8/video3 inventory truth.

D3: 이 문서에 없음.

## Entry and role flow

1. Public visitor enters `/` without token.
   - Happy: AuthGate shows current landing and `/login` CTA.
   - Error: login provider failure returns a terminal error and retry.
   - Dead-end prevention: `/operator` remains separate.
2. Customer authenticates.
   - Loading: `계정 상태 확인 중`.
   - Access paused/account unavailable/service error: existing GateBlockScreen with refresh and logout.
   - Happy: customer shell, workspace identity, 26 destinations.
3. Operator authenticates.
   - Happy: Admin shell and customer management only.
   - Permission edge: customer Marketing Agent loop is not mounted.

## Happy path

1. Customer opens `/`.
   - Command Center shows one decision: `이번 주 Threads 기회 검토`.
   - Evidence strip shows source, collected time, scope, confidence.
2. Customer opens evidence.
   - Deep-link goes to `/channels/threads` Popular or owned metric owner.
   - Back returns with selected opportunity context.
3. Customer selects opportunity1.
   - Agent proposes one 7-day plan with goal, audience, offer, desired action, constraint, channel, window.
4. Customer approves Weekly Plan1.
   - Incomplete field blocks approval and focuses the missing field.
   - Approved plan gets an immutable version marker.
5. `Threads 초안 만들기` deep-links to `/studio` with plan context.
   - Current Studio toolbar and history remain.
   - Card1 generation/edit/save makes provider adapter calls 0.
6. Customer opens Threads preview and edits only that card.
   - Sibling previews, source, history and existing selections remain unchanged.
7. `검수로 보내기` deep-links to `/inbox`.
   - Review shows fact citations, selected Threads account, capability, publish timing and preview.
8. Customer approves the post.
   - Account/content/time/channel hash is recorded.
   - Any later change invalidates approval.
9. Customer chooses immediate publish or schedule.
   - Immediate uses current Studio publish owner.
   - Schedule uses current SchedulePanel and `/calendar` projection.
10. Publishing finishes.
    - Published is shown only with external ID or permalink.
    - Customer opens the provider permalink.
11. Measure loads native Threads metric.
    - Shows native name, definition, source and collected_at.
    - If sample is insufficient, flow takes sample-hold instead of inventing a conclusion.
12. Learn proposes one insight or explicit hold.
    - Evidence and limitation remain visible.
13. Act proposes one-variable experiment.
    - Customer chooses Approve or Hold.
14. Approved experiment links into next Weekly Plan.
    - Loop closure shows bidirectional links and no orphan.

## Edge paths

### Fact and source

- Empty: no confirmed fact. CTA goes to current Studio brand/wiki setup.
- Unverified: inference or unverified claim is visible but cannot be used for publishable copy.
- Stale: source timestamp exceeds policy. Refresh required before plan approval.
- 403/404/rate limit/bad ref/no Markdown/decrypt/network/secret-key: distinct reason and owner action. Secret original is never rendered.
- GitHub unavailable: current paste path may be selected only if it is the approved source1. No new source4 editor is designed.

### Opportunity and plan

- Empty: source healthy but no relevant signal. Explicit `이번 주 기회 없음` and next collection time.
- Error: Threads Popular unavailable. Choose the one approved owned metric source or hold.
- Low confidence: opportunity cannot top-rank without evidence.
- Missing brief field: approval disabled, exact field highlighted.
- More than one campaign: proof blocks and requests reduction to campaign1.

### Account connection and capability

- No account: Review links to `/channels/threads` or Settings connection owner.
- Wrong provider session: target handle readback mismatch. Connected state is not shown; reconnect required.
- OAuth callback cancelled: prior canonical state remains, publish CTA disabled.
- Callback says success but surface state differs: refresh/reconnect required, false connected 0.
- Manual token: lives under Advanced recovery, masked, never a peer primary source.
- Multiple accounts: selected handle is repeated in Studio, Review and approval confirmation.
- Stale account/capability: approval invalidated.
- Unsupported channel: no publish CTA. Connection-only or handoff reason is shown.

### Draft and edit

- Loading: generation step named and cancel available.
- 502 before draft creation: idea and plan context preserved, confirmed retry available.
- Partial generation: current inventory remains visible; failed card alone gets an actionable state.
- Over limit/media invalid: original text stays byte-for-byte; only affected card blocks.
- Stale edit conflict: overwrite 0, reload or compare.
- Customer role: image/video generation shows operator-only notice and does not call operator APIs.

### Approval and publish

- Approval expires or content/account/time changes: publish adapter 0, re-approval required.
- Pre-dispatch confirmed failure: user may approve one retry.
- Timeout/unknown: `발행 여부 확인 필요`, reconcile first, retry adapter 0.
- Provider result found in reconcile: attach existing permalink, repost 0.
- Provider success and persistence failure: repair_required, internal record repair only, repost 0.
- Bulk partial: successful items stay successful; confirmed failed items alone can retry; uncertain items cannot.
- Schedule create/change/cancel/due: each explicit item independent. Invalid past time and DST ambiguity terminate with correction.
- Account revoked before due: due adapter 0 and reconnect action.

### Metric, insight and experiment

- Native zero: display 0 with source and time.
- Permission, stale, rate limited, unavailable: named non-numeric state.
- Sample too small: sample-hold with next collection time.
- Metric missing provenance: metric hidden or NA.
- Causal overclaim: replace with hypothesis and confidence.
- Two variables changed: experiment approval disabled.
- Experiment held/rejected/expired: next plan remains unchanged.

## Loading, empty, error matrix

| node | loading | empty | error | terminal action |
|---|---|---|---|---|
| Fact | source sync progress | no confirmed fact | named source reason | setup or refresh |
| Opportunity | source read progress | no relevant signal | source unavailable | owner source or hold |
| Plan | draft in progress | no selected opportunity | missing field/conflict | select or revise |
| Card | generation step | no idea/plan | 502/validation | restore and retry |
| Review | account/capability refresh | no pending card | stale/permission | Studio or Settings |
| Publish | dispatch phase | no approved item | failed/uncertain/repair | retry, reconcile, repair |
| Metric | collection progress | not yet collected | permission/rate limit | refresh or sample-hold |
| Insight | evidence analysis | insufficient sample | unsupported claim | hold |
| Experiment | plan comparison | no supported insight | missing rule | revise or hold |

## Responsive route flow

- 1440: 224 sidebar, main command center, evidence rail.
- 1024: 224 sidebar, main two-column collapses to one main column plus compact evidence.
- 390 target repair: visible 44px Menu trigger opens current 26-destination drawer. Route content is one column. No page horizontal overflow. Studio preview rail may scroll internally.
- `/videos` 14px and `/search-console` 89px current overflows are labelled current defects and target repair. They are not claimed fixed.

## Dead-end audit

Every error, empty, permission and unsupported state has one of: retry, refresh, owner deep-link, hold, logout. Decorative status without action is 0. Happy flow returns experiment decision to next Weekly Plan.

## Self-question and red team

Question: 이 flow가 틀렸다면 가장 그럴듯한 이유는? 고객은 주간 계획보다 즉시 제작을 원할 수 있다. 수정: Studio direct entry를 삭제하지 않고 Command Center는 추천 진입점만 제공한다. 반복 의향이 없으면 grounded publisher로 축소 가능하다.

Attack: 전체 agent lifecycle을 만든다며 기존 화면을 감추면 고객은 계정 연결과 복구 위치를 잃는다. 수정: 각 step은 owner route를 대체하지 않고 deep-link하며 provider별 탭과 capability를 그대로 유지한다.

SOURCES: DESIGN.md v15 | docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md | wiki/product/marketing-hub-surface-map.md | wiki/product/studio.md | tasks/osmu-full-ui-code-audit.output | current dashboard source | https://support.buffer.com/article/961-using-post-groups-in-buffer | https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: brand-positioning-kit for audience tension and trustworthy voice | design-review method for state completeness, responsive path and dead-end audit

SKILLS_SKIPPED: imagegen, no bitmap asset required
