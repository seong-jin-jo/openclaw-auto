# OSMU 코드 리뷰 2026-08-29

STAMP | line: osmu | 생성: 2026-08-29 00:20 KST | model: gpt-codex/gpt-5.6-sol | agent: code-reviewer | skill: review | 고민: 정상 흐름 통과가 격리와 부분 실패 경로의 안전을 증명하는지 끝까지 분리해 판정했다.

검토 범위: 2026-08-28 00:04 KST부터 리뷰 시작 시점까지의 커밋. 첫 대상 `856ab35e`, 마지막 대상 `50e1c56b`, 기준 부모 `fd80e594`, 총 104개 커밋, 2,423개 파일 변경이다. 소스는 수정하지 않았다.

기반 산출물:

- 승인 및 지정 시안: `docs/prototype/openclaw-auto-4room-v63.html`
- 회장 확정 요구: `docs/requests/회장-확정-요구사항-대장.md`
- 사업 좌표: `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`
- 디자인 정본: `DESIGN.md`
- 런타임 상태: `pipeline-state.osmu.md`, `session-state.osmu.md`

직접 관찰 증거:

- `http://localhost:3456/api/health`: HTTP 200, DB `up`
- `dashboard/scripts/verify-basic-flow-e2e.mjs`: 실제 작업 공간에서 11단계 중 11단계 통과
- `dashboard/scripts/verify-studio-v1-e2e.mjs`: 실제 Studio 계약 12건 중 12건 통과
- `npm run test`: 187파일, 1,338건 통과, 4건 조건부 스킵
- `npx tsc --noEmit`: 종료 코드 0
- `git diff --check`: 실패. 이번 범위에 후행 공백과 EOF 빈 줄 위반이 남아 있다.

위 정상 경로는 아래의 작업 공간 전환, 외부 성공 뒤 내부 실패, 병렬 복구 경합, 51번째 댓글을 재현하지 않는다. 따라서 통과 수치만으로 머지를 허용할 수 없다.

## MAJOR

1. MAJOR: [회귀 위험·돈] `dashboard/db/schema.sql:121` : 배포가 새 앱을 띄우기 전에 기존 작업 공간 포함 UNIQUE를 제거하고 회원 전역 UNIQUE로 바꾼다 / `.github/workflows/deploy-marketing.yml:88`은 스키마를 먼저 적용하고, 이전 컨테이너는 제거된 충돌 대상을 계속 사용한다. 사업 좌표 59행의 "몫, 멱등이 실제로 지켜져야 한다"와 어긋난다 / 재현: 이전 앱이 서비스 중인 배포 창에 생성 요청을 보내면 PostgreSQL `42P10`이 나며, 기존 작업 공간 사이 중복이 있으면 새 UNIQUE 추가도 `23505`로 중단된다 / 수정 방향: 기존 UNIQUE 유지, 전역 중복 정리, 새 앱 전환, 옛 UNIQUE 제거를 서로 다른 expand-contract 배포로 나눠야 한다.

2. MAJOR: [회귀 위험·돈] `dashboard/db/schema.sql:138` : 회원 전역 하루 무료 재생성 장부가 작업 공간 삭제에 연쇄 삭제된다 / 요구 대장 R27의 "하루 1회 무료 재생성, 그 이상 과금"과 사업 좌표 59행의 과금 장부 지속성에 어긋난다 / 재현: 회원이 작업 공간 A에서 무료 몫을 쓴 뒤 A를 삭제하고 같은 날 작업 공간 B에서 재생성하면 UNIQUE 장부가 사라져 다시 무료 처리된다 / 수정 방향: 무료 몫 장부의 소유와 보존 기간을 작업 공간 생명주기에서 분리하고 과금 감사 기간 동안 삭제하지 않아야 한다.

3. MAJOR: [회귀 위험·격리] `dashboard/src/app/studio/page.tsx:260` : 최근 추가된 표시 이름, 해시태그, 검토 큐 ID, 제작 갈래까지 작업 공간 구분 없는 `studio_work` 한 키에 저장한다 / 사업 좌표 49행의 "여섯 사업체가 같은 물건을 쓴다"는 작업 공간 독립 계약에 어긋난다 / 재현: A 작업 공간에서 초안과 계정을 고른 뒤 같은 브라우저에서 B로 전환하면 A 데이터가 복원되고, 발행 요청은 현재 `activeWorkspace.id`인 B로 저장 및 전송된다 / 수정 방향: 회원과 작업 공간을 포함한 키로 분리하고 작업 공간 변경 시 메모리 상태를 원자적으로 비우며, 서버에서도 초안과 큐 소유권을 다시 검증해야 한다.

4. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/app/studio/page.tsx:509` : URL의 `draft_id`를 큐 항목에 저장된 초안보다 우선한다 / 요구 대장 R193의 "인박스나 캘린더 영역에서 발행실로 오도록 잘 연결"과 v63 시안 13768행의 줄마다 같은 작업물로 돌아가는 계약에 어긋난다 / 재현: 같은 작업 공간의 큐 A와 초안 B를 `queue_id=A&draft_id=B`로 열면 B 본문을 불러오면서 `reviewQueueId`는 A로 남아, A를 고치는 화면처럼 보인 채 B를 발행할 수 있다 / 수정 방향: 초안 ID는 tenant-scoped 큐 레코드에서만 도출하고 URL 값과 다르면 400 또는 안전한 오류로 거절해야 한다.

5. MAJOR: [회귀 위험·동시성·돈] `dashboard/src/app/studio/page.tsx:402` : 병렬 발행으로 바꾸면서 외부 성공 뒤 내부 기록 실패 복구값은 단일 변수 하나를 공유한다 / 사업 좌표 59행의 멱등과 비용 계약에 어긋난다 / 재현: 두 플랫폼이 모두 외부 발행에는 성공하고 내부 기록에 실패하면 각 Promise가 425행의 `pendingReconciliation`을 덮어써 마지막 한 플랫폼만 저장한다. 다른 플랫폼의 재발행 금지 근거가 사라져 중복 게시가 가능하다 / 수정 방향: 플랫폼과 시도 ID별 복구 맵을 저장하고 전 항목이 복구되기 전에는 재발행을 닫아야 한다.

6. MAJOR: [회귀 위험·부분 실패·동시성] `dashboard/src/lib/queue-add.ts:132` : 파일 큐를 먼저 성공시킨 뒤 DB 미러를 실행하므로 두 저장소가 하나의 성공 단위가 아니다 / 사업 좌표 59행의 멱등 계약과 부분 실패 정직성에 어긋난다 / 재현: 82행의 `mutateJson` 성공 직후 DB 미러만 실패시키면 API는 500이지만 큐에는 항목이 남는다. Studio 검토 요청은 idempotency key를 보내지 않아 재시도 때 둘째 큐 항목을 만든다 / 수정 방향: 호출자 멱등 키를 강제하고, DB 선기록과 outbox 또는 재조정 가능한 단일 쓰기 모델로 바꿔야 한다.

7. MAJOR: [회귀 위험·부분 실패·거짓 성공] `dashboard/src/app/api/operator/customers/route.ts:140` : `auth.users` 조회 실패를 빈 배열로 바꾸고 155행에서 HTTP 200을 반환한다 / 운영자가 가입자와 작업 공간을 한 화면에서 판단해야 하는 계약과 어긋난다 / 재현: `auth.users` 권한이나 스키마 조회만 실패시키면 화면은 오류를 표시하지 않고 가입자 0명으로 렌더한다. 응답의 `authUsersUnavailable` 필드는 화면 타입과 렌더 경로에서 읽지 않는다 / 수정 방향: 부분 응답을 구조화된 degraded 상태로 표시하거나 핵심 가입자 장부 조회 실패는 5xx로 닫아야 한다.

8. MAJOR: [회귀 위험·동시성·부분 실패] `dashboard/src/app/api/schedule/publish-due/route.ts:123` : 외부 발행 성공 뒤 기록 저장이 실패하면 스케줄 마감 전에 예외가 빠져나간다 / 부분 성공을 전체 성공으로 세지 않고 실패 채널만 재시도해야 한다는 발행 계약에 어긋난다 / 재현: 공급자 게시 성공 뒤 `recordPublishedPost`만 실패시키면 요청은 500이고 일정은 177행에서 바뀐 `processing`에 영구 잔류한다. 다음 실행은 `scheduled`만 claim한다 / 수정 방향: 채널별 외부 성공 증거와 불확정 상태를 먼저 보존하고 stale lease 회수 및 실패 채널 전용 재조정을 둬야 한다.

9. MAJOR: [회귀 위험·부분 실패·외부 부작용] `dashboard/src/lib/engagement-service.ts:141` : 공급자 답글 성공 뒤 DB 완료 기록이 실패할 때 복구 상태와 재조정 경로가 없다 / 댓글 행동을 거짓 성공 또는 영구 진행 중으로 남기지 않아야 하는 계약에 어긋난다 / 재현: 공급자가 공개 답글을 만든 뒤 `completeReply`만 실패시키면 행은 `replying`에 남고 이후 호출은 계속 충돌한다 / 수정 방향: 공급자 외부 ID를 가진 `uncertain` 상태와 조회 기반 reconciliation, 운영자 재조정 경로를 둬야 한다.

10. MAJOR: [회귀 위험·기능 누락] `dashboard/src/lib/engagement-service.ts:97` : 공급자 댓글 첫 페이지 최대 50건 안에서만 행동 대상 소유권을 확인한다 / 요구 대장 R185의 댓글 관리 범위와 v63 시안 13810행의 댓글 스트림 계약에 임의의 첫 50건 제한은 없다 / 재현: 51번째 댓글은 목록에도 없고 ID를 직접 보내도 404가 되어 답글, 좋아요, 보류, 편집실 인계가 전부 막힌다 / 수정 방향: cursor 입력과 추가 로드를 연결하고 mutation은 단건 조회 또는 안전한 페이지 탐색으로 검증해야 한다.

11. MAJOR: [회귀 위험·공급자 계약] `dashboard/src/lib/engagement-provider.ts:124` : YouTube 중첩 답글을 최상위 댓글과 같은 행동 항목으로 펼친다 / YouTube 답글 API가 요구하는 최상위 parent ID 계약과 어긋난다 / 재현: 기존 중첩 답글 행에서 답글 보내기를 누르면 그 답글 ID를 parent로 전달해 공급자 오류가 나고, 내장 replies가 부분집합이라 누락도 생긴다 / 수정 방향: 최상위 댓글 ID와 reply 가능 여부를 별도 보존하고 전체 답글은 전용 목록 API로 보충해야 한다.

12. MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/components/home/PerformanceRoom.tsx:237` : 댓글 조회 대상을 수집 지표의 `replies > 0`인 글로만 제한한다 / v63 시안 13810행의 채널 댓글 스트림은 지표 수집 여부와 무관해야 한다 / 재현: Instagram, Facebook, YouTube 게시물에 실제 댓글이 있어도 `replies`가 NULL 또는 0이면 `/api/engagement` 요청 자체가 발생하지 않는다 / 수정 방향: 지표와 댓글 탐색을 분리하고 댓글 읽기 지원 채널의 게시물을 지연 조회해야 한다.

13. MAJOR: [승인 시안 이탈] `dashboard/src/components/home/PerformanceRoom.tsx:543` : 댓글 화면이 왼쪽 분류와 가운데 스트림 두 열뿐이며 채널 필터와 오른쪽 자동화 상태가 없다 / v63 시안 13810행은 "왼쪽 = 무엇부터 볼지 고르는 레일과 채널. 가운데 = 댓글 스트림. 오른쪽 = 지금 켜 둔 자동"이라고 확정했다 / 재현: 성과실을 열면 채널별 필터, 자동 좋아요, 자동 답글, 영업 문의 상태를 확인할 수 없다 / 수정 방향: 승인된 세 열과 두 부품을 복구하거나 상류 시안을 다시 승인받아야 한다.

14. MAJOR: [회귀 위험·거짓 성공·돈] `dashboard/src/lib/studio/shorts-factory/service.ts:87` : 생성 성공과 성공 상태 기록을 같은 try로 묶어 기록 실패도 컨셉 생성 실패로 덮는다 / 사업 좌표 51행의 여덟 컨셉 공장과 59행의 비용 계약에 어긋난다 / 재현: Studio 작업 생성은 성공시키고 `markConceptSucceeded`만 실패시키면 95행이 컨셉을 실패로 기록하고 다음 실행에서 같은 컨셉을 다시 만들어 비용이 중복된다 / 수정 방향: 생성 실패와 기록 실패를 분리하고 job ID를 가진 reconciliation 상태에서 성공 기록만 멱등 재시도해야 한다.

15. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/components/studio/StudioRooms.tsx:194` : `빼기`와 무음 줄이기가 `visibleLines` 로컬 상태만 바꾸고 저장 payload를 갱신하지 않는다 / v63 시안 13995행의 "빼기를 누르면 그 컷이 빠지고 길이 초가 즉시 다시 계산" 계약과 어긋난다 / 재현: 줄을 뺀 뒤 편집 작업물로 저장하고 새로고침하면 `StudioCommandPanel.tsx:148`이 원래 줄을 다시 저장해 삭제한 컷이 되살아난다 / 수정 방향: 줄 가시성과 삭제 상태를 revision 있는 handoff에 원자적으로 저장해야 한다.

16. MAJOR: [승인 시안 이탈·거짓 조작] `dashboard/src/components/studio/StudioRooms.tsx:181` : 비율, 배경, 목소리, 속도, 자막 값이 로컬 화면 상태에만 있고 저장 및 미디어 생성 계약으로 전달되지 않는다 / 요구 대장 R182와 v63 시안 13878행의 작은 아이콘 실제 편집 조작 계약에 어긋난다 / 재현: 값을 바꾼 뒤 저장하거나 새로고침하면 기본값으로 돌아가고 생성 자산도 변하지 않는다 / 수정 방향: 선택값을 편집 revision에 포함하고 백엔드 적용 결과와 연결해야 한다.

17. MAJOR: [승인 시안 이탈·기능 누락] `dashboard/src/components/studio/StudioRooms.tsx:206` : 음악 편집은 준비 중 자리표시자이고 실제 파일, 파형, 배경음악, 볼륨 조작이 없다 / 요구 대장 R147과 v63 시안 13878행의 음악 갈래 계약에 어긋난다 / 재현: `editKind=audio`로 열면 나레이션 문장만 보이고 저장 가능한 음악 자산과 조작이 없다 / 수정 방향: 목소리, 배경음악, 볼륨과 audio handoff 저장 경로가 연결되기 전에는 기능 완료로 세면 안 된다.

18. MAJOR: [승인 시안 이탈] `dashboard/src/components/studio/PlatformPreview.tsx:80` : 미리보기 게시물 아래에 별도 입력 판을 붙였고 실제 표시 이름과 본문 글자는 읽기 전용이다 / 요구 대장 R197과 `DESIGN.md:542`의 "미리보기 글자 그 자리에서 고친다. 별도 판, 서랍, 톱니를 두지 않는다"에 어긋난다 / 재현: 실제 게시물의 handle이나 캡션을 눌러도 편집되지 않고 아래 폼으로 내려가야 한다 / 수정 방향: 미리보기 글자 자체에 IME, Enter, Esc를 포함한 제자리 편집 계약을 적용해야 한다.

19. MAJOR: [승인 시안 이탈·회귀 위험] `dashboard/src/components/home/PerformanceRoom.tsx:604` : 모든 댓글에 편집실 단추를 노출하면서 인계 URL에는 댓글 ID만 있고, Studio는 490행에서 그 ID를 읽은 뒤 수정 요청 본문을 사용하지 않는다 / v63 시안 13768행의 "고칠 것이 보이면 그 자리에서 돌아간다"는 조건부 인계 계약에 어긋난다 / 재현: 일반 칭찬 댓글에도 편집실 단추가 보이고, "두 번째 장 글자가 작다"는 요청을 넘겨도 편집실에는 원본 초안만 열린다 / 수정 방향: 수정 요청으로 분류된 댓글에만 단추를 보이고 댓글 본문, 대상 초안, 수정 의도를 tenant-scoped handoff로 묶어야 한다.

20. MAJOR: [승인 시안 이탈] `dashboard/src/components/layout/Sidebar.tsx:271` : 운영자 내비게이션에는 고객 관리만 있고 운영 알림 화면으로 가는 독립 진입로가 없다 / v63 시안 13797행의 별도 Alerts와 운영 알림 계약에 어긋난다 / 재현: 운영자는 고객 관리 화면 안에 묻힌 사건 패널을 직접 찾아 내려가야 하며 알림 화면으로 바로 갈 수 없다 / 수정 방향: 별도 알림 내비게이션과 화면을 제공하거나 단일 화면 결정을 상류에서 다시 승인받아야 한다.

21. MAJOR: [회귀 위험·인수인계 단절] `AGENTS.md:9` : wiki 재배치 커밋이 `wiki/ops/session-state.md`를 옮겼지만 모든 시작 및 종료 규칙은 삭제된 옛 경로를 계속 가리킨다 / 저장소 자체 규칙의 "durable handoff layer"와 어긋난다 / 재현: 새 세션이 AGENTS 순서대로 시작하면 2단계에서 파일 없음으로 실패하고, 실제 최신 상태인 `session-state.osmu.md` 또는 `wiki/3-operations/session-state.md`를 찾지 못한다 / 수정 방향: 정본 위치를 하나로 확정하고 AGENTS, CLAUDE, lint, stop hook 소비자를 같은 커밋에서 갱신해야 한다.

22. MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/app/blog/page.tsx:273` : 행동 단추에 금지된 영문 라벨 `Approve`를 섞었고 같은 화면에 `Queue로 돌아가기`, `Queue로 가기`도 추가했다 / 과제의 "영문 단추 라벨 금지"와 어긋난다 / 재현: 블로그 편집 화면을 열면 한국어 단추 사이에 `저장 + Approve`가 보인다 / 수정 방향: 승인된 한국어 행동명으로 통일하고 사용자 화면의 영문 내비게이션 라벨을 전수 제거해야 한다.

23. MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/settings/LlmModel.tsx:86` : 저장 단추가 `Saving...`, `Update`, `Save` 세 영문 상태를 그대로 노출한다 / 과제의 "영문 단추 라벨 금지"와 어긋난다 / 재현: AI 모델 설정을 편집하고 저장하면 단추 라벨 전 상태가 영문으로 바뀐다 / 수정 방향: `저장 중`, `수정`, `저장`처럼 한국어 상태 계약으로 통일해야 한다.

24. MAJOR: [승인 시안 이탈·확정 문구] `dashboard/src/components/settings/AiKeySettings.tsx:30` : 성공 문구 앞에 금지된 체크 기호를 새로 추가하고 렌더 분기까지 그 문자에 의존한다 / 과제의 "이모지 금지"와 어긋난다 / 재현: Claude 키 저장 성공 시 장식 문자가 사용자 문구에 노출된다 / 수정 방향: 의미는 상태 토큰과 평문으로 전달하고 장식 문자를 로직 키로 사용하지 않아야 한다.

25. MAJOR: [회귀 위험·기능 단절] `dashboard/src/components/shared/OnboardingWizard.tsx:100` : sessionStorage 쓰기가 막히면 생성실 이동을 조용히 취소한다 / 요구 대장 R89의 채널 연결 없이 첫 제작 진입 계약에 어긋난다 / 재현: 저장소 접근이 `SecurityError`를 던지는 브라우저에서 주 단추를 눌러도 101행에서 반환해 화면 이동과 오류 안내가 모두 없다 / 수정 방향: 저장 실패와 무관하게 라우팅하고 갈래는 URL 또는 서버 상태로 전달해야 한다.

## MINOR

1. MINOR: [토큰 위반] `dashboard/src/components/home/PerformanceRoom.tsx:543` : 댓글 레일 폭을 임의값 `12rem`으로 박았다 / `DESIGN.md`의 명명된 간격과 임의값 금지 계약에 어긋난다 / 재현: 레일 폭을 조정하려면 컴포넌트 리터럴을 직접 찾아야 한다 / 수정 방향: 의미 있는 레일 폭 토큰으로 승격해 참조해야 한다.

2. MINOR: [토큰 위반] `dashboard/src/components/studio/StudioRooms.tsx:200` : 편집실 목차 폭을 임의값 `15rem`으로 박았다 / v63 시안 13878행의 214px 목차 기둥과 `DESIGN.md` 토큰 계약 어디에도 없는 값이다 / 재현: 승인 시안과 폭이 달라도 UI 토큰 감사는 통과한다 / 수정 방향: 승인된 목차 폭을 레이아웃 토큰으로 정의해야 한다.

3. MINOR: [토큰 위반] `dashboard/src/app/inbox/page.tsx:259` : 미디어 폭 `240px`와 본문 높이 `80px`를 임의 Tailwind 값으로 넣었다 / `DESIGN.md`의 직접 시각값 금지 계약에 어긋난다 / 재현: 토큰을 바꿔도 인박스 미디어와 본문 크기는 따라가지 않는다 / 수정 방향: 미디어 카드 폭과 본문 최소 높이를 명명된 토큰으로 치환해야 한다.

4. MINOR: [토큰 위반] `dashboard/src/components/studio/PlatformPreview.tsx:151` : 공용 아이콘 크기를 `18px` 리터럴로 박았다 / 명명된 아이콘 크기와 직접 시각값 금지 계약에 어긋난다 / 재현: 미리보기 아이콘만 전역 크기 토큰 변경에서 빠진다 / 수정 방향: 공용 아이콘 크기 토큰 또는 기존 유틸리티를 사용해야 한다.

5. MINOR: [회귀 위험·가독성] `docs/prototype/openclaw-auto-4room-v63.html:7555` : 이번 범위의 정본 시안에 후행 공백이 남아 있고 `git diff --check`가 전체 범위에서 실패한다 / 커밋 가능한 변경은 기본 무결성 검사를 통과해야 한다는 개발 품질 기준과 어긋난다 / 재현: 지정 범위에 `git diff --check`를 실행하면 v63을 포함한 여러 산출물에서 실패한다 / 수정 방향: 기능 수정과 분리된 정리 커밋으로 후행 공백과 EOF 빈 줄을 제거하고 CI에 diff check를 추가해야 한다.

## 확인한 정상 경계

- 직접 API 기본 흐름은 생성, 편집 인계, 장면 순서 변경, 문장 삭제와 복원, 발행 큐 인계, 성과 제안 재인계까지 11단계 모두 통과했다.
- Studio 생성 API는 인증 없음 401, 멱등 키 없음 400, 빈 본문 422, 생성 201, 조회 200과 404, 시간대가 다른 무료 재생성 최대 1회 계약을 실제 앱에서 통과했다.
- 전체 Vitest와 TypeScript는 통과했다. 이 테스트 묶음에는 M3, M4, M5, M6, M7, M8, M9, M10의 재현이 없다.
- 지정 범위의 삭제 파일은 wiki 색인 7개뿐이며 커밋 `ad056aac`가 A안 재배치 사유를 기록했다. 무기록 삭제 자체는 찾지 못했다. 다만 M21처럼 옛 경로 소비자를 갱신하지 않은 회귀는 남았다.
- 지정 범위의 추가 줄에서 새 사용자용 긴 대시는 찾지 못했다. 금지된 "지금 여기"와 "다음" 사족도 현재 사이드바에서는 찾지 못했다.

## 셀프심문

질문: 내가 PASS를 준다면, 회장이 dev에서 직접 써보고 발견할 가장 그럴듯한 문제는 무엇인가?

답: 작업 공간 A에서 만든 초안을 둔 채 B로 전환했는데 A 문구와 검토 큐가 그대로 살아 있고 B 이름으로 발행되는 문제다. 이는 M3에서 확인한 격리 위반이며 머지 뒤 직접 사용에서 가장 쉽게 드러난다. 따라서 PASS는 성립하지 않는다.

## 4축 판정

- 승인 시안 이탈: 지적 13건. M4, M12, M13, M15부터 M20, M22부터 M25.
- 회귀 위험: 지적 18건. M1부터 M12, M14부터 M16, M19, M21, M25.
- 토큰 위반: 지적 4건. MINOR 1부터 4.
- 무기록 삭제: 문제없음. 삭제 7건은 커밋 `ad056aac`에 재배치 사유가 있다. 소비자 경로 갱신 누락은 M21로 별도 차단했다.

REVIEW_VERDICT: BLOCK

SKILLS_USED: review. 커밋 범위 고정, diff 공격 검토, 필수 검증, 완료 증거 분리 방법론에 사용했다.

SKILLS_SKIPPED: QA 수정 스킬은 코드 수정 금지와 충돌해 사용하지 않았다. 디자인 생성, 콘텐츠 생성 스킬은 코드 리뷰 범위가 아니어서 사용하지 않았다.

SOURCES: `pipeline-state.osmu.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | `docs/audit/osmu-code-review-2026-08-28.md` | https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html | https://www.postgresql.org/docs/17/ddl-rowsecurity.html | https://www.postgresql.org/docs/18/functions-admin.html | https://nextjs.org/docs/app/api-reference/functions/use-search-params

MODEL: gpt-codex/gpt-5.6-sol
