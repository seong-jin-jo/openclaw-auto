# OSMU 코드 리뷰 2026-08-28

검토 범위: `3b74b799`부터 `5600ed86`까지 31개 커밋과, 과제에서 명시한 생성 장부 PostgreSQL 전환 커밋 `971c0fab`, `8e65d2d2`.

## 수정 우선순위와 2026-08-28 build 판정

| 우선순위 | 지적 번호 | 판정 |
|---|---|---|
| P0 돈·외부 중복·격리 | MAJOR 1~5, 8~11, 18~25 | MAJOR 2·4·5·10·20·21·23·24·25 해소. MAJOR 8 일부 해소. 나머지 미해소 |
| P1 기본 흐름·상태 정직성 | MAJOR 6·7·12~17·26~33 | MAJOR 6·7·12·31 해소. 나머지 미해소 |
| P2 디자인·복구 안전망 | MINOR 1~9 | MINOR 1~5·7·8 해소. MINOR 6·9 미해소 |

MAJOR 1은 기존 작업 공간별 유일성 제약을 유지한 채 회원 전역 중복 데이터를 어떤 기준으로
정리할지 승인된 보존 정책이 없어 이번 build에서 강제 삭제하지 않았다. MAJOR 3은 작업 공간 삭제 뒤에도
과금 장부를 얼마 동안, 어느 소유 경계에 보존할지 계약이 없어 tenant cascade를 임의 변경하지 않았다.
두 항목은 무시가 아니라 데이터 보존 결정 대기다.

이번 build의 직접 증거와 남은 범위는 `docs/qa/qa-tracker.md`의
`OSMU 코드리뷰 P0·P1 수정 검증` 항목을 진실원으로 삼는다.

## MAJOR

1. MAJOR: [회귀 위험·돈] `dashboard/db/schema.sql:120` : 기존 앱이 쓰는 작업 공간 포함 UNIQUE를 먼저 제거하고 회원 전역 UNIQUE로 교체한다 / BASE 앱의 `dashboard/src/lib/studio/generation/repository.ts:69`와 `:111`은 제거되는 충돌 대상을 계속 사용하며, `.github/workflows/deploy-marketing.yml:69`는 새 앱 기동 전에 스키마를 적용한다 / 이전 앱이 서비스 중인 배포 창에 생성 요청을 보내면 PostgreSQL `42P10`이 나고, 기존 작업 공간 사이 중복 데이터가 있으면 새 UNIQUE 추가가 `23505`로 중단되며 부분 적용이 남는다 / 기존 UNIQUE 유지, 전역 중복 정리, 새 앱 배포, 옛 UNIQUE 제거 순서의 expand-contract 마이그레이션으로 나눠야 한다.

2. MAJOR: [회귀 위험·돈] `dashboard/src/lib/studio/generation/service.ts:302` : 무료 재생성 날짜를 요청자가 정한 원본 작업의 `timeZone`으로 계산한다 / 요구 대장 R27의 “하루 1회 무료 재생성, 그 이상 과금”과 `service.ts:45`의 회원 전역 하루 1회 계약에 어긋난다 / 같은 회원이 같은 UTC 시각에 `Etc/GMT+12`, `UTC`, `Pacific/Kiritimati` 원본을 재생성하면 날짜 키가 3개로 갈라져 무료 성공 3회를 얻는다 / 인증된 회원의 고정 과금 시간대나 서버 과금 시간대를 사용하고, 시간대 변경의 당일 효력 규칙을 고정해야 한다.

3. MAJOR: [회귀 위험·돈] `dashboard/db/schema.sql:135` : 회원 전역 무료 몫 장부가 `tenant_id ... ON DELETE CASCADE`에 묶여 있다 / 회원 단위 하루 1회 계약인데 작업 공간 삭제가 과금 증거까지 지운다 / 작업 공간 A에서 무료 몫을 쓴 뒤 A를 삭제하고 같은 날짜에 작업 공간 B에서 재생성하면 UNIQUE 행이 사라져 다시 무료 처리된다 / 무료 몫과 과금 장부의 수명을 작업 공간 생명주기에서 분리하거나 최소 과금 기간 동안 tombstone을 보존해야 한다.

4. MAJOR: [회귀 위험·돈·거짓 성공] `dashboard/src/lib/studio/generation/repository.ts:115` : 무료 몫 충돌 시 이미 저장된 동일 재생성 결과를 읽지 않고 곧바로 `false`를 반환한다 / 사업좌표 문서의 “몫, 멱등이 실제로 지켜져야 한다”는 계약과 어긋난다 / 첫 무료 재생성이 성공한 뒤 응답만 잃고 같은 `jobId`로 재시도하면 이미 생성된 교체 작업 대신 `409 PAID_REGENERATION_APPROVAL_REQUIRED`를 받는다 / 재생성 Route에도 호출자 멱등 키와 요청 지문을 받고, 동일 요청은 저장된 교체 작업을 재생하며 다른 요청만 409로 거절해야 한다.

5. MAJOR: [회귀 위험·동시성·돈] `dashboard/src/app/api/publish/route.ts:173` : 성공 행 SELECT와 외부 발행 사이에 원자적 예약이 없다 / `docs/plan/backlog-prompts/build7-publish-hardening.txt:7`의 “같은 글을 두 번 보내도 두 번 올라가지 않게 한다”와 `dashboard/db/schema.sql:483`의 외부 호출 전 예약 설계에 어긋난다 / 같은 초안, 플랫폼, 계정으로 요청 두 개를 동시에 보내면 둘 다 외부 게시물을 만든 뒤 두 번째 DB INSERT만 UNIQUE 위반으로 실패한다 / 외부 호출 전에 `in_progress` 예약 행을 원자적으로 획득하고 승자만 공급자를 호출해야 한다.

6. MAJOR: [회귀 위험·거짓 성공] `dashboard/src/app/api/publish/route.ts:375` : 본문 발행 뒤 첫 댓글이 실패해도 `ok:true, partial:true`와 HTTP 200을 반환하며, `dashboard/src/app/studio/page.tsx:403`은 `partial`을 무시하고 성공으로 기록한다 / build7 확정 요구의 “일곱 채널 중 셋만 성공했으면 성공이라 하지 않는다”와 어긋난다 / 게시물 생성만 성공시키고 첫 댓글 API를 500으로 만들면 채널은 완료, 분석 이벤트는 `publish_success`, 사용자 메시지는 발행 완료가 된다 / 본문, 첫 댓글, 영속화를 독립 상태로 보존하고 부분 성공을 전체 성공 지표에서 제외해야 한다.

7. MAJOR: [회귀 위험·동시성] `dashboard/src/app/studio/page.tsx:394` : 여러 채널 발행을 `for`와 `await`로 직렬 실행하며 예약 발행도 `dashboard/src/app/api/schedule/publish-due/route.ts:91`에서 동일하다 / build7 확정 요구의 “채널 하나가 오래 걸릴 때 나머지를 막지 않게 한다”와 어긋난다 / 첫 채널 응답을 지연시키면 정상인 두 번째 채널 요청조차 시작되지 않는다 / 채널별 예약, 독립 timeout, 제한된 병렬 실행으로 분리해야 한다.

8. MAJOR: [회귀 위험·확정 요구 이탈] `dashboard/src/lib/channel-accounts.ts:260` : 발행 credential 조회가 `status='active'`만 검사하고 `token_expires_at`을 확인하지 않는다 / build7 확정 요구의 “토큰이 만료된 채널은 발행 전에 미리 걸러 무엇을 다시 연결해야 하는지 알린다”와 어긋난다 / 상태는 active지만 만료 시각이 지난 계정을 고르면 공급자 호출까지 진행한 뒤 일반 발행 실패로만 보인다 / 만료와 갱신 가능 여부를 credential 계약에 넣고 호출 전에 구조화된 재연결 오류를 반환해야 한다.

9. MAJOR: [회귀 위험·동시성·거짓 성공] `dashboard/src/app/api/schedule/publish-due/route.ts:121` : 외부 발행 뒤 기록 INSERT가 실패하면 `finishSchedule` 전에 예외가 빠져나가며, 이미 `:175`에서 상태는 `processing`으로 바뀌었다 / build7의 부분 실패 정직 처리와 실패 채널만 재발행 계약에 어긋난다 / 공급자 발행은 성공시키고 `published_posts` INSERT만 실패시키면 요청은 500, 일정은 영구 `processing`에 남고 다음 실행은 `scheduled`만 claim해 회수하지 못한다 / 채널별 외부 성공 증거와 불확정 상태를 보존하고 stale lease 회수와 실패 채널 전용 재시도를 둬야 한다.

10. MAJOR: [회귀 위험·멱등·거짓 성공] `dashboard/src/lib/engagement-store.ts:54` : 완료된 답글 재사용을 request key만으로 판정하고 `reply_text`를 비교하지 않는다 / 멱등 키는 동일 요청만 재생해야 한다는 댓글 답글 계약과 어긋난다 / 키 K와 본문 A로 답글을 보낸 뒤 같은 K와 본문 B를 보내면 외부에는 A가 있지만 B 요청도 `ok:true, reused:true`가 된다 / 게시물, 댓글, 플랫폼, 정규화 본문의 요청 지문을 저장하고 같은 키의 다른 지문은 409로 거절해야 한다.

11. MAJOR: [회귀 위험·동시성·외부 부작용] `dashboard/src/lib/engagement-service.ts:132` : 공급자 답글 호출과 DB 완료 기록 사이에 불확정 상태와 회수 계약이 없다 / 댓글 답글 멱등과 거짓 성공 금지 계약에 어긋난다 / 공급자가 답글을 만든 뒤 DB 완료 기록이 실패하면 영구 `replying`이 되고, 공급자가 반영한 뒤 응답만 끊기면 `:134`가 claim을 해제해 재시도에서 공개 답글이 중복된다 / durable outbox와 `pending`, `uncertain`, `completed` 상태, 공급자 조회 기반 reconciliation을 둬야 한다.

12. MAJOR: [회귀 위험·상태 손실] `dashboard/src/lib/engagement-store.ts:85` : 좋아요가 상태를 `unread`로 만들고 충돌 시 replied 상태만 보존한다 / v63 프로토타입 `:12246`의 답할 것, 고칠 것, 보류 분류와 `:12279`의 독립 좋아요 행동 계약에 어긋난다 / 댓글을 나중 처리하거나 편집실로 넘긴 뒤 좋아요를 누르면 날짜 기록은 남지만 분류 상태가 unread로 돌아가 보류 목록에서 사라진다 / 좋아요는 `liked_at`만 갱신하고 기존 workflow 상태를 보존해야 한다.

13. MAJOR: [회귀 위험·기능 누락] `dashboard/src/lib/engagement-service.ts:82` : 공급자 응답의 `nextCursor`를 반환하면서 API 입력과 화면에 다음 페이지 계약이 없고, 행동 검증도 `:97`에서 첫 50개만 다시 읽는다 / 요구 대장 R185의 “댓글 관리와 반응은 성과실에서 한다”는 범위에 임의의 첫 50개 제한이 없다 / 댓글 51개 이상인 게시물에서 두 번째 페이지 댓글은 화면에 없고 ID를 직접 보내도 404다 / cursor 입력과 추가 로드를 연결하고 mutation은 단건 조회나 안전한 페이지 탐색으로 소유권을 검증해야 한다.

14. MAJOR: [회귀 위험·공급자 계약] `dashboard/src/lib/engagement-provider.ts:113` : YouTube의 중첩 답글을 최상위 댓글처럼 펼치고 모두 reply 가능으로 노출한다 / YouTube `comments.insert`는 최상위 댓글 ID를 `parentId`로 받으며 `commentThreads`의 내장 replies는 전체가 아닌 부분집합이다 / 기존 답글 항목에서 답글 보내기를 누르면 해당 답글 ID를 parent로 보내 공급자 오류가 난다 / 항목별 reply 가능 여부와 최상위 parent ID를 보존하고 전체 답글은 별도 목록 API로 보충해야 한다.

15. MAJOR: [회귀 위험·기능 누락] `dashboard/src/components/home/PerformanceRoom.tsx:236` : 댓글 조회 대상을 `published_posts.replies > 0`인 글로만 제한하지만 `dashboard/src/app/api/metrics/route.ts:40`은 Threads 지표만 수집한다 / v63 프로토타입 `:12230`과 `:12238`은 Instagram과 YouTube 댓글도 성과실 스트림에 둔다 / replies가 NULL인 Instagram, Facebook, YouTube 게시물에 실제 댓글이 있어도 `/api/engagement` 요청 자체가 발생하지 않는다 / 지표 유무와 댓글 탐색을 분리하고 댓글 읽기 지원 채널의 게시물을 지연 조회해야 한다.

16. MAJOR: [승인 시안 이탈] `dashboard/src/components/home/PerformanceRoom.tsx:543` : 댓글 화면이 2열이고 채널 필터와 오른쪽 자동화 상태 패널이 없다 / v63 프로토타입 `:12203`의 “왼쪽 바, 가운데 메시지 스트림, 오른쪽 바”, `:12262`의 채널 필터, `:12285`의 “지금 켜 둔 자동”과 어긋난다 / 성과실을 열면 채널별 필터, 자동 좋아요, 자동 답글, 영업 문의 상태를 확인할 수 없다 / 승인된 3열 구조와 두 부품을 복구하거나 상류 시안을 다시 승인받아야 한다.

17. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/components/home/PerformanceRoom.tsx:601` : 모든 댓글에 편집실 버튼을 보이고 인계한 댓글 본문과 수정 요청은 `dashboard/src/app/studio/page.tsx:481`에서 버린다 / v63 프로토타입 `:12280`은 수정 요청일 때만 편집실 버튼을 보이고 수정 사유를 함께 전달한다 / 일반 칭찬 댓글에도 버튼이 보이며 “두 번째 장 폰트가 작다” 같은 요청을 넘겨도 편집실에는 원본 초안만 열린다 / 수정 요청으로 분류된 댓글에만 버튼을 보이고 tenant-scoped handoff에 댓글 본문과 대상 초안을 묶어야 한다.

18. MAJOR: [회귀 위험·동시성] `dashboard/src/lib/studio/shorts-factory/service.ts:58` : 여덟 컨셉 실행이 HTTP 요청 수명 안에서 끝나야 하며 활성 실행에는 lease와 stale 회수가 없다 / 사업좌표 문서의 “여덟 컨셉의 숏폼이 동시에 돈다”와 활성 공장 하나 계약에 어긋난다 / 실행 중 프로세스가 종료되면 행은 `running`에 남고 같은 키는 죽은 스냅샷을 200으로 재생하며 새 키는 활성 실행 UNIQUE로 409가 되어 작업 공간이 영구 정지한다 / 실행을 durable worker로 옮기고 heartbeat, lease, stale reclaim을 둬야 한다.

19. MAJOR: [회귀 위험·거짓 성공·돈] `dashboard/src/lib/studio/shorts-factory/service.ts:68` : 생성 실행과 성공 상태 기록을 같은 try에 넣어 성공 기록 실패도 컨셉 실패로 덮는다 / 공장 상태판이 실제 Studio 생성 작업 번호와 오류를 정직하게 보여야 한다는 계약에 어긋난다 / 생성 작업은 DB에 생겼지만 `markConceptSucceeded`만 실패하면 공장은 failed로 표시하고 새 실행에서 같은 컨셉을 다시 만들어 비용이 중복된다 / 생성 실패와 기록 실패를 분리하고 job ID를 가진 reconciliation 상태에서 성공 기록을 멱등 재시도해야 한다.

20. MAJOR: [회귀 위험·격리] `dashboard/db/migrations/20260828_shorts_factory_runs.sql:2` : 마이그레이션이 트랜잭션 없이 테이블을 만든 뒤 `:54`에서야 RLS를 켜며, `dashboard/src/lib/studio/shorts-factory/repository.ts:123`은 tenant 조건 없이 ID와 회원만으로 조회한다 / 사업좌표 문서의 “여섯 사업체가 같은 물건을 쓴다”는 격리 경계와 어긋난다 / RLS 단계 전에 마이그레이션이 실패하면 무정책 테이블이 자동 커밋되고, 같은 회원의 A 토큰과 B 실행 ID 조합으로 B 실행을 읽을 수 있다 / 전체 DDL, GRANT, RLS를 한 트랜잭션으로 묶고 모든 조회와 갱신에도 tenant 조건을 넣어야 한다.

21. MAJOR: [회귀 위험·격리·DB 무결성] `dashboard/db/migrations/20260828_engagement_items.sql:6` : 댓글 행의 tenant와 참조한 발행 글 및 편집 초안의 tenant가 같은지 DB가 보장하지 않는다 / 작업 공간이 독립 데이터 경계라는 요구와 어긋난다 / `app.tenant_id=A`에서 A tenant 댓글 행이 B의 `published_post_id`와 `draft_id`를 참조해도 RLS는 새 행의 tenant만 보고 통과하며, B 글 삭제가 A 댓글을 cascade 삭제할 수 있다 / 부모 테이블에 `(tenant_id,id)` UNIQUE를 두고 댓글 FK를 복합 FK로 바꿔야 한다.

22. MAJOR: [회귀 위험·거짓 복구] `dashboard/src/lib/observability/incidents.ts:121` : 복구 조건이 tenant, category, source만 비교하고 reason, 계정, 게시물, 요청을 구분하지 않는다 / 사람 확인 필요와 자동 복구 대기를 구분한다는 운영 계약과 어긋난다 / 같은 작업 공간에서 계정 A의 사람 확인 사건이 열린 뒤 계정 B 발행이 성공하면 A 사건까지 `recovered`로 닫힌다 / 실패 단위 fingerprint와 계정 또는 resource identity를 복구 조건에 포함해야 한다.

23. MAJOR: [회귀 위험·거짓 성공] `dashboard/src/app/api/operator/incidents/route.ts:76` : 최근 200건만 읽은 뒤 메모리에서 요약과 미알림 대상을 계산한다 / 사람 확인 필요이면서 아직 알리지 않은 항목을 Slack으로 보낸다는 계약과 어긋난다 / 최근 자동 사건 200건과 더 오래된 미알림 human 사건 1건을 만들면 `humanOpen`은 0이고 그 사건은 영구 미발송된다 / 미알림 human 사건을 독립 쿼리하고 요약은 LIMIT 전 SQL 집계로 계산해야 한다.

24. MAJOR: [회귀 위험·운영 보안] `dashboard/scripts/health-alert.sh:47` : tenant가 정한 작업 공간 이름과 slug를 Slack mrkdwn 최상위 text에 이스케이프 없이 넣는다 / 관측 경계가 공격자 문자열을 그대로 운영 채널로 전달하지 않아야 한다는 closed-world 계약과 어긋난다 / 이름을 `<!channel>`과 줄바꿈을 포함한 운영 지시처럼 만들면 전체 멘션과 위조 문구가 운영 Slack에 렌더된다 / 제어문자 제거, 길이 제한, `&`, `<`, `>` 이스케이프 또는 검증된 식별자만 전송해야 한다.

25. MAJOR: [회귀 위험·알림 유실] `dashboard/scripts/health-alert.sh:73` : 실패 횟수가 임계값과 정확히 같을 때만 Slack을 한 번 호출하고 전송 실패를 무시한다 / 외부 장애 감지와 webhook 필수 계약에 어긋난다 / 임계값 2에서 두 번째 점검의 Slack만 500으로 만들면 세 번째부터 `fails != threshold`라 다시 시도하지 않아 지속 장애가 한 번도 알려지지 않는다 / 발송 성공 여부를 별도 저장하고 임계 이상이면서 미발송인 동안 제한 재시도해야 한다.

26. MAJOR: [승인 시안 이탈] `dashboard/src/components/layout/Sidebar.tsx:271` : 운영자 내비게이션에는 고객 관리만 있고 사건 패널은 `dashboard/src/app/operator/customers/page.tsx:363` 안에 묻혀 있다 / v63 프로토타입 `:7739`의 별도 `알림` 탭과 `:7740`의 `운영 알림` 화면 계약에 어긋난다 / 사이드바에서 알림 화면으로 갈 수 없고 고객 관리 화면을 직접 열어 스크롤해야 한다 / 별도 알림 내비게이션과 화면을 제공하거나 단일 화면 결정을 상류에서 재승인받아야 한다.

27. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/components/studio/StudioRooms.tsx:192` : `빼기`와 `무음 구간 줄이기`가 `visibleLines` 로컬 상태만 바꾸고 저장 payload를 갱신하지 않는다 / v63 프로토타입 `:13995`의 “줄의 빼기를 누르면 그 컷이 빠지고 길이 초가 즉시 다시 계산” 계약에 어긋난다 / 줄을 뺀 뒤 편집 작업물로 저장하면 `dashboard/src/components/studio/StudioCommandPanel.tsx:148`이 원래 줄을 저장해 새로고침 뒤 삭제한 줄이 되살아난다 / 줄 가시성을 revision 있는 handoff에 원자적으로 저장해야 한다.

28. MAJOR: [승인 시안 이탈·거짓 조작] `dashboard/src/components/studio/StudioRooms.tsx:179` : 비율, 목소리, 속도, 자막이 로컬 상태와 화면상 초 계산만 바꾸고 저장, 미디어, handoff에 전달되지 않는다 / 요구 대장 R182와 v63 프로토타입 `:12009`의 실제 편집 조작 계약에 어긋난다 / 값을 바꾼 뒤 저장하거나 새로고침하면 기본값으로 복구되고 자산도 변하지 않는다 / 편집 revision 계약과 백엔드 적용 결과에 값을 연결해야 한다.

29. MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/components/studio/StudioRooms.tsx:204` : 음악 편집은 준비 중 자리표시자뿐이고 `dashboard/src/components/studio/StudioCommandPanel.tsx:70`에도 audio 저장 종류가 없다 / 요구 대장 R147과 v63 프로토타입 `:12002`의 목소리, 배경음악, 볼륨 조작 계약에 어긋난다 / `editKind=audio` 작업을 열면 조작과 저장 가능한 원본이 모두 없다 / 세 조작과 audio handoff 저장 경로를 연결하기 전에는 구현 완료로 세면 안 된다.

30. MAJOR: [승인 시안 이탈] `dashboard/src/components/studio/PlatformPreview.tsx:80` : 게시물 안의 글자를 직접 고치는 대신 미리보기 아래에 별도 input과 textarea 판을 붙였다 / 요구 대장 R197의 “기존 플랫폼별 결과물에서 바로 수정”과 `DESIGN.md:542`의 “미리보기 글자 그 자리에서 고친다. 별도 판·서랍·톱니를 두지 않는다”에 어긋난다 / 실제 handle, 캡션, 해시태그를 눌러도 편집되지 않고 아래 폼에서만 바뀐다 / 미리보기 본문 자체에 IME, Enter, Esc를 포함한 인라인 편집 계약을 적용해야 한다.

31. MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/layout/Sidebar.tsx:147` : 활성 방에 금지된 “지금 여기” 사족을 표시하고 모바일 `:379`에서도 반복한다 / 요구 대장 R201의 “사이드바의 지금 여기·다음 사족을 뺀다”와 v63 프로토타입 `:13600`에 어긋난다 / 네 방 중 아무 방이나 열면 활성 표시와 함께 금지 문구가 보인다 / 문구를 제거하고 활성 배경, 체크, 연결선만 유지해야 한다.

32. MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/components/shared/OnboardingWizard.tsx:104` : 업종과 갈래를 저장한 뒤 빈 생성실로 이동할 뿐 업종 기반 첫 제안을 만들거나 전달하지 않는다 / v63 프로토타입 `:14766`의 “업종 하나만 고르면 그 기준으로 만든 제안 다섯 장이 즉시 깔립니다”와 어긋난다 / 신규 사용자가 온보딩을 끝내도 주제, 목적, 대상을 다시 입력해야 하고 후보는 0개다 / 완료 시 업종 기반 후보 다섯 개를 생성하거나 seed를 생성실로 전달해야 한다.

33. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/components/shared/OnboardingWizard.tsx:55` : storage 접근 실패를 잡은 뒤 같은 `localStorage.removeItem`을 다시 호출하고, `:99`의 sessionStorage 실패는 주 CTA를 조용히 중단한다 / 요구 대장 R89의 채널 연결 없이 첫 제작 진입 계약에 어긋난다 / 브라우저 Storage 메서드가 `SecurityError`를 던지면 마운트가 깨지거나 생성실 열기 단추가 아무 반응 없이 끝난다 / 예외를 다시 던지지 않는 safe storage 경계를 쓰고 저장 실패와 무관하게 라우팅해야 한다.

## MINOR

1. MINOR: [토큰 위반] `dashboard/src/app/globals.css:28` : `--focus`를 accent 72%로 정의했다 / `DESIGN.md:98`의 정확한 계약은 35%다 / 포커스 링이 정본보다 두 배 이상 진하다 / 정본값을 사용하거나 디자인 계약을 먼저 개정해야 한다.

2. MINOR: [토큰 위반] `dashboard/src/app/globals.css:19` : success를 `rgb(21 128 61)`, 즉 `#15803d`로 정의했다 / `DESIGN.md:45`의 정본은 `#16a34a`다 / 모든 성공 상태가 정본 색과 달라진다 / 정본 토큰으로 복원하거나 승인된 변경 기록을 남겨야 한다.

3. MINOR: [토큰 위반] `dashboard/src/app/globals.css:26` : 재생기 토큰을 surface와 text 두 개만 정의했다 / `DESIGN.md:106`은 surface, panel, control, line, text, on, on-text 일곱 개를 요구한다 / `dashboard/src/components/studio/PlatformPreview.tsx:182`가 어두운 재생기에 전역 본문색을 써 약 1.07:1 대비가 된다 / 일곱 토큰을 정의하고 재생기 내부 색을 전용 토큰으로 치환해야 한다.

4. MINOR: [토큰 위반] `dashboard/src/app/globals.css:151` : 공용 `.card`가 `border-radius:12px` 리터럴을 사용한다 / `DESIGN.md:492`의 “radius는 아래 5개만 쓴다. 리터럴 값 금지”와 어긋난다 / 토큰을 바꿔도 카드만 옛 반경에 남는다 / 공용 surface radius 토큰을 참조해야 한다.

5. MINOR: [토큰 위반] `dashboard/src/app/videos/page.tsx:666` : success 배경 단추가 `text-status-fg`를 쓰지 않아 본문색을 상속하며 같은 문제가 `:707`에도 있다 / 상태 배경용 글자 토큰을 정의한 디자인 계약과 어긋난다 / 라이트 모드에서 `#18181b`와 `#15803d` 대비가 약 3.53:1로 일반 텍스트 AA 4.5:1에 못 미친다 / success 채움 단추에 상태 전용 글자 토큰을 적용해야 한다.

6. MINOR: [토큰 위반] `dashboard/src/components/home/PerformanceRoom.tsx:543` : 댓글 rail 너비를 임의 Tailwind 값 `12rem`으로 박았다 / `DESIGN.md:147`의 명명된 간격 체계와 임의 값 금지 계약에 어긋난다 / rail 폭을 바꾸려면 컴포넌트 리터럴을 직접 찾아야 한다 / rail 너비를 디자인 토큰으로 승격해 참조해야 한다.

7. MINOR: [회귀 위험·검증 누락] `dashboard/tests/isolation/rls-crud-boundary.db.test.ts:6` : “모든 테넌트 테이블” 목록에 새 `operational_incidents`가 없다 / `dashboard/db/rls.sql:37`은 이 테이블도 보호 대상으로 선언한다 / incident RLS나 FORCE RLS를 제거해도 경계 테스트가 통과한다 / 목록에 추가하고 A 문맥에서 B 사건의 읽기, 쓰기, 수정, 삭제 거절을 실 DB로 확인해야 한다.

8. MINOR: [회귀 위험·가독성] `dashboard/src/components/operator/OperationalIncidentPanel.tsx:33` : incident source enum에 있는 LinkedIn, Pinterest, Tumblr, TikTok, LINE, Naver Blog가 라벨 맵에 없어 전부 “외부 서비스”로 보인다 / 운영자 화면이 장애 서비스를 식별해야 한다는 사건 장부 계약과 어긋난다 / LinkedIn 토큰 만료 사건을 열어도 어느 서비스인지 구분할 수 없다 / `IncidentSource` 전체를 강제하는 exhaustive label map을 사용해야 한다.

9. MINOR: [회귀 위험·복구성] `dashboard/src/components/home/PerformanceRoom.tsx:255` : 최초 조회 전에 post ID를 요청 완료 집합에 넣고 실패 시 제거하지 않으며 `:614`에도 재시도 단추가 없다 / 일시 실패 뒤 다시 읽을 수 있어야 한다는 기본 복구 계약과 어긋난다 / 첫 GET만 실패시키면 같은 세션에서 해당 게시물 댓글은 다시 요청되지 않는다 / 실패 시 집합에서 제거하거나 명시적 재시도를 제공해야 한다.

## 확인한 정상 경계

- `dashboard/src/lib/studio/generation/repository.ts:101` : 같은 날짜의 동시 무료 재생성은 회원 전역 UNIQUE와 단일 트랜잭션으로 한 요청만 성공한다. 실제 PostgreSQL 경합 재현에서 확인했다.
- `dashboard/src/lib/studio/generation/repository.ts:57` : 생성 멱등 키는 같은 본문을 재생하고 다른 본문을 409로 거절한다. DB 통합 시험에서 확인했다.
- `dashboard/src/lib/db.ts:40` : 정상 적용된 스키마에서는 `SET LOCAL ROLE osmu_service`와 tenant 설정을 같은 트랜잭션에 두고, `dashboard/db/rls.sql:37`은 신규 6개 테이블에 ENABLE, FORCE, USING, WITH CHECK를 적용한다.
- `dashboard/src/lib/tenant-auth.ts:142` : 현재 engagement HTTP 경로는 토큰 tenant를 사용하고 `dashboard/src/lib/engagement-service.ts:42`가 게시물 tenant를 다시 제한한다. 요청 body tenant로 B 작업 공간에 닿는 경로는 찾지 못했다.
- `dashboard/src/lib/studio/shorts-factory/service.ts:64` : 정상 프로세스 안에서는 worker cursor가 요청 동시성 상한을 지키고 한 컨셉 실패가 나머지 일곱 개를 죽이지 않는다. 집중 시험에서 확인했다.
- `dashboard/src/app/api/publish/route.ts:377` : API 응답 자체는 첫 댓글 실패를 `partial`로 표시한다. 거짓 성공은 이 값을 버리는 화면 처리에서 발생한다.
- 지정 범위의 삭제 파일과 삭제된 테스트는 0건이다. 온보딩 채널 연결 삭제는 커밋 `a8eb113b`와 요구 대장 R89에 사유가 있다.
- 지정 범위의 추가 줄에서 새 긴 대시, 이모지, 금지된 영문 행동 단추는 찾지 못했다. `Publish`는 요구 대장 R192와 v63 프로토타입 `:13990`이 유지 대상으로 정한다.

## 검증

- 관련 Vitest 8파일 31건 통과. 기존 시험에는 위 동시 요청, 외부 부작용 뒤 DB 실패, 시간대 변경, storage 차단 재현이 없다.
- UI 토큰 감사 명령은 위반 0건으로 통과했지만, `DESIGN.md`의 정확한 토큰값과 소비 여부 차이는 잡지 못했다.
- PostgreSQL 공식 문서는 RLS가 행 접근을 정책으로 제한하고, `ON CONFLICT`가 지정한 유일성 제약을 전제로 동작한다고 명시한다. 현재 정상 적용된 정책 자체와 무중단 마이그레이션 안전성은 별개다.

## 셀프심문

내가 PASS를 준다면 회장이 dev에서 직접 써보고 발견할 가장 그럴듯한 문제는, 편집실에서 줄과 속도를 바꿔 저장했는데 새로고침 뒤 원상복구되는 거짓 편집, Instagram과 YouTube 댓글이 있어도 성과실이 비는 현상, 첫 댓글이 실패했는데도 발행 완료로 뜨는 현상이다. 모두 위 MAJOR에서 코드 경로를 확인했다.

SKILLS_USED: review

SOURCES: 승인 PRD v8.2.1, `pipeline-state.osmu.md`, `docs/prototype/openclaw-auto-4room-v63.html`, `DESIGN.md`, 요구 대장 R27·R89·R147·R182·R185·R197·R201, OSMU 사업좌표, 지정 diff, PostgreSQL Row Security와 Transaction Isolation 및 INSERT ON CONFLICT 공식 문서, YouTube Data API `commentThreads`, `comments.insert`, `comments.list` 공식 문서.

MODEL: gpt-codex/gpt-5.6-sol

## 4축 판정

- 승인 시안 이탈: 지적 10건.
- 회귀 위험: 지적 29건.
- 토큰 위반: 지적 6건.
- 무기록 삭제: 문제없음. 삭제 파일과 삭제 테스트 0건이며 확인된 기능 제거는 커밋 또는 확정 요구에 사유가 있다.

REVIEW_VERDICT: BLOCK
