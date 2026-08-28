# OSMU 라인 세션 상태 (배포 준비 → 회장 병합 대기)

최신이 위. 이 파일만 읽고 30초 안에 이어갈 수 있어야 한다.

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
