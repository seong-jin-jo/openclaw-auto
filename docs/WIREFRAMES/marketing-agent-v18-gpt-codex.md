# Marketing Agent wireframes v18

## STAMP

- line: openclaw-auto
- artifact: marketing-agent-wireframes-v18
- version: v18
- generated_at: 2026-08-07 17:20 KST
- model: gpt-codex/gpt-5.6-sol
- agent: product-designer / marketing_agent_design_v17
- skills: brand-positioning-kit, openclaw-creative-brief, gstack design-review
- evidence: pinned PRD v7.3.5, Audit96 assertions, current Marketing Hub surfaces, official benchmark sources in footer
- 고민 한 줄: 26개 기존 목적지를 바꾸지 않고 캠페인 한 건이 자료·제작·승인·게시·학습을 오가는 맥락을 화면마다 되찾게 했다.

## Reading contract

- `현재`: 현 코드 또는 제품 문서에서 소유 화면을 확인했다. 외부 제공자 성공까지 뜻하지 않는다.
- `목표`: v18 클릭 프로토타입으로 상태와 복구를 검증한다. 서버 저장이나 외부 게시 구현을 뜻하지 않는다.
- `대체 경로`: 목표 기능이 없어도 사용자가 안전하게 빠져나가는 현재 경로다.
- 모든 고객 문구는 평문 한국어를 쓴다. 내부 요구사항 코드, API 경로, 저장 필드명, 토큰 원문은 노출하지 않는다.
- 같은 콘텐츠는 화면이 바뀌어도 `제목 · 수정 번호 · 캠페인 · 계정 · 상태`로 식별한다.

## Shared shell

```text
┌ 224px sidebar ───────┬──────────────────────────────────────────────┐
│ workspace / role     │ page title                    theme / account │
│ Overview             ├──────────────────────────────────────────────┤
│ Social posts         │ breadcrumb / current campaign                │
│ Messaging            │                                              │
│ Social short video   │ owning task surface                          │
│ Data and Analytics   │                                              │
│ Keyword Research     │                                              │
│ Custom Integration   │                                              │
│ Assets and Tools     │                                              │
│ System               │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

Sidebar 순서는 `Social posts → Messaging → Social short video`다. Messaging은 기본 OFF다. Instagram Reels는 Instagram의 형식 링크로 Videos의 Reels 필터를 열며 별도 목적지가 아니다. 고객 역할은 26개 목적지를 유지하고, 운영자 역할은 고객 sidebar와 게시 행동을 렌더하지 않는다.

## WF00 — 로그인과 계정 선택

**Purpose:** 공개 방문자가 의도한 workspace를 잃지 않고 로그인한다. **Owner:** 현재 로그인 화면 + 목표 복구 상태.

```text
브랜드 자료에서 다음 캠페인까지
자료를 확인하고, 채널에 맞게 만들고, 결과로 다음 제안을 준비합니다.

[ Google로 계속 ]
계정을 연결하지 않으면 아무 내용도 게시되지 않습니다.
```

- Success: Google 계정 → 접근 가능한 workspace 목록.
- Account chooser: 계정 이메일을 확인한 뒤 `이 계정으로 계속`.
- Cancel: `로그인이 취소되었습니다` + `다시 시도` / `처음으로`.
- Callback failure: 의도한 workspace를 보존하고 `다른 계정 선택` / `다시 시도` / `로그아웃`.
- Loading: `계정을 확인하고 있습니다`; 중복 클릭을 막되 `취소`는 유지한다.
- Empty: 접근 workspace 없음 → WF01 새로 만들기 또는 초대 받기.

## WF01 — workspace 만들기·초대·전환

**Purpose:** 첫 브랜드 소유 범위를 확정한다. **Owner:** 현재 workspace 목록/생성 + 목표 초대 복구.

```text
어떻게 시작할까요?
┌ 새 workspace 만들기 ┐  ┌ 초대 코드로 참여 ┐

이름 [                      ]
소유자  현재 Google 계정
[ 만들기 ]  [ 기존 workspace 보기 ]
```

- Create success: 새 workspace를 선택하고 WF03으로 이동.
- Invite: 초대 대상 이메일·workspace 이름·권한을 확인한 뒤 참여.
- Switch: `미완성 초안은 현재 workspace에 남습니다`를 알리고 확인 후 전환.
- Atomic partial failure: workspace는 생겼지만 초기 설정이 실패하면 중복 생성하지 않고 `설정 다시 준비`.
- Removed access: 어떤 자료도 노출하지 않고 `다른 workspace 선택` / `소유자에게 접근 요청`.
- Validation: 이름 문제를 해당 입력 옆에 표시. 실패해도 입력 보존.

## WF02 — Home / 캠페인 홈

**Purpose:** 지금 필요한 의사결정과 다음 한 행동을 보여준다. **Owner:** 현재 Home에 목표 agency progress를 추가.

```text
좋은 아침입니다
현재 캠페인  가을 신규 고객 안내                  [ 캠페인 열기 ]

다음 할 일
브랜드 기준에서 확인하지 못한 혜택 문구 1개가 있습니다.
[ 문구 확인하기 ]       [ 빠른 1회 게시 ]

작업 진행  6 / 14  (저장되거나 확인된 단계만 채움)
브랜드 자료 ✓  브리프 ✓  텍스트 ●  사진 ○  영상 ○  승인 ○ ...

결과 요약 / 처리 중 / 막힌 일 / 다음 제안
```

- Primary: `대행 캠페인 시작/이어가기`; Secondary: `빠른 1회 게시`.
- Agent activity: `무엇을 확인 중인지`, `막힌 이유`, `다음 보고 시점`; 채팅 풍선은 주 UI가 아니다.
- Progress never advances on screen view or expert jump. Saved/confirmed outcomes only.
- Empty: 캠페인 없음 → `새 캠페인 준비`; safe exit Studio quick idea.
- Error: summary unavailable → last collected snapshot with time; Studio and owners remain reachable.

## WF03 — 브랜드 자료 선택

**Purpose:** 근거가 어디서 오는지 고르고 범위를 이해한다. **Owner:** GitHub/6문항 현재, 나머지는 목표.

```text
어떤 브랜드 자료를 사용할까요?
○ GitHub 일반 저장소의 Markdown 폴더   현재
○ Markdown 또는 text 묶음 가져오기      목표
○ 6문항으로 시작                        현재
○ 내용을 직접 붙여넣기                  목표
○ 이 제품 안에서 새 자료 만들기         목표
```

- GitHub copy says `일반 저장소`; `GitHub Wiki 저장소는 지원하지 않음`.
- Non-GitHub bundle shows eligible, selected, skipped and unsupported counts before import.
- Paste requires a source name; blank, too large, duplicate and encoding errors keep text.
- New wiki continues WF05; its persistence is not represented as current implementation.
- Safe exits: `나중에` → limited Studio with `확인할 브랜드 자료가 부족합니다`; Home.

## WF04 — GitHub import scope

**Purpose:** 가져올 범위와 제외 사유를 확인한다. **Owner:** current RepoConnect and sync owners.

```text
저장소        owner/brand-docs
브랜치        main
폴더          /brand
Markdown      포함 12 · 제외 3
tone files    tone.md, voice.md
마지막 확인   2026-08-07 16:12

[ 파일 목록 보기 ]  [ 이 범위 가져오기 ]
```

- Scope preview: repository, branch, folder, file count, exclusions and access.
- Loading names the file being checked; cancel keeps inputs.
- Partial: successful documents stay; failed files list reason and `실패한 파일만 다시`.
- Diff/history: added/changed/removed with `이전 정상 자료 사용`.
- Errors: repo missing, branch missing, private permission, outside folder, no Markdown, stored credential error, unsupported Wiki clone. Each offers edit/reconnect/paste/6Q/Home.

## WF05 — 제품 안 브랜드 자료 편집기

**Purpose:** 목표 knowledge lifecycle를 클릭으로 검증한다. **Owner:** target-only.

```text
브랜드 자료 / 고객 약속                         초안 v3
제목 [ 고객 약속 ]

내용 [                                              ]
표시  ○ 확인된 정보  ○ 해석  ○ 확인 필요
출처 [ 자료 이름 ] [ 문서 안 위치 ]

저장 상태: 변경 사항 있음
[ 초안 저장 ] [ 검토 요청 ] [ 이전 버전 보기 ]
```

- Create/edit: template or blank; source can be attached or explicitly missing.
- Save states: unsaved → saving → saved / error. Error preserves content and supports copy.
- Reload: the prototype restores its local fixture; exit report labels server persistence unverified.
- Version: compare exact version, author, time and reason.
- Archive: confirm consequence and offer undo before navigation.
- Rollback: creates a new version; never rewrites history.
- Active approval: reviewer accepts one active version; edits create a new draft and dependent campaign requires review.
- Retrieval lineage: Studio inspector opens statement, page and source location used.
- Safe exits: GitHub import, bundle, paste, 6Q and Home.

## WF06 — 포지셔닝·가이드·말투 확인

**Purpose:** 생성된 기준을 자료와 비교해 편집·확정한다. **Owner:** current generated guide + target confirmation lifecycle.

```text
브랜드 기준 확인                     자료 반영 8 / 10
누구를 돕나       [ ... ]       [ 사용한 자료 보기 ]
어떤 상황인가     [ ... ]       [ 확인 필요 ]
약속 / 차이 / 이유 [ ... ]

말투 1 [차분하게]  이렇게 씀 [ ]  이렇게는 안 씀 [ ]
말투 2 [구체적으로] ...
말투 3 [편집자답게] ...
피할 표현 3개 / 자주 쓸 말 / 시각 규칙

[ 초안 저장 ] [ 브랜드 기준 확정 ]
```

- Required shape: positioning, audience, promise/proof, three tone anchors with counterexamples, three taboos, vocabulary, visual rules.
- Source inspector uses `사용한 자료`; unresolved conflicts present both sources and `하나 선택/범위 좁히기/미확정 유지`.
- Confirmed version becomes campaign basis. Reopen creates draft and does not silently mutate active campaigns.
- Empty proof narrows the claim; unsupported claims never acquire a green success state.

## WF07 — 기회 발견과 캠페인 브리프

**Purpose:** 생성 전에 why/who/what/safety를 합의한다. **Owner:** target.

```text
캠페인 준비
목표 [ ]              독자와 상황 [ ]
핵심 메시지 [ ]       제안/혜택 [ ]
원하는 한 행동 [ ]    기간·시간대 [ ]
제작·도구 예산 [ ]    광고비: 쓰지 않음 / 외부 집행 / 미정
확인 담당자 [ ]       사용할 채널 [ ]
확인할 주장 [ ]       이미지·음원 권리 [ ]  안전 메모 [ ]

확인한 정보 / 해석 / 제안  (세 문단으로 분리)
[ 브리프 확정 ] [ Studio에서 아이디어로 계속 ]
```

- Research result separates collected fact, designer/agent interpretation and proposal in plain language.
- Campaign field contract covers goal, audience, message, offer, desired action, period/timezone, production/tool budget, paid-media disposition, approver, claims, rights and safety.
- Missing objective or approver highlights one field and preserves the rest.
- Paid media never implies this product spends money; external execution and unknown remain explicit.
- Quick idea is not automatically counted as a completed campaign report.

## WF08 — 캠페인 14단계 timeline

**Purpose:** exact agency handoff and real progress. **Owner:** target journey hub.

1. 가입·workspace
2. 작업 요청
3. 브랜드 자료
4. 브랜드 기준
5. 시장·채널 조사
6. 캠페인 브리프
7. 텍스트
8. 사진·카드뉴스
9. 짧은 영상
10. 피드백 반영
11. 최종 승인
12. 게시·예약
13. 결과·보고
14. 다음 실험

- Number/order identical at 1440, 1024 and 390.
- Expert jump stores current form draft, opens target, and never marks skipped steps complete.
- Each step shows `완료/진행 중/확인 필요/아직 시작 안 함`, owner, last saved and one next action.

## WF09 — OSMU Studio

**Purpose:** one campaign identity, three progressively disclosed output families. **Owner:** current Studio reordered in target presentation.

```text
OSMU Studio  /  가을 신규 고객 안내  /  수정 7

1  소셜 게시물 텍스트       [열림]
   공통 초안 → Threads / X / Instagram / Facebook / Bluesky
   [채널별 문구 편집] [초안 저장]

2  사진과 카드뉴스           [열기]
   사진 / 카드뉴스 slides / crop / alt text / 권리

3  짧은 영상                 [열기]
   YouTube Shorts / Instagram Reels / TikTok

Messaging 전달: 꺼짐  [설정]
```

- DOM and visual order remains 1 Text → 2 Photo/Card → 3 Video at every viewport.
- Text: common draft then visible per-platform divergence and account.
- Photo/Card: slide order, crop preview, alternative text, safe area and rights.
- Video: script, source media, rights, captions, aspect/duration, render job and platform variants.
- Instagram Reels is a format link, not nav. Discord/Slack appear only under optional Messaging handoff.
- Partial generation preserves finished families; unsupported combination is disabled with reason and a safe adaptation.
- Actions: per-item edit, save, approval, publish selected, schedule selected. No automatic publish.

## WF10 — bulk impact review

**Purpose:** prevent accidental multi-account action. **Owner:** additive decision layer over current bulk actions.

```text
선택 8   바로 진행 4   승인 필요 2   제외 2
[ 제외 이유 보기 ]

공통으로 바꿀 수 있음: 날짜, 시간, 캠페인 표시
각 채널에서 따로 확인: 길이, 링크, 대체 텍스트, 첫 댓글

영향받는 계정 8개
Threads @brand ...
[ 다시 확인하고 예약 ]
```

- Exact selected count, account list, compatible fields and exclusions appear before action.
- Any account/time/content change invalidates confirmation and requires reconfirmation.
- Result summary separates success, confirmed failure and uncertain; no retry-all for uncertain.

## WF11 — 승인 상세

**Purpose:** reviewer understands change and consequence. **Owner:** current Inbox with target diff/staleness.

- Header: title, revision, campaign, channel/account, requested time, requester.
- Body: current content/media, previous approved version diff, source/rights warnings.
- Feedback: scoped comment, required change, optional note.
- Actions: `승인`, `수정 요청`, `Studio에서 편집`, `캘린더 보기`.
- Stale: any content/media/account/time change expires approval and preserves history.
- Rejection returns to owning editor with reason; it is not a terminal state.

## WF12 — Queue / Inbox / Calendar identity

**Purpose:** prove the same item moved, not a copied mystery object. **Owner:** current surfaces plus identity contract.

```text
가을 신규 고객 안내 · Instagram Reels · 수정 7
캠페인 / 계정 / 승인 / 예약 시간대 / 현재 owner
[ Studio에서 열기 ] [ 승인 보기 ] [ 일정 변경 ]
```

- Queue: immediate and provider queue states; failed/uncertain branches.
- Calendar: workspace timezone and local time together; past/ambiguous times blocked.
- Inbox: reviewer state and diff.
- Every surface links back to Studio and owning channel. Cancelling schedule preserves draft.

## WF13 — video workbench

**Purpose:** long-running video work is visible and recoverable. **Owner:** current Videos expanded to v18 state contract.

- Required visible states: input missing, ready, queued, rendering, upload pending, publish pending, success, partial, failed-confirmed, uncertain, cancelled, expired, rights blocked, account blocked, policy blocked, rate limited, provider maintenance, reconnect needed, callback late, record repair, retry ready, manual export, archived, recovered.
- Job card: stable title/revision/campaign, source, owner, progress text, last event, one next action.
- `취소` explains whether provider work can still complete. Uncertain state blocks retry.
- Repair restores local record after external success without a second external post.

## WF14 — 결과 보관함과 결과 drawer

**Purpose:** every successful output has a resolvable owner and external result. **Owner:** target index linking current owners.

- Index filters: campaign, period, platform, account, media family, outcome.
- Row: title/revision, platform/account, published time, result status, campaign, owner link.
- Drawer: actual external link when confirmed, provider item identity when link unavailable, request time, confirmation time, content revision, readback snapshot.
- Uncertain: `결과 확인 중`, retry disabled, owner check action.
- Internal record failure after external success: `기록 복구`; never repost.
- Archive does not delete external content and states this before confirmation.

## WF15 — 전체 성과와 채널별 성과

**Purpose:** comparable operations overall, native meaning per channel. **Owner:** current Home and channel owners.

```text
전체 운영 결과: 게시 18 · 실패 1 · 처리 중 2 · 측정 가능 14/18
기간 / workspace / 마지막 확인 시간

채널별 결과
Instagram 저장 42  정의 [?]  계정 @brand  기간 7일  확인 16:20
YouTube 평균 시청 ...
```

- Overall whitelist: operational counts only; incompatible engagement definitions are not summed.
- Native metrics show definition, source, period, account and collected time.
- States: loading with previous snapshot, no data, insufficient permission, partial collection, stale, definition break, provider unavailable.
- No data is `수집된 값 없음`, never zero. Definition break ends comparison line.

## WF16 — 한 변수 다음 실험

**Purpose:** turn observation into a falsifiable, reversible proposal. **Owner:** target.

- Observation: exact result and comparison window.
- Limitation: sample size, missing channels or definition change.
- Proposal: one change only; what stays fixed; expected signal; check date.
- Evidence link: result drawer and brand source.
- Actions: `다음 초안에 적용`, `보류`, `수정`, `제안 닫기`, `적용 취소`.
- Apply creates a new proposal revision and never publishes. Dismissal does not become negative brand truth without an explicit storage policy.

## WF17 — channel owners and Header7

**Header7 fields:** connection, account identity, permission, capability, latest sync, latest publish/result check, safe next action.

- Header7 applies consistently to Social5, Messaging3 and video formats 3: Threads, X, Instagram Feed, Facebook, Bluesky, Telegram, Discord, Slack, YouTube Shorts, Instagram Reels, TikTok.
- Social owner: composer/queue/results/analytics according to current capability.
- Messaging owner: connection and explicit handoff setup only. No fabricated Queue or Analytics when the platform owner lacks them.
- Video owner: format rules, account, render/publish handoff and results.
- Disabled/partial state names what works and what does not, with Settings or manual export exit.

## WF18 — customer Settings and operator Admin

**Customer Settings 8:** workspace/profile, publishing policy, connections, OAuth metadata, workspace-scoped token, BYOK, notifications, data controls. Preserve current owner labels when built; v18 specifies the state contract, not a replacement settings IA.

- Central OAuth: customer sees app readiness and connect/reconnect, never secret plaintext.
- Workspace token: raw value only once when issued; later views show prefix, created time, last use, revoke/rotate.
- BYOK: masked, test result, scope and replace/remove; never echoed in browser logs or later UI.

**Operator Admin 9:** preserve current operator-only owner including Video/TTS.

- Secret source class: central environment, workspace credential, or customer BYOK.
- Timed reveal requires operator reauthentication, reason, database-backed eligible source, `no-store`, 30-second countdown and audit record.
- Environment secrets are import-first and never revealable. OAuth/provider access and refresh tokens remain raw-zero.
- Support mode is visibly bounded, timed and non-publishing; exiting removes customer context.

## WF19 — Data, Keyword, Assets, Midjourney and Blog

- Data pages: account/period/source/no-data/error definitions; previous timestamped snapshot remains.
- Keyword pages: query, market/period/source, empty/partial/rate-limit and `Studio로 보내기`; estimates are not promised results.
- Images: upload/generate/card-news result, alt/crop/rights and safe fallback.
- Videos: WF13.
- Midjourney: safe-disabled/current boundary; never implies working generation. Exit to Images or upload.
- Blog: long-form adaptation/export for the current custom integration. Naver/Medium/Substack may be export formats or links only when supported; they do not become new sidebar destinations.

## WF20 — responsive, theme, accessibility and role

- 1440: 224px sidebar, content max 1180, Studio family panels expanded.
- 1024: sidebar preserved, two-column review collapses to one; exact semantic order unchanged.
- 390: customer mobile header/drawer, one column, 44px targets. Action summary becomes an in-flow block; bottom content remains reachable with at least 24px clearance.
- No horizontal page overflow at any viewport. Only explicit video compare and seven-day calendar scrollers may overflow inside labelled regions.
- Focus order follows title → state → primary content → action; visible focus ring; Escape closes overlays and returns focus.
- Light/dark use semantic tokens; no color-only state.
- Operator role contains zero customer sidebar/mobile drawer/publish nodes at all widths.

## Interaction and state completeness

Every async surface must render loading, empty, success, partial, error, stale, permission, blocked, degraded, uncertain and repair when meaningful. A state card always says what happened, what remains, whether the external action may have occurred, one safe next action and one owner exit.

Dead-end audit: **0 by specification**. Each WF has a primary task action plus Home, Studio, owner, or role-safe exit. Destructive archive/revoke/cancel actions state consequence and require confirmation; recoverable changes expose undo.

## Benchmark transfer

- Buffer/Sprout: draft-review-approval history → adapted to visible item revision and owner.
- Hootsuite: external approval accountability → adapted without casual bypass.
- Later: base content with per-profile variants → adapted with exact bulk exclusion preview.
- Canva: brand asset-to-calendar continuity → adapted without importing a template-heavy visual language.
- HubSpot: campaign asset grouping and one-source remix → adapted to fixed Text → Photo/Card → Video.
- Notion: import scope and Markdown handling → adapted to truthful GitHub-folder and product-wiki boundaries.

## design-review

Classifier: **APP UI**. Hierarchy, action ownership, error exits, semantic responsive behavior and anti-slop hard rejection pass by specification. Expected score after browser inspection: **B+ or higher**. Hard rejects: generic dashboard card wall, invented destination, unclear primary action, customer-facing implementation jargon, unsupported success, bulk action without impact review, or mobile fixed-bar occlusion.

## Red team and revision

Competitor attack: `This is a scheduler with a 14-step progress bar.` Revision: the campaign brief, source-resolvable brand criteria, three-family creative rationale, stable result identity and one-variable experiment are task owners, not progress decoration.

Demanding customer attack: `Your agency mode slows me down and may fabricate what it saved.` Revision: expert jumps preserve work without false completion, quick publishing remains, and every target-only save is labelled target evidence in engineering handoff rather than customer success proof.

## Self-question

**이 단계가 틀렸다면 가장 그럴듯한 이유는?**

The 14-step journey may still be too process-heavy for one-off publishers. The correction is not removing rigor but preserving a visible `빠른 1회 게시` path, earned progress, and reversible expert jumps. The load-bearing unverified assumption is that customers value a campaign-level result and learning loop enough to revisit it.

**If this is a simple publishing tool rather than a marketing agency, what is missing?**

Without a client-quality brief, source-based creative decisions, approval accountability, a reusable result library and an evidence-linked next experiment, it is a publisher. WF07, WF06/WF09, WF11, WF14 and WF16 make those five capabilities explicit, while implementation ownership remains a plan/engineering gap.

## 회수 필요

- ⛔ 회수 필요: product wiki persistence/versioning, campaign persistence, result index and learning lineage require plan/engineering ownership before build.
- ⛔ 회수 필요: provider OAuth, real publish result links, readback and native analytics require external-path QA.
- ⛔ 회수 필요: customer Settings8 and operator Admin9 exact existing labels must remain source-owned during implementation; this wireframe defines behavior, not replacement navigation.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `Customers will revisit the one-variable experiment.` 이유: campaign-level retention behavior is not yet observed.
SOURCES: pinned `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`; Audit96 assertion outputs; current Marketing Hub source/wiki; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.hootsuite.com/whats-new/document-external-approvals; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://www.canva.com/learn/using-canva-content-planner-social-content/; https://knowledge.hubspot.com/campaigns/create-campaigns; https://knowledge.hubspot.com/blog/repurpose-content-using-ai-with-content-remix; https://www.notion.com/help/import-data-into-notion; https://www.nngroup.com/articles/progressive-disclosure/; https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/; DOI 10.1086/500480; DOI 10.1126/science.1091721; DOI 10.1086/651235
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for the evidence-led positioning and tone review / openclaw-creative-brief for screen inputs, constraints, state and validation contracts / gstack design-review for APP UI hierarchy, responsive, accessibility and hard-rejection audit
SKILLS_SKIPPED: imagegen because the governing product uses existing code-native SVG icons and no new raster asset is needed / Product Design plugin was not installed or explicitly requested

## Retake trace

The fidelity prototype now binds these wireframes to observable local state rather than generic alerts:

- WF01 account chooser, cancel, callback error, create/invite/existing-workspace branches;
- WF03–06 GitHub scope, six questions, product-wiki edit/save/diff/archive/restore/review and Studio source inspector;
- WF08 input preservation at four editable journey steps and campaign field count 14;
- WF09 current preview7/direct4, eight editable platform variants and actual CardNews/asset dialogs;
- WF10 eight account impact rows with dynamic selection and exclusion repair;
- WF11–12 same work #2047 / revision 7 approval and schedule state;
- WF13 video owner lifecycle and 24 workbench states;
- WF14–16 result3 → evidence-linked experiment → revision 8 with undo;
- WF18 Settings8, Admin9 and distinct credential classes;
- WF20 customer mobile drawer/ESC and operator mobile owner navigation.

These state-lineage claims are non-GUI DOM-observed. Parent final Chrome QA additionally observed console errors0, 12/12 role/theme/viewport combinations, nav26/26, journey14/14, Studio1/2/3, overflow0, drawer26+close, operator customer boundary0 and Admin9/9 owner transitions. `.qa-tools` and `#qa-restore` are both hidden on every default render, screenshot-visible `검수` controls are 0, and inspector controls are excluded from the product control audit; explicit opt-in is required.

The independent reviewer has not re-rated the retake, so its previous NO-GO remains the governing stage verdict until that review completes.

## WF21 — stable lineage strip and reorder-safe result detail

```text
┌ 추적 정보 ───────────────────────────────────────────┐
│ 캠페인 cmp_fall_launch_2026 │ 콘텐츠 cnt_2047       │
│ 수정 rev_7                  │ 게시 요청 pub_0071    │
│ 외부 결과 ext_ig_8801       │ 실험 exp_hook_…_01    │
└──────────────────────────────────────────────────────┘

Results library
  [ext_yt_8803] YouTube Shorts · 결과 확인 중     [상세]
  [ext_ig_8801] Instagram Reels · 저장 42         [상세]
  [ext_th_8802] Threads · 답글 8                  [상세]
```

Elements: visible six-field lineage strip; `data-lineage-owner`; row and button `data-result-id`; external-result-specific publish attempt; no positional DOM identity.

Interaction: reorder rows → click `ext_th_8802` → detail opens `ext_th_8802/pub_0072`. Return to experiment → source IDs remain `ext_ig_8801 + ext_th_8802`. Apply creates `rev_8` with one changed variable and three held constants. Undo removes the applied revision and restores `rev_7`.

States: missing metric says “아직 값 없음”; uncertain uses “같은 외부 결과 다시 확인”; external success plus internal miss offers record linking only.

## WF22 — owner recovery card

```text
┌ Studio 복구 경로 ────────────────────────────────────┐
│ Studio · 일부 항목만 완료됨                           │
│ 편집 중인 문구와 미디어를 보존합니다.                  │
│ 완료한 항목은 잠그고 누락된 항목만 다시 확인합니다.    │
│ 보존됨: cnt_2047 · @monostudio · rev_7                │
│ [Studio에서 누락 항목만 확인] [Home으로]              │
└──────────────────────────────────────────────────────┘
```

This component has eight owner variants: Home, Studio, Inbox, Calendar, Platform, Results, Settings and Operator. Each has loading, empty, partial, permission, uncertain and repair. Inspectable attributes are `data-owner`, `data-state`, `data-preserved-id`, `data-item-id`, `data-account-id`, `data-revision-id`, and a unique `data-recovery-action`.

Interaction: owner action records preserved-before and preserved-after, changes only the local screen state to success, and renders an owner-specific outcome. A missing recovery handler is a programmatic audit failure. Operator uses `operator:admin-01`; Results retains `external_result_id`; neither reuses a customer generic reset.

## WF23 — 390 video scroll affordance and interaction audit

```text
390px / customer / light or dark
┌ 짧은 영상 ───────────────────────┐
│ 옆으로 밀어 형식 더 보기 →       │
│ [YouTube Shorts][Reels][TikTok] ↔│
│ 대본 editor                       │
│ 옆으로 밀어 미리보기 더 보기 →   │
│ [Shorts 미리보기][Reels …]      ↔│
└───────────────────────────────────┘
```

Elements: `data-horizontal-scroll="true"`, visible mobile cue, snap-aligned 44px controls, one-column lineage strip, full-screen journey dialog, 44px close/previous controls.

Audit surface: `window.__V18_INTERACTION_AUDIT__` collects control name, handler class, target rectangle, focus-visible contract and contrast tokens. Required matrix is 2 roles × 2 themes × 3 viewports. Root attributes contain only customer/operator, light/dark and 1440/1024/390 values.

Static evidence: 181 assertions, 48 owner-state fixtures, 12/12 matrix, failures 0. Actual-browser 12 screenshots, computed-style contrast/focus and target rectangles remain parent-owned evidence.

### Red-team and self-question

Attack: “The wireframe calls six IDs lineage, but clicking a reordered row still opens by index.” WF21 makes the external ID both the row key and detail selector and includes a reorder fixture. “Owner-specific” is not a label swap: WF22 requires 48 unique action codes, preserved IDs and visible outcomes.

If this is wrong, the likeliest reason is visual, not semantic: compact 390 controls may technically scroll while the cue is missed, or a token may inherit a lower-contrast background. The browser matrix remains mandatory.

⛔ 회수 필요: parent must capture customer/operator × light/dark × 1440/1024/390 and run computed contrast, focus and target checks before design approval.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `the cue is missed` is still a usability hypothesis until observed with customers.
SOURCES: pinned PRD v7.3.5; `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.log`; current Marketing Hub code/wiki; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.nngroup.com/articles/ten-usability-heuristics/
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for evidence-led product tone / openclaw-creative-brief for component state, recovery and validation contracts / gstack design-review for responsive, accessibility and hard-rejection audit
SKILLS_SKIPPED: imagegen because the governing product uses existing code-native assets / Product Design plugin was not installed or explicitly requested

## WF24 — Customer-readable lineage, immutable underneath

```text
┌ 캠페인 진행 정보 ────────────────────────────┐
│ 캠페인       가을 신규 고객 안내             │
│ 작업물       텍스트·카드뉴스·짧은 영상       │
│ 수정본       수정 7                          │
│ 게시 요청    오늘 15:48 요청                 │
│ 게시 결과    Instagram Reels · 게시 확인     │
│ 다음 비교    첫 문장 구체성 비교             │
└───────────────────────────────────────────────┘
  DOM only: data-campaign-id, data-content-id,
            data-revision-id, data-publish-attempt-id,
            data-external-result-id, data-experiment-id
```

Elements: visible label/value pairs in customer language; internal six-field lineage in attributes only; `aria-label="캠페인 진행 정보"`; no raw prefix in visible text, accessible name, title, alt or form value.

States:

- recovery: `보존됨: 가을 신규 고객 안내 · @monostudio · 수정 7`;
- result: platform, account, request time, confirm time, status and metric;
- experiment: human result summaries, one changed variable, held constants and `수정 8` apply/undo;
- uncertain: status and same-request verification, no new attempt;
- error: plain-language cause/action, input preserved, Home/current item exits.

Interaction: row selection keys on `data-result-id`; reorder does not change the opened record. Copy and labels never become lookup keys. Customer language audit scans root text plus form values and accessible metadata.

Static evidence: 338 assertions PASS, 48 recovery fixtures, 12/12 interaction matrix, 157 customer-language surfaces, raw identifier hits 0, undefined implementation jargon hits 0.

### Red team과 셀프심문

공격: “보기 좋은 라벨로 바꾸며 auditability를 잃었다.” 답: immutable lineage remains exact and frozen in data/test/operator contracts; only presentation is translated. “접근성 이름에는 ID가 남았을 수 있다.” 답: the audit includes aria-label, title, alt and form values, not textContent only.

이 wireframe이 틀렸다면 가장 그럴듯한 이유는? 390px에서 여섯 쌍이 정보 과밀로 보일 수 있다. one-column strip과 기존 scroll/target rules는 유지했지만 final browser inspection은 independent reviewer 소유다.

⛔ 회수 필요: independent reviewer final M14 visual-language pass.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: six visible lineage pairs may be denser than necessary for novice customers and need usability observation.
SOURCES: `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.json`; https://media.nngroup.com/media/articles/attachments/Heuristic_2_compressed.pdf; https://design-system.service.gov.uk/components/error-message/; https://m3.material.io/foundations/interaction/states/overview
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for human-readable naming / openclaw-creative-brief for state and validation contracts / gstack design-review for accessibility and responsive audit
SKILLS_SKIPPED: imagegen because code-native UI assets are sufficient / Product Design plugin was not installed or explicitly requested
