# OSMU v7 Wireframe 03: Identity, Recovery, Migration, Circuit Breaker

> STAMP: created_at=2026-08-05 02:04 KST | model=gpt-codex/gpt-5.6-sol | agent=product-designer | skills=design-html, design-review | evidence=https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code, https://support.buffer.com/article/642-scheduling-posts | deliberation=계정과 외부 side effect가 불확실한 순간에 발행보다 중단과 복구를 우선하는 화면 설계

## 목적

Settings의 wrong-account/concurrent replay/X readiness, Calendar의 partial/reconciliation, 운영자 migration M0-M8, 28시간 안전 제한을 하나의 회복 모델로 정의한다.

## Settings: OAuth identity gate

```text
┌──────────────┬───────────────────────────────────────────────────────────────┐
│ Settings     │ Channels                                                     │
│ Channels     │ [AI] [Storage] [Design] [Notifications] [Fork tokens] ...   │
│ AI           ├───────────────────────────────────────────────────────────────┤
│ Storage      │ X 연결 확인                                                  │
│ Design       │ 예상 계정     @openclaw_ops                                  │
│ ... 9/9      │ 돌아온 계정   @personal_sj                  계정 불일치       │
│              │ 토큰 저장과 발행을 막았습니다                               │
│              │ [다시 연결] [다른 계정 선택] [Studio로 돌아가기]             │
└──────────────┴───────────────────────────────────────────────────────────────┘
```

### 상태

- `expected`: 연결 전 expected identity 확인
- `wrong-account`: expected/callback identity 병치, token store 0, publish 0
- `concurrent-20`: accepted 1, replay rejected 19
- `replay-rejected`: `이미 사용된 연결 요청`
- `revoked`: 기존 결과 유지, 새 side effect 0

### 인터랙션

- `다시 연결`은 새 state를 만들고 이전 state 재사용 금지 설명을 보여준다.
- accepted 요청을 클릭하면 request ID, provider, expected identity, consumed time을 보여준다.
- rejected 19개는 접힌 audit list로 열 수 있다.

## X readiness fail-close

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ X · @openclaw_ops                                      발행 준비 안 됨      │
│ identity 확인됨 · write scope 미확인 · token expiry 1h 12m                 │
│ 마지막 실제 probe: 02:01 KST · 403 insufficient_scope                      │
│ [scope 확인] [probe 다시 실행] [X 제외하고 Studio로]                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

- probe loading 중에도 publish CTA는 비활성이다.
- probe 성공 뒤에만 `ready`가 된다.
- readiness 만료 주기가 미결이면 `확인 시각`을 노출하고 자동 영구 성공으로 표시하지 않는다.

## Calendar: partial and reconciliation

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 8월 7일 09:00 · source src_0241                         부분 성공            │
│ Threads  ✓ actual permalink                                                │
│ Instagram ✓ external ID, no link                                            │
│ X        ◌ result unknown                                                   │
│ [결과 그룹 보기] [reconciliation 시작]                                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

- 성공 2개는 immutable row로 보인다.
- unknown은 실패와 구분한다.
- reconciliation 전에는 retry가 보이지 않는다.
- reconciliation이 없음을 확인한 뒤에도 primitive가 없으면 retry는 비활성이다.

## Migration M0-M8

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 운영자 Migration · 목표 authority                               M5/8        │
│ 현재: queue JSON primary · DB best-effort shadow                             │
│ 목표: canonical source/result authority · 아직 cutover 전                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✓ M0 Observe       count captured                                            │
│ ✓ M1 Provenance    unmapped 4 exported                                       │
│ ✓ M2 Source        backfill verified                                         │
│ ✓ M3 Targets       account pairs normalized                                 │
│ ✓ M4 Shadow write  duplicate test recorded                                   │
│ ● M5 Dual-read     mismatch 2, cutover blocked                               │
│ ○ M6 Canary        locked                                                    │
│ ○ M7 Expand        locked                                                    │
│ ○ M8 Cutover       locked                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ [diff 2건 보기] [현재 authority 유지] [reverse replay 준비]                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Pre/post toggle

- `PRE`: JSON primary, DB shadow, source 연결 없음
- `MIGRATING`: M0-M8 진행, dual read/write의 mismatch 공개
- `POST`: canonical authority, source/result/retry 계약 활성
- `ROLLBACK`: 외부 성공을 재실행하지 않고 내부 mapping만 역재생

## Circuit breaker 28h

### minute 1679

```text
28시간 안전 제한까지 1분
현재 atomic operation만 마치고 다음 batch를 시작하지 마세요.
[체크포인트 미리 저장] [현재 상태 보기]
```

### minute 1680

```text
안전 체크포인트 기록 중
source · account target · reservation/result · migration stage · next action
[commit 확인] 또는 [rollback 확인]
```

### minute 1681

```text
읽기 전용 · 다음 side effect 0
provider/API/migration batch/file mutation이 차단되었습니다.
[체크포인트 내보내기] [새 세션 승인 요청] [현재 상태 보기]
```

## Mobile 390

- Settings 9개 탭은 가로 스크롤이 아니라 2열 wrap, 각 44px이다.
- wrong-account expected/actual은 2열 대신 세로로 읽힌다.
- migration stepper는 표 대신 순서형 카드다.
- circuit breaker CTA는 각각 48px 전체 폭이다.

## 오류와 탈출 경로

| 오류 | side effect | 기본 행동 | 탈출 경로 |
|---|---|---|---|
| wrong-account | token/publish 0 | 다시 연결 | 계정 선택, Studio |
| replay rejected | duplicate token 0 | accepted audit 보기 | 새 연결 |
| X probe 403 | X publish 0 | scope 확인 | X 제외, Settings |
| reconciliation unknown | 새 publish 0 | 다시 확인 | Calendar |
| migration mismatch | cutover 0 | diff 수정 | JSON authority 유지, rollback |
| minute1681 | next side effect 0 | checkpoint export | read-only, 새 세션 승인 |

## 레드팀과 셀프심문

**공격:** 운영자는 빨리 복구하려고 fail-close를 우회하고 싶어 한다. UI에 `강제 진행`이 없으면 외부 도구로 우회할 수 있다.

**수정:** 강제 진행 CTA를 두지 않고, blocked reason과 evidence를 export할 수 있게 했다. 우회가 필요하면 eng-design의 명시적 override 계약과 감사 기록이 먼저다.

**이게 틀렸다면 가장 그럴듯한 이유는?** 한 화면에 OAuth, migration, circuit breaker를 묶어 일반 사용자에게 과한 운영 복잡성을 노출할 수 있다. 실제 앱에서는 Settings Channels와 운영자 권한 표면을 분리하되, 프로토타입 QA에서는 동일한 안전 원칙을 비교할 수 있도록 한 허브에 둔다.

## 회수 필요

- 회수 필요: OAuth atomic consume primitive
- 회수 필요: X readiness probe pass/expiry contract
- 회수 필요: migration cutover/rollback implementation
- 회수 필요: 28h active-minute source와 override audit

SOURCES: DESIGN.md | docs/user-flow.md | docs/openclaw-auto-osmu-prd-v4.1.2-gpt-codex.md | dashboard/src/app/settings/page.tsx | dashboard/src/app/api/connect/start/route.ts | dashboard/src/app/api/connect/callback/route.ts | dashboard/src/lib/social-connect.ts | dashboard/src/lib/queue-store.ts | dashboard/db/schema.sql | https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code | https://support.buffer.com/article/642-scheduling-posts

MODEL: gpt-codex/gpt-5.6-sol

SKILLS_USED: design-html, responsive recovery states | design-review, fail-close and dead-end audit

SKILLS_SKIPPED: 없음
