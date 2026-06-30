---
# pipeline-state.md — Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: qa              # plan|design|eng-design|build|qa|ship
approved_stages: [plan, design, eng-design, build]   # ADOPTED(pre-harness) — 성숙·배포된 앱
approved_artifacts: {}
stages:
  plan:       { status: approved, artifacts_ok: true }   # README/feature-spec/USERFLOW 존재(ADOPTED)
  design:     { status: approved, artifacts_ok: true }   # ui-rules/channel-ui-spec(ADOPTED)
  eng-design: { status: approved, artifacts_ok: true }   # CLAUDE.md/wiki/architecture(ADOPTED)
  build:      { status: approved, artifacts_ok: true }   # dashboard/src(ADOPTED)
  qa:         { status: in-progress, artifacts_ok: false }
  ship:       { status: todo, artifacts_ok: false }
override: false
override_reason: ""
override_expires: ""
---

# Pipeline State — openclaw-auto-osmu

> 2026-06-30 `init --adopt`. 이 레포는 이미 라이브 배포된 멀티테넌트 마케팅 SaaS라 plan~build는
> ADOPT(기존 인정). **현재 qa.** 신규 기능(OAuth 연결, GA4, 가이드 등)은 build→qa→ship 게이트를
> `/approve`로만 통과한다. **배포(gh workflow / ship)는 `/approve qa` 후에만.** (과거 게이트 없는
> 자동 배포 = 하네스 위반, 재발 금지.)

## qa 단계 산출물/증거 (requires_evidence)
- [ ] docs/qa-tracker.md
- [ ] prod-health-200 (라이브 /api/health 200 — ✅ 실측됨 2026-06-28)
- [ ] prod-demo-login-200 (라이브 가입→로그인→대시보드 — 미검증)
- [ ] e2e-happy (셀프서브 가입→키→브랜드→생성, OAuth 연결 — 라이브 미검증)
- [ ] e2e-edge (잘못된 키/토큰/미연결 분기 — vitest는 통과, 라이브 미검증)

## 최근 build (qa 대기 중 — ship 전 /approve qa 필요)
- 셀프서브 코어: A1 증류 generateText 통일, A2 온보딩 위저드, A3 키검증, /api/health+autoheal+슬랙경보,
  성과 ConnectGate, 가입 confirm 탭, **소셜 OAuth '연결'(api/connect/* + SocialConnectButton)**.
- 전부 vitest 통과(152개 중 144 pass/8 skip, tsc 0, build ✓). **라이브 풀플로우는 미검증.**
- ⚠️ 이들은 이미 prod 배포됨(게이트 전 배포된 상태) — qa 증거 수집 후 정식 /approve qa로 사후 게이트.

## 승인 로그 (append-only)
2026-06-30 — ADOPTED(pre-harness) — plan·design·eng-design·build 기존 산출물 인정, current=qa.

## Blocked / Notes
- 라이브 QA 증거 수집 필요: 배포 환경 browse로 셀프서브 happy/edge + OAuth 연결 화면.
- OAuth 라이브: IG_APP_ID/SECRET env + Meta redirect URI 등록 선행.
- Meta 콘솔 손셋업(테스터/권한/토큰)은 사용자가 창에서(페어). 토큰 확보 시 OSMU 등록.
