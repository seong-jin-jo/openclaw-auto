-
## 🔴 Codex 인계 요약 (2026-08-28 22:30, Claude 컨트롤러 토큰 소진으로 세션 교대)

**이어받는 세션이 가장 먼저 읽을 것: `session-state.osmu.md`. 이 파일은 단계·승인 이력이고, 그쪽이 지금 무엇을 할지다.**

### 지금 위치
- `current_stage: qa`. 0.2.0 **병합 요청 26번**이 열려 있고 회장 병합 대기다.
- 가지 `feat/design-system-and-missing-features`, `origin/main` 대비 117 커밋 앞섬.
- **병합과 운영 배포는 회장 몫이다. 세션이 `gh pr merge` 나 배포 워크플로를 실행하지 마라.**

### Claude 컨트롤러가 직접 검증한 것 (워커 주장 아님)
| 항목 | 결과 |
|---|---|
| 운영 빌드 | 성공, 정적 경로 174개 |
| 빈 DB 에 schema.sql + 마이그레이션 6개 순차 적용 | 성공, 테이블 24개 |
| 기본 흐름 `verify-basic-flow-e2e.mjs` | 11/11 |
| studio 계약 `verify-studio-v1-e2e.mjs` | 12/12 |
| 무료 몫 시간대 공격 | 몫 1회만 지급(막힘) |
| 네 방 화면 `probe-four-room-flow.mjs` | 성과실 도달 가능, 가린 모달 0 |
| 전체 시험 | 186파일 1,329건 통과, 실패 0 |

### 남은 블로커
1. 릴리스 담당 판정이 **"배포 승인 전"**. 사유는 디자인 정합 NG 유지 + 설계 산출물 4건(design spec·FDD·API 계약·ERD) 미산출. **컨트롤러 판단은 병합 권고**였다(회장이 직접 쓰며 고치겠다는 목적에는 충분).
2. **실채널 발행과 provider 댓글 읽기 미검증.** 계정 로그인 필요, 회장 몫. 세션 물리 불가.
3. **디자인 픽셀 대조 미실시.** 시안 렌더와 dev 실화면 2장을 나란히 Read 해서 판정해야 한다(design-qa-pixel-gate 훅 요구). 이 판정 없이 "시안과 일치"라고 말하지 마라.

### 운영 설비 (Codex 세션이 그대로 이어 쓰면 된다)
- 감독 `scripts/osmu-supervisor.sh` 가동중, 동시 6명. 죽으면 cron `osmu-supervisor-guard.sh` 가 5분 안에 되살린다.
- 백로그가 비면 `scripts/refill-backlog.sh` 가 자동 충전한다. 미처리 검수 지적 문서를 수정 판으로 만들고, 없으면 상시 점검 4종을 회전으로 넣는다.
- 상태표 `docs/plan/osmu-backlog-state.tsv`, 판 목록 `docs/plan/osmu-backlog.tsv`, 프롬프트 `docs/plan/backlog-prompts/`.
- 멈추려면 `touch /tmp/osmu-supervisor.stop`. 그 표식이 있으면 cron 도 되살리지 않는다.
- **멈춤 원인 네 층을 순서대로 제거했다.** 컨트롤러가 회수만 기다림 → 감독이 백로그 비우고 종료 → 백로그 충전이 사람 손뿐 → 자리가 남아도 전부 비어야만 충전. 같은 증상이 또 나오면 다섯째 층을 찾아라. 감독을 껐다 켜는 것으로 끝내지 마라.

### Codex 가 이어서 할 일 (우선순위)
1. 회장이 병합하면 배포 결과를 확인하고 배포 환경에서 기본 흐름을 다시 돌린다.
2. 시안 대 실화면 픽셀 대조로 디자인 정합을 판정한다.
3. 감독이 돌리는 판의 회수분을 §9.2대로 **직접 재현 검증**한다. 워커가 통과했다고 적은 문장을 근거로 쓰지 마라.
4. 회장이 쓰면서 지적한 것을 백로그에 넣어 감독이 처리하게 한다.

-
## ⚠️ 코드 쓰기에 대한 판정 (2026-08-27, 컨트롤러)

**아래 stages 표의 `build: pending` 을 이유로 소스 작성을 멈추지 마라.** 워커가 이 표를 코드 작성 허가로 오독해
회장 지시 3회에도 studio 코드가 0줄이었다.

`~/.claude/CLAUDE.md` §2: **"소스 쓰기는 단계와 무관하게 항상 허용된다"**(2026-07-22 회장 결정으로 차단 코드 제거).
- **항상 허용**: 소스·테스트·스크립트 작성과 수정, 로컬 실행
- **회장 합의 필요(§6.3.5)**: 새 DB 테이블·컬럼, 마이그레이션, 기존 API 계약 변경, 아키텍처 결정
- stages 표의 status 는 **산출물 승인 이력**이지 코드 작성 허가가 아니다.

--
# pipeline-state.md. Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: qa                   # 2026-08-29 dashboard 읽기 API 전수 실사 진행.  # plan|design|eng-design|build|qa|ship
approved_stages: [plan]
approved_artifacts:
  # ── 2026-08-18 갱신 (회장 지적: 디자인 위임 입력이 pipeline-state에 정의돼 있는데 컨트롤러가 안 따랐다) ──
  # design.input_artifacts(stages.yaml) 규정대로 여기 핀된 경로·버전이 위임 프롬프트에 자동 주입돼야 한다.
  prd:            { version: 8.2.1, path: docs/prd-openclaw-service-v8.2.1-gpt-codex.md, sha256: cc7e62caed5731c11761100a3fc38718af75b127243ba349798f12640c3af50f }
  requests_ledger:{ version: 2026-08-18, path: docs/requests/회장-확정-요구사항-대장.md, sha256: 0a3b953eec3704b2e1ef1089070ab08193f763726b7498ba25c92009bc54b0ab }
  request_0817:   { version: 2026-08-17, path: docs/requests/2026-08-17-회장-4실-구조-구상.md, sha256: fbd735c73ff2dffff401874ebcf5466b2a7001f3dc768a3c9a5160caf5c8d6a4 }
  request_0816:   { version: 2026-08-16, path: docs/requests/2026-08-16-회장-유저플로우-전면개정.md, sha256: def4f2aba9bc161b40c532ca9199051b354af4d580fd8373e2e25f5b5637eeb7 }
  design_system:  { version: v18, path: DESIGN.md, sha256: 2ba0dc85ffea620f5101ea849be1b83bc6137103cede9b856b5a7bae33285008 }
  prototype:      { version: v38, path: docs/prototype/openclaw-auto-4room-v38.html, sha256: ffb35daa956eacfd1576cc06d3487381b2536533b0ebd4da89d57624e48b81ce }
  impl_sidebar:   { version: HEAD, path: dashboard/src/components/layout/Sidebar.tsx, sha256: ff16754895641fa8b06914730b1f934ac08c99f76505925d8b00ee3e0cec2cf9 }
  impl_channel:   { version: HEAD, path: dashboard/src/components/channel/, sha256: 디렉터리 }
  channel_contract:{ version: v1, path: docs/design-docs/channel-capability-and-readiness-contract-v1-opus.md, sha256: 86598422708e255acc2c72ef679ac1c113b658555a2c2f9780f0364777414271 }
  layer_contract: { version: v1.0, path: docs/학습정보-층계-계약-v1.0.md, sha256: fa333374871bbb5d11760b28f4bf039f40380e472efa7671dba5f3442eb9b237 }  # 회장 확정 2026-08-21. 두 서비스 공통 계약. design/eng-design 위임 시 반드시 주입
  boundary_wiki:  { version: 2026-08-15, path: wiki/architecture/two-service-boundary.md, sha256: e839f3f358319f0727812ab63eb44e0a6fd19b45a04e479ae0565c19f8c74da0 }
  impl_screens:   { version: v24, path: docs/prototype/qa-v24/, sha256: 디렉터리 }
  # ── 구판(2026-08-07 plan 승인 당시). 이력 보존용, 위임 주입 대상 아님 ──
  prd_legacy:     { version: 7.3.5, path: docs/notes/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md }
stage_artifacts:
  # ── design 단계 산출물 현황 (2026-08-18 신설. 회장 "이건 어느 파이프라인 단계에서 만든 어떤 산출물이냐" 지적) ──
  # stages.yaml design.artifacts 목록 대비 실제 산출 여부. 승인 전이므로 approved_artifacts와 별도.
  design:
    user_flow:    { path: docs/user-flow.md, status: 산출완료-미승인, 비고: "PRD 빈틈 17개(막힘 6) 미해소" }
    prototype:    { path: docs/prototype/openclaw-auto-4room-v63.html, status: 산출완료-미승인, 비고: "2026-08-27 v63. 사족을 성질로 세는 계약 신설 후 실축소(니다</small> 22→6, 니다.</small> 9→3, 니다</p> 8→3, 나갑니다 10→0). 채널톡 공식문서 3곳 실조사(버튼 56/44px·라벨 막대·새 메시지 시 라벨 축소)로 launcher 재설계, 접으면 오른쪽 칸 통째 사라져 320px 디스플레이 확보(v62는 252px). rt62-w 제거(작업물 제목 29곳 반복 해소, 성과실 머리 정상화). 캐러셀 화살표 표적/여백 분리, 첫·끝 장 화살표 미표시(정본 동작). 방 전환 모션 0.2s. 상시원칙 102/102 + 정본 리터럴 11/11. Design Score A-. 미해소: 1440 접힌 launcher가 미리보기 우하단 덮음" }
    prototype_v43:{ path: docs/prototype/openclaw-auto-4room-v43.html, status: 산출완료-구판 }
    prototype_v40:{ path: docs/prototype/openclaw-auto-4room-v40.html, status: 산출완료-구판 }
    design_system:{ path: DESIGN.md, status: 산출완료-미승인, version: v29, 비고: "v55 기준. OSMU 벽 규칙·편집 3층 규칙 추가" }
    wireframes:   { path: docs/WIREFRAMES/openclaw-auto-display-v43-gpt-codex.md, status: 산출완료-미승인 }
    design_spec:  { path: docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md, status: 산출완료-미승인, sha256: 81477fc54be5e179b72f052b1b780a310e436c6995b650ec56f296e7e26a7b82, 비고: "품질 검증 PASS. 최신 main 12화면 matched-pair 재촬영과 독립 design-review 전이라 승인 불가" }
    rendered:     { path: docs/rendered/, status: 열람용 렌더뷰. 산출물 아님(원본은 위 md) }
  eng-design:
    # 2026-08-22 실제 산출 확인. 승인 산출물 핀이 아니라 studio 라인의 미승인 기술설계 현황이다.
    fdd_v3:       { path: studio/docs/fdd-studio-생성-v3.0.md, status: 산출완료-재작업필요, 비고: "R85·R86 이전 전제인 층계 계약 v2.1 기반" }
    api_contract_studio: { path: studio/docs/api-contract-studio-생성-v2.0.md, status: 산출완료-재작업필요, 비고: "R85·R86 이전 전제인 층계 계약 v2.1 기반" }
    erd_studio:   { path: studio/docs/erd-studio-생성-v2.0.md, status: 산출완료-재작업필요, 비고: "R85·R86 이전 전제인 층계 계약 v2.1 기반" }
    test_plan_studio: { path: studio/docs/test-plan-studio-생성-v2.0.md, status: 산출완료-재작업필요, 비고: "R85·R86 이전 전제. 실행 결과 0건. 현재 NO-GO" }
    options:      { path: studio/docs/eng-design-studio-service-v0.1-선택지.md, status: 티키타카 입력물, 비고: "loop 1단계 options-and-tradeoffs 산출. artifacts 목록에는 없는 보조 문서" }
    fdd:          { path: "docs/fdd-*-v*.md", status: 미산출 }
    api_contract: { path: docs/api-contract.md, status: 미산출 }
    erd:          { path: docs/erd.md, status: 미산출 }
stages:
  plan:       { status: approved, artifacts_ok: true }       # ✅ APPROVED 2026-08-07 (PRD v7.3.5, critic n=26 MAJOR0)
  design:     { status: blocked, artifacts_ok: false } # 독립 리뷰 C+ BLOCK, 실제 화면 0/12. plan 승인 상태와 D-10 계약 충돌 회수 필요
  eng-design: { status: pending, artifacts_ok: false }
  build:      { status: in-progress, artifacts_ok: false }
  qa:         { status: pending, artifacts_ok: false }
  ship:       { status: pending, artifacts_ok: false }
override: true
override_reason: "회장 재지시 2026-08-12: 개별 코드 땜질 중단. 안 되는 것을 실측으로 파악(완료)→기획+프로토타입 한 장으로 종합→회장 승인→한 번에 코드 반영. 실측 근거=qa R-02 실측 2건, 이미 고친 3건(생성배너/홈정합/채널통합)은 수정 실증 자료. (2026-08-10 override 대체)"
override_expires: "2026-08-17 23:59 KST"
critic_cycles:
  - { n: 1, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v2.1-gpt-codex.md, major_findings: 5, resolved: true, chairman_qs: "asked=3 answered=3" }
  - { n: 2, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v2.3-gpt-codex.md, major_findings: 2, resolved: true, chairman_qs: "asked=3 answered=3" }
  - { n: 3, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v2.4-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "asked=3 answered=3" }
  - { n: 4, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v3.0-gpt-codex.md, major_findings: 7, resolved: true, chairman_qs: "explicit full-OSMU scope" }
  - { n: 5, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v3.1-gpt-codex.md, major_findings: 1, resolved: true, chairman_qs: "explicit execute" }
  - { n: 6, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v3.1-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "explicit execute" }
  - { n: 7, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.0.0-gpt-codex.md, major_findings: 7, resolved: true, chairman_qs: "explicit proceed" }
  - { n: 8, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.1.0-gpt-codex.md, major_findings: 1, resolved: true, chairman_qs: "explicit proceed" }
  - { n: 9, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.1.1-gpt-codex.md, major_findings: 1, resolved: true, chairman_qs: "explicit proceed" }
  - { n: 10, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "explicit proceed" }
  - { n: 11, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.2.0-gpt-codex.md, major_findings: 2, resolved: true, chairman_qs: "user-confirmed 8-card independent publish" }
  - { n: 12, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.2.1-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "user-confirmed 8-card independent publish" }
  - { n: 13, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.3.0-gpt-codex.md, major_findings: 2, resolved: true, chairman_qs: "preserve existing implementation then add requests" }
  - { n: 14, critic: plan-critic, artifact: docs/openclaw-auto-osmu-prd-v4.3.1-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "preserve existing implementation then add requests" }
  - { n: 15, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v6.0.0-gpt-codex.md, major_findings: 4, resolved: true, chairman_qs: "marketing-agent lifecycle explicitly confirmed" }
  - { n: 16, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v6.1.0-gpt-codex.md, major_findings: 1, resolved: true, chairman_qs: "execute without further approval" }
  - { n: 17, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v6.1.1-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "execute without further approval" }
  - { n: 18, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.0.0-gpt-codex.md, major_findings: 7, resolved: false, chairman_qs: "latest critique explicitly enumerated; execute without further approval" }
  - { n: 19, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.1.0-gpt-codex.md, major_findings: 2, resolved: false, chairman_qs: "existing Studio actions and full channel analytics explicitly required" }
  - { n: 20, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.2.1-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "asked=11 answered=11 through explicit user corrections and final execute instruction" }
  - { n: 21, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.0-gpt-codex.md, major_findings: 3, resolved: false, chairman_qs: "latest user corrections explicit; surgical retake without new decision request" }
  - { n: 22, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.1-gpt-codex.md, major_findings: 1, resolved: false, chairman_qs: "latest user corrections explicit; semantic RTM closure retake" }
  - { n: 23, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.2-gpt-codex.md, major_findings: 2, resolved: false, chairman_qs: "prior explicit secret-class decisions govern; semantic5 retake" }
  - { n: 24, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.3-gpt-codex.md, major_findings: 1, resolved: false, chairman_qs: "Audit96 full semantic retake; no new product decision required" }
  - { n: 25, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.4-gpt-codex.md, major_findings: 2, resolved: false, chairman_qs: "8 semantic failures plus emitted-manifest validator integrity retake" }
  - { n: 26, critic: plan-critic, artifact: docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md, major_findings: 0, resolved: true, chairman_qs: "latest user instructions explicit; full Audit96 semantic pass" }
---

# Pipeline State. openclaw-auto-osmu

## 2026-08-06 plan REOPEN. v16 제품 구조·사용자 여정 반려
- 사용자 직접 검토로 OSMU channel composition, video3, queue propagation, aggregate/channel analytics,
  shared platform header, YouTube/TikTok, Keyword/Data/Assets/Settings/Admin, OAuth readiness 계약이 불완전함을 확인했다.
- v6.1.1/v16은 감사 이력으로 보존하되 승인 효력은 철회한다. 실제 code/wiki/Chrome과 최초 요구+이번 질문을
  결합한 새 PRD가 independent critic MAJOR0을 받기 전 design 재진입 금지.
- 다음: 기능·데이터·IA·auth/admin 감사를 병렬 수행한 뒤 prd-architect가 v6.2를 작성하고 plan-critic이 비평한다.

## 2026-08-06 PRD v7.0.0 RETAKE-MAJOR
- v7.0.0 작성 verifier PASS(WebSearch/Fetch16, Socratic3), FR/AC/TC 48/48/48였으나 independent critic이
  MAJOR7/MINOR4로 design 진입을 반려했다. nominal count는 제품 의미·원자성 통과 증거가 아니다.
- 차단: family별 Queue/Inbox/Calendar owner 충돌, Midjourney·tenant token 제품결정, aggregate KPI whitelist,
  provider/network/format taxonomy, `/videos` action/state 보존, mega-TC 분해, metric denominator/sample/cost ceiling.
- 다음: prd-architect v7.1.0 리테이크 → 작성 verifier → independent critic MAJOR0. 그 전 plan 승인·design 금지.

## 2026-08-06 PRD v7.1.0 residual RETAKE-MAJOR
- v7.1 작성 verifier PASS(WebSearch/Fetch16, Socratic3), 기존 MAJOR7 중 5건 완전폐쇄·2건 부분폐쇄.
- residual MAJOR2: canonical data authority를 exclusive UI surface로 오독해 Studio 기존 Publish/예약 행동과 충돌;
  R4 native analytics N/M에서 Social5가 빠져도 통과 가능. Minor4는 Social/Video IA, viewport N75, table denominator 포함.
- 다음: v7.2 surgical retake에서 Studio existing actions를 canonical command initiation으로 보존하고 Social5+video3 native truth
  8-case를 R4에 포함한다. independent critic MAJOR0 전 design 금지.


## 2026-08-06 Marketing Agent plan v6.1.1 APPROVED
- 사용자 목적을 브랜드 사실 기반 Discover→Plan→Create→Review→Publish→Measure→Learn→Act 마케팅 에이전트로 고정했다.
  플랫폼별 연결·개별 발행과 기존 OSMU 일괄/예약/복구는 이 폐루프의 보존된 실행 수단이다.
- 원요구 29개, current wiki/code/Chrome 화면, v5.2 보존 manifest를 병합했다. critic v6.0 MAJOR4,
  v6.1 residual1을 반려한 뒤 v6.1.1에서 MAJOR0/MINOR0 GO를 받았다.
- 2주 proof는 P39의 source1→opportunity1→campaign1→Threads card1→승인→실발행/permalink→metric 또는
  sample-hold→insight/hold→experiment decision→next plan이다. R6은 기존 route/action/API/state와 UI fidelity의
  deletion/rename/move0이며, D3을 proof design/implementation에 넣으면 즉시 FAIL이다.
- 다음: product-designer가 pinned v6.1.1과 actual assets/tokens/role/provider/responsive 화면을 기반으로 fidelity v15를
  제작한다. design 승인 전 제품 코드·DB·배포 변경 금지.

## 2026-08-06 plan REOPEN. publisher가 아닌 Marketing Agent 목적 복원
- 사용자 최상위 목적: 플랫폼 연결·개별 발행과 OSMU 일괄 생산/발행은 수단이며, 제품은 브랜드 사실을
  grounding해 시장 탐색→전략→생산→검수→발행→측정→학습→다음 행동까지 수행하는 마케팅 에이전트다.
- 기존 v5.2는 연결/생산/발행/복구 계약은 강화했지만 Discover/Plan/Measure/Learn/Act와 자율성·사람 승인
  경계를 제품 중심으로 충분히 정의하지 못했다. 따라서 plan 승인 효력을 철회하고 design v14 착수도 중단한다.
- 다음: 전체 user failure/request ledger + current marketing-agent code/wiki lifecycle 감사 → PRD MAJOR v6 →
  independent critic MAJOR0 → actual asset/design-system fidelity prototype. 제품 코드·DB·배포 변경 금지.

## 2026-08-06 full Marketing Hub plan v5.2.0 APPROVED
- 사용자 전체 화면 감사→wiki→기획→prototype 실행 지시를 단계 진행 트리거로 삼았다. wiki current map과
  Chrome 감사 기반 PRD v5.0은 critic MAJOR6, v5.1은 residual MAJOR5로 반려했고 v5.2에서 모두 폐쇄했다.
- v5.2는 route25/sidebar26, target text8+video3, current visual7/direct4 additive migration, account SSOT/
  wrong-session, per-card/bulk/schedule, 502 3분류, Inbox/Calendar bridge, 390 전수 TC를 고정했다.
- independent critic residual MAJOR0. QA V52 48건은 등록됐지만 미실행이며 구현/운영 완료 근거가 아니다.
- 다음: product-designer가 current Chrome/디자인시스템을 보존한 full Marketing Hub prototype을 제작한다.

## 2026-08-06 DESIGN v13 REJECTED. asset/design-system/role/responsive fidelity
- 사용자 직접 검토에서 실제 아이콘 에셋, current responsive shell, 역할별 화면, 디자인시스템 미보존을 확인했다.
- v13은 일반 worker 제작 후 product-designer 사후검수였고 verifier도 Skill0/Web0 FAIL이므로 승인 근거가 아니다.
- design artifacts_ok=false 유지. 실제 asset/token/component/role-state/viewport manifest를 먼저 감사한 뒤
  product-designer가 current UI를 정확히 복제하고 target flow만 additive한 v14를 제작한다.

## 2026-08-06 full Marketing Hub plan REOPEN. 전체 화면 대조 우선
- 사용자 명시 지시로 범위를 Studio/OSMU 단일 화면에서 전체 Marketing Hub로 확대했다. 기존 v4.3.1 plan
  pin과 v12 design은 감사 이력으로 보존하지만 전체 제품 승인 효력은 철회한다.
- 작업 순서는 실제 코드 라우트·사이드바·설정·채널·콘텐츠·분석·인증/운영자 화면을 Chrome 렌더와 대조
  → wiki 현행화 → 전체 제품 PRD/critic → 실제 shell을 보존한 통합 프로토타입이다.
- 현 단계에서는 제품 코드·DB·배포를 변경하지 않는다. 전체 라우트 증거와 wiki/PRD/design 품질 검증 전
  design·eng-design 진입 및 완료 주장을 금지한다.

## 2026-08-05 plan v4.3.1 APPROVED. existing product preservation first
- 실제 shell/design-system 정량 baseline과 historical Studio visual7을 잠갔다. Discord/Slack Studio card는 0,
  backend text8/video3/Settings/notification은 별도 capability inventory다.
- 기존 9기능은 각각 독립 FR/AC/TC와 happy+failure fixture를 가진다. 부모 verifier PASS, independent
  critic v4.3.0 MAJOR2 → v4.3.1 residual MAJOR0.
- 다음: product-designer v11은 기존 Marketing Hub UI를 복제 보존한 뒤 카드별 Publish와 복구만 additive로
  추가한다. v7~v10의 invented/replacement UI는 기각 증거다.

## 2026-08-05 plan REOPEN. product surface source-of-truth 오류
- 사용자 관찰로 v4.2.1/v10의 플랫폼 구성이 기각됐다. backend `SCHEDULABLE_PLATFORMS` 8개를 기존 OSMU
  product surface로 잘못 승격해 Discord/Slack을 카드에 넣고, 기존 preview의 Reels/Shorts와 Wiki
  불러오기·기존 초안생성·Publish 흐름을 누락했다.
- v4.2.1 approved artifact pin은 감사 추적용으로만 남기며 승인 효력은 철회했다. plan/design artifacts_ok=false,
  current_stage=plan. v10은 기각 증거이며 개발 입력 사용 금지.
- 다음: git history·과거 prototypes·wiki·qa-tracker·실제 Studio 코드를 전수 대조해 product surface와
  backend adapter/runtime inventory를 분리한 v4.3을 작성한다.

## 2026-08-05 plan v4.2.1 APPROVED. 8-card independent publishing
- 사용자 확정 계약을 `초안생성 1회 → 고정 8개 카드 → 카드별 edit/save/Publish/status/permalink/recovery`로 복원했다.
- 한 카드 Publish는 선택 adapter 1회·다른 7개 0이며, 부분 생성은 카드 8개를 유지한다. confirmed provider
  failure만 재발행하고 persistence failure는 repair-only, timeout/unknown은 reconcile-first로 분리했다.
- 부모 verifier PASS, independent plan-critic v4.2.0 MAJOR 2 → v4.2.1 residual MAJOR 0. design은 새
  v4.2.1만 입력으로 사용하며 v9은 기각 증거다.
- 다음: product-designer가 기존 Marketing Hub shell/사이드바를 보존한 고객용 v10 프로토타입을 제작하고,
  8/8 카드 생성·편집·개별 Publish·복구를 실제 클릭 QA한다. 제품 코드 수정은 design 승인 전 금지.

## 2026-08-05 plan v4.1.2 APPROVED. 사용자 `다음 할거 진행`
- 기존 코드 감사 기반 PRD v4.1.2를 부모 verifier PASS와 independent critic residual MAJOR 0으로 재검증했다.
- 승인 artifact SHA를 v4.1.2 PRD와 4개 view로 교체했다. current_stage=design, plan approved 유지,
  design artifacts_ok=false다.
- 데이터 권리 추천값은 F4 외부 cohort만 차단하며 initial R0~R3 design에는 비차단이다.
- 다음: product-designer가 v4.1.2와 실제 코드 inventory만 기반으로 as-is/target 분리 디자인을 작성한다.

## 2026-08-01 full product-flow plan reopen
- 사용자 명시 지시로 기존 plan/design/eng-design/build 승인을 전부 철회하고 plan부터 다시 시작한다.
- 재기획 입력은 `/Users/sj/.claude/plans/wiki-1-mellow-wadler.md`의 기존 13개 요청 전체,
  `docs/qa-tracker.md`의 신규 시크릿 창 FAIL, Threads 계정 전환 실패, OAuth callback 뒤 연결상태
  불일치, Instagram 수동 토큰 UI 중복, Settings 상태 누락, 플랫폼별 탭 불일치, 공통
  초안→검수→발행 부재, 운영 502다.
- 이번 재기획의 One Thing은 신규 고객이 자기 SNS 계정을 확실히 연결하고, 같은 구조에서 초안을
  만들고 검수해 실제 발행 결과를 확인하는 것이다. OAuth 저장·상태·UI·기능 노출은 이 플로우의
  하위 계약으로 재정렬한다.
- 기획은 `prd-architect` 초안→`plan-critic` 비평→회장 질문/답변→수정 순서다. 회장 `/approve plan`
  전에는 디자인·기술설계·소스 수정·배포를 진행하지 않는다.

## 2026-07-29 customer production blocker build + independent QA
- `2026-07-28 full production flow QA reopen`에서 확인한 고객 화면의 operator-only 전역 API 403,
  존재하지 않는 onboarding 이미지, Google 고객 401 수동 token UX, YouTube/notification HTTP
  false-success를 tests-first로 수정했다. 고객 Proxy allowlist는 넓히지 않았다.
- 고객 화면은 전역 cron/token/secret/file 제어를 제거하되 tenant-safe queue·analytics·settings·
  credentials·image gallery·blog 기능을 유지한다. tenant 자동화는
  `/api/channel-settings/{channel}` GET/POST로 복구했고 global cron API는 호출하지 않는다.
  tenant 저장소가 없는 GA/Search Advisor/Naver Trends는 정직한 비활성 안내로 전환했다.
- customer JWT 401은 Supabase local sign-out→`/login`, operator token은 `/operator` 경로를
  유지한다. reauth operation owner token으로 old 401→signOut pending→new SIGNED_IN/JWT→old
  SIGNED_OUT micro-race가 새 세션을 삭제하지 못하도록 막았다.
- YouTube resumable PUT non-2xx·invalid JSON·빈 ID, Telegram HTTP/body `ok:false`,
  Discord/Slack/LINE 및 Slack test/custom non-2xx는 fail-closed한다. 외부 발행 성공 뒤
  DB/queue 기록 실패의 `/api/publish` 계약은 사용자 결정 전이라 변경하지 않았다.
- tests-first RED는 최초 20건, 독립 QA 리테이크 10건, auth micro-race 2건을 실제 재현했다.
  최종 code-builder 전체 115 files 948 PASS/10 DB-env skip, `tsc --noEmit`, webpack build
  166/166, diff check PASS. 최종 독립 QA도 focused 57/57, 계약 감사 9/9, 전체 948 PASS/10 skip,
  TypeScript, webpack 166/166, diff check PASS로 제품 QA를 승인했다.
- **판정 경계:** QA 전용 Skill이 현재 Codex 환경에 없어 harness skill gate는 FAIL이며, 위 PASS는
  독립 코드·테스트·빌드 증거 등급이다. 운영 배포·실 Supabase browser race·전체 route matrix와
  Admin OAuth UI 저장→reveal→delete는 미검증이다. qa/ship 잠금은 유지한다.

## 2026-07-29 env OAuth import + publish partial-success contract
- 사용자 운영 제보: `/operator/customers`에서 기존 등록 Client ID/Secret을 확인할 수 없었다.
  원인은 기존 세트가 env source이고 보안상 DB source에만 reveal을 허용한 UI/API 계약이다.
- 해결 계약: env 원문을 HTTP로 직접 반환하지 않는다. exact operator 인증의 explicit
  `import-env` action이 완전한 env 세트를 서버 내부에서 pgcrypto 암호화 DB로 원자적 import하고,
  secret-free audit를 남긴 뒤 기존 DB-only reveal을 사용한다. 기존 DB 행은 덮어쓰지 않는다.
- 발행 계약: 외부 게시 성공 뒤 publication/queue 기록 실패는 HTTP 500,
  `ok:false`, `externalPublished:true`, external id/permalink, persistence stage,
  `repair_persistence_only`, `retryPublish:false`를 반환한다. UI는 성공 analytics와 외부 재발행을
  차단하고 queue만 멱등 복구한다.
- 독립 통합 QA: focused 48 files 464 PASS/2 DB skip, 전체 117 files 966 PASS/10 DB-env skip,
  `tsc --noEmit`, webpack production build 166/166, diff/충돌/secret scan PASS.
- **판정 경계:** 제품 코드 QA PASS. 실 DB schema-first 적용·transaction rollback, 운영 Admin
  import→reveal 클릭, 실제 부분성공 장애 E2E는 미검증이다. QA Skill 미설치 harness FAIL도 유지한다.
  ship 전환 금지.

## 2026-07-28 Admin central OAuth credential manager build reopen
- 사용자 확정: 미등록 provider마다 정확한 개발자 콘솔 URL, 콘솔 작업 순서, callback URL,
  필요한 Client ID/Secret/추가값을 Admin에 표시한다. 운영자는 Admin에서 값을 일괄 등록·수정하고
  저장값을 확인할 수 있어야 한다.
- 이전 결정 변경: 2026-07-26의 “Admin은 secret 이름·준비상태만 표시하고 원문 입력을 받지 않는다”를
  이번 사용자 지시가 명시적으로 대체한다.
- 보안 계약: 전역 `oauth_app_credentials` additive table에 `OSMU_SECRET_KEY` 기반 pgcrypto 암호화로
  저장한다. 기본 GET은 source, 설정 여부, 마지막 갱신시각, 마스킹 값만 반환한다. 원문 확인은 운영자
  Bearer 재검증을 거친 별도 reveal action으로만 반환하고 reveal/update/delete를 감사 테이블에 기록한다.
  secret 원문은 로그·오류·분석·Git·일반 고객 API에 남기지 않는다.
- 런타임 계약: DB credential을 우선하고 기존 process env는 무중단 fallback으로 유지한다.
  authorize URL 생성, callback code exchange, customer readiness, Admin readiness가 모두 같은 resolver를
  사용해야 한다. DB 일부 필드만 설정된 상태에서 env와 필드별 혼합하지 않고 provider credential set
  단위로 완전성을 판정해 fail-closed한다.
- UI 계약: provider 카드마다 외부 콘솔 URL·공식 문서·정확한 callback·설정 단계·필드별 입력/수정,
  기본 마스킹, 명시적 확인/숨김, 저장 상태와 마지막 갱신시각을 제공한다. Facebook의 config ID처럼
  provider별 추가 필드도 metadata에서 렌더한다.
- 종료 증거: schema/RLS 멱등 적용, 암호화 원문 비노출·operator-only CRUD/reveal 감사·env fallback
  회귀 테스트, 전체 test/typecheck/build, 운영 배포 후 Admin 저장→마스킹 조회→reveal→customer
  authorize URL이 새 Client ID를 사용→callback exchange가 같은 secret을 사용하는 실제 관찰.
- build commits `68c251bb`·`0850ecaa`·`a27a24b7`·`9702b0f2`: additive encrypted tables/RLS,
  중앙 resolver, exact operator Bearer + no-store metadata/atomic upsert/explicit reveal, Admin 카드 입력·
  source/updated time·공식 링크/단계·30초 자동삭제를 tests-first로 구현했다.
- 자동 증거: OAuth focused 105/105 + 보강 7/7, 전체 112 files 908 PASS/10 DB-env skip,
  `tsc --noEmit` PASS, Next.js 16.2.2 webpack production build 166/166 pages PASS.
  기본 Turbopack은 샌드박스 worker port bind EPERM이라 이 환경에서 미검증이다.
- 직접 DB 멱등 적용은 임시 Postgres bootstrap이 샌드박스 SysV shared-memory 제한으로 3회 모두
  코드 실행 전 중단돼 미검증이다. schema/RLS contract 2/2는 PASS했지만 QA 환경에서 2회 적용,
  운영 Admin 저장→마스킹→reveal→감사→고객 authorize/callback 실왕복 전까지 qa/ship은 잠금 유지.
- 독립 Opus 보안리뷰에서 RLS owner 접근/롤백 순서, env 원문 reveal, readiness N+1 복호화의
  Major 4건을 발견했다. commit `50529a93`에서 global table `NO FORCE`+default-deny,
  tenant loop 뒤 `to_regclass` guard, DB-source 전용 reveal, bulk resolver, DELETE+audit,
  저장소 장애 UX로 수정했다.
- 수정 후 자동 증거: focused 32/32, 전체 112 files 917 PASS/10 DB-env skip,
  `tsc --noEmit` PASS, webpack production build 166/166 routes PASS. Opus 후속 리뷰도
  Critical/Major 0, 관련 23/23 PASS로 판정했다. 운영 DB RLS·Admin 실브라우저 저장/조회는
  배포 후 직접 관찰 전까지 미검증이며 qa/ship 잠금을 유지한다.

## 2026-07-28 operator canonical token recovery
- 사용자 운영 재현: 안내받은 canonical 운영자 토큰으로 `/operator` 폼 제출 시 invalid-token 문구.
- 근본 원인: 운영 secret store의 값과 사용자 안내값의 첫 글자 대소문자가 달랐고, API는 정확 일치
  비교다. 직전 QA가 secret store 값으로만 통과해 실제 사용자 입력 계약을 검증하지 않았다.
- 복구: GitHub Actions secret과 로컬 secret inventory를 canonical 값으로 동기화하고
  deploy run `30359455514`로 OSMU 대시보드를 재배포했다.
- 운영 증거: canonical 값으로 `/api/me` 200 `isOperator:true`,
  `/api/operator/customers` 200. 새 Chrome target의 `/operator` 실제 폼 제출은
  `/operator/customers`로 이동해 `Admin`·`고객 관리`를 렌더했다. invalid-token 문구,
  4xx/5xx response, console error는 모두 0건이다.
- 재발 방지: 운영자 접근 종료조건은 secret store API 스모크와 사용자 안내 canonical 값의
  새 브라우저 폼 제출을 각각 요구한다. 이 운영자 결함은 닫혔으나 아래 전체 QA FAIL과 ship 잠금은 유지한다.

## 2026-07-28 full production flow QA reopen
- 범위: 공개 7 routes, 고객 25 routes, 운영자 5 routes, 고객 핵심 API 10개,
  중앙 OAuth 12 provider preflight, GA4 consent, Google auth preflight.
- 자동 증거: controller 재실행 `npm test` 105/105 files, 880 PASS/10 DB-env skip,
  `tsc --noEmit` PASS, 제한 밖 `npm run build` 165/165 static pages PASS.
- 운영 PASS: 공개 Google-only login과 `/signup`→`/login`, 운영자 Admin shell/route 격리,
  고객 core API 9개 200(`/api/workspaces`는 운영자 전용 403), GA4 consent 뒤
  gtag load·page_view collect 204, Google authUrl Supabase host·`prompt=select_account`,
  operator token 안정화, 임시 tenant token revoke 200→`/api/me` 401.
- 운영 FAIL: 고객이 실제로 여는 화면에서 운영자 전용 API 호출이 발생한다. 확정 경로는
  home(`/api/cron-status`,`/api/token-status`), Studio(`/api/higgsfield/status`),
  Threads automation(`/api/cron-status`,`/api/cron-runs`),
  Telegram/Discord/Slack(`/api/notification-settings`,`/api/chat-channels`, Slack template),
  Images(`/api/r2-config`), Blog(`/api/cron-status`), Google Analytics(`/api/ga-analytics`),
  Search Advisor(`/api/nsa-data`), Naver Trends(`/api/naver-datalab-config`). 고객 bearer에는
  proxy가 의도적으로 403을 반환하며 브라우저 콘솔 오류가 난다.
- 운영 404: `setup-guides.ts`가 존재하지 않는 Threads/X onboarding PNG 4개를 렌더한다.
- 격리 재검증: 연속 SPA 이동에서 늦게 도착한 요청이 섞였던 `/inbox`와 `/blog-performance`는
  각각 새 브라우저로 재검사해 bad HTTP 0·console error 0으로 오탐 제거했다.
- 소스 blocker: current-token 401의 전역 LoginModal이 Google 고객에게 수동 Auth Token 입력을
  요구한다. YouTube upload PUT non-2xx/empty id와 고객 messaging webhook non-2xx를 성공으로
  기록할 수 있다. provider 발행 성공 뒤 DB/queue 기록 실패도 `ok:true`를 유지해 UI analytics가
  성공으로 오판할 수 있다.
- 외부 경계: OAuth preflight는 Instagram/Threads/YouTube/Facebook 4개 200, 나머지 8개는
  credential 미설정 500. 신규 Google user consent→callback→auth user/tenant row, provider별
  실제 consent/callback/account switch/publish permalink는 이번 실행에서 미검증.
- 판정: QA 승인 철회, ship 잠금. 위 고객 403/404와 false-success 계약을 tests-first로 수정하고
  같은 전체 운영 route matrix 4xx/5xx·console error 0을 재관찰하기 전 출하 금지.

## 2026-07-28 operator login modal race build reopen
- 운영 재현: 인증 전에도 전역 `ImagePickerModal`이 `/api/images`·`/api/queue`를 요청하고 401을
  `auth:required`로 전파한다. 운영자 로그인 직전 시작된 응답이 토큰 저장 뒤 도착하면 공통 fetcher가
  새 토큰까지 지워 랜딩과 Login Required 모달로 되돌린다.
- 기존 확정 구조는 유지한다: 운영자는 Admin 전용 shell만 사용하고 고객 Marketing Hub를 함께 보지 않는다.
- 수정 범위: 닫힌 modal의 보호 API 요청 금지, 요청 시점보다 나중에 저장된 토큰을 stale 401이 지우지
  못하도록 인증 경합 차단, 운영자 identity가 비운영자 protected path를 열면 children mount 전
  `/operator/customers`로 이동.
- 종료 증거: tests-first 회귀, full test/typecheck/build, 독립 인증 QA, 운영자 로그인 뒤
  `/operator/customers`·`/`·`/videos`·`/channels/youtube` 순회에서 Login Required 0건,
  customer API 401/429 반복 0건, Admin redirect/shell 직접 관찰.
- build 증거: code-builder 위임 품질검증 PASS. 닫힌 modal의 SWR null key, 요청별 인증 토큰
  snapshot, 운영자 전용 route redirect를 구현했다. focused 35/35, 전체 880 PASS/10 DB-env skip,
  TypeScript, production build 165 routes, diff check가 통과했다.
- QA 승인 증거: 독립 Claude Sonnet이 변경과 렌더 분기를 직독하고 focused 11/11과
  `tsc --noEmit`을 재실행해 PASS했다. 같은-token 401 로그아웃, stale 401의 새 토큰 보존,
  운영자/customer route 격리를 모두 확인했다. 운영 배포와 실브라우저 로그인 전환은 ship 증거로 남긴다.
- ship 증거: commit `87dae325`, deploy run `30287931603` SUCCESS. 저장소를 비운 공개 홈은
  Login Required·보호 API 요청·콘솔 오류가 0건이었다. 실제 운영자 토큰 폼 제출은
  `/operator/customers` Admin 전용 shell로 이동했고, 운영자 상태에서 `/`·`/videos`·
  `/channels/youtube`는 고객 shell mount 없이 모두 Admin으로 복귀했다. 각 경로의 Login Required,
  `/api/images`·`/api/queue` 401/429, 콘솔 오류가 0건이었다. 20초 안정화 중 `/api/me` 2회도 200이었다.
- 고객 회귀: 단기 tenant token으로 운영 `/videos`를 열어 고객 경로 유지, Admin 오인식 없음,
  관련 API 200과 콘솔 오류 0건을 관찰했다. 토큰 revoke 200 뒤 동일 토큰 `/api/me` 401을 확인하고
  임시 비밀 파일을 삭제했다. 이 핫픽스는 종료했으며 전체 ship은 외부 OAuth 8개 credential·심사와
  provider별 실 consent/callback/발행 증거가 없어 in-progress를 유지한다.

## 2026-07-26 central OAuth setup UX + video channel management build reopen
- 사용자 확정: 중앙 OAuth 개발자 앱은 운영자가 플랫폼당 한 번 등록하고, 멀티테넌트 고객은 각자
  OAuth 동의로 자기 계정 토큰을 저장하는 SaaS 구조를 유지한다.
- 보안 결정: 원문 Client Secret을 Admin 앱·DB에 저장하는 입력폼은 만들지 않는다. Admin에는
  credential 준비 상태, 정확한 callback URL, 필요한 secret 이름, 공식 개발자 콘솔 링크를 시각화한다.
  원문 secret은 GitHub Actions/운영 env의 secret store에만 둔다.
- YouTube/TikTok 내부 토큰·계정 저장은 이미 provider별로 분리돼 있으나 Sidebar가 둘 다 `/videos`
  앵커로 보내고 `/videos`가 연결·계정관리까지 중복 소유한다. 각 Sidebar는 `/channels/youtube`,
  `/channels/tiktok` 독립 관리 화면으로 이동한다.
- `/videos`는 공용 영상 라이브러리·발행 작업실로 유지하되 OAuth 연결·계정 추가/삭제/기본계정 관리는
  각 채널 페이지로 위임하고, 발행 대상 선택·플랫폼별 발행 옵션만 유지한다.
- 종료 증거: navigation/UI 계약 테스트 선행 실패→PASS, operator API secret 비노출 회귀,
  focused/full tests, TypeScript, production build, 운영 배포 뒤 Admin·고객 브라우저 E2E다.
- build 승인 증거: code-builder 위임 품질검증 PASS. 요구 계약 6건의 선행 실패를 확인한 뒤
  focused 36/36 PASS, 전체 863 PASS/10 DB-env skip, `tsc --noEmit` PASS,
  production build 165 routes PASS를 재현했다. QA는 독립 verifier와 운영 브라우저 관찰로 진행한다.
- 첫 독립 QA는 focused 36/36, 관련 회귀 270/270, TypeScript/build를 통과했지만 전체 suite의
  비정규 base64url 서명 수용 간헐 실패와 operator GET 401 원문 렌더 경로를 발견해 NG로 판정했다.
- 별도 code-builder가 두 차단 결함을 tests-first로 수정했다. 이미지·영상 서명은 canonical
  base64url만 수용하고, GET 401은 `auth:required` 재인증 경로로 통일했다. focused 60/60,
  전체 867 PASS/10 DB-env skip, TypeScript, production build 165 routes, diff check가 통과했다.
  독립 Sonnet `/qa`는 focused 52/52, 전체 867 PASS/10 skip 그린 run, TypeScript, production
  build, diff check와 secret 비노출·tenant/provider/account 경계를 재검증해 PASS했다. 별도 전체
  run의 observability 1건은 단독 3회 PASS로 cross-file flake로 격리했다. QA를 승인하고 ship으로
  이동한다. 운영 Admin/customer 브라우저 관찰과 외부 provider 실왕복은 ship 증거로 남긴다.
- commit `d94c564e`, deploy run `30191941597` SUCCESS. Admin 중앙 OAuth 체크리스트와 집계를
  운영 브라우저에서 관찰했고 안정화 뒤 콘솔 오류 0건이었다. 고객 YouTube 독립 채널도 렌더됐지만
  사용하지 않는 operator-only cron API 2개가 403을 내는 운영 결함을 발견했다.
- cron 매핑이 없는 YouTube/TikTok에는 `/api/cron-status`, `/api/cron-runs` SWR key를 null로
  해 요청을 만들지 않는 핫픽스를 tests-first로 구현했다. focused 4/4, 전체 871 PASS/10 skip,
  TypeScript, production build 165 routes, diff check PASS. 재배포 후 고객 브라우저 Network/console
  재관찰 전까지 ship은 in-progress다.
- 독립 Claude Sonnet `/qa`가 핫픽스 diff를 리뷰하고 focused 4/4, 전체 871 PASS/10 skip,
  TypeScript, production build를 직접 재실행해 PASS했다. API route·인가 코드는 변경되지 않았다.
  커밋·재배포 뒤 YouTube/TikTok Network/console 관찰이 다음 ship 증거다.
- commit `9e25ab6c`, deploy run `30204883783` SUCCESS. 고객 운영 브라우저에서 YouTube/TikTok
  독립 화면 모두 cron-status/cron-runs 요청 0건, 콘솔 오류 0건을 관찰했다. `/videos`는 공용
  라이브러리·provider별 채널 관리 링크만 유지했고 콘솔 오류 0건이었다. 임시 고객 토큰은 revoke
  200 뒤 동일 토큰 `/api/me` 401을 확인하고 로컬 원문을 삭제했다. 이 운영 403 결함은 해소됐다.
  전체 ship은 중앙 OAuth credential 8개와 외부 provider 실 consent/callback/publish가 남아 in-progress다.

## 2026-07-25 TikTok explicit re-authorization build reopen
- 사용자 실기기에서 기존 TikTok 브라우저 세션이 자동 재사용돼 다른 계정 선택이 어려운 문제를 다시 다룬다.
- 타사 쿠키를 우리 origin이 삭제할 수 없는 경계와 공식 계정 설정 링크는 그대로 유지한다.
- TikTok 공식 Login Kit Web의 `disable_auto_auth=1`을 authorize URL에 추가해 유효한 기존 세션에서도
  authorization 화면을 항상 표시하도록 한다. 계정 로그아웃 자체를 사칭하지 않는다.
- 종료 증거는 URL 계약 테스트, 기존 OAuth/PKCE 회귀, 전체 테스트·build, 운영 authUrl 파라미터 관찰이다.
  운영 credential이 없으면 provider consent/callback은 계속 미검증으로 명시한다.
- build commit `cea30fe0`: TikTok provider 전용 `disable_auto_auth=1`과 URL 계약 회귀 테스트를 추가했다.
  테스트 선행 실패 1건(`null`), 수정 후 OAuth focused 70/70 PASS, 전체 858 PASS/10 DB-env skip,
  TypeScript PASS, production build 165/165 routes PASS, `git diff --check` PASS다.
- code-builder 품질 검증은 근거·공식문서·소크라테스 마커 기준 PASS했다. 실제 운영 authUrl과
  consent→callback은 중앙 TikTok credential 부재로 아직 미검증이며 QA/배포 후에도 이 경계를 유지한다.
- 독립 qa-verifier(Sonnet)는 변경 2파일 격리와 provider별 config 병합을 검토하고 TikTok 관련
  74/74 PASS, 전체 858 PASS/10 skip, `tsc --noEmit` PASS, `next build` exit 0을 재현해
  `PASS with caveats`로 판정했다. TikTok 공식 Login Kit Web 문서의 `disable_auto_auth=1` 계약은
  컨트롤러와 code-builder가 원문에서 재확인했다.
- QA 승인. ship은 배포·health/UI smoke까지 진행하되 중앙 TikTok credential이 없으므로 운영 authUrl과
  실 consent→callback→계정 저장은 계속 미검증으로 남긴다.
- 운영 deploy run `30156828520`은 commit `e37ada41` 기준으로 2분 31초 만에 SUCCESS했다.
  이미지 build, 컨테이너 기동, login/auth/Google 계정선택/operator API 자동 스모크가 모두 통과했다.
- 공개 URL에서 `/api/health` 200(`ok:true,db:up`), `/login` 200, `/api/operator/customers` 200을
  재관찰했다. 실제 브라우저 운영자 로그인은 `/operator/customers`로 이동했고 `Admin` 단일 셸,
  가입자 7명·워크스페이스 11개·연결 계정 3개·발행 8건·중앙 OAuth 4/12 준비를 렌더했다.
  안정화 뒤 브라우저 콘솔 오류는 0건이었다.
- 이 TikTok URL 계약 변경은 운영 배포됐다. 다만 readiness는 중앙 credential 누락을 정확히 반환하므로
  실제 운영 TikTok authUrl·consent·callback·발행은 미검증이며 전체 ship은 `in-progress`를 유지한다.

## 2026-07-25 operator/customer shell hotfix QA operating close
- 운영 배포 `30042980536` 성공 뒤 공개 URL에서 운영자와 고객 shell을 각각 실제 브라우저로 관찰했다.
- 운영자는 persisted `Romeo-n-cupid` workspace를 제거하고 `Admin`과 고객 관리만 표시했다.
  새로고침 뒤 `/api/me`와 `/api/operator/customers`는 200, 브라우저 콘솔 오류는 0건이었다.
- 단기 고객 토큰으로 `/videos`를 열어 Marketing Hub, YouTube/TikTok Sidebar 링크, 실제 연결 카드,
  Google/TikTok 공식 계정관리 링크를 관찰했다. 관련 API는 모두 200이고 콘솔 오류는 0건이었다.
- YouTube OAuth 시작 URL은 `accounts.google.com`, `prompt=consent select_account`,
  `access_type=offline`, 운영 origin callback을 반환했다.
- 운영 rate-limit은 동일 identity에서 invalid bearer `401×4 → 429`, `Retry-After: 59`,
  제한 중 유효 고객 200, 운영자 200으로 window clear, 다음 invalid 401을 관찰했다.
- QA용 고객 토큰은 revoke했고 동일 토큰의 `/api/me` 401을 확인했다. 브라우저는 운영자 Admin 상태로 원복했다.
- 독립 QA 재실행은 focused 213 PASS, full 858 PASS/10 DB-env skip, TypeScript PASS,
  Webpack production build 165/165 pages PASS, 운영 health 200/db up이다.
- 이 hotfix의 QA는 승인한다. 전체 ship은 X/TikTok 중앙 앱 credential·심사와 신규 고객의 외부 provider
  실 consent→callback→credential 저장→발행 permalink가 미검증이므로 `in-progress`를 유지한다.

## 2026-07-24 operator/customer shell hotfix reopen
- 사용자 운영 관찰에서 operator token 로그인 뒤 Sidebar가 persisted customer workspace
  `Romeo-n-cupid`를 표시하는 권한·정체성 혼동을 재현했다.
- 운영자 UI는 `Admin` 단일 identity와 운영 대시보드 메뉴만 표시하고 customer workspace 상태를 지운다.
- 고객 Sidebar에는 실제 영상 발행 경로가 있는 YouTube/TikTok 연결 메뉴를 별도 Video 그룹으로 노출한다.
- 타사 플랫폼 세션 쿠키는 same-origin 앱이 삭제할 수 없으므로, OAuth UX는 provider 계정 관리 페이지를
  명시적으로 열어 로그아웃/계정 전환 후 재연결하도록 구현하고 자동 로그아웃을 사칭하지 않는다.
- build→focused/full test→production build→운영 Chrome E2E→qa 재승인→배포 순서로 진행한다.

## 2026-07-24 Threads automatic publishing operating proof
- 운영 VM crontab의 `osmu-publish-due.sh`가 10분마다 전체 tenant의 due schedule을 처리하는 상태를 확인했다.
  직전 무발행의 원인은 scheduler 장애가 아니라 due schedule 0건이었다.
- 기존 공개 게시물과 겹치지 않는 OSMU 팩토리 Threads 원고 3건을 content-growth-marketer에 재위임했다.
  품질 검증은 Skill 11회, WebSearch/Fetch 6회, Socratic 10, RUBRIC 22/25로 PASS했다.
- code0to1 tenant에 draft 3건과 Threads schedule 3건을 만들었다. 첫 schedule
  `e5056bc0-443e-4dea-a39d-8575bf3e294a`는 운영 all-tenant sweep에서 `published`가 됐고,
  외부 ID `18002265641778373`, permalink
  `https://www.threads.com/@zero_to_one_ai/post/DbJH7KJGDS6`를 반환했다.
- gstack 실제 브라우저에서 `@zero_to_one_ai`의 발행 원문 전체를 공개 페이지로 직접 렌더했고, 운영 metrics
  refresh도 updated 1/total 3과 해당 permalink·본문·metrics_at 저장을 반환했다.
- 후속 2건은 2026-07-24·25 20:00 KST `scheduled` 상태다. 이틀 자동 출고를 관찰하기 전에는 두 건을
  발행 완료로 표현하지 않는다.
- 전체 ship은 계속 in-progress다. X/TikTok 중앙 OAuth credential·심사, Facebook/YouTube 신규 사용자 실동의·
  발행, 동일 provider 실제 2계정 전환·발행은 미검증이다.
- 다음 실행: 운영 cron이 후속 2건을 자동 출고하는지 permalink로 회수하고, Instagram은 이미지 자산을 만든 뒤
  IMAGE 예약 E2E를 수행한다. 외부 콘솔 인증이 회수되면 X/TikTok과 Facebook/YouTube 실계정 E2E를 이어간다.

## 2026-07-24 operator entry hotfix build candidate
- 운영자 토큰 검증 후 `/`로 이동해 Romeo 기본 workspace가 보이던 navigation wiring 결함을 확인했다.
- 검증 성공 후 `/operator/customers`로 직접 이동하도록 수정하고 회귀 테스트를 추가했다.
- 새 운영 secret은 로컬 harness와 GitHub Actions secret에 저장했으며 원문은 repo/state에 남기지 않았다.
- focused 33 PASS, full 835 PASS/10 DB-env skip, production build 165 routes PASS.
- commit `4595e950`, deploy run `30020112816` SUCCESS. 운영 새 토큰 `/api/me`·customers 200,
  구 토큰 `/api/me` 401, Chrome 실제 입력/클릭 후 `/operator/customers`와 고객 KPI 렌더를 관찰했다.
- Claude 교차 리뷰는 변경/서버 인가 blocker 0. 기존 rate limit 부재와 client guard·행위 테스트 보강은
  후속 build backlog이며 이번 운영 복구를 막지 않는다.
- 다음 실행: 전체 ship 잔여인 X/TikTok credential·심사 및 provider 실계정 왕복 QA를 계속한다.

## 2026-07-23 operator observability + Meta legal pages operating close
- 기존 운영자 고객 관리에 전체 가입자/워크스페이스/활성/연결계정/발행/실패 KPI와 `channel_accounts` 기반
  provider별 다중계정 현황을 추가했다.
- 중앙 OAuth 개발자 앱의 서버 credential 등록상태를 secret 원문 없이 표시한다. Meta Live/심사처럼 서버가 판정할 수
  없는 외부 상태는 별도 확인으로 표시한다.
- Meta 게시 필수조건인 공개 개인정보처리방침·이용약관·데이터 삭제 페이지를 추가하고 인증 없이 접근 가능하게 했다.
- focused 51 PASS, full 834 PASS/10 DB-env skip, TypeScript PASS, production build 165 routes PASS.
- commit `0072a0b7`, CI `30004946404`, deploy `30004961101` SUCCESS. 운영 health/db, 법정 페이지 3개,
  operator API 실제 집계와 Chrome 관리자 화면을 직접 관찰했다.
- Meta 법정 URL 저장 후 앱을 게시했고 Facebook 운영 OAuth가 비활성 오류 없이 consent 화면과 계정전환 링크를 표시했다.
- ship은 계속 in-progress다. X/TikTok 개발자 로그인·앱 생성·credential, YouTube 신규 tenant 실업로드가 남았다.
- 다음 실행: X/TikTok 외부 계정 인증 회수 즉시 중앙 앱 생성·심사·credential 배포 후 신규 tenant 실 OAuth/발행 E2E를 수행한다.

## 2026-07-22 self-service OAuth SaaS build reopen
- 사용자가 제품 목표를 재확정했다: `code0to1` 연결 도구가 아니라 누구나 Google로 가입해 독립 tenant를 받고,
  자기 SNS 계정을 OAuth로 연결·전환·자동 발행하는 SaaS다.
- 기존 build/qa 증거는 멀티테넌트 단위 테스트와 한 QA tenant의 실제 발행까지다. 완전히 새로운 사용자 A/B의
  가입→provisioning→각자 OAuth 저장→발행→상호 데이터 접근 차단 운영 E2E가 없으므로 이전 build/qa 승인을 재개한다.
- plan/design/eng-design의 멀티테넌트 아키텍처는 유지한다. build 범위는 셀프서비스 provisioning과 tenant 귀속,
  두 사용자 교차 격리 E2E 자동화, 발견 결함 수정이다. 외부 provider 앱 Live/심사/credential은 별도 blocker다.
- 종료증거: 신규 A/B 각각 독립 tenant와 인증 토큰, 자기 계정만 조회·전환, 상대 tenant 리소스 403/404,
  가능한 provider의 실제 OAuth callback·발행 URL. 외부 provider 왕복을 못 한 범위는 미검증으로 명시한다.
- build 결과: OAuth state를 callback 전용 HttpOnly 쿠키에 바인딩하고 X/TikTok PKCE verifier도 모든 callback
  결과에서 폐기한다. 신규 A/B PostgreSQL 격리 테스트를 CI 필수 경로에 추가했다. 독립 QA에서 코드 결함은
  없었고 TikTok 전용 회귀 누락 1건은 `0d12defb`로 보완했다.
- QA/배포 결과: GitHub CI `29891147154`가 PostgreSQL 16 schema→seed→RLS와 A/B 셀프서비스 격리 테스트를
  skip 없이 포함해 96 files PASS. deploy `29891777778`도 성공했고 운영 health 200/db up, login 200,
  무인증 me 401, Google preflight 200을 직접 관찰했다.
- 운영 OAuth 시작 경로: 단기 tenant token으로 Instagram·Threads·Facebook·YouTube가 각각 공식 authorize
  domain과 HttpOnly state cookie를 반환했다. 쿠키 없는 별도 브라우저 callback 재생은 토큰 교환 전에 차단되고
  state cookie가 Max-Age=0으로 폐기됐다. X/TikTok은 운영 credential 미설정으로 500, Bluesky는 OAuth 미지원
  400이며 토큰은 즉시 revoke 후 me 401을 확인했다.
- QA는 사용자 기존 `QA승인`과 반복된 무질문 진행 지시를 증거 충족 후 반영해 승인한다. ship은 실제 신규
  Google 사용자 가입·provider 동의 callback·사용자별 실발행 permalink와 상호 운영 API 차단을 직접 보지
  못했으므로 `in-progress`, `artifacts_ok:false`를 유지한다.
- ship 후속에서 사이트 로그아웃 뒤 Google 계정이 자동 재사용되는 원인을 `/api/auth/google`의 계정 선택
  파라미터 누락으로 확인했다. Supabase authorize URL에 `prompt=select_account`를 추가했고 focused 22 PASS,
  전체 828 PASS/10 local DB skip, TypeScript, Webpack production build를 통과했다. CI `29893393332`와 deploy
  `29893789257` SUCCESS. 운영 Supabase authorize와 최종 `accounts.google.com` URL 모두
  `prompt=select_account`를 보존했고, 격리 브라우저에서 기존 세션 자동진입 없이 Google 이메일/계정 선택
  진입 화면을 직접 관찰했다. 앱 로그인 계정전환 hotfix는 운영 반영됨으로 판정한다.
- 운영의 서로 다른 활성 tenant 2개에 단기 토큰을 발급해 `/api/me`가 각각 다른 tenant에 고정됨을 확인했다.
  양쪽 `/api/isolation-proof`는 다른 활성 tenant가 10개 존재하는 상태에서도 cross-tenant drafts 0을 반환했다.
  상대 tenant ID를 Instagram accounts 쿼리에 주입해도 각자의 무주입 응답과 byte-identical해 override가 무시됐고,
  토큰 2개 모두 revoke 뒤 `/api/me` 401을 확인했다. 운영 API 교차격리 증거는 충족한다.
- 비밀값 inventory에는 Meta·YouTube 앱 자격증명만 있고 X/TikTok 자격증명은 GitHub Secrets와 로컬 harness
  양쪽 모두 없다. 따라서 X/TikTok 실 OAuth·발행은 코드가 아니라 앱 생성/심사/credential 회수가 남은 외부 blocker다.
- 운영 고객 API에서 auth user 7명과 tenant 11개를 조회했고, 실제 Google provider 사용자 1명이 active tenant와
  연결돼 있음을 확인했다. 따라서 Google 유입→auth user→tenant lead 저장은 운영 관찰됐으며 비밀번호 원문은
  저장·반환되지 않는다. 신규 임의 A/B Google consent 왕복은 여전히 미검증이다.
- Google 계정전환 재발방지를 위해 deploy smoke가 preflight HTTP 200뿐 아니라 응답 authUrl의
  `prompt=select_account`까지 검사하도록 보강했다. focused contract 9 PASS, CI `29895690967` SUCCESS,
  deploy `29896414859` SUCCESS. 운영 smoke에서 login 200/me 401/google 200/operator customers 200과
  새 `google 계정선택 preflight` 성공 문구를 직접 확인해 운영 gate로 확정한다.

## 2026-07-21 SNS-018 ship hotfix operating close
- 고객 `/videos`의 잘못된 403과 테넌트 이미지 업로드·배달·삭제 불일치를 수정했다. 전역 clipping/ElevenLabs
  시크릿 경로는 운영자 전용 유지, tenant-safe YouTube/images만 허용한다.
- HMAC 목적 분리, 타 테넌트/경로탈출 차단, 10MiB 제한, 삭제 후 no-store, 장기 예약 발행 직전 재서명,
  업로드 401 재로그인을 구현했다.
- commit `15ec5d0e`, CI `29848488923`, deploy `29849273792` SUCCESS. 운영 고객 이미지 업로드 200,
  서명 HTTPS GET 200·`image/png`·원본 SHA-256 일치, 목록 반영, 삭제 200, 같은 URL 404를 관찰했다.
- 운영 Chrome `/videos` 재검증에서 operator-only cron 호출 403을 추가 발견해 역할 조건부 SWR로 교정했다.
  commit `176b3bd5`, CI `29850049736`, deploy `29850058481` SUCCESS. 재배포 후 `/api/images`와
  `/api/youtube/status`는 200, cron/clipping/ElevenLabs 요청과 전체 4xx/5xx는 0건이다. `/images`의 서명 이미지는
  browser `complete=true`, natural size 1x1로 렌더됐다.
- 최종 회귀: full 95 files/820 PASS·9 DB-env skip, TypeScript PASS, production build 162 pages PASS.
  QA 이미지 삭제 후 URL 404, 단기 토큰 revoke 후 같은 토큰 401, 원문 파일 삭제까지 관찰했다.
- SNS-018은 운영 관찰 종료. 전체 ship은 X/TikTok credential, Facebook 앱 상태, Instagram OTP,
  YouTube 실계정 업로드와 동일 provider 2계정 전환 등 외부 provider E2E 때문에 in-progress를 유지한다.

## 2026-07-19 GA4 first-hit hotfix build reopen
- 운영 격리 브라우저에서 신규 동의 직후 `/login` page_view 적재를 관찰했지만, 동의가 저장된 재방문 reload에서는
  `RouteTracker`가 `ConsentBanner` 초기화보다 먼저 실행되어 page_view가 유실됨을 직접 재현했다.
- `sendGaHit()`가 저장된 동의 상태에서 `window.gtag` 미초기화면 consent/config를 먼저 bootstrap한 뒤 이벤트를
  큐잉하도록 수정한다. focused test, typecheck, production build, 운영 재배포·network 재관찰 전 승인 금지.

## 2026-07-20 GA4 command-shape hotfix build reopen
- first-hit 배포 후 운영 dataLayer에는 명령이 보였지만 collect 0건, `gtag('get', measurementId, 'client_id')`가
  timeout됐다. gtag destination과 전용 스크립트에는 측정 ID가 실제 등록돼 있어 속성 미설정이 원인이 아니었다.
- 앱 shim이 공식 snippet의 native `arguments` 대신 rest Array를 push해 명령이 실행되지 않는 것이 원인이다.
  native Arguments 교정→focused/full test→build→CI→재배포→client_id 반환+collect 관찰 전 승인/ship 완료 금지.

## 2026-07-20 Instagram publish evidence hotfix build reopen
- 운영 T-02 IMAGE 발행은 성공했고 Graph에서 공개 permalink를 회수했지만 앱 응답/DB permalink가 비었다.
- 컨테이너가 20회 안에 FINISHED가 아니어도 media_publish를 호출하는 fail-open과 provider 원문 오류 노출도 확인했다.
- FINISHED timeout fail-closed, 성공 후 permalink 조회, 오류 원문 비노출을 수정·테스트·CI·배포하고 기존 media
  permalink를 DB/queue에 보강하기 전 승인/ship 완료 금지.

## 2026-07-20 SNS-014 Instagram build candidate
- Instagram FINISHED timeout을 fail-closed로 바꾸고, 신규 성공 및 기존 성공 재호출 모두 media permalink를
  회수하도록 수정했다. 기존 성공 분기는 외부 media_publish를 호출하지 않고 DB/queue URL만 보강한다.
- provider raw body는 오류 응답에서 제거했다. focused 18 PASS, 전체 78 files/673 PASS·9 DB-env skip,
  TypeScript clean, production 160-route build PASS, diff check PASS.
- CI SUCCESS와 운영 T-02 `alreadyPublished:true`/동일 permalink/DB·queue URL 보강/외부 게시물 1건 유지 전
  ship 완료 금지.

## 2026-07-20 SNS-014 Instagram operating close
- commit `020c44d9`, CI run `29735697748` SUCCESS 후 marketing VM에서 동일 commit 이미지를 직접 build하고
  `openclaw-dashboard-osmu`만 재생성했다. healthy/login 200/me 401/google 200/health 200.
- 기존 T-02 retry는 `alreadyPublished:true`, 동일 Instagram URL, queue published, token revoke 후 401. DB는
  published 1/distinct external 1/failed 0/permalink 1이고 queue payload에도 URL이 저장됐다.
- 공개 브라우저가 `zero_to_one_ai`, 273자 caption 전체, 1024x768 이미지를 직접 렌더했다. SNS-014는 운영 관찰로
  종료한다. 전체 ship은 X/TikTok credential, Facebook 앱 활성, Instagram 신규 로그인 OTP, YouTube 실업로드,
  provider 동일 테넌트 2계정 실전환, GA4 DebugView UI가 미검증이라 in-progress 유지한다.

## 2026-07-20 launch blocker operating refresh
- readiness available: Instagram, Threads, YouTube, Facebook(앱 모드 외부 확인 경고). credential missing: X,
  LinkedIn, Naver Blog, Pinterest, Tumblr, TikTok, Slack, Line.
- active channel accounts: Instagram 1, Threads 2; YouTube/Facebook/X/TikTok 0. 임시 token revoke 후 401.
- 즉시 마케팅 가능한 운영 관찰 범위는 Instagram IMAGE와 Threads TEXT/IMAGE. 전체 v1.0.0 ship은 외부 credential/
  앱 활성/실계정 callback 및 미구현 TikTok/Reels 때문에 in-progress다.

## 2026-07-20 SNS-015 Reels build reopen
- 사용자 `빨리 작동되도록 만들어` 지시로 코드에서 해소 가능한 영상 blocker를 재개방한다.
- YouTube 업로드 코드는 존재하지만 운영 연결 계정이 0개라 외부 OAuth 전 실업로드 불가. TikTok은 Content Posting API
  승인과 credential이 없어 구현 완료로 위조하지 않는다.
- 기존 active Instagram 계정을 활용한 Reels 발행을 구현한다. 종료조건은 tenant 격리, 공개 video URL 전달,
  container FINISHED fail-closed, provider 원문 비노출, 기존 성공 중복방지, focused/full test, CI, 운영 permalink다.

## 2026-07-21 SNS-015 Reels operating close (관찰됨)
- commit `1a6e7e5a` 기준 운영 DB schema 적용, 컨테이너 healthy, live health 200 · db up.
- 실제 테넌트 업로드 → 서명 미디어 HEAD 200, `Range: bytes=0-99` → 206 + 100 bytes.
- 실제 Instagram Reel permalink `https://www.instagram.com/reel/DbBPRa7iFff/` 회수. 동일 요청 재시도는
  `alreadyPublished:true` + 동일 permalink. DB rows 1/published 1/distinct external 1/permalink 1/failed 0.
- 임시 테넌트 토큰 revoke 후 동일 video list API 401 확인.
- gstack 공개 브라우저에서 `zero_to_one_ai`, 한국어 제목·본문·해시태그 원문, `readyState=4` 720x1280 8초 영상,
  렌더된 브랜드 프레임을 직접 관찰. 증거 `docs/evidence/sns015-instagram-reel-operating-20260721.png`.
- **SNS-015는 운영 관찰로 종료(closed).** 전역 ship은 계속 `in-progress`. X/TikTok credential, Facebook 앱 활성,
  Instagram 신규 로그인 OTP, YouTube 실업로드, 동일 provider 실계정 2개 전환, GA4 DebugView가 미검증이다.
- **정확한 다음 액션:** ①운영 관찰이 끝난 Instagram·Threads로 지금 마케팅을 개시한다 ②그와 별개 트랙으로
  위 외부 blocker를 하나씩 회수한다. 두 작업은 서로를 기다리지 않는다.

## 2026-07-21 SNS-016 Google login manual-deploy hotfix (관찰됨)
- 운영 격리 브라우저에서 Google 클릭이 HTTP 500, 콘솔 `supabaseUrl is required`임을 직접 재현했다.
- 동일 commit의 수동 Docker 빌드가 workflow 전용 `--build-arg NEXT_PUBLIC_SUPABASE_*`를 빠뜨린 것이 원인이다.
- 운영 이미지를 `.env.osmu`의 Supabase 공개값·GA4 ID로 재빌드/재기동했다. 컨테이너 healthy, DB up,
  `/api/auth/google` 200+authUrl, 브라우저 `accounts.google.com` 계정 입력 화면 이동을 직접 관찰했다.
- 재발방지: compose 필수 build args + workflow `--env-file .env.osmu` 단일 경로. focused 7 PASS,
  full 85 files/754 PASS·9 skip, TypeScript clean, production build 160 pages PASS.
- Claude 독립 리뷰는 2회 모두 무응답/Execution error로 종료되어 **미검증**이며 출고 근거에 포함하지 않는다.

## 2026-07-21 SNS-017 TikTok Direct Post build candidate
- TikTok OAuth의 `client_key`/`open_id` 규격을 교정하고, 다중계정 선택·creator-info·공개범위 직접 선택·상호작용 제한·
  AI 생성 표시·서명 PULL URL·비동기 상태 확인을 `/videos`와 `/api/video/publish`에 연결했다.
- focused 124 PASS, 전체 88 files/766 PASS·9 DB-env skip, TypeScript clean, Next.js 16 Webpack production build
  161 pages PASS, diff check PASS. 빌드가 함께 발견한 기존 route export/signature 결함도 교정했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지. 운영 TikTok credential과 앱 심사가 없어 실제 OAuth callback,
  creator-info, SELF_ONLY 영상 게시, status/permalink는 미검증이다. X/Facebook/Instagram OTP/YouTube/실 2계정 전환도 기존 blocker다.
- 다음 실행: commit을 운영 VM에 반영하고 health·Google 로그인 무회귀·TikTok credential 누락 UI를 실제 브라우저에서 관찰한다.
  credential이 회수되는 즉시 격리 계정으로 OAuth→SELF_ONLY 게시→status/permalink를 수집한다.
- 1차 운영 Chrome에서 tenant 없는 Instagram accounts 401이 operator token을 지우는 race와 TikTok/YouTube의 낡은
  “직접 발행 미지원” 문구를 관찰했다. workspace-scoped URL과 영상 발행 provider SSOT로 수정, focused 17 PASS·tsc clean.
- commit `cf0be864` 운영 Docker build 161 pages PASS, 컨테이너 healthy/DB up. 후속 Chrome에서 Instagram/TikTok accounts와
  readiness 모두 200, navigation 4xx/5xx 0건, TikTok credential 누락 disabled 문구와 Google→accounts.google.com 이동 관찰.
  증거 `docs/evidence/sns017-tiktok-disabled-operating-20260721.png`. 실 TikTok OAuth/게시만 외부 credential·앱 심사로 미검증.
- GA4: 격리 Chrome에서 분석 동의 후 measurement `G-MEEQ2D8C1J`의 `page_view`·`scroll`이 실제
  `google-analytics.com/g/collect`로 POST되어 둘 다 HTTP 204를 직접 관찰했다. 전송은 검증됨, DebugView UI는 미검증.

## 2026-07-21 SNS-017 TikTok async publication QA PASS
- TikTok init 전에 tenant/account/content/options 기반 `published_posts` 예약을 원자적으로 잡고, provider `publish_id`와
  final `post_id`를 `external_id`/`provider_post_id`에 분리 저장한다. privacy metadata로 공개 게시와 SELF_ONLY 완료 조건을
  분리하고, workspace-scoped 브라우저 polling으로 새로고침 복구와 tenant 전환 격리를 보장한다.
- 독립 QA 최종 focused 6 files/25 PASS, full 90 files/776 PASS·9 DB-env skip, TypeScript clean, Webpack production
  build 162 pages PASS, diff check PASS. QA가 발견한 workspace race, post ID 미영속, public creator-info transient,
  SELF_ONLY 무한 polling 가능성은 수정 후 회귀 테스트로 고정했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지한다. 운영 배포와 멱등 schema 적용 전이며, TikTok credential·Content
  Posting API 심사·실계정이 없어 실제 OAuth/Direct Post provider 왕복은 미검증이다.
- 다음 실행: 명시 파일 commit/push → OSMU 단독 deploy workflow → schema 컬럼, health/login/operator smoke와 live route
  반영 관찰. credential 회수 시 SELF_ONLY와 공개 게시를 각각 실제 계정으로 E2E한다.
- 1차 deploy run `29819032770`: DB schema와 image build PASS, compose `up` FAIL. build에서 사용한 `.env.osmu`를 up에서
  누락해 required public Supabase env interpolation이 실패했다. workflow up 명령과 계약 테스트를 교정해 재배포한다.
- 2차 run `29819335488`은 dispatch 서비스명 오입력으로 제외. 3차 run `29819793340`은 과거 수동 컨테이너가 compose 라벨
  없이 고정 이름을 점유해 교체 충돌. workflow에 앱 컨테이너 rollback rename/stop 및 기동 실패 자동 원복을 추가한다.
- 4차 run `29819971912`: 새 컨테이너 기동·healthy 및 public health 200/db up 관찰. 후속 `compose ps`의 env-file 누락으로
  workflow만 FAIL해 status 호출도 `.env.osmu`로 통일 후 재실행한다.
- 최종 commit `ca4596ab`: CI `29820483251` SUCCESS, deploy `29820488738` SUCCESS. 운영 container healthy,
  PostgreSQL 신규 컬럼 2개 실조회, public health/login/Google preflight와 auth 401 경계를 직접 관찰했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지한다. TikTok credential·앱 심사 부재로 실제 OAuth→SELF_ONLY/public
  Direct Post provider E2E가 미검증이기 때문이다. credential 회수 즉시 두 공개범위 실게시를 종료 증거로 수집한다.

> 2026-06-30 `init --adopt`. 이 레포는 이미 라이브 배포된 멀티테넌트 마케팅 SaaS라 plan~build는
> ADOPT(기존 인정). **현재 ship(in-progress).** 신규 기능(OAuth 연결, GA4, 가이드 등)은 build→qa→ship 게이트를
> `/approve`로만 통과한다. **배포(gh workflow / ship)는 `/approve qa` 후에만.** (과거 게이트 없는
> 자동 배포 = 하네스 위반, 재발 금지.)

## qa 단계 산출물/증거 (requires_evidence). 상세 docs/qa-tracker.md
- [x] docs/qa-tracker.md (2026-07-16 운영 배포·직접 E2E 증거 갱신)
- [x] prod-health-200 (반복 실측 ✅)
- [x] prod-demo-login-200 (2026-07-16 운영 가입→로그인→active tenant 저장 직접 관찰)
- [ ] e2e-happy (가입→미승인 403→운영자 승인→shared Claude 실생성 200 ✅ / Google 최종 왕복·SNS 실발행은 사용자 동의/콘텐츠 승인 대기)
- [x] e2e-edge (vitest 563 pass/8 skip + 라이브 미승인 403·Google provider preflight 200·SNS credential 비노출 실측)

## 2026-07-16 Google-only auth build
- 이메일/비밀번호 가입·로그인·확인메일·재설정 UI/API 호출 제거. `/signup`은 `/login`으로 수렴.
- 랜딩·오류문구·배포 스모크·gstack E2E를 `Google로 계속` 단일 경로 계약으로 변경.
- 운영자 고객 API/UI의 `send_password_reset`·Supabase `/recover` 경로와 관측성 enum을 제거. 관리자 기능은
  계정 정지/재개와 공유 AI 승인/회수만 유지하며, 직접 API 호출도 400 unsupported로 거부한다.
- 기존 auth user 6명은 삭제하지 않음. 조회 결과 전원 현재 `email` provider only이며, 동일 이메일 Google
  첫 로그인 시 identity linking 및 tenant 보존을 운영에서 확인해야 함.
- 직접 검증: Google-only/operator focused 98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, build PASS(161 pages),
  local gstack E2E PASS(`/login`, `/signup` 307, storage clear, email/password controls absent), Google 계정 화면 이동.
- QA 게이트 재개: Supabase Email provider 비활성화, 실제 Google 계정→앱 복귀→기존 user/tenant 보존과 신규
  lead 저장 운영 E2E가 ship 잔여다. QA는 2026-07-16 사용자 `/approve qa`로 승인됨.

## 2026-07-16 SNS P0 ship 재배포
- 커밋 `8b1ca33f`, deploy run `29496623489` 성공. 발행 UI를 실제 `/api/publish` 지원 8채널로 제한하고
  Instagram/Threads 저장 토큰을 provider read-only API로 검증하도록 운영 반영.
- live API와 인증 브라우저에서 Instagram `Connected`, Threads `Live`, 비밀 필드 비노출, 미지원 7채널
  고객 UI 비노출을 직접 관찰. Health Monitor run `29497421714` success.
- QA 임시 tenant token은 revoke 후 401 확인. 공개 SNS 게시물은 회장 콘텐츠 승인 전 실행하지 않음.
- ship 잠금 유지: Google 계정 선택→앱 복귀/lead 저장, Threads 실발행 permalink, GA4 DebugView, Slack webhook 회전.

## 2026-07-17 사용자 실기기 SNS 연결 NG. ship 차단
- 사용자 실기기에서 Threads 타계정 세션 고착, Instagram OTP rate limit, X credential 누락 500/raw JSON,
  Facebook 앱 비활성, Bluesky `openclaw.json not found`, 영상 플랫폼 연결·발행 누락을 확인했다.
- 기존 `Connected/Live` 증거는 provider read-only `/me`와 렌더까지만 확인한 부분 증거다. 계정 전환→2FA→동의
  →callback→저장→실발행 전체 왕복을 보지 않았으므로 e2e-happy 충족으로 사용하지 않는다.
- ship은 계속 `in-progress`, `artifacts_ok:false`. 수정 범위 사용자 확인 후 `/pipeline reopen build`로 재오픈하고,
  provider별 실제 브라우저 E2E 및 공개/삭제 가능한 테스트 발행 증거를 다시 수집해야 한다.
- 상세 NG와 재발방지 매트릭스: `docs/qa-tracker.md`의 `2026-07-17 사용자 실기기 SNS 연결 QA`.
- 사용자 추가 지시로 SNS-007(사이트 내 provider 다중계정 목록·추가·기본 전환·개별 해제·선택 발행)을
  동일 build에 포함. 기존 단일계정 토큰 무손실 migration과 cross-tenant 차단 E2E가 build 종료조건이다.

## 2026-07-17 SNS-007 다중계정 build candidate
- additive `channel_accounts`와 기본계정 legacy mirror, 계정 목록/기본전환/삭제 API·UI, Studio/예약/YouTube
  선택 발행을 구현했다. 최초 동시 OAuth callback은 provider 단위 advisory lock으로 직렬화한다.
- refresh token은 `refresh_enc`에만 암호화 저장하며 callback/meta 평문 기록을 금지했다. 예약 생성 시 선택
  계정의 tenant/provider/status를 검증하고, 명시 계정이 유효하지 않으면 기본계정으로 fallback하지 않는다.
- 자동 증거: `npm test` 72 files/630 pass·8 DB-env skip, `npx tsc --noEmit` PASS, production build 160 pages PASS,
  `git diff --check` PASS. 자동 테스트를 로컬 E2E로 승격하지 않는다.
- build 승인 전 미검증: production schema 적용, 실제 provider 2계정 OAuth 왕복, 기본전환 UI 직접 관찰,
  선택계정별 공개 테스트 발행 permalink/YouTube Shorts URL. `/approve build` 후 QA·배포 게이트로 이동한다.

## 2026-07-17 SNS-007 QA 진행
- build 승인을 반영해 QA로 전환했다. 실제 `upsertChannelAccount` 두 호출의 최초 연결 경쟁을 재현하는
  PostgreSQL 통합 테스트를 추가했다. 로컬은 DB 부재로 해당 1건 skip, 전체 73 files/630 pass/9 skip,
  `tsc --noEmit` PASS, production build 160 pages PASS다.
- QA 자동 종료 조건: GitHub CI PostgreSQL에서 신규 동시성 테스트가 skip 없이 실행되어 2계정 저장과
  provider 기본계정 정확히 1개를 관찰할 것. 운영 OAuth·실발행은 CI로 검증되지 않으므로 별도 미검증이다.
- 실제 DB 증거: GitHub Actions run `29572377311`(commit `592c4741`) SUCCESS. PostgreSQL 16에
  schema→seed→RLS 적용 후 73 files/626 pass/0 skip. 신규 동시성 테스트가 314ms에 실제 실행되어
  병렬 최초 callback 2건 저장과 기본계정 1개를 확인했다. 운영 OAuth·실발행 미검증은 유지한다.

## 최근 build (qa 대기 중. ship 전 /approve qa 필요)
- 셀프서브 코어: A1 증류 generateText 통일, A2 온보딩 위저드, A3 키검증, /api/health+autoheal+슬랙경보,
  성과 ConnectGate, 가입 confirm 탭.
- **소셜 OAuth '연결' 3종(IG·Threads·Facebook)**: `lib/social-connect`(provider config+토큰교환, FB는 페이지토큰),
  `api/connect/[provider]`(auth-url)+callback(per-tenant integrations 저장), `SocialConnectButton`+ChannelPage 배선.
- **setup-guides 재작성**: IG·Threads·FB를 "연결 버튼 먼저, 수동은 고급"으로.
- 검증: vitest 146 pass/8 skip(connect E2E 7 IG/Threads/FB 포함), tsc 0, build ✓. **라이브 미검증.**
- ⚠️ 일부(health·연결 초기버전)는 게이트 전 prod 배포됨. 연결 3종·가이드는 **미배포(게이트 준수, /approve qa 후)**.
- **라이브 qa 선행조건(사용자 액션)**: 배포 env `IG_APP_ID/SECRET`·`THREADS_APP_ID/SECRET`·`FB_APP_ID/SECRET` +
  Meta 앱 redirect URI `https://<live>/api/connect/{provider}/callback` 등록. 그 후 배포→browse로 qa 증거.

## 승인 로그 (append-only)
2026-07-20. SNS-015 build+qa APPROVED. 사용자가 반복 명시한 무중단·무질문 실행 지시(`빨리 작동되도록
  만들어`, `묻지 않고 빨리 진행`)를 승인 범위로 반영하고 추가 제품 승인 질문 없이 진행. 증거: focused 106 PASS,
  최신 전체 84 files/752 PASS·9 DB-env skip, `tsc --noEmit` clean, production 160-page build PASS.
  qa-verifier 품질 게이트 PASS(Skill qa-only 1회, WebFetch 5회, standards 품질헌법 Read). 운영 DB 중복 점검
  duplicateGroups=0·totalExtra=0을 컨트롤러가 직접 관찰. 운영 origin은 HTTPS이고 미디어 서명은 전용
  `MEDIA_SIGNING_SECRET` 없이 `DASHBOARD_AUTH_TOKEN` 파생 폴백으로 구성(전용 시크릿=false).
  `artifacts_ok:false` 유지. 실제 Meta Reels permalink를 직접 관찰하기 전 ship 완료 금지. 기존 전역 ship
  blocker(X/TikTok credential, Facebook 앱 활성, Instagram 신규 로그인 OTP, YouTube 실업로드, 동일 테넌트
  provider 2계정 실전환, GA4 DebugView UI)는 그대로 유지된다.
2026-07-20. SNS-014 build+qa APPROVED. 사용자의 반복 무중단 실행 지시와 최신 `고`를 승인 범위로 반영하고
  추가 제품 승인 질문 없이 진행. commit `020c44d9`, focused 18 PASS, local full 78 files/673 PASS·9 DB-env skip,
  TypeScript와 production 160-route build PASS. GitHub Actions run `29735697748` typecheck/build/PostgreSQL
  schema→RLS/full test SUCCESS. OSMU 배포 후 기존 T-02 Instagram 재호출의 alreadyPublished/동일 permalink/
  DB·queue 보강/외부 게시물 1건 유지 관찰 전 ship 완료 금지.
2026-07-20. GA4-002 build+qa APPROVED. 사용자의 무중단 진행 지시를 기존 승인 범위로 적용하고 추가 제품 승인
  질문 없이 진행. commit `7c84d533`, focused 18 PASS, local full 77 files/669 PASS·9 DB-env skip, TypeScript와
  production 160-page build PASS. GitHub Actions run `29728777597` typecheck/build/PostgreSQL schema→seed→RLS/
  full test SUCCESS. 운영 client_id callback+collect 직접 관찰 전 ship 완료 금지.
2026-07-20. GA4-001 build+qa APPROVED. 사용자의 최신 `진행해`와 반복된 무중단 진행 지시를 승인 근거로
  반영. commit `af50af17`, focused analytics 18 PASS, local full 77 files/669 PASS·9 DB-env skip, TypeScript와
  production 160-page build PASS. GitHub Actions run `29719316459`은 typecheck/build/PostgreSQL schema→seed→RLS/
  full test 전부 SUCCESS. 독립 Claude review의 이중 bootstrap·명령 순서·회귀 테스트 지적을 모두 반영했다.
  운영 저장동의 reload의 page_view/collect 직접 관찰 전 ship 완료 금지.
2026-07-19. SNS-013 build+qa APPROVED. 사용자 반복 지시를 승인 근거로 반영. commit `809c3422`,
  CI run `29684392717` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. focused 27 PASS,
  기존 성공 external ID permalink-only recovery와 외부 publish 미호출 회귀 포함. 운영 URL 회수 전 ship 완료 금지.
2026-07-19. SNS-010 build+qa APPROVED. 사용자 반복 지시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 승인 근거로 반영. commit `c66e0b16`, CI run `29682690931` typecheck,
  production build, PostgreSQL schema→seed→RLS, full test SUCCESS. focused 29 PASS에 IN_PROGRESS→FINISHED,
  ERROR/EXPIRED와 원문 비노출 경계 포함. 운영 T-PIN-01 permalink 전 ship 완료 금지.
2026-07-19. SNS-012 build+qa APPROVED. 사용자 반복 지시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 승인 근거로 반영. commit `7511cf90`, CI run `29681441400`이 typecheck,
  production build, PostgreSQL schema→seed→RLS, full test SUCCESS. focused 14 PASS에서 실제 queue JSON
  draft→published와 DB shadow UPDATE를 확인. 운영 첫 발행/순차 재호출/외부 게시물 1개 관찰 전 ship 완료 금지.
2026-07-19. SNS-011 build+qa APPROVED. 사용자의 반복 명시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 영속화 운영 핫픽스 승인으로 반영. commit `496328dd`, CI run `29671089099`
  typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. persistence contract 2 PASS와 compose config PASS.
  운영 고정 volume에 DB shadow 2건 복구 완료. 재배포 후 동일 draft ID 존속과 T-PIN-01 permalink 관찰 전
  ship 완료 금지.
2026-07-19. SNS-009 qa APPROVED. 사용자가 반복 명시한 `개발 QA 배포 진행`, `묻지 않고 빨리 진행`,
  `빨리 되게 만들어` 지시에 따라 이번 핫픽스도 QA 증거 충족 후 ship 진행 승인으로 반영. commit `bcc32f10`,
  GitHub Actions run `29661214375` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. qa-verifier
  blocker/high 0, QA Skill/WebFetch/dev standard 품질 PASS. OSMU 재배포 후 T-PIN-01 permalink 직접 관찰 전
  ship 완료 금지. SNS-010은 이미지 발행 전 별도 build 필수.
2026-07-19. SNS-009 follow-up build APPROVED. 첫 QA가 발견한 container/publish network throw 500을
  안전한 `ok:false`로 정규화하고 malformed JSON/id 누락까지 회귀 4건으로 고정. focused 43 PASS,
  identity 9 PASS, tsc clean. 최종 qa-verifier는 `standards/dev.md` Read, QA Skill 1회, WebFetch 2회로
  품질 verifier PASS, blocker/high 0, TEXT build 조건부 PASS. 사용자의 지속적 수정·출시 진행 지시 범위로
  build 승인을 재고정해 QA로 전환. IMAGE polling/result-unknown은 SNS-010으로 분리, 이미지 발행 전 해결.
2026-07-19. SNS-009 build APPROVED. 사용자가 운영 발행 실패를 지적한 뒤 `아 빨리 되게 만들어`라고
  수정·출시 진행을 명시했고, 직전부터 반복한 `묻지 않고 빨리 진행` 지시 범위 안에서 build 진행 승인으로
  반영. 증거: commit `a48460a0`, focused 68 PASS, tsc clean, production build 160 pages PASS,
  GitHub Actions run `29658880396` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. QA로 전환하되
  독립 검증과 운영 T-PIN-01 permalink 관찰 전 ship 완료 금지.
2026-07-18. qa APPROVED. 직전 보고에서 QA 승인 추천, 승인 시 OSMU 단독 배포·실 Chrome E2E,
  미승인 시 운영 popup 결함 유지라는 결과를 제시했고 사용자가 `진행`으로 응답해 QA 진행 의사를 확인.
  독립 qa-verifier blocker/high 0, RUBRIC 23/25, QA Skill 1회, WebSearch/Fetch 3회,
  verify-agent-quality PASS. commit `e66e6f76`, CI run `29608715956` SUCCESS. ship으로 전환하되
  Facebook/YouTube popup target과 provider host를 직접 관찰하기 전 ship 완료 금지.
2026-07-18. build APPROVED. 직전 보고에서 `/approve build` 추천, 승인 시 QA 재검증, 미승인 시
  운영 popup 결함 유지라는 결과를 평문으로 제시했고 사용자가 `진행`으로 응답해 build 진행 의사를 명확히
  확인. 증거: commit `e66e6f76`, focused 10 PASS, full 74 files/644 PASS·9 DB-env skip, tsc clean,
  production build 160 pages PASS, GitHub CI run `29608715956` typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test SUCCESS. QA 단계로 전환하며 QA 승인 전 운영 배포 금지.
2026-07-18. build REOPENED FROM SHIP. 운영 headless Chrome에서 X readiness 안내는 통과했으나
  Facebook OAuth 버튼 클릭 후 새 target이 생성되지 않았다. 공통 `SocialConnectButton`이 auth URL fetch를
  await한 뒤 `window.open()`을 호출해 브라우저 사용자 제스처를 잃는 popup-blocker 구조임을 코드와 운영
  브라우저로 확인. Instagram/Threads/Facebook/YouTube 공통 영향이므로 synchronous blank popup→URL 이동
  hotfix, 회귀 테스트, CI, build/qa 재승인, 재배포 전 ship 완료 금지.
2026-07-17. hotfix build+qa APPROVED. 운영 Chrome에서 발견한 tenant account API 403의 교정 범위만
  재검증. commit `15b09a2c`, GitHub Actions run `29598660707`에서 typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test 전부 성공. 로컬 focused proxy test 39 PASS, full 73 files/634 PASS/9
  DB-env skip, production build 160 pages PASS. 사용자가 `QA승인`을 명시했으므로 QA 승인으로 반영하고,
  기존 승인 build 범위의 회귀 핫픽스 증거도 함께 재고정해 ship으로 전환. 운영 재배포 후 동일 고객 토큰
  Chrome E2E가 통과하기 전 ship 완료 금지. 외부 provider 2계정 OAuth·실발행은 계속 미검증.
2026-07-17. build REOPENED FROM SHIP. 운영 Chrome E2E에서 신규 `/api/channels/{provider}/accounts*`
  3개 경로가 proxy tenant-aware allowlist에 없어 실제 고객 osmu/JWT가 403 `이 API는 운영자 전용입니다`를
  받는 결함을 직접 관찰. hotfix→CI→build/qa 재승인→재배포 전 ship 완료 금지.
2026-07-17. qa APPROVED. 사용자 명시 입력 `QA승인`. 재검증 증거: GitHub Actions run `29572377311`
  PostgreSQL 16 schema→seed→RLS 적용 성공, 73 files/626 PASS/0 skip, SNS-007 최초 동시 callback 2건과
  기본계정 1개 실 DB 관찰. 운영 OAuth·브라우저 계정전환·실발행은 ship 단계 미검증으로 유지.
2026-07-17. build APPROVED. 사용자 명시 입력 `승인하다고 /approved build`. 명령 오타와 무관하게
  build 승인 의사가 명확하므로 승인으로 처리. 재검증 증거: commit `98896f30`, full 72 files/630 PASS/8
  DB-env skip, `tsc --noEmit` PASS, production build 160 pages PASS, `git diff --check` PASS. QA 단계로 전환.
2026-07-17. build REOPENED. 사용자 명시 지시 `진행해서 싹 되게해`. SNS-001~006 사용자 실기기
  결함을 수정하기 위해 ship에서 build로 재오픈. 코드 수정→로컬 E2E→실브라우저 운영 QA 후 build/qa 재승인 필요.
2026-07-16. qa APPROVED. 사용자 명시 입력 `/approve qa`. 재검증 증거: Google-only/operator focused
  98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, production build 161 pages PASS, local gstack Google-only
  E2E PASS. 운영 배포 후 Google 실왕복·SNS 연결/발행·lead 저장은 ship 단계 직접 관찰 대상으로 유지.
2026-06-30. ADOPTED(pre-harness). plan·design·eng-design·build 기존 산출물 인정, current=qa.
2026-07-03. HOTFIX 배포(게이트 예외). 이미 라이브인 IG 연결의 "Invalid redirect_uri"(프록시 뒤
  origin=0.0.0.0 실측) 수정. 신규 스코프 아님·라이브 깨짐 복구. 커밋 e8603547, run 28611637538,
  라이브 redirect_uri 정상 검증. vitest 9 pass·tsc0. qa 게이트는 유지(IG 로그인→실발행 E2E 후 /approve qa).
2026-07-10 04:51 KST. qa APPROVED. 회장 승인 계획(fable-purrfect-bumblebee.md, Phase 1) 기반.
  증거 재검증: prod-health-200 ✅(당일 재실측 {ok,db:up}) · e2e-edge ✅(vitest+라이브 에러분기 실측) ·
  prod-demo-login-200 🟡(운영자 /api/me 200 실측, 고객가입은 Email Confirm 외부설정 대기) ·
  e2e-happy 🟡(vitest 190 PASS + 라이브 생성 성공 실측, 실발행은 라이브 채널 OAuth 대기).
  🟡 2건은 이번 배포 없이는 수집 불가(라이브 로그인 UX 수정 자체가 배포 대상)라 배포 후 Phase 2/4에서
  수집 의무. **ship 게이트는 라이브 증거(비번찾기·preflight·Google 실로그인·실발행 관찰) 완성 전 잠금 유지**.
  당일 배포 전 재검증: vitest 37f/190 PASS·build PASS·verify-e2e PASS(port 3459)·커밋 위생 7커밋 런치트랙만.
  (artifacts: docs/qa-tracker.md 2026-07-10 04:45 섹션)
2026-07-16 03:22 KST. ship 후보 운영 배포(run `29422450258`, head `b361d951`) 성공.
  직접 증거: health 200/DB up, live browser public E2E PASS, 합성 QA 가입자 auth user+active tenant 저장,
  shared AI 미승인 403→operator 승인시각 저장→실제 `claude -p` 생성 200, password recovery 요청시각 저장,
  Health Monitor run `29438972593` HTTP 200/up 상태 캐시 저장. **ship 완료/`v1.0.0` 태그는 잠금 유지**:
  Google 계정 최종 OAuth 왕복·GA4 DebugView 수신·custom SMTP 메일함 수신·Instagram/Threads 프로필/첫
  게시물 실제 확인이 남음. (artifact: docs/qa-tracker.md 2026-07-16 섹션)
2026-07-16 06:31 KST. Google/GA4/Slack 외부 설정 반영.
  Google preflight 200 및 실제 accounts.google.com 로그인 화면 이동 관찰. GA4/Slack GitHub secrets 저장 후
  deploy run `29452057807` success. 운영 브라우저에서 동의 전 GA script 없음, 동의 후 G-MEEQ2D8C1J script
  200 + consent update + page_view 적재 관찰. Slack webhook 실제 POST `ok` 관찰. Google 계정 입력 후 앱 복귀,
  GA4 DebugView 수신은 미검증. 첫 deploy run `29451844552`는 잘못된 service 입력 `osmu`로 실패했고 실제
  service `openclaw-dashboard-osmu`로 재실행해 시정.

## Blocked / Notes
- SNS-013 build REOPENED FROM SHIP: 폴링 배포 후 실제 T-PIN-01 발행은 DB published 1/queue published로
  성공했지만 직후 permalink 조회가 비어 API 응답에 URL이 없었다. 외부 재발행 없이 기존 external_id의 permalink를
  최대 5회 재조회하고 성공 기록·queue JSON/DB를 보강하는 순차 retry 복구 경로 추가. focused 27 PASS, tsc PASS.
  운영 동일 요청 alreadyPublished:true+permalink, DB published/distinct external 1 전 ship 완료 금지.
- SNS-010 PROMOTED TO SHIP BLOCKER: SNS-009/SNS-012 운영 배포 후 T-PIN-01 TEXT 실발행에서 container 생성은
  성공했지만 즉시 `threads_publish`가 provider 400을 반환했다. 기존 QA의 "IMAGE에만 상태 폴링 영향" 판단을
  운영 증거로 폐기. 모든 Threads container를 `FINISHED`까지 최대 20초 폴링하고 `ERROR/EXPIRED`/unknown/
  timeout은 fail-closed하도록 구현. focused 29 PASS, tsc PASS. CI→재승인→재배포→동일 draft permalink 전 ship 금지.
- SNS-012 build REOPENED FROM SHIP: `/api/publish` 성공이 `published_posts`만 기록하고 원 queue JSON/DB
  shadow를 `published`로 전환하지 않아 UI에 draft가 남고 순차 재클릭 시 동일 외부 게시물을 다시 만들 수 있다.
  동일 tenant+draft+platform+account 성공 기록을 외부 호출 전에 재사용하고, 첫 성공 뒤 queue JSON과
  `queue_posts`를 함께 published로 갱신하도록 수정. focused 14 PASS, tsc PASS. CI→build/qa 재승인→재배포
  →T-PIN-01 첫 발행과 동일 요청 재호출 `alreadyPublished:true`/외부 게시물 1개 관찰 전 ship 금지.
- SNS-011 build REOPENED FROM SHIP: deploy workflow가 checkout 전 `$GITHUB_WORKSPACE` 전체를 삭제하지만
  OSMU queue/config는 그 내부 상대 bind mount(`./data-osmu`, `./config-osmu`)를 사용해 배포 직후 파일이
  초기화됐다. 운영 컨테이너 `/app/data`와 `/app/config`가 비어 있음을 직접 관찰했고 DB `queue_posts`
  그림자 사본에는 T-PIN-01/T-02 두 draft가 남아 있다. 고정 이름 Docker volume으로 전환하고 상대 bind
  mount 재도입 방지 계약 테스트를 추가했다. CI→build/qa 재승인→DB 사본 복구→재배포→재배포 후 초안
  존속→T-PIN-01 실발행/permalink 전 ship 금지.
- SNS-009 QA reopen: 첫 qa-verifier는 blocker/high 0, RUBRIC 23/25를 냈지만 Skill/WebSearch 0으로 품질
  verifier FAIL이라 승인 근거에서 제외. 동시에 Threads container/publish fetch 네트워크 예외가 route 밖으로 throw돼
  HTTP 500이 되는 LOW 결함을 발견했다. 안전한 `ok:false` 정규화+회귀 테스트+재CI 전 build 승인 취소.
- SNS-010 follow-up: Meta 공식 Threads 컬렉션 기준 IMAGE container 상태 폴링과 publish 응답 단절 후 결과불명
  처리가 없다. 현재 출시 정본 T-PIN-01은 TEXT이고 SNS-009 QA blocker/high 0이라 별도 후속으로 분리한다.
  새로 추가했던 publish 15초 timeout은 실제 성공 오판·중복 위험 때문에 제거. 이미지 공개 발행 전 SNS-010 해결.
- SNS-009 build candidate: 매 발행 전 Threads token `/me?fields=id`를 신뢰원으로 사용하고 저장 userId는 발행
  URL에서 제거. readiness는 live id 누락·파싱 실패를 fail-closed하고 저장/live mismatch를 invalid 처리한다.
  focused 68 PASS, tsc PASS, production build 160 pages PASS. full run은 653 PASS·9 skip 뒤 기존 5초 timeout
  2건이 발생해 해당 테스트 제한을 15초로 조정했고 단독 36 PASS를 확인했다. CI·운영 배포·T-PIN-01 permalink는
  미검증이며 `/approve build` 전 QA 전환 금지.
- SNS-009 운영 결함으로 build 재오픈: readiness는 Threads `/me?fields=username` 200만 보고 `valid` 처리하지만,
  publish는 저장된 stale `meta.userId`를 URL에 사용해 provider 400 `Unsupported post request` 발생. 공개 게시물
  생성 없음, T-PIN-01 draft 보존, token revoke+401 확인. token 실제 `/me?id`와 저장 ID 비교·발행 시 실제 ID
  사용 회귀 테스트→CI→build/qa 재승인→재배포→동일 정본 permalink 관찰 전 ship 금지.
- SNS-008 운영 Chrome 부분 통과: OSMU 단독 deploy run `29639946525` SUCCESS. 단기 고객 토큰을 넣은
  분리 Chrome에서 X credential 누락 비활성 안내, Facebook mode 경고, Facebook 클릭 후 새 target의
  `www.facebook.com` 이동, YouTube 클릭 후 새 target의 `accounts.google.com` 이동, TikTok/Reels 미구현
  표시를 직접 관찰했다. 증거 `docs/evidence/sns008-live-oauth-popup-e2e-20260718.png`. 토큰 revoke 후
  동일 readiness API HTTP 401과 원문 삭제 확인. popup activation 결함은 운영에서 교정됐지만 provider
  로그인·동의·callback/DB 저장·실 2계정 전환·공개 발행은 미검증이므로 ship/artifacts는 잠금 유지.
- SNS-008 독립 QA 최종 PASS: qa-verifier가 standards/dev.md, QA Skill, MDN, source/callback/test/CI를
  read-only 재검증. focused 10 PASS + 관련 callback tests, full 74 files/644 PASS·9 local DB skip,
  tsc/build/CI SUCCESS를 대조했고 blocker/high 0건, RUBRIC 23/25. `verify-agent-quality.sh`는 Skill 1회,
  WebSearch/Fetch 3회, 소크라/레드팀 3개를 확인해 PASS. 첫 2회 위임은 각각 표준 Read/QA Skill 누락으로
  반려되어 승인 근거에서 제외. 운영 Chrome post-fix popup target은 QA 승인·재배포 전 미검증.
- SNS-008 OAuth popup activation build candidate commit `e66e6f76`. 운영 Chrome에서 기존 구현의 Facebook
  popup target 0개를 직접 관찰해 build 재오픈. synchronous blank popup 예약, failure/callback/unmount/
  pending-fetch/React StrictMode 생명주기를 컴포넌트 테스트 10건으로 고정했다. 메인세션 focused 10 PASS,
  full 74 files/644 PASS·9 DB-env skip, tsc/build(160 pages) PASS. GitHub CI run `29608715956`은 Node 설치,
  typecheck/build, PostgreSQL 16 schema→seed→RLS, full test 전부 SUCCESS. build 승인 후 QA 재배포 전에는
  Facebook/YouTube popup target 생성이 미검증. readiness QA token은 revoke 후 HTTP 401 및 원문 삭제.
- SNS-007 tenant proxy 핫픽스 운영 배포 run `29600031321` SUCCESS. 고객 `osmu_` 토큰을 넣은 실제 Chrome에서
  Instagram/Threads AccountManager의 계정 1개·외부 ID·기본·정상·삭제 컨트롤을 직접 관찰했다. QA 토큰은
  revoke 후 동일 account API HTTP 401 확인 및 원문 삭제. ship은 계속 잠금: 실제 provider 2계정 OAuth,
  기본 전환, 계정별 공개 발행 permalink/Shorts URL은 미검증.
- SNS P0 QA remediation(2026-07-16): UI를 직접 발행 8채널로 정렬하고 Instagram/Threads provider live validation 및 재연결 상태를 구현. focused 75 PASS, full 563 PASS/8 skip, tsc/build PASS. 운영 재배포 후 code190 상태 직접 관찰 필요.
- Google OAuth: Google-only 코드 운영 배포(run 29485147720), provider 활성화·Google 로그인 화면 이동 관찰. 계정 입력→앱 복귀 실왕복 필요.
- Email auth: Google-only 정책 강제를 위해 Supabase Email provider 비활성화 필요. 기존 6 users는 삭제 금지.
- GA4: ID 주입·재배포·동의 기반 script/page_view 적재 관찰. GA4 DebugView 실수신 필요.
- Slack: webhook secret 주입 및 실제 ping `ok` 관찰. 채팅에 노출된 webhook은 출시 전 회전 필요.
- SMTP: Google-only 정책 확정으로 도입하지 않음. 비밀번호 재설정 경로 폐기.
- Meta: 회장 보고상 Instagram 계정 생성. 프로필 URL/리네임/이미지/첫 draft 및 Threads는 미검증.

## 2026-08-01 plan 산출. 고객 연결→초안→검수→실발행 PRD v2.0.0
- `docs/prd-osmu-customer-publishing-flow-v2.0.0.md` 초안을 생성했다. 기반은 기존 회장 요청 13개,
  신규 시크릿 창 연결/상태/IA/발행/502 실패, P0-6 Threads 계정전환 재제보, 2차 백로그 7개다.
- One Thing은 “신규 고객이 자기 SNS를 확실히 연결하고 같은 구조에서 초안-검수-실발행 permalink를
  확인하는 것”으로 유지했다. MVP 5개와 `L-01~13`, `N-01~09`, `B-01~07` 전 요구에
  Given/When/Then 수용기준을 붙였다.
- 제품 소스·API·DB·디자인·배포는 수정/확정하지 않았다. plan-critic 비평과 회장 질문 4개 답변,
  `/approve plan`이 없어 plan은 `in-progress`, `artifacts_ok:false`를 유지한다.
- 검증: 문서 425줄, 페르소나 본문 1,006자, 요구 AC 29개, 회장 질문 4개, `git diff --check` PASS,
  Obsidian open 성공. `verify-agent-quality.sh`에 산출물 md를 직접 넣은 실행은 트랜스크립트 전용 파서라
  실제 WebSearch 2회를 보지 못하고 뇌피셜 FAIL을 반환했으며, 올바른 위임 transcript로 재검증해야 한다.

## 2026-08-01 plan critic cycle 1 + PRD retake 1
- `plan-critic` 판정은 `GO-with-changes`: master 요구 29개는 보존하되 최초 PRD가 한 사이클 범위와 AC를
  과대 결합해 design 진입을 반려했다.
- `prd-architect` 리테이크로 One Thing을 외부 고객 1명·Threads 계정 1개·확인된 브랜드 사실·게시물
  1건·실제 permalink 1개로 축소했다. 29개 요구를 R0/R1/R2/Backlog/기존완료-회귀TC로 재분류하고
  증거·owner·atomic AC·QA TC를 붙였다.
- 회장 질문 3개(외부 SaaS/내부 인프라 primary, Threads 단독/Instagram 동시 activation, 첫 10명 AI
  비용 공급)는 `asked`, `answered: 0`. 7원칙은 5/7 PASS로 plan `artifacts_ok:false`를 유지한다.
- 다음: 회장 답변 → PRD 최종 PATCH → plan-critic 재확인 → `/approve plan`. 그 전 design 진입 금지.

## 2026-08-01 plan 산출. client-ready PRD v2.1.0 후보
- 새 정본 후보 `docs/openclaw-auto-osmu-prd-v2.1-gpt-codex.md`를 생성했다. 실패본 v2.0.0은 수정하지 않았다.
- One Thing은 외부 고객 1명·확인된 Threads 계정 1개·확인된 브랜드 사실·사람 승인 게시물 1건·실제
  permalink 1개로 유지했다. 마스터 요구는 기존 13 + 신규 9 + 백로그 계열 7 = 29개다.
- 검증: 목차/앵커 22/22, 내부 링크 27/27, 페르소나 공백 제외 710자, 사용자 관찰 7개,
  요구/원자 AC/QA TC 29/29/29, R0/R1/R2/Backlog 15/5/7/2, Mermaid 14노드 구조검사,
  벤치마크·푸터·툴콜 잔재 검사를 `/tmp/osmu-prd-v2.1-validation.log`에서 12/12 PASS했다.
- Obsidian 열기 명령은 exit 0으로 관찰했으나 sandbox가 창 조회와 화면 캡처를 거부해 시각 내용은 미검증이다.
- 회장 결정 3개(외부 SaaS/내부 인프라, Threads 단독/Instagram 동시, 첫 10명 AI 비용)는 여전히
  `asked`, `answered: 0`이다. `/approve plan`도 없어 plan `in-progress`, `artifacts_ok:false`, design 진입 금지다.

## 2026-08-02 plan 결정 반영 + v2.2 독립 비평
- 회장의 "다음 파이프라인 진행해" 및 직전 재기획 전체 진행 명령을 이번 plan 기본안 채택으로 기록한다:
  Threads 단독 R1, Instagram은 R0 연결·상태 회귀차단과 R2 image 경계, Postiz Cloud/self-host/current
  OSMU 3안 비교, 첫 외부 10명 AI credit 고객당 USD 5·총 USD 50 실험상한(unsourced), 실패요청 미차감,
  BYOK 선택, 개인정보 제품 DRI=회장(SJ)/서비스 운영자. 이전 `asked`, `answered: 0` 기록은 이 입력으로
  superseded 됐다. 공급자 계약·법률 자문·backup DRI는 외부 출시 전 별도 승인 gate다.
- `docs/openclaw-auto-osmu-prd-v2.2-gpt-codex.md`는 29 master/67 atomic AC와 실제 QA/미등록 seed
  구분을 복원했으나 독립 plan-critic이 RETAKE-MAJOR로 반려했다. 남은 차단은 글로벌 V0와 pilot slice
  경계, L-03 6분할, L-04 노출면 매트릭스, cross-tenant hard stop, Instagram 기존 QA supersession,
  총예산·주당 운영시간 appetite다. plan은 계속 in-progress이며 v2.3 리테이크 후 재비평한다.

## 2026-08-02 plan critic cycle 3 수렴
- v2.4는 v2.3의 마지막 MAJOR 2건을 닫았다: AI·SaaS·인프라·법률·세금·결제수수료·외부 인건비를
  포함한 총 현금지출 USD 500 hard cap과 6사업 자기잠식/OSMU 우선중단 규칙이다.
- 독립 plan-critic 최종 판정 PASS, major_findings 0. master 29, atomic AC 73, QA seed 65,
  TOC 19, Mermaid 1 보존을 재확인했다. v2.4 작성 품질 verifier도 WebSearch/Fetch 12·소크라 4로 PASS.
- 브라우저 직접 관찰: title v2.4.0, H1 정상, TOC link 19, Mermaid SVG 1, raw Mermaid false,
  console error 0, screenshot `/private/tmp/osmu-prd-v2.4.png`.
- plan 산출물 체크리스트 PRD/one-thing/persona/bm/risks가 모두 존재해 status를 awaiting-approval,
  artifacts_ok true로 전환했다. 다음은 `/approve plan` 재검증이다.

## Approval Log
- 2026-08-02 20:28 KST. plan APPROVED. critic cycle 3 major_findings 0, chairman questions
  asked 3/answered 3, v2.4 browser title/H1/TOC 19/Mermaid SVG 1/console error 0 직접 관찰,
  PRD quality verifier PASS and artifact views verifier PASS
  (artifacts: PRD v2.4.0 + one-thing/persona/bm/risks v2.4.0 pins)
- 2026-08-02 20:29 KST. ⟲ REOPEN plan. 승인 직후 별도 view 4개가 v2.3 정본 핀인 drift를 발견해
  승인 로그를 무효화하고 재잠금. v2.4 view 재추출·검증 후 `/approve plan` 재실행.
- 2026-08-02 20:35 KST. plan APPROVED. v2.4 정본과 별도 view 4개 모두 v2.4.0 핀으로 정합,
  critic cycle 3 major_findings 0, chairman questions asked 3/answered 3, PRD·view quality verifier PASS,
  브라우저 title/H1/TOC 19/Mermaid SVG 1/console error 0 직접 관찰
  (artifacts: PRD v2.4.0 + one-thing/persona/bm/risks v2.4.0-view.1)

## 2026-08-02 design cycle 1. 사용자 리뷰 대기
- 승인 PRD v2.4.0 핀을 기반으로 `DESIGN.md`, `docs/user-flow.md`, wireframe 4개, 클릭형 prototype hub
  `docs/prototype/openclaw-auto-osmu-customer-publish-hub-v1-gpt-codex.html`을 생성했다.
- design quality verifier는 transcript 호환 정규화 후 PASS: design skills 4, WebSearch/Fetch 3,
  소크라 마커 3, Design Score B. 독립 브라우저 관찰은 title/H1 정상, 28 buttons, 10 view/state nodes,
  console error 0. 연결→wrong-account 실제 클릭과 목표/반환 handle 분리를 확인했다.
- 에이전트의 전체 검증: 6 screens × 8 states = 48 렌더, missing H1/canvas/button 0, mobile overflow 0,
  44px 미만 product touch target 0, success receipt/proof links 관찰. 실제 고객 사용성은 미검증이다.
- design stage는 승인 전 `in-progress` 유지. 사용자에게 routing hub 1개를 open했고 티키타카 피드백을 기다린다.

## 2026-08-02 design cycle 2. DESIGN-001 리테이크
- 사용자 피드백으로 v1을 반려했다: 내부용어(`브랜드 사실`, `발행 근거`, `permalink`)가 이해되지 않고,
  loading shimmer가 과하며, Threads 단일 도구인지 전체 OSMU인지 제품 범위가 보이지 않았다.
- 사용자 `다음에 할거 진행해`를 추천 수정안 승인으로 받아 product-designer에 v2를 재위임했다.
  전체 OSMU 지도(콘텐츠·플랫폼별 초안·Queue/예약·채널·발행기록·분석·설정)를 먼저 보여주고,
  Threads만 연결→생성→검수→즉시/예약→게시물 링크까지 완전 동작 경로로 표현한다.
- 종료조건: 고객용 용어, 최소 loading, 다채널 capability/후속 경계, 48+ 상태 렌더, desktop/mobile,
  dead-end 0, Design Review B 이상, quality verifier PASS, 최종 v2 hub 1개 브라우저 open.
- 결과: v2 hub와 product-map/platform-delivery wireframe을 생성했다. design verifier는 transcript
  호환 정규화 후 PASS(design skills 4, WebSearch 4, 소크라 5, Design Score B), 에이전트 평가는 B+.
- 컨트롤러 직접 브라우저 관찰: 첫 H1이 한 원문→채널별 변환→발행을 설명, 구 내부용어 3종 0,
  전체 지도·Queue/예약·Threads 완전지원·Instagram 준비중 표시, console error 0. 실제 클릭으로
  플랫폼별 초안→Threads 검수→즉시/예약 선택→20:00 예약→캘린더 `예약됐어요`까지 확인했다.
- 전체 검증: 10 screens × 9 states=90, 주요 행동/h1 누락 0, mobile overflow 0, 동시 loading region 최대 1,
  dead-end 0. 사용자 이해 재확인 전 design은 계속 in-progress이며 승인하지 않는다.

## 2026-08-02 방향 전환. 기존 구현 안정화 우선
- 사용자 결정: 새 정보구조를 먼저 확정하지 않고 현재 서버에 이미 구현된 로그인·OAuth·채널 상태·Settings·
  Queue/Studio·발행 경로를 실제로 돌아가게 복구한 뒤 UI를 증분 업데이트한다.
- design cycle 2는 승인 후보에서 제외하고 `in-progress` 상태로 보류한다. 기존 구현 보존 traceability 없는
  전면 재설계는 채택하지 않는다.
- code-builder `osmu_stabilize_live`에 현재 운영 재현→근본원인→최소 패치→focused test/typecheck/build를
  위임했다. 외부 Meta 로그인·OTP·동의가 필요한 실제 callback은 관찰 전까지 미검증이다.
- 다음 게이트: 안정화 변경의 독립 QA와 실제 고객 경로 관찰 후, 그 as-built 위에서 product-designer가
  유지/수정/신규 대응표를 포함한 증분 UI를 다시 제안한다.

## 2026-08-03 design cycle 3. 전체 as-built 기반 프로토타입 재위임
- 사용자 명령: REQUEST-OSMU-001 전 항목을 기본으로 하고 앞뒤 연관 화면까지 추가·수정한 전체 클릭형
  프로토타입을 product-designer 서브에이전트에 위임한다. 뇌피셜·기존 기능 축소·전면 재설계 금지.
- 입력 강제: PRD v2.4, REQUEST-OSMU-001/DESIGN-001/002/P0-6/SNS-001~018, 실제 dashboard app/
  components/hooks/store/types/API, 운영 발행·OAuth 증거, `tasks/osmu-stabilize-live.output`.
- 필수 산출: AS-IS inventory, 유지/수정/이동/통합/신규/제거금지 matrix, 요청→화면·상태·버튼 RTM
  coverage 100%, 전체 happy/edge/recovery flow, desktop/mobile clickable hub 1개, component reuse/new scope.
- design은 계속 in-progress. 컨트롤러가 quality verifier와 요구 coverage·기존기능 축소 0·browser click QA를
  직접 통과하기 전 open·승인·eng-design 진입 금지.
- 결과: 품질 verifier를 컨트롤러가 재실행해 PASS(Skill 4, WebSearch/Fetch 14, 소크라 3, Design Score B,
  파일산출 패턴 경고 1). 브라우저에서 로그인→작업공간, 오계정 차단, Instagram 재연결·고급 Graph 복구
  기본 비노출/명시 open, 502 기존결과 조회·미발행 확인 전 재발행 차단, console error 0, body overflow 0을
  직접 관찰했다. harness toolbar 2개는 높이 38px지만 product action button은 44px 조건을 충족한다.
- 최종 v3 hub 1개를 사용자 브라우저에 open했다. design은 사용자 확인 전 계속 in-progress이며 승인하지 않는다.
- 사용자 검토에서 DESIGN-004로 v3 반려: 기존 제품에 additive 개선이 아니라 전면 디자인 교체처럼 보이고,
  OSMU 정체성이 약하며, Threads/Instagram 공통 탭이 통일되지 않았고 제보한 장애 일부가 해결된 target state가
  아니라 설명·복구 상태에 머물렀다. design은 in-progress 유지, v3 승인 금지.
- 2026-08-04 DESIGN-005: 사용자 검토에서 Facebook·X·Instagram Reels·YouTube Shorts·TikTok과 각 플랫폼
  설정관리가 전체 OSMU 범위에서 누락됐음을 확인했다. 이는 PRD v2.4 Threads-first 검증 slice를 전체 제품
  scope로 오독한 상류 MAJOR gap이다. v4 design 승인 금지, plan MAJOR 재개 후 전체 OSMU PRD→비평→재승인→
  design 리테이크 순으로 되돌린다.

## 2026-08-04 plan v3.1 APPROVED. 전체 OSMU 6 providers / 8 surfaces
- 사용자 `실행해`를 전체 OSMU scope와 plan 재승인 진행 지시로 기록했다. PRD v3.0 독립 비평 MAJOR 7,
  v3.1 closure 비평 MAJOR 1을 모두 리테이크했고 최종 critic은 잔여 MAJOR 0·전체 plan PASS 판정했다.
- 승인 핀: PRD v3.1.0 + one-thing/persona/bm/risks v3.1.0-view.1. 품질 verifier PASS(WebSearch/Fetch 16,
  소크라 2), QA tracker OSMU-V3-TC-001~030 30건, git diff --check PASS.
- 범위: 6 providers(Threads/Instagram/Facebook/X/YouTube/TikTok), 8 surfaces(IG/FB Feed+Reels 포함),
  12 capability paths, 공통 6탭, 플랫폼 Settings 9그룹, R0~R4 예산·시간, false-success TRIGGERED hard stop.
- current_stage는 design in-progress 유지. DESIGN v1~v4는 superseded이며 승인 v3.1 핀으로 전체 v5를 새로
  위임한다. v5 사용자 확인 전 design 승인·eng-design 진입 금지.

## 📢 문서 규격 공지 (2026-08-02, 하네스 전파)
- **PRD·FDD·QA는 이제 표준 규격 v2를 따른다.** 규격 정본 = `~/.claude/standards/doc-review.md` v2 (IEEE 830/ISO 29148·arc42·Volere·Gherkin 대조).
- **새 문서는 반드시 템플릿에서 시작**: PRD=`~/.claude/standards/templates/doc-template-prd.md` · FDD=`doc-template-fdd.md` · QA=`doc-template-qa.md`.
- 각 문서: 목차·스탬프·TL;DR·표준 섹션·mermaid 다이어그램·요구↔설계↔테스트 매핑(RTM)·RUBRIC_SCORE(≥20/25) 필수. PRD/FDD/QA 한 파일 통합 금지(분할 유지).
- **QA 필수(신규): 빌드된 프론트를 승인 프로토타입과 스크린샷 대조**해 design-conformance-matrix를 채운다. 불일치 미해소면 qa /approve 불가.

## 2026-08-06 18:38 KST. plan APPROVED
- 산출물 5종 전부 존재 + sha256이 approved_artifacts 핀과 일치(prd v7.2.1, one-thing/persona/bm/risks v7.2.1-view.1).
- 비평 사이클 수렴: critic_cycles n=20 (plan-critic, v7.2.1) major_findings 0 / resolved true / chairman_qs asked=11 answered=11.
- current_stage plan → design 전진, design status=in-progress.
- 다음: product-designer가 pinned v7.2.1 기반으로 user-flow → prototype(실렌더 HTML) → 리뷰 → 수정 루프.

## 2026-08-07 design v17. 사용자 리뷰 대기
- 승인된 PRD v7.2.1을 기반으로 product-designer 산출물 4종과 exit report를 생성하고 부모 검증을 마쳤다.
  후보 핀은 DESIGN `1978d7d8…`, user-flow `c73e276f…`, wireframe `2b694128…`, prototype `a861a05c…`,
  exit report `709c361c…`다. 제품 source/API/DB/deploy 변경은 0이다.
- 품질 verifier PASS: Skill2, WebSearch/Fetch20, Socratic2, Design Score A. 파일산출 trace 경고는 실제 산출물
  5/5 존재·SHA로 보완했다. 자동 상호작용 검증은 26개 목적지 26/26, native analytics 8/8,
  상태 12/12, JS 오류 0, 실패 0이다.
- 실제 Chrome 1440/1024를 육안 확인했고 CDP로 진짜 390×844 viewport를 강제했다. Home, OSMU Studio,
  Admin 모두 clientWidth=scrollWidth=390; 모바일 고객 sidebar는 숨김/메뉴 전환, Admin은 고객 sidebar와
  mobilebar를 모두 숨기고 운영자 4개 섹션만 노출했다. Studio는 소셜 게시물·짧은 영상·카드뉴스 3군과
  기존 저장/예약/카드별 수정·승인 행동을 유지했다.
- design 산출 체크리스트와 내부 QA가 통과해 status는 `awaiting-approval`, artifacts_ok=true다.
  단, 이것은 제품 구현 완료가 아니며 사용자 화면 확인 전 `/approve design`과 eng-design 진입은 금지한다.

## 2026-08-07 design v18 RETAKE. 전체 마케팅 대행 여정 재검증
- 사용자 피드백으로 v17 승인 후보를 철회했다. 필수 수정은 sidebar에서 Messaging을 Social 바로 아래로 이동,
  OSMU 산출 순서를 텍스트→사진/카드뉴스→영상으로 변경하는 것이다.
- 상위 결함은 순서 두 건만이 아니다. 기존 wiki 가져오기/새로 만들기, 가입→브랜드 가이드·톤 생성/수정→
  콘텐츠 생성·검수→발행/예약→결과물 관리→성과 분석→다음 생성으로 이어지는 실제 마케팅 대행 여정을
  기존 구현·코드·wiki·원요구와 다시 대조해야 한다. 따라서 design은 in-progress, artifacts_ok=false로 재잠금했다.
- product-designer v18과 독립 completeness audit를 위임했다. brand-positioning-kit,
  openclaw-creative-brief, design-review 및 심리 원리의 출처·오용 방지까지 산출 근거로 강제했다.
- 다음: v18 산출→독립 coverage audit 대조→quality verifier→부모 Chrome 1440/1024/390 semantic E2E→
  최종 prototype 한 개 open. 그 전 design 승인·eng-design 진입 금지.

## 2026-08-07 ⟲ REOPEN plan. 브랜드 위키 lifecycle 누락
- 사유: 승인 PRD v7.2.1에서 기존 원요구인 "제품 안에서 새 브랜드 위키를 만들고(또는 가져오고) 편집·버전 관리하고
  그 위키를 콘텐츠 생성에 적용하는 흐름"이 누락됐다. 사용자가 위키 가져오기/새로 만들기와 가입→브랜드 가이드·톤
  생성/수정→콘텐츠 생성·검수→발행/예약→결과물 관리→성과 분석→다음 생성으로 이어지는 전체 마케팅 대행
  lifecycle을 재확인했다.
- 조치: plan 승인 철회(approved_stages=[]), current_stage=plan, design은 pending으로 재잠금.
  design v18 작업은 계획 PATCH 승인 전까지 정지한다. eng-design 이하는 계속 pending.
- 스코프(다시 볼 것): ①브랜드 위키 CRUD·버전·가져오기(import) 계약 ②위키→생성 grounding 적용 경로
  ③온보딩부터 성과 분석·재생성까지 lifecycle FR/AC/TC 누락분 ④기존 구현·코드·wiki와의 대조.
- 다음: prd-architect가 v7.2.1 기반 PATCH(v7.3.0) 작성 → plan-critic 비평(MAJOR0) → /approve plan → design v18 재개.
- 참고: approved_artifacts의 v7.2.1 핀은 감사 이력으로 남기되 승인 효력은 없다.

## 2026-08-07 15:35 KST. plan APPROVED
- 재검증: 산출물 5종 전부 존재 + sha256이 approved_artifacts 핀과 일치
  (prd v7.3.5 ae6155bb, one-thing 1183bb58, persona e33cbf97, bm 12085449, risks c048dac1).
- 비평 사이클: critic_cycles n=26 (plan-critic, v7.3.5) major_findings=0, resolved=true.
  chairman_qs는 누적 asked>=2 answered(예: n=20 asked=11 answered=11) + n=26은 회장 명시 지시 governance.
- 게이트 전진: approved_stages=[plan], current_stage=design (design status=in-progress, 재개 허용).
- 잔여 리스크: n=21~25 사이클의 resolved=false 이력은 v7.3.5에서 폐쇄된 것으로 기록됨(n=26 MAJOR0). design 단계에서 IA·플로우 재확인 필요.

## 2026-08-10 디자인 시스템 실제 코드 build. 자동검증 PASS / 브라우저 QA BLOCKED
- override 범위 안에서 v23 토큰, shared `Button/Stack/Section/Field`, 기존 shared 정합화, Home/Studio/ChannelPage 마이그레이션을 구현했다.
- 자동증거: focused 23/23, 전체 Vitest 1045 PASS/10 skip, TypeScript exit 0, webpack build static pages 166/166.
- 보호계약: Studio PlatformPreview 호출 2곳·발행 이력 패널은 작업 시작 commit 대비 diff 0. route/API/DB/기능/라벨 변경 0.
- 브라우저 QA는 `listen EPERM 127.0.0.1:3456`으로 실행환경에서 차단됐다. 3폭 PNG·잘림·겹침은 미검증이며 QA/ship status는 pending 유지한다.
- 증거 정본: `docs/reports/osmu-design-system-build-v1-gpt-codex.md`, 구현현황: `docs/구현현황.md`.

<!--
STAMP
수정 시각: 2026-08-22 14:23 KST
모델: GPT-5 Codex
근거: pipeline-state의 current_stage·approved_stages·approved_artifacts, 실제 v43 디자인 산출물, Studio 기술설계 4종, 최신 확정 요구 R85·R86. 승인 이력과 approved_artifacts는 변경하지 않음.
-->
