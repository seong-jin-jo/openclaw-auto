# Marketing Agent v24 핵심 화면 와이어프레임

> STAMP: created_at=2026-08-12 14:05 KST | model=gpt-codex/gpt-5.6 | agent=product-designer | skills=gstack browse workflow, manual design rubric | evidence=v24 brief, v23 prototype, dashboard/src, v23 crosscheck, R02 journey plan, jsdom audit | deliberation=화면을 새로 만들지 않고 실제 owner route와 R02 개선만 v23에 덧댐

## 1. 공통 셸

- 데스크톱 1024 이상: `224px sidebar + minmax(0, 1fr) main`, 주축 `row`.
- 모바일 390: sidebar는 메뉴 버튼으로 열고 main은 1열, 주축 `column`.
- 콘텐츠 inset: desktop 24, mobile 16.
- 패널 내부 흐름: `column`, 패널 사이 24 또는 32.
- 데이터 표: 컨테이너 내부 가로 스크롤 허용. 페이지 가로 넘침은 금지.
- 버튼과 입력: 최소 44 x 44.

## 2. Home `/`

목적: 오늘 무엇이 진행 중이고 어디서 사람 판단이 필요한지 한 블록에서 읽는다.

```text
[Home header]                                      [새로 확인]

[운영 성과, 단일 블록]
  [발행 확인] [결과 수집] [승인 대기] [24시간 오류]

  [발행물 성과 table]          [최근 활동]

  [채널 운영 상태]
  [연결 수] [공통 소스 channel_accounts]
  Threads / Instagram / X / Facebook / Bluesky / Telegram / Discord / Slack

[R-06 전략 요약, 설계 목표]
  [Instagram/Facebook] [YouTube] [Later] [Metricool]
  [Positioning]
  [Acquisition][Activation][Retention][Revenue][Referral]
```

상태:

- loading: 통합 블록 자리에 shimmer 두 줄. 전략 요약은 읽을 수 있다.
- empty: “채널 연결 후 Studio에서 첫 본문 저장” 한 행동만 제시한다.
- error: Studio 입력과 저장된 초안 보존을 알리고 새로 확인만 허용한다.
- normal: 위 구조.
- excess: 성과 table은 내부 스크롤, 최근 활동은 최신 3건만 노출, 채널은 8개 SSOT 항목만 노출.

상호작용:

- `새로 확인`은 조회만 갱신한다.
- 게시물은 결과 상세, 초안은 Studio, 승인 대기는 Inbox로 이동한다.
- 채널 상태는 Settings와 Admin의 `channel_accounts` 해석과 동일해야 한다.

## 3. Studio `/studio`

목적: 공통 입력을 7개 실제 미리보기로 확인하고 본문을 저장한 뒤 승인과 발행으로 잇는다.

```text
[source] [brand] [wiki] [OSMU 생성] [AI 자동초안] [Save] [Publish 4] [예약]

[소셜 게시물 텍스트]                [미리보기 | 발행 이력]
  Threads / X / Facebook              Threads / X / Facebook
  공통 초안, 플랫폼별 variant         draft idea + body + savedAt + status

[사진과 카드뉴스]                    [미리보기 | 발행 이력]
  Instagram carousel                  Instagram 1/N

[짧은 영상]                          [미리보기 | 발행 이력]
  Shorts / Reels / TikTok             9:16 preview
```

보존:

- 상단 bulk 발행, Save, 예약, Wiki, AI 자동초안, 오른쪽 이력 위치.
- 미리보기 7종과 Instagram carousel.
- 생성 실패 배너는 입력을 보존하고 다시 생성으로 연결.

R02 수정:

- draft record 필수값: `idea`, `body`, `savedAt`, `status`.
- `body`가 없으면 불러오기 비활성, 오류 원인을 표시한다.
- 불러오기는 `body`를 공통 초안에 채우고 편집과 발행으로 이어진다.

상태:

- empty: source 입력과 기존 이력 불러오기.
- loading: 현재 작업만 busy, 다른 그룹 편집 가능.
- error: 생성 실패 배너, 입력과 기존 초안 보존.
- normal: 3개 그룹.
- excess: preview 탭은 내부 스크롤, 본문은 줄바꿈, 이력은 세로 스크롤.

## 4. 채널 상세 `/channels/[channel]`

목적: Studio에서 생성된 canonical record의 채널별 queue, result, account settings를 본다.

실제 탭:

| owner | 탭 |
|---|---|
| Threads | Queue, Analytics, Growth, Popular, Settings |
| Instagram | Queue, Editor, Settings |
| X, Facebook, Bluesky | Queue, Analytics, Settings |
| Telegram, Discord, Slack | credential, Channel Info, Setup Guide |
| YouTube, TikTok | connection/status, `/videos` handoff |

금지:

- 채널별 Create 탭.
- 채널별 Calendar 탭.
- Messaging의 가짜 Queue와 Analytics.
- 연결됨을 게시 가능으로 번역.

상태:

- empty: Studio에서 만들기.
- loading: 선택 탭의 body만 shimmer.
- error: account 보존, publish CTA 비활성, Settings 연결 확인.
- normal: 선택 탭 렌더.
- excess: 탭 rail 내부 스크롤, 긴 계정명과 오류는 `overflow-wrap:anywhere`.

## 5. Calendar `/calendar`

목적: 월 이동, 오늘, 날짜 선택, 해당일 예약 목록을 읽는다.

```text
[2026년 8월]                         [이전 달] [오늘] [다음 달]
[월][화][수][목][금][토][일]
[날짜 셀 x 35]

[8월 12일 일정, 읽기 전용]
18:30 확인 가능한 마케팅 흐름     [Studio에서 열기]
20:00 브랜드 운영 원칙            [Inbox에서 열기]
```

- 일정 변경과 취소를 Calendar 자체 권한처럼 만들지 않는다.
- 수정은 owner route인 Studio 또는 Inbox에서 한다.

## 6. Blog `/blog`

실제 탭: Queue, Editor, Guide.

- Queue: 승인과 삭제.
- Editor: 제목, 본문, 초안 저장.
- Guide: 콘텐츠 가이드와 키워드 뱅크.
- Naver는 자동 게시 성공을 만들지 않는다. 지원 경계와 수동 경로를 명시한다.

## 7. Videos `/videos`

실제 탭: Library, Generate.

- Library: 원본, 비율, 권리, 렌더 상태, 삭제.
- Generate: repurpose, refine, fan-out, slide, TTS, BGM.
- publish target: YouTube, TikTok, Instagram.
- unknown과 partial은 재게시하지 않고 result check 또는 record repair만 허용.
- 긴 job 목록은 세로 스크롤. 상태 칩은 줄바꿈하지 않는다.

## 8. Settings `/settings`

8탭 보존: Channels, AI Engine, Storage, Design Tools, Notifications, Fork 연동, Keywords, System.

Channels:

- Sidebar와 같은 8개 발행 채널만 노출.
- Home, Settings, Admin은 같은 `channel_accounts`를 읽는다.
- 중앙 OAuth 앱 준비는 account 연결과 별도 상태다.
- empty는 첫 연결 CTA, error는 저장소 복구 후 새로 확인.

## 9. Admin `/operator` -> `/operator/customers`

목적: 운영자 토큰 로그인 뒤 단일 고객 관리 화면에서 운영 요약, OAuth 개발자 앱, 가입자, 워크스페이스를 본다.

```text
[OpenClaw Admin] [고객 화면]
[가입자][워크스페이스][활성][연결 계정][발행][실패]

[중앙 OAuth 개발자 앱 3/12 준비]
  > Instagram  [준비]
    Callback URL
    App ID
    App Secret
    [전체 세트 업데이트]
  > Threads    [준비]
  > X          [차단]
  ... 총 12개, 기본 접힘

[Auth 가입자]
[워크스페이스 table]
```

접이식 규칙:

- 기본은 모두 접힘. 프로토타입 설명용 첫 항목만 열림.
- summary는 provider, required fields, 준비 상태를 한 줄로 보여준다.
- 펼친 항목에만 callback, fields, 저장, 삭제, 공식 문서를 표시한다.
- 긴 callback과 secret label은 줄바꿈한다.
- 저장은 모든 필드를 한 세트로 처리한다.
- secret 원문은 재인증 후 30초만 보인다.

회수 필요:

- R02 문서는 14개 폼이라 적지만 현재 `OAUTH_CREDENTIAL_DEFINITIONS`는 12개다. 현재 코드 진실원에 맞춰 12개만 설계했다. 14개가 맞다면 누락 provider 두 개와 credential 방식의 제품 결정을 plan에서 다시 확정해야 한다.

## 10. 디자인 자가검수

| 항목 | 정적 판정 | 근거 |
|---|---|---|
| 구조 보존 | PASS | v23 shell, 26 destinations, Studio visual7 보존 |
| 재창조 제거 | PASS | per-channel Create/Calendar, Admin 10탭 제거 |
| 8pt 계열 간격 | PASS | 4, 8, 12, 16, 24, 32, 48만 사용. sr-only 예외 |
| inline style | PASS | 0 |
| typography | PASS | 12, 13, 15, 17, 20, 24 |
| empty/loading/error | PASS | core owner route별 계약 명시 |
| overflow 0/normal/excess | PASS, 정적 | 문서와 CSS 계약 확인 |
| 실제 390/1024/1440 렌더 | 미검증 | 결과 파일 open 금지 지시 |

Red team: 까다로운 고객은 R-06 전략 섹션을 현재 기능으로 오해할 수 있다. 프로토타입에 `설계 목표`, `현재 Home 코드에는 미구현`을 동시에 표시했다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 R02의 14개와 현재 코드의 12개가 서로 다른 구현 시점을 가리키는 것이다. 근거 없는 두 개를 만들지 않고 회수 항목으로 남겼다.

SOURCES: `docs/prototype/v24-brief.md` | `docs/audit/v23-codex-crosscheck.md` | `docs/audit/r02-journey-plan/r02-journey-fix-plan-v1-opus.html` | `dashboard/src` | `DESIGN.md` | https://help.later.com/hc/en-us/articles/360043244733-Add-Remove-Transfer-Social-Profiles-in-Later | https://help.metricool.com/api-limitations-per-social-network-n7zlr | https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack design-review v2.0.0의 APP UI classifier, litmus, hard rejection, category scoring, triage

SKILLS_SKIPPED: screenshot, browser, commit, outside voices. 사용자 no-open 지시와 dirty shared worktree 때문에 full live workflow 차단

## 11. v24.1 런타임 정합

화면 구조와 정보 위계는 v24에서 바꾸지 않았다. 빈 화면 회귀만 닫기 위해 모든 route, tab, overlay, action이 같은 root render 계약을 사용하도록 확인했다.

- 26개 route의 root는 항상 1개 이상 자식과 텍스트를 갖는다.
- Home, Studio의 8개 상태는 입력과 다음 행동을 보존한다.
- Settings 8탭, Threads 5탭, Instagram 3탭은 실제 tab click으로 전환한다.
- onboarding, connect, journey, operator overlay는 닫기 또는 다음 단계가 있어 dead-end를 만들지 않는다.
- `data-axis`, desktop/tablet/mobile 열수, empty/normal/excess 계약은 기존 v24를 유지한다.

테스트됨: jsdom 26 routes, 172 checks, 60 actions, runtime errors 0, failed checks 0.

미검증: 실제 Chrome 1440·1024·390의 줄바꿈, overflow, focus, contrast.

SOURCES: `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html` | `docs/prototype/qa-v24/jsdom-audit-after.json`

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: gstack browse workflow를 actual-click 감사 설계에 사용

SKILLS_SKIPPED: 실제 Chrome과 gstack design-review는 현재 sandbox에서 실행 차단
