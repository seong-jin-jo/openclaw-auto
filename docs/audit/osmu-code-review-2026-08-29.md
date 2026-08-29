# OSMU 코드 리뷰 2026-08-29

STAMP | line: osmu | 생성: 2026-08-29 12:25 KST | model: gpt-codex/gpt-5.6-sol | agent: code-reviewer | skill: review | 고민: 정상 경로 통과와 실제 부작용의 안전을 분리하고, 승인 화면에서 사라진 역방향 기능을 다시 대조했다.

검토 범위: 리뷰 시작 시 고정한 `5d941aa051c9e7474b6a1dc36b4474573e0b4740..47a54e4b4698f034327b61408e37c7633223b388`. 지난 24시간 109개 커밋, 466개 파일, 추가 14,762줄, 삭제 7,316줄이다. 리뷰 중 뒤에 들어오는 커밋은 포함하지 않았다. 제품 코드는 수정하지 않았다.

기반 산출물:

- 승인 산출물 핀: `pipeline-state.osmu.md`
- 승인 PRD: `docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
- 회장 지정 프로토타입: `docs/prototype/openclaw-auto-4room-v63.html`
- 회장 확정 요구: `docs/requests/회장-확정-요구사항-대장.md`
- 2026-08-29 실사용 피드백: `docs/requests/2026-08-29-회장-4실-실사용-피드백.md`
- 사업 좌표: `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`
- 디자인 정본: `DESIGN.md`

직접 관찰 증거:

- `localhost:3456/api/health`: TCP 연결 뒤 10초 동안 응답 본문 0바이트, curl 종료 코드 28.
- 지정 작업 공간 초안 API: TCP 연결 뒤 15초 동안 응답 본문 0바이트, curl 종료 코드 28.
- 실행 중 Next 프로세스: 14분 이상 경과, CPU 301.9% 관찰. 감독 프로세스 소유 서버라 리뷰가 재시작하지 않았다.
- `npm run test`: 199개 파일, 1,450건 통과, 조건부 1건 제외, 종료 코드 0.
- `npx tsc --noEmit`: 종료 코드 0.
- `dashboard/scripts/verify-basic-flow-e2e.mjs`: `== 생성실 ==` 출력 뒤 멈춤. 외부 180초 제한으로 종료 코드 124.
- `dashboard/scripts/verify-studio-v1-e2e.mjs`: 출력 없이 멈춤. 외부 180초 제한으로 종료 코드 124.

정적 검증 통과는 실제 앱 무응답, 외부 부작용, 부분 실패, 작업 공간 경합, 승인 화면 누락의 반증이 아니다.

## MAJOR

MAJOR: [회귀 위험] `scripts/osmu-supervisor.sh:121`: build 대기 항목을 기본 최대 4개까지 같은 저장소와 작업 트리에서 동시에 `code-builder`로 실행한다 / 프로젝트 운영 계약의 `build 이후는 직렬`, `소스 쓰는 라인은 한 번에 하나`와 어긋난다 / 재현: build 항목 둘 이상을 대기시키면 같은 index와 HEAD를 여러 워커가 동시에 편집하고 커밋한다 / 코드 쓰기 역할 전역 mutex를 두거나 워커별 독립 worktree와 직렬 통합을 강제해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/engagement-store.ts:46`: DB transaction과 advisory lock을 잡은 채 58행의 최대 15초 공급자 호출을 기다린다 / PRD NFR-OS81-04의 `concurrent20에 안전`과 어긋난다 / 재현: 서로 다른 댓글 좋아요 5건의 공급자 응답을 늦추면 pool 최대 5개가 외부 I/O에 점유되어 다른 작업 공간 DB 요청도 밀린다 / 짧은 claim transaction, 외부 호출, finalize transaction으로 나눠야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/engagement-store.ts:108`: 답글 공급자 응답 유실을 `reply_external_id='status-unknown'`으로 저장하지만 조회, 확정, 해제 경로가 없다 / PRD의 uncertain reconcile과 v63의 `외부 결과만 확인` 계약에 어긋난다 / 재현: 공급자가 답글을 만들고 응답만 끊으면 이후 모든 요청이 영구 conflict가 된다 / 공급자 readback과 명시적인 uncertain 상태 전이를 추가해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/publish/route.ts:188`: 중복 방지 reservation은 UUID 초안에만 적용되고 `draft_id` 누락 또는 legacy ID는 외부 발행으로 바로 간다 / PRD NFR-OS81-04의 `intent별 외부 side effect 1 이하`와 v63 5097행의 `동일 의도 외부 요청 최대 1`에 어긋난다 / 재현: 같은 계정과 본문으로 `draft_id` 없는 POST 두 건을 동시에 보내면 외부 게시가 두 번 실행된다 / 모든 실발행에 서버 intent 또는 필수 idempotency key를 요구해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/publish/route.ts:193`: `in_progress` reservation에 lease, heartbeat, 공급자 correlation이 없고 충돌 시 published 행만 조회한다 / v63의 `reconcile 우선`과 어긋난다 / 재현: reservation INSERT 직후 프로세스를 종료하면 같은 작업은 영구 `PUBLISH_ALREADY_IN_PROGRESS` 409가 된다 / 만료 lease와 공급자 readback을 추가해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/publish.ts:243`: Threads는 실제 게시 뒤 응답 손실을 `failureKind:'indeterminate'`로 구분하지만 `dashboard/src/app/api/publish/route.ts:336`과 `dashboard/src/app/api/schedule/publish-due/route.ts:230`은 이를 소비하지 않고 failed로 저장한다 / v63 14949행의 `같은 콘텐츠를 다시 게시하지 않고 기록만 복구`와 어긋난다 / 재현: 게시 성공 뒤 응답 JSON만 끊기면 실패 저장 후 재시도에서 중복 게시된다 / uncertain 상태로 보존하고 공급자 조회 전 재발행을 막아야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/publish/route.ts:325`: 본문 성공과 첫 댓글 실패도 371행에서 `status='published'`, `error=NULL`로 저장하고 437행 응답은 최상위 `ok:true`를 유지한다 / v63의 `일부 실패는 복구 필요, 재발행 금지`와 PRD의 `false-published0`에 어긋난다 / 재현: 첫 댓글만 500이면 최초 응답의 `partial=true` 외에는 실패가 사라지고 새로고침 뒤 전체 성공으로 보인다 / 본문과 댓글 상태를 독립 저장하고 댓글만 멱등 복구해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/studio/generation/service.ts:307`: 무료 재생성 몫은 UTC 날짜로 차감하지만 324행 복구 시각은 원본 작업 시간대의 다음 자정이다 / 사업 좌표의 `무료에서 유료로 넘어가는 경계, 몫, 멱등이 실제로 지켜져야 한다`와 어긋난다 / 재현: 서울 23:30 사용 시 00:00 복구를 알리지만 실제 몫은 09:00까지 잠긴다 / quota key와 안내 시각을 같은 경계로 통일해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/studio/generation/service.ts:298`: 재생성은 job 소유만 확인하고 후보 A, B, C의 거절 상태 없이 무료 몫을 소비한다 / 요구 대장 R27의 `후보 셋 다 거절 시 하루 1회 무료 재생성`과 어긋난다 / 재현: 생성 201 직후 후보를 하나도 거절하지 않고 재생성 API를 직접 호출해도 무료 replacement가 생성된다 / 세 후보의 서버 거절 장부와 quota 차감을 한 transaction에서 강제해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/studio/shorts-factory/service.ts:76`: heartbeat 실패를 삼키고 실행 worker에 lease owner, fencing token, AbortSignal이 없으며 `dashboard/src/lib/studio/shorts-factory/repository.ts:294`의 finalize는 force-fail된 실행도 partial 또는 succeeded로 다시 덮을 수 있다 / PRD NFR-OS81-11의 비용 대사와 v63의 실행 중지 계약에 어긋난다 / 재현: 느린 provider 실행 중 heartbeat를 끊고 force-fail한 뒤 새 실행을 시작하면 구 worker와 신 worker가 함께 비용 작업을 만들고 구 worker 종료 시 failed 상태가 다시 바뀐다 / fencing token, 실제 취소, terminal 상태 CAS를 함께 강제해야 한다.

MAJOR: [회귀 위험] `dashboard/db/run-migrations.sh:55`: generation 두 table이 없는 구형 DB는 phase 분기 전 `regclass` cast에서 실패한다 / legacy upgrade와 baseline 목적에 어긋난다 / 재현: `tenants`는 있지만 generation table이 없는 DB에서 `apply-legacy`를 실행하면 fingerprint 단계에서 종료되고 bootstrap은 비어 있지 않은 DB라 거절된다 / 구형 catalog를 `to_regclass`로 식별하고 별도 legacy install 경로를 제공해야 한다.

MAJOR: [회귀 위험] `dashboard/db/run-migrations.sh:433`: 배포 preflight는 generation과 quota 제약만 확인하고 필수 migration, engagement, incident, shorts factory table, RLS ENABLE와 FORCE, `tenant_iso`, `osmu_service.rolbypassrls`를 검사하지 않는다 / 배포 스키마 게이트와 PRD의 cross-tenant read, write, link 0 계약에 어긋난다 / 재현: `engagement_items`가 없거나 drafts RLS를 끈 DB도 preflight가 성공해 런타임 500 또는 교차 작업 공간 노출로 이어진다 / 릴리스 manifest와 필수 relation, FK, RLS catalog를 전부 fail-closed 대조해야 한다.

MAJOR: [회귀 위험] `dashboard/db/run-migrations.sh:123`: `contract-generation`은 `S3|S2`를 만들고 직후 검사는 이를 허용하지만 다음 일반 preflight는 expected fingerprint를 넘기지 않아 같은 상태를 거절한다 / 승인된 단계 뒤 앱 배포가 계속 가능해야 한다는 상태 전이 계약과 어긋난다 / 재현: contract-generation 성공 직후 일반 배포를 시작하면 mixed fingerprint로 차단되고 contract-quota는 399행에서 비활성이라 자동 전진도 못 한다 / 현재 앱이 지원하는 상태 집합을 preflight에 명시하거나 quota 승인 전 generation contract를 닫아야 한다.

MAJOR: [회귀 위험] `dashboard/db/run-migrations.sh:415`: migration 장부의 running 기록, 포함 SQL의 자체 COMMIT, applied 갱신이 한 transaction이 아니다 / 실제 schema와 migration 장부가 같은 상태여야 한다는 계약에 어긋난다 / 재현: contract SQL COMMIT 직후 418행 장부 갱신 전에 runner를 종료하면 schema는 바뀌고 장부는 running이며 재실행은 선행 fingerprint에서 막힌다 / 단일 transaction으로 묶거나 post-state를 확인해 장부를 reconcile하는 재진입 경로를 둬야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/studio/drafts/route.ts:84`: 프론트는 `displayNames`, `titles`, `hashtags`, `firstComments`, `editLines`를 보내고 다시 읽으려 하지만 POST payload와 GET 평탄화가 전부 버린다 / DESIGN.md의 `결과물과 기록을 한 묶음으로 넘긴다`와 요구 대장 R16의 이어하기 계약에 어긋난다 / 재현: 플랫폼 제목, 첫 댓글, 편집 대사를 수정하고 저장한 뒤 새로고침해 이어 편집하면 값이 사라진다 / 단일 Draft DTO로 저장, DB, 조회, 복원 필드를 일치시키고 실제 왕복 테스트를 추가해야 한다.

MAJOR: [승인 시안 이탈] `dashboard/src/app/studio/page.tsx:774`: 작업물 전체가 방 이동 단추 세 개와 성과실 링크만 그리며 단계별 건수와 저장 작업물 목록을 그리지 않는다 / 요구 대장 R153의 `네 칸이 펼쳐지고 각 숫자를 누르면 그 작업물이 뜬다`, R16의 `언제든 꺼내 이어서 작업`, v63 14182행의 같은 구조와 어긋난다 / 재현: 초안 A와 B를 저장한 뒤 작업물 전체를 열면 최신 currentWork 하나 외에 A를 꺼낼 수 없다 / 네 단계별 건수, 작업물 row, ID 기반 열기와 pagination을 복원해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/studio/drafts/route.ts:91`: 임의 `body.status`를 검증 없이 저장하고 `dashboard/src/lib/studio/current-work.ts:38`은 문자열 `published`만으로 성과실을 판정한다 / 실제 발행 기록 없이 성과를 확정하지 않는 데이터 진실성 계약과 어긋난다 / 재현: published_posts가 없는 draft를 `status=published`로 저장하면 currentWork가 성과실로 이동한다 / status enum과 전이 소유자를 서버에서 제한하고 실제 published_posts와 결합해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/page.tsx:21`: `/api/metrics`가 반환하는 coverage를 프론트 타입과 PerformanceRoom에 전달하지 않고 233행에서 미수집 값도 0으로 합산한다 / DESIGN.md의 `없는 값은 0이 아니라 미수집` 계약과 어긋난다 / 재현: Threads 게시 2건 중 1건만 수집하면 API는 부분 수집을 알리지만 화면은 한 건 합계를 전체 합계처럼 표시한다 / coverage, 수집 N/M, 결측 사유를 화면까지 전달해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/api/metrics/route.ts:71`: 개별 provider 실패는 건너뛰고 87행에서 항상 `{ok:true}`를 반환하며 일부 metric만 와도 나머지를 0으로 쓰고 `metrics_at`을 기록한다 / 부분 실패를 전체 성공으로 세지 않는 계약과 어긋난다 / 재현: 모든 provider가 500이어도 HTTP 200과 `ok:true, updated:0`이고 views만 와도 likes, replies, reposts는 측정된 0으로 확정된다 / `success`, `partial`, `failed`와 metric별 coverage를 저장하고 필수 지표 완료 뒤에만 수집 완료로 세야 한다.

MAJOR: [승인 시안 이탈] `dashboard/src/components/studio/StudioRooms.tsx:345`: 영상 편집실이 실제 장면과 재생기 대신 대사 한 줄의 색면과 `실제 영상 렌더는 준비 중입니다`를 표시한다 / v63 10547행부터 10585행의 실제 장면, 재생, 진행, 시간, CC, 설정, 전체 화면 부품과 어긋난다 / 재현: 영상 후보를 편집실로 넘기면 장면과 재생 제어가 없는 구조 초안만 보인다 / 승인된 장면과 재생 제어, 렌더 전 상태를 구현해야 한다.

MAJOR: [회귀 위험] `dashboard/src/lib/performance-metrics-coverage.ts:32`: 작업 공간의 Threads 연결 여부와 무관하게 `collectionSupported=true`를 고정한다 / PRD AC-004의 `false-ready0`과 결측 이유를 정직하게 알리는 계약에 어긋난다 / 재현: 채널 0개 작업 공간에서도 GET은 지원 true지만 실제 POST는 `threads 채널 미연결` 400이다 / 구현 가능성과 현재 작업 공간의 connected, ready 상태를 분리해야 한다.

MAJOR: [무기록 삭제] `dashboard/src/app/page.tsx:74`: PerformanceRoom 연결에서 `useAlerts`와 `useErrors`가 사라졌고 서버의 `/api/alerts`, `/api/errors`는 계속 살아 있다 / v63 13704행의 `표와 경고는 접어서 원자료`, 13706행의 `최근 24시간 에러와 Alerts를 확인할 것에 합침`과 어긋나며 커밋 메시지는 `성과실 중복 패널 제거`만 말한다 / 재현: 토큰 만료나 실패 게시물을 만든 뒤 올린 글별 성적을 열어도 오류 건수와 조치 단추가 없다 / 승인 폐기된 패널은 되살리지 말고 접힌 원자료 안의 오류 집계와 행동 목록만 복구해야 한다.

MAJOR: [승인 시안 이탈] `dashboard/src/app/page.tsx:76`: 신규 사용자 성과실 아래에 embedded OnboardingWizard를 추가하면서 위의 ChannelConnectBanner와 OnboardingChecklist도 함께 렌더한다 / v63의 신규 빈 상태 `지금 하실 일 하나만`, DESIGN.md의 `한 화면 한 흐름`과 어긋난다 / 재현: 온보딩 미완료, 채널 0개 작업 공간에서 성과실 빈 상태, 배너, 체크리스트, 3단계 wizard가 동시에 나타난다 / 성과실은 승인된 빈 상태 한 흐름만 두고 온보딩 입력은 승인된 생성실 관문으로 옮겨야 한다.

MAJOR: [승인 시안 이탈] `dashboard/src/components/shared/LoginModal.tsx:149`: 기존 한국어 주 단추와 보조 단추를 `Login`, `Cancel`로 바꾸고 130행 제목과 138행 placeholder도 영어로 바꿨다 / 이번 확정 요구의 `영문 단추 라벨 금지`와 diff 이전의 `로그인`, `취소`에 어긋난다 / 재현: 운영자 화면에서 401을 유발하면 영어 주, 보조 단추가 뜬다 / 인증 경쟁 방지와 focus trap은 유지하고 사용자 문구만 확정 한국어로 복구해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/login/page.tsx:108`: `getSession`과 `/api/me`의 늦은 성공을 unmount 뒤 무효화하지 않아 현재 운영자 identity를 고객 identity로 덮을 수 있다 / 고객과 운영자 로그인 정본 분리 계약에 어긋난다 / 재현: 고객 `/api/me` 응답을 늦추고 `/operator`에서 인증을 끝낸 뒤 고객 응답을 풀면 82행이 고객 token을 저장하고 98행이 고객 경로로 이동한다 / generation nonce, AbortController, route와 identity 소유권 재확인을 추가해야 한다.

MAJOR: [회귀 위험] `dashboard/src/app/operator/page.tsx:20`: 운영자 token 검증도 페이지 이탈 뒤 취소되지 않고 늦은 성공이 30행에서 운영자 token을 다시 저장한다 / 고객 로그인과 운영자 로그인의 상호 배제 계약에 어긋난다 / 재현: 운영자 검증 응답을 늦추고 66행 고객 로그인 링크로 이동한 뒤 응답을 풀면 `/operator/customers`로 되돌아간다 / LoginModal과 같은 attempt nonce, abort, cleanup 무효화를 공용화해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-basic-flow-e2e.mjs:44`: reorder, delete, restore, mark-ready를 HTTP 200만으로 통과시키고 66행 제안 인계는 정상 신규 201을 실패로, 오염된 재사용 200을 성공으로 세며 provenance는 출력만 한다 / v63의 실제 편집 상태와 성과 제안의 생성 큐 연결 계약에 어긋난다 / 재현: handler가 no-op 200을 반환하거나 sourceContext를 버려도 스크립트가 통과할 수 있다 / 응답과 재조회 상태, revision 증가, 신규 201, 정확한 suggestion provenance를 모두 판정해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-basic-flow-e2e.mjs:25`: 지정 공유 작업 공간에 generation, draft, publish queue, suggestion queue를 만들고 cleanup이 없다 / E2E 격리와 운영 데이터 보존 계약에 어긋난다 / 재현: 반복 실행할수록 네 종류 장부가 누적되고 200 재사용 성공이 이전 오염에 의존한다 / 전용 임시 tenant를 사용하고 모든 생성 ID를 `finally`에서 역순 정리해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-studio-v1-e2e.mjs:78`: 첫 재생성이 409이면 둘째 호출의 실제 status를 버리고 기대 409를 실제값으로 기록한다 / 하루 1회 무료 몫 실측 계약과 어긋난다 / 재현: 실제 상태가 `[409,201]`이어도 두 assert가 모두 참이다 / 깨끗한 전용 member에서 상태 집합이 정확히 201 한 건과 409 한 건인지, 장부가 한 행인지 확인해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-studio-v1-e2e.mjs:39`: 지정 공유 회원과 작업 공간에 generation 두 건과 무료 재생성 몫을 만들고 cleanup하지 않는다 / 사업 좌표의 무료에서 유료 경계와 테스트 격리 계약에 어긋난다 / 재현: 첫 실행이 실제 사용자의 당일 무료 몫을 소비하고 다음 실행은 409 허용 분기로 바뀐다 / 테스트 전용 회원, tenant, 고정 시간을 쓰고 job, idempotency, quota 장부를 정리해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-free-quota-timezone-attack.mjs:10`: 실행 안내가 tenant나 회원 조건 없이 전체 무료 몫 원장을 DELETE하고 24행 검증은 생성 3건이 500, 재생성 3건이 404여도 `granted=0`이라 성공한다 / 무료 몫과 외부 고객 테스트 격리 계약에 어긋난다 / 재현: 안내 SQL을 공유 DB에 실행하면 모든 회원 몫이 사라지고 실패 응답 여섯 건만으로 종료 코드 0이 가능하다 / 전용 회원만 정리하고 생성 201 세 건, 재생성 201 한 건과 409 두 건을 정확히 요구해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-api-read-sweep.mjs:96`: 401, 403, 503을 의도된 거절 후보로 빼고 164행은 5xx와 요청 실패만 실패시킨다 / 유효 인증과 서버 전면 장애를 성공으로 세지 않는 완료 증거 계약에 어긋난다 / 재현: 유효 자격증명 경로 170개가 모두 401이어도 failed 0과 종료 코드 0이 가능하고 전체 503도 false pass가 가능하다 / route별 인증 주체, 기대 status, 최소 응답 schema를 선언해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-four-room-ui-e2e.mjs:120`: 공유 settings.json을 잠금 없이 덮고 시작 snapshot으로 복원하며 155행 token revoke 실패는 로그만 남기고 성공 종료한다 / 동시 QA 설정 보존과 보안 cleanup 완료 계약에 어긋난다 / 재현: 두 실행이 겹치면 늦게 끝난 실행이 다른 변경을 덮고 DELETE 500으로 bearer가 살아도 PASS다 / 임시 작업 공간과 file lock 또는 CAS를 쓰고 cleanup 실패를 비제로 종료해야 한다.

MAJOR: [회귀 위험] `dashboard/scripts/verify-basic-flow-e2e.mjs:25`: 필수 기본 흐름과 Studio v1의 fetch에 요청 제한 시간과 전체 deadline이 없다 / 무인 검증 명령은 반드시 끝나야 한다는 작업 규율과 어긋난다 / 재현: 현재 localhost가 TCP 연결만 받은 뒤 응답하지 않아 기본 흐름은 생성실 표지 뒤, Studio v1은 출력 없이 멈췄고 외부 180초 제한에서 각각 종료 코드 124였다 / 공통 bounded fetch에 AbortSignal timeout을 넣고 전체 실행 deadline도 둬야 한다.

## MINOR

MINOR: [회귀 위험] `dashboard/db/rollback-migration.sh:53`: rollback 성공 뒤 `osmu_schema_migrations` 상태나 immutable rollback event를 기록하지 않는다 / 실제 DB와 schema 장부가 어긋난다 / 재현: contract 적용 뒤 rollback해도 장부는 계속 applied다 / 같은 transaction에 rollback event 또는 rolled_back 상태를 기록해야 한다.

MINOR: [회귀 위험] `dashboard/db/run-migrations.sh:399`: workflow가 cleanup을 노출하지만 prerequisite인 contract-quota는 항상 비활성이고 cleanup은 404행에서 그 적용을 요구한다 / 실행 가능한 migration 상태 그래프와 어긋난다 / 재현: 허용된 모든 phase 뒤에도 cleanup은 항상 prerequisite 실패다 / 승인 전 workflow에서 숨기거나 contract-quota와 cleanup을 함께 개방해야 한다.

MINOR: [확정 요구 이탈] `dashboard/scripts/verify-basic-flow-e2e.mjs:2`: 새 주석에 금지된 긴 대시 문자가 있다 / 회장 확정 요구 `긴 대시 금지`와 어긋난다 / 재현: 고정 diff의 추가 줄 검색에서 검출된다 / 마침표나 콜론으로 바꿔야 한다.

MINOR: [확정 요구 이탈] `dashboard/scripts/verify-free-quota-timezone-attack.mjs:2`: 새 주석에 금지된 긴 대시 문자가 있다 / 회장 확정 요구와 어긋난다 / 재현: 고정 diff의 추가 줄 검색에서 검출된다 / 마침표나 콜론으로 바꿔야 한다.

MINOR: [확정 요구 이탈] `dashboard/src/app/login/page.tsx:86`: 새 주석에 금지된 긴 대시 문자가 있다 / 회장 확정 요구와 어긋난다 / 재현: 고정 diff의 추가 줄 검색에서 검출된다 / 마침표나 괄호로 바꿔야 한다.

MINOR: [확정 요구 이탈] `scripts/osmu-supervisor-guard.sh:2`: 새 주석에 금지된 긴 대시 문자가 있다 / 회장 확정 요구와 어긋난다 / 재현: 고정 diff의 추가 줄 검색에서 검출된다 / 마침표나 콜론으로 바꿔야 한다.

MINOR: [확정 요구 이탈] `scripts/refill-backlog.sh:2`: 새 주석에 금지된 긴 대시 문자가 있다 / 회장 확정 요구와 어긋난다 / 재현: 고정 diff의 추가 줄 검색에서 검출된다 / 마침표나 콜론으로 바꿔야 한다.

## 4축 판정

- 승인 시안 이탈: 지적 4건. 작업물 전체 목록과 건수, 영상 실제 장면과 재생기, 신규 사용자 한 흐름, 한국어 로그인 단추가 이탈했다.
- 회귀 위험: 지적 29건. 돈, 격리, 동시성, 인증 경쟁, schema 상태, 거짓 E2E, 끝나지 않는 QA를 포함한다.
- 토큰 위반: 문제없음. 고정 diff의 추가 UI 코드에서 신규 hex, inline style, 임의 px 토큰 위반을 찾지 못했다.
- 무기록 삭제: 지적 1건. 성과실의 오류 집계와 조치 알림이 승인 근거 없이 사라졌다. wiki index 삭제와 migration 교체는 대체 파일과 사유가 있어 제외했다.

## 셀프심문

질문: 내가 PASS를 준다면, 회장이 dev에서 직접 써보고 발견할 가장 그럴듯한 문제는 무엇인가?

답: 작업물 전체에서 이전 초안을 꺼낼 수 없고, 영상 편집실에 실제 장면과 재생기가 없으며, 3456 앱과 필수 E2E가 멈추는 문제다. 모두 MAJOR로 확인했으므로 PASS는 성립하지 않는다.

SKILLS_USED: review. 고정 범위 공격 검토, 승인 산출물 대조, 전문 축 교차 검토, 필수 검증, 완료 증거 분리에 사용했다.

SKILLS_SKIPPED: review 스킬의 자동 수정 단계는 코드 수정 금지와 충돌해 사용하지 않았다. QA 수정 스킬도 같은 이유로 사용하지 않았다.

SOURCES: `pipeline-state.osmu.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `docs/requests/2026-08-29-회장-4실-실사용-피드백.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | https://nextjs.org/docs/app/guides/authentication | https://www.postgresql.org/docs/current/ddl-rowsecurity.html | https://www.postgresql.org/docs/current/explicit-locking.html | https://nodejs.org/api/globals.html

MODEL: gpt-codex/gpt-5.6-sol

REVIEW_VERDICT: BLOCK(MAJOR 있음)
