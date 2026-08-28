# OSMU 라인 세션 상태 (배포 준비 → 회장 병합 대기)

최신이 위. 이 파일만 읽고 30초 안에 이어갈 수 있어야 한다.

## [2026-08-29 01:36] 읽기 API 99개 전수 실사 범위 PASS

- canonical `pipeline-state.osmu.md`의 `current_stage: qa`를 확인하고 이번 실사를 시작했다.
- `localhost:3456`, 작업 공간 `cd1d0a40-540d-4524-9b49-bf2445d82182`에서 GET export 99개를 실제 호출했다. 최종 정상 89, 의도된 거절 10, HTTP 500 0, 요청 실패 0이다.
- 수정 커밋: `c0b4d8b4` OAuth 구성 부재 500을 503으로 분리, `e3affd62` 고객 TikTok 상태 polling 인증 경계 복구, `dd3bb0c9` Studio 이중 고유 제약 회귀 보정, `04f91170` 전수 실사 스크립트 추가.
- 검증: health 200 DB up, 기본 흐름 11/11, Studio v1 12/12, Playwright 네 방 16화면과 복귀 4/4, 콘솔 오류·401 URL·가로 넘침 0. 전체 Vitest 190파일 1,358건 통과와 조건부 3건 제외, `npx tsc --noEmit`, production build 174/174, design lint 0 통과.
- 증거: `docs/audit/osmu-api-read-sweep-v1-gpt-codex.md`, `docs/qa/qa-tracker.md`, `docs/구현현황.md`.
- 전체 제품 QA는 NG를 유지한다. 운영 고객 Studio 생성이 503이고 승인 시안 디자인 정합 NG가 별도로 남아 있다. 실제 연결 TikTok provider 성공 응답과 공개 채널 발행도 미검증이다.
- 다음 실행: code-builder가 운영 고객 JWT를 Studio principal로 연결한다. 종료증거는 실제 운영 고객 세션으로 후보 3개 생성, 편집실 인계, 발행실 작업물 도달이다. product-designer와 qa-verifier는 승인 시안 정합 NG를 별도 루프로 닫아야 한다.


## [2026-08-29 00:20] 지난 24시간 코드 리뷰 BLOCK

### 무엇을 어디까지 했나

- 사용자 지정 기반을 우선했다. `pipeline-state.osmu.md`, v63 프로토타입, 회장 확정 요구 대장, 사업 좌표, DESIGN을 읽고 `856ab35e`부터 `50e1c56b`까지 104개 커밋을 검토했다.
- tmux의 `openclaw:0.1`, `openclaw:0.2`, 이전 `osmu-review1` 문맥을 확인했다. 숨은 pane 상태가 아니라 사용자가 지정한 지난 24시간 커밋과 현재 파일 상태를 리뷰 기준으로 확정했다.
- 소스는 수정하지 않았다. 감사 문서는 `docs/audit/osmu-code-review-2026-08-29.md`다.
- MAJOR 25건, MINOR 5건이다. 작업 공간 격리 누수, 부분 실패, 외부 부작용 뒤 기록 실패, 승인 시안 이탈이 있어 `REVIEW_VERDICT: BLOCK`이다.

### 검증했나

- 관찰됨: localhost health HTTP 200, DB `up`.
- 테스트됨: 기본 흐름 11/11, Studio 생성 계약 12/12, Vitest 187파일 1,338건 통과와 4건 조건부 스킵, TypeScript 종료 코드 0.
- NG: `git diff --check`가 이번 범위의 후행 공백과 EOF 빈 줄로 실패.
- 미검증: 실제 공개 채널 발행, 실 provider 댓글 읽기와 답글, 운영 배포.

### 정확한 다음 행동

- 소유자: build 라인 코드 작성자.
- 우선순위: 감사 문서 M1부터 M10의 과금, 격리, 부분 실패를 먼저 수정한다. 이후 M11부터 M25와 MINOR를 처리한다.
- 종료 증거: 각 재현 전용 회귀 테스트, 실제 작업 공간 전환 브라우저 관찰, 외부 성공 뒤 내부 실패 fault injection, 전체 필수 테스트 재통과, 독립 코드 재리뷰 PASS.

## [2026-08-28 22:45] 네 방 기본 흐름 QA와 픽셀 대조

### 무엇을 어디까지 했나

- canonical `pipeline-state.osmu.md`는 착수 시 이미 `current_stage: qa`였다.
- 작업 공간 `cd1d0a40-540d-4524-9b49-bf2445d82182`에서 생성실부터 성과실까지
  390, 768, 1024, 1440으로 실제 클릭했다. 화면 16/16과 성과실에서 생성실 복귀 4/4 PASS다.
- 실제 API 기본 흐름 11/11, Studio 12/12, health 200, Vitest 186파일 1,330건,
  TypeScript, production build 174경로, design lint 0건을 확인했다.
- 임시 PostgreSQL에 schema, test seed, RLS를 적용했다. tenant 2건과 seed-a 초안 1건을
  관찰한 뒤 임시 DB를 폐기해 잔존 0건이다.
- v63 성과실 시안 `docs/board/v63-perf-1440.png`과 dev 실화면
  `docs/prototype/qa-flow-rerun-20260828/1440-performance.png`을 원본 크기로 각각 열었다.
  시안의 상단 전역 탐색과 우측 담당 패널이 dev에 없고, dev에는 채널 연결 경고와 첫 사용자
  온보딩이 추가돼 있다. 기본 동선은 PASS지만 전체 v63 픽셀 정합은 NG다.
- QA 증거 커밋은 `dfec813e`다.

### 남은 이슈와 블로커

- 전체 v63 디자인 정합 행렬이 NG다. design과 qa 승인은 금지한다.
- 실제 공개 채널 발행과 운영 배포는 미검증이다.
- production build의 기존 NFT 추적 경고 1건이 남아 있다.

### 다음에 칠 명령

```bash
cd dashboard
set -a && . ./.env.local && set +a
WORKSPACE_ID=cd1d0a40-540d-4524-9b49-bf2445d82182 BASE_URL=http://localhost:3456 timeout 120 node scripts/verify-basic-flow-e2e.mjs
WORKSPACE_ID=cd1d0a40-540d-4524-9b49-bf2445d82182 BASE_URL=http://localhost:3456 timeout 120 node scripts/probe-four-room-flow.mjs
```

### 검증했나

- 검증했다. 직접 앱, 실제 API, 브라우저 4폭, 임시 DB seed, 전체 회귀를 관찰했다.
- 전체 디자인 일치는 검증 결과 NG다. 근거는 `docs/qa/qa-tracker.md`와
  `docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`다.

## 🔴 [2026-08-28 22:30] Claude → Codex 세션 교대. 여기서 시작해라

**Claude 컨트롤러가 토큰을 다 써서 이 세션이 끝난다. Codex 가 이어받는다.**

### 첫 다섯 줄
```
cat pipeline-state.osmu.md | head -60      # 단계·승인 이력과 인계 요약
tail -5 /tmp/osmu-supervisor.log           # 감독이 지금 무엇을 돌리나
cat docs/plan/osmu-backlog-state.tsv       # 판 상태표
git log --oneline -5                       # 최근 커밋
gh pr view 26                              # 회장 병합 대기 중인 릴리스
```

### 지금 상태 한 줄
0.2.0 병합 요청 26번이 열려 있고 **회장 병합 대기**다. 개발과 검수는 끝났고 컨트롤러가 직접 재검증까지 마쳤다.

### Codex 가 지켜야 할 것 (이 세션에서 반복해 깨졌던 것들)
1. **병합·운영 배포는 회장 몫이다.** `gh pr merge` 나 배포 워크플로를 실행하지 마라.
2. **워커 주장을 근거로 쓰지 마라.** 통과했다고 적힌 문장 말고 직접 재현해서 관찰해라. 이 세션에서 워커가 "통과"라고 쓴 것 중 실제로는 안 된 것이 여러 번 나왔다.
3. **감독이 도는지 매 턴 확인해라.** 멈춤 원인이 네 층이었고 넷 다 컨트롤러가 만든 것이었다. 같은 증상이 나오면 감독을 껐다 켜는 것으로 끝내지 말고 다섯째 층을 찾아라.
4. **몫 검증 함정.** `verify-free-quota-timezone-attack.mjs` 는 오늘 몫을 이미 썼으면 전부 거절이 나와 막힌 것처럼 보인다. 반드시 `psql "$DATABASE_URL" -c "delete from studio_free_regeneration_uses"` 후에 돌려라.
5. **디자인 정합을 눈으로 대조하기 전에는 "시안과 일치"라고 말하지 마라.** 시안 렌더와 dev 실화면 2장을 나란히 열어야 한다.

### 로컬 환경
- 앱 `localhost:3456` (`cd dashboard && npx next dev -p 3456`), 자격증명 `dashboard/.env.local`.
- 데이터베이스 `127.0.0.1:55432`. **임시 경로라 컴퓨터를 껐다 켜면 사라진다.** 계속 쓸 거면 영구 경로로 옮겨야 한다.
- 작업 공간 `cd1d0a40-540d-4524-9b49-bf2445d82182`.

### 검증 스크립트 (전부 `cd dashboard && set -a && . ./.env.local && set +a` 후)
| 스크립트 | 무엇을 |
|---|---|
| `node scripts/verify-basic-flow-e2e.mjs` | 네 방 기본 흐름 11단계 |
| `node scripts/verify-studio-v1-e2e.mjs` | studio 생성 계약 12건 |
| `node scripts/verify-free-quota-timezone-attack.mjs` | 무료 몫 시간대 우회 |
| `node scripts/probe-four-room-flow.mjs` | 네 방 화면 DOM 실측 |
| `node scripts/capture-studio-fe3-playwright.mjs` | 네 폭 캡처 |

---

## [2026-08-28 22:20] 0.2.0 병합 요청 올라감. 회장 병합 대기

### 무엇을 어디까지 했나

- **병합 요청 26번**이 `feat/design-system-and-missing-features` → `main` 으로 열려 있다. `origin/main` 대비 117 커밋 앞섬.
- 릴리스 매니페스트 `RELEASE.md` (0.2.0), 릴리스 문서 `docs/releases/2026-08-28-osmu-네방.md`.
- **컨트롤러가 직접 재검증한 것**(워커 주장 미사용):
  - 운영 빌드 `npm run build` 성공, 정적 경로 174개
  - **빈 데이터베이스를 새로 만들어** `db/schema.sql` + 마이그레이션 6개 순차 적용 성공, 테이블 24개
  - 기본 흐름 `verify-basic-flow-e2e.mjs` 11/11
  - studio 계약 `verify-studio-v1-e2e.mjs` 12/12
  - 무료 몫 시간대 공격 `verify-free-quota-timezone-attack.mjs` 몫 1회만 지급(막힘)
  - 네 방 화면 `probe-four-room-flow.mjs` 성과실 도달 가능, 가린 모달 0
  - 전체 시험 186파일 1,329건 통과, 실패 0
- 개발용 신원 우회를 운영에서 차단(`identity.ts:18`, `NODE_ENV=production` 이면 설정 무관 거절). 회귀 테스트 있음.

### 남은 이슈·블로커

1. **릴리스 담당 판정은 "배포 승인 전"**이다. 이유 둘: 디자인 정합 점검(`docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`)이 v63 대비 NG 유지, 설계 산출물 4건(design spec·FDD·API 계약·ERD) 미산출.
   - **컨트롤러 판단**: 회장이 직접 쓰며 고치겠다는 목적에는 지금 상태로 충분하다. 병합을 권했다.
2. **실채널 발행과 provider 댓글 읽기는 여전히 미검증.** 계정 로그인이 필요해 세션 물리 불가. 회장 몫.
3. 디자인 QA 픽셀 대조는 이번 턴에 안 했다(훅이 요구). 시안 렌더와 dev 실화면 2장을 나란히 Read 해서 판정해야 한다. 다음 세션 과제.

### 다음에 칠 명령

```
tail -5 /tmp/osmu-supervisor.log                 # 감독 상태
cat docs/plan/osmu-backlog-state.tsv             # 판 상태표
cd dashboard && set -a && . ./.env.local && set +a
node scripts/verify-basic-flow-e2e.mjs           # 기본 흐름 11단계
node scripts/probe-four-room-flow.mjs            # 네 방 화면
psql "$DATABASE_URL" -c "delete from studio_free_regeneration_uses"   # 몫 검증 전 필수
node scripts/verify-free-quota-timezone-attack.mjs
```

### 운영 설비 상태

- 감독 `scripts/osmu-supervisor.sh` 가동중, 동시 6명. cron 감시 `osmu-supervisor-guard.sh` 5분 주기.
- 백로그가 비면 `scripts/refill-backlog.sh` 가 자동 충전(검수 지적 문서 → 수정 판, 없으면 상시 점검 4종 회전).
- 멈춤 원인 네 층을 차례로 제거했다. ①컨트롤러가 회수만 기다림 ②감독이 백로그 비우고 종료 ③백로그 충전이 사람 손뿐 ④자리가 남아도 아무도 안 돌 때만 충전.
- 멈추려면 `touch /tmp/osmu-supervisor.stop`.
