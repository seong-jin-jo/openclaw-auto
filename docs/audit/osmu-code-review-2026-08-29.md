# OSMU 코드 리뷰 2026-08-29

STAMP | line: osmu | 생성: 2026-08-29 15:20 KST | model: gpt-codex/gpt-5.6-sol | agent: code-reviewer | skill: review | 고민: 정상 경로의 통과가 외부 부작용, 작업 공간 격리, 부분 실패의 안전까지 증명하는지 분리해 판정했다.

검토 범위: 리뷰 시작 시 고정한 `6a618c59404fb2c30291fba77df92783eff3076a..6eaf3a4577d551cb2387d32c948a061c447c712f`. 2026-08-28 03:55 KST부터 2026-08-29 03:52 KST까지의 커밋이며, 657개 파일, 추가 29,600줄, 삭제 9,316줄이다. 리뷰 중 다른 세션이 만든 후속 커밋은 범위 밖이다. 소스 코드는 수정하지 않았다.

기반 산출물:

- 확정 프로토타입: `docs/prototype/openclaw-auto-4room-v63.html`
- 회장 확정 요구: `docs/requests/회장-확정-요구사항-대장.md`
- 사업 좌표: `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`
- 디자인 정본: `DESIGN.md`
- 승인 산출물 핀: `pipeline-state.osmu.md`

직접 관찰 증거:

- `http://localhost:3456/api/health`: HTTP 200, DB `up`
- `dashboard/scripts/verify-basic-flow-e2e.mjs`: 지정 작업 공간에서 11/11 통과
- `dashboard/scripts/verify-studio-v1-e2e.mjs`: 지정 작업 공간에서 12/12 통과
- `dashboard/scripts/verify-tenant-isolation-e2e.mjs`: 스크립트 자체 183/183 통과, 임시 테넌트 정리 관찰
- `npm run test`: 194파일, 1,403건 통과, 1건 건너뜀
- `npx tsc --noEmit`: 종료 코드 0

정상 경로 통과는 아래의 공급자 성공 뒤 DB 실패, 프로세스 중단, 병렬 배포, 51번째 댓글, 실데이터 정리 실패를 재현하지 않는다. 일부 필수 E2E는 통과 조건 자체가 약하거나 지정 작업 공간을 오염시키므로 통과 수치만으로 머지를 허용할 수 없다.

## MAJOR

MAJOR: [회귀 위험·시크릿 노출] `dashboard/src/lib/setup-guides.ts:214` - Discord 웹 콘솔에서 사용자 Authorization 토큰을 평문 출력해 앱에 입력하도록 안내한다 / PRD NFR-OS81-01의 `DOM·URL·log·analytics·export raw secret0` 및 Discord의 일반 사용자 계정 자동화 금지와 어긋난다 / 재현: 연결 안내 코드를 Discord 콘솔에 붙여 채널을 클릭하면 계정 전체 권한 토큰이 콘솔에 노출된다 / 수정 방향: 사용자 토큰 수집과 self-bot 방식을 제거하고 공식 OAuth2 또는 bot 계정 방식이 준비될 때까지 연결을 닫아야 한다.

MAJOR: [회귀 위험·시크릿 노출] `dashboard/src/lib/engagement-provider.ts:65` - Threads 토큰을 GET URL query에 넣으며 81행 Instagram, 97행 Facebook도 같다 / PRD NFR-OS81-01의 URL 원문 시크릿 0과 어긋난다 / 재현: 댓글 조회 중 outbound URL을 APM이나 프록시에서 관찰하면 `access_token` 원문이 남는다 / 수정 방향: 지원 채널은 Authorization 헤더로 옮기고, query가 불가피하면 중앙 전송 계층에서 URL 기록을 완전히 차단해야 한다.

MAJOR: [회귀 위험·테넌트 격리·동시성] `dashboard/src/lib/engagement-store.ts:46` - DB 트랜잭션과 advisory lock을 잡은 채 58행의 외부 좋아요 API를 기다린다 / PRD NFR-OS81-04의 concurrent20 안전과 작업 공간 간 자원 격리에 어긋난다 / 재현: 같은 댓글 좋아요 5건을 동시에 보내면 전역 DB 풀 5개가 외부 호출과 lock 대기에 묶여 다른 작업 공간의 DB 요청까지 멈춘다 / 수정 방향: 짧은 트랜잭션으로 claim만 기록하고 외부 호출과 결과 저장을 분리하며 작업 공간별 동시성 한도를 둬야 한다.

MAJOR: [회귀 위험·동시성·멱등] `dashboard/src/app/api/publish/route.ts:188` - UUID 초안만 중복 방지 예약을 거치고 `draft_id` 누락 또는 legacy ID는 바로 외부 발행한다 / PRD의 정확히 한 번 발행과 `intent별 외부 side effect≤1`에 어긋난다 / 재현: 같은 본문과 계정으로 `draft_id` 없이 동시 POST 두 건을 보내면 둘 다 공급자 호출에 도달한다. legacy ID는 게시 뒤 UUID 기록도 실패해 재시도마다 다시 게시한다 / 수정 방향: 모든 발행에 필수 idempotency key를 요구하고 하나의 DB reservation 경로로 통과시켜야 한다.

MAJOR: [회귀 위험·동시성·복구] `dashboard/src/app/api/publish/route.ts:209` - `in_progress` 예약에 lease, heartbeat, stale 판정, 공급자 조회 키가 없다 / v63의 `외부 결과를 확인 중`, `중복 게시를 막고 같은 요청의 외부 결과만 확인합니다`와 어긋난다 / 재현: reservation INSERT 직후 프로세스를 종료하면 같은 초안은 시간 경과와 무관하게 294행 `PUBLISH_ALREADY_IN_PROGRESS` 409만 반환한다 / 수정 방향: 시도 ID, lease, 공급자 correlation을 저장하고 만료 시 외부 결과를 먼저 reconcile해야 한다.

MAJOR: [회귀 위험·상태 계약] `dashboard/src/app/api/publish/route.ts:58` - 발행 상태 조회가 `account_id`를 조회하지 않고 플랫폼별 최신 행 하나만 고른다 / PRD의 wrong-account 0과 POST의 선택 계정 계약에 어긋난다 / 재현: 같은 초안을 Instagram 계정 A에는 성공, B에는 실패로 발행하면 GET 상태는 최신 한 행만 남겨 전체 성공 또는 전체 실패로 오판한다 / 수정 방향: 조회 키와 응답에 accountId를 포함해 계정별 상태를 따로 보존해야 한다.

MAJOR: [회귀 위험·부분 실패를 전체 성공으로 계산] `dashboard/src/app/api/publish/route.ts:371` - 본문 성공과 첫 댓글 실패도 DB에는 `status='published'`, `error=NULL`로 저장한다 / v63의 일부 실패는 복구 필요, 재발행 금지 상태와 PRD false-published 0에 어긋난다 / 재현: 본문 공급자는 성공시키고 첫 댓글만 500으로 만들면 최초 응답은 partial이지만 새로고침 뒤 GET은 published로 종결한다 / 수정 방향: 본문과 첫 댓글을 독립 상태로 영속화하고 첫 댓글만 멱등 복구해야 한다.

MAJOR: [회귀 위험·부분 실패·lease] `dashboard/src/app/api/schedule/publish-due/route.ts:123` - due 스케줄을 일괄 `processing`으로 claim한 뒤 한 플랫폼 기록 실패가 현재 항목과 아직 처리하지 않은 claim 전체를 멈춘다 / v63의 복구 필요, 재발행 금지와 PRD AC-016에 어긋난다 / 재현: 스케줄 10건을 claim하고 첫 공급자 게시 뒤 `recordPublishedPost`를 실패시키면 10건 모두 `processing`에 남고 다음 스캔은 `scheduled`만 읽는다 / 수정 방향: 스케줄 및 플랫폼 시도별 lease와 reservation을 두고 항목별로 마감해야 한다.

MAJOR: [회귀 위험·부분 실패·멱등] `dashboard/src/lib/engagement-service.ts:141` - 공급자 답글 성공 뒤 DB 완료 기록 실패를 결과 불명 상태로 봉인하지 않는다 / PRD NFR-OS81-04의 외부 부작용 1회 이하에 어긋난다 / 재현: 공급자가 공개 답글 ID를 반환한 뒤 DB UPDATE만 실패시키면 15분 stale 회수 뒤 같은 답글이 다시 게시된다 / 수정 방향: 외부 성공 receipt를 복구 장부에 남기고 provider reconciliation 전에는 재전송하지 않아야 한다.

MAJOR: [회귀 위험·복구 단절] `dashboard/src/lib/engagement-store.ts:111` - 공급자 timeout을 `reply_external_id='status-unknown'`으로 고정하지만 조회, 확정, 해제 경로가 없다 / PRD의 uncertain 상태 terminalization과 repair time 계약에 어긋난다 / 재현: 공급자가 답글을 만들고 응답만 끊기면 이후 모든 재시도가 영구 `REPLY_ALREADY_CLAIMED`가 되고 실제 답글 존재 여부를 확인할 수 없다 / 수정 방향: 공급자 조회 기반 reconcile과 운영자 확인 또는 해제 경로를 추가해야 한다.

MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/app/api/engagement/route.ts:26` - 공급자의 `nextCursor`를 요청으로 받지 않아 첫 50건 이후 댓글을 조회할 수 없고 mutation도 첫 페이지만 찾는다 / 요구 대장 R185와 v63 13810행의 댓글 스트림 계약에 어긋난다 / 재현: 게시물에 댓글 51개를 만든 뒤 마지막 댓글에 답글을 보내면 목록에 없고 직접 ID를 보내도 404다 / 수정 방향: cursor 입력, 응답, UI 추가 로드를 연결하고 mutation은 단건 조회 또는 안전한 페이지 탐색을 사용해야 한다.

MAJOR: [회귀 위험·공급자 계약] `dashboard/src/lib/engagement-provider.ts:124` - YouTube 중첩 답글을 최상위 댓글과 같은 항목으로 펼친 뒤 180행에서 그 ID를 parentId로 다시 사용한다 / YouTube 답글 API의 최상위 parent 계약과 어긋난다 / 재현: 기존 중첩 답글에서 답글 보내기를 누르면 중첩 ID가 parent로 전달돼 공급자 오류가 난다 / 수정 방향: 최상위 댓글 ID와 중첩 답글 ID를 분리하고 전체 답글은 전용 목록 API로 보충해야 한다.

MAJOR: [회귀 위험·인증 실패 계약] `dashboard/src/app/api/engagement/route.ts:18` - 공급자가 분류한 토큰 만료, 권한 부족, 429 오류를 모두 HTTP 500 `ENGAGEMENT_FAILED`로 덮는다 / PRD D-08의 영향 화면 재연결 카드와 어긋난다 / 재현: Threads 토큰 만료 뒤 성과실 댓글을 열면 재연결 사유 없이 일반 500과 재시도 문구만 보인다 / 수정 방향: provider 오류를 안정적인 status, code, retryable, reconnect 계약으로 올려 UI가 복구 동작을 보여야 한다.

MAJOR: [회귀 위험·부분 실패·돈] `dashboard/src/lib/studio/shorts-factory/service.ts:87` - Studio 작업 생성 성공과 `markConceptSucceeded`를 같은 try로 묶어 기록 실패도 생성 실패로 바꾼다 / 사업 좌표의 몫과 멱등 계약에 어긋난다 / 재현: 실제 jobId 반환 뒤 성공 UPDATE만 실패시키면 컨셉은 failed가 되고 새 factory run은 같은 개념을 다시 생성한다 / 수정 방향: 실행 실패와 성공 기록 실패를 분리하고 jobId를 가진 복구 상태에서 기록만 재시도해야 한다.

MAJOR: [회귀 위험·동시성] `dashboard/src/lib/studio/shorts-factory/repository.ts:253` - `markConceptRunning`의 조건부 UPDATE가 0행이어도 서비스는 생성을 계속한다 / PRD retry20, concurrent20 안전과 어긋난다 / 재현: worker가 읽은 직후 운영자가 run을 failed 처리하면 claim은 0행이지만 숨은 generation job이 새로 만들어진다 / 수정 방향: lease token과 `RETURNING`으로 실제 claim 성공을 확인한 worker만 실행하게 해야 한다.

MAJOR: [돈·응답 진실성] `dashboard/src/lib/studio/generation/service.ts:307` - 무료 재생성 몫은 UTC 날짜로 차감하면서 응답은 원본 시간대의 다음 자정에 복구된다고 알린다 / 요구 대장 R27과 사업 좌표의 무료에서 유료로 넘어가는 경계에 어긋난다 / 재현: 서울 23:30에 무료 몫을 쓰면 API는 00:00 복구를 약속하지만 실제 장부는 09:00까지 유료 승인 409를 반환한다 / 수정 방향: quota key와 reset 응답을 같은 시간대 경계로 통일해야 한다.

MAJOR: [회귀 위험·부분 성공] `dashboard/src/app/api/studio/v1/generations/route.ts:20` - 독립 generation 한 건 성공이 같은 작업 공간의 모든 `generation_failed:studio` incident를 recovered로 닫는다 / PRD false-ready 0과 실패 작업별 상태 분리에 어긋난다 / 재현: job A가 계속 실패하는 동안 job B 하나를 성공시키면 A의 열린 incident도 닫힌다 / 수정 방향: job 또는 intent별 resource key를 incident와 recovery에 포함해야 한다.

MAJOR: [회귀 위험·운영 인증] `dashboard/src/app/api/studio/v1/shorts-factory/runs/route.ts:8` - 숏폼 공장 API가 고객 JWT를 지원하는 principal 대신 개발 전용 principal만 사용한다 / 사업 좌표의 여덟 컨셉 숏폼 동시 실행과 어긋난다 / 재현: production에서 유효 고객 bearer로 POST하면 본문 처리 전 `IDENTITY_ADAPTER_NOT_CONFIGURED` 503이다 / 수정 방향: 고객 principal과 작업 공간 접근 계약을 사용하고 개발 bearer는 비운영 fallback으로 제한해야 한다.

MAJOR: [부분 실패를 전체 성공으로 계산] `dashboard/db/run-migrations.sh:413` - 일반 phase SQL 오류 뒤에도 psql이 다음 명령을 실행해 migration 장부를 `applied`로 바꿀 수 있다 / PostgreSQL의 기본 비대화식 오류 계속 처리 동작과 완료 증거 계약에 어긋난다 / 재현: migration SQL에 constraint 오류를 만들면 트랜잭션은 실패해도 뒤 장부 UPDATE가 성공하고 프로세스가 0으로 끝날 수 있다 / 수정 방향: `ON_ERROR_STOP`을 강제하고 schema 적용과 장부 전환을 하나의 실패 경계로 묶어야 한다.

MAJOR: [회귀 위험·레거시 업그레이드] `dashboard/db/run-migrations.sh:55` - Studio generation 테이블이 없는 기존 운영 DB는 어떤 승인 phase로도 업그레이드할 수 없다 / migration manifest의 baseline과 legacy upgrade 목적에 어긋난다 / 재현: 기존 테이블은 있으나 `studio_generation_idempotency`가 없는 DB에서 baseline은 `regclass`에서 실패하고 adopt는 SQL을 실행하지 않으며 bootstrap은 비어 있지 않은 DB를 거절한다 / 수정 방향: 구형 schema fingerprint를 확인한 뒤 baseline SQL을 적용하는 별도 legacy-install phase가 필요하다.

MAJOR: [회귀 위험·부분 배포] `dashboard/db/run-migrations.sh:433` - 앱 배포 preflight가 새 릴리스의 전체 migration과 relation을 확인하지 않는다 / 배포 전 OSMU DB schema read-only preflight 계약에 어긋난다 / 재현: Studio 일부 제약만 있고 engagement, incident, shorts factory 테이블이 없는 DB도 preflight와 단일 smoke를 통과해 실제 화면에서 500이 난다 / 수정 방향: 릴리스 manifest ID, checksum, 필수 relation, FK를 모두 대조하고 신규 런타임 표면을 smoke해야 한다.

MAJOR: [회귀 위험·롤백] `.github/workflows/deploy-marketing.yml:101` - 빈 `services`는 전체 배포로 OSMU를 포함하지만 이전 OSMU 컨테이너 보존 조건에서는 제외된다 / workflow 6행의 `비우면 전체` 계약과 어긋난다 / 재현: 기본 입력으로 배포하다 compose up이 실패하면 `previous`가 없어 OSMU 롤백이 실행되지 않는다 / 수정 방향: 입력을 allowlist 배열로 정규화하고 빈 값도 OSMU 포함으로 판정해 이전 digest를 보존해야 한다.

MAJOR: [회귀 위험·부분 배포] `.github/workflows/deploy-marketing.yml:107` - 새 컨테이너 기동 뒤 smoke 실패에는 롤백 경로가 없다 / workflow의 깨지면 배포 FAIL과 실제 서비스 복구 계약에 어긋난다 / 재현: compose up은 0이지만 `/login` 또는 고객 API가 500이면 workflow만 실패하고 고장 난 새 컨테이너가 계속 서비스한다 / 수정 방향: 기동과 smoke를 하나의 guarded deploy transaction으로 묶고 실패 finalizer에서 이전 컨테이너 복원과 복원 smoke를 해야 한다.

MAJOR: [회귀 위험·명령 주입] `.github/workflows/deploy-marketing.yml:94` - 자유 입력 `services`를 privileged self-hosted runner의 inline shell에 직접 보간한다 / GitHub Actions 공식 script injection 지침과 어긋난다 / 재현: workflow 실행 권한자가 quote 또는 shell separator가 든 값을 입력하면 치환된 문자열이 runner 명령으로 해석된다 / 수정 방향: 입력을 env로 전달하고 정확한 서비스 allowlist와 bash 배열로 파싱해야 한다.

MAJOR: [회귀 위험·데이터 보존] `dashboard/db/schema.sql:134` - 전체 계정 삭제 뒤에도 회원 식별자 `member_id`가 무료 몫 장부에 기한 없이 남는다 / 데이터 삭제 화면의 계정 및 데이터 삭제 약속과 어긋난다 / 재현: 무료 재생성 사용 뒤 전체 계정을 삭제해도 tenant_id만 NULL이 되고 member_id와 날짜 row는 남는다 / 수정 방향: 전체 계정 삭제에서는 row를 삭제 또는 비가역 익명화하고 법정 보존이면 기간과 자동 cleanup을 계약에 명시해야 한다.

MAJOR: [부분 실패를 전체 성공으로 계산] `dashboard/scripts/verify-api-read-sweep.mjs:96` - 모든 HTTP 503을 의도된 거절 후보로 분류해 실패 목록에서 제외한다 / 전체 서버 장애를 통과로 세지 말아야 하는 검증 계약과 어긋난다 / 재현: 98개 GET이 모두 503이어도 `failed=[]`, 종료 코드 0이다 / 수정 방향: 경로별 허용 상태를 명시하고 503은 기본 실패로 처리해야 한다.

MAJOR: [테스트 공백·거짓 양성] `dashboard/scripts/verify-basic-flow-e2e.mjs:68` - 생성 큐 인계의 출처 계보가 없어도 HTTP 200만으로 통과한다 / 스크립트가 선언한 성과 제안에서 생성 큐까지 출처 보존 계약과 어긋난다 / 재현: 응답에 `sourceContext.suggestionId`가 없어 로그가 `출처 보존 안 됨`이어도 최종 종료 코드는 0이다 / 수정 방향: 출처 ID 존재와 일치를 성공 조건에 포함해야 한다.

MAJOR: [테스트 공백·거짓 양성] `dashboard/scripts/verify-studio-v1-e2e.mjs:79` - 첫 재생성이 409이면 두 번째 호출의 실제 상태를 버리고 기대값 409를 실제값으로 넣는다 / 회원 하루 1회 무료 몫 계약과 어긋난다 / 재현: 상태가 `[409,201]`이어도 최대 1회와 반대 시간대 거절 검사가 모두 통과한다 / 수정 방향: 첫 호출이 409이면 두 번째 실제 status도 409인지 검사해야 한다.

MAJOR: [테스트 격리·데이터 오염] `dashboard/scripts/verify-basic-flow-e2e.mjs:25` - 지정 작업 공간에 생성 작업, 초안, 발행 큐, 제안 큐를 만들고 정리하지 않는다 / Playwright의 테스트별 데이터 격리 원칙과 어긋난다 / 재현: 정본 작업 공간에서 고정 제목 `기본 흐름 검증` 초안 24건과 queue 29건이 누적된 상태를 조회했다 / 수정 방향: 실행마다 테스트 tenant를 만들고 finally에서 삭제하거나 트랜잭션 rollback으로 격리해야 한다.

MAJOR: [돈·테스트 격리] `dashboard/scripts/verify-studio-v1-e2e.mjs:65` - 검증이 지정 작업 공간의 실제 무료 재생성 몫을 소비하고 generation 장부를 영구 누적한다 / 사업 좌표의 무료에서 유료로 넘어가는 경계와 Playwright 데이터 격리 원칙에 어긋난다 / 재현: 지정 작업 공간에서 generation job 227건과 무료 몫 장부 1건, 고정 주제 기본 66건과 교차 시간대 20건을 관찰했다 / 수정 방향: 비용 없는 전용 member와 tenant를 만들고 job, idempotency, quota 장부를 finally에서 정리해야 한다.

MAJOR: [동시성·공유 상태 경합] `dashboard/scripts/verify-four-room-ui-e2e.mjs:120` - 공용 `settings.json`을 잠금 없이 덮어쓰고 마지막에 스냅샷으로 복원한다 / 병렬 테스트는 공유 backend 상태를 분리해야 한다는 Playwright 공식 기준과 어긋난다 / 재현: A와 B가 겹치면 B가 읽은 임시 false 값을 A의 정상 복원 뒤 다시 써 운영 설정을 false로 남긴다 / 수정 방향: 파일 lock, 테스트 전용 workspace, compare-and-swap 중 하나를 적용해야 한다.

MAJOR: [부분 실패를 전체 성공으로 계산] `dashboard/scripts/verify-four-room-ui-e2e.mjs:156` - 임시 고객 토큰 폐기 실패를 로그만 남기고 162행에서 무조건 성공 종료한다 / 완료는 정리까지 직접 관찰해야 한다는 계약과 어긋난다 / 재현: DELETE가 500을 반환해 토큰이 살아 있어도 스크립트 종료 코드는 0이다 / 수정 방향: revoke 실패를 테스트 실패로 누적하고 비제로 종료해야 한다.

MAJOR: [끝나지 않는 검증 명령] `dashboard/scripts/verify-basic-flow-e2e.mjs:25` - 필수 E2E의 모든 fetch에 제한 시간이 없다 / 무인 워커 명령은 반드시 끝나야 한다는 작업 규율과 어긋난다 / 재현: localhost가 TCP 연결 뒤 응답 body를 끝내지 않으면 첫 생성 요청에서 영구 대기한다 / 수정 방향: 공통 bounded fetch와 전체 스크립트 deadline을 적용해야 한다.

MAJOR: [승인 시안 이탈·첫 흐름 차단] `dashboard/src/components/studio/StudioRooms.tsx:72` - 온보딩은 업종과 갈래만 받은 뒤 생성실로 보내지만 생성실은 주제, 목적, 대상, 소재 권리를 다시 필수로 요구한다 / 사업 좌표의 첫 콘텐츠 전에는 업종과 갈래만 선택하고 첫 후보 생성을 막지 않는다는 계약 및 R89와 어긋난다 / 재현: 신규 계정에서 업종과 영상만 고른 뒤 후보 만들기를 누르면 네 필수값 오류로 후보가 나오지 않는다 / 수정 방향: 두 선택만으로 생성 요청 기본값을 구성하거나 추가 질문을 상류 요구로 다시 승인받아야 한다.

MAJOR: [승인 시안 이탈·부품 누락] `dashboard/src/components/studio/StudioRooms.tsx:344` - 영상 편집실이 실제 장면과 플레이어 대신 대사 한 줄과 `실제 영상 렌더는 준비 중입니다`만 표시한다 / v63 10571행부터 10585행의 실제 장면, 재생, 진행, 시간, CC, 설정, 전체화면 부품과 어긋난다 / 재현: 영상 후보를 편집실로 넘기면 장면과 재생 제어가 없는 구조 초안 박스만 보인다 / 수정 방향: 확정된 실제 장면과 재생 제어 부품 및 렌더 전 상태를 구현해야 한다.

MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/components/home/PerformanceRoom.tsx:504` - 성과 요약 뒤 배운 규칙 후보의 근거, 표본, 승낙, 거절 UI가 없다 / DESIGN.md의 `성과 요약 다음`, `승낙과 거절이 같은 무게`와 요구 대장 R98의 적용은 승낙 뒤라는 계약에 어긋난다 / 재현: 충분한 성과 표본이 있어도 규칙 후보와 `그렇게 해`, `아니`가 없고 다음 생성의 accepted_rules를 채울 수 없다 / 수정 방향: 문턱을 통과한 규칙 후보와 동등한 수락, 거절을 제공해 다음 생성에 연결해야 한다.

MAJOR: [승인 시안 이탈·부품 누락] `dashboard/src/app/page.tsx:60` - 성과실만 오른쪽 담당 대화창 또는 접힌 launcher 없이 PerformanceRoom 단독으로 렌더한다 / v63의 네 방 공통 chatDock과 DESIGN.md의 어느 방이든 같은 오른쪽 열 계약에 어긋난다 / 재현: 1440폭 성과실을 열면 생성, 편집, 발행실과 달리 담당 대화창이 없다 / 수정 방향: 성과실도 공통 담당 셸 안에서 렌더하고 판정, 규칙 승낙, 다음 생성 연결을 맡겨야 한다.

MAJOR: [승인 시안 이탈·상태 누락] `dashboard/src/components/studio/StudioRooms.tsx:30` - 생성실과 편집실 담당은 고정 aside뿐이며 펼침 상태, 접기 단추, 접힌 launcher가 없다 / v63 12673행부터 12704행의 기본 펼침, 접기, 본문 폭 회복 상태와 요구 대장 R81에 어긋난다 / 재현: 1024 또는 1440폭에서 담당 열을 접어 작업 화면을 넓힐 수 없다 / 수정 방향: 공통 AssistantPanel에 데스크톱 접기와 접힌 launcher 상태를 구현해야 한다.

MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/queue/ImagePickerModal.tsx:99` - 핵심 생성 단추가 `Generate`, 진행 상태가 `Generating...`으로 남아 있다 / 확정 요구인 영문 단추 라벨 금지와 어긋난다 / 재현: Queue 이미지 선택 모달에서 주 행동이 영어로 보인다 / 수정 방향: 주 행동과 진행 상태 및 같은 모달의 영문 탭과 빈 상태를 한국어로 통일해야 한다.

MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/settings/LlmModel.tsx:86` - 저장 단추 상태가 `Saving...`, `Update`, `Save`로 남아 있다 / 확정 요구인 영문 단추 라벨 금지와 어긋난다 / 재현: 모델 설정을 편집하고 저장하면 단추 전 상태가 영어로 표시된다 / 수정 방향: 저장 중, 수정, 저장처럼 한국어 행동명으로 통일해야 한다.

MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/studio/RepoConnect.tsx:134` - 제목, 탭, 주 행동에 책, 문서, 회전 화살표 이모지를 직접 넣었다 / 확정 요구인 이모지 금지와 DESIGN.md의 장식 0에 어긋난다 / 재현: Studio 레포 연결 모달을 열면 제목, 두 탭, 동기화 단추에 이모지가 노출된다 / 수정 방향: 접근 가능한 기존 아이콘 시스템 또는 평문 라벨로 바꿔야 한다.

## MINOR

MINOR: [토큰 위반] `dashboard/src/components/studio/PlatformPreview.tsx:151` - 공용 아이콘 크기를 `w-[18px] h-[18px]`로 직접 박았다 / DESIGN.md의 임의 px 금지와 디자인 토큰만 사용한다는 계약에 어긋난다 / 재현: 전역 아이콘 크기 토큰을 바꿔도 이 미리보기만 따라가지 않는다 / 수정 방향: 공용 icon-size 토큰 또는 기존 Tailwind 스케일을 사용해야 한다.

MINOR: [회귀 위험·배포 장부] `dashboard/db/rollback-migration.sh:53` - rollback 성공 뒤 migration ledger 상태를 갱신하지 않는다 / schema 상태 정본인 `osmu_schema_migrations`와 실제 DB가 어긋난다 / 재현: contract 적용 뒤 rollback을 성공해도 장부는 계속 applied로 남는다 / 수정 방향: rollback을 immutable event 또는 rolled_back 상태로 원자 기록해야 한다.

MINOR: [비용·보존] `.github/workflows/deploy-marketing.yml:103` - rollback용 stopped 컨테이너의 보존 기한과 정리 경로가 없다 / DB rollback 7일 window와 연결된 컨테이너 수명주기가 없다 / 재현: 명시 OSMU 배포를 반복하면 이전 컨테이너와 이미지가 누적돼 runner 디스크를 채운다 / 수정 방향: rollback 기간 동안 한 세대만 보존하고 이후 명시적으로 정리해야 한다.

MINOR: [유지보수성] `dashboard/scripts/verify-four-room-ui-e2e.mjs:5` - 다른 레포의 절대 경로에서 Playwright를 import하고 특정 사용자 Chromium cache에 고정한다 / 재실행 가능한 검증 계약과 어긋난다 / 재현: `kimstudy-auto`가 없거나 Chromium revision이 바뀐 머신에서는 앱 검증 전에 실패한다 / 수정 방향: dashboard 자체 dependency와 실행 파일 discovery를 사용해야 한다.

## 확인한 정상 경계

- tenant isolation E2E는 183/183을 통과하고 임시 데이터를 정리했다. 이 결과는 M3의 공유 DB 풀 고갈과 M29, M30의 지정 작업 공간 오염을 다루지 않는다.
- 삭제된 파일은 wiki 색인 7개뿐이며 커밋 `ad056aac`가 namespace 재배치 사유를 기록했다. 무기록 삭제 자체는 찾지 못했다.
- 지정 범위 추가 줄에서 새 사용자용 긴 대시는 확인하지 못했다.
- 전체 Vitest와 TypeScript는 통과했다. 위 거짓 양성 조건과 외부 성공 뒤 DB 실패 경로는 테스트되지 않는다.

## 셀프심문

질문: 내가 PASS를 준다면, 회장이 dev에서 직접 써보고 발견할 가장 그럴듯한 문제는 무엇인가?

답: 영상 후보를 편집실로 넘겼는데 실제 장면과 재생기가 없고 구조 초안 박스만 나오는 문제다. 이어 실제 발행에서는 프로세스 중단 뒤 영구 `PUBLISH_ALREADY_IN_PROGRESS`가 남거나 첫 댓글 실패가 새로고침 뒤 전체 성공으로 바뀔 수 있다. 모두 MAJOR로 확인했으므로 PASS는 성립하지 않는다.

SKILLS_USED: review. 커밋 범위 고정, diff 공격 검토, 병렬 전문 축 검토, 필수 검증, 완료 증거 분리에 사용했다.

SKILLS_SKIPPED: QA 수정 스킬은 코드 수정 금지와 충돌해 사용하지 않았다. 디자인 생성과 콘텐츠 생성 스킬은 코드 리뷰 범위가 아니어서 사용하지 않았다.

SOURCES: `pipeline-state.osmu.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | https://docs.github.com/en/actions/concepts/security/script-injections | https://www.postgresql.org/docs/15/app-psql.html | https://playwright.dev/docs/test-parallel | https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html | https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html | https://support.discord.com/hc/en-us/articles/115002192352-Automated-User-Accounts-Self-Bots | https://developers.google.com/youtube/v3/docs/comments/insert

MODEL: gpt-codex/gpt-5.6-sol

## 4축 판정

- 승인 시안 이탈: 지적 9건. M11, M34부터 M41.
- 회귀 위험: 지적 33건. M1부터 M25, M31, M32, M34부터 M38, M41.
- 토큰 위반: 지적 1건. MINOR 1.
- 무기록 삭제: 문제없음. 삭제된 wiki 색인 7개는 커밋 `ad056aac`에 재배치 사유가 기록됐다.

REVIEW_VERDICT: BLOCK
