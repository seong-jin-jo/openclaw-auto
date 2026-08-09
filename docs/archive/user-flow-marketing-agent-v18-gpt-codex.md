# Marketing Agent user flow v18

## STAMP

- line: openclaw-auto
- artifact: marketing-agent-user-flow-v18
- version: v18
- generated_at: 2026-08-07 16:45 KST
- model: gpt-codex/gpt-5.6-sol
- agent: product-designer / marketing_agent_design_v17
- skills: brand-positioning-kit, openclaw-creative-brief, gstack design-review
- evidence: current Marketing Hub code/wiki and official benchmark sources in footer
- 고민 한 줄: 처음 온 고객과 숙련 고객이 같은 26개 메뉴를 쓰되 어느 경로에서도 브랜드 근거와 다음 행동을 잃지 않게 했다.

## Flow objective

가입부터 다음 콘텐츠 제안까지 하나의 콘텐츠 identity로 잇는다. 제목, 수정 번호, campaign, source coverage, account, approval, schedule, result link, observed performance가 소유 화면을 이동해도 유지된다.

```text
public
  → login
  → workspace choose/create
  → brand material import or direct setup
  → positioning/guide/tone review and confirm
  → campaign brief or quick idea
  → Studio: text → photo/card → video
  → per-platform edit and approval
  → publish one/bulk or schedule
  → Queue / Calendar / Videos
  → result permalink / result index
  → overall / channel-native performance
  → learning
  → next content proposal
  ↺ edit campaign, source, or content
```

The long path is guided. Studio, Inbox, Calendar, Videos and channel owner shortcuts remain available for experienced users.

## Implementation truth markers

- **Current**: source owner exists in present code/wiki. External/provider success may still be unverified.
- **Target**: design proposal without a current persistence owner. Customer UI says `준비 중`, not an internal implementation label.
- **Fallback**: a current path that safely completes the user’s immediate goal.

Current existing-wiki path: Studio RepoConnect → normal GitHub repository → branch → Markdown folder/files → scope check → sync. GitHub Wiki clone `repo.wiki.git` is not supported.

Target new-wiki path: structured page/editor for brand information and policies with create, edit, save, reload, version, archive, rollback-as-new-version and active approval. The clickable prototype may demonstrate these target semantics, while the exit report keeps persistence code-tested and production-observed as unverified.

## Happy path H1: first customer, existing material

1. Public landing explains `brand evidence → campaign → content → publish → learn`; action `Google로 계속`.
2. Google login returns to workspace selection.
3. User selects an existing workspace or creates one with name and owner confirmation.
4. `브랜드 자료 준비` offers four visible choices: GitHub Markdown import, six questions, paste, new wiki.
5. User selects GitHub Markdown import.
6. Import scope review shows repository, branch, folder, included Markdown files, exclusions, last sync and permissions.
7. User confirms scope; loading names current file; partial success preserves imported files and lists failed files.
8. Brand evidence board creates an editable draft: audience desire, situation, promise, differentiator, proof, three tone anchors and taboo.
9. User compares each field with source snippets, edits it and selects `브랜드 기준 확정`.
10. Campaign brief asks objective, audience situation, one desired action, offer, period, success measure and proposed channels.
11. User confirms campaign or chooses `Studio에서 아이디어로 계속`.
12. Studio generates outputs in fixed order: text, photo/card, video.
13. User edits the common draft, then per-platform variants; unsupported combinations are disabled with reason and safe next action.
14. User selects individual outputs or all ready outputs.
15. Approval-required workspace uses `승인 요청` or `예약 승인 요청`. Direct workspace uses `지금 게시` or `예약`.
16. Inbox owner can edit, approve, reject with reason, or return to Studio.
17. Immediate items enter channel Queue; scheduled items enter Calendar; video rendering/publishing enters Videos.
18. Each confirmed publish stores or links an actual provider permalink. Uncertain items show `결과 확인 중` and block retry.
19. Result index groups published outputs by campaign and links to Images, Videos, channel queues and actual result pages.
20. Home reports only comparable operational totals; each channel owner reports native metrics with definition, source, period, account and collected time.
21. Learning card states one observation, limitations and one proposed change.
22. Next-content proposal cites the observed result and brand source. User edits, dismisses, or starts a new campaign; it never self-publishes.

Exit: next campaign, Home, Studio, result index and source editor are all reachable. No terminal dead-end.

## Happy path H2: no existing material

1. From Brand Source Choice, choose `6문항으로 시작`.
2. Complete current BrandSetupWizard questions.
3. Generated brand guide opens in review mode, not final mode.
4. Missing proof and taboo remain visibly incomplete.
5. User adds direct paste or accepts a narrower claim.
6. Confirm brand criteria and continue at H1 step 10.

Empty exit: `나중에 하고 Studio에서 아이디어 입력` is allowed, but Studio labels content as `브랜드 근거 부족` and prevents unsupported factual claims from being presented as verified.

## Happy path H3: target in-product wiki

1. Select `새 브랜드 자료 만들기`.
2. Choose a guided brand template or blank start and enter the first page title.
3. Add a statement, label it `확인된 정보`, `해석`, or `확인 필요`, and attach a source or mark the missing source.
4. `초안 저장` shows saving, saved and error branches. Only the target prototype observes this state; implementation persistence remains unverified.
5. Reload view restores the saved target fixture, then `검토 요청` opens the exact version.
6. Approver confirms an active version. Edits create a new draft; archive removes future selection; rollback creates a new version rather than rewriting history.
7. Studio source inspector resolves the chosen statement and source location, then continues H1 step 8.
8. At every failure, exits are six-question setup, direct paste, GitHub Markdown import and Home.

## Happy path H4: experienced user quick path

1. Sign in and choose workspace.
2. Home shows last confirmed brand criteria and current campaign.
3. User opens Studio directly.
4. Idea input inherits brand and campaign but exposes both for change.
5. Continue H1 step 12.

If the inherited source is stale, publishing stays blocked until `자료 새로 확인` or `이 수정에는 사용하지 않기` with explicit review.

## Happy path H5: individual publish

1. Select one ready channel card.
2. Review content, media, account, permissions, policy and time.
3. Choose approval, publish or schedule according to workspace policy.
4. Queue/Calendar/Video job opens the exact item.
5. Result is success, failed, partial, uncertain or repair.
6. Success exposes provider permalink; failed exposes edit/reconnect/retry only when provider confirms no publish; uncertain exposes result check only.

## Happy path H6: bulk publish or schedule

1. Select multiple ready cards.
2. Bulk bar shows ready, approval-required, blocked and excluded counts.
3. User expands excluded reasons before continuing.
4. Shared date/time applies only to selected ready items; platform-specific fields remain per-card.
5. Confirmation lists every account and consequence.
6. Result summary preserves success and separates failed/uncertain items.
7. User may retry confirmed failures individually; no `retry all` for uncertain results.

## Happy path H7: learning loop

1. Home or campaign result index requests period, campaign and account context.
2. Operational summary shows published, failed, processing and measurable coverage.
3. Channel-native rows never merge incompatible definitions.
4. User opens one result and one comparable prior result.
5. Learning card proposes one causal hypothesis, explicitly labelled as a hypothesis.
6. User marks useful/not useful, edits the change, or dismisses it.
7. Next proposal applies only the confirmed change and links back to the observation.
8. User starts content generation or returns to performance.

## Flow H8: operator boundary

1. Operator authentication opens Admin shell.
2. Customer Sidebar, customer workspace name, customer mobile drawer and publish controls are absent.
3. Operator may inspect customer/workspace status, central OAuth app readiness, usage and safe recovery.
4. Operator does not see provider access/refresh token plaintext and cannot publish as the customer.
5. Return action restores customer shell only after role change.

## State paths

### Loading

| location | message | preserved | actions |
|---|---|---|---|
| login return | 계정을 확인하고 있습니다 | intended destination | cancel to public landing |
| workspace | 워크스페이스를 불러오고 있습니다 | account identity | retry, sign out |
| import | Markdown 목록을 확인하고 있습니다 | repo/branch/folder inputs | cancel without clearing inputs |
| brand review | 브랜드 기준 초안을 만들고 있습니다 | imported source | cancel to source review |
| Studio | 선택한 형식을 만들고 있습니다 | idea, campaign, selected channels | cancel; keep completed formats |
| publish | 계정에 요청을 전달했습니다 | exact item and request time | do not retry; open result check |
| analytics | 채널 결과를 새로 확인하고 있습니다 | previous collected values and time | cancel; keep previous snapshot |

### Empty

| location | explanation | primary action | exit |
|---|---|---|---|
| no workspace | 아직 관리할 브랜드가 없습니다 | workspace 만들기 | sign out |
| no brand source | 참고할 브랜드 자료가 없습니다 | 6문항으로 시작 | Studio limited mode |
| import no Markdown | 선택한 범위에 Markdown이 없습니다 | folder change | paste, six questions, Home |
| no campaign | 현재 campaign이 없습니다 | brief 만들기 | Studio quick idea |
| no draft | 아직 만든 content가 없습니다 | Studio 열기 | Home |
| no approval | 검토할 content가 없습니다 | Studio에서 초안 만들기 | Calendar |
| no result | 게시 결과가 아직 없습니다 | Queue 확인 | Studio, Calendar |
| no performance | 수집된 성과가 없습니다 | published result 확인 | next content without learning claim |

### Error and edge paths

1. **Google login cancelled** → explain no account was connected → retry or public landing.
2. **Auth callback error** → preserve intended workspace → retry with account chooser or sign out.
3. **Workspace creation validation** → highlight name issue → correct or choose existing.
4. **Workspace access removed** → switch workspace or request owner access → no data reveal.
5. **Repository not found** → distinguish repository/branch and private access → edit or reconnect credential.
6. **Unsupported GitHub Wiki clone** → explain normal repository Markdown requirement → open migration guidance, paste, or six questions.
7. **Folder outside scope** → show valid paths → select folder or whole-repository Markdown.
8. **No Markdown anywhere** → paste or six questions.
9. **Partial import** → keep successful documents → retry failed files or continue with coverage warning.
10. **Stored credential cannot decrypt** → no raw secret → save credential again or contact operator.
11. **Source conflict** → show both statements and filenames → select one, narrow claim or mark unresolved.
12. **Source stale** → refresh, continue without source, or cancel.
13. **AI brand draft unsupported** → source gap beside field → edit, remove or add evidence.
14. **Brand confirmation revoked** → dependent campaign marked needs review → compare changes or retain previous confirmed version.
15. **Campaign missing objective** → highlight one desired result → add it or quick idea fallback.
16. **Too many channel choices** → show recommended group and `모두 보기`; preserve expert shortcut and manual choice.
17. **Content generation partial** → completed text/photo/video remains → retry only missing format.
18. **Image generation unavailable** → use current card-news editor or upload to Images; text and video stay preserved.
19. **Video rights unknown** → block publish, allow draft/export → add rights evidence or choose owned media.
20. **Channel unsupported media** → disabled card names requirement → change media or exclude channel.
21. **Account not connected** → draft preserved → open owner connection and return.
22. **Account mismatch after OAuth** → show current versus returned account → retry chooser or keep current.
23. **Permission missing or expired** → list needed permission → reconnect or save draft.
24. **Approval rejected** → reason visible → edit in owning editor and resubmit.
25. **Approval expired after edit/time change** → retain prior history → select new time and resubmit.
26. **Schedule in past or timezone ambiguous** → show workspace and local time → correct or save draft.
27. **Immediate publish confirmed failed** → retry available only after no external publish is confirmed.
28. **Publish response timeout** → uncertain state → provider result check; retry disabled.
29. **External publish succeeded, internal record failed** → repair state → restore record only; no external call.
30. **Bulk partial** → success items locked with links; confirmed failures editable; uncertain items check-only.
31. **Provider permalink unavailable** → show external item identity and recheck → never fabricate a URL.
32. **Analytics permission missing** → reconnect or open native platform; previous snapshot stays timestamped.
33. **Metric definition changed** → mark break in comparability → start new period; no trend line across break.
34. **Insufficient learning evidence** → say no reliable pattern yet → draft a hypothesis-free next idea.
35. **Proposal dismissed** → store preference only if supported; return to performance or blank idea.
36. **Network offline** → local edit preserved where available → retry sync or copy text.

## Dead-end audit

Every route provides at least one task action and one safe exit.

| owner | task action | safe exit |
|---|---|---|
| public/login | continue or retry | public landing |
| workspace | select/create | sign out |
| brand source | import/setup/paste | Studio limited mode, Home |
| product wiki target | save/review/version/rollback or choose a current fallback | Home |
| brand review | edit/confirm | source choice |
| campaign | confirm | Studio quick idea, Home |
| Studio | save/review/publish/schedule | Home, owning channel |
| Inbox | approve/reject/edit | Studio, Calendar |
| Calendar | edit/cancel/open item | Studio, Queue |
| Videos | process/review/result | Studio, Home |
| result index | open permalink/owner | performance, Studio |
| performance | inspect/propose next | result index, Studio |
| disabled provider | settings or external owner | Home |
| operator | inspect/recover | role exit |

Dead-end count by specification: **0**.

## 26 navigation destination manifest

1. `/` 성과
2. `/studio` OSMU Studio
3. `/inbox` 승인 인박스
4. `/calendar` 발행 캘린더
5. `/channels/threads`
6. `/channels/x`
7. `/channels/instagram`
8. `/channels/facebook`
9. `/channels/bluesky`
10. `/channels/telegram`
11. `/channels/discord`
12. `/channels/slack`
13. `/channels/youtube`
14. `/channels/tiktok`
15. `/blog-performance`
16. `/search-console`
17. `/google-analytics`
18. `/keyword-planner`
19. `/search-advisor`
20. `/naver-trends`
21. `/google-trends`
22. `/blog`
23. `/images`
24. `/videos`
25. `/channels/midjourney`
26. `/settings`

## Semantic acceptance scenarios

1. First user can reach a current fallback from new-wiki target without false save.
2. Existing-wiki import names the supported normal GitHub repository and unsupported Wiki clone.
3. Studio DOM order is text before photo/card before video.
4. Sidebar order is Social posts → Messaging → Social short video, and Messaging is default OFF.
5. Per-platform edit occurs before publish decision.
6. Individual and bulk publish/schedule are both represented.
7. Queue, Calendar and Videos retain the same title/revision.
8. Success exposes a result link; uncertain blocks retry; repair avoids external repost.
9. Overall performance contains only comparable operational totals.
10. Native channel metrics show definition/source/period/account/collected time.
11. Learning proposal cites an observation and remains editable/dismissible.
12. Customer internal jargon count is zero.
13. Operator customer-shell nodes are absent.
14. All 26 navigation routes render a page with a safe exit.
15. 390, 1024 and 1440 share the same semantic order and control labels.

## Red team

Attack: `The guided path can trap experts and makes setup feel mandatory.`

Revision: every guided screen includes Home/Studio exit, the full 26-menu shell remains available, and returning users inherit the last confirmed brand/campaign with visible change controls.

Attack: `The system can manipulate users into publishing AI output.`

Revision: publish and Messaging defaults are OFF, generated strategy stays a draft, evidence gaps remain visible, per-platform editing precedes approval, and uncertain outcomes disable retry.

## Self-question

**If this is a simple publishing tool rather than a marketing agency, what is missing?**

A strategic brief, source-based creative reasoning, a campaign-level result index and a learning-to-next-proposal path would be missing. These are now explicit steps with exits and truth boundaries. Persistence for new wiki, campaign and learning is still target-only and must be reopened upstream before build.

## 회수 필요

- ⛔ 회수 필요: new wiki, campaign, unified result index and learning persistence need plan/eng-design ownership.
- ⛔ 회수 필요: external OAuth, publish, permalink and analytics behavior requires live provider verification.
- ⛔ 회수 필요: browser runtime must confirm 26/26 clicks and no horizontal page overflow at 390/1024/1440.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `Insufficient evidence can fall back to a hypothesis-free next idea.` 이유: 실제 generation policy owner가 아직 정의되지 않은 target behavior다.
SOURCES: `DESIGN.md` v18; current `wiki/product/marketing-hub-surface-map.md`; `wiki/reference/brand-grounding.md`; current login, workspace, Studio, BrandSetupWizard and RepoConnect source; https://support.buffer.com/article/665-managing-and-approving-draft-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://www.hootsuite.com/whats-new/document-external-approvals; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://www.canva.com/learn/using-canva-content-planner-social-content/; https://knowledge.hubspot.com/blog/repurpose-content-using-ai-with-content-remix; https://knowledge.hubspot.com/campaigns/create-campaigns; https://www.notion.com/help/import-data-into-notion; https://www.nngroup.com/articles/ten-usability-heuristics/; https://pair.withgoogle.com/guidebook-v2/chapter/explainability-trust/; DOI 10.1086/500480; DOI 10.1126/science.1091721; DOI 10.1086/651235
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for the reviewable brand basis / openclaw-creative-brief for flow inputs, negative constraints, state and validation matrices / gstack design-review for APP UI hierarchy, accessibility and anti-slop review
SKILLS_SKIPPED: imagegen because no new raster asset is required; Product Design plugin not installed or explicitly requested

## FINAL M14 고객 언어 flow

```text
internal immutable record
  cmp_ / cnt_ / rev_ / pub_ / ext_ / exp_
  → presentation adapter
  캠페인명 / 작업물 종류 / 수정 번호 / 요청 시각 / 채널·상태 / 비교 이름
  → customer journey
  Studio → Inbox → Calendar → Platform → Results → Next experiment
```

Happy: 고객은 `가을 신규 고객 안내 · 수정 7`을 기준으로 편집하고, 채널과 요청 시각을 확인하며, 결과 상태를 연 뒤 `첫 문장 구체성 비교`를 다음 초안에 적용한다. 적용 뒤 표시는 `수정 8`, 취소 뒤 표시는 `수정 7`이다. 내부 source/result ID는 같은 레코드 연결에만 사용한다.

Loading/empty/partial: 현재 캠페인명, 계정 표시명, 수정 번호를 보존한다. 고객은 원시 preserved key가 아니라 “그대로 유지했습니다” outcome과 다음 안전 행동을 본다.

Permission/error: 필요한 계정과 범위, 유지된 초안, 재시도 가능 시점만 표시한다. 오류 코드, 저장 필드명, 내부 prefix는 표시하지 않는다. Home과 현재 항목 열기가 항상 exit다.

Uncertain/repair: `오늘 15:48 요청 · 결과 확인 중`으로 같은 요청을 식별한다. 재게시하지 않고 같은 외부 결과를 확인하거나 내부 기록만 복구한다. dead-end 0, duplicate publish 0.

Result/experiment edge: 결과 행 reorder 뒤에도 내부 external ID로 올바른 상세를 열되 accessible name은 `Instagram Reels 게시 결과 상세`다. 다음 실험은 source IDs 대신 `Instagram Reels · 게시 확인 · 저장 42 + Threads · 게시 확인 · 답글 8`을 보여준다.

검증: 26 routes + 14 steps + dialogs + brand-source states + Settings8 + video states + 48 recovery 전후 + 12 matrix 중 고객 표면을 합산한 157개 customer-language surface에서 raw prefix와 정의되지 않은 구현 용어가 0건이다. 전체 JSDOM 338 assertions, failures 0.

### Red team과 셀프심문

공격: 사람이 읽는 이름이 중복되면 잘못된 결과를 열 수 있다. 방어: 화면은 이해 가능한 이름을 쓰지만 클릭과 복구는 불변 data ID로 연결하고 reorder fixture로 같은 결과를 확인한다.

이 flow가 틀렸다면 가장 그럴듯한 이유는? 실제 현지화 시각 문자열이 길어져 모바일 레이아웃이 달라지는 경우다. 최종 독립 리뷰에서 새 카피의 390px 렌더를 확인하기 전 governing gate를 자가 승인하지 않는다.

⛔ 회수 필요: independent reviewer가 M14 customer-default 12 screenshot sweep을 최종 판정해야 한다.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: 요청 시각 예시는 prototype-local이며 production timezone formatting 증거가 아니다.
SOURCES: `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.json`; https://media.nngroup.com/media/articles/attachments/Heuristic_2_compressed.pdf; https://design-system.service.gov.uk/components/error-message/; https://m3.material.io/foundations/interaction/states/overview
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for user-facing naming / openclaw-creative-brief for happy-edge-empty-error-loading and negative constraints / gstack design-review for dead-end and responsive audit
SKILLS_SKIPPED: imagegen because no raster asset is required / Product Design plugin was not installed or explicitly requested

## Interaction retake evidence

The clickable v18 retake now preserves one local work identity through this path:

work #2047 / revision 7 → platform variant → approval → schedule → result row → one-variable proposal → revision 8.

- Journey input survives arbitrary jumps at steps 2, 4, 6 and 10.
- Source step supports clickable GitHub scope, six questions, paste/bundle states and the target product-wiki lifecycle.
- Studio retains existing preview7 and direct4, while platform variants cover Social5 and video3.
- Bulk review renders eight account rows, four ready, two approval-required and two excluded with reasons; deselection changes the count.
- Schedule change expires approval; cancellation leaves the same item as a draft.
- Result index contains three platform results with the same campaign/revision; uncertain result has no retry.
- Customer Settings8, Operator Admin9 and owner-aware recovery fixtures remain role-separated.

Non-GUI DOM test result: all assertions passed.

Parent final Chrome QA observed console errors 0, 12/12 role/theme/viewport combinations, 26/26 destinations, campaign14/14, Studio order 1/2/3, overflow 0, mobile drawer26 with close, wiki save v4, operator customer-shell nodes0 and Admin9/9 owner transitions. Both `.qa-tools` and `#qa-restore` are hidden in every default screenshot; visible `검수` controls are 0. Inspector access is explicit non-product opt-in only. This is parent-observed browser evidence; external behavior remains pending.

## M09 stable lineage flow

```text
Studio cmp_fall_launch_2026 / cnt_2047 / rev_7
  → Inbox same identity
  → Calendar same identity
  → Platform queue same identity / pub_0071
  → Results library ext_ig_8801
  → Result detail selected by ext_ig_8801, never array position
  → Next experiment exp_hook_specificity_01
      source_result_ids = ext_ig_8801 + ext_th_8802
      changed_variable = 첫 문장의 구체성
      held_constants = 이미지 + 게시 시간 + 행동 안내
      apply → rev_8
      undo → rev_7, applied revision removed
```

Edge path: if result rows reorder, the clicked `external_result_id` still opens the matching result and publish attempt. Empty metric stays “아직 값 없음,” not zero. Uncertain result routes to same-request verification; it never creates a new publish attempt.

## M13 owner recovery flow, dead-end 0

Each owner supports the same six state names but a different safe transition and preserved account context:

| owner | preserved context | loading | empty | partial | permission | uncertain | repair |
|---|---|---|---|---|---|---|---|
| Home | `cnt_2047 · workspace:monostudio · rev_7` | keep summary | reopen item | inspect missing summary | workspace access | hold published count | rebuild local summary only |
| Studio | `cnt_2047 · @monostudio · rev_7` | keep editor | open current draft | retry missing family | reconnect required asset | freeze publish | restore edit record only |
| Inbox | same account/revision | keep note | open current review | inspect undecided row | request reviewer scope | keep approval pending | restore review record only |
| Calendar | same account/revision | keep time | open current schedule | retry missing slot | reconnect calendar scope | keep slot, no repost | restore schedule record only |
| Platform | same account/revision | keep queue | open current row | retry failed channel only | reconnect that account | check same attempt | reconcile result only |
| Results | same account/revision | keep last snapshot | open current result | refresh missing metric only | reconnect read scope | check same external ID | link external result only |
| Settings | workspace account/revision | keep settings | open current connection | retry failed test only | reconnect requested scope | keep existing credential | restore metadata only |
| Operator | `cnt_2047 · operator:admin-01 · rev_7` | keep audit view | open support record | retry failed internal check | reauthenticate operator | inspect same external attempt | record-only repair |

For every cell: state card → owner-specific action → success outcome on the same owner. `data-preserved-id` before and after must match. Home remains an exit, but never the only action. Permission opens only the required scope; uncertain and repair cannot dispatch externally.

## M14 interaction and responsive verification flow

```text
for role in customer, operator
  for theme in light, dark
    for viewport in 1440, 1024, 390
      render owner shell
      assert root role/theme/viewport
      collect every button/input/select/textarea/link
      assert accessible name
      assert registered non-generic handler
      assert focus-visible contract
      assert browser target rectangle ≥ 44×44
      assert computed foreground/background contrast ≥ 4.5:1
      at 390, assert visible video horizontal-scroll cue
```

Final non-GUI run: 12/12 combinations, 338 assertions and 48 owner-state fixtures passed with failures 0. The customer-language sweep covered 157 rendered surfaces with raw identifier hits 0 and undefined implementation-jargon hits 0. Independent v4 already recorded the 12-combination browser/contrast/target/overflow PASS; final governance now requires its post-copy M14 re-review.

### Final dead-end audit

- Happy: source → Studio → approval → schedule/publish → result → experiment → next draft or Home.
- Loading: preserve and cancel/keep last view.
- Empty: create/open current item or exit.
- Partial: successful subset remains; retry only missing subset.
- Permission: preserve item; connect only required scope; return to same owner.
- Uncertain: no retry; verify same attempt/result; exit to owner/Home.
- Repair: no external repeat; repair internal record; show outcome.
- Error classes outside the six displayed fixtures route through partial, permission, uncertain or repair according to whether work succeeded externally; no generic reset exists.

⛔ 회수 필요: independent reviewer must rerun M14 against the final customer copy before the design stage can close.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: `Error classes route through four recovery states.` 이유: adapter-specific error classification still belongs to engineering and provider QA.
SOURCES: `DESIGN.md` v18 FINAL M14 customer-language contract; `tasks/marketing-agent-design-v18-independent-review.output`; `/private/tmp/marketing-v18-static-dom-qa.json`; https://media.nngroup.com/media/articles/attachments/Heuristic_2_compressed.pdf; https://design-system.service.gov.uk/components/error-message/; https://m3.material.io/foundations/interaction/states/overview
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for evidence-led product tone / openclaw-creative-brief for happy, edge, empty, loading and recovery contracts / gstack design-review for responsive and accessibility flow audit
SKILLS_SKIPPED: imagegen because this flow requires no raster asset / Product Design plugin was not installed or explicitly requested
