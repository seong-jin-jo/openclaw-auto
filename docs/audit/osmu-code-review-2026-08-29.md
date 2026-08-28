# OSMU 코드 리뷰 2026-08-29

STAMP | line: osmu | 생성: 2026-08-29 08:28 KST | model: gpt-codex/gpt-5.6-sol | agent: code-reviewer | skill: review | 고민: 통과 수치가 외부 부작용, 작업 공간 격리, 부분 실패, 승인 화면 계약까지 증명하는지 분리했다.

검토 범위: 리뷰 시작 시 고정한 `5d941aa051c9e7474b6a1dc36b4474573e0b4740..3c251689570816d1f98e179c9ca6b05c525395d1`. 2026-08-28 08:04 KST 이후 24시간의 97개 커밋이다. 전체 diff는 438개 파일, 추가 12,968줄, 삭제 7,274줄이다. 코드와 스크립트 표면은 144개 파일이다. 소스 코드는 수정하지 않았다.

기반 산출물:

- 승인 산출물 핀: `pipeline-state.osmu.md`
- 승인 PRD: `docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
- 회장 지정 프로토타입: `docs/prototype/openclaw-auto-4room-v63.html`
- 회장 확정 요구: `docs/requests/회장-확정-요구사항-대장.md`
- 사업 좌표: `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`
- 디자인 정본: `DESIGN.md`

직접 관찰 증거:

- `http://localhost:3456/api/health`: HTTP 200, DB `up`
- 지정 작업 공간 채널 연결: 0개
- `GET /api/metrics`: HTTP 200, Threads `collectionSupported=true`
- 같은 작업 공간 `POST /api/metrics`: HTTP 400, `threads 채널 미연결`
- `npm run test`: 196파일, 1,409건 통과, 1건 제외
- `npx tsc --noEmit`: 종료 코드 0
- `dashboard/scripts/verify-basic-flow-e2e.mjs`: 11/11 통과. 새 생성 작업, 초안 `85a9be49-5d81-439f-8acc-d17208056e53`, 발행 큐를 지정 작업 공간에 만들었다.
- `dashboard/scripts/verify-studio-v1-e2e.mjs`: 12/12 통과. 생성 작업 2건을 만들고 무료 재생성 몫 소진 409를 관찰했다.

필수 검증의 정상 경로 통과는 아래 부분 실패, 프로세스 중단, 외부 호출 중 DB 점유, 공유 작업 트리 경합, 정리 실패를 재현하지 않는다.

## MAJOR

MAJOR: [회귀 위험, 동시성] `scripts/osmu-supervisor.sh:121` - `build` 갈래의 pending 항목을 먼저 최대 4개까지 같은 저장소와 작업 트리에 동시에 발주한다 / 프로젝트 운영 계약의 `build 이후는 직렬`, `소스 쓰는 라인은 한 번에 하나`와 어긋난다 / 재현: build 항목 2개 이상을 비운 상태로 감독을 돌리면 122행 반복이 둘 다 `code-builder`로 띄우고, 두 워커가 같은 파일과 index와 HEAD에 쓰고 커밋한다 / 수정 방향: 코드 쓰기 역할은 하나만 허용하거나 워커마다 독립 worktree와 전용 branch를 만들고 직렬 통합해야 한다.

MAJOR: [회귀 위험, 격리, 동시성] `dashboard/src/lib/engagement-store.ts:46` - DB 트랜잭션과 advisory lock을 잡은 채 58행의 외부 좋아요 API를 기다린다 / PRD NFR-OS81-04의 `retry20, concurrent20에 안전`, `intent별 외부 side effect 1 이하`와 어긋난다 / 재현: 공급자 응답을 30초 지연시키고 여러 댓글 좋아요를 동시에 보내면 DB connection이 외부 대기와 lock 대기에 묶여 다른 작업 공간 요청도 밀린다 / 수정 방향: 짧은 트랜잭션으로 claim만 기록하고 외부 호출과 결과 저장을 분리하며 작업 공간별 동시성 한도를 둬야 한다.

MAJOR: [회귀 위험, 멱등] `dashboard/src/app/api/publish/route.ts:188` - 새 중복 방지 reservation이 UUID 초안에만 적용되고 `draft_id` 누락 또는 legacy ID는 그대로 외부 발행으로 간다 / PRD의 `정확히 한 번 발행`, `duplicate0`, `intent별 외부 side effect 1 이하`와 어긋난다 / 재현: 같은 본문과 계정으로 `draft_id` 없이 POST 두 건을 동시에 보내면 둘 다 공급자 호출에 도달한다 / 수정 방향: 모든 발행 요청에 필수 idempotency key를 요구하고 단일 reservation 경로를 통과시켜야 한다.

MAJOR: [회귀 위험, 복구] `dashboard/src/app/api/publish/route.ts:209` - 새 `in_progress` reservation에 lease, heartbeat, stale 판정, 공급자 조회 키가 없다 / v63의 `외부 결과를 확인 중`, `중복 게시를 막고 같은 요청의 외부 결과만 확인합니다`와 어긋난다 / 재현: reservation INSERT 직후 프로세스를 종료하면 같은 초안은 시간 경과와 무관하게 294행의 `PUBLISH_ALREADY_IN_PROGRESS` 409만 반환한다 / 수정 방향: 시도 ID, lease, 공급자 correlation을 저장하고 만료 시 외부 결과를 먼저 reconcile해야 한다.

MAJOR: [회귀 위험, 부분 실패를 전체 성공으로 계산] `dashboard/src/app/api/publish/route.ts:371` - 본문 성공과 첫 댓글 실패도 DB에는 `status='published'`, `error=NULL`로 종결한다 / v63의 `일부 실패는 복구 필요, 재발행 금지`와 PRD의 `false-published0`에 어긋난다 / 재현: 본문 공급자는 성공시키고 첫 댓글만 실패시키면 최초 응답은 `partial=true`지만 새로고침 뒤 GET은 게시 성공으로만 보인다 / 수정 방향: 본문과 첫 댓글을 독립 상태로 영속화하고 첫 댓글만 멱등 복구해야 한다.

MAJOR: [회귀 위험, 복구 단절] `dashboard/src/lib/engagement-store.ts:111` - 공급자 timeout을 `reply_external_id='status-unknown'`으로 고정하지만 조회, 확정, 해제 경로가 없다 / PRD의 uncertain reconcile과 v63의 `외부 결과만 확인` 계약에 어긋난다 / 재현: 공급자가 답글을 만들고 응답만 끊으면 이후 모든 재시도가 영구 `REPLY_ALREADY_CLAIMED`가 되고 실제 답글 존재 여부를 확인할 수 없다 / 수정 방향: 공급자 조회 기반 reconcile과 운영자 확인 또는 안전한 해제 경로를 추가해야 한다.

MAJOR: [돈, 응답 진실성] `dashboard/src/lib/studio/generation/service.ts:324` - 무료 재생성 몫은 307행에서 UTC 날짜로 차감하지만 응답과 409 오류는 원본 작업 시간대의 다음 자정을 복구 시각으로 알린다 / 사업 좌표의 `무료에서 유료로 넘어가는 경계, 몫, 멱등이 실제로 지켜져야 한다`와 어긋난다 / 재현: 서울 23:30에 무료 몫을 쓰면 응답은 00:00 복구를 약속하지만 실제 UTC 장부는 09:00까지 유료 승인 409를 반환한다 / 수정 방향: quota key와 reset 응답을 같은 UTC 경계로 통일해야 한다.

MAJOR: [회귀 위험, 레거시 업그레이드] `dashboard/db/run-migrations.sh:55` - Studio generation 테이블이 없는 기존 DB는 어떤 승인 phase로도 업그레이드할 수 없다 / manifest의 baseline과 legacy upgrade 목적에 어긋난다 / 재현: `tenants`는 있지만 `studio_generation_idempotency`가 없는 DB에서 `apply-legacy`를 실행하면 phase 분기 전에 59행 `regclass`가 실패한다. `bootstrap`은 440행에서 비어 있지 않은 DB를 거절하고 baseline SQL은 실행되지 않는다 / 수정 방향: 구형 schema fingerprint를 먼저 식별하고 baseline SQL을 적용하는 별도 legacy-install phase가 필요하다.

MAJOR: [회귀 위험, 부분 배포] `dashboard/db/run-migrations.sh:433` - 앱 배포 preflight는 generation과 quota fingerprint만 확인하고 같은 릴리스가 쓰는 engagement, incident, shorts factory relation과 migration ledger를 확인하지 않는다 / `.github/workflows/deploy-marketing.yml:74`의 `OSMU DB 스키마 read-only preflight` 계약과 어긋난다 / 재현: generation과 quota 제약만 있고 `engagement_items` 또는 `operational_incidents`가 없는 DB도 preflight를 통과해 해당 화면과 기록 API에서 500이 난다 / 수정 방향: 릴리스 manifest ID와 checksum, 필수 relation, FK를 모두 대조하고 새 런타임 표면을 읽기 전용 smoke해야 한다.

MAJOR: [테스트 공백, 부분 실패를 전체 성공으로 계산] `dashboard/scripts/verify-api-read-sweep.mjs:98` - 모든 HTTP 503을 `의도된 거절 후보`로 분류하고 실패 목록에서 제외한다 / 전체 서버 장애를 성공으로 세지 않는 완료 증거 계약과 어긋난다 / 재현: 전체 GET route가 DB 장애로 503을 반환해도 `failed=[]`와 종료 코드 0이 가능하다 / 수정 방향: 경로별 허용 상태와 오류 code를 명시하고 503은 기본 실패로 처리해야 한다.

MAJOR: [테스트 공백, 거짓 양성] `dashboard/scripts/verify-basic-flow-e2e.mjs:68` - 생성 큐 인계의 출처 계보가 없어도 HTTP 200만으로 통과한다 / 스크립트가 선언한 `성과 제안이 다시 생성 큐로 이어지는 한 줄`과 canonical record 계약에 어긋난다 / 재현: 응답에서 `sourceContext.suggestionId`를 제거해도 로그만 `출처 보존 안 됨`으로 바뀌고 종료 코드는 0이다 / 수정 방향: 출처 ID 존재와 원래 suggestion ID 일치를 성공 조건에 넣어야 한다.

MAJOR: [테스트 격리, 데이터 오염] `dashboard/scripts/verify-basic-flow-e2e.mjs:25` - 지정 작업 공간에 생성 작업, 초안, 발행 큐, 제안 큐를 만들고 정리하지 않는다 / 테스트 데이터는 실행 단위로 격리하고 정리해야 한다는 계약과 어긋난다 / 재현: 이번 필수 실행만으로 지정 작업 공간에 초안 `85a9be49-5d81-439f-8acc-d17208056e53`와 관련 큐가 남았다 / 수정 방향: 실행마다 테스트 tenant를 만들고 `finally`에서 삭제하거나 rollback 가능한 격리 DB를 써야 한다.

MAJOR: [끝나지 않는 검증 명령] `dashboard/scripts/verify-basic-flow-e2e.mjs:25` - 필수 E2E의 모든 fetch에 요청 제한 시간과 전체 deadline이 없다 / 무인 워커 명령은 반드시 끝나야 한다는 작업 규율과 어긋난다 / 재현: localhost가 TCP 연결 뒤 응답 body를 끝내지 않으면 첫 생성 요청에서 영구 대기한다 / 수정 방향: 공통 bounded fetch와 전체 스크립트 deadline을 적용해야 한다.

MAJOR: [돈, 테스트 격리] `dashboard/scripts/verify-studio-v1-e2e.mjs:65` - 필수 E2E가 지정 회원의 실제 무료 재생성 몫을 쓰고 generation과 quota 장부를 정리하지 않는다 / 사업 좌표의 무료에서 유료로 넘어가는 경계와 테스트 격리 계약에 어긋난다 / 재현: 몫이 남은 날 이 스크립트를 한 번 실행하면 이후 실제 사용자가 같은 UTC 날짜에 무료 재생성을 받을 수 없다. 이번 실행도 생성 작업 2건을 남겼다 / 수정 방향: 비용 없는 전용 member와 tenant를 만들고 job, idempotency, quota 장부를 `finally`에서 정리해야 한다.

MAJOR: [테스트 공백, 거짓 양성] `dashboard/scripts/verify-studio-v1-e2e.mjs:79` - 첫 재생성이 409이면 두 번째 호출의 실제 상태를 버리고 기대값 409를 실제값으로 넣는다 / 회원 하루 1회 무료 몫 계약의 실측과 어긋난다 / 재현: 실제 상태가 `[409,201]`이어도 79행은 기대 409와 실제 409를 비교해 통과한다 / 수정 방향: 첫 호출이 409이면 두 번째 실제 `retryOtherZone.status`도 409인지 검사해야 한다.

MAJOR: [동시성, 공유 상태 경합] `dashboard/scripts/verify-four-room-ui-e2e.mjs:120` - 공용 `settings.json`을 잠금 없이 덮어쓰고 마지막에 시작 시점 스냅샷으로 복원한다 / 작업 공간 설정 격리와 병렬 테스트 안전 계약에 어긋난다 / 재현: 실행 A와 B가 겹치면 B가 A의 임시 false 상태를 원본으로 읽고, A가 정상 복원한 뒤 B가 false를 다시 써 운영 설정을 훼손한다 / 수정 방향: 파일 lock, 테스트 전용 workspace, compare-and-swap 중 하나를 적용해야 한다.

MAJOR: [부분 실패를 전체 성공으로 계산] `dashboard/scripts/verify-four-room-ui-e2e.mjs:156` - 임시 고객 토큰 폐기 실패를 로그만 남기고 162행에서 무조건 성공 종료한다 / 완료는 정리까지 직접 관찰해야 한다는 계약과 어긋난다 / 재현: DELETE가 500을 반환해 토큰이 살아 있어도 스크립트 종료 코드는 0이다 / 수정 방향: revoke 실패를 테스트 실패로 누적하고 비제로 종료해야 한다.

MAJOR: [승인 시안 이탈, 부품 누락] `dashboard/src/components/studio/StudioRooms.tsx:344` - 영상 편집실이 실제 장면과 플레이어 대신 대사 한 줄을 넣은 색면과 `실제 영상 렌더는 준비 중입니다`만 표시한다 / v63 10574행부터 10585행의 `실제 장면`, 재생, 진행, 시간, CC, 설정, 전체 화면 부품과 어긋난다 / 재현: 영상 후보를 편집실로 넘기면 장면과 재생 제어가 없는 구조 초안 상자만 보인다 / 수정 방향: 승인된 실제 장면과 재생 제어 부품 및 렌더 전 상태를 구현해야 한다.

MAJOR: [회귀 위험, false-ready] `dashboard/src/lib/performance-metrics-coverage.ts:32` - tenant의 Threads 연결 여부와 무관하게 `collectionSupported=true`를 고정한다 / PRD AC-004의 `false-ready0`과 성과실이 결측 이유를 정직하게 알려야 한다는 계약에 어긋난다 / 재현: 지정 작업 공간의 연결 채널은 0개인데 GET은 지원 true를 반환했고, 같은 작업 공간의 실제 POST는 `threads 채널 미연결` 400을 반환했다 / 수정 방향: 구현 가능성과 현재 workspace 수집 준비를 분리하고 `connected`, `ready`, 재연결 사유를 응답에 포함해야 한다.

## MINOR

MINOR: [회귀 위험, 배포 장부] `dashboard/db/rollback-migration.sh:53` - rollback 성공 뒤 `osmu_schema_migrations` 상태나 immutable rollback event를 기록하지 않는다 / schema 상태 정본과 실제 DB가 어긋난다 / 재현: contract 적용 뒤 rollback을 성공해도 장부는 계속 `applied`로 남는다 / 수정 방향: rollback 결과를 같은 transaction의 별도 event 또는 `rolled_back` 상태로 원자 기록해야 한다.

MINOR: [확정 요구 이탈] `dashboard/scripts/verify-basic-flow-e2e.mjs:2` - 새 주석에 긴 대시 문자를 넣었다 / 회장 확정 요구 `긴 대시 금지`와 어긋난다 / 재현: 24시간 추가 줄에서 해당 문자를 검색하면 이 줄이 검출된다 / 수정 방향: 마침표, 콜론, 괄호로 문장을 나눠야 한다.

MINOR: [확정 요구 이탈] `dashboard/scripts/verify-free-quota-timezone-attack.mjs:2` - 새 주석에 긴 대시 문자를 넣었다 / 회장 확정 요구 `긴 대시 금지`와 어긋난다 / 재현: 24시간 추가 줄에서 해당 문자를 검색하면 이 줄이 검출된다 / 수정 방향: 마침표, 콜론, 괄호로 문장을 나눠야 한다.

MINOR: [확정 요구 이탈] `scripts/osmu-supervisor-guard.sh:2` - 새 주석에 긴 대시 문자를 넣었다 / 회장 확정 요구 `긴 대시 금지`와 어긋난다 / 재현: 24시간 추가 줄에서 해당 문자를 검색하면 이 줄이 검출된다 / 수정 방향: 마침표, 콜론, 괄호로 문장을 나눠야 한다.

MINOR: [확정 요구 이탈] `scripts/refill-backlog.sh:2` - 새 주석에 긴 대시 문자를 넣었다 / 회장 확정 요구 `긴 대시 금지`와 어긋난다 / 재현: 24시간 추가 줄에서 해당 문자를 검색하면 이 줄이 검출된다 / 수정 방향: 마침표, 콜론, 괄호로 문장을 나눠야 한다.

## 확인한 정상 경계

- 24시간 diff의 삭제 파일은 wiki 구 namespace index 7개와 generation migration 1개다. wiki 삭제는 `ad056aac`의 namespace 재배치, migration 삭제는 `9b72c05b`의 expand and contract 전환으로 커밋 메시지와 대체 파일이 확인됐다. 무기록 삭제는 찾지 못했다.
- 24시간 추가 UI 코드에서 새 hex 색상, inline style, 임의 px 토큰은 찾지 못했다.
- 24시간 추가 사용자 UI에서 새 이모지와 영문 단추 라벨은 찾지 못했다. 긴 대시는 위 주석 4건에서 확인했다.
- 전체 Vitest, TypeScript, 필수 기본 흐름과 Studio E2E는 통과했다. 위 거짓 양성 조건, 외부 성공 뒤 부분 실패, 프로세스 중단, 공유 파일 경합은 검증하지 않는다.
- 2026-08-29 08:01의 DB workflow 수정은 현재 HEAD에서 실행된 CI가 없어 운영 runner 성공 여부는 미검증이다.

## 셀프심문

질문: 내가 PASS를 준다면, 회장이 dev에서 직접 써보고 발견할 가장 그럴듯한 문제는 무엇인가?

답: 영상 후보를 편집실로 넘겼는데 실제 장면과 재생기가 없는 문제, Threads 연결이 없는데 성과실은 수집 지원으로 표시하는 문제, 본문 발행 뒤 첫 댓글 실패가 새로고침 후 전체 성공으로 바뀌는 문제다. 모두 MAJOR로 확인했으므로 PASS는 성립하지 않는다.

SKILLS_USED: review. 커밋 범위 고정, diff 공격 검토, 기반 산출물 대조, 필수 검증, 완료 증거 분리에 사용했다.

SKILLS_SKIPPED: review 스킬의 자동 수정 단계는 코드 수정 금지와 충돌해 사용하지 않았다. QA 수정 스킬도 같은 이유로 사용하지 않았다.

SOURCES: `pipeline-state.osmu.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | https://docs.github.com/en/actions/concepts/security/script-injections | https://docs.docker.com/engine/storage/bind-mounts/ | https://www.postgresql.org/docs/current/tutorial-agg.html

MODEL: gpt-codex/gpt-5.6-sol

## 4축 판정

- 승인 시안 이탈: 지적 5건. MAJOR 18, MINOR 2부터 5.
- 회귀 위험: 지적 18건. MAJOR 1부터 17, MAJOR 19.
- 토큰 위반: 문제없음. 추가 UI 코드의 hex, inline style, 임의 px를 대조했다.
- 무기록 삭제: 문제없음. 삭제 8개 모두 재배치 또는 migration 전환 사유와 대체 파일이 확인됐다.

REVIEW_VERDICT: BLOCK
