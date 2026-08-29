# session-state.studio — OSMU Studio 제작엔진 라인

> 라인명: `studio`. 이 repo의 다른 라인 = `pipeline-state.osmu.md`(마케팅 에이전트 제품, design 단계).
> 상태 파일 규약: `~/.claude/standards/state-file-convention.md`

## 2026-08-29 08:04 KST, 운영 수정 6건 교차 재검증 NG

### 무엇을 어디까지 했나

- 운영 배포 run `33216078099`, main `ec6f4ccf`에서 같은 실제 Supabase QA 고객으로 수정 6건과 네 방 390px·1440px를 다시 확인했다.
- 입력 보존, 연타 generation POST 한 건, 카드뉴스에서 글 전환, 연결 채널 0개 발행 차단은 PASS다.
- 무료 재생성은 서버와 UI 경계까지 도달했지만 당일 무료 몫이 이미 사용돼 409였다. 이 세션에서 성공 재생성은 미검증이다.
- 만료형 JWT는 Studio URL 위에 공개 랜딩을 표시했다. 형식 불량 stale token은 returnTo 고객 로그인에 잠깐 도달한 뒤 최종 `/operator`로 이동했다. 둘 다 안정된 고객 로그인 복귀가 아니므로 FAIL이다. 바로 아래 동시 QA의 PASS 기록과 충돌하므로 최신 보수 판정을 NG로 둔다.
- 외부 SNS 게시, 유료 재생성, 운영 데이터 삭제는 실행하지 않았다. 제품 코드도 수정하지 않았다.
- 브라우저는 새 실제 QA 세션으로 복구했고 `/api/me` 200을 다시 확인했다. QA 산출 데이터는 tenant와 `[QA-FIX6-0752]` 표식으로 식별 가능하며, 수정판 재검증 뒤 제한된 정리 경로로 삭제한다.

### 남은 이슈·블로커

- High: 만료 고객 세션의 최종 목적지가 `/operator`다. 고객 로그인 복귀와 Studio returnTo가 성립하지 않는다.
- 부분 검증: QA 계정의 오늘 무료 재생성 몫이 사용된 상태라 새 후보 201을 이 세션에서 관찰하지 못했다.
- 이 두 항목 때문에 전체 QA PASS와 배포 승인 판정은 금지다.

### 다음에 칠 명령

```bash
sed -n '1,260p' docs/qa/studio-prod-six-fix-reverify-v1.1.0-gpt-codex.md
rg -n 'FIX6-|FAIL|부분 검증' docs/qa/studio-prod-six-fix-reverify-v1.1.0-gpt-codex.md
gh run view 33216078099 --json status,conclusion,headSha,url
```

### 검증했나

- PASS: 입력 보존, 연타 POST 1회, 글 전환, 채널 0개 발행 차단.
- 부분 검증: 무료 재생성 UI와 409 한도 경계. 이 세션에서 성공 201 미관찰.
- FAIL: 만료 세션 returnTo. 만료형 JWT는 Studio URL 위 공개 랜딩, 형식 불량 stale token은 최종 `/operator`.
- 반응형: 390px과 1440px 네 방 가로 넘침 0.
- 정상 스모크: 신규 콘솔 오류와 비정상 network 응답 0. 음수 테스트의 의도된 409와 401은 별도 기록.
- 상세 증거: `docs/qa/studio-prod-six-fix-reverify-v1.1.0-gpt-codex.md`, `docs/qa/osmu-prod-six-fix-reverify-20260829/`.

## 2026-08-29 08:00 KST, 운영 수정 6건 직접 재검증 PASS

### 무엇을 어디까지 했나

- main `ec6f4ccf`를 OSMU 대시보드 단독 배포 run `33216078099`로 운영 반영했다. 첫 전체 서비스 배포는 gateway 빌드가 메모리 부족으로 종료되고 self-hosted runner가 내려갔으나, runner 서비스를 복구하고 배포 대상을 `openclaw-dashboard-osmu`로 제한해 성공시켰다.
- 실제 Supabase QA 고객으로 운영 생성실 입력 새로고침 보존, 생성 버튼 연타 POST 1회, 무료 재생성 POST 201, 카드뉴스에서 글 편집 전환, 연결 채널 0개 발행 잠금, 만료 고객의 고객 로그인 returnTo 복귀를 직접 관찰했다.
- 390px과 1440px에서 문서 가로 넘침이 없음을 확인했다. 외부 SNS 게시와 운영 데이터 삭제는 실행하지 않았다.

### 남은 이슈·블로커

- 수정 6건의 운영 블로커는 해소됐다.
- 무료 재생성을 같은 날 두 번째 요청하면 의도된 409와 브라우저 console resource error가 남는다. 첫 무료 재생성은 201로 성공했고, 추가 무료 요청 제한은 제품 계약상 정상 거절이다.
- 실제 SNS 연결 계정을 통한 외부 게시 성공은 계속 미검증이다.

### 다음에 칠 명령

```bash
gh run view 33216078099 --json status,conclusion,headSha,url
curl -sS https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/health
sed -n '1,120p' docs/qa/studio-prod-six-fix-reverify-v1-gpt-codex.md
```

### 검증했나

- 관찰됨: 운영 health 200과 DB up, 수정 6건, 390/1440 overflow 0.
- 테스트됨: PR CI와 main CI 성공, 배포 run 성공.
- 미검증: 실제 연결 provider 게시 성공과 permalink.

## 2026-08-29 07:50 KST, 운영 수정 6건 재검증 미완료 인계

### 무엇을 어디까지 했나

- 운영 배포 run `33216078099`가 성공했고 main SHA가 `ec6f4ccf`임을 확인했다.
- 기존 QA 세션이 만료된 것을 발견했고, 저장된 실제 QA 고객 자격으로 새 Supabase 세션을 발급했다. 사용자 ID가 기존 QA 고객과 일치했다. 토큰 원문은 로그와 문서에 남기지 않았다.
- 제품 코드는 수정하지 않았다. 외부 SNS 게시, 유료 재생성, 운영 데이터 삭제도 실행하지 않았다.

### 남은 이슈·블로커

- 인증 발급이 장시간 응답을 기다려 종료 지시 시점까지 운영 브라우저 재검증을 시작하지 못했다.
- 입력 보존, 연타 POST 1회, 무료 재생성, 글 전환, 연결 채널 0개 발행 차단, 만료 세션 고객 로그인 returnTo는 모두 수정판 운영에서 미검증이다.
- 390px과 1440px 스모크, 콘솔 오류, 비정상 network 응답도 미검증이다.
- 이는 수정 실패 판정이 아니다. 운영 PASS를 뒷받침할 직접 관찰 증거가 아직 없다는 판정이다.

### 다음에 칠 명령

```bash
gh run view 33216078099 --json status,conclusion,headSha,url
/Users/sj/.claude/skills/gstack/browse/dist/browse goto 'https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/studio?room=create'
sed -n '1,260p' docs/qa/studio-prod-six-fix-reverify-v1-gpt-codex.md
```

### 검증했나

- 관찰됨: 배포 run 성공, SHA 일치, 같은 QA 고객의 새 Supabase 세션 발급.
- 미검증: 수정 6건, 390px과 1440px, 콘솔, 운영 network non-2xx.
- 안전 경계: 외부 SNS 게시와 유료 부작용 0건.
- 상세 증거: `docs/qa/studio-prod-six-fix-reverify-v1-gpt-codex.md`.

## 2026-08-29 03:21 KST, 운영 실제 고객 Exhaustive 회귀 NG

### 무엇을 어디까지 했나

- 실제 Supabase QA 고객 세션으로 운영 390·1440 네 방, 만료·복구, 방 왕복, 생성 validation·연타, 후보 선택, 카드뉴스 편집 저장·큐 인계, 발행 채널 0개·부분 선택·오류 UI를 확인했다.
- 정상 범위는 유효 세션 `/api/me` 200, 후보 A·B·C, 카드뉴스 저장 commands 201, 작업물 0→1, 네 방 가로 넘침 0이다.
- 외부 SNS 게시와 유료 재생성은 실행하지 않았다. 제품 코드 수정도 0건이다.

### 남은 이슈·블로커

- High: 만료 고객 세션이 고객 로그인 대신 `/operator` 운영자 토큰 화면으로 이동한다.
- High: 연결 채널 0개인데 Threads·X·Instagram이 기본 선택되고 publish 400까지 진행한다.
- Medium: 생성실 목적·대상·권리 동의가 방 왕복과 새로고침 뒤 사라진다.
- Medium: 후보 생성 연타가 generation POST 201 두 건을 보낸다.
- Medium: 후보 전체 거절·무료 재생성 UI가 없다.
- Medium: 편집실 `글` 단추가 클릭 가능하지만 카드뉴스 선택에서 바뀌지 않는다.
- Low: `0곳에 올리기`가 활성이고 draft POST 뒤에야 선택 오류를 표시한다.
- Low: Studio 세 방 h1·h2가 0개이고 성과실 `<main>`이 2개다.
- 전체 design stage는 계속 blocked다. 이번 운영 캡처는 기능 증거이며 승인 프로토타입 matched-pair가 아니다.

### 다음에 칠 명령

```bash
sed -n '1,260p' docs/qa/studio-prod-exhaustive-regression-v1-gpt-codex.md
rg -n '^### ISSUE' docs/qa/studio-prod-exhaustive-regression-v1-gpt-codex.md
bash ~/.claude/harness/bin/design-lint.sh dashboard/src
```

### 검증했나

- 관찰됨: 운영 브라우저 390·1440 네 방, 생성 연타 POST 2건, commands 201, publish 400, 세션 만료 401, 복구 뒤 `/api/me` 200.
- 테스트됨: design lint 위반 0.
- 미검증: 실제 연결 provider 성공 발행, 유료 재생성, 승인 prototype과 현행 운영의 3폭 matched-pair.
- 상세 증거: `docs/qa/studio-prod-exhaustive-regression-v1-gpt-codex.md`, `docs/qa/osmu-prod-exhaustive-20260829/`.

## 2026-08-29 운영 고객 생성 수정판 배포와 재검증

### 무엇을 어디까지 했나

- 실제 Supabase QA 계정으로 운영 네 방을 확인하다 발견한 첫 생성 503과 PostgreSQL 멱등 경합 실패를 수정했다.
- 고객 JWT를 Studio 생성 신원에 연결하고 활성 tenant만 허용했다. 생성 중복 판정은 tenant, member, operation, idempotency key 조합으로 수렴시켰다.
- 수정 commit `fcdc97c7`을 포함한 병합 요청 27번을 main merge commit `72afa863`으로 병합했다.
- main CI run `33193767802`와 운영 배포 run `33195231594`가 성공했다.
- 배포 뒤 실제 QA 고객으로 `/api/me` 200, 생성 POST 201, 후보 A/B/C 세 개, 같은 키 동시 요청의 동일 job 수렴, 생성실·편집실·발행실 준비 화면을 직접 관찰했다. 콘솔 오류와 실패 네트워크 요청은 0건이었다.

### 남은 이슈·블로커

- QA tenant에 연결된 SNS 계정이 0개라 실제 외부 채널 게시물 생성은 미검증이다.
- 전체 design 승인 기록은 별도 파이프라인 상태상 blocked다. 운영 기능 사용 가능 여부와 디자인 승인 완료는 같은 뜻이 아니다.
- `osmu-expand-contract-build.output`은 별도 자동 산출물 검증 FAIL 상태다. 이번 운영 배포 근거로 사용하지 않았다.

### 다음에 칠 명령

```bash
gh run view 33195231594 --json status,conclusion,headSha,url
curl -LsS https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/health
sed -n '1,220p' docs/qa/osmu-prod-authenticated-qa-v1-gpt-codex.md
```

### 검증했나

- 테스트됨: 전체 Vitest 190파일 1,355 PASS, 6 SKIP. TypeScript와 production build PASS.
- 관찰됨: 운영 배포 success, DB up, 실제 고객 생성 201과 후보 세 개, 편집실 인계, 발행실 준비.
- 미검증: 실제 외부 SNS 채널 발행.

## 2026-08-29 01:07 KST, 로컬 Google 인증 503 복구

### 무엇을 어디까지 했나

- 운영과 로컬의 Supabase 공개 환경값 주입 분기를 제거했다. 감독이 Next 기동 전에 검증된 공개값을 자동 복구하며 실패 시 기동하지 않는다.
- 로컬 health 200, Google preflight 200, 계정 선택 강제 URL을 확인했다.

### 남은 이슈·블로커

- 실제 고객 계정 로그인 완료 뒤 Studio 네 방은 미검증이다.

### 다음에 칠 명령

```bash
node scripts/recover-osmu-local-public-env.mjs
curl -LsS -o /dev/null -w '%{http_code}\n' 'http://localhost:3456/api/auth/google?redirect_to=http://localhost:3456/'
```

### 검증했나

- 테스트됨: 회귀 5/5, TypeScript exit 0.
- 관찰됨: 로컬 인증 사전요청 200과 계정 선택 계약 PASS.
- 미검증: 실제 고객 계정 로그인 완료와 운영 Studio 네 방.

## 2026-08-29 01:02 KST, Studio 포함 운영 배포 성공

### 무엇을 어디까지 했나

- main commit `62b58533`을 운영에 배포했고 workflow run `33187005238`이 성공했다.
- 운영 health 200과 DB up, Google 로그인 계정 입력 화면 도달을 직접 확인했다.
- 운영 데이터는 Supabase PostgreSQL 공유 DB와 tenant_id RLS를 사용한다. 로컬은 같은 schema를 가진 `127.0.0.1:55432/osmu` PostgreSQL이며 현재 접속 가능하고 public 테이블 24개다.

### 남은 이슈·블로커

- 실제 고객 계정 로그인 완료 뒤 Studio 네 방은 아직 미검증이다.
- 로컬 Supabase 공개 환경값 자동 주입 부재를 복구 중이다.

### 다음에 칠 명령

```bash
gh run view 33187005238 --json status,conclusion,headSha,url
curl -LsS https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/health
```

### 검증했나

- 관찰됨: 운영 배포 success, health 200 DB up, Google OAuth 진입 성공.
- 미검증: 실제 고객 로그인 완료와 운영 Studio 네 방.

## 2026-08-29 00:45 KST, 공용 design 게이트 BLOCK

### 무엇을 어디까지 했나

- 공용 design_spec은 산출됐지만 독립 검수에서 C+ BLOCK이 나왔고, 실제 Studio matched-pair는 인증 503 때문에 0/12였다.
- 배포까지 계속하라는 요청은 유지하되, 제품 계약 충돌과 실제 화면 증거 부재 때문에 design 이후 단계와 운영 배포를 실행하지 않았다.

### 남은 이슈·블로커

- PRD v8.2.1 승인 지위와 D-10 독립 편집 포함 여부를 회장이 확정해야 한다.
- 인증 환경 복구 뒤 단일 commit 기준 12화면 재촬영이 필요하다.

### 다음에 칠 명령

```bash
sed -n '1,220p' docs/qa/osmu-v64-matched-pair-v1-gpt-codex-20260829-0041.md
git status --short
```

### 검증했나

- 관찰됨: 로그인 차단 3화면, v64 기준 12화면, 실제 Studio 화면 0장.
- 미검증: design 승인부터 운영 배포까지 전 단계.

## 2026-08-29 00:13 KST, Studio 포함 0.2.0 병합과 CI 확인

### 무엇을 어디까지 했나

- Studio 생성·편집·발행실 복귀 변경이 포함된 병합 요청 26번을 merge commit `62b58533`으로 main에 병합했다.
- PR CI와 main CI를 직접 감시했고 둘 다 TypeScript, 생산 빌드, DB schema·seed·RLS, 전체 테스트를 통과했다.
- 브라우저 재검증은 고객 로그인 세션 부재로 랜딩에서 막혔다. 기존 qa-verifier의 실제 고객 작업 공간 브라우저 PASS 증거는 `docs/qa/qa-tracker.md`에 보존돼 있다.

### 남은 이슈·블로커

- 운영 배포는 전체 v63 디자인 정합 NG와 design·qa 미승인 때문에 실행하지 않았다.
- Studio 단독 상품 운영 인증과 실채널 발행은 미검증이다.

### 다음에 칠 명령

```bash
gh pr view 26 --json state,mergedAt,mergeCommit,url
gh run view 33182670718 --json status,conclusion,headSha,url,workflowName
```

### 검증했나

- 관찰됨: 병합 요청 MERGED.
- 테스트됨: PR CI와 main CI success.
- 미검증: 이번 세션의 고객 로그인 브라우저 경로, 운영 배포, 운영 인증, 실채널 발행.

## 2026-08-28 23:27 KST, Codex 동기화 확인과 자동 연쇄 복구

### 무엇을 어디까지 했나

- Claude 정본 동기화기를 실행해 Codex 누락 훅 7개를 보정했다. 재실행은 변경 0·드리프트 0, 하네스 fixture는 23/23 통과했다. 공용 정본의 더 상세한 동기화 결과는 `session-state.osmu.md` 23:26 기록에 있다.
- 자동 판 `gapfill082823`의 인박스·캘린더→Studio 발행실 복귀 변경을 직접 검증했다. 관련 Vitest 29/29, `npx tsc --noEmit`, Next 생산 빌드 174경로를 통과했다.
- 감독이 종료 문구 없는 워커의 tmux 세션을 영원히 `돌는중`으로 오인하는 다섯 번째 멈춤 원인을 찾았다. pane 현재 명령이 대기 셸이면 종료로 판정하도록 `scripts/osmu-supervisor.sh`를 고치고 재기동했다. `gapfill082823`이 23:23 `끝남`으로 전환됐다.

### 남은 이슈·블로커

- 복귀 기능은 자동 테스트와 생산 빌드까지 검증했다. 실제 브라우저에서 인박스 또는 캘린더 작업물을 눌러 발행실 본문·채널 선택이 복원되는 전체 클릭 경로는 미검증이다.
- 생산 빌드에는 기존 Turbopack NFT 추적 경고 1건이 남는다.
- Studio 운영 인증, 운영 배포, 실채널 발행은 미검증이다.

### 다음에 칠 명령

```bash
bash ~/.claude/harness/bin/sync-codex-hooks.sh
bash ~/.claude/harness/tests/run-fixtures.sh
tail -12 /tmp/osmu-supervisor.log
tail -12 docs/plan/osmu-backlog-state.tsv
cd dashboard && npx vitest run tests/api/osmu-v63-backend.test.ts tests/publish/studio-publish-ui.test.tsx
```

- 다음 작업은 브라우저 클릭 E2E로 인박스·캘린더→발행실 복귀를 직접 관찰하는 것이다.
- 회장이 병합 요청 26번을 병합하면 배포 CI와 운영 기본 흐름을 재검증한다.

### 검증했나

- 테스트됨: 하네스 fixture 23/23, 복귀 계약·UI·링크 32/32, TypeScript, 생산 빌드 174경로.
- 관찰됨: Codex 동기화 재실행 변경 0·드리프트 0, 감독 재기동, `gapfill082823` 종료 전환.
- 미검증: 복귀 기능 실제 브라우저 클릭 E2E, 운영 배포, 운영 인증, 실채널 발행.

## 2026-08-28 23:10 KST, Codex Studio 상태 판정 및 다음 작업

### 무엇을 어디까지 했나

- 회장이 지정한 `session-state.studio.md`를 인계 정본으로 삼고, 이 파일이 지시한 공용 코드베이스 정본 `session-state.osmu.md`, 양쪽 `pipeline-state`, Git, tmux, 감독 상태를 대조했다.
- Studio 핵심 API는 생성 장부 PostgreSQL 영속화, 무료 몫 시간대 공격 차단, 운영 환경 개발용 신원 차단, 편집 인계까지 구현돼 있다. 검증 기록은 Studio 계약 12/12, 기본 흐름 11/11, 전체 시험 186파일 1,330건, 운영 빌드 174경로다.
- 병합 요청 26번은 OPEN, MERGEABLE, CI `verify` SUCCESS다. 로컬 `http://localhost:3456/api/health`는 이번 세션에서 직접 200을 관찰했다.
- 자동 감독은 살아 있고 `gapfill082823`을 build 갈래에 배차했다.

### 남은 이슈·블로커

- Studio를 단독 상품으로 운영할 회원 인증 어댑터가 없다. 개발용 신원은 운영에서 의도적으로 503이므로 지금 상태로는 유료 고객이 Studio에 로그인할 수 없다.
- 인증 소유권과 세션 형식은 보안·아키텍처 결정이다. 기존 openclaw 세션 재사용, 독립 Studio 인증, 외부 인증 제공자 중 어느 경계를 택할지 회장 합의 전 임의 구현하지 않는다.
- `pipeline-state.studio.md`의 기술설계 재작업 표기와 실제 PostgreSQL 구현·검증 상태가 어긋난다. 운영 인증 합의 후 최신 구현을 기준으로 설계 산출물과 상태를 재정합해야 한다.
- 병합과 운영 배포는 기존 인계에서 회장 소유로 명시됐다. 병합 전에는 운영 Studio와 실채널 발행을 직접 검증할 수 없다.
- 실채널 발행과 provider 댓글 읽기는 계정 로그인이 필요해 미검증이다.

### 다음에 칠 명령

```bash
gh pr view 26 --json number,state,mergeable,statusCheckRollup,url
tail -8 /tmp/osmu-supervisor.log
sed -n '1,120p' docs/plan/osmu-backlog-state.tsv
git status --short --untracked-files=no
```

- 회장이 병합 요청 26번을 병합하면 배포 CI가 성공할 때까지 확인하고, 배포 환경 health와 기본 흐름 11단계를 다시 실행한다.
- `gapfill082823`이 끝나면 워커 문장을 근거로 쓰지 않고 diff와 관련 테스트를 직접 재현한다.
- Studio 운영 인증은 구현 전에 회장과 인증 소유권, 세션 형식, workspace 권한 경계를 선택지와 트레이드오프로 합의한다.

### 검증했나

- 관찰됨: 로컬 health 200, 감독 로그의 `gapfill082823` 배차, 병합 요청 26번 OPEN·MERGEABLE.
- 근거 확인: 병합 요청 CI `verify` SUCCESS.
- 이전 세션에서 테스트됨: Studio 계약 12/12, 기본 흐름 11/11, 전체 시험 186파일 1,330건, 운영 빌드 174경로.
- 미검증: 운영 배포, 실채널 발행, provider 댓글 조회, Studio 운영 인증.

## 2026-08-28 22:40 KST, Claude → Codex 세션 교대. studio 라인 현황

**이 라인은 osmu 라인과 같은 코드베이스를 쓴다. 이어받는 세션은 `session-state.osmu.md` 를 먼저 읽어라.** 그쪽이 지금 무엇을 할지의 정본이고, 이 파일은 studio 제작엔진 쪽 이력이다.

### studio 라인이 그 뒤로 간 곳

- **생성 장부가 메모리에서 postgres 로 옮겨졌다.** 이전에는 `generation/service.ts` 의 Map 세 개(작업·멱등·무료 몫)라 재시작하면 사라지고 서버를 늘리면 몫이 배로 늘었다. 마이그레이션 `db/migrations/20260828_010_studio_generation.sql`. 컨트롤러가 앱을 껐다 켠 뒤 같은 작업이 후보 3장과 함께 조회되는 것을 직접 관찰했다.
- **무료 몫의 시간대 우회를 막았다.** 몫 키의 현지 날짜를 클라이언트가 보낸 `u2.time_zone` 으로 만들면 협정시 -12 부터 +14 까지 26시간이 벌어져 하루에 두세 번 몫이 살아난다. 협정시 기준으로 고정했다. 회귀 스크립트 `scripts/verify-free-quota-timezone-attack.mjs`.
- **개발용 신원 우회가 운영에서 열리지 않게 막았다.** `identity.ts:18` 에서 `NODE_ENV=production` 이면 설정과 무관하게 거절한다. 회귀 테스트 `tests/studio/dev-identity-prod-guard.test.ts`.
- **계약 검증이 10건에서 12건으로 늘었다.** `scripts/verify-studio-v1-e2e.mjs`.
- **편집 인계 계약**(`/api/studio/handoffs`, `/api/studio/drafts/[draftId]/editor`)이 붙었다. 장면 순서 변경, 문장 삭제와 복원, 낡은 판번호 거절까지 컨트롤러가 직접 관찰했다.

### 검증 상태

`node scripts/verify-studio-v1-e2e.mjs` 12/12, `node scripts/verify-basic-flow-e2e.mjs` 11/11, 전체 시험 186파일 1,329건 통과, 운영 빌드 174경로, 빈 DB 마이그레이션 6/6.

### 남은 것

- studio 를 단독 상품으로 파는 데 필요한 회원 인증 어댑터가 아직 없다. 지금은 개발용 신원만 있고 운영에서는 503 으로 닫힌다. 이것이 studio 단독 판매의 다음 관문이다.
- 실채널 발행과 provider 댓글 읽기는 계정 로그인이 필요해 미검증이다.

### 주의

**몫 검증 함정**: `verify-free-quota-timezone-attack.mjs` 는 오늘 몫을 이미 썼으면 전부 거절이 나와 막힌 것처럼 보인다. 반드시 `psql "$DATABASE_URL" -c "delete from studio_free_regeneration_uses"` 후에 돌려라.

## 2026-08-27 23:10 KST, Studio 생성 API build 인계

- 사용자 확정 기반: 이 세션에 주입된 Studio 생성 API 과제와 `docs/prototype/openclaw-auto-4room-v63.html`, 회장 확정 요구사항 R27, R37, R71, R104, R105, R132, R133, `docs/학습정보-층계-계약-v1.0.md`.
- live handoff 확인: tmux `openclaw-auto:0.0`은 OSMU UI 작업, `osmu-studio:0.0`은 이 Studio API worker로 확인했다. Studio 소스 중복 편집은 없었다.
- 구현: 7층 입력 검증, 후보 A/B/C, workspace 권한, idempotency, R27 무료 재생성과 과금 승인 거절. 서비스 중립 경계를 지켰고 provider 인증값은 받지 않는다.
- 커밋: `8ecb4525` Studio 생성 입력과 후보 세 장 API. 이후 실제 Next bundle에서 발견한 runtime·error 경계 보정은 후속 커밋 예정.
- 검증: Studio 테스트 15건, 전체 Vitest 144 files·1,166 passed·6 skipped, TypeScript, webpack production build, design lint 통과. 실제 로컬 HTTP 201, 422, 무료 재생성 201, 추가 재생성 409, 조회 200을 관찰했다.
- 미구현: 실제 미디어 provider 생성, production 회원·workspace·job·사용량 장부, R105 만료 다운로드. 전자는 이번 생성 API 수직 조각의 하류 연결이고, 후자 두 건은 신규 DB table 합의가 필요하다.
- 정확한 다음 실행: 후속 커밋을 완료한 뒤 QA는 `dashboard/tests/studio/generation-domain.test.ts`와 `generation-route.integration.test.ts`를 재실행하고, 신규 DB 계약 합의 후 PostgreSQL 실붙임·다중 instance 경합·만료 링크를 검증한다.

## 2026-08-15 08:50 KST, PRD v1.2.0 워커 인계

- 사용자 확정 기반: `docs/제품구조-결정-2026-08-15.md`, `studio/docs/prd-studio-service-v1.1.2-gpt-codex.md`, `docs/벤치마킹-참여형결정경험-2026-08-15-v3-gpt-codex.md`.
- live handoff 확인: tmux `openclaw-auto:0.1`. 부모 컨트롤러가 studio plan 산출물을 병렬 위임 중이며 이 세션은 PRD 개정만 소유한다.
- 생성 산출물: `studio/docs/prd-studio-service-v1.2.0-gpt-codex.md`.
- 반영: §3.7 질문 엔진, §3.8 생성·편집과 과금 화법, §3.9 입력 세 범주, §3.10 확률성 경계, §3.95 운영자 면, §9.5 회장 확정 5건, 경쟁 지형·빈자리, FR·NFR·AC·BM·리스크·KC·결정 원장 추적.
- 보존 검증: v1.1.2 124,686B·1,348줄·본장 23개에서 v1.2.0 179,374B·1,702줄·본장 23개로 확장. 상대 링크와 `git diff --check` 통과. Mermaid CLI 실제 SVG 렌더 통과.
- 미통과 게이트: plan-critic 독립 비평, PRD 문서리뷰, `wiki/product/studio.md`·구현현황 정합화, 회장 잔여 결정 범위 승인, `/approve plan`.
- 다음 실행: 부모 Stage Controller가 PRD 리뷰와 plan-critic 결과를 취합하고 `/approve plan` 증거를 재검증한다. design 진입은 아직 금지다.

## 2026-08-15 (haejo-danta 라인 → openclaw-auto 라인 인계)

### 지금 바로 읽을 것
**`studio/docs/인수인계-스튜디오-제품논의-2026-08-15.md`** 한 파일에 전부 있다.
회장과 나눈 제품 논의(2026-08-14~15) 전량. 결론뿐 아니라 기각안과 그 이유까지.

### 무슨 일이 있었나
haejo-danta 라인에서 힉스필드로 세로 영상 파일럿을 만들다가, 그 제작 공정 자체를 제품화하기로 했다.
openclaw-auto가 이미 발행 플랫폼(v3.0)이므로 그 위에 제작 엔진(studio)을 모듈로 얹는 방향(A안)으로 이관했다.

### 이관 결과
- `studio/` (2.6MB, git 추적) = standards 품질헌법 4종 / pipelines / ventures 인테이크 / experiments 실험보고서 + 라인 레지스트리 / docs 벤치마킹·인수인계
- `studio-assets/` (614MB, gitignore 등록됨) = 영상·이미지·음성뱅크·Soul 레퍼런스
- 원본 `~/OSMU-archive`는 미삭제. 새 경로 정상 확인 후 회장 승인받아 정리.

### 핵심 결정 3줄
1. 차별점은 생성이 아니라 **사용자가 A/B/C를 골라 취향을 학습시키는 eval 루프**. 경쟁사 14종 조사 결과 이걸 하는 곳이 없다.
2. LLM은 픽셀을 그리지 않는다. **편집 지시서(JSON)** 를 쓰고 ffmpeg+PIL 로컬 코드가 렌더한다. 이 스키마가 제품의 진짜 자산.
3. 경계는 **"창작 결정이냐 채널 적응이냐"**. studio=무엇을 어떻게 만들까 / openclaw=어디에 언제 올리고 성과를 어떻게 걷을까.

### 최대 병목
나레이션 목소리 최종 선택. 회장 청취 대기.
- 파일: `studio-assets/haejo-danta/generated/EC0147-voicebank-훅-2026-08-14-elevenlabs_minimax-40종.wav` (9분 30초)
- 순서표: `studio/experiments/음성뱅크-수집-2026-08-14.md`
- 풀리면 EC0147 전편 완성 → 마케팅 소재의 증거물이 됨

### 회장 미결정 3건
1. 아키텍처 A/B/C (세션 추천 A. 이관은 A 전제로 실행됨)
2. 취향학습을 PRD v7.3.5 개정으로 넣을지 (개정 시 design 단계 재오픈)
3. 키 방식: 유저 자기 키 vs 우리 키 충전식 (세션 추천 = 우리 키 충전식)

### 최우선 경쟁사
시그마인(sigmine.ai). 우리와 거의 같은 제품, 이미 매출·정부지원 있음. 월 15만~75만원.
우리 킥 = 취향 학습(그쪽은 AI가 알아서) / 편당 밀도(그쪽은 월 300건 볼륨) / 벤처 내부 지식 인테이크(그쪽은 홈페이지 크롤링).
반론: 속도에서 압도적으로 뒤진다. 좁은 시장(교육·금융)으로 가야 한다.

### 진행 중인 위임
Codex 위임 G: 포지셔닝·해자 등급 + 메타증명 마케팅 소재. 로그 /tmp/codex-marketing.log
산출 예정: `studio/docs/포지셔닝-해자-정리-2026-08-15.md`, `studio/docs/마케팅-소재-메타증명-2026-08-15.md`
(현재 `~/OSMU-archive/docs/`에 떨어질 수 있으니 완료 후 studio/docs로 옮길 것)

### 이어받아 바로 할 수 있는 작업: EC0147 전편 재조립

작업셋 전량이 `studio-assets/haejo-danta/build-workspace/` 에 회수돼 있다(108파일, 76MB).
- `vo1~vo11.wav` 나레이션 11트랙 (현재 qwen_audio_tts Arthur, 회장이 "글자 읽는 느낌"으로 기각한 버전)
- `im*.png` 장면 이미지 18장 (에디토리얼 일러스트)
- `L_tag.png` `L_disc.png` 상시 레이어
- `build.py` 조립 스크립트 (컷 정의·자막 렌더·ffmpeg 합성 전부 포함)
- `c_*.mp3` 목소리 후보 비교 원본

**회장이 음성 번호를 고르면**: 그 목소리로 `text2speech_v2`(variant=elevenlabs 또는 minimax, voice_id 고정) 나레이션 11건만 재생성 → `vo*.wav` 교체 → `python3 build.py` → concat. 이미지는 재생성 불필요.
**주의**: 힉스필드 크레딧이 `free plan, 0 credits`이다. 결제 상태부터 확인해야 나레이션 재생성이 가능하다.

### 주의
- `studio/`는 `extensions/`(채널 코드)를 import하지 않는다. 발행 쪽은 브랜드킷·금지선을 소유하지 않는다. 의존 방향이 경계를 지킨다.
- API 계약·DB 스키마는 회장 합의 전 확정 금지(하네스 §6.3.5). 인수인계 문서의 DB 스키마는 초안이다.
# 2026-08-29 00:29 KST, 배포 요청에 따른 공용 design 게이트 복원

### 무엇을 어디까지 했나

- Studio를 포함한 main 코드는 병합되고 CI가 성공했지만, 공용 OSMU pipeline의 디자인 승인 핀이 현행 정본보다 오래된 상태임을 확인했다.
- 누락된 공용 design_spec을 product-designer가 리테이크해 산출했고, 실제 공식문서 조사 증거를 포함한 트랜스크립트가 품질 게이트를 통과했다.

### 남은 이슈·블로커

- Studio 단독 코드 문제가 아니라 공용 네 방 디자인 게이트가 열린 상태다. 최신 main 12화면 재촬영과 독립 design-review 전에는 운영 배포하지 않는다.
- Studio 운영 인증과 실채널 발행은 계속 미검증이다.

### 다음에 칠 명령

```bash
sed -n '1,220p' docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md
git diff -- pipeline-state.osmu.md session-state.osmu.md session-state.studio.md
```

### 검증했나

- 테스트됨: product-designer 리테이크 품질 게이트 PASS.
- 관찰됨: design_spec 파일, 해시, 금지 긴 대시 0건.
- 미검증: 최신 main matched-pair 화면, 독립 design-review, 운영 배포, 운영 인증, 실채널 발행.

# 2026-08-29 03:47 KST, Studio 운영 고객 생성·편집·발행·재로그인 보수

### 무엇을 어디까지 했나

운영 Exhaustive QA에서 재현된 여섯 결함을 dashboard Studio UI와 고객 인증 경계에서 수정했다. 생성실의 목적, 대상, 소재 권리 동의는 작업 공간별로 복원되고, 생성 연타는 동기 단일 실행 경계로 POST 한 번만 보낸다. 후보 화면은 기존 무료 재생성 API를 실제 실행한다. 편집실 글 선택은 카드뉴스에 머물지 않고 글 목차, 글 미리보기, 문단 편집으로 바뀐다. 발행실은 연결 계정만 선택하며 0개면 발행을 잠그고 설정 연결을 안내한다. 만료 고객은 운영자 화면이 아니라 복귀 주소를 보존한 고객 로그인으로 이동한다.

로컬의 개발 신원 모드가 실제 고객 JWT까지 개발 bearer로 오인해 생성 API를 401로 막는 추가 원인을 발견했다. 개발 bearer와 정확히 일치할 때만 개발 신원을 쓰고, JWT는 Supabase 고객과 active tenant를 확인하도록 수정했다. 운영의 개발 신원 차단은 유지한다.

### 남은 이슈·블로커

코드와 로컬 실동작 범위의 블로커는 없다. 공개 운영 배포와 배포 뒤 운영 회귀는 상위 release/QA 트랙 소유라 이 세션에서는 미검증이다. gstack browse의 오래된 `127.0.0.1` 탭에서 발생한 HMR cross-origin 오류는 새 `localhost` 탭의 제품 동작과 무관했고, 제품 상호작용 뒤 콘솔 오류 0을 따로 확인했다.

### 다음에 칠 명령

```bash
cd dashboard && npm test -- --run tests/studio/studio-fe2-rooms.test.tsx tests/publish/studio-publish-ui.test.tsx tests/components/AuthGateRouting.test.tsx tests/components/auth-return-to.test.ts tests/studio/generation-customer-identity.test.ts
cd dashboard && npx tsc --noEmit && npm run build
```

### 검증했나

테스트됨: focused UI·인증 62건, 전체 Vitest 194파일 1,398건 통과와 1건 조건부 skip, 최종 신원 focused 12건, TypeScript 통과. 디자인 lint와 UI token audit 위반은 0건이다.

관찰됨: 실제 고객 세션으로 `localhost:3456`에서 생성 POST 1회와 201, 후보 A/B/C, 무료 재생성 201, 입력 방 왕복 복원, 글 편집 전환, 계정 0개 발행 잠금, 만료 고객 복귀 주소 보존을 확인했다. 스크린샷은 `/tmp/osmu-studio-create-persist.png`, `/tmp/osmu-studio-edit-text.png`, `/tmp/osmu-studio-publish-zero.png`에 있다.

미검증: 운영 배포, 배포 CI, 공개 운영 주소의 같은 여섯 경로.

STAMP | line: osmu-studio-production-qa | 생성: 2026-08-29 03:47 KST | model: gpt-5.6-sol | agent: code-builder | skill: qa | 고민: 개발 토큰과 실제 고객 JWT를 환경 단위가 아니라 입력 신원 단위로 안전하게 분기했다.

SKILLS_USED: qa. 실제 브라우저 재현과 회귀 검증에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `DESIGN.md` v33 | `docs/prototype/openclaw-auto-4room-v64.html` | https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API | https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html

MODEL: gpt-codex/gpt-5.6-sol / code-builder

# 2026-08-29 11:31 KST, PR 34 발행실 CI 비동기 테스트 경계 보수

### 무엇을 어디까지 했나

PR 34 CI run 33228468182의 단일 실패는 제품의 계정 연결 회귀가 아니었다. 큐 복원 toast와 연결 계정 조회는 서로 다른 비동기 작업인데, 테스트가 toast 직후 아직 의도된 안전 초기값인 `0곳에 올리기`를 동기 조회했다. `dashboard/tests/publish/studio-publish-ui.test.tsx`의 해당 정상 경로만 Threads, X, Instagram 발행 체크가 활성화될 때까지 기다린 뒤 `3곳에 올리기`를 검증하도록 수정했다. 제품 소스와 0계정 차단 계약은 바꾸지 않았다.

### 남은 이슈·블로커

로컬 코드 블로커는 없다. 공유 dirty worktree에 다른 세션 변경이 있어 별도 clean branch 재현은 하지 않았다. PR CI 재실행 결과는 상위 트랙에서 확인해야 한다.

### 다음에 칠 명령

```bash
cd dashboard && npm test -- --run tests/publish/studio-publish-ui.test.tsx
cd dashboard && npm test -- --run tests/components/AuthGateRouting.test.tsx tests/components/LoginModalRouting.test.tsx tests/isolation/authgate-contract.test.ts
```

### 검증했나

테스트됨: 발행실 전체 27건을 최초 1회와 병렬 반복 3회, 총 4회 모두 통과했다. 각 실행에서 연결 계정 0개면 `0곳에 올리기`와 지금 발행을 잠그는 `QA-PUBLISH-06`도 함께 통과했다. 인증 집중 3파일 50건도 통과했다.

미검증: PR 34 CI 재실행.

STAMP | line: osmu-pr34-publish-test-race | 생성: 2026-08-29 11:31 KST | model: gpt-5.6-sol | agent: code-builder | skill: qa | 고민: 안전한 로딩 상태를 제품에서 제거하지 않고 테스트가 실제 계정 조회 완료를 관찰하게 했다.

SKILLS_USED: qa. CI 경합 재현과 반복 검증에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `dashboard/tests/publish/studio-publish-ui.test.tsx` | `dashboard/src/app/studio/page.tsx` | CI run 33228468182

MODEL: gpt-codex/gpt-5.6-sol / code-builder

# 2026-08-29 08:49 KST, 고객 인증 최종 안정 상태 회귀 보수

### 무엇을 어디까지 했나

운영 교차 QA에서 만료 고객 세션이 중간에는 고객 로그인으로 이동하지만 이후 운영자 화면 또는 공개 랜딩으로 바뀌는 High 회귀를 확인했다. 원인은 토큰의 JWT 모양만으로 고객과 운영자를 분류한 점과 AuthGate, LoginPage가 Supabase 저장 세션을 동시에 검증 없이 승격한 점이었다.

고객과 운영자 credential 종류를 별도 표식으로 보존하고 각 로그인 진입점에서 명시하도록 수정했다. 고객 보호 경로의 401은 토큰 형식이 깨져도 고객 로그인으로만 이동한다. LoginPage는 Supabase `getSession`과 `onAuthStateChange` 후보를 `/api/me`로 검증한 뒤에만 저장하고 복귀 주소로 이동한다. 같은 만료 토큰이 중복 도착하면 한 번만 검사하며, 거절된 세션은 local sign-out 뒤 로그인에 유지한다. 보호 경로에서 토큰이 사라지는 프레임은 공개 랜딩을 렌더하지 않는다. 고객 API의 401도 운영자 Auth Token 모달 이벤트를 발생시키지 않는다.

후속 독립 보안 리뷰의 BLOCK 6건도 해소했다. 고객 토큰으로 운영자 주소에 들어오면 검증된 token+pathname 쌍이 아니므로 운영자 자식과 SWR 캐시를 마운트하지 않고 고객 홈으로 돌린다. 고객 승인은 `isOperator === false`와 실제 `tenant.id`가 함께 있을 때만 성립한다. 복귀 주소는 same-origin URL 파싱과 디코딩 뒤 역슬래시, 제어문자, 운영자·로그인·가입·인증 callback 경로를 거절한다. 운영자 토큰은 서버의 운영자 확인 전에는 어떤 진입점에서도 저장하지 않는다. hash OAuth callback은 hash만 제거하고 `returnTo` query를 보존한다.

2차 독립 리뷰의 MAJOR 2건도 해소했다. `/api/me` 네트워크 예외는 fetch 전에 고정한 request token+pathname 소유권을 현재 상태와 다시 비교한 뒤 `verifiedAccessKey`와 `service_error`를 함께 반영한다. 따라서 확인 중 화면에 갇히지 않고 서비스 확인 실패, 새로고침, 로그아웃을 보여 주며 자식은 닫힌다. 승인된 Login Required 모달 UI는 복원했고, 입력 토큰을 `/api/me`가 `isOperator: true`로 확인한 뒤에만 operator 종류로 저장한다. 401과 고객 200은 명시 오류를 표시하고 저장하지 않으며 취소 행동을 유지한다.

### 남은 이슈·블로커

코드와 로컬 검증 범위의 블로커는 없다. 공개 운영 배포와 배포 뒤 같은 변형의 재검증은 상위 release/QA 트랙 소유로 미검증이다. 최초 Claude 직접 호출은 주간 사용량 제한으로 실패했지만 상위 독립 보안 리뷰가 6건을 BLOCK했고, 이번 수정과 회귀 증거로 전부 해소했다.

### 다음에 칠 명령

```bash
cd dashboard && npm test -- --run tests/components tests/isolation/authgate-contract.test.ts tests/analytics/success-only-wiring.contract.test.ts
cd dashboard && npx tsc --noEmit && npm run build
```

전체 인증·OAuth 20파일 명령은 아래가 정본이다. 1차 실행은 188건, MAJOR 회귀 테스트 추가 뒤 같은 명령의 최신 실행은 193건 통과했다.

```bash
cd dashboard && npm test -- --run tests/api/channel-config-oauth-verify.test.ts tests/api/operator-oauth-credentials.test.ts tests/brand/google-auth-preflight.test.ts tests/brand/oauth-credential-resolver-wiring.test.ts tests/brand/oauth-errors.test.ts tests/brand/operator-oauth-setup-ui.contract.test.ts tests/components/AuthGateRouting.test.tsx tests/components/auth-return-to.test.ts tests/components/customer-login-session-recovery.test.tsx tests/components/LoginModalRouting.test.tsx tests/components/operator-get-auth.test.tsx tests/components/operator-oauth-import-ui.test.tsx tests/db/oauth-app-credentials-schema.contract.test.ts tests/integrity/v24-oauth-count.regression-1.test.ts tests/isolation/authgate-contract.test.ts tests/isolation/tenant-auth.test.ts tests/lib/oauth-app-credentials-storage.test.ts tests/lib/oauth-app-credentials.test.ts tests/lib/operator-auth-rate-limit.test.ts tests/observability/tenant-auth-alert.test.ts
```

### 검증했나

테스트됨: 2차 리뷰 수정 집중 2파일 24건, 전체 관련 19파일 157건, 전체 인증·OAuth 경계 20파일 193건이 통과했다. TypeScript와 production build가 통과했고 정적 페이지 174/174가 생성됐다. 기존 NFT tracing 경고 한 건 외 신규 build 오류는 없다.

관찰됨: `localhost:3456`에서 형식 불량 고객 토큰과 실제 JWT 구조의 만료 access token 및 무효 Supabase refresh session을 각각 주입했다. 두 경우 모두 5초 또는 8초 뒤 최종 URL이 `/login?returnTo=%2Fstudio%3Froom%3Dedit`였고 Google 고객 로그인 화면을 유지했다. 실제 고객 세션으로 `/operator/customers`에 진입하면 고객 홈 `/`로 돌아가고 운영자 문구는 0이었다. 역슬래시 외부 복귀 주소는 같은 origin의 `/`로 제한됐다. 실제 운영자 토큰은 `/operator/customers`를 정상 유지했다. 운영자 인증 이벤트는 토큰을 저장하지 않고 `/operator`로 이동했다. 캡처는 `/tmp/osmu-auth-customer-operator-block.png`, `/tmp/osmu-auth-security-review-final.png`다.

관찰됨: 실제 운영자 세션의 `/api/me` fetch를 브라우저에서 거절하자 15초 폴링 뒤 서비스 확인 실패, 새로고침, 로그아웃이 보이고 운영자 자식은 사라졌다. Login Required 모달에 잘못된 토큰을 넣으면 오류와 저장 0을 확인했고, 실제 운영자 토큰은 검증 뒤 모달이 닫히며 operator 종류로 저장됐다. 캡처는 `/tmp/osmu-auth-network-service-error.png`, `/tmp/osmu-auth-validated-login-modal.png`다.

미검증: 공개 운영 배포, 배포 CI, 공개 운영 주소의 최종 안정 상태.

STAMP | line: osmu-customer-auth-stability | 생성: 2026-08-29 08:49 KST | model: gpt-5.6-sol | agent: code-builder | skill: qa | 고민: 브라우저 저장 세션을 신뢰 판정으로 쓰지 않고 서버 신원 확인 뒤에만 보호 경로를 열었다.

SKILLS_USED: qa. 인증 경합 재현, 최종 URL과 화면 직접 관찰에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `dashboard/src/components/shared/AuthGate.tsx` | `dashboard/src/app/login/page.tsx` | `dashboard/src/lib/auth.ts` | `dashboard/src/lib/api.ts` | https://supabase.com/docs/reference/javascript/auth-getsession | https://supabase.com/docs/reference/javascript/auth-onauthstatechange | https://supabase.com/docs/guides/troubleshooting/why-is-my-supabase-api-call-not-returning-PGzXw0

MODEL: gpt-codex/gpt-5.6-sol / code-builder

# 2026-08-29 10:03 KST, 고객 인증 경합 및 LoginModal 3차 BLOCK 해소

### 무엇을 어디까지 했나

15초 AuthGate 폴링이 겹칠 때 늦은 과거 정상 응답이 최신 이용 중지 판정을 덮을 수 있었던 원인은 각 응답이 자신이 최신 요청인지 증명하지 않았기 때문이다. 폴링마다 이전 요청을 AbortController로 중단하고 증가하는 요청 세대, 현재 token+pathname, 취소 상태가 모두 일치할 때만 결과를 반영하도록 고쳤다. 계약 테스트는 첫 정상 응답을 보류한 상태에서 두 번째 이용 중지 응답을 먼저 완료하고, 이후 첫 응답을 늦게 완료해도 이용 중지 화면과 자식 미마운트가 유지되는지 확인한다.

LoginModal은 검증 중 Cancel, unmount, 새 submit이 이전 요청 세대를 무효화하고 요청도 중단한다. 늦은 운영자 성공은 토큰 저장과 성공 toast를 만들지 않는다. 승인된 `[data-login-modal] .v56-loginmodal` 표식과 Login Required, Auth Token, Login, Cancel 카피를 복원했다. `role=dialog`, `aria-modal`, 제목 연결, 초기 포커스, Escape 닫기, Tab과 Shift+Tab 포커스 순환, 디자인 시스템의 44px 공용 Button도 적용했다.

### 남은 이슈·블로커

코드와 로컬 production 검증 범위의 블로커는 없다. 공개 운영 배포와 배포 뒤 실제 고객·운영자 세션 재검증은 상위 release/QA 트랙 소유로 미검증이다. 기존 `localhost:3456` dev 서버는 동시 production build 뒤 응답이 정체되어 건드리지 않았고, 새 production 서버 `127.0.0.1:3461`에서 UI를 검증했다.

### 다음에 칠 명령

```bash
cd dashboard && npm test -- --run tests/api/channel-config-oauth-verify.test.ts tests/api/operator-oauth-credentials.test.ts tests/brand/google-auth-preflight.test.ts tests/brand/oauth-credential-resolver-wiring.test.ts tests/brand/oauth-errors.test.ts tests/brand/operator-oauth-setup-ui.contract.test.ts tests/components/AuthGateRouting.test.tsx tests/components/auth-return-to.test.ts tests/components/customer-login-session-recovery.test.tsx tests/components/LoginModalRouting.test.tsx tests/components/operator-get-auth.test.tsx tests/components/operator-oauth-import-ui.test.tsx tests/db/oauth-app-credentials-schema.contract.test.ts tests/integrity/v24-oauth-count.regression-1.test.ts tests/isolation/authgate-contract.test.ts tests/isolation/tenant-auth.test.ts tests/lib/oauth-app-credentials-storage.test.ts tests/lib/oauth-app-credentials.test.ts tests/lib/operator-auth-rate-limit.test.ts tests/observability/tenant-auth-alert.test.ts
cd dashboard && npx tsc --noEmit
cd dashboard && npm run build
```

### 검증했나

테스트됨: 집중 3파일 50건, 관련 19파일 162건, 전체 인증·OAuth 정확 20파일 198건이 통과했다. `npx tsc --noEmit` exit 0, production build exit 0, 정적 페이지 174/174, design-lint 토큰 위반 0이다. build에는 기존 NFT tracing 경고 한 건만 있다.

관찰됨: `127.0.0.1:3461/operator`의 실제 production 서버에서 인증 이벤트로 모달을 열었다. 접근성 트리에 이름 있는 dialog와 Auth Token 입력, Login, Cancel이 나타났고 초기 포커스는 입력이었다. Shift+Tab은 Cancel, Tab은 다시 입력으로 순환했고 Escape 뒤 `[data-login-modal]`은 숨겨졌다. 캡처는 `/tmp/osmu-auth-login-modal-v56-a11y.png`다.

미검증: 공개 운영 배포, 배포 CI, 공개 운영 주소의 경합 및 키보드 회귀.

STAMP | line: osmu-customer-auth-race | 생성: 2026-08-29 10:03 KST | model: gpt-5.6-sol | agent: code-builder | skill: qa | 고민: AbortSignal을 무시하는 transport에서도 요청 세대가 늦은 성공의 부작용을 막도록 이중 경계를 뒀다.

SKILLS_USED: qa. 실제 응답 순서 역전과 production 브라우저 키보드 검증에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `DESIGN.md` v33 §승인 로그인 모달 | `dashboard/src/components/shared/AuthGate.tsx` | `dashboard/src/components/shared/LoginModal.tsx` | https://react.dev/reference/react/useEffect | https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/

MODEL: gpt-codex/gpt-5.6-sol / code-builder

# 2026-08-29 11:31 KST, PR 34 CI 후속 최신 상태

PR 34 CI run 33228468182의 단일 실패는 제품 회귀가 아니라 큐 복원 toast 뒤 연결 계정 Promise가 아직 끝나지 않은 시점에 테스트가 안전 초기값 `0곳에 올리기`를 동기 조회한 경합이었다. 제품 소스는 바꾸지 않았다. `dashboard/tests/publish/studio-publish-ui.test.tsx` 한 곳에서 Threads, X, Instagram 체크가 활성화될 때까지 기다린 뒤 `3곳에 올리기`를 검증한다. 0계정 발행 잠금 테스트는 그대로 유지했다.

테스트됨: 발행실 27건을 총 4회 실행해 모두 통과했고, 인증 집중 3파일 50건도 통과했다. 공유 dirty worktree 때문에 clean branch 재현은 하지 않았다. 남은 일은 상위 트랙의 PR CI 재실행 확인뿐이다.

다음 명령: `cd dashboard && npm test -- --run tests/publish/studio-publish-ui.test.tsx`

STAMP | line: osmu-pr34-publish-test-race | 생성: 2026-08-29 11:31 KST | model: gpt-5.6-sol | agent: code-builder | skill: qa

SKILLS_USED: qa. CI 경합과 반복 검증에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `dashboard/tests/publish/studio-publish-ui.test.tsx` | `dashboard/src/app/studio/page.tsx` | CI run 33228468182

MODEL: gpt-codex/gpt-5.6-sol / code-builder
