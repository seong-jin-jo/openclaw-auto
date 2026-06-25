# 세션 작업 상태 (재실행 가능한 핸드오프)

> 이 문서는 **작업 하네스 규칙 #3**(루트 CLAUDE.md)에 따라 항상 최신으로 유지한다.
> 세션이 죽거나 재실행돼도 이걸 읽으면 30초 안에 이어갈 수 있어야 한다.

**최종 갱신:** 2026-06-25 · 브랜치 `main` · 배포 라이브.

## 현재 세션 (Codex/Claude 핸드오프 표준화)

- 루트 `AGENTS.md` 추가. Codex/Claude 공통 진입 규칙으로 `CLAUDE.md` →
  `wiki/ops/session-state.md` → `git status --short --untracked-files=no` →
  관련 diff 확인 순서를 고정했다.
- 작업 중/완료 전 `wiki/ops/session-state.md` 갱신, 관련 `wiki/` 문서 반영,
  검증 결과 기록을 Codex 쪽에서도 따르도록 문서화했다.
- 최근 세션 확인: 작업 시작 기준 커밋은 `d20d5dfc`이며, `CLAUDE.md` 최상위에 작업 하네스
  3규칙(E2E 선통과, wiki 문서화, 재실행 가능 기록)을 추가하고 이 파일을 신설했다.
- 이번 변경 전 tracked working tree는 clean 상태였다. 이번 변경은 문서/핸드오프 규칙만
  추가한 doc-only 작업이라 빌드/테스트는 실행하지 않았다.
- 같은 tmux의 `marketing-claw:0.0` 패널에서 남은 사용자 지시가 `Stop 훅으로 리마인더 걸어줘`
  임을 확인하고, `.claude/settings.json`에 `Stop` hook을 추가했다. 새 스크립트는
  `.claude/hooks/stop-harness-reminder.sh`: 첫 Stop 시 작업 하네스 체크리스트(E2E/검증,
  관련 wiki, session-state)를 `decision:block`으로 한 번 상기시키고, `stop_hook_active=true`
  재진입 때는 `{}`로 통과해 무한 루프를 피한다.
- Stop hook 검증: `bash -n .claude/hooks/stop-harness-reminder.sh`, `.claude/settings.json`
  JSON parse, `stop_hook_active=false`/`true` 샘플 입력 모두 통과. 코드/대시보드 동작 변경은
  없어 dashboard build/test는 실행하지 않았다.
- tmux↔session-state 핸드오프를 명문화했다. Codex가 `marketing-claw:0.0` pane을
  `tmux capture-pane -p -t marketing-claw:0.0 -S -80`로 확인해 마지막 지시
  `Stop 훅으로 리마인더 걸어줘`를 이어받았고, 루트 `AGENTS.md`/`CLAUDE.md`에
  "tmux pane은 휘발성 takeover context, `wiki/ops/session-state.md`는 durable return
  context" 원칙을 추가했다. Stop hook 메시지도 tmux pane id + 해석한 다음 액션 기록을
  요구하도록 강화했다.
- 추가 검증: 강화 후 `bash -n .claude/hooks/stop-harness-reminder.sh`, `.claude/settings.json`
  JSON parse, `stop_hook_active=false`/`true` 샘플 입력 모두 통과. 문서/하네스 변경이라
  dashboard build/test는 실행하지 않았다.
- 사용자 피드백 반영: handoff는 세션 시작 때만 일어나는 게 아니라 Codex가 새 작업을 진행한
  뒤 Claude가 돌아오는 식으로 언제든 발생할 수 있다. 루트 `AGENTS.md`의 시작 섹션을
  `Start / Resume / Take Over`로 바꾸고, 작업 중 새 태스크 착수/방향 전환/의미 있는 구현 단위
  완료/멈춤 직전마다 `session-state.md`를 갱신하도록 강화했다. `CLAUDE.md`와 Stop hook
  메시지도 "mid-task transfer 가능, transcript가 아니라 session-state로 재개 가능해야 함"을
  명시하도록 수정했다.
- 추가 사용자 피드백 반영: 에이전트는 다른 tmux pane을 이어갈 수 있는지 확인할 수 있지만,
  **무엇을 기준으로 이어갈지는 사용자가 정한다.** tmux pane과 `session-state.md`가 모두
  가능하거나 기준이 불명확하면 사용자에게 어느 handoff source를 따를지 묻고 진행한다.
  `AGENTS.md`, `CLAUDE.md`, Stop hook 메시지를 "user-confirmed handoff basis" 기준으로
  수정했다.
- 현재 handoff 기준: 사용자가 `2.1.187 작업 진행하자`고 지정. `tmux list-panes`상 이 레포의
  `2.1.187`은 `marketing-claw:0.0`(`cwd=/Users/sj/sj_code_master/openclaw-auto`,
  title=`osmu-dashboard-trust-ux-ia-fixes`)이며, `tmux capture-pane` 확인 결과 마지막 pending
  지시는 `Stop 훅으로 리마인더 걸어줘`. 해당 작업은 Codex가 이어받아 `1ad43ed5`
  (`docs: Codex/Claude handoff harness enforce`)로 커밋 완료했고 tracked worktree는 clean.
  다음 실제 작업은 이 파일의 보류 항목 중 P0인 **실발행 루프(cross-repo gateway/cron)** 검토부터
  진행한다.
- 실발행 루프 진행 중: `dashboard/tests/publish/schedule-publish-due.test.ts`를 먼저 추가했고,
  route 부재로 실패하는 것을 확인했다. 이후 `POST /api/schedule/publish-due`를 구현해
  테넌트별 due `schedules`를 `processing`으로 claim(`FOR UPDATE SKIP LOCKED`)하고,
  `threads`/`x`/`instagram`/`facebook`을 기존 직접발행 함수로 발행한 뒤 플랫폼별
  `published_posts` 기록과 schedule `published`/`partial`/`failed` 마감을 수행한다.
  `dashboard/tests/publish/gateway-dependency.contract.test.ts`는 새 실발행 경로를 명시적으로
  허용하도록 업데이트했고, `SchedulePanel`은 새 상태를 정직하게 표시한다.
- 실발행 루프 검증: `cd dashboard && npm run test:publish`, `npm run test`, `npx tsc --noEmit`
  모두 통과. `npm run build`는 샌드박스에서 Turbopack 포트 바인딩 제한으로 실패했으나,
  권한 승인 후 재실행해 통과했다(Next middleware deprecation + 기존 NFT trace warning만 남음).

## 지금까지 (직전 작업 = OSMU 대시보드 신뢰·UX·IA 복구)

고객 온보딩 중 제기된 9개 이슈를 P0(신뢰)→P1(UX)→P2(IA) 순으로 처리하고 배포 완료.

커밋 흐름: `012b3f35`(P0–P2) → `ac931c15`(채널 SSOT + 발행 하네스 층) →
`d20d5dfc`(작업 하네스 3규칙 루트 코드화 + wiki 반영). 앞 2회 배포 모두 success.

**완료 (배포·라이브 검증됨):**
- **발행 E2E 하네스** — `dashboard/tests/publish/`: happy/skip/invalid 분기, 승인 scheduledAt,
  예약 검증, due schedule 실발행 루프 contract, DB-gated `published_posts` 라운드트립.
  `npm run test:publish`.
- **로그아웃 항상 노출** — 사이드바 nav `overflow-y-auto` + footer `shrink-0`.
- **단일 로그인** — 고객 `/login`(Supabase) 단일 진입, 운영자는 `/operator`로 분리(랜딩서 비번
  박스 제거). `/api/me`가 토큰 종류로 운영자/고객 구분(고객 JWT를 운영자로 둔갑 금지),
  Supabase 세션↔localStorage 토큰 동기화(만료 401 차단, 운영자 토큰은 클로버 방지).
- **발행 상태 정직화** — Studio(직접 저작)/인박스(검수 승인) 구분, 예약은 자동화 파이프라인
  발행·미연결 시 "예약됨" 대기 명시.
- **뒤로가기** — 공용 `BackButton`(router.back + fallback), 채널/독립 페이지 일관 적용.
- **라이트 디폴트** — 충돌하던 next-themes ThemeProvider 제거, 배너/뱃지 시맨틱 토큰화.
- **채널 SSOT** — `constants.PUBLISH_CHANNEL_GROUPS` 단일 소스를 Sidebar + ChannelsSettings가
  공유(3중 정의 드리프트 해소). 죽은 Data&SEO 그룹·stub 제거.
- **Settings 정리** — 알림 토글 System→Notifications 이동, "API 토큰"→"Fork 연동".
- **가이드 친절화**(threads/kakao/whatsapp) + theme-blind 색 제거. 격리 배너 고객 홈서 제거.

code-review(high) 7건 전부 반영(교차계정 토큰 클로버, tenantError 재시도, dev 운영자 콘솔,
운영자 로그아웃 목적지, 핫패스 DB I/O, 대비 토큰화).

## 핸드오프 상태 (2026-06-26, Claude — 발행 루프 갭 2건 해소)

- **handoff 기준**: tmux `marketing-claw:0.0` pane은 이 세션 자체이고 대기 지시 공란 →
  durable source `wiki/ops/session-state.md`가 기준(불명확성 없음).
- 직전: Codex가 due publisher `bacc1243` + handoff 문서 `1ad43ed5` 커밋(둘 다 미push였음).
  재진입 시 발견한 갭 2건을 이번에 **닫음**:
  1. **[P1 해소] UI/백엔드 플랫폼 불일치** — `constants.SCHEDULABLE_PLATFORMS` SSOT 신설
     (threads/x/facebook/instagram). `SchedulePanel`(UI)과 `publish-due`(백엔드)가 같은 소스를 소비.
     과거 shorts/reels/tiktok 노출→"미지원" 영영 미발행 정직성 버그 제거. drift 방지 contract
     테스트 `tests/publish/platform-ssot.contract.test.ts`(3) 추가.
  2. **[P0 부분해소] publish-due caller 부재** — `publish-due`에 **운영자 전체 테넌트 스윕** 모드 추가:
     `tenant_id` 없이 운영자 토큰으로 호출 시 RLS 우회 service-role로 `SELECT DISTINCT tenant_id`(due)
     → 각 테넌트 `withTenant` 격리 처리. 단일 크론이 전 테넌트를 발행할 진입점.
     `dashboard/scripts/publish-due-cron.sh`(curl 드라이버) 추가, `wiki/ops/cron.md`에 crontab wiring 문서화.
     테스트 `schedule-publish-due.test.ts`에 운영자 스윕 3 케이스(토큰 불일치 400 / 다중 테넌트 순회 /
     due 0건) 추가.
- **검증(로컬, 실행 증거)**: `npm run test:publish` → 30 passed, 2 skipped(DB-gated).
  `npm run test`(전체) → 123 passed, 8 skipped. `npx tsc --noEmit` exit 0. `npm run build` ✓ Compiled.
  DB-gated/실발행은 로컬 Postgres·크레덴셜 없음 → 배포 환경에서 browse + (운영자) crontab 등록 후 검증.
- **변경 파일**: `src/lib/constants.ts`(+SSOT), `src/components/studio/SchedulePanel.tsx`(SSOT 소비),
  `src/app/api/schedule/publish-due/route.ts`(SSOT + 전체 스윕), `scripts/publish-due-cron.sh`(신규),
  `tests/publish/platform-ssot.contract.test.ts`(신규), `tests/publish/schedule-publish-due.test.ts`(+3),
  `wiki/ops/cron.md`.
- **다음 액션**: 이 변경 + Codex 미push 커밋 2개를 함께 commit→push→`deploy-marketing.yml` 배포→browse 라이브검증.
  (배포는 outward-facing — 사용자 승인 후.)

## 다음 단계 / 보류

- **실발행 루프 crontab 등록 [P0 잔여]** — 엔드포인트·스윕 모드·드라이버 스크립트는 완비됨.
  남은 건 **배포 호스트 crontab(또는 게이트웨이)이 `publish-due-cron.sh`를 주기 호출하도록 등록**하는 것
  (운영자 액션, 레포 밖 — Supabase 콘솔 설정과 동급). 등록 전엔 예약이 `scheduled`로 대기(SchedulePanel 정직 표시).
- **GA/GSC 실제 OAuth 연결** — 백엔드 config API는 있으나 connect UI 미구현. 현재는 사이드바에서
  죽은 항목 제거 + 읽기 대시보드만 유지.

## 사용자 액션 (Claude 불가)

1. Supabase 콘솔: Auth > Email "Confirm email" OFF 또는 URL Configuration에 Site URL + Redirect
   URLs(`.../**`) 등록 → 신규 이메일 가입 정상화.
2. 노출됐던 비번 rotate.

## 배포 / 검증 루틴

- 배포: `gh workflow run deploy-marketing.yml --ref main -f services="openclaw-dashboard-osmu"`
  (self-hosted runner가 시크릿으로 .env 렌더 + NEXT_PUBLIC_SUPABASE_* 빌드arg 주입 + 스모크 게이트).
- 게이트: `cd dashboard && npx tsc --noEmit && npm run test && npm run build` → gstack `browse`
  라이트/다크 육안. 로컬엔 DB/Supabase 없음 → 인증 대시보드 본문은 배포 환경 browse로 검증.
- 라이브 URL은 비공개(레포 PUBLIC — 실도메인/브랜드/시크릿 금지). 자동 메모리 핸드오프 참조.
