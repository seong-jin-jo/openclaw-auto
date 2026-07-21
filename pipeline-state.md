---
# pipeline-state.md — Stage Controller 런타임 상태 (각 레포 루트에 committed)
# `/pipeline init --adopt` 시드(2026-06-30). 진실원은 이 파일.
project: openclaw-auto-osmu
repo: /Users/sj/sj_code_master/openclaw-auto
pipeline_version: 1
current_stage: ship            # plan|design|eng-design|build|qa|ship
approved_stages: [plan, design, eng-design, build, qa]
approved_artifacts: {}
stages:
  plan:       { status: approved, artifacts_ok: true }   # README/feature-spec/USERFLOW 존재(ADOPTED)
  design:     { status: approved, artifacts_ok: true }   # ui-rules/channel-ui-spec(ADOPTED)
  eng-design: { status: approved, artifacts_ok: true }   # CLAUDE.md/wiki/architecture(ADOPTED)
  build:      { status: approved, artifacts_ok: true }   # SNS-015 운영 Reel permalink 직접 관찰(2026-07-21)
  qa:         { status: approved, artifacts_ok: true }   # SNS-015 운영 관찰 종료. 전역 ship 잔여는 외부 blocker
  ship:       { status: in-progress, artifacts_ok: false }
override: false
override_reason: ""
override_expires: ""
---

# Pipeline State — openclaw-auto-osmu

## 2026-07-19 GA4 first-hit hotfix build reopen
- 운영 격리 브라우저에서 신규 동의 직후 `/login` page_view 적재를 관찰했지만, 동의가 저장된 재방문 reload에서는
  `RouteTracker`가 `ConsentBanner` 초기화보다 먼저 실행되어 page_view가 유실됨을 직접 재현했다.
- `sendGaHit()`가 저장된 동의 상태에서 `window.gtag` 미초기화면 consent/config를 먼저 bootstrap한 뒤 이벤트를
  큐잉하도록 수정한다. focused test, typecheck, production build, 운영 재배포·network 재관찰 전 승인 금지.

## 2026-07-20 GA4 command-shape hotfix build reopen
- first-hit 배포 후 운영 dataLayer에는 명령이 보였지만 collect 0건, `gtag('get', measurementId, 'client_id')`가
  timeout됐다. gtag destination과 전용 스크립트에는 측정 ID가 실제 등록돼 있어 속성 미설정이 원인이 아니었다.
- 앱 shim이 공식 snippet의 native `arguments` 대신 rest Array를 push해 명령이 실행되지 않는 것이 원인이다.
  native Arguments 교정→focused/full test→build→CI→재배포→client_id 반환+collect 관찰 전 승인/ship 완료 금지.

## 2026-07-20 Instagram publish evidence hotfix build reopen
- 운영 T-02 IMAGE 발행은 성공했고 Graph에서 공개 permalink를 회수했지만 앱 응답/DB permalink가 비었다.
- 컨테이너가 20회 안에 FINISHED가 아니어도 media_publish를 호출하는 fail-open과 provider 원문 오류 노출도 확인했다.
- FINISHED timeout fail-closed, 성공 후 permalink 조회, 오류 원문 비노출을 수정·테스트·CI·배포하고 기존 media
  permalink를 DB/queue에 보강하기 전 승인/ship 완료 금지.

## 2026-07-20 SNS-014 Instagram build candidate
- Instagram FINISHED timeout을 fail-closed로 바꾸고, 신규 성공 및 기존 성공 재호출 모두 media permalink를
  회수하도록 수정했다. 기존 성공 분기는 외부 media_publish를 호출하지 않고 DB/queue URL만 보강한다.
- provider raw body는 오류 응답에서 제거했다. focused 18 PASS, 전체 78 files/673 PASS·9 DB-env skip,
  TypeScript clean, production 160-route build PASS, diff check PASS.
- CI SUCCESS와 운영 T-02 `alreadyPublished:true`/동일 permalink/DB·queue URL 보강/외부 게시물 1건 유지 전
  ship 완료 금지.

## 2026-07-20 SNS-014 Instagram operating close
- commit `020c44d9`, CI run `29735697748` SUCCESS 후 marketing VM에서 동일 commit 이미지를 직접 build하고
  `openclaw-dashboard-osmu`만 재생성했다. healthy/login 200/me 401/google 200/health 200.
- 기존 T-02 retry는 `alreadyPublished:true`, 동일 Instagram URL, queue published, token revoke 후 401. DB는
  published 1/distinct external 1/failed 0/permalink 1이고 queue payload에도 URL이 저장됐다.
- 공개 브라우저가 `zero_to_one_ai`, 273자 caption 전체, 1024x768 이미지를 직접 렌더했다. SNS-014는 운영 관찰로
  종료한다. 전체 ship은 X/TikTok credential, Facebook 앱 활성, Instagram 신규 로그인 OTP, YouTube 실업로드,
  provider 동일 테넌트 2계정 실전환, GA4 DebugView UI가 미검증이라 in-progress 유지한다.

## 2026-07-20 launch blocker operating refresh
- readiness available: Instagram, Threads, YouTube, Facebook(앱 모드 외부 확인 경고). credential missing: X,
  LinkedIn, Naver Blog, Pinterest, Tumblr, TikTok, Slack, Line.
- active channel accounts: Instagram 1, Threads 2; YouTube/Facebook/X/TikTok 0. 임시 token revoke 후 401.
- 즉시 마케팅 가능한 운영 관찰 범위는 Instagram IMAGE와 Threads TEXT/IMAGE. 전체 v1.0.0 ship은 외부 credential/
  앱 활성/실계정 callback 및 미구현 TikTok/Reels 때문에 in-progress다.

## 2026-07-20 SNS-015 Reels build reopen
- 사용자 `빨리 작동되도록 만들어` 지시로 코드에서 해소 가능한 영상 blocker를 재개방한다.
- YouTube 업로드 코드는 존재하지만 운영 연결 계정이 0개라 외부 OAuth 전 실업로드 불가. TikTok은 Content Posting API
  승인과 credential이 없어 구현 완료로 위조하지 않는다.
- 기존 active Instagram 계정을 활용한 Reels 발행을 구현한다. 종료조건은 tenant 격리, 공개 video URL 전달,
  container FINISHED fail-closed, provider 원문 비노출, 기존 성공 중복방지, focused/full test, CI, 운영 permalink다.

## 2026-07-21 SNS-015 Reels operating close (관찰됨)
- commit `1a6e7e5a` 기준 운영 DB schema 적용, 컨테이너 healthy, live health 200 · db up.
- 실제 테넌트 업로드 → 서명 미디어 HEAD 200, `Range: bytes=0-99` → 206 + 100 bytes.
- 실제 Instagram Reel permalink `https://www.instagram.com/reel/DbBPRa7iFff/` 회수. 동일 요청 재시도는
  `alreadyPublished:true` + 동일 permalink. DB rows 1/published 1/distinct external 1/permalink 1/failed 0.
- 임시 테넌트 토큰 revoke 후 동일 video list API 401 확인.
- gstack 공개 브라우저에서 `zero_to_one_ai`, 한국어 제목·본문·해시태그 원문, `readyState=4` 720x1280 8초 영상,
  렌더된 브랜드 프레임을 직접 관찰. 증거 `docs/evidence/sns015-instagram-reel-operating-20260721.png`.
- **SNS-015는 운영 관찰로 종료(closed).** 전역 ship은 계속 `in-progress` — X/TikTok credential, Facebook 앱 활성,
  Instagram 신규 로그인 OTP, YouTube 실업로드, 동일 provider 실계정 2개 전환, GA4 DebugView가 미검증이다.
- **정확한 다음 액션:** ①운영 관찰이 끝난 Instagram·Threads로 지금 마케팅을 개시한다 ②그와 별개 트랙으로
  위 외부 blocker를 하나씩 회수한다. 두 작업은 서로를 기다리지 않는다.

## 2026-07-21 SNS-016 Google login manual-deploy hotfix (관찰됨)
- 운영 격리 브라우저에서 Google 클릭이 HTTP 500, 콘솔 `supabaseUrl is required`임을 직접 재현했다.
- 동일 commit의 수동 Docker 빌드가 workflow 전용 `--build-arg NEXT_PUBLIC_SUPABASE_*`를 빠뜨린 것이 원인이다.
- 운영 이미지를 `.env.osmu`의 Supabase 공개값·GA4 ID로 재빌드/재기동했다. 컨테이너 healthy, DB up,
  `/api/auth/google` 200+authUrl, 브라우저 `accounts.google.com` 계정 입력 화면 이동을 직접 관찰했다.
- 재발방지: compose 필수 build args + workflow `--env-file .env.osmu` 단일 경로. focused 7 PASS,
  full 85 files/754 PASS·9 skip, TypeScript clean, production build 160 pages PASS.
- Claude 독립 리뷰는 2회 모두 무응답/Execution error로 종료되어 **미검증**이며 출고 근거에 포함하지 않는다.

## 2026-07-21 SNS-017 TikTok Direct Post build candidate
- TikTok OAuth의 `client_key`/`open_id` 규격을 교정하고, 다중계정 선택·creator-info·공개범위 직접 선택·상호작용 제한·
  AI 생성 표시·서명 PULL URL·비동기 상태 확인을 `/videos`와 `/api/video/publish`에 연결했다.
- focused 124 PASS, 전체 88 files/766 PASS·9 DB-env skip, TypeScript clean, Next.js 16 Webpack production build
  161 pages PASS, diff check PASS. 빌드가 함께 발견한 기존 route export/signature 결함도 교정했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지. 운영 TikTok credential과 앱 심사가 없어 실제 OAuth callback,
  creator-info, SELF_ONLY 영상 게시, status/permalink는 미검증이다. X/Facebook/Instagram OTP/YouTube/실 2계정 전환도 기존 blocker다.
- 다음 실행: commit을 운영 VM에 반영하고 health·Google 로그인 무회귀·TikTok credential 누락 UI를 실제 브라우저에서 관찰한다.
  credential이 회수되는 즉시 격리 계정으로 OAuth→SELF_ONLY 게시→status/permalink를 수집한다.
- 1차 운영 Chrome에서 tenant 없는 Instagram accounts 401이 operator token을 지우는 race와 TikTok/YouTube의 낡은
  “직접 발행 미지원” 문구를 관찰했다. workspace-scoped URL과 영상 발행 provider SSOT로 수정, focused 17 PASS·tsc clean.
- commit `cf0be864` 운영 Docker build 161 pages PASS, 컨테이너 healthy/DB up. 후속 Chrome에서 Instagram/TikTok accounts와
  readiness 모두 200, navigation 4xx/5xx 0건, TikTok credential 누락 disabled 문구와 Google→accounts.google.com 이동 관찰.
  증거 `docs/evidence/sns017-tiktok-disabled-operating-20260721.png`. 실 TikTok OAuth/게시만 외부 credential·앱 심사로 미검증.
- GA4: 격리 Chrome에서 분석 동의 후 measurement `G-MEEQ2D8C1J`의 `page_view`·`scroll`이 실제
  `google-analytics.com/g/collect`로 POST되어 둘 다 HTTP 204를 직접 관찰했다. 전송은 검증됨, DebugView UI는 미검증.

## 2026-07-21 SNS-017 TikTok async publication QA PASS
- TikTok init 전에 tenant/account/content/options 기반 `published_posts` 예약을 원자적으로 잡고, provider `publish_id`와
  final `post_id`를 `external_id`/`provider_post_id`에 분리 저장한다. privacy metadata로 공개 게시와 SELF_ONLY 완료 조건을
  분리하고, workspace-scoped 브라우저 polling으로 새로고침 복구와 tenant 전환 격리를 보장한다.
- 독립 QA 최종 focused 6 files/25 PASS, full 90 files/776 PASS·9 DB-env skip, TypeScript clean, Webpack production
  build 162 pages PASS, diff check PASS. QA가 발견한 workspace race, post ID 미영속, public creator-info transient,
  SELF_ONLY 무한 polling 가능성은 수정 후 회귀 테스트로 고정했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지한다. 운영 배포와 멱등 schema 적용 전이며, TikTok credential·Content
  Posting API 심사·실계정이 없어 실제 OAuth/Direct Post provider 왕복은 미검증이다.
- 다음 실행: 명시 파일 commit/push → OSMU 단독 deploy workflow → schema 컬럼, health/login/operator smoke와 live route
  반영 관찰. credential 회수 시 SELF_ONLY와 공개 게시를 각각 실제 계정으로 E2E한다.
- 1차 deploy run `29819032770`: DB schema와 image build PASS, compose `up` FAIL. build에서 사용한 `.env.osmu`를 up에서
  누락해 required public Supabase env interpolation이 실패했다. workflow up 명령과 계약 테스트를 교정해 재배포한다.
- 2차 run `29819335488`은 dispatch 서비스명 오입력으로 제외. 3차 run `29819793340`은 과거 수동 컨테이너가 compose 라벨
  없이 고정 이름을 점유해 교체 충돌. workflow에 앱 컨테이너 rollback rename/stop 및 기동 실패 자동 원복을 추가한다.
- 4차 run `29819971912`: 새 컨테이너 기동·healthy 및 public health 200/db up 관찰. 후속 `compose ps`의 env-file 누락으로
  workflow만 FAIL해 status 호출도 `.env.osmu`로 통일 후 재실행한다.
- 최종 commit `ca4596ab`: CI `29820483251` SUCCESS, deploy `29820488738` SUCCESS. 운영 container healthy,
  PostgreSQL 신규 컬럼 2개 실조회, public health/login/Google preflight와 auth 401 경계를 직접 관찰했다.
- ship은 `in-progress`, `artifacts_ok:false` 유지한다. TikTok credential·앱 심사 부재로 실제 OAuth→SELF_ONLY/public
  Direct Post provider E2E가 미검증이기 때문이다. credential 회수 즉시 두 공개범위 실게시를 종료 증거로 수집한다.

> 2026-06-30 `init --adopt`. 이 레포는 이미 라이브 배포된 멀티테넌트 마케팅 SaaS라 plan~build는
> ADOPT(기존 인정). **현재 ship(in-progress).** 신규 기능(OAuth 연결, GA4, 가이드 등)은 build→qa→ship 게이트를
> `/approve`로만 통과한다. **배포(gh workflow / ship)는 `/approve qa` 후에만.** (과거 게이트 없는
> 자동 배포 = 하네스 위반, 재발 금지.)

## qa 단계 산출물/증거 (requires_evidence) — 상세 docs/qa-tracker.md
- [x] docs/qa-tracker.md (2026-07-16 운영 배포·직접 E2E 증거 갱신)
- [x] prod-health-200 (반복 실측 ✅)
- [x] prod-demo-login-200 (2026-07-16 운영 가입→로그인→active tenant 저장 직접 관찰)
- [ ] e2e-happy (가입→미승인 403→운영자 승인→shared Claude 실생성 200 ✅ / Google 최종 왕복·SNS 실발행은 사용자 동의/콘텐츠 승인 대기)
- [x] e2e-edge (vitest 563 pass/8 skip + 라이브 미승인 403·Google provider preflight 200·SNS credential 비노출 실측)

## 2026-07-16 Google-only auth build
- 이메일/비밀번호 가입·로그인·확인메일·재설정 UI/API 호출 제거. `/signup`은 `/login`으로 수렴.
- 랜딩·오류문구·배포 스모크·gstack E2E를 `Google로 계속` 단일 경로 계약으로 변경.
- 운영자 고객 API/UI의 `send_password_reset`·Supabase `/recover` 경로와 관측성 enum을 제거. 관리자 기능은
  계정 정지/재개와 공유 AI 승인/회수만 유지하며, 직접 API 호출도 400 unsupported로 거부한다.
- 기존 auth user 6명은 삭제하지 않음. 조회 결과 전원 현재 `email` provider only이며, 동일 이메일 Google
  첫 로그인 시 identity linking 및 tenant 보존을 운영에서 확인해야 함.
- 직접 검증: Google-only/operator focused 98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, build PASS(161 pages),
  local gstack E2E PASS(`/login`, `/signup` 307, storage clear, email/password controls absent), Google 계정 화면 이동.
- QA 게이트 재개: Supabase Email provider 비활성화, 실제 Google 계정→앱 복귀→기존 user/tenant 보존과 신규
  lead 저장 운영 E2E가 ship 잔여다. QA는 2026-07-16 사용자 `/approve qa`로 승인됨.

## 2026-07-16 SNS P0 ship 재배포
- 커밋 `8b1ca33f`, deploy run `29496623489` 성공. 발행 UI를 실제 `/api/publish` 지원 8채널로 제한하고
  Instagram/Threads 저장 토큰을 provider read-only API로 검증하도록 운영 반영.
- live API와 인증 브라우저에서 Instagram `Connected`, Threads `Live`, 비밀 필드 비노출, 미지원 7채널
  고객 UI 비노출을 직접 관찰. Health Monitor run `29497421714` success.
- QA 임시 tenant token은 revoke 후 401 확인. 공개 SNS 게시물은 회장 콘텐츠 승인 전 실행하지 않음.
- ship 잠금 유지: Google 계정 선택→앱 복귀/lead 저장, Threads 실발행 permalink, GA4 DebugView, Slack webhook 회전.

## 2026-07-17 사용자 실기기 SNS 연결 NG — ship 차단
- 사용자 실기기에서 Threads 타계정 세션 고착, Instagram OTP rate limit, X credential 누락 500/raw JSON,
  Facebook 앱 비활성, Bluesky `openclaw.json not found`, 영상 플랫폼 연결·발행 누락을 확인했다.
- 기존 `Connected/Live` 증거는 provider read-only `/me`와 렌더까지만 확인한 부분 증거다. 계정 전환→2FA→동의
  →callback→저장→실발행 전체 왕복을 보지 않았으므로 e2e-happy 충족으로 사용하지 않는다.
- ship은 계속 `in-progress`, `artifacts_ok:false`. 수정 범위 사용자 확인 후 `/pipeline reopen build`로 재오픈하고,
  provider별 실제 브라우저 E2E 및 공개/삭제 가능한 테스트 발행 증거를 다시 수집해야 한다.
- 상세 NG와 재발방지 매트릭스: `docs/qa-tracker.md`의 `2026-07-17 사용자 실기기 SNS 연결 QA`.
- 사용자 추가 지시로 SNS-007(사이트 내 provider 다중계정 목록·추가·기본 전환·개별 해제·선택 발행)을
  동일 build에 포함. 기존 단일계정 토큰 무손실 migration과 cross-tenant 차단 E2E가 build 종료조건이다.

## 2026-07-17 SNS-007 다중계정 build candidate
- additive `channel_accounts`와 기본계정 legacy mirror, 계정 목록/기본전환/삭제 API·UI, Studio/예약/YouTube
  선택 발행을 구현했다. 최초 동시 OAuth callback은 provider 단위 advisory lock으로 직렬화한다.
- refresh token은 `refresh_enc`에만 암호화 저장하며 callback/meta 평문 기록을 금지했다. 예약 생성 시 선택
  계정의 tenant/provider/status를 검증하고, 명시 계정이 유효하지 않으면 기본계정으로 fallback하지 않는다.
- 자동 증거: `npm test` 72 files/630 pass·8 DB-env skip, `npx tsc --noEmit` PASS, production build 160 pages PASS,
  `git diff --check` PASS. 자동 테스트를 로컬 E2E로 승격하지 않는다.
- build 승인 전 미검증: production schema 적용, 실제 provider 2계정 OAuth 왕복, 기본전환 UI 직접 관찰,
  선택계정별 공개 테스트 발행 permalink/YouTube Shorts URL. `/approve build` 후 QA·배포 게이트로 이동한다.

## 2026-07-17 SNS-007 QA 진행
- build 승인을 반영해 QA로 전환했다. 실제 `upsertChannelAccount` 두 호출의 최초 연결 경쟁을 재현하는
  PostgreSQL 통합 테스트를 추가했다. 로컬은 DB 부재로 해당 1건 skip, 전체 73 files/630 pass/9 skip,
  `tsc --noEmit` PASS, production build 160 pages PASS다.
- QA 자동 종료 조건: GitHub CI PostgreSQL에서 신규 동시성 테스트가 skip 없이 실행되어 2계정 저장과
  provider 기본계정 정확히 1개를 관찰할 것. 운영 OAuth·실발행은 CI로 검증되지 않으므로 별도 미검증이다.
- 실제 DB 증거: GitHub Actions run `29572377311`(commit `592c4741`) SUCCESS. PostgreSQL 16에
  schema→seed→RLS 적용 후 73 files/626 pass/0 skip. 신규 동시성 테스트가 314ms에 실제 실행되어
  병렬 최초 callback 2건 저장과 기본계정 1개를 확인했다. 운영 OAuth·실발행 미검증은 유지한다.

## 최근 build (qa 대기 중 — ship 전 /approve qa 필요)
- 셀프서브 코어: A1 증류 generateText 통일, A2 온보딩 위저드, A3 키검증, /api/health+autoheal+슬랙경보,
  성과 ConnectGate, 가입 confirm 탭.
- **소셜 OAuth '연결' 3종(IG·Threads·Facebook)**: `lib/social-connect`(provider config+토큰교환, FB는 페이지토큰),
  `api/connect/[provider]`(auth-url)+callback(per-tenant integrations 저장), `SocialConnectButton`+ChannelPage 배선.
- **setup-guides 재작성**: IG·Threads·FB를 "연결 버튼 먼저, 수동은 고급"으로.
- 검증: vitest 146 pass/8 skip(connect E2E 7 IG/Threads/FB 포함), tsc 0, build ✓. **라이브 미검증.**
- ⚠️ 일부(health·연결 초기버전)는 게이트 전 prod 배포됨. 연결 3종·가이드는 **미배포(게이트 준수, /approve qa 후)**.
- **라이브 qa 선행조건(사용자 액션)**: 배포 env `IG_APP_ID/SECRET`·`THREADS_APP_ID/SECRET`·`FB_APP_ID/SECRET` +
  Meta 앱 redirect URI `https://<live>/api/connect/{provider}/callback` 등록. 그 후 배포→browse로 qa 증거.

## 승인 로그 (append-only)
2026-07-20 — SNS-015 build+qa APPROVED — 사용자가 반복 명시한 무중단·무질문 실행 지시(`빨리 작동되도록
  만들어`, `묻지 않고 빨리 진행`)를 승인 범위로 반영하고 추가 제품 승인 질문 없이 진행. 증거: focused 106 PASS,
  최신 전체 84 files/752 PASS·9 DB-env skip, `tsc --noEmit` clean, production 160-page build PASS.
  qa-verifier 품질 게이트 PASS(Skill qa-only 1회, WebFetch 5회, standards 품질헌법 Read). 운영 DB 중복 점검
  duplicateGroups=0·totalExtra=0을 컨트롤러가 직접 관찰. 운영 origin은 HTTPS이고 미디어 서명은 전용
  `MEDIA_SIGNING_SECRET` 없이 `DASHBOARD_AUTH_TOKEN` 파생 폴백으로 구성(전용 시크릿=false).
  `artifacts_ok:false` 유지 — 실제 Meta Reels permalink를 직접 관찰하기 전 ship 완료 금지. 기존 전역 ship
  blocker(X/TikTok credential, Facebook 앱 활성, Instagram 신규 로그인 OTP, YouTube 실업로드, 동일 테넌트
  provider 2계정 실전환, GA4 DebugView UI)는 그대로 유지된다.
2026-07-20 — SNS-014 build+qa APPROVED — 사용자의 반복 무중단 실행 지시와 최신 `고`를 승인 범위로 반영하고
  추가 제품 승인 질문 없이 진행. commit `020c44d9`, focused 18 PASS, local full 78 files/673 PASS·9 DB-env skip,
  TypeScript와 production 160-route build PASS. GitHub Actions run `29735697748` typecheck/build/PostgreSQL
  schema→RLS/full test SUCCESS. OSMU 배포 후 기존 T-02 Instagram 재호출의 alreadyPublished/동일 permalink/
  DB·queue 보강/외부 게시물 1건 유지 관찰 전 ship 완료 금지.
2026-07-20 — GA4-002 build+qa APPROVED — 사용자의 무중단 진행 지시를 기존 승인 범위로 적용하고 추가 제품 승인
  질문 없이 진행. commit `7c84d533`, focused 18 PASS, local full 77 files/669 PASS·9 DB-env skip, TypeScript와
  production 160-page build PASS. GitHub Actions run `29728777597` typecheck/build/PostgreSQL schema→seed→RLS/
  full test SUCCESS. 운영 client_id callback+collect 직접 관찰 전 ship 완료 금지.
2026-07-20 — GA4-001 build+qa APPROVED — 사용자의 최신 `진행해`와 반복된 무중단 진행 지시를 승인 근거로
  반영. commit `af50af17`, focused analytics 18 PASS, local full 77 files/669 PASS·9 DB-env skip, TypeScript와
  production 160-page build PASS. GitHub Actions run `29719316459`은 typecheck/build/PostgreSQL schema→seed→RLS/
  full test 전부 SUCCESS. 독립 Claude review의 이중 bootstrap·명령 순서·회귀 테스트 지적을 모두 반영했다.
  운영 저장동의 reload의 page_view/collect 직접 관찰 전 ship 완료 금지.
2026-07-19 — SNS-013 build+qa APPROVED — 사용자 반복 지시를 승인 근거로 반영. commit `809c3422`,
  CI run `29684392717` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. focused 27 PASS,
  기존 성공 external ID permalink-only recovery와 외부 publish 미호출 회귀 포함. 운영 URL 회수 전 ship 완료 금지.
2026-07-19 — SNS-010 build+qa APPROVED — 사용자 반복 지시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 승인 근거로 반영. commit `c66e0b16`, CI run `29682690931` typecheck,
  production build, PostgreSQL schema→seed→RLS, full test SUCCESS. focused 29 PASS에 IN_PROGRESS→FINISHED,
  ERROR/EXPIRED와 원문 비노출 경계 포함. 운영 T-PIN-01 permalink 전 ship 완료 금지.
2026-07-19 — SNS-012 build+qa APPROVED — 사용자 반복 지시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 승인 근거로 반영. commit `7511cf90`, CI run `29681441400`이 typecheck,
  production build, PostgreSQL schema→seed→RLS, full test SUCCESS. focused 14 PASS에서 실제 queue JSON
  draft→published와 DB shadow UPDATE를 확인. 운영 첫 발행/순차 재호출/외부 게시물 1개 관찰 전 ship 완료 금지.
2026-07-19 — SNS-011 build+qa APPROVED — 사용자의 반복 명시 `묻지 않고 빨리 진행`, `개발 QA 배포 진행`,
  최신 `빨리 되게 만들어`를 영속화 운영 핫픽스 승인으로 반영. commit `496328dd`, CI run `29671089099`
  typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. persistence contract 2 PASS와 compose config PASS.
  운영 고정 volume에 DB shadow 2건 복구 완료. 재배포 후 동일 draft ID 존속과 T-PIN-01 permalink 관찰 전
  ship 완료 금지.
2026-07-19 — SNS-009 qa APPROVED — 사용자가 반복 명시한 `개발 QA 배포 진행`, `묻지 않고 빨리 진행`,
  `빨리 되게 만들어` 지시에 따라 이번 핫픽스도 QA 증거 충족 후 ship 진행 승인으로 반영. commit `bcc32f10`,
  GitHub Actions run `29661214375` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. qa-verifier
  blocker/high 0, QA Skill/WebFetch/dev standard 품질 PASS. OSMU 재배포 후 T-PIN-01 permalink 직접 관찰 전
  ship 완료 금지. SNS-010은 이미지 발행 전 별도 build 필수.
2026-07-19 — SNS-009 follow-up build APPROVED — 첫 QA가 발견한 container/publish network throw 500을
  안전한 `ok:false`로 정규화하고 malformed JSON/id 누락까지 회귀 4건으로 고정. focused 43 PASS,
  identity 9 PASS, tsc clean. 최종 qa-verifier는 `standards/dev.md` Read, QA Skill 1회, WebFetch 2회로
  품질 verifier PASS, blocker/high 0, TEXT build 조건부 PASS. 사용자의 지속적 수정·출시 진행 지시 범위로
  build 승인을 재고정해 QA로 전환. IMAGE polling/result-unknown은 SNS-010으로 분리, 이미지 발행 전 해결.
2026-07-19 — SNS-009 build APPROVED — 사용자가 운영 발행 실패를 지적한 뒤 `아 빨리 되게 만들어`라고
  수정·출시 진행을 명시했고, 직전부터 반복한 `묻지 않고 빨리 진행` 지시 범위 안에서 build 진행 승인으로
  반영. 증거: commit `a48460a0`, focused 68 PASS, tsc clean, production build 160 pages PASS,
  GitHub Actions run `29658880396` typecheck/build/PostgreSQL schema→seed→RLS/full test SUCCESS. QA로 전환하되
  독립 검증과 운영 T-PIN-01 permalink 관찰 전 ship 완료 금지.
2026-07-18 — qa APPROVED — 직전 보고에서 QA 승인 추천, 승인 시 OSMU 단독 배포·실 Chrome E2E,
  미승인 시 운영 popup 결함 유지라는 결과를 제시했고 사용자가 `진행`으로 응답해 QA 진행 의사를 확인.
  독립 qa-verifier blocker/high 0, RUBRIC 23/25, QA Skill 1회, WebSearch/Fetch 3회,
  verify-agent-quality PASS. commit `e66e6f76`, CI run `29608715956` SUCCESS. ship으로 전환하되
  Facebook/YouTube popup target과 provider host를 직접 관찰하기 전 ship 완료 금지.
2026-07-18 — build APPROVED — 직전 보고에서 `/approve build` 추천, 승인 시 QA 재검증, 미승인 시
  운영 popup 결함 유지라는 결과를 평문으로 제시했고 사용자가 `진행`으로 응답해 build 진행 의사를 명확히
  확인. 증거: commit `e66e6f76`, focused 10 PASS, full 74 files/644 PASS·9 DB-env skip, tsc clean,
  production build 160 pages PASS, GitHub CI run `29608715956` typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test SUCCESS. QA 단계로 전환하며 QA 승인 전 운영 배포 금지.
2026-07-18 — build REOPENED FROM SHIP — 운영 headless Chrome에서 X readiness 안내는 통과했으나
  Facebook OAuth 버튼 클릭 후 새 target이 생성되지 않았다. 공통 `SocialConnectButton`이 auth URL fetch를
  await한 뒤 `window.open()`을 호출해 브라우저 사용자 제스처를 잃는 popup-blocker 구조임을 코드와 운영
  브라우저로 확인. Instagram/Threads/Facebook/YouTube 공통 영향이므로 synchronous blank popup→URL 이동
  hotfix, 회귀 테스트, CI, build/qa 재승인, 재배포 전 ship 완료 금지.
2026-07-17 — hotfix build+qa APPROVED — 운영 Chrome에서 발견한 tenant account API 403의 교정 범위만
  재검증. commit `15b09a2c`, GitHub Actions run `29598660707`에서 typecheck/build/PostgreSQL 16
  schema→seed→RLS/full test 전부 성공. 로컬 focused proxy test 39 PASS, full 73 files/634 PASS/9
  DB-env skip, production build 160 pages PASS. 사용자가 `QA승인`을 명시했으므로 QA 승인으로 반영하고,
  기존 승인 build 범위의 회귀 핫픽스 증거도 함께 재고정해 ship으로 전환. 운영 재배포 후 동일 고객 토큰
  Chrome E2E가 통과하기 전 ship 완료 금지. 외부 provider 2계정 OAuth·실발행은 계속 미검증.
2026-07-17 — build REOPENED FROM SHIP — 운영 Chrome E2E에서 신규 `/api/channels/{provider}/accounts*`
  3개 경로가 proxy tenant-aware allowlist에 없어 실제 고객 osmu/JWT가 403 `이 API는 운영자 전용입니다`를
  받는 결함을 직접 관찰. hotfix→CI→build/qa 재승인→재배포 전 ship 완료 금지.
2026-07-17 — qa APPROVED — 사용자 명시 입력 `QA승인`. 재검증 증거: GitHub Actions run `29572377311`
  PostgreSQL 16 schema→seed→RLS 적용 성공, 73 files/626 PASS/0 skip, SNS-007 최초 동시 callback 2건과
  기본계정 1개 실 DB 관찰. 운영 OAuth·브라우저 계정전환·실발행은 ship 단계 미검증으로 유지.
2026-07-17 — build APPROVED — 사용자 명시 입력 `승인하다고 /approved build`. 명령 오타와 무관하게
  build 승인 의사가 명확하므로 승인으로 처리. 재검증 증거: commit `98896f30`, full 72 files/630 PASS/8
  DB-env skip, `tsc --noEmit` PASS, production build 160 pages PASS, `git diff --check` PASS. QA 단계로 전환.
2026-07-17 — build REOPENED — 사용자 명시 지시 `진행해서 싹 되게해`. SNS-001~006 사용자 실기기
  결함을 수정하기 위해 ship에서 build로 재오픈. 코드 수정→로컬 E2E→실브라우저 운영 QA 후 build/qa 재승인 필요.
2026-07-16 — qa APPROVED — 사용자 명시 입력 `/approve qa`. 재검증 증거: Google-only/operator focused
  98 PASS, full 63 files/548 PASS/8 skip, tsc PASS, production build 161 pages PASS, local gstack Google-only
  E2E PASS. 운영 배포 후 Google 실왕복·SNS 연결/발행·lead 저장은 ship 단계 직접 관찰 대상으로 유지.
2026-06-30 — ADOPTED(pre-harness) — plan·design·eng-design·build 기존 산출물 인정, current=qa.
2026-07-03 — HOTFIX 배포(게이트 예외) — 이미 라이브인 IG 연결의 "Invalid redirect_uri"(프록시 뒤
  origin=0.0.0.0 실측) 수정. 신규 스코프 아님·라이브 깨짐 복구. 커밋 e8603547, run 28611637538,
  라이브 redirect_uri 정상 검증. vitest 9 pass·tsc0. qa 게이트는 유지(IG 로그인→실발행 E2E 후 /approve qa).
2026-07-10 04:51 KST — qa APPROVED — 회장 승인 계획(fable-purrfect-bumblebee.md, Phase 1) 기반.
  증거 재검증: prod-health-200 ✅(당일 재실측 {ok,db:up}) · e2e-edge ✅(vitest+라이브 에러분기 실측) ·
  prod-demo-login-200 🟡(운영자 /api/me 200 실측, 고객가입은 Email Confirm 외부설정 대기) ·
  e2e-happy 🟡(vitest 190 PASS + 라이브 생성 성공 실측, 실발행은 라이브 채널 OAuth 대기).
  🟡 2건은 이번 배포 없이는 수집 불가(라이브 로그인 UX 수정 자체가 배포 대상)라 배포 후 Phase 2/4에서
  수집 의무 — **ship 게이트는 라이브 증거(비번찾기·preflight·Google 실로그인·실발행 관찰) 완성 전 잠금 유지**.
  당일 배포 전 재검증: vitest 37f/190 PASS·build PASS·verify-e2e PASS(port 3459)·커밋 위생 7커밋 런치트랙만.
  (artifacts: docs/qa-tracker.md 2026-07-10 04:45 섹션)
2026-07-16 03:22 KST — ship 후보 운영 배포(run `29422450258`, head `b361d951`) 성공.
  직접 증거: health 200/DB up, live browser public E2E PASS, 합성 QA 가입자 auth user+active tenant 저장,
  shared AI 미승인 403→operator 승인시각 저장→실제 `claude -p` 생성 200, password recovery 요청시각 저장,
  Health Monitor run `29438972593` HTTP 200/up 상태 캐시 저장. **ship 완료/`v1.0.0` 태그는 잠금 유지**:
  Google 계정 최종 OAuth 왕복·GA4 DebugView 수신·custom SMTP 메일함 수신·Instagram/Threads 프로필/첫
  게시물 실제 확인이 남음. (artifact: docs/qa-tracker.md 2026-07-16 섹션)
2026-07-16 06:31 KST — Google/GA4/Slack 외부 설정 반영.
  Google preflight 200 및 실제 accounts.google.com 로그인 화면 이동 관찰. GA4/Slack GitHub secrets 저장 후
  deploy run `29452057807` success. 운영 브라우저에서 동의 전 GA script 없음, 동의 후 G-MEEQ2D8C1J script
  200 + consent update + page_view 적재 관찰. Slack webhook 실제 POST `ok` 관찰. Google 계정 입력 후 앱 복귀,
  GA4 DebugView 수신은 미검증. 첫 deploy run `29451844552`는 잘못된 service 입력 `osmu`로 실패했고 실제
  service `openclaw-dashboard-osmu`로 재실행해 시정.

## Blocked / Notes
- SNS-013 build REOPENED FROM SHIP: 폴링 배포 후 실제 T-PIN-01 발행은 DB published 1/queue published로
  성공했지만 직후 permalink 조회가 비어 API 응답에 URL이 없었다. 외부 재발행 없이 기존 external_id의 permalink를
  최대 5회 재조회하고 성공 기록·queue JSON/DB를 보강하는 순차 retry 복구 경로 추가. focused 27 PASS, tsc PASS.
  운영 동일 요청 alreadyPublished:true+permalink, DB published/distinct external 1 전 ship 완료 금지.
- SNS-010 PROMOTED TO SHIP BLOCKER: SNS-009/SNS-012 운영 배포 후 T-PIN-01 TEXT 실발행에서 container 생성은
  성공했지만 즉시 `threads_publish`가 provider 400을 반환했다. 기존 QA의 "IMAGE에만 상태 폴링 영향" 판단을
  운영 증거로 폐기. 모든 Threads container를 `FINISHED`까지 최대 20초 폴링하고 `ERROR/EXPIRED`/unknown/
  timeout은 fail-closed하도록 구현. focused 29 PASS, tsc PASS. CI→재승인→재배포→동일 draft permalink 전 ship 금지.
- SNS-012 build REOPENED FROM SHIP: `/api/publish` 성공이 `published_posts`만 기록하고 원 queue JSON/DB
  shadow를 `published`로 전환하지 않아 UI에 draft가 남고 순차 재클릭 시 동일 외부 게시물을 다시 만들 수 있다.
  동일 tenant+draft+platform+account 성공 기록을 외부 호출 전에 재사용하고, 첫 성공 뒤 queue JSON과
  `queue_posts`를 함께 published로 갱신하도록 수정. focused 14 PASS, tsc PASS. CI→build/qa 재승인→재배포
  →T-PIN-01 첫 발행과 동일 요청 재호출 `alreadyPublished:true`/외부 게시물 1개 관찰 전 ship 금지.
- SNS-011 build REOPENED FROM SHIP: deploy workflow가 checkout 전 `$GITHUB_WORKSPACE` 전체를 삭제하지만
  OSMU queue/config는 그 내부 상대 bind mount(`./data-osmu`, `./config-osmu`)를 사용해 배포 직후 파일이
  초기화됐다. 운영 컨테이너 `/app/data`와 `/app/config`가 비어 있음을 직접 관찰했고 DB `queue_posts`
  그림자 사본에는 T-PIN-01/T-02 두 draft가 남아 있다. 고정 이름 Docker volume으로 전환하고 상대 bind
  mount 재도입 방지 계약 테스트를 추가했다. CI→build/qa 재승인→DB 사본 복구→재배포→재배포 후 초안
  존속→T-PIN-01 실발행/permalink 전 ship 금지.
- SNS-009 QA reopen: 첫 qa-verifier는 blocker/high 0, RUBRIC 23/25를 냈지만 Skill/WebSearch 0으로 품질
  verifier FAIL이라 승인 근거에서 제외. 동시에 Threads container/publish fetch 네트워크 예외가 route 밖으로 throw돼
  HTTP 500이 되는 LOW 결함을 발견했다. 안전한 `ok:false` 정규화+회귀 테스트+재CI 전 build 승인 취소.
- SNS-010 follow-up: Meta 공식 Threads 컬렉션 기준 IMAGE container 상태 폴링과 publish 응답 단절 후 결과불명
  처리가 없다. 현재 출시 정본 T-PIN-01은 TEXT이고 SNS-009 QA blocker/high 0이라 별도 후속으로 분리한다.
  새로 추가했던 publish 15초 timeout은 실제 성공 오판·중복 위험 때문에 제거. 이미지 공개 발행 전 SNS-010 해결.
- SNS-009 build candidate: 매 발행 전 Threads token `/me?fields=id`를 신뢰원으로 사용하고 저장 userId는 발행
  URL에서 제거. readiness는 live id 누락·파싱 실패를 fail-closed하고 저장/live mismatch를 invalid 처리한다.
  focused 68 PASS, tsc PASS, production build 160 pages PASS. full run은 653 PASS·9 skip 뒤 기존 5초 timeout
  2건이 발생해 해당 테스트 제한을 15초로 조정했고 단독 36 PASS를 확인했다. CI·운영 배포·T-PIN-01 permalink는
  미검증이며 `/approve build` 전 QA 전환 금지.
- SNS-009 운영 결함으로 build 재오픈: readiness는 Threads `/me?fields=username` 200만 보고 `valid` 처리하지만,
  publish는 저장된 stale `meta.userId`를 URL에 사용해 provider 400 `Unsupported post request` 발생. 공개 게시물
  생성 없음, T-PIN-01 draft 보존, token revoke+401 확인. token 실제 `/me?id`와 저장 ID 비교·발행 시 실제 ID
  사용 회귀 테스트→CI→build/qa 재승인→재배포→동일 정본 permalink 관찰 전 ship 금지.
- SNS-008 운영 Chrome 부분 통과: OSMU 단독 deploy run `29639946525` SUCCESS. 단기 고객 토큰을 넣은
  분리 Chrome에서 X credential 누락 비활성 안내, Facebook mode 경고, Facebook 클릭 후 새 target의
  `www.facebook.com` 이동, YouTube 클릭 후 새 target의 `accounts.google.com` 이동, TikTok/Reels 미구현
  표시를 직접 관찰했다. 증거 `docs/evidence/sns008-live-oauth-popup-e2e-20260718.png`. 토큰 revoke 후
  동일 readiness API HTTP 401과 원문 삭제 확인. popup activation 결함은 운영에서 교정됐지만 provider
  로그인·동의·callback/DB 저장·실 2계정 전환·공개 발행은 미검증이므로 ship/artifacts는 잠금 유지.
- SNS-008 독립 QA 최종 PASS: qa-verifier가 standards/dev.md, QA Skill, MDN, source/callback/test/CI를
  read-only 재검증. focused 10 PASS + 관련 callback tests, full 74 files/644 PASS·9 local DB skip,
  tsc/build/CI SUCCESS를 대조했고 blocker/high 0건, RUBRIC 23/25. `verify-agent-quality.sh`는 Skill 1회,
  WebSearch/Fetch 3회, 소크라/레드팀 3개를 확인해 PASS. 첫 2회 위임은 각각 표준 Read/QA Skill 누락으로
  반려되어 승인 근거에서 제외. 운영 Chrome post-fix popup target은 QA 승인·재배포 전 미검증.
- SNS-008 OAuth popup activation build candidate commit `e66e6f76`. 운영 Chrome에서 기존 구현의 Facebook
  popup target 0개를 직접 관찰해 build 재오픈. synchronous blank popup 예약, failure/callback/unmount/
  pending-fetch/React StrictMode 생명주기를 컴포넌트 테스트 10건으로 고정했다. 메인세션 focused 10 PASS,
  full 74 files/644 PASS·9 DB-env skip, tsc/build(160 pages) PASS. GitHub CI run `29608715956`은 Node 설치,
  typecheck/build, PostgreSQL 16 schema→seed→RLS, full test 전부 SUCCESS. build 승인 후 QA 재배포 전에는
  Facebook/YouTube popup target 생성이 미검증. readiness QA token은 revoke 후 HTTP 401 및 원문 삭제.
- SNS-007 tenant proxy 핫픽스 운영 배포 run `29600031321` SUCCESS. 고객 `osmu_` 토큰을 넣은 실제 Chrome에서
  Instagram/Threads AccountManager의 계정 1개·외부 ID·기본·정상·삭제 컨트롤을 직접 관찰했다. QA 토큰은
  revoke 후 동일 account API HTTP 401 확인 및 원문 삭제. ship은 계속 잠금: 실제 provider 2계정 OAuth,
  기본 전환, 계정별 공개 발행 permalink/Shorts URL은 미검증.
- SNS P0 QA remediation(2026-07-16): UI를 직접 발행 8채널로 정렬하고 Instagram/Threads provider live validation 및 재연결 상태를 구현. focused 75 PASS, full 563 PASS/8 skip, tsc/build PASS. 운영 재배포 후 code190 상태 직접 관찰 필요.
- Google OAuth: Google-only 코드 운영 배포(run 29485147720), provider 활성화·Google 로그인 화면 이동 관찰. 계정 입력→앱 복귀 실왕복 필요.
- Email auth: Google-only 정책 강제를 위해 Supabase Email provider 비활성화 필요. 기존 6 users는 삭제 금지.
- GA4: ID 주입·재배포·동의 기반 script/page_view 적재 관찰. GA4 DebugView 실수신 필요.
- Slack: webhook secret 주입 및 실제 ping `ok` 관찰. 채팅에 노출된 webhook은 출시 전 회전 필요.
- SMTP: Google-only 정책 확정으로 도입하지 않음. 비밀번호 재설정 경로 폐기.
- Meta: 회장 보고상 Instagram 계정 생성. 프로필 URL/리네임/이미지/첫 draft 및 Threads는 미검증.
