# OSMU R-01~R-14 코드 교차감사 v1

## 한 줄 결론

정적 타입 검사, 전체 단위·통합 테스트, 프로덕션 빌드는 통과했다. 그러나 R-05 심사 상태 UX와 R-09 채널 목록·탭·Studio 계약은 현재 코드에서 불일치가 확인됐다. 승인된 프로토타입 핀과 build 게이트가 없어 제품 소스는 수정하지 않았으며, 회원가입·실 OAuth·실 발행·Admin 실화면은 라이브 검증이 남았다.

## 감사 기준과 범위

- 요청 정본: `docs/requests/2026-08-08_2026-08-10-chairman-requests.md`, SHA-256 `cb802f499029d0523213479306d361756287ffaadad31b6bafdf598f669a8aa2`
- 기술설계: `docs/fdd/fdd-r02-journey-fix-v1.0.0-opus.md`, v1.0.0, SHA-256 `0197870ea2535f3f78c739bbe66e237b1790c06cc2374a7ea1dd9a6aa067c2ed`
- 마이그레이션 설계: `docs/fdd/migration-filestore-to-db-v1.0.0-opus.md`, v1.0.0, SHA-256 `4bed033fb6e173a6bcd1c43339481881e619bed100e8570734bbfafe56726392`
- 테스트 설계: `docs/fdd/test-plan-r02-v1.0.0-opus.md`, v1.0.0, SHA-256 `270a225692d79ec5e04f41cb38d54845945dd4c9408fe8d71ac187562135f639`
- PRD: 지정 경로 `docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`는 존재하지 않았다. 실제 파일 `docs/notes/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`, v7.3.5, SHA-256 `ae6155bb8a04f7f7da576000f27f339b0da4c63b29bbbda7972a1890be7a296e`를 읽어 감사했다.
- 코드 기준: `dashboard/src`, 브랜치 `feat/design-system-and-missing-features`, 감사 시작 HEAD `04632b53`
- 배포 상태: 코디네이터 제공 정보상 prod 배포됨. 이 worker가 prod 화면을 직접 관찰하지 않았으므로 배포 동작은 미검증이다.

### 게이트 판정

`pipeline-state.osmu.md:7-23`은 `current_stage: qa`, `approved_stages: [plan]`, design 진행 중, build pending을 동시에 기록한다. 승인 artifact에는 design hub 또는 프로토타입 핀이 없다. 최신 후보 `docs/prototype/openclaw-auto-marketing-agent-fidelity-v24-gpt-codex.html`은 `docs/qa/qa-tracker.md`에서 실제 Chrome 검증 전 NG로 유지된다. 따라서 이번 감사에서는 `dashboard/src`와 `dashboard/tests`를 수정하지 않았다.

## R-01~R-14 대조표

상태 정의:

- `검증됨`: 현재 코드·문서와 이번 실행 증거로 요구 범위가 확인됨
- `수정함`: 이번 build에서 결함을 수정하고 정적·단위·통합 검증까지 통과함
- `미검증-라이브필요`: 코드와 테스트는 있으나 외부 OAuth, DB, 브라우저 또는 운영자 화면의 직접 관찰이 필요함
- `미해결`: 현재 코드·파이프라인에서 결함 또는 계약 불일치가 확인됨

| 요청 | 상태 | 코드 증거 | 사유 |
|---|---|---|---|
| R-01 파이프라인 상황 | 미해결 | `pipeline-state.osmu.md:7-23` | 현재 단계가 qa인데 승인 단계는 plan뿐이고 design은 진행 중, build는 pending이다. 런타임 상태가 자기모순이며 승인 프로토타입 핀도 없다. |
| R-02-a 신규 유저 회원가입 | 미검증-라이브필요 | `dashboard/src/app/signup/page.tsx:4-5`, `dashboard/src/app/login/page.tsx:82`, `dashboard/src/components/shared/AuthGate.tsx:375` | 가입은 Google OAuth 로그인으로 통합됐고 인증 관련 테스트는 통과했다. 실제 신규 Google 계정 가입과 세션 생성은 라이브 검증이 필요하다. |
| R-02-b OAuth 연결 후 자격정보 저장 | 미검증-라이브필요 | `dashboard/src/app/api/connect/[provider]/route.ts:11-66`, `dashboard/src/app/api/connect/[provider]/callback/route.ts:149-173`, `dashboard/src/lib/channel-accounts.ts:112-149` | state·PKCE·callback·암호화 저장 체인은 연결돼 있다. 실제 제공자 동의, callback, refresh token 저장은 실 OAuth와 DB로 확인해야 한다. |
| R-02-c 저장된 연결정보 조회 | 미검증-라이브필요 | `dashboard/src/app/api/channels/[provider]/accounts/route.ts:23-32`, `dashboard/src/lib/channel-accounts.ts:174-180`, `dashboard/src/components/channel/AccountManager.tsx:8` | 고객 화면에는 비밀값 원문이 아니라 계정 식별·상태만 조회되도록 분리돼 있다. 운영자 credential 조회·마스킹 테스트는 통과했으나 실제 저장 계정 표시는 라이브 확인이 필요하다. |
| R-02-d 콘텐츠 생성 | 검증됨 | `dashboard/src/app/studio/page.tsx:210-260`, `dashboard/src/app/studio/page.tsx:522-540` | 생성 함수, 플랫폼별 미리보기, 생성 후 상태 연결이 존재하며 R-02 계약·컴포넌트 테스트와 전체 Vitest가 통과했다. 외부 AI 품질은 이번 요구의 코드 연결 판정에서 제외했다. |
| R-02-e 콘텐츠 수정 | 검증됨 | `dashboard/src/app/studio/page.tsx:397-406`, `dashboard/src/app/studio/page.tsx:562-573`, `dashboard/src/app/studio/page.tsx:608-612` | 저장 이력 불러오기, 편집, 재생성, 미리보기 체인이 유지돼 있고 관련 테스트가 통과했다. |
| R-02-f 콘텐츠 발행 | 미검증-라이브필요 | `dashboard/src/app/studio/page.tsx:313-390`, `dashboard/src/app/studio/page.tsx:448-450` | Publish 클릭에서 `/api/publish` 호출, 결과·permalink·partial 복구 저장 체인은 존재하고 publish 테스트는 통과했다. 실제 SNS 게시와 permalink는 라이브 검증이 필요하다. |
| R-02-g 성과 | 검증됨 | `dashboard/src/app/page.tsx:109-176`, `dashboard/src/app/page.tsx:191-235`, `dashboard/src/lib/home-metrics.ts:26` | `published_posts` 기반 발행·조회·좋아요·답글 요약과 발행물 목록이 연결돼 있다. R-14의 Awareness 범위와 일치한다. |
| R-02-h Settings | 검증됨 | `dashboard/src/app/settings/page.tsx:23-108`, `dashboard/src/components/settings/ChannelsSettings.tsx:8-9` | Settings 라우트와 8개 고객 탭은 연결돼 있다. 단, R-09의 영상 채널 목록 불일치는 별도 미해결로 분리했다. |
| R-02-i Admin 관리 | 미검증-라이브필요 | `dashboard/src/app/operator/customers/page.tsx:368-514`, `dashboard/src/app/api/operator/customers/route.ts:103-145`, `dashboard/src/app/api/operator/oauth-credentials/route.ts:1` | 활성 계정 집계, provider 준비상태, credential 저장·마스킹·reveal 체인과 테스트가 있다. 실제 운영자 권한 화면과 실 credential 저장은 라이브 검증이 필요하다. |
| R-03 기존 구현·위키 기반, 재창조 금지 | 검증됨 | `dashboard/src/app/studio/page.tsx:397-450`, `dashboard/src/components/channel/ChannelPage.tsx:107-218`, `docs/구현현황.md` | 기존 Studio 이력·편집·발행·예약과 채널 기능을 감사 기준으로 사용했다. 이번 소스 변경은 0이라 기존 기능 삭제도 0이다. |
| R-04 중앙 OAuth 자동화 성립 여부 | 미검증-라이브필요 | `dashboard/src/lib/oauth-app-credentials.ts:68-192`, `dashboard/src/app/api/connect/[provider]/callback/route.ts:160-173`, `dashboard/src/lib/channel-accounts.ts:126-149` | SaaS가 중앙 앱 자격증명을 소유하고 일반 회원은 자신의 계정을 OAuth로 승인하며, 사용자별 access·refresh token은 암호화 저장하는 구조다. 일반 회원이 별도 client secret을 발급받는 구조는 아니다. 제공자 심사·쿼터·실 callback은 라이브 확인 대상이다. |
| R-05 심사 주체별 상태 UX | 미해결 | `dashboard/src/app/api/connect/readiness/route.ts:23-50`, `dashboard/src/components/channel/SocialConnectButton.tsx:274-293` | readiness 계약은 `{available, reason}`뿐이다. Admin 미준비를 고객 미연결과 분리하는 상태 enum이 없고, UI는 요구된 `오픈 준비 중` 대신 위험 아이콘과 관리자 문의 문구를 표시한다. `발행 준비 중`은 직접 발행 미지원에 대한 다른 조건이다. |
| R-06 플랫폼 정책·포지셔닝·프로토타입 | 미검증-라이브필요 | `dashboard/src/lib/oauth-app-credentials.ts:21-192`, `dashboard/src/lib/setup-guides.ts:52-112`, `wiki/product/positioning.md:106-125` | 플랫폼별 문서 URL·외부 심사 상태와 사용자 가이드, Awareness 포지셔닝은 기록돼 있다. v24 프로토타입은 정적 감사만 끝났고 실제 Chrome NG가 해제되지 않았으며 승인 핀도 없다. |
| R-07 신규유저·관리자 전체 흐름 완결 | 미검증-라이브필요 | R-02-a~i 증거 전체 | 정적 import chain과 단위·통합 테스트는 연결돼 있다. 회원가입, OAuth, 실발행, 성과 반영, Admin 실화면을 한 세션으로 관찰하지 못했으므로 전체 흐름 완료로 판정하지 않는다. |
| R-08 근거 보강 | 검증됨 | 이 문서의 기준 SHA, 코드 `file:line`, 테스트 결과, 공식 정책 출처 | 요청 원문, FDD 3종, PRD, 코드, 공식 제공자 문서를 교차 참조했다. |
| R-09 디자인 시스템·채널 탭·Studio 정합 | 미해결 | `dashboard/src/lib/constants.ts:42-62`, `dashboard/src/components/settings/ChannelsSettings.tsx:8-9`, `dashboard/src/components/layout/Sidebar.tsx:349-374`, `dashboard/src/components/studio/ChannelConnect.tsx:16-30`, `dashboard/src/app/studio/page.tsx:25-70`, `dashboard/src/components/channel/ChannelPage.tsx:107-218`, `dashboard/src/components/channel/InstagramPage.tsx:455-505` | 공통 spacing·색상 token lint는 0건이다. 그러나 Settings는 8개 텍스트 채널만, Sidebar는 YouTube·TikTok 영상 그룹을 별도 노출하고, Studio는 4개만 실발행하며 7개 미리보기를 가진다. generic 채널은 queue·analytics·settings인데 Instagram은 queue·editor·settings라 탭 계약도 다르다. 승인 시안 없이 어느 구조가 정본인지 결정할 수 없다. |
| R-10 재창조 방지 하네스 확인 | 미해결 | `pipeline-state.osmu.md:7-23`, `docs/qa/qa-tracker.md:2315-2324`, R-09 코드 증거 | 하네스 규칙과 prototype NG 기록은 존재한다. 그러나 승인 prototype 미핀과 채널 SSOT 불일치를 현재 게이트 상태가 해소하지 못했으므로 요구가 제품 수준에서 충족됐다고 볼 수 없다. |
| R-11 기존 산출물 기반 속도 문제 | 미해결 | `docs/구현현황.md`, 이 문서의 R-05·R-09 | 기존 구현을 재사용해 감사했지만 남은 결함을 바로 고칠 승인 디자인과 build 게이트가 없다. 요구 전량 동작이라는 종료조건은 아직 닫히지 않았다. |
| R-12 요청 원장 소재 | 검증됨 | `docs/requests/2026-08-08_2026-08-10-chairman-requests.md:15-135` | R-01~R-14 원문 정본이 한 문서에 보존돼 있고 이번 감사의 최상위 기준으로 사용했다. |
| R-13 전량 반영·일관성·비재창조 | 미해결 | R-01, R-05, R-09, R-10 증거 | 요청 전량 반영은 R-05와 R-09가 미해결이므로 아직 성립하지 않는다. 기존 소스는 보존했다. |
| R-14 Awareness 집중 | 검증됨 | `wiki/product/vision.md:9`, `wiki/product/vision.md:147-149`, `wiki/product/positioning.md:106-125`, `dashboard/src/app/page.tsx:109-176`, `dashboard/src/components/layout/Sidebar.tsx:379-391` | 홈 성과는 플랫폼 발행·조회·반응 중심이고 기본 내비게이션에서 GA4·Search Console은 빠졌다. Blog Performance와 콘텐츠 소재용 트렌드 도구는 요구대로 유지된다. |

## 확인된 결함과 수정 판단

### 1. R-05 심사 상태가 고객 상태와 관리자 준비 상태를 구분하지 못함

현재 API는 연결 가능 여부와 자연어 사유만 반환한다. 고객 화면도 `연결 안 됨`, `관리자 앱 미설정`, `외부 심사 진행 중`, `credential 저장소 장애`를 안정적인 상태값으로 구분하지 않는다. 요청 원문의 `미연결`과 `오픈 준비 중` 분리는 코드 계약부터 필요하다.

필요한 후속 설계는 readiness 응답의 상태 enum, 고객 문구, Admin 상태 표시, CTA 가능 여부를 한 계약으로 핀하는 것이다. API 계약 변경이므로 이번 worker가 임의로 확정하지 않았다.

### 2. R-09 채널 범위와 탭 구조가 화면별로 다름

텍스트 발행 8개, 영상 발행 2개, OAuth 연결 4개, Studio 미리보기 7개가 서로 다른 상수와 컴포넌트에 흩어져 있다. 차이가 기능상 의도된 부분도 있지만 UI가 그 차이를 명확한 capability로 표현하지 않아 사용자는 같은 `연결 가능`, `발행 가능`, `미리보기 가능`으로 오해할 수 있다. Instagram 전용 편집기의 탭도 generic 채널 계약과 다르다.

필요한 후속 설계는 provider별 `connect`, `generate`, `preview`, `publishNow`, `schedule`, `analytics`, `editor` capability를 명시하고 Sidebar, Settings, Studio, 채널 탭이 이를 공유하는 것이다. 승인 prototype 핀이 없는 상태에서 탭·레이아웃을 소스만 보고 합치는 것은 재창조가 되므로 보류했다.

### 3. 파이프라인과 기반 경로 드리프트

- `current_stage: qa`와 `approved_stages: [plan]`, design 진행 중, build pending이 동시에 기록돼 있다.
- PRD 승인 경로는 루트를 가리키지만 실제 v7.3.5 파일은 `docs/notes/`에 있다.
- prototype 최신 후보 v24는 존재하지만 approved artifact로 핀되지 않았고 실제 Chrome NG가 남아 있다.

## 개발 검증 증거

| 검증 | 결과 | 판정 경계 |
|---|---|---|
| `npx tsc --noEmit` | exit 0 | TypeScript 정적 검사 통과 |
| R-02·OAuth·Admin·publish·인증·RLS 집중 Vitest | exit 0, 41 files, 453 passed, 7 skipped, 총 460 | 코드와 mock 기반 단위·통합 통과. 실 DB 의존 publish 2건과 RLS 5건은 환경 제약으로 skip |
| `npm test` | exit 0, 136 files, 1084 passed, 11 skipped, 총 1095 | 전체 Vitest 실패 0. DB·RLS·동시성 실환경 항목은 skip |
| `npm run build -- --webpack` | exit 0, static pages 166/166 | Next.js 프로덕션 빌드 통과. 실제 브라우저 렌더 증거는 아님 |
| `bash ~/.claude/harness/bin/design-lint.sh dashboard/src` | exit 0, 위반 0 | 임의 px·인라인 style·token 밖 hex 정적 위반 0 |

### 개발 표면 결과

- Backend: 해당 없음. 이번 범위는 dashboard Next.js API route와 Web이다.
- Web: TypeScript, Vitest, webpack build 통과.
- Mobile: 해당 없음.
- 수정 파일 수: 제품 소스 0, 테스트 소스 0, 감사·상태 문서 4개 추가·갱신.
- 미통과 gate: design 승인, build 승인, 실제 Chrome, 실 OAuth, 실 DB RLS, 실 SNS 발행, Admin 실화면.

## 라이브 검증 필요 항목

1. 신규 Google 계정으로 `/login` 진입, tenant와 workspace 생성, 재로그인 유지.
2. Instagram·Facebook·YouTube·TikTok 중 승인된 제공자 계정으로 OAuth 동의, callback, 연결 계정 표시, refresh 동작.
3. Studio에서 생성, 수정, 실제 발행, permalink, `published_posts`와 홈 Awareness 성과 반영.
4. 운영자 권한으로 Admin provider 준비상태, credential 저장·마스킹·reveal, 고객 active 집계 확인.
5. 실제 Postgres에서 RLS isolation, publish transaction, concurrency skip 11건 재실행.
6. 1440·1024·390 화면에서 Sidebar, Settings, Studio, 채널 탭과 v24 승인 시안의 픽셀 대조.

다음 QA 명령:

```bash
cd dashboard
npm test
npm run build -- --webpack
R02_BASE_URL=http://localhost:<port> R02_TENANT_TOKEN=<tenant-token> R02_LIVE_PUBLISH=0 npm run e2e:r02
```

실 SNS 발행은 승인된 테스트 계정과 `R02_LIVE_PUBLISH=1`을 명시한 별도 QA에서만 수행한다.

## 외부 정책 벤치마크 적용

- Google YouTube OAuth 공식 가이드: 서버형 앱은 중앙 OAuth client로 사용자 동의를 받고 access·refresh token을 교환한다. 일반 사용자가 각자 client secret을 발급받는 모델이 아니다. 서비스 계정은 YouTube Data API에서 지원되지 않는다. 이를 R-04 구조 판정에 적용했다.
- TikTok Content Posting API 공식 가이드: 등록 앱, `video.publish` scope 승인, 사용자 OAuth 승인이 필요하고, 미심사 client는 private visibility 제약을 받는다. 이를 R-05·R-06의 `연결됨`과 `외부 발행 준비됨`을 분리해야 하는 근거로 적용했다.
- Meta Instagram API 공식 collection: Facebook Login 기반 Instagram API는 professional 계정과 access token을 전제로 한다. 이를 중앙 앱 credential과 사용자별 token을 분리하는 현재 구조 점검에 적용했다.

## 레드팀과 셀프심문

레드팀 공격: 회의적인 고객은 테스트 1,084건 통과보다 자신의 Instagram 연결과 실제 게시 한 건이 되는지를 묻는다. 현재 worker는 외부 제공자와 브라우저를 직접 관찰하지 못했으므로 R-02 전체를 완료로 표시하지 않았다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 테스트가 현재 구현의 잘못된 채널 계약까지 그대로 고정했기 때문이다. 그래서 green test와 별개로 화면별 상수, import chain, 탭 목록을 직접 대조했고 R-05·R-09를 미해결로 남겼다.

## STAMP

- 생성시각: 2026-08-13 19:20 KST
- 라인: osmu
- 모델: gpt-codex/gpt-5
- 에이전트: code-builder
- 스킬: 매칭 코딩 스킬 없음
- 근거 URL: Google YouTube OAuth, TikTok Content Posting API, Meta Instagram API 공식 문서
- 고민 한 줄: green test가 외부 제공자 상태와 화면 간 계약 드리프트를 가리지 않도록 정적 연결 증거와 라이브 경계를 분리했다.

SKILLS_USED: 없음

SKILLS_SKIPPED: 없음. 현재 제공된 스킬 중 code-builder 구현·감사에 매칭되는 스킬이 없다.

SOURCES:

- `docs/requests/2026-08-08_2026-08-10-chairman-requests.md`
- `docs/fdd/fdd-r02-journey-fix-v1.0.0-opus.md`
- `docs/fdd/migration-filestore-to-db-v1.0.0-opus.md`
- `docs/fdd/test-plan-r02-v1.0.0-opus.md`
- `docs/notes/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md`
- `dashboard/src`
- `/Users/sj/.claude/standards/dev.md`
- `/Users/sj/.claude/standards/benchmarks.md`
- `/Users/sj/.claude/standards/artifact-stamp.md`
- https://developers.google.com/youtube/v3/guides/authentication
- https://developers.tiktok.com/doc/content-posting-api-get-started/
- https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
- https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

MODEL: gpt-codex/gpt-5
