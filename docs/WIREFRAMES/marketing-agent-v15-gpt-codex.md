# OSMU Marketing Agent wireframes v15

> STAMP: created_at=2026-08-06 07:02 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=brand-positioning-kit, design-review method | evidence=current Chrome and source authority | deliberation=핵심 loop만 시각화하고 모든 실행은 기존 owner route에 남겼다

## WF-01 Customer Command Center, `/`

Purpose: 오늘 결정할 한 가지와 전체 proof loop 상태를 보여준다.

Elements:

- current customer Sidebar 26 destinations
- workspace identity and theme control
- page header `이번 주 마케팅 판단`
- `AgentDecisionCard` opportunity1 with evidence, collected_at, scope and confidence
- `FactSourceStrip` with confirmed fact1 and citation
- `WeeklyPlanCard` campaign1, 7-day window, goal, audience, offer, hypothesis
- `LoopProgress` with current step expanded
- existing owner links: Threads Popular, Studio, Inbox, Calendar, Threads Analytics
- metric/insight card with native or sample-hold state

States: loading, no fact, no opportunity, plan draft, plan approved, result pending, sample-hold, experiment held, error, permission.

Interactions:

- evidence row opens the owner route
- opportunity select fills Weekly Plan draft
- approve plan validates seven fields
- next action always deep-links to owner

## WF-02 Source evidence detail

Purpose: fact, inference and unverified content를 혼동하지 않게 한다.

Elements:

- source name/path, last updated, collected_at
- fact rows with class badge
- exact factual claim used by card1
- refresh and owner route
- secret-safe error reason

States: synced, stale, permission, rate-limited, no Markdown, network error, empty.

Interaction: unverified fact cannot be selected. stale source disables plan approval.

## WF-03 Weekly Plan1

Purpose: 45분 안에 한 campaign만 승인한다.

Elements:

- goal, audience, offer, desired action, constraint, Threads, 7-day window
- opportunity evidence link
- hypothesis and owner
- one campaign counter `1/1`
- `계획 승인하고 Threads 초안 만들기`

States: draft, incomplete, approved vN, stale evidence, conflict.

Interaction: approval produces immutable version and enters current Studio.

## WF-04 Current Studio with campaign context, `/studio`

Purpose: existing Studio existing9를 보존한 채 card1을 plan lineage에 연결한다.

Elements preserved:

- OSMU Studio title, AI status, idea input
- brand setup, wiki, OSMU generation, AI auto draft
- Save, Publish(4), Schedule, operator-only image/video notice
- visual7 grouped as current Text, Video 9:16, Card News
- direct4 selectors only
- edit drawer and publish history
- longform to clipper to wiki refine handoff to video3 plus text

Additive:

- slim campaign context strip above toolbar
- `검수로 보내기` for current Threads card1
- citation indicator on Threads preview

States: empty, generating, partial, validation error, draft, saved, customer operator-only, publish partial, uncertain, repair_required.

## WF-05 Platform account connection and status

Purpose: platform-specific connection truth and individual account selection.

Elements:

- current ChannelPage tab set, Threads adds Growth/Popular
- Instagram retains Queue/Editor/Settings
- OAuth primary CTA
- AccountManager list, default, status, switch, delete
- Advanced manual token collapsed
- readiness and publish capability message

States: loading, no account, active, expired, revoked, provider unreachable, callback cancelled, mismatch, connection-only.

Interaction: Review selected account cannot become Connected until canonical readback.

## WF-06 Review and approval, `/inbox`

Purpose: 외부 공개 전 마지막 진실 확인.

Elements:

- Threads native preview
- citations, selected handle, capability, publish timing, content count
- approval summary with content/account/time/channel hash
- edit link back to Studio
- approve and hold

States: ready, missing citation, stale account, expired approval, permission, over limit.

Interaction: any post-approval mutation invalidates approval.

## WF-07 Immediate, bulk and schedule bridge

Purpose: current actions and provenance를 이해 가능하게 유지한다.

Elements:

- single immediate `card_publish`
- legacy bulk `legacy_bulk`
- single schedule `card_schedule`
- bulk schedule `bulk_schedule`
- explicit item IDs and account labels
- current SchedulePanel and Calendar deep-link

States: scheduled, processing, canceled, partial, failed_confirmed, uncertain, repair_required, published.

Interaction: uncertain only offers reconcile. repair_required only offers internal repair.

## WF-08 Result, metric, insight and next experiment

Purpose: 실제 결과를 다음 주 판단으로 돌린다.

Elements:

- `PublicationProof` external ID, permalink, published_at
- `MetricTruth` native metric name, definition, source, collected_at
- sample size and hold reason
- evidence-backed insight or explicit hold
- one-variable experiment with approve/hold
- next Weekly Plan link

States: result loading, permalink available, provider proof absent, native zero, permission, stale, sample-hold, experiment approved, held.

## WF-09 Operator state

Purpose: customer shell과 operator shell의 완전 분리를 확인한다.

Elements:

- Admin identity
- customer management only
- Settings Video/TTS only under operator role if Settings is entered
- no customer workspace or Marketing Agent cards

## WF-10 390 navigation repair target

Purpose: 현재 hidden nav 결함을 명시적으로 복구한다.

Elements:

- sticky top bar, brand, current route, theme, 44px menu
- slide-in drawer with all current 26 destinations and existing icons
- body one column
- sticky bottom primary decision only on WF-01/03/06

States: drawer closed/open, focus trapped, Escape close, route change close.

## Fidelity and prohibition checklist

- current inline SVG assets reused in prototype
- light/dark semantic tokens only
- 25 route owners and 26 destinations unchanged
- Settings customer8/operator9
- no generic fake provider tabs or fake connected states
- current truth and target repair labelled separately
- D3 surface 0

## Self-question and red team

Question: 이 wireframe이 틀렸다면 왜? Command Center가 기존 성과 홈을 덮어 기존 데이터를 잃을 수 있다. 수정: new decision/loop modules are additive; current performance modules remain below the prototype fold and are not renamed.

Attack: campaign lineage가 실제 데이터 계약 없이 마치 동작하는 것처럼 보일 수 있다. 수정: prototype labels target state, sample metrics, and external verification boundary; every action returns to an existing owner route.

SOURCES: DESIGN.md v15 | docs/user-flow-marketing-agent-v15-gpt-codex.md | current Chrome baseline | current route/component source | Buffer Post Groups | Sprout approval | Later Social Sets | Linear Insights

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: brand-positioning-kit for tone consistency | design-review method for screen/state/interaction completeness

SKILLS_SKIPPED: imagegen, no bitmap required
