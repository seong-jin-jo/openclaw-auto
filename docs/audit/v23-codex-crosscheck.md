# OSMU Marketing Agent v23 교차 검증 감사

> 판정: **❌ 불통과 — 디자인 승인 및 릴리즈 전환 금지**  
> 증거 등급: 코드·문서 **근거 확인**, 저장된 캡처 **관찰됨**, 실제 제품 E2E **미검증**  
> 감사 시각: 2026-08-10 17:09 KST  
> 대상 라인: `osmu`  
> 대상 프로토타입 SHA-256: `7e9036f6ef7d388ac735665f87054908f18c496330ec3bba7607b671864f7f27`

## 1. 한 줄 결론

v23은 26개 목적지, 7개 플랫폼 미리보기, OAuth 상태 설명, 14단계 캠페인 흐름을 폭넓게 그렸지만, **회장 요청 R-01~R-13 중 완전 반영 0건**, 실제 라우트·컴포넌트의 주요 액션 다수 누락, 코드에 없는 `Create`·플랫폼별 `Calendar`·운영자 10탭 등 재창조, 간격·글꼴 규칙의 자기모순과 모바일/태블릿 텍스트 압착이 확인됐다. 따라서 네 가지 회장 합격 조건을 모두 충족하지 못한다.

## 2. 감사 범위와 방법

검증 흐름은 다음과 같다.

`R-01~R-13 원문 고정 → 실제 route/component/lib 정적 전수 스캔 → v23 목적지·화면·액션 매핑 → 재창조 역대조 → CSS 수치 집계·design-lint → 저장 캡처 육안 확인 → 종합 게이트 판정`

| 테스트번호 | 검증 대상 | 방법 | 결과 |
|---|---|---|---|
| V23-X-001 | 요청 R-01~R-13 | 요청 원문과 프로토타입 문자열·함수·부재를 1:1 대조 | ❌ 완전 반영 0/13 |
| V23-X-002 | 실제 제품 보존 | `app` 26개 route/layout, 지정 component 36개, `lib` 46개 파일 정적 스캔 | ❌ 누락·부분·재창조 다수 |
| V23-X-003 | 재창조 금지 | 실제 탭·페이지·액션과 프로토타입의 이름·구조 역대조 | ❌ 명시적 `added` 구조 포함 |
| V23-X-004 | 디자인 시스템 | CSS/inline 선언 수치 집계 + `design-lint.sh` | ❌ 임의 px 및 스케일 이탈 |
| V23-X-005 | 화면 관찰 | 저장된 390/1024 캡처 육안 확인 및 실제 픽셀 크기 확인 | ❌ 압착 관찰, 3폭 증거 불완전 |
| V23-X-006 | HTML 스크립트 | inline script를 Node `vm.Script`로 구문 파싱 | ✅ syntax PASS; 브라우저 동작은 미검증 |

벤치마크는 다음을 적용했다.

- [WCAG 2.2 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): 320 CSS px에서 정보·기능 손실과 불필요한 양방향 스크롤이 없어야 한다. v23의 390 캡처에서도 표 셀이 글자 단위로 압착된다.
- [WCAG 2.2 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing): 사용자 텍스트 간격 변경에도 내용·기능 손실이 없어야 한다. v23의 `nowrap + clip` 전역 라벨 규칙은 이 여유를 줄인다.
- [USWDS Design Tokens](https://designsystem.digital.gov/design-tokens/) 및 [USWDS Spacing Units](https://designsystem.digital.gov/design-tokens/spacing-units/): 제한된 의미 토큰을 재사용하고 임의 값을 줄인다. v23은 자체 6단 규칙과 실제 14종 간격이 충돌한다.

차용한 기준은 “제한된 토큰 집합”, “좁은 폭에서도 정보 손실 없음”, “긴 문자열의 안전한 줄바꿈”이다. 브랜드·제품 고유 IA는 외부 사례에서 가져오지 않고 실제 코드만 진실원으로 삼았다.

## 3. A — 요청 반영 감사

### 3.1 R-01~R-13 추적표

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R-01 | pipeline 상태 확인 | V23-X-001-01 | 부분 | 프로토타입은 destination·gap·QA 메타를 내보내지만(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2540-2562`) canonical pipeline stage/승인 상태를 읽거나 표시하지 않는다. 요청 원문은 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:15-16`. |
| R-02 | 가입→OAuth→키 저장·확인→생성→수정→발행→성과→Settings→Admin | V23-X-001-02 | 부분 | 14단계 배열은 존재한다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:608-609`). 그러나 로그인은 실제 `/signup → /login`과 달리 계정 선택·작업 공간 생성/초대를 새로 만들고(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1987-1992`), 각 단계도 실제 액션 보존이 아니라 합성 화면이다. 세부 판정은 아래 3.2. |
| R-03 | 기존 사이트·코드·wiki를 무시한 재창조 금지 | V23-X-001-03 | 미반영 | 프로토타입이 코드에 없는 `Create`와 플랫폼별 `Calendar`를 스스로 `added`라고 선언한다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1528-1538`). 실제 Inbox·Calendar·Messaging·Data·Assets·Admin 구조도 다르다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:36-37`. |
| R-04 | OAuth 자동화 가능 범위와 회원별 secret 저장·확인 | V23-X-001-04 | 부분 | account readback·암호화 저장·원문 숨김 설명은 있다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1814-1825`). 다만 실제 `SocialConnectButton`/`AccountManager`/운영자 OAuth 저장 액션 전체를 재현하지 않고, 실 OAuth 가능 여부는 프로토타입 텍스트일 뿐이다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:41-42`. |
| R-05 | 고객은 미연결, 운영자는 오픈 준비중; FB/IG/YT 등 정책 조사 | V23-X-001-05 | 부분 | `notConnected/opening/ready` 상태와 계정 목표를 구분한다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:610-618`, `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1752-1768`). 그러나 정책 수치·상태가 실제 런타임에서 관찰된 증거는 없고 일부는 프로토타입 고정 데이터다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:46-50`. |
| R-06 | 정책 조사, 포지셔닝 wiki, 프로토타입 발전, SaaS 이점·AAARR | V23-X-001-06 | 부분 | 14단계와 source/evidence/gap 모델은 있다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:608-625`). 하지만 요청한 Later·Metricool 비교와 wiki 반영 여부는 프로토타입에서 확인되지 않고, 실제 기능 보존도 실패했다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:54-59`. |
| R-07 | 신규 사용자·운영자 흐름 end-to-end 완성 | V23-X-001-07 | 미반영 | 화면 수는 많지만 실제 route/action과 이어지는 E2E가 아니다. `page()`는 합성 함수로 분기하고(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2133-2147`), 실제 API나 실제 제품 라우트로 연결된 관찰 증거가 없다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:63-64`. |
| R-08 | 근거 중심 강화 | V23-X-001-08 | 부분 | `preserved/added/unsupported`, readiness, source/evidence 문구가 추가됐다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2510-2529`). 하지만 실제 UI 대응 누락과 고정 숫자가 남아 근거 체계가 제품 진실원을 보장하지 못한다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:68-69`. |
| R-09 | 여백 불일치·따닥따닥·넘침·정보 과다 수정, Studio preview 복원 | V23-X-001-09 | 부분 | 7개 preview와 세로 3묶음은 복원됐다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:572-605`, `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2543-2553`). 그러나 간격 14종·글꼴 9종, `nowrap+clip`, 고정 열, 캡처상 글자 단위 압착이 남았다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:73-76`. |
| R-10 | 하네스 차원 재창조 방지 | V23-X-001-10 | 미반영 | 주석과 origin chip은 있으나 재창조 자체가 존재한다. 하네스가 막았다는 실행 증거도 프로토타입에 없다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:80-81`. |
| R-11 | 기존 산출물·요청을 이용해 빠르게 제대로 수정 | V23-X-001-11 | 미반영 | 실제 Studio 발행 이력은 감사 도중 추가됐으나, Inbox·Calendar·Videos·Settings 등 핵심 현행 기능은 여전히 합성/누락이다. 속도는 합격 근거가 아니다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:85-86`. |
| R-12 | 요청 원장 저장 위치 확인 | V23-X-001-12 | 미반영 | 요청 원장은 실제 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md`에 존재하지만 프로토타입 안에는 원장 위치·연결이 없다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:90-91`. |
| R-13 | 디자인시스템·요청 전량·UI 일관성·기존 구현 보존 | V23-X-001-13 | 미반영 | 본 감사의 네 최종 게이트가 모두 불통과다. 요청 원문 `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:95-104`. |

집계: **반영 0 / 부분 7 / 미반영 6**.

### 3.2 R-02 단계별 판정

| R-02 단계 | 판정 | 실제 코드 | v23 근거와 차이 |
|---|---|---|---|
| 회원가입 | 부분 | `/signup`은 `/login`으로 redirect(`dashboard/src/app/signup/page.tsx:3-5`), 로그인은 Google 단일 흐름(`dashboard/src/app/login/page.tsx:18,83-104`) | v23은 계정 chooser와 신규/초대/기존 workspace 선택을 추가했다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1987-1992`). |
| OAuth 연결 | 부분 | provider readiness와 connect URL(`dashboard/src/components/channel/SocialConnectButton.tsx:134,189`) | v23 consent/readiness는 있으나 실제 컴포넌트 구조 전체가 아니다. |
| 키 저장 | 부분 | 수동 credential·OAuth app·tenant token 저장(`ChannelPage.tsx:213-285`, `operator/customers/page.tsx:199-268`, `TenantTokensSettings.tsx:35-54`) | customer token 원문 숨김은 올바르나 여러 종류의 실제 저장 액션이 하나의 합성 readback으로 축약됐다. |
| 저장값 확인 | 부분 | 계정 목록·기본 지정·삭제(`AccountManager.tsx:68,90,209-221`)와 운영자 조건부 reveal(`operator/customers/page.tsx:413-447`) | v23 metadata readback과 30초 secret flow가 있으나 실제 두 화면의 권한·액션 경계가 달라졌다. |
| 콘텐츠 생성 | 부분 | Studio OSMU/AI/text/image/video(`studio/page.tsx:190-216,409-415`)와 Instagram card editor(`InstagramPage.tsx:184-294`) | 3묶음은 있으나 플랫폼별 Create를 새로 만들어 source of truth를 분산시켰다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1722-1769`). |
| 수정 | 부분 | Studio variant 편집·재생성(`studio/page.tsx:489-573`), Queue edit/image(`UnifiedPostCard.tsx:188-243`) | v23에 편집은 있으나 실제 queue/image picker/Instagram 세부 액션을 보존하지 않았다. |
| 발행·예약 | 부분 | Studio publish/cancel/reconcile와 SchedulePanel(`studio/page.tsx:278-320,413-471`, `SchedulePanel.tsx:94-188`) | v23은 합성 lifecycle과 플랫폼별 게시·일정 구조를 추가했다. 실제 API 호출 관찰은 없다. |
| 성과 | 부분 | 홈 필터·아이디어·성과 수집과 운영 패널(`dashboard/src/app/page.tsx:141-209,216-429`) | v23은 예시 숫자와 합성 Analytics를 표시한다. 실제 hook/API 결과가 아니다. |
| Settings | 부분 | 9탭·15개 mounted setting components(`settings/page.tsx:23-35,61-108`) | v23 8그룹 요약은 상세 액션 다수를 누락한다. |
| Admin | 부분 | 실제는 operator login + customers 단일 관리 화면(`operator/page.tsx:8-67`, `operator/customers/page.tsx:326-657`) | v23은 10개 콘솔 탭과 미구현 화면을 새 IA로 만든다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2058-2131`). |

## 4. B — 실제 기능 누락 감사

### 4.1 실제 app route/layout 전수 대조

| 실제 코드 경로·대표 액션 | v23 대응 | 판정 |
|---|---|---|
| `dashboard/src/app/page.tsx:48,111,141-209,216-429` — 온보딩, 성과 필터, 아이디어 생성, metric 수집, activity/alerts/weekly/agent/usage/errors | `home()`의 합성 요약 | 부분; 실제 운영 패널 다수 누락 |
| `dashboard/src/app/studio/page.tsx:68,190-320,390-573` — brand, repo, OSMU, AI draft, save/history, publish/cancel/reconcile, schedule, preview/edit | 3묶음·preview·최근 추가된 history | 부분; 실제 toolbar, transaction/reconcile, 선택 계정과 편집 세부 누락 |
| `dashboard/src/app/inbox/page.tsx:33,112-127,166-229,273-296` — product source, tone, seed, approve/reject, 예약시간 | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1845-1850`의 검토 메모/승인 합성 화면 | **재창조; 실제 설정·seed·reject 삭제 흐름 누락** |
| `dashboard/src/app/calendar/page.tsx:37,80-148` — 월 이동, 오늘, 날짜 선택, 해당일 read-only 목록 | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1851-1855`의 타임라인·일정 변경/취소 | **재창조; 실제 월 그리드 부재, 코드에 없는 변경 액션 추가** |
| `dashboard/src/app/channels/[channel]/page.tsx:13,25-45` — Instagram/Data/Messaging/Blog/Video/Generic 분기 | kind 기반 합성 route(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2133-2147`) | 부분; owner component별 실제 차이를 평탄화 |
| `dashboard/src/app/blog-performance/page.tsx:35,97-101` — 조회수/날짜 정렬 | generic data 화면 | 부분; 정렬 액션 부재 |
| `dashboard/src/app/blog/page.tsx:36,69-129,145-332` — queue approve/delete, editor save, guide, keyword bank | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1875-1888` 긴 글·URL 기록·export | **재창조; 실제 3탭과 액션 누락** |
| `dashboard/src/app/data-deletion/page.tsx:6` — 데이터 삭제 안내/경로 | 없음 | **실제 코드 경로 → 프로토타입 부재** |
| `dashboard/src/app/google-analytics/page.tsx:3` — GA 화면 | generic data 화면 | 부분; 실제 컴포넌트 구조 미보존 |
| `dashboard/src/app/google-trends/page.tsx:5,22` — Google Trends 외부 탐색 | generic keyword 화면 | 부분; 실제 외부 이동 부재 |
| `dashboard/src/app/images/page.tsx:15,20-28,66-76` — 이미지 URL 복사·삭제 | `assets()`의 편집/alt/rights 합성(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1864-1874`) | **재창조; 실제 copy/delete 누락** |
| `dashboard/src/app/keyword-planner/page.tsx:24,52,87-132` — 검색·keyword bank 추가 | generic keyword 화면 | 부분; bank 추가 액션 부재 |
| `dashboard/src/app/layout.tsx:16` — 실제 provider/layout shell | prototype 자체 shell | 부분; 실제 provider/auth/layout 계약 아님 |
| `dashboard/src/app/login/page.tsx:18,83-104` — Google 로그인 | journey modal | 부분; 초기 route 화면 아님 |
| `dashboard/src/app/naver-trends/page.tsx:3` | generic keyword 화면 | 부분 |
| `dashboard/src/app/operator/customers/page.tsx:120,199-302,326-657` — OAuth credential CRUD/reveal, customer pause/resume, shared AI approve/revoke, workspace metrics | operator 10탭 | **재창조; 실제 한 화면을 별도 콘솔 IA로 변경** |
| `dashboard/src/app/operator/page.tsx:8,20-67` — operator token login | 없음; 역할 switch로 대체 | **실제 코드 경로 → 프로토타입 부재** |
| `dashboard/src/app/performance/page.tsx:7-9` — `/` redirect | 별도 route 없음 | 부분; Home 성과로만 대체 |
| `dashboard/src/app/privacy/page.tsx:6` | 없음 | **실제 코드 경로 → 프로토타입 부재** |
| `dashboard/src/app/search-advisor/page.tsx:3` | generic keyword 화면 | 부분 |
| `dashboard/src/app/search-console/page.tsx:26,57` — 기간 선택 | generic data 화면 | 부분; 기간 액션 미보존 |
| `dashboard/src/app/services/page.tsx:36,44,107-276` — tenant 조회·추가·전환 | 없음 | **실제 코드 경로 → 프로토타입 부재** |
| `dashboard/src/app/settings/page.tsx:23-35,37,53-108` — 9탭·15개 설정 컴포넌트 mount | 8개 요약 그룹 | 부분; 상세 누락은 4.4 참조 |
| `dashboard/src/app/signup/page.tsx:3-5` — login redirect | 합성 signup/workspace flow | **재창조** |
| `dashboard/src/app/terms/page.tsx:6` | 없음 | **실제 코드 경로 → 프로토타입 부재** |
| `dashboard/src/app/videos/page.tsx:72,213-440,489-889` — library/generate, provider status, clip repurpose/refine/fan-out, publish 3종, delete, slide/TTS/BGM | `assets()`의 단일 job 카드 | **중대 누락·재창조** |

### 4.2 `components/studio/` 전수 대조

| 실제 컴포넌트와 액션 | v23 대응 | 판정 |
|---|---|---|
| `PlatformPreview.tsx:14-108` — 7 frame, Instagram carousel 이전/다음 | 7 frame·carousel | 부분; 시각 틀은 대응하나 실제 컴포넌트 직접 재사용 아님 |
| `ChannelConnect.tsx:34,46,87-125` — 채널 선택, config test, manual credential | 연결 dialog | 부분; 실제 test/manual 폼 전체 미보존 |
| `RepoConnect.tsx:29,68-75,127-190` — direct/repo/wiki source, token, repo/path/ref, sync | brand source 상세 | 부분; actual modal/validation/action parity 미확인 |
| `SchedulePanel.tsx:62,94,112,154-188` — 플랫폼별 account load, datetime/platform/account 선택·submit | 합성 schedule dialog | 부분; account 선택·실제 submit 계약 누락 |

### 4.3 `components/channel/` 전수 대조

| 실제 컴포넌트와 액션 | v23 대응 | 판정 |
|---|---|---|
| `ChannelPage.tsx:80,103-110,181-348,509-651` — Queue/Analytics/Settings, Threads Growth/Popular, OAuth/manual config, AccountManager, automation, guide, keywords, popular CRUD, parameters 저장 | 공통 플랫폼 IA | 부분; `Create/Calendar` 추가 및 settings 세부 누락 |
| `InstagramPage.tsx:37-327,443-506` — Queue/Card Editor/Settings, outline, slide add/remove/reorder, upload, generate, draft save, Midjourney | Instagram 합성 Create | 부분; 실제 editor 세부와 3탭 보존 실패 |
| `MessagingPage.tsx:16-84` — credential 저장·검증, 상태, setup guide | 전달 on/off·개별 전달 화면 | **실제 코드 경로 → 다른 기능으로 재창조** |
| `DataChannelPage.tsx:16-68` — credential 저장·검증, 상태, setup guide | metric/analytics 화면 | **실제 코드 경로 → 다른 기능으로 재창조** |
| `AccountManager.tsx:38,68,90,209-221,281-306` — 계정 조회·기본 지정·삭제·수동 추가 | account readback | 부분; 관리 액션 누락 |
| `SocialConnectButton.tsx:76,134,189,235-259` — readiness, OAuth start, account switch help | connect dialog | 부분; actual transition/return contract 미보존 |
| `ContentGuide.tsx:13,30,78-118` — guide 저장, AI suggestion, 적용/복사 | 일부 brand/guide 텍스트 | **실제 코드 경로 → 프로토타입 액션 부재** |
| `KeywordsEditor.tsx:13,30,91` — keyword 저장·AI suggestion | generic keyword 관리 | 부분; channel-local editor parity 없음 |
| `TenantAutomationSettings.tsx:24,35` — 채널 자동화 toggle 저장 | automation 설명/목표 | **실제 toggle 액션 부재** |
| `NotifStatusCard.tsx:16` — notification 상태 카드 | 없음. 전체 src import 검색에서도 mount 미확인 | 코드 파일은 존재하나 실제 노출 미확인; 프로토타입 부재 |
| `TestSendCard.tsx:12,18-50` — 테스트 알림 전송 | 없음. 전체 src import 검색에서도 mount 미확인 | 코드 파일은 존재하나 실제 노출 미확인; 프로토타입 부재 |

### 4.4 `components/queue/`, `home/`, `settings/` 전수 대조

| 실제 컴포넌트와 액션 | v23 대응 | 판정 |
|---|---|---|
| `QueueList.tsx:24,32-107` — sourcing import, filter, select all, bulk approve/delete | 합성 single queue row | **부분; bulk/import/filter 누락** |
| `PostCard.tsx:39,47-73,121-183` — approve, save, delete, image remove/pick, edit | 합성 edit/approve | 부분; 실제 액션 묶음 누락 |
| `UnifiedPostCard.tsx:62,83-122,188-325` — approve/save/delete, variants, image, editor 이동, 성과 이동 | 합성 canonical projection | 부분; 실제 variants/image/result link 누락 |
| `ImagePickerModal.tsx:15,37-43,70-126` — 이미지 선택·해제·생성 | Images 이동 | **실제 modal 액션 부재** |
| `PipelineTimeline.tsx:20-36` — draft→approved→published→performing 링크 | 14단계 journey | 부분; 실제 4단 상태 링크와 다른 구조 |
| `AIEngine.tsx:12,37-41` — gateway/CLI 전환 | Settings 요약 | **액션 부재** |
| `Account.tsx:5,29-32` — logout/token 변경 | Settings 요약 | **액션 부재** |
| `AiKeySettings.tsx:13,27-49` — AI key 저장 | provider key 요약 | 부분; actual save UI 부재 |
| `ChannelsSettings.tsx:30` — 채널 목록 링크 | 연결 목록 | 부분 |
| `ClaudeToken.tsx:9,25-31,58-120` — save/edit/show/cancel | key 요약 | **세부 액션 부재** |
| `DesignToolsSettings.tsx:34,155-308` — Canva/Figma save, Figma OAuth, gateway restart | design tool 연결 요약 | **세부 액션 부재** |
| `ElevenLabsSettings.tsx:20,36-51,79-149` — key save/show, voice load/select | Video/TTS 요약 | **세부 액션 부재** |
| `InteractiveChat.tsx:11,61` — Telegram setup | 없음; `settings/page.tsx` mount도 없음 | 코드 파일·prototype 모두 비노출 |
| `KeywordBankSettings.tsx:20,44-103` — add/remove/used/filter | generic keyword | 부분; actual bank 동작 누락 |
| `KwPlannerSettings.tsx:21,35-50,76-204` — Google/Naver config save/show | generic keyword | **세부 액션 부재** |
| `LlmModel.tsx:8,46-87` — primary/job override save/edit/cancel | 모델 선택 요약 | **세부 액션 부재** |
| `Notifications.tsx:17,30-62,103-109` — save/test/weekly report | 알림 저장 한 버튼 | 부분; test/report 누락 |
| `SlackSettings.tsx:22,37-79,101-180` — webhook, test, template, preview/send report | Messaging/알림 요약 | **세부 액션 부재** |
| `StorageSettings.tsx:38,96-112` — storage edit/save/cancel | storage test 합성 | 부분; actual 설정 동작 미보존 |
| `SystemSettings.tsx:7` — system status + Account | 시스템 요약 | 부분 |
| `TenantTokensSettings.tsx:17,35-54,69-99` — domain save, token issue/revoke | fork token 요약 | **세부 액션 부재** |

### 4.5 `lib/`이 증명하는 실제 기능 경계

`lib`은 직접 화면이 아니므로 “프로토타입 화면 대응”보다 기능 경계 보존 여부를 확인했다.

| 실제 기능 경계 | 코드 근거 | v23 판정 |
|---|---|---|
| 계정 identity/default/delete와 tenant 분리 | `channel-accounts.ts:38-287`, `tenant-auth.ts:37-131`, `tenant-context.ts:9-13` | 일부 readback만 반영; 관리·격리 동작 미검증 |
| OAuth provider/state/code exchange와 app credential CRUD/reveal | `social-connect.ts:32-512`, `oauth-app-credentials.ts:67-531` | 개념은 반영; 실제 provider·저장·오류 계약과 E2E 미검증 |
| 실제 publish adapter Threads/Instagram/Reels/X/Facebook/Bluesky/Telegram/Discord/Slack | `publish.ts:181-810` | UI에는 폭넓게 표시되나 adapter 실행·결과는 미검증; Messaging 실제 화면은 왜곡 |
| queue DB mirror/backfill/published state | `queue-store.ts:33-104`, `sourcing-bridge.ts:23-87` | canonical record 문구만 있고 실제 import/backfill 액션 누락 |
| video clipping/TikTok/YouTube token | `clipping.ts:29-171`, `tiktok.ts:41-118`, `youtube-token.ts:17` | Videos 실제 기능을 단일 job 상태로 축약 |
| wiki/repo/context source | `github.ts:46-104`, `github-repo-input.ts:94`, `wiki-retrieve.ts:6-31`, `context-source.ts:12` | source 화면은 있으나 실제 validation/error contract 미검증 |
| notification/observability | `send-notification.ts:24`, `observability.ts:48-225` | 고객/운영자 알림·오류 실제 action 대부분 누락 |
| secret masking 및 media/image signing | `secret-mask.ts:1-11`, `media-token.ts:21-77`, `image-token.ts:15-93` | secret 원문 숨김 원칙은 반영; media delivery 액션은 축약 |

## 5. C — 재창조 감사

| 실제 코드의 이름·구조 | v23이 새로 만든 이름·구조 | 판정 |
|---|---|---|
| ChannelPage: `Queue / Analytics / Settings`, Threads만 `Growth / Popular`(`ChannelPage.tsx:103-110`) | 모든 채널에 `Create / Calendar` 추가(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1528-1538`) | ❌ 명시적 재창조 |
| 실제 Calendar: 월 그리드와 read-only 당일 목록(`calendar/page.tsx:80-148`) | 플랫폼별 Calendar + 일정 변경, 전체 Calendar timeline(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1774,1851-1855`) | ❌ 구조·권한 재창조 |
| 실제 Inbox: source/tone/seed/approve/reject/schedule(`inbox/page.tsx:166-296`) | feedback note와 합성 승인 flow(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1845-1850`) | ❌ 핵심 액션 교체 |
| 실제 Messaging/Data: credential·status·setup guide(`MessagingPage.tsx:16-84`, `DataChannelPage.tsx:16-68`) | Messaging 전달 관리, Data 성과 수치(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1840-1863`) | ❌ 다른 제품 기능으로 교체 |
| 실제 Images: copy URL/delete(`images/page.tsx:20-28,66-76`) | crop/alt/rights/edit 개념(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1864-1874`) | ❌ 재창조 |
| 실제 Videos: clip/provider/library/publish/editor/TTS(`videos/page.tsx:489-889`) | 단일 video job/phase 카드 | ❌ 대폭 축약·재창조 |
| 실제 Admin: token login + customers 단일 관리 화면 | 10탭 Operator Console, 그중 다수 `아직 없음`(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2058-2131`) | ❌ 미래 IA를 현행 껍데기로 추가 |
| 실제 Signup: `/login` redirect, Google 단일 버튼 | Google chooser + workspace 생성/초대/기존 선택(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:1987-1992`) | ❌ 인증 여정 재창조 |
| 실제 Settings: 9탭과 15개 mounted components | 8개 summary 그룹과 합성 action | ❌ 이름·깊이·액션 축약 |

프로토타입이 `added`, `unsupported`, `아직 없음`이라고 라벨링한 점은 허위 현행 표시는 줄인다. 그러나 R-03/R-13의 합격 조건은 “새 구조임을 밝히기”가 아니라 **실제 기능을 누락하지 않고 재창조하지 않는 것**이므로 라벨만으로 통과할 수 없다.

## 6. D — UI 일관성 감사

### 6.1 실제 값 집계

| 항목 | 선언 규칙 | 실제 집계 | 판정 |
|---|---|---|---|
| 간격 | `4/8/12/16/24/32`, pill inset `2`만 예외(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:385-391`) | margin/padding/gap 양수 literal 13종: `1,2,4,8,10,12,14,16,18,24,32,48,64`; token-only `20` 포함 **14종**. `-1`은 sr-only 예외 | ❌ 선언의 2배 |
| 글자 크기 | `12/13/15/17/20/24/30` 7단(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:388-395`) | CSS+inline 실제 **9종**: `12,13,14,15,17,18,20,24,30` | ❌ `14`, `18` 이탈 |
| inline style | token 우회 금지 취지 | `style="..."` **73개** | ❌ 유지보수·일관성 위험 |
| absolute | 필요 최소화 | CSS `position:absolute` **10개** | ⚠️ preview chrome은 정당하나 배지/라벨 overlap 회귀 이력 존재 |
| 고정 width/min/max width | reflow 우선 | CSS px 고정 선언 **38개** | ⚠️ 좁은 표·timeline·tab 압착 위험 |

기계 lint 결과:

```text
⚠️ 8pt 밖 임의 px: v23.css → 10px 14px 18px 58px 88px
⚠️ 1종 위반 — design.md §9 토큰·8pt 스케일로 수정
```

HTML을 임시 `.css`로 복사해 동일 파일 전체를 `design-lint.sh`에 입력했다. 이 검사는 inline style과 hex를 HTML 확장자에서 직접 검사하지 못하므로 위 수동 집계가 더 엄격하다.

### 6.2 겹침·잘림 위험 패턴

| 위험 패턴 | 코드 근거 | 관찰/판정 |
|---|---|---|
| 전역 라벨 `nowrap + text-overflow:clip`, 폭 증가 | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:405-410` | 부모가 wrap/overflow를 갖지 않으면 라벨이 잘리거나 전체 폭을 민다. WCAG reflow 관점 불통과 위험. |
| 버튼 `flex:0 0 auto` 전역화 | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:484-487` | 버튼 잘림은 줄지만 container horizontal overflow로 부담을 이동한다. |
| family number absolute | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:288`, desktop override `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:501-506` | 감사 직전 실제 overlap 회귀를 수정한 흔적. 390에서는 static으로 바뀌었지만 desktop/태블릿은 absolute 의존. |
| timeline fixed columns `36px 160px ... auto` | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:313` | 700px 이하만 2열로 바뀐다(`docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:366`); 701~900px에서 긴 한글·버튼 압착 위험. |
| operator 240px sidebar + table | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:319-321`, operator 화면 `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:2131` | 저장된 1023px 캡처에서 계정 목표 표의 한글이 음절 단위로 줄바꿈됨. |
| preview absolute overlays | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:457-480` | Instagram/video count·dots·rail·caption이 같은 frame을 점유한다. 고정 bottom/right 값이라 긴 caption과 rail 충돌 위험. |
| mobile sticky head `top:-16px` | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:367-370` | 음수 위치가 dialog padding에 결합되어 변경 시 seam/겹침 위험. |
| mobile 2-column header/table 유지 | `docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html:363` | `studio-mobile-390.png`에서 OSMU 상태 표 라벨·채널명이 세로로 찢어져 읽기 어렵다. |

### 6.3 저장 캡처 증거의 한계

- `studio-mobile-390.png`는 실제 파일 폭이 **127px**로 확인되어 이름의 390과 일치하지 않는다. 화면 안 표 텍스트가 글자 단위로 압착된 상태가 직접 관찰된다.
- `studio-desktop-1024.png`는 실제 파일 폭이 **450px**, `studio-dark-1024.png`는 **463px**다. 1024 viewport 증거로 사용할 수 없다.
- `operator-desktop-1024.png`만 **1023px**이며, 계정 목표 표에서 열 폭 부족과 다단 줄바꿈이 관찰된다.
- 감사 막바지에 `studio-desktop-1440.png`가 추가됐지만 실제 파일 폭은 **650px**이고 viewport·DPR·resize 메타가 없다. 육안으로는 하단 선택 bar가 첫 번째 Studio 카드 위를 가로질러 내용을 덮는 장면도 보인다. 따라서 이름만으로 1440 CSS viewport 증거로 승계할 수 없다.
- 1440·1024·390 세 폭을 같은 해시·viewport 메타로 재캡처한 완전한 design-conformance 증거는 없다. 따라서 “3폭 정합”은 **미검증**, PASS 금지다.

### 6.4 제작자 자기보고와 교차감사 불일치

제작자 출력은 R-03·R-09·R-13 등을 “반영”으로 집계하고(`tasks/marketing-agent-design-v23.output:141-150`), CSS 글자 6종·간격 10종·3폭 잘림/겹침/가로스크롤 0을 보고한다(`tasks/marketing-agent-design-v23.output:169-189`). 교차감사는 다음 이유로 그 PASS를 승계하지 않는다.

- 글자 6종은 CSS `font-size` literal만 세어 inline `14/18`과 `--fs-h1:30`을 제외했다. 이번 과제는 “프로토타입 HTML/CSS” 전부의 종류 집계를 요구하므로 9종이 맞다.
- 간격 10종은 inline `10/14/18`, root token `20`, 일부 실제 속성을 제외했다. margin/padding/gap 전체 양수 literal과 token을 합치면 14종이다.
- R-03을 반영으로 셌지만 같은 프로토타입이 현행 코드에 없는 `Create/Calendar`를 `added`라고 명시한다. 출처 라벨은 재창조 사실을 설명할 뿐 재창조를 없애지 않는다.
- 캡처 파일은 browser viewport·DPR·후처리 resize 메타를 품고 있지 않다. 따라서 제작자 프로세스 주장만으로 픽셀 폭·reflow PASS를 독립 재현할 수 없다.

## 7. E — 회장 합격 조건 종합 판정

| 합격 조건 | 판정 | 근거 |
|---|---|---|
| 디자인시스템 제대로 | **불통과** | 선언은 6단/7단이지만 실제 간격 14종, 글꼴 9종, inline style 73개, design-lint 임의 px 검출. |
| 요청 전량 반영 | **불통과** | R-01~R-13 완전 반영 0건, 부분 7건, 미반영 6건. R-02 actual E2E와 R-09 정합성 모두 닫히지 않음. |
| UI 일관성 | **불통과** | `nowrap+clip`, fixed columns, absolute overlays, 저장 캡처의 실제 압착. 3폭 동등 증거도 없음. |
| 기존 구현 보존·재창조 금지 | **불통과** | Inbox/Calendar/Messaging/Data/Images/Videos/Admin/Signup/Settings를 축약·교체했고 코드에 없는 Create/Calendar IA를 추가. |

**최종 판정: ❌ NG.** 현 상태에서 `design` 승인, `qa` PASS, 릴리즈 전환을 해서는 안 된다.

### 전환 상태

- 🔧 전환 가능 TC: **없음**. curl HTTP 코드, 실제 import chain 끝점 관찰, stage JSON, Maestro PASS 중 이 감사 대상의 실제 동작을 입증하는 증거가 없다.
- ⬜ 유지: HTML 브라우저 E2E, 실제 제품 build/test, backend, seed, API curl, Playwright, Maestro는 감사-only 범위라 **미실행/미검증**.
- ❌ NG: V23-X-001~005. V23-X-006은 구문만 PASS이며 제품 동작 완료 근거가 아니다.

### 페르소나 결정 1문항

질문: “1인 사업가가 가입 후 별도 설명 없이 한 캠페인을 연결→생성→검토→게시→성과→다음 실험까지 실제 제품 기능으로 완주할 수 있는가?”  
답: **아니오.** 페르소나 정본은 이 연속성을 요구하지만(`docs/plan/persona-v7.3.5.md:57-65`), v23은 합성 화면 사이의 story는 만들었어도 실제 Inbox/Calendar/Settings/Admin/Video 액션을 보존하지 않았다.

## 8. 레드팀·셀프심문

가장 강한 반론은 “v23이 `added/unsupported/아직 없음`을 명시했으니 재창조가 아니라 미래상과 현행을 정직하게 분리했다”는 것이다. 이 반론은 허위 현행 표시를 줄였다는 점에서는 맞다. 그러나 회장 합격 조건은 현행 기능 보존과 재창조 금지이며, 실제 route의 액션을 누락한 채 미래 IA가 전면에 나오면 사용자는 현재 제품을 검수할 수 없다. 그래서 판정을 유지한다.

“이 결론이 틀렸다면 가장 그럴듯한 이유”는 감사 중 프로토타입이 계속 수정되어 일부 누락이 이미 보완됐을 가능성이다. 이를 줄이기 위해 SHA-256을 고정했고, 실제로 Studio 발행 이력 추가분은 현재 해시에 반영해 재평가했다. 그 보완 후에도 나머지 핵심 누락과 재창조, 토큰 불일치가 남아 종합 판정은 바뀌지 않는다.

까다로운 고객 관점에서는 “기능이 많아 보이는가”보다 “지금 제품에서 하던 일을 같은 이름과 위치에서 찾을 수 있는가”가 중요하다. v23은 전자는 충족하지만 후자는 충족하지 못한다.

## 9. 문서 품질 자체평가

`RUBRIC_SCORE: completeness=5/5 precision=5/5 benchmark=4/5 traceability=5/5 professionalism=5/5 total=24/25`  
`WEAKEST_LINE: 실제 브라우저 1440/1024/390 동시 재캡처가 없어 runtime reflow 판정은 저장 캡처와 정적 위험 분석에 한정된다.`

## 10. SOURCES

### 요청·단계·정본 문서

```text
CLAUDE.md
dashboard/CLAUDE.md
dashboard/AGENTS.md
pipeline-state.osmu.md
wiki/ops/session-state.md
docs/requests/2026-08-08_2026-08-10-chairman-requests.md
docs/prototype/openclaw-auto-marketing-agent-fidelity-v23-gpt-codex.html
docs/qa/qa-tracker.md
docs/plan/one-thing-v7.3.5.md
docs/plan/persona-v7.3.5.md
tasks/marketing-agent-design-v23.output
```

`docs/구현현황.md`, `docs/test-plan.md`, pipeline pin의 `docs/one-thing.md`, `docs/persona.md`는 존재하지 않아 미확인이다. 대체 가능한 실제 plan 파일 두 개는 위에 명시했다.

### 실제 화면·컴포넌트·라이브러리 정적 스캔 경로 전량

```text
dashboard/src/app/blog-performance/page.tsx
dashboard/src/app/blog/page.tsx
dashboard/src/app/calendar/page.tsx
dashboard/src/app/channels/[channel]/page.tsx
dashboard/src/app/data-deletion/page.tsx
dashboard/src/app/google-analytics/page.tsx
dashboard/src/app/google-trends/page.tsx
dashboard/src/app/images/page.tsx
dashboard/src/app/inbox/page.tsx
dashboard/src/app/keyword-planner/page.tsx
dashboard/src/app/layout.tsx
dashboard/src/app/login/page.tsx
dashboard/src/app/naver-trends/page.tsx
dashboard/src/app/operator/customers/page.tsx
dashboard/src/app/operator/page.tsx
dashboard/src/app/page.tsx
dashboard/src/app/performance/page.tsx
dashboard/src/app/privacy/page.tsx
dashboard/src/app/search-advisor/page.tsx
dashboard/src/app/search-console/page.tsx
dashboard/src/app/services/page.tsx
dashboard/src/app/settings/page.tsx
dashboard/src/app/signup/page.tsx
dashboard/src/app/studio/page.tsx
dashboard/src/app/terms/page.tsx
dashboard/src/app/videos/page.tsx
dashboard/src/components/studio/ChannelConnect.tsx
dashboard/src/components/studio/PlatformPreview.tsx
dashboard/src/components/studio/RepoConnect.tsx
dashboard/src/components/studio/SchedulePanel.tsx
dashboard/src/components/channel/AccountManager.tsx
dashboard/src/components/channel/ChannelPage.tsx
dashboard/src/components/channel/ContentGuide.tsx
dashboard/src/components/channel/DataChannelPage.tsx
dashboard/src/components/channel/InstagramPage.tsx
dashboard/src/components/channel/KeywordsEditor.tsx
dashboard/src/components/channel/MessagingPage.tsx
dashboard/src/components/channel/NotifStatusCard.tsx
dashboard/src/components/channel/SocialConnectButton.tsx
dashboard/src/components/channel/TenantAutomationSettings.tsx
dashboard/src/components/channel/TestSendCard.tsx
dashboard/src/components/queue/ImagePickerModal.tsx
dashboard/src/components/queue/PostCard.tsx
dashboard/src/components/queue/QueueList.tsx
dashboard/src/components/queue/UnifiedPostCard.tsx
dashboard/src/components/home/PipelineTimeline.tsx
dashboard/src/components/settings/AIEngine.tsx
dashboard/src/components/settings/Account.tsx
dashboard/src/components/settings/AiKeySettings.tsx
dashboard/src/components/settings/ChannelsSettings.tsx
dashboard/src/components/settings/ClaudeToken.tsx
dashboard/src/components/settings/DesignToolsSettings.tsx
dashboard/src/components/settings/ElevenLabsSettings.tsx
dashboard/src/components/settings/InteractiveChat.tsx
dashboard/src/components/settings/KeywordBankSettings.tsx
dashboard/src/components/settings/KwPlannerSettings.tsx
dashboard/src/components/settings/LlmModel.tsx
dashboard/src/components/settings/Notifications.tsx
dashboard/src/components/settings/SlackSettings.tsx
dashboard/src/components/settings/StorageSettings.tsx
dashboard/src/components/settings/SystemSettings.tsx
dashboard/src/components/settings/TenantTokensSettings.tsx
dashboard/src/lib/analytics/events.ts
dashboard/src/lib/analytics/ga.ts
dashboard/src/lib/anthropic.ts
dashboard/src/lib/api.ts
dashboard/src/lib/auth.ts
dashboard/src/lib/channel-accounts.ts
dashboard/src/lib/channel-icons.tsx
dashboard/src/lib/channel-text-limits.ts
dashboard/src/lib/clipping.ts
dashboard/src/lib/connect-tenant-audit.ts
dashboard/src/lib/constants.ts
dashboard/src/lib/context-source.ts
dashboard/src/lib/db.ts
dashboard/src/lib/file-io.ts
dashboard/src/lib/format.ts
dashboard/src/lib/github-repo-input.ts
dashboard/src/lib/github.ts
dashboard/src/lib/gsc-auth.ts
dashboard/src/lib/higgsfield.ts
dashboard/src/lib/image-token.ts
dashboard/src/lib/media-token.ts
dashboard/src/lib/oauth-app-credentials.ts
dashboard/src/lib/oauth-errors.ts
dashboard/src/lib/observability.ts
dashboard/src/lib/operator-auth-rate-limit.ts
dashboard/src/lib/popular-posts.ts
dashboard/src/lib/publish.ts
dashboard/src/lib/queue-store.ts
dashboard/src/lib/secret-mask.ts
dashboard/src/lib/seed-parse.ts
dashboard/src/lib/send-notification.ts
dashboard/src/lib/settings-store.ts
dashboard/src/lib/setup-guides.ts
dashboard/src/lib/social-connect.ts
dashboard/src/lib/sourcing-bridge.ts
dashboard/src/lib/storage.ts
dashboard/src/lib/supabase.ts
dashboard/src/lib/tenant-auth.ts
dashboard/src/lib/tenant-context.ts
dashboard/src/lib/tiktok.ts
dashboard/src/lib/verify-channel.ts
dashboard/src/lib/video-limits.ts
dashboard/src/lib/voice-examples.ts
dashboard/src/lib/voice-tone.ts
dashboard/src/lib/wiki-retrieve.ts
dashboard/src/lib/youtube-token.ts
```

### 저장 캡처·품질 기준·외부 벤치마크

```text
docs/prototype/qa-v23/dark-desktop-1024.png
docs/prototype/qa-v23/operator-desktop-1024.png
docs/prototype/qa-v23/studio-dark-1024.png
docs/prototype/qa-v23/studio-desktop-1440.png
docs/prototype/qa-v23/studio-desktop-1024.png
docs/prototype/qa-v23/studio-history-1024.png
docs/prototype/qa-v23/studio-mobile-390.png
/Users/sj/.claude/standards/dev.md
/Users/sj/.claude/standards/doc-review.md
/Users/sj/.claude/standards/benchmarks.md
/Users/sj/.claude/standards/artifact-stamp.md
/Users/sj/.claude/harness/bin/design-lint.sh
https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
https://www.w3.org/WAI/WCAG22/Understanding/text-spacing
https://designsystem.digital.gov/design-tokens/
https://designsystem.digital.gov/design-tokens/spacing-units/
```

---

`SKILLS_USED: 없음`  
`SKILLS_SKIPPED: 매칭되는 설치 QA 감사 스킬 없음 — dev/doc-review 품질헌법과 공식 벤치마크를 직접 적용`  
`MODEL: gpt-codex/GPT-5`  
`STAMP: line=osmu | agent=qa-verifier crosscheck | created=2026-08-10 17:09 KST | basis=v23 SHA-256 7e9036f6... | 고민=현행과 미래상을 라벨링했더라도 실제 기능을 교체하면 재창조로 판정`
