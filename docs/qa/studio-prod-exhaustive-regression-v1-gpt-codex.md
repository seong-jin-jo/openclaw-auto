# Studio 운영 Exhaustive 회귀 QA v1

<!--
STAMP
line: studio
artifact: prod-exhaustive-regression
version: v1
created_at: 2026-08-29 03:21 KST
model: gpt-codex/gpt-5.6-sol
agent: qa-verifier
skills: qa
evidence: 운영 Supabase QA 계정, 운영 브라우저 390·1440, 운영 API·콘솔·네트워크, design lint
evidence_urls: https://playwright.dev/docs/auth | https://supabase.com/docs/guides/auth/sessions | https://www.w3.org/WAI/tutorials/page-structure/headings/
deliberation: 외부 SNS 게시와 유료 재생성은 만들지 않으면서 고객이 실제로 밟는 인증, 제작, 저장, 발행 실패 경계까지 확인했다.
-->

## 한 줄 판정

운영 로그인, 후보 세 장 생성, 카드뉴스 편집 저장, 발행 준비 큐 인계, 네 방 390·1440 렌더는 동작한다. 그러나 만료된 고객 세션이 운영자 콘솔로 이동하고, 연결 채널 0개에서도 발행 단추가 활성화되며, 생성 입력 보존과 중복 클릭 방지가 깨진다. 따라서 운영 Exhaustive 회귀는 **NG**, 배포 전체 승인은 보류다.

## 범위와 안전 경계

| 항목 | 범위 |
|---|---|
| 대상 | `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud`, main `72afa863` 배포 run `33195231594` |
| 인증 | 실제 Supabase QA 고객 계정, `/api/me` 200 복구 확인 |
| 뷰포트 | 데스크톱 1440×1000, 모바일 390×844 |
| 포함 | 세션 만료·복구, 네 방 왕복, 생성 validation·중복 클릭, 후보 선택, 편집 저장·복귀, 발행 채널 0개·부분 선택·오류 UI, 접근성·콘솔·네트워크 |
| 제외 | 실제 외부 SNS 게시, 유료 재생성, 유료 모델 추가 호출, 실제 provider 계정 연결 |
| 제품 코드 | 수정 0건. 결함은 컨트롤러 회수만 수행 |

## 건강 점수

**74/100, 배포 전체 승인 보류.** 기능과 사용자 경험에서 핵심 결함이 남았으며, 모바일과 데스크톱 레이아웃 자체는 가로 넘침 없이 렌더됐다.

| 범주 | 점수 | 근거 |
|---|---:|---|
| Console | 70 | 만료 세션 `/api/me` 401, 미연결 Threads `/api/publish` 400. Supabase client 중복 경고도 관찰 |
| Links | 100 | 네 방 링크, 편집 인계, 발행실 진입에서 깨진 링크 0 |
| Visual | 100 | 390·1440 네 방 가로 넘침 0. 전체 디자인 정합 승인을 뜻하지 않음 |
| Functional | 38 | High 2건, Medium 4건 |
| UX | 54 | 만료 고객의 운영자 화면 이동, 미연결 채널의 거짓 발행 준비, 입력 유실 |
| Performance | 92 | 생성 단추 연타가 같은 POST를 두 번 전송 |
| Content | 92 | 고객에게 내부 환경 변수명 `DASHBOARD_AUTH_TOKEN` 노출 |
| Accessibility | 94 | Studio 세 방에 h1·h2 0, 성과실에 `<main>` 2개. 보이는 입력의 접근 가능한 이름 누락은 0 |

## 회귀 결과

| 테스트번호 | 테스트 | 판정 | 직접 관찰 증거 |
|---|---|---|---|
| EXH-AUTH-01 | 유효 세션 새로고침과 복구 | PASS | 복구 뒤 Studio 진입, `/api/me` 200 네 건 |
| EXH-AUTH-02 | 만료·손상 세션 처리 | NG | `/studio?room=create`가 `/operator`로 이동, `/api/me` 401, 운영자 토큰 화면 표시 |
| EXH-ROOM-01 | 네 방 왕복과 browser history | 부분 PASS | 네 방 진입과 편집·발행 작업물 1건 유지. 생성실 목적·대상·권리 동의는 유실 |
| EXH-GEN-01 | 생성 validation | PASS | 목적 없음, 대상 없음, 권리 미확인을 각각 문장으로 거절. 생성 요청 없음 |
| EXH-GEN-02 | 중복 클릭 | NG | 단추가 첫 클릭 뒤에도 enabled. generation POST 201 두 건 |
| EXH-GEN-03 | 후보 세 장과 선택 | PASS | A·B·C 3개, A 선택, 편집실 인계 |
| EXH-GEN-04 | 모두 거절 뒤 무료 재생성 | NG | 후보 단계에 선택 세 개만 있고 거절·재생성 제어 0. 유료·quota 부작용 때문에 API 우회 실행 안 함 |
| EXH-EDIT-01 | 대사 편집과 새로고침 | PASS | `[QA-EXH-0243]` 편집값이 방 복귀와 새로고침 뒤 유지 |
| EXH-EDIT-02 | 카드뉴스 저장과 발행 큐 인계 | PASS | `/api/studio/commands` 201, 작업물 전체 0→1, 발행 준비 큐 메시지 |
| EXH-EDIT-03 | 대체 원본 `글` 선택 | NG | 활성 `글` 단추를 두 번 눌러도 카드뉴스가 pressed 상태로 유지 |
| EXH-PUB-01 | 채널 0개 상태 | NG | 사이드바 `Social 0/5`인데 Threads·X·Instagram 기본 선택, `3곳에 올리기` enabled |
| EXH-PUB-02 | 부분 선택 | PASS | 3개→Threads 1개로 바꾸자 `1곳에 올리기`와 선택 상태 일치 |
| EXH-PUB-03 | 0개 선택 | NG | `0곳에 올리기` enabled, 클릭 뒤 draft POST 200을 보낸 다음에야 선택 안내 |
| EXH-PUB-04 | 미연결 채널 오류 UI | 범위 PASS | Threads만 선택해 호출하자 publish 400과 `Settings에서 토큰 등록 필요` 표시. 외부 게시 0 |
| EXH-RESP-01 | 390·1440 반응형 | PASS | 네 방 8화면 모두 `scrollWidth-clientWidth=0` |
| EXH-A11Y-01 | 핵심 접근성 | 부분 PASS | 보이는 interactive name 누락 0. Studio h1·h2 0, 성과실 main 2개로 landmark·heading 보정 필요 |
| EXH-CONSOLE-01 | 정상 흐름 console·network | PASS | 정상 네 방 왕복, 생성, 편집, 저장에서 console error 0, 예상 밖 non-2xx 0 |
| EXH-CONSOLE-02 | 거절 흐름 console·network | NG | 만료 세션 401과 미연결 publish 400이 console error로 기록 |

## 결함

### ISSUE-001 High: 만료 고객 세션이 고객 로그인 대신 운영자 콘솔로 이동

**발견:** 고객 토큰을 만료 상태로 만들고 Studio를 열면 `/operator`로 이동했다. 화면에는 운영자 토큰 입력과 내부 환경 변수명이 표시됐고 `/api/me`는 401이었다.

**의미:** 일반 고객은 세션이 끝났을 때 다시 로그인하는 대신 자신과 무관한 운영자 인증 화면을 본다. 복구 경로를 모르면 제작 중단으로 이어지며 내부 운영 경계도 불필요하게 노출된다.

재현:

1. 고객 세션으로 Studio를 연다.
2. 고객 access session을 만료·손상 상태로 만든다.
3. `/studio?room=create`를 새로 연다.
4. `/operator` 이동과 `DASHBOARD_AUTH_TOKEN으로 접속하세요`를 확인한다.

증거: [만료 세션 화면](osmu-prod-exhaustive-20260829/desktop-session-expired-redirect.png), [세션 복구 뒤 생성실](osmu-prod-exhaustive-20260829/desktop-session-restored.png)

### ISSUE-002 High: 연결 계정 0개인데 발행 대상이 기본 선택되고 publish 400까지 진행

**발견:** 사이드바는 `Social 0/5`지만 발행실은 Threads, X, Instagram을 기본 선택하고 `3곳에 올리기`를 활성화했다. Threads 한 곳을 눌렀을 때 `/api/publish` 400 뒤에야 미연결 안내가 나타났다.

**의미:** 고객은 계정이 연결된 것으로 오인하고 발행을 시도한다. 실제 게시가 되지 않아도 저장과 실패 요청이 발생하고, 발행 완료 기대가 오류 화면으로 끝난다.

재현:

1. 연결 SNS 계정이 0개인 QA tenant로 발행실을 연다.
2. 세 플랫폼이 기본 선택되고 발행 단추가 enabled인지 확인한다.
3. Threads 한 곳만 남기고 발행을 시도한다.
4. publish 400과 미연결 안내를 확인한다.

증거: [채널 0개 기본 선택](osmu-prod-exhaustive-20260829/desktop-publish-room-created-draft.png), [미연결 publish 오류](osmu-prod-exhaustive-20260829/issue-004-unconnected-thread-publish-error.png)

### ISSUE-003 Medium: 생성실은 주제만 남기고 목적·대상·권리 동의를 잃음

**발견:** 네 필드를 채운 뒤 편집실을 열었다가 생성실로 돌아오면 주제만 남고 목적, 대상, 권리 체크가 비었다. 새로고침과 390px에서도 동일했다.

**의미:** 사용자가 방을 확인한 뒤 돌아오면 생성에 필요한 세 값을 다시 입력해야 한다. 실수로 빈 학습 맥락을 보내거나 생성 자체를 포기할 수 있다.

증거: [왕복 전](osmu-prod-exhaustive-20260829/issue-001-state-before-roundtrip.png), [왕복 후](osmu-prod-exhaustive-20260829/issue-001-state-after-roundtrip.png)

### ISSUE-004 Medium: 후보 생성 연타가 POST 두 건을 보냄

**발견:** 첫 클릭 직후 단추는 disabled가 아니었다. 같은 이벤트 구간에 두 번 누르자 `/api/studio/v1/generations`가 201 두 건을 반환했다.

**의미:** 서버 멱등 수렴이 데이터 중복을 막더라도 네트워크와 생성 경로를 불필요하게 두 번 탄다. quota나 비용 경계가 바뀌면 중복 청구 위험으로 커질 수 있다.

증거: [중복 클릭 뒤 후보](osmu-prod-exhaustive-20260829/desktop-create-duplicate-click-result.png)

### ISSUE-005 Medium: 후보 셋 모두 거절·무료 재생성 UI가 없음

**발견:** 후보 단계에 `A안 선택`, `B안 선택`, `C안 선택`만 있고 거절이나 재생성 제어가 없다.

**의미:** R27의 사용자 흐름을 브라우저에서 시작할 수 없다. API 직접 호출은 quota와 과금 상태를 바꾸므로 이번 안전 범위에서 실행하지 않았다.

증거: [후보 선택 단계](osmu-prod-exhaustive-20260829/desktop-create-duplicate-click-result.png)

### ISSUE-006 Medium: 편집실의 `글` 선택 단추가 동작하지 않음

**발견:** 카드뉴스가 선택된 상태에서 enabled인 `글` 단추를 두 번 눌렀지만 `지금 만드는 것: 카드뉴스`와 카드뉴스 pressed 상태가 유지됐다.

**의미:** 영상 원본이 준비되지 않았을 때 제시되는 대체 원본 두 개 중 하나를 고를 수 없다. 카드뉴스 저장은 성공하지만 글 편집 흐름은 막힌다.

증거: [글 선택 뒤 카드뉴스 유지](osmu-prod-exhaustive-20260829/desktop-edit-cardnews-save.png)

### ISSUE-007 Low: 0개 선택 발행 단추가 활성화됨

**발견:** 모든 플랫폼을 해제해도 `0곳에 올리기`가 enabled였다. 누르면 draft POST 200을 보낸 뒤 `발행할 플랫폼을 선택하세요`를 표시했다.

**의미:** 로컬에서 막을 수 있는 입력 오류가 서버 왕복과 추가 draft 저장을 만든다.

증거: [0개 선택](osmu-prod-exhaustive-20260829/desktop-publish-zero-selected.png), [클릭 뒤 안내](osmu-prod-exhaustive-20260829/issue-003-zero-selected-click.png)

### ISSUE-008 Low: Studio heading과 landmark 구조가 약함

**발견:** 생성실, 편집실, 발행실은 h1·h2가 0개였다. 성과실은 `<main>`이 2개였다. 보이는 폼과 단추의 접근 가능한 이름 누락은 0개였다.

**의미:** 화면을 시각적으로 읽을 수 있어도 보조기술 사용자는 방 제목과 영역 구조를 빠르게 탐색하기 어렵다.

증거: [390 생성실](osmu-prod-exhaustive-20260829/mobile-390-create.png), [1440 성과실](osmu-prod-exhaustive-20260829/desktop-performance-refresh.png)

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R08 | 네 방 사용자 흐름 | EXH-ROOM-01, EXH-RESP-01 | 부분 PASS | 네 방 렌더·왕복은 성공, 생성 입력 3개 유실 |
| R27 | 후보 셋 거절 뒤 무료 재생성 | EXH-GEN-04 | NG | 재생성 UI 0 |
| R89 | 채널 연결 전에도 제작, 발행 때 연결 | EXH-PUB-01~04 | NG | 제작은 성공, 발행실은 0개 연결을 발행 가능으로 표시 |
| R104 | Studio 회원·권한 장부 | EXH-AUTH-01~02 | 부분 PASS | 유효 고객 세션 PASS, 만료 고객이 운영자 콘솔로 이동 |
| R128, R151, R165, R171, R175 | 기존 채널 연결 경로 유지 | EXH-PUB-01~04 | 부분 PASS | Settings 안내는 있음, readiness 선차단 없음 |
| R168 | 첫 생성과 학습 정보 | EXH-GEN-01~03 | 부분 PASS | validation과 후보 생성 PASS, 방 왕복 입력 유실과 중복 POST NG |
| R01~R207 | 확정 요구 전건 | REQ-ALL | 이월 | 전건 정본은 기존 요구 추적표 유지 |

## 디자인·파이프라인 경계

- `pipeline-state.osmu.md`의 승인 prototype 핀은 v38이고, 현재 design stage prototype은 v63 미승인이다.
- `current_stage: qa`이지만 `approved_stages: [plan]`, design status는 blocked다.
- `design-lint.sh dashboard/src`는 위반 0건이다.
- 이번 390·1440 캡처는 운영 기능 증거다. 승인 프로토타입과 3폭 matched-pair가 아니므로 전체 디자인 정합 PASS로 확대하지 않는다.

## 페르소나 결정 1문항

**김민서가 채널 연결 0개 상태에서 발행이 불가능한 이유와 다음 행동을 시도 전에 알 수 있는가?** NG다. 상단에서는 채널 연결 필요를 말하지만 발행실은 세 채널을 기본 선택하고 실행 단추를 활성화한다. 고객은 실패 요청 뒤에야 Settings 연결 안내를 받는다.

## 레드팀과 셀프심문

**레드팀:** 까다로운 고객은 후보가 보인 것보다 방을 오갔을 때 입력이 남는지, 발행 단추가 실제 연결 계정만 가리키는지 본다. 그래서 화면 진입 PASS를 확대하지 않고 상태보존과 readiness 실패를 별도 결함으로 판정했다.

**셀프심문:** 이 결론이 틀렸다면 가장 그럴듯한 이유는 테스트가 일부러 손상한 세션과 미연결 계정을 정상 사용자 흐름으로 과장한 경우다. 그러나 제품이 세션 만료와 계정 0개를 명시적으로 처리해야 하며, 실제 UI도 고객 로그인 링크와 채널 연결 안내를 갖고 있다. 문제는 그 정상 복구 화면으로 자동 수렴하지 않는 것이다.

## 정리 계획

- QA 계정과 tenant는 회귀 재사용을 위해 유지한다. 비밀 파일은 저장소 밖 권한 600으로 유지한다.
- QA가 만든 작업물 제목에는 `[QA-EXH-0243]`이 들어 있다. 결함 수정 재검증 뒤 해당 draft를 QA tenant 범위에서 삭제한다.
- 연결 채널은 0개이며 외부 SNS 게시물과 유료 부작용은 0건이다.

RUBRIC_SCORE: coverage=5/5 evidence=5/5 traceability=5/5 honesty=5/5 actionability=5/5 total=25/25
WEAKEST_LINE: 실제 provider 연결 계정이 없어 연결 성공 뒤 발행까지는 미검증이다.

SKILLS_USED: qa. Exhaustive 브라우저 회귀, health score, 결함 재현과 증거 캡처에 사용.
SKILLS_SKIPPED: 없음.

SOURCES: `pipeline-state.osmu.md` | `docs/requests/회장-확정-요구사항-대장.md` | `docs/plan/one-thing.md` | `docs/plan/persona.md` | `studio/docs/test-plan-studio-생성-v2.0.md` | https://playwright.dev/docs/auth | https://supabase.com/docs/guides/auth/sessions | https://www.w3.org/WAI/tutorials/page-structure/headings/

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
