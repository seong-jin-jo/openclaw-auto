# Marketing Agent v24 design review

> STAMP: created_at=2026-08-12 02:49 KST | model=gpt-codex/gpt-5.6 | reviewer=product-designer self review | skill=gstack design-review v2.0.0 read and applied where compatible | scope=v24 prototype, DESIGN.md, wireframes, user flow

## Status

DONE_WITH_CONCERNS

## 2026-08-28 QA 보수 결과

이 문서의 지적을 현재 확정 요구와 실제 코드에 다시 대조했다. 위험도는 기본 흐름과 진실원,
시각 일관성, 증거 순으로 정렬했다. 이 감사에는 돈 손실과 작업 공간 격리 침해 지적은 없었다.

| 지적 | 결과 | 근거 |
|---|---|---|
| FINDING-001 | 최신 R150 채널 탭 계약을 보존했다. 더 오래된 플랫폼별 탭 삭제안은 superseded라 적용하지 않았다. R201의 `지금 여기` 문구는 제거했다 | 네 방 4개 x 4폭 실제 클릭, channel capability 7건 |
| FINDING-002 | 성과실 아래 레거시 패널을 제거하고 `PerformanceRoom` 한 벌과 인라인 온보딩만 남겼다 | 실제 앱 3폭에서 성과실 1건, 레거시 문구 0건 |
| FINDING-003 | 기존 본문과 편집 줄 복원 구현을 실앱 회귀로 고정했다 | 저장 본문 표식 3폭 복원 |
| FINDING-004 | 현행 디자인 토큰 구현을 재검증했다 | design lint 위반 0건 |
| FINDING-005 | 운영자 OAuth accordion 기본 접힘을 재검증했다 | API와 DOM 12개, 기본 펼침 0개 x 3폭 |
| FINDING-006 | 없는 provider 두 개를 만들지 않았다. UI는 API의 등록 목록 12개를 사용하며 고정 `14개` 주석을 제거했다 | OAuth API 12개와 DOM 12개 일치. 14개가 필요하면 상류 제품 결정 필요 |
| FINDING-007 | prototype이 R-06을 `설계 목표`로 표시하므로 실제 기능처럼 코드에 옮기지 않았다 | `data-r06-summary=target` 확인 |
| FINDING-008 | 승인 prototype과 실제 앱 캡처를 저장했다 | `docs/prototype/qa-v24-remediation/` |

v24 audit의 재현 범위는 PASS다. 다만 네 방 전체 승인 v63 정합은 별도 전체 행렬이 NG라 design
gate는 승인하지 않는다. 전체 판정과 증거는
`docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`를 따른다.

v24는 정적 기준에서 B+ candidate다. gstack design-review의 live workflow는 실행하지 않았다. 이유는 두 가지다.

1. 사용자가 결과 파일을 open하지 말라고 명시했다. design-review는 screenshot을 모든 finding의 필수 증거로 요구한다.
2. worktree에 다른 세션의 미커밋 변경이 있다. design-review는 시작 전 clean tree와 finding별 commit을 요구한다. 이 세션은 사용자 변경을 commit 또는 stash하지 않는다.

따라서 아래 등급은 source와 contract 기반 정적 판정이며 실제 렌더 등급이 아니다.

## Classifier

APP UI. workspace, data, settings, admin 중심이며 landing page 규칙은 적용하지 않는다.

## Baseline과 final candidate

| score | v23 baseline | v24 static candidate |
|---|---:|---:|
| Design Score | C | B+ |
| AI Slop Score | C | A- |

v23 baseline은 `docs/audit/v23-codex-crosscheck.md`의 재창조, 간격 이탈, 모바일 압착 판정을 사용했다.

## Litmus checks

| check | result | evidence |
|---|---|---|
| 제품 식별 가능 | YES | persistent Sidebar와 OpenClaw header |
| 강한 시각 anchor | YES | Studio visual7 preview, Home 운영 성과 block |
| heading scan만으로 이해 | YES, static | owner route별 실제 작업 이름 |
| section당 한 job | YES | Home operations, R-06 target, provider accordion 분리 |
| card 필요성 | MOSTLY YES | metric과 provider는 interaction boundary, 장식 카드 제거 |
| motion이 hierarchy 개선 | NO | motion 없음. APP UI에서 blocking issue는 아님 |
| shadow 없이 premium | YES, static | hierarchy가 type, spacing, border에 의존 |

Hard rejection: 0. Home의 dashboard card mosaic를 한 operations block으로 교정했다.

## Findings and fix loop

### FINDING-001, high, actual route fidelity

I notice v23이 채널마다 Create와 Calendar를 만들고 Admin을 10탭으로 재구성했다. 사용자는 실제 제품과 prototype에서 다른 navigation을 학습한다.

Fix status: best-effort.

수정:

- Threads: Queue, Analytics, Growth, Popular, Settings.
- Instagram: Queue, Editor, Settings.
- generic social: Queue, Analytics, Settings.
- Admin: token login 뒤 customers single page.
- signup: `/signup -> /login -> Google OAuth`.

Evidence: `window.__V24_MANIFEST__.actualRouteCorrections`, `data-added-tabs="none"`.

### FINDING-002, high, Home density

I notice 네 패널이 같은 정보를 다른 제목으로 반복해 사용자가 첫 행동을 고르기 어렵다.

Fix status: best-effort.

수정: metrics, performance, recent activity, channel status를 `data-home-panels="1"`인 한 operations block으로 묶었다. desktop 4 metric columns, tablet 2, mobile 1이다.

### FINDING-003, high, draft body continuity

I notice draft history가 idea와 status만 보여 body가 없을 때도 “불러오기”를 허용했다. 사용자는 빈 편집기로 이동한다.

Fix status: best-effort.

수정: draft fixture에 body를 필수로 추가했다. body missing은 load disabled다. body load는 공통 초안을 채우고 수정과 발행으로 이어진다.

### FINDING-004, medium, design token drift

I notice v23 source에 inline style 73개와 4, 8, 10, 12, 14, 16, 18, 20, 24, 32, 48, 64 spacing이 섞였다.

Fix status: verified by static audit.

수정:

- inline style 0.
- spacing 4, 8, 12, 16, 24, 32, 48.
- font sizes 12, 13, 15, 17, 20, 24.
- em dash와 en dash 0.

### FINDING-005, medium, Admin progressive disclosure

I notice provider form을 모두 펼치면 scroll pressure가 실제 customer and workspace 판단을 밀어낸다.

Fix status: best-effort.

수정: provider summary에 label, fields, readiness를 두고 native `details` body에 callback과 credential set action을 넣었다. default collapsed, prototype 설명용 첫 provider만 open이다.

### FINDING-006, high, brief and code drift

I notice R02가 14개 form이라 말하지만 현재 `OAUTH_CREDENTIAL_DEFINITIONS`는 12개다. 두 provider를 짐작해 만들면 R-03 재창조가 재발한다.

Fix status: deferred to plan.

조치: prototype은 12개만 표시하고 `__V24_MANIFEST__.briefDiscrepancy`, DESIGN.md, wireframe, user-flow에 회수 항목을 남겼다.

### FINDING-007, medium, R-06 current and target confusion

I notice 정책과 AARRR이 Home에 들어가면 아직 없는 Revenue와 Referral을 현재 기능으로 오해할 수 있다.

Fix status: best-effort.

수정: R-06 block에 `설계 목표`와 `현재 Home 코드에는 미구현`을 고정했다. current와 target을 별도 줄로 표시했다.

### FINDING-008, medium, live visual evidence

I notice static CSS와 manifest는 reflow와 contrast를 직접 증명하지 못한다.

Fix status: deferred by user instruction.

필요 증거: customer and operator, light and dark, 1440 and 1024 and 390 screenshots, computed contrast, 44 target, overlap, page overflow, focus-visible.

## Category grades

| category | grade | reason |
|---|---:|---|
| Visual hierarchy | A | Home one block, owner route hierarchy |
| Typography | A- | systematic 6 sizes, body 15 inherited from DESIGN.md |
| Spacing and layout | A- | token-only static, live reflow pending |
| Color and contrast | B+ | semantic tokens, computed contrast pending |
| Interaction states | A- | empty, loading, error, excess contracts present |
| Responsive | B | CSS contracts present, screenshots forbidden |
| Content quality | A- | current and target labels, utility copy |
| AI Slop | A- | invented cards and future IA removed |
| Motion | B | no ornamental motion, no transition evidence |
| Performance feel | B | static artifact, runtime perf not applicable |

Weighted static candidate: B+.

## Quick wins already applied

- Home four panels to one operations block.
- Admin forms to accordion.
- draft body excerpt and safe load.
- inline style removal and spacing cleanup.
- current versus target label on R-06.

## Red team

공격: “정책과 AARRR을 넣느라 다시 설명 문서 같은 Home이 됐다.”

수정: 운영 성과와 R-06을 다른 block으로 나누고 target badge를 붙였다. release UI로 자동 승격하지 않는다.

## Self question

이 판정이 틀렸다면 가장 그럴듯한 이유는 390에서 Home metrics와 AARRR이 지나치게 길어지고 Admin accordion body의 callback이 화면 폭을 밀어내는 것이다. CSS는 1 column과 `overflow-wrap:anywhere`를 선언했지만 실제 screenshot이 없어 verified라고 부르지 않는다.

## Next gate

design stage artifact set은 존재한다. 다만 `/approve design` 전 조건은 두 개다.

- 14 versus 12 provider gap의 plan decision.
- 사용자 지시가 허용하는 시점에 live design-review screenshot audit.

SOURCES: `/Users/sj/.claude/skills/gstack/design-review/SKILL.md` | `docs/audit/v23-codex-crosscheck.md` | `docs/prototype/v24-brief.md` | `dashboard/src` | `DESIGN.md`

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack design-review v2.0.0 instruction contract, classifier, litmus, hard rejection, category scoring, triage

SKILLS_SKIPPED: screenshot, browser, commit, outside voices. 사용자 no-open 지시와 dirty shared worktree 때문에 full workflow 차단
