# Marketing Agent v24 사용자 흐름

> STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer | skills=gstack browse workflow, manual design rubric | evidence=actual dashboard routes, v24 prototype, jsdom audit | deliberation=합성 14단계 이야기를 실제 owner route의 상태 전이로 교정

## 1. 흐름 원칙

- 고객 인증은 `/signup -> /login -> Google OAuth` 한 경로다.
- 콘텐츠 생성 원본은 `/studio`다. 채널 상세에서 별도 Create를 만들지 않는다.
- 연결 상태의 단일 소스는 `channel_accounts`다.
- Calendar는 읽기 전용 날짜 선택과 일정 목록이다. 편집은 Studio와 Inbox에서 한다.
- 외부 게시 결과가 불확실하면 재게시하지 않는다.
- Admin은 `/operator` 토큰 로그인 뒤 `/operator/customers` 단일 화면이다.

## 2. Happy path

1. `/signup` 요청이 `/login`으로 이동한다.
2. 사용자가 Google로 계속을 누르고 제공자 동의를 끝낸다.
3. Home 4단계 온보딩에서 작업 공간 이름과 첫 채널 연결을 시작한다.
4. Settings 또는 채널 연결 모달이 공식 제공자 화면으로 이동한다.
5. callback이 `channel_accounts`를 저장한다.
6. Home, Sidebar, Settings, Admin이 같은 연결 상태를 읽는다.
7. 사용자가 Studio에서 source, brand, idea를 입력한다.
8. 생성 결과를 7개 preview로 확인하고 공통 본문과 variant를 수정한다.
9. Save가 draft의 `idea + body + savedAt + status`를 저장한다.
10. 발행 이력에서 본문을 다시 불러와 수정한다.
11. Inbox에서 revision 차이, account, schedule을 확인하고 승인한다.
12. 즉시 발행 또는 SchedulePanel에서 platform, account, datetime을 고른다.
13. 외부 결과 확인 뒤 permalink와 provider result를 기록한다.
14. Home 통합 운영 블록과 channel Analytics에서 성과를 확인한다.

종료점: 모든 단계는 Home, Studio, Inbox, Settings 중 하나로 돌아갈 수 있다. dead-end 0.

## 3. Edge path

### 로그인 취소

`/login -> Google -> cancel -> /login`

- 사용자 데이터 생성 없음.
- 다시 시도 또는 닫기.

### OAuth 계정 종류 또는 권한 오류

`Settings -> provider -> callback error -> 연결 모달`

- 기존 account와 draft 보존.
- 고객이 해결할 계정 종류 문제와 운영자가 해결할 앱 credential 문제를 분리.
- 수정 뒤 같은 provider 재연결.

### 채널 연결은 됐지만 게시 준비 미확인

`channel_accounts saved -> readiness blocked -> Channel Settings`

- 연결됨을 게시 가능으로 표시하지 않음.
- Studio 초안 저장은 허용.
- publish CTA는 숨기거나 비활성.

### draft 본문 누락

`history row body missing -> load disabled -> Studio current input preserved`

- 오류 문구와 draft id만 운영 로그로 전달.
- 본문이 복구되기 전 수정과 발행으로 진행하지 않음.

### 부분 성공

`provider publish success -> internal record failure -> partial`

- 외부 재게시 금지.
- Admin에서 record repair만 실행.
- 결과 확인 후 Home 활동에 복구 기록.

### 결과 불확실

`publish request -> timeout -> unknown`

- 같은 요청 재전송 금지.
- result reconcile만 허용.
- 확정되면 published 또는 safe retry로 분기.

### 일정 변경

`Calendar item -> Studio or Inbox -> schedule edit -> approval invalidated`

- Calendar 자체에 편집 권한을 만들지 않음.
- 시간 또는 content 변경 시 재승인.

### 영상 provider 제한

`Studio video -> /videos -> provider blocked`

- script와 media edit 보존.
- 권리, 계정, 정책, quota 중 차단 이유 표시.
- 직접 export가 가능하면 제공, 가짜 success 금지.

## 4. Empty path

- Home: “채널 연결 -> Studio 첫 본문 저장” 한 행동.
- Studio: source 입력과 발행 이력 불러오기.
- Inbox: 검토 요청 없음, Studio 이동.
- Calendar: 선택일 일정 없음, Studio 이동.
- Channel Queue: Studio에서 만들기.
- Analytics: 실제 게시 확인 뒤 측정한다고 표시.
- Settings Channels: 첫 connect CTA.
- Admin: 가입자와 workspace 없음. OAuth accordion은 운영 설정으로 유지.

## 5. Loading path

- 전체 화면을 막지 않고 owner panel만 shimmer 또는 busy.
- Studio 생성 중에도 다른 preview와 draft history는 읽을 수 있다.
- OAuth callback 중에는 중복 connect 비활성.
- Publish 처리 중에는 해당 item만 비활성.
- Admin credential 저장 중에는 해당 provider accordion만 busy.

## 6. Error path

- 네트워크 조회 실패: 마지막 정상 데이터와 입력 보존, 새로 확인.
- generation 실패: Studio 상단 배너, 입력 보존, 다시 생성.
- OAuth credential store 실패: 재입력 요구 금지, DB 복구 후 새로고침.
- publish reject: provider reason, 수정 가능한 필드, safe retry 조건.
- analytics permission 실패: 0이 아니라 “수집할 수 없음”.
- video render 실패: script/media 보존, 해당 job retry 또는 export.

## 7. 운영자 path

1. `/operator`에서 운영자 토큰 입력.
2. `/operator/customers`로 이동.
3. 6개 운영 요약 확인.
4. 중앙 OAuth provider accordion에서 차단 provider 한 개를 연다.
5. callback과 required fields를 확인한다.
6. 모든 필드를 한 세트로 저장한다.
7. customer connection과 `channel_accounts`를 확인한다.
8. 필요 시 workspace를 정지 또는 재개한다.
9. secret 원문은 재인증과 사유 입력 후 30초만 확인한다.

금지: 고객 대신 콘텐츠 작성, 승인, 게시.

## 8. Dead-end audit

| 상태 | 다음 행동 | owner |
|---|---|---|
| no login | Google로 계속 | Login |
| no channel | 연결 시작 | Settings |
| no draft | Studio에서 만들기 | Studio |
| missing draft body | 복구 후 새로 확인 | Studio/Admin |
| approval needed | Inbox 열기 | Inbox |
| schedule change | Studio에서 수정 | Studio |
| publish unknown | 결과 확인 | Channel/Admin |
| record partial | 기록만 복구 | Admin |
| no metrics | 실제 게시 확인 | Home/Channel |
| provider blocked | Settings 또는 Admin | Settings/Admin |

판정: 문서상 dead-end 0. 실제 브라우저 전수 클릭은 결과 파일 open 금지로 미검증.

## 9. 회수 필요

- R02의 Admin 14개와 현재 코드 12개 정의의 버전 불일치. 누락 provider를 발명하지 않았다.
- Revenue와 Referral은 현재 구현이 없어서 AARRR 요약에서 목표로만 표시했다.
- 정책 요약은 R-06 의사결정 입력이다. Home 구현 범위로 자동 승격하면 plan reopen이 필요하다.

Red team: 경쟁자는 “연결 설정이 많아 activation이 느리다”고 공격할 수 있다. 고객은 개발자 앱 키를 직접 입력하지 않고 운영자가 중앙 설정을 맡으며, 고객 흐름은 공식 OAuth 동의로 제한한다.

셀프심문: 이 흐름이 틀렸다면 가장 그럴듯한 이유는 실제 코드의 API 성공이 실제 provider 발행 성공을 보장하지 않는다는 점이다. 그래서 provider result 확인 전 상태를 published로 종결하지 않았다.

SOURCES: `dashboard/src/app/login/page.tsx` | `dashboard/src/app/studio/page.tsx` | `dashboard/src/components/channel/ChannelPage.tsx` | `dashboard/src/app/calendar/page.tsx` | `dashboard/src/app/operator/customers/page.tsx` | `docs/audit/v23-codex-crosscheck.md`

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack design-review v2.0.0의 APP UI classifier, state, recovery, content audit

SKILLS_SKIPPED: screenshot, browser, commit, outside voices. 사용자 no-open 지시와 dirty shared worktree 때문에 full live workflow 차단

## 10. v24.1 전환 감사

흐름 정의는 바꾸지 않았다. 사용자 전환 경로가 실제 control과 연결되는지만 보강했다.

- 26개 route는 API 전환과 `data-route` 실제 click을 모두 감사한다.
- Settings와 채널 tab은 해당 button click을 감사한다.
- journey, onboarding, connect, operator는 열림과 복귀 경로를 감사한다.
- Home과 Studio의 8개 상태에서 빈 root와 미처리 runtime error를 금지한다.
- 발견된 모든 `data-action`을 원래 state로 복원한 뒤 실제 click한다.

DOM 런타임 판정: dead-end 0, 172 checks 통과, 60 actions 통과, runtime errors 0.

회수 필요: 실제 Chrome에서 26개 route, 1440·1024·390, console error 0을 직접 관찰하기 전에는 design 승인으로 올리지 않는다.

SOURCES: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` | `docs/prototype/qa-v24/jsdom-audit-after.json`

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack browse workflow를 route·tab·action click 감사 설계에 사용

SKILLS_SKIPPED: 실제 Chrome과 gstack design-review는 현재 sandbox에서 실행 차단
