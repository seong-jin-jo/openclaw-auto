# OSMU Marketing Agent user flow v17

> 🏷 STAMP | line: marketing-agent-design | 생성: 2026-08-06 18:43 KST | model: gpt-codex/gpt-5.6-sol | agent: product-designer / marketing_agent_design_v17 | skills: brand-positioning-kit | 근거: 승인 PRD v7.2.1, current code/wiki, v12 baseline, v16 rejected design | 고민: 26개 목적지를 유지하면서 생성부터 실제 결과와 다음 수정까지 같은 콘텐츠로 회수되는 경로를 만들었다.

## Scope and evidence boundary

- 제품 한 문장: 한 번 고른 브랜드 근거를 채널별로 고쳐 쓸 수 있는 콘텐츠와 확인 가능한 게시 결과로 바꾸고, 그 결과를 다음 콘텐츠에 반영한다.
- 시작점은 홈 또는 Studio다. 홈을 반드시 거치는 funnel이 아니다.
- Studio는 텍스트 게시물, 짧은 영상, 카드뉴스 세 영역과 기존 편집, 저장, 선택 게시, 예약, SchedulePanel, 위키와 저장 이력을 유지한다.
- Telegram, Discord, Slack은 검수 뒤 `커뮤니티로 보내기`를 켠 경우에만 나타난다.
- 이 문서는 디자인 흐름이다. 실제 provider 계정 연결, 게시, 수집 완료를 주장하지 않는다.

## Customer language continuity

한 콘텐츠를 화면마다 다른 내부 번호로 설명하지 않는다. 다음 네 표현을 반복한다.

| field | example | visible screens |
|---|---|---|
| 제목 | 봄 클래스 모집, 마지막 확인 | Studio, 작업 목록, Inbox, Calendar, Videos, result, analytics |
| 수정 | 수정 3 | same |
| 근거 | 브랜드 소개와 가격표에서 확인 | Studio, Inbox, result, next change |
| 단계 | 저장됨, 승인 대기, 예약됨, 게시됨, 성과 확인 | 해당 owner |

## Entry and role paths

### Public

1. `/` 비회원은 제품 소개를 본다.
2. `Google 계정으로 시작`은 `/login`으로 간다.
3. 취소 또는 로그인 실패는 비회원 화면을 유지하고 `다시 로그인`을 제공한다.
4. `/operator`는 별도 운영자 토큰 진입이다. 고객 로그인 폼과 섞지 않는다.

Terminal actions: 고객 로그인, 운영자 콘솔, 개인정보, 이용약관, 데이터 삭제 안내.

### Customer

1. 로그인 성공 뒤 자신의 workspace 이름과 26개 메뉴를 본다.
2. workspace를 확인하지 못하면 mutation 없이 `다시 확인` 또는 `로그아웃`을 제공한다.
3. 고객은 자신의 채널 계정, 브랜드 근거, 콘텐츠, 자산, 게시 결과, 성과만 본다.
4. 제공사 토큰 원문과 중앙 OAuth 앱 비밀값은 보지 못한다.

Terminal actions: 성과에서 다음 변경 선택, Studio에서 제작, Settings에서 계정 또는 정책 관리.

### Operator

1. `/operator`에서 운영자 토큰을 확인한다.
2. 성공하면 고객 메뉴가 없는 Admin 셸로 `/operator/customers`를 연다.
3. Admin은 고객과 workspace 상태, 중앙 OAuth 앱, 사용량, 지원 복구를 관리한다.
4. Admin은 고객 대신 게시하지 않고 고객 workspace를 활성 workspace로 마운트하지 않는다.

Terminal actions: 고객 정지 또는 재개, 공유 AI 승인 또는 회수, OAuth 앱 자격증명 관리, 안전한 지원 복구.

## Core happy path

1. 고객이 Settings 또는 채널 계정 화면에서 현재 계정 이름, 연결 이유, 마지막 확인, 가능한 행동, 권한, 만료와 자동 갱신, 관리 행동을 확인한다.
2. 다른 계정을 쓰려면 현재 계정과 바꿀 계정을 확인하고 `다른 계정으로 연결`을 누른다.
3. Studio에서 브랜드 소개, 가격표, 위키 또는 GitHub 저장소를 고른다.
4. `OSMU 초안 만들기`를 누른다.
5. 텍스트 게시물은 desktop 비교 grid, 짧은 영상은 Shorts/Reels/TikTok 실제 카드, 카드뉴스는 Instagram 큰 preview에 나타난다.
6. 고객이 Threads 카드만 고친다. 다른 카드와 선택 상태는 변하지 않는다.
7. `저장`을 누른다. `봄 클래스 모집, 마지막 확인 · 수정 3`이 만들어진다.
8. direct workspace는 `지금 게시` 또는 `예약`, approval-required workspace는 `승인 요청` 또는 `예약 승인 요청`을 본다.
9. 계정 또는 권리가 준비되지 않았으면 버튼 이름은 유지되고 disabled reason과 `다시 연결` 또는 `권리 확인`을 본다.
10. 승인 요청은 Inbox에서 같은 제목, 수정 번호, 계정, 근거, 시각을 확인한다.
11. 예약은 Calendar에서 같은 제목과 수정 번호로 보인다.
12. Social 게시물은 해당 채널 Queue 작업 목록에 보이고, 짧은 영상은 `/videos` 작업에 보인다.
13. 게시가 확인되면 외부 게시물 식별자, 실제 링크, 게시 시각이 나타난다.
14. 홈은 게시 시도, 성공, 실패, 처리 중, 성과 수집 범위, 확인된 게시물 수, 계정 준비만 합산한다.
15. 채널별 성과는 Threads, X, Facebook, Instagram Feed, Bluesky, Shorts, Reels, TikTok을 따로 보여준다.
16. 수집된 Threads 결과만 근거로 `다음 초안은 첫 문장을 질문형으로 바꾸기`를 제안한다.
17. `다음 초안에 반영`을 누르면 Studio가 같은 제목의 새 수정으로 열린다.

Terminal outcome: 다음 콘텐츠 수정 4가 시작된다. Dead-end 0.

## Studio rail paths

### Text posts

1. Threads, X, Facebook, Bluesky variant와 Instagram Feed용 caption/card context를 비교한다.
2. 각 카드에 계정, 글자 수, 미디어 요구, 근거 상태, 수정, 저장, 정책별 게시, 예약, 결과가 있다.
3. Bluesky는 생성 결과가 있더라도 실제 연결과 발행 능력을 확인하기 전 게시 버튼을 켜지 않는다.
4. desktop은 2 or 3 column comparison, 390은 one-column stack이다.

Terminal actions: 수정 저장, 정책별 실행, 계정 연결, 결과 확인.

### Short video

1. Shorts, Reels, TikTok 세 9:16 카드를 항상 보여준다.
2. 각 카드는 썸네일 또는 영상, hook, caption, 계정, 권리, AI 표시, readiness, progress를 가진다.
3. `영상 작업으로 보내기`는 `/videos`에 같은 제목과 수정 번호의 video job을 만든다.
4. `/videos`는 업로드, 긴 영상 URL, 후보 추출, 다듬기, 라이브러리 추가, 계정, metadata, 공개범위, 댓글/듀엣/스티치, AI 표시, 게시, 결과, 복구를 관리한다.
5. unknown rights는 `권리 확인` 전 승인과 게시를 막는다.

Terminal actions: 업로드, 후보 만들기, 선택 클립 다듬기, 영상별 게시 또는 승인 요청, 결과 확인.

### Card news

1. Instagram large preview와 슬라이드 순서를 유지한다.
2. 주제, 캡션, 슬라이드, 이미지 추가, 순서 변경, 큐에 초안 저장이 가능하다.
3. Midjourney는 고객 raw token 입력을 요구하지 않는다.
4. 고객은 직접 업로드 또는 안전한 Images 경로를 쓴다.

Terminal actions: 카드뉴스 저장, Instagram 계정 확인, 정책별 실행.

### Community handoff

1. 기본 상태는 OFF이며 메시지 작업 0개다.
2. 고객이 세 레일 검수를 끝낸 뒤 `커뮤니티로 보내기`를 켠다.
3. Telegram, Discord, Slack 중 대상을 명시 선택한다.
4. 선택 대상에만 message delivery가 생긴다.
5. 승인 필요 시 Inbox, 예약 시 Calendar로 같은 제목과 수정 번호가 이어진다.
6. Messaging 계정 화면에는 Queue와 Analytics 탭을 만들지 않는다.

Terminal actions: 선택 대상에 지금 보내기, 승인 요청, 예약, 예약 승인 요청, 또는 취소.

## Approval policy paths

| workspace policy | ready | Studio action | result |
|---|---:|---|---|
| 바로 게시 허용 | yes | 지금 게시 | 해당 채널 실행 후 결과 또는 안전한 복구 |
| 바로 게시 허용 | no | 지금 게시 disabled | 이유와 다시 연결 또는 권리 확인 |
| 게시 전 승인 필요 | yes | 승인 요청 | Inbox 승인 전 외부 게시 없음 |
| 게시 전 승인 필요 | no | 승인 요청 disabled | 문구 유지, 이유와 해결 행동 |
| 바로 게시 허용 | yes | 예약 | Calendar에 예약됨 |
| 바로 게시 허용 | no | 예약 disabled | 이유와 해결 행동 |
| 게시 전 승인 필요 | yes | 예약 승인 요청 | Inbox와 Calendar에 예약 승인 대기 |
| 게시 전 승인 필요 | no | 예약 승인 요청 disabled | 문구 유지, 이유와 해결 행동 |

Settings의 workspace owner만 정책을 변경한다. 일반 구성원은 현재 정책과 설명을 읽는다. 기존 direct workspace는 owner가 명시적으로 바꾸기 전 버튼 의미가 변하지 않는다.

## Account switch and reconnect paths

### Success

1. 화면은 현재 계정 `@osmu.official`을 먼저 보여준다.
2. 고객이 `다른 계정으로 연결`을 누른다.
3. 제공사 계정 선택 또는 로그아웃과 권한 해제 안내가 열린다.
4. 돌아온 계정 `@springclass`의 identity, scope, last checked, expiry and refresh health를 확인한다.
5. 모든 확인이 끝난 뒤 `연결됨`을 표시한다.
6. Studio, Settings, 채널 헤더, 결과에서 같은 계정 이름을 본다.

### Cancel

1. 고객이 제공사에서 취소한다.
2. 기존 계정은 그대로 유지된다.
3. `계정 변경을 취소했습니다`와 `다시 시도`를 제공한다.

### Mismatch

1. 고객이 원한 계정과 돌아온 계정이 다르다.
2. 새 계정을 활성화하지 않는다.
3. 현재 계정과 돌아온 계정을 나란히 보여준다.
4. `다시 선택` 또는 `기존 계정 유지`를 제공한다.

### Expired or revoked

1. 연결 상태는 `다시 연결 필요`가 된다.
2. 승인 정책 문구는 바뀌지 않는다.
3. 게시 행동은 disabled이고 `다시 연결`이 나타난다.

Terminal actions: 연결됨, 기존 계정 유지, 다시 선택, 다시 연결. Dead-end 0.

## Social and platform owner paths

### Threads

- Header7, Queue, Analytics, Growth, Popular, Settings.
- Queue는 같은 콘텐츠의 작업 상태와 결과를 관리한다.
- Analytics는 수집된 native 성과와 출처를 보여준다.
- Popular는 아이디어 근거 후보이며 자동으로 사실이 되지 않는다.

### X, Facebook, Bluesky

- Header7, Queue, Analytics, Settings는 실제 capability가 있을 때만 보여준다.
- 미연결은 Settings가 첫 화면이다.
- 수집하지 못한 성과는 숫자 0이 아니라 미수집 이유와 다음 행동이다.

### Instagram

- 계정 소유 화면 하나에서 Queue, Editor, Settings를 유지한다.
- Feed는 이 화면에서 관리한다.
- Reels는 `Reels 영상 작업 열기`로 `/videos`의 Reels 필터를 연다.
- generic Analytics tab을 발명하지 않는다.

### YouTube Shorts and TikTok

- 채널 화면은 Header7, 계정 선택, 권한, 만료, readiness, `영상 작업실 열기`를 제공한다.
- 생성과 발행은 `/videos`에서 한다.
- text Queue와 fake Analytics를 만들지 않는다.

### Telegram, Discord, Slack

- Header7에서 webhook, bot, OAuth 방식에 해당하지 않는 필드를 `해당 없음: 이유`로 보여준다.
- 연결과 setup guide를 제공한다.
- Studio에서는 검수 뒤 community handoff로만 등장한다.
- Queue와 Analytics는 없다.

## Analytics and next-change paths

### Aggregate home

합산 가능:

- 게시 시도
- 게시 성공
- 게시 실패
- 처리 중
- 성과 수집 범위
- 콘텐츠 한 묶음당 확인된 게시물 수
- 계정 준비 상태

합산 금지: 조회, 도달, 노출, 반응, 좋아요, 답글, 재게시, 팔로워.

### Collected row

1. 채널과 콘텐츠 형식을 표시한다.
2. 지표 뜻과 제공사 또는 API 출처를 표시한다.
3. 확인 기간과 수집 시각을 표시한다.
4. 계정과 실제 게시물 링크를 표시한다.
5. 다음 변경 제안에는 관찰, 한계, 바꿀 것 하나를 표시한다.

### Not-collected row

1. 값은 `해당 없음: 미수집`이다.
2. 이유는 권한 없음, 연결 준비 중, 제공사 미지원 중 하나다.
3. 확인 기간, 수집 시각, 게시물은 각각 `해당 없음: 미수집`이다.
4. 다음 행동은 권한 연결, 다시 확인, 다른 성과 보기 중 실제 가능한 하나다.
5. 다음 콘텐츠 변경의 근거로 사용하지 않는다.

Terminal actions: 다음 초안에 반영, 표본 더 모으기, 권한 연결, 다시 확인. Dead-end 0.

## Data, keyword, blog, asset, Settings and Admin paths

| destination | user purpose | input | output | owner | terminal action |
|---|---|---|---|---|---|
| Blog Performance | 블로그 결과 확인 | 기간 | 발행 글과 검색 유입 | blog stats | Blog 글 열기 |
| Search Console | 검색 유입 확인 | Google 권한, 기간 | 검색어 표 | GSC | 새로 확인, 권한 연결 |
| Google Analytics | 제공 여부 확인 | 없음 | 현재 사용 불가 이유 | Settings | 설정 보기 |
| Keyword Planner | 콘텐츠 수요 조사 | seed keyword | keyword list | keyword bank | 계획 후보로 보내기 |
| Search Advisor | 제공 여부 확인 | 없음 | tenant storage 미준비 | Settings | 설정 보기 |
| Naver Trends | 제공 여부 확인 | 없음 | 현재 사용 불가 이유 | external/data owner | 다른 조사 열기 |
| Google Trends | 외부 관심도 확인 | keyword | external result | Google Trends | 외부 서비스 열기 |
| Blog | 블로그 글 관리 | 주제와 원고 | draft, queue, approved result | Blog | 새 글, 저장, 승인 |
| Images | 내 이미지 관리 | upload | tenant gallery and URL | Images | 업로드, 복사, 삭제 확인 |
| Videos | 짧은 영상 제작과 게시 | upload or URL | clip, job, proof | Videos | 다듬기, 정책별 실행, 결과 |
| Midjourney | 안전 제공 범위 확인 | customer raw token 없음 | safe-disabled state | operator | Images 열기 |
| Settings | 계정과 고객 설정 | customer-owned values | saved setting and audit confirmation | workspace owner | 저장, 토큰 폐기 |
| Admin | 고객과 운영 지원 | operator-authorized action | workspace, OAuth app, usage, recovery status | operator | 정지, 재개, 복구 |

### Customer automation token

1. 고객이 이름과 네 가지 허용 범위를 고른다.
2. `발행 요청`은 기본 OFF다.
3. 발급 직후 원문은 한 번만 보여준다.
4. 닫은 뒤에는 이름, 만든 시각, 마지막 사용, 허용 범위, 상태만 보인다.
5. 고객은 토큰을 폐기할 수 있다.
6. 제공사 토큰과 혼동하지 않는 설명을 제공한다.

Terminal actions: 복사하고 닫기, 새 토큰 만들기, 폐기. Dead-end 0.

### Admin support recovery

1. 고객 또는 workspace를 선택한다.
2. 계정 연결 실패, 사용량 초과, 게시 결과 불명확, 저장소 장애 중 원인을 본다.
3. 고객에게 보여줄 수 있는 안전한 상관 정보와 운영자 세부 정보를 분리한다.
4. `연결 상태 새로 확인`, `내부 기록 복구`, `고객 재개` 같은 외부 재게시 없는 행동만 제공한다.
5. raw provider token은 보여주지 않는다.

Terminal actions: 안전한 확인, 기록 복구, 정지, 재개, 고객에게 안내 복사.

## State matrix

| state | path | allowed action | forbidden |
|---|---|---|---|
| ready | 정상 화면 | 현재 primary action | 없음 |
| loading | 이름 붙은 한 단계 | 기다리기, 취소 | shimmer 2개 이상 |
| empty | 첫 데이터 없음 | 만들기, 연결, 업로드 | 빈 페이지 |
| partial | 일부 성공 또는 일부 준비 | 성공 보존, 실패만 확인 | 전체 재실행 |
| blocked | 근거, 권리, 계정 없음 | 확인 또는 연결 | 게시, 승인 |
| permission | scope 또는 역할 부족 | 필요한 권한 보기, 다시 연결 | 성공 배지 |
| stale | 확인 시각 오래됨 | 새로 확인 | 게시 또는 승인 |
| degraded | 제공사 지연 | 안전한 일부 계속, 나머지 보류 | 정상이라고 표시 |
| error | 확인된 실패 | 실패한 항목만 다시 시도 | 전체 자동 재시도 |
| success | proof complete | 실제 게시물 보기, 성과 확인 | 가짜 link |
| uncertain | 외부 결과 불명확 | 결과 확인 | 재게시 |
| repair | 외부 성공, 내부 저장 실패 | 내부 기록 복구 | 외부 호출 |

## 26 destination manifest

| # | destination | owner route | distinct purpose | primary terminal action |
|---:|---|---|---|---|
| 1 | 성과 | `/` | 운영 상태와 다음 변경 | 다음 초안에 반영 |
| 2 | OSMU Studio | `/studio` | 세 레일 생성과 실행 시작 | 저장 또는 정책별 실행 |
| 3 | 승인 인박스 | `/inbox` | 승인과 반려 | 승인, 수정 요청, 보류 |
| 4 | 발행 캘린더 | `/calendar` | 예약 관리 | 변경 또는 취소 |
| 5 | Threads | `/channels/threads` | 게시물과 native 성과 | 작업 또는 결과 열기 |
| 6 | X | `/channels/x` | X 작업과 계정 | 연결 또는 작업 열기 |
| 7 | Instagram | `/channels/instagram` | Feed, Editor, Reels handoff | 카드 저장 또는 영상 작업 |
| 8 | Facebook | `/channels/facebook` | Page 게시물 작업 | 연결 또는 작업 열기 |
| 9 | Bluesky | `/channels/bluesky` | 글 작업과 App Password | 연결 또는 작업 열기 |
| 10 | Telegram | `/channels/telegram` | bot destination setup | 연결 확인 |
| 11 | Discord | `/channels/discord` | webhook destination setup | 연결 확인 |
| 12 | Slack | `/channels/slack` | OAuth or webhook setup | 연결 확인 |
| 13 | YouTube Shorts | `/channels/youtube` | channel readiness | 영상 작업실 열기 |
| 14 | TikTok | `/channels/tiktok` | account readiness | 영상 작업실 열기 |
| 15 | Blog Performance | `/blog-performance` | blog metrics | Blog 열기 |
| 16 | Search Console | `/search-console` | search data | 새로 확인 |
| 17 | Google Analytics | `/google-analytics` | unavailable truth | Settings 열기 |
| 18 | Keyword Planner | `/keyword-planner` | keyword research | 계획 후보로 보내기 |
| 19 | Search Advisor | `/search-advisor` | unavailable truth | Settings 열기 |
| 20 | Naver Trends | `/naver-trends` | unavailable truth | 다른 조사 열기 |
| 21 | Google Trends | `/google-trends` | external research | 외부 서비스 열기 |
| 22 | Blog | `/blog` | separate blog domain | 새 글 만들기 |
| 23 | Images | `/images` | tenant image gallery | 업로드 |
| 24 | Videos | `/videos` | video workbench | 영상 작업 실행 |
| 25 | Midjourney | `/channels/midjourney` | customer safe-disabled | Images 열기 |
| 26 | Settings | `/settings` | customer-owned settings | 저장 또는 토큰 폐기 |

Manifest rule: unique destination key 26/26, destination view 26/26, home bounce 0. Instagram Reels is a format handoff inside Instagram and Videos, not a 27th account destination.

## Responsive, keyboard and theme paths

## Official benchmark to flow diff

| official observation | 차용한 flow decision | not copied |
|---|---|---|
| Buffer Composer selects channels before a queue/date/now action; scheduled channel posts are edited separately | `F-CUST-02` keeps select, card-level edit/save, then `지금 게시` or `예약`; approval workspaces substitute only the policy-owned labels | posting defaults and queue priority do not silently replace the visible decision |
| Sprout sends Compose into Needs Approval and exposes edits, comments, current step and expired-schedule recovery | `F-CUST-03` keeps one review owner, history, reject/edit and new-time resubmission; uncertain never auto-reposts | enterprise multi-step workflow authoring and external approver administration stay outside v17 |
| Later selects multiple profiles, customizes each post and disables unsupported profiles with explanation | `F-CUST-02.2` keeps per-channel variants and readiness gates; disabled cards preserve reason and action | Access Group and plan-limit language does not enter customer copy |
| Later Analytics filters by period, handle, platform and post type | `F-CUST-06` carries period, account, publication and collected-at on each native metric row | native values are never rolled into a synthetic cross-provider engagement total |
| Meta Business Suite search excerpt routes Page insight through `Insights > Content > Overview` | Facebook performance remains inside its account owner path | Meta navigation is not cloned and missing collection remains `해당 없음: 미수집` |

Research trace: `search_query` call 1 queried four official Buffer, Sprout, Meta and Hootsuite domains; call 2 queried four official Hootsuite, Later and Meta domains. `open` then fetched Buffer Scheduling, Sprout Approval, Later Multi-Profile Scheduling and Later Custom Analytics. Meta direct open redirected to login, so only the official search excerpt informed the limited navigation observation.

1. 1440 uses 224px Sidebar, 1180px max content, two-column comparison where useful.
2. 1024 keeps 224px Sidebar, one main column, internal tab and preview scrolling.
3. 390 replaces Sidebar with a 44px Menu trigger and full-height drawer.
4. Drawer has all 26 destinations, closes on route selection, backdrop, or Escape, and returns focus to Menu.
5. Page horizontal overflow is 0. Only named preview or tab rails may scroll inside.
6. Buttons and tabs are at least 44px at 390.
7. Light and dark share semantic tokens. State meaning does not rely on hue alone.
8. Reduced motion removes transition and smooth scroll.

## Dead-end audit

- Happy path returns result to next Studio revision.
- Every empty state has one first action.
- Every error, permission, stale, degraded, uncertain, repair state has one safe recovery action.
- Unsupported and external owners end with a truthful alternative or external link.
- Messaging can return to Studio without creating a delivery.
- Account switch cancel and mismatch preserve prior safe state.
- Every one of 26 destinations has a distinct terminal action.
- Dead-end target: 0.

## Red team and self-question

Red team: a competitor says the flow is still a scheduler with a decorative AI layer. Revision: the same title, revision and source state are visible at creation, channel work, approval, schedule, result, native analytics and next revision. A channel without collected data cannot generate a next-change claim.

Red team: a skeptical customer says all channel logos imply equal capability. Revision: tabs and actions are owned by capability. Messaging has no Queue or Analytics, Instagram has Editor, YouTube and TikTok hand off to Videos, Midjourney is safe-disabled.

Self-question: if this flow is wrong, the most likely reason is that customers enter Studio directly and ignore Home. Revision: Studio direct entry preserves the complete create, review and execute path. Home is a summary and feedback surface, not a mandatory gate.

## 회수 필요

- ⛔ 회수 필요: missing four requested audit task files were replaced with current code/wiki and v16 evidence. A later file arrival requires semantic diff.
- ⛔ 회수 필요: real OAuth success, cancel, mismatch and refresh health need provider browser evidence.
- ⛔ 회수 필요: actual publish proof, native metrics and cross-screen parity need build and QA.
- ⛔ 회수 필요: storage, command, idempotency and recovery contracts belong to eng-design dialogue.

RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=24/25
WEAKEST_LINE: "Home is a summary and feedback surface, not a mandatory gate." 이유: 실제 사용행동 관찰 전 정보 구조 가설이다.
SOURCES: `pipeline-state.md`; PRD v7.2.1; one-thing; persona; BM; risks; final plan critic; current Marketing Hub code/wiki; v12 browser baseline; v16 artifacts; https://support.buffer.com/article/642-scheduling-posts; https://support.sproutsocial.com/hc/en-us/articles/205974715-Message-Approval-Workflows; https://help.later.com/hc/en-us/articles/360043243873-Schedule-One-Post-to-Multiple-Social-Profiles; https://help.later.com/hc/en-us/articles/33109662792471-Later-s-Custom-Analytics; https://www.facebook.com/help/131809553587433; https://developers.google.com/identity/protocols/oauth2/web-server; https://developers.tiktok.com/doc/login-kit-web
MODEL: gpt-codex/gpt-5.6-sol
SKILLS_USED: brand-positioning-kit for audience, anti-audience, tension, tone and taboo applied to flow copy
SKILLS_SKIPPED: imagegen because the flow uses current code-native icons and no bitmap asset is required; no product-design skill was installed
