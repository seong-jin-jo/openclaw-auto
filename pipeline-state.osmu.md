## 2026-09-02 v67 편집실·발행실 통합 디자인 승인 후보

stage: design
status: awaiting-approval

design_canonical_candidate:
  version: v67
  design_system: `DESIGN.md` v36
  routing_hub: `docs/prototype/osmu-v67-edit-publish-hub-gpt-codex-20260902-0448.html`
  delta_spec: `docs/design-spec-osmu-v65-v66-delta-v1.0.0-gpt-codex-20260902-0448.md`
  clean_frames: `docs/design/clean-frames/osmu-v67-{edit|publish}-{normal|empty|loading|error|disabled|overflow}-{1024|390}-gpt-codex-20260902-0448.png`
  frame_stamps: same basename with `.png.stamp.md`
  capture_audit: `docs/design/clean-frames/osmu-v67-capture-audit-gpt-codex-20260902-0448.json`
  seed: `osmu-v67-static-seed-01`
  review_status: `B+ · 88/100`, `docs/qa/osmu-v67-design-review-gpt-codex-20260902-0448.md`
  approval_status: candidate-only

계승 계약:
- 승인 정본 v64의 상단 2층 GNB, 224·56 탐색, 1024 본문 7:담당 3과 담당 최소 240px, 390 본문 다음 담당을 유지한다.
- v65 편집 내용과 v66 발행 필드 내용을 같은 셸 한 파일에 통합한다.
- normal, empty, loading, error, disabled, overflow 여섯 상태를 두 방과 두 폭에서 각각 렌더한다.

게이트:
- 이 블록은 design canonical 후보 핀이다. approved_artifacts가 아니며 `/approve design` 전 제품 소스 구현 기준으로 승격하지 않는다.
- matched-pair actual frame은 build 뒤 같은 seed, state, viewport로 별도 생성한다.

## 2026-09-02 디자인 재개: v65·v66 증분 승인 대기 (Codex 메인 컨트롤러)

stage: design
status: changes-requested
reopen_reason: v65 편집실은 디자인 승인 기록 없이 build가 먼저 진행됐고, v66 발행실은 디자인 산출물만 있고 구현·승인이 없다. v64 승인 정본을 유지한 채 두 증분을 묶어 디자인 게이트를 정상화한다.

review_result: Design Score C, BLOCK. v65·v66이 v64 공유 셸을 상속하지 않았고, design-review·clean frame·delta design-spec·design_canonical·matched-pair 증거가 없다. `/approve design` 요청을 철회하고 v67 단일 허브 리테이크 중이다.

candidate_artifacts:
- design_hub: `docs/prototype/openclaw-auto-4room-v64.html` (기존 승인 전체 제품 정본)
- design_system: `DESIGN.md` v35, commit `68062525`
- editroom_design: `docs/prototype/osmu-editroom-v65-gpt-codex-20260901-0710.html` + `docs/WIREFRAMES/osmu-editroom-v65-gpt-codex-20260901-0710.md`, commit `66ad58dd`
- editroom_build_evidence: commits `e81caf6e`, `ddfb15d1`
- publishfield_design: `docs/prototype/osmu-publishfield-v66-gpt-codex-20260901-0813.html` + `docs/WIREFRAMES/osmu-publishfield-v66-gpt-codex-20260901-0813.md`
- publishfield_rules: `docs/reference/플랫폼-발행-필드-규격-2026-09-01.md`, commit `68062525`
- requirements: `wiki/거버넌스/요청.md` 2026-08-30 회장 2차 실사용 피드백
- audit: `docs/qa/회장-세션발화-전건-대조표-2026-08-31.md`

게이트:
- `/approve design` 전에 v66 소스 구현 금지.
- v65 기존 구현은 삭제·재작성하지 않고 리뷰·QA 대상으로 보존.
- 승인 후 build 소유자는 v66 미구현만 추가하고, code-reviewer·qa-verifier가 v65 회귀와 통합 경로를 병렬 검증.

## 2026-09-01 01:15 승인 산출물 핀 (Claude, osmu 라인)

stage: build. 편집실·발행실 화면 판을 다시 발주하기 위해 승인 산출물을 핀한다.

approved_artifacts:
- design_hub: `docs/prototype/openclaw-auto-4room-v64.html`
- design_system: `DESIGN.md` (정본 v64)
- requirements: `wiki/거버넌스/요청.md` 2026-08-30 회장 2차 실사용 피드백
- audit: `docs/qa/회장-세션발화-전건-대조표-2026-08-31.md`

핀 근거: v60부터 v64까지 후보가 있고 `DESIGN.md` 정본이 v64다. 최신이자 정본이라 v64를 택했다.
직전 발주(`osmu-editroom0901`)가 이 핀이 없어 착수하지 못하고 종료했다. 그 차단을 여는 조치다.

게이트(유지):
- 컨트롤러가 운영에서 로그인부터 발행까지 직접 밟기 전까지 회장께 "써 보시라" 금지.

## 2026-08-30 22:35 진행상태 갱신 (Claude, osmu 라인)

stage: qa 재개. ★"완료" 판정 전면 재검토 중.

★★★ 제품 핵심 부재 확인: 콘텐츠 생성이 LLM 을 한 번도 부르지 않는다.
  service.ts buildCandidates() 가 A/B/C 를 문자열 템플릿으로 조립한다.
  derivation.ts 도 템플릿. 영상은 asset_url "pending:render" 고정.
  LLM 호출 grep 0건. 컨트롤러가 코드를 직접 읽어 확인했다.
  ⇒ 네 방 전체가 이 위에 얹혀 있다. **회장 판단 필요: 실제 LLM 연동 시점.**

★ 요청 266건 전항목 대조 완료(009ffcad):
  충족 128 · 부분 60 · 미충족 48 · 확인불가 30.
  ★2차 실사용 피드백 31건 중 충족 1건. 어제 지적은 사실상 미착수.

★ 계정 연결: 실패 사유를 버리던 것을 고쳐 배포(PR #39, 배포 33313508878 success).
  회장이 Threads 재연결 1회 시도하면 Meta 실사유가 로그에 남는다.
  앱 자격증명은 유효함을 Meta 직접 호출로 확인. 요청 형식도 공식 문서와 일치.

가동중 codex 두 판: osmu-gen0830(학습정보 8 + 생성실 11),
osmu-edit0830(편집실 8 + 발행실 4 + 왕복 띠 제거).

게이트:
- LLM 연동 전까지 "콘텐츠 생성이 된다" 주장 금지.
- 컨트롤러가 배포 환경에서 로그인부터 발행까지 직접 밟기 전까지
  회장께 "써 보시라" 금지. 이번 사고의 재발 방지 조건이다.

## 2026-08-30 20:40 진행상태 갱신 (Claude, osmu 라인)

stage: 운영 가동중. 회장 2차 실사용 대기.

★ VM 정리 완료: 컨테이너 12개 → 2개, 디스크 81% → 36%.
  정리 후 실측 /api/health {"ok":true,"db":"up","ms":9}, login 200.
★ 찌꺼기 재발 방지: 배포 워크플로 정리 단계(3dc8af80) + VM 주간 크론.
★ 회장 보고서 제출: docs/rendered/osmu-인프라와-1차개선-2026-08-30.html (d8698401).
★ R2 운영 설정 0개. 영상 원본 보관처 미정. 회장 판단 대기.

게이트: 30건 대조표 재실행 전까지 "회장 피드백 전부 해결" 주장 금지.
배포 주의: services 좁히기, expand-guard 불가.
