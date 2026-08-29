# OSMU 로그인·연결 실패 진단 (2026-08-29)

## STAMP

- 생성시각: 2026-08-29 19:47 KST
- model: claude-opus-5
- agent: general-purpose (진단 전용, 제품 코드 미수정)
- 작업 브랜치/HEAD: feat/design-system-and-missing-features / f5894835
- 회장이 실제로 사용한 배포본: ad096bc1 (2026-08-28 22:14:11 +0900). 그 이후 배포는 모두 실패했으므로 오늘(08-29) 커밋은 운영에 반영되어 있지 않다.

근거 파일:

- docs/requests/2026-08-29-회장-4실-실사용-피드백.md (마지막 줄 원문)
- session-state.osmu.md (배포 이력, 08-28 22:15 성공 이후 실패)
- dashboard/src/app/login/page.tsx
- dashboard/src/components/shared/LoginModal.tsx
- dashboard/src/components/shared/AuthGate.tsx
- dashboard/src/app/api/auth/google/route.ts
- dashboard/src/app/api/me/route.ts
- dashboard/src/app/api/connect/readiness/route.ts
- dashboard/src/components/channel/SocialConnectButton.tsx
- dashboard/src/lib/tenant-auth.ts, supabase.ts, oauth-errors.ts, oauth-app-credentials.ts, connect-readiness.ts, channel-connection.ts, social-connect.ts, db.ts
- dashboard/src/proxy.ts
- .github/workflows/deploy-marketing.yml, dashboard/Dockerfile
- docs/audit/osmu-code-review-2026-08-29.md
- 로컬 실행 관측: 개발 서버 재기동 후 /api/health, /api/me, /api/auth/google, /api/connect/readiness 직접 호출

무엇을 고민했는가:

1. 회장 문장 "일단 로그인 안된다 다 연결 실패 나"는 한 문장에 두 개의 다른 고장이 붙어 있다. 로그인 자체가 안 된 것인지, 로그인은 됐는데 채널 연결이 전부 실패한 것인지를 먼저 갈랐다.
2. 코드리뷰가 지목한 인증 MAJOR 세 건이 회장이 만진 화면에 실제로 존재했는지, 즉 그 코드가 회장이 쓴 빌드에 들어 있었는지를 커밋 시각으로 검증했다.
3. 설정 누락과 코드 결함을 섞지 않기 위해, 로컬에서 실제로 서버를 띄워 어느 경로가 코드만으로 작동하는지 확인하고 나머지를 설정 문제로 남겼다.

## 한 줄 결론

로그인 시작 경로와 채널 연결 경로 모두 코드는 로컬에서 정상 동작한다(관측됨). 회장이 본 두 증상은 운영 환경 설정 문제일 가능성이 가장 높다. 채널이 "다" 실패한 것은 서버에 OAuth 앱 자격증명이 없을 때 12개 채널이 한꺼번에 비활성으로 그려지는 정상 동작이며, 로그인 실패는 운영 도메인이 Supabase 인증의 허용 복귀 주소에 등록되지 않았을 때 나타나는 증상과 일치한다. 다만 운영 주소를 이 레포에서 알 수 없어 운영 재현은 미검증이다.

## 증상과 코드 경로 대조표

| 회장 증상 | 후보 코드 경로 | 화면에 뜨는 문구 | 판정 |
|---|---|---|---|
| 로그인 안 됨 (고객 Google 로그인) | app/login/page.tsx `google()` → /api/auth/google | "Google 로그인이 아직 설정되지 않았습니다..." 또는 "로그인 설정이 서버/환경변수에 아직 없습니다..." | 로컬 관측 결과 이 경로는 200으로 authUrl을 정상 반환. 운영에서 이 문구가 떴다면 NEXT_PUBLIC_SUPABASE_URL 미주입 |
| 로그인 안 됨 (구글 동의 후 되돌아왔는데 그대로 로그인 화면) | Supabase가 허용 복귀 주소 밖으로 보냄 → 세션 없음 | 아무 오류 문구 없이 로그인 화면 유지 | Supabase 콘솔의 Redirect URL 허용목록 문제. 코드로는 잡히지 않는다 |
| 로그인 안 됨 (되돌아왔지만 거부) | login/page.tsx 서버 확인 분기 | "세션이 만료되었습니다. Google로 다시 로그인해주세요." / "로그인 상태를 확인하지 못했습니다..." | 이 분기는 08-29 10:10 커밋에서 처음 생겼다. 회장 빌드에는 없음 |
| 로그인 안 됨 (운영자 토큰 창) | components/shared/LoginModal.tsx | 회장 빌드에서는 "로그인 필요 / 로그인 / 취소" (한국어) | 회장 빌드에서는 한국어였음. 영어 라벨은 08-29 10:10 이후 |
| 다 연결 실패 | api/connect/readiness → SocialConnectButton | 채널마다 "오픈 준비중"(비활성) 또는 "확인 필요"(비활성) | 서버 자격증명이 없으면 12개 채널 전부 이 상태가 된다. "전부 실패"로 보이는 가장 개연성 높은 경로 |
| 다 연결 실패 (버튼은 눌렸는데 팝업이 실패) | api/connect/[provider]/callback | "연결 실패" 결과 화면 + 사유 | 콜백 주소가 각 제공자 콘솔 등록값과 다르면 전 채널 동일 실패. OSMU_PUBLIC_URL 값에 좌우된다 |
| 다 연결 실패 (인증 없음) | proxy.ts 인증 경계 | readiness 401 → 버튼 "확인 필요" 비활성 | 로그인 실패가 선행하면 연결도 자동으로 전부 실패한다. 두 증상이 한 원인일 수 있는 지점 |

핵심: 로그인 실패는 채널 연결 실패의 상위 원인이 될 수 있다. 로그인 세션이 없으면 readiness 호출이 401로 떨어지고, SocialConnectButton은 실패를 닫힌 상태로 처리하도록 설계돼 있어(주석에 명시) 모든 채널이 비활성 "확인 필요"가 된다. 따라서 두 증상을 각각 고치기 전에 로그인부터 세운다.

## 설정 누락 목록 (이름만)

운영 배포 워크플로가 GitHub Secrets에서 읽어 컨테이너에 넣는 값들이다. 값은 여기 쓰지 않는다.

로그인에 직접 관여:

- OSMU_SUPABASE_URL (컨테이너의 NEXT_PUBLIC_SUPABASE_URL. 이미지 빌드 시각에 인라인되므로 비어 있으면 로그인 화면이 죽는다)
- OSMU_SUPABASE_ANON_KEY
- OSMU_DASHBOARD_AUTH_TOKEN
- OSMU_DATABASE_URL
- OSMU_PUBLIC_URL (OAuth 복귀 주소와 채널 콜백 주소를 모두 이 값으로 고정한다)
- OSMU_SECRET_KEY

채널 연결에 관여(쌍이 다 있어야 그 채널이 활성화된다):

- IG_APP_ID / IG_APP_SECRET
- THREADS_APP_ID / THREADS_APP_SECRET
- FB_APP_ID / FB_APP_SECRET / FB_CONFIG_ID
- X_CLIENT_ID / X_CLIENT_SECRET
- YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET
- LINKEDIN_CLIENT_ID / LINKEDIN_CLIENT_SECRET
- NAVER_CLIENT_ID / NAVER_CLIENT_SECRET
- PINTEREST_APP_ID / PINTEREST_APP_SECRET
- TUMBLR_CONSUMER_KEY / TUMBLR_CONSUMER_SECRET
- TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET
- SLACK_CLIENT_ID / SLACK_CLIENT_SECRET
- LINE_CLIENT_ID / LINE_CLIENT_SECRET

레포 밖 콘솔 설정(값이 아니라 등록 상태 문제):

- Supabase 인증 설정의 Site URL과 Redirect URL 허용목록에 운영 도메인의 /login 주소가 들어 있어야 한다. 없으면 구글 동의까지는 되고 되돌아올 때 세션이 붙지 않는다. 증상은 "아무 말 없이 로그인 화면 그대로"다.
- 각 채널 제공자 콘솔의 redirect URI에 OSMU_PUBLIC_URL 기준 콜백 주소가 정확히 같은 문자열로 등록돼 있어야 한다.

## 코드 결함 목록

### 1. 자격증명이 없는데 "외부 앱 심사" 탓으로 안내한다 (관측됨)

- 위치: dashboard/src/app/api/connect/readiness/route.ts 의 reason 결정 분기 (externalReviewPending 판정이 credentials 완성도 판정보다 앞선다)
- 판단 근거: 로컬에서 자격증명이 하나도 없는 상태로 이 엔드포인트를 호출했더니 instagram과 threads는 "instagram 외부 앱 심사가 완료되면 연결할 수 있습니다"로 응답했고, 심사 표시가 없는 x만 "서버에 x OAuth 앱 자격증명(X_CLIENT_ID/X_CLIENT_SECRET)이 아직 설정되지 않았습니다"로 정확한 사유를 냈다. 실제 원인은 둘 다 자격증명 부재인데 절반은 잘못된 사유를 보여준다.
- 왜 문제인가: 회장이 화면에서 본 사유가 실제 고장 원인과 다르면 진단 자체가 어긋난다. 이번 "다 연결 실패"의 원인 규명이 늦어진 직접적 이유일 수 있다.
- 상태 판정(opening_soon, 비활성)은 옳다. 틀린 것은 안내 문구뿐이다.

### 2. 코드리뷰의 인증 MAJOR 세 건은 회장 증상과 무관하다 (근거 확인)

- login/page.tsx:108, operator/page.tsx:20, LoginModal.tsx:149 세 건은 모두 커밋 3472565f(2026-08-29 10:10)가 만든 코드다.
- 회장이 쓴 배포본은 ad096bc1(2026-08-28 22:14)이고, 그 시점 LoginModal은 "로그인 / 취소" 한국어였음을 해당 커밋의 파일에서 직접 확인했다.
- 따라서 이 세 건은 실재하는 결함이되 회장이 겪은 증상의 원인이 아니다. 별도로 고쳐야 하지만 이번 장애의 우선순위는 아니다.
- 다만 LoginModal의 영어 라벨(Login Required / Auth Token / Login / Cancel)은 확정 요구 위반이므로 다음 배포 전에 반드시 한국어로 되돌려야 한다. 지금 상태로 배포하면 회장이 겪는 다음 증상이 된다.

### 3. 코드 결함으로 의심했다가 배제한 것들

- proxy.ts의 인증 경계가 /api/connect/readiness를 운영자 전용으로 막는지 의심했으나, 목록의 "/api/connect/[provider]" 패턴이 정규식으로 /api/connect/readiness에 일치하므로 고객 세션도 통과한다. 결함 아님.
- readiness 응답이 98초 걸리고 서버가 응답을 멈춘 현상을 한 번 관측했으나, 서버를 깨끗이 재기동한 뒤에는 15.9초(최초 컴파일 포함) 후 정상 200이고 이어진 health도 정상이었다. 앞의 현상은 오래 떠 있던 죽은 개발 서버의 잔재로 판단한다. 운영 재현 근거 없음. 미검증으로 남긴다.

## 고칠 순서 추천

1. 운영 배포를 먼저 되살린다. 지금 운영은 08-28 22:14 빌드에 고정돼 있고 그 뒤 배포가 두 번 실패했다(스키마 preflight). 이걸 풀지 않으면 무엇을 고쳐도 회장 화면에 반영되지 않는다.
2. 운영 컨테이너에서 로그인 관련 설정 6종이 실제로 비어 있지 않은지 확인한다. 특히 NEXT_PUBLIC_SUPABASE_URL은 이미지 빌드 시각에 박히므로 "시크릿을 나중에 넣었다"면 재빌드해야 한다.
3. Supabase 인증 설정에서 운영 도메인의 /login 주소가 복귀 허용목록에 있는지 확인한다. 이 한 줄이 빠지면 로그인은 오류 문구 하나 없이 실패한다.
4. 로그인이 서면 그 세션으로 채널 화면을 열어 어떤 문구가 뜨는지 본다. "오픈 준비중"이면 해당 채널의 자격증명 쌍이 서버에 없는 것이고, "확인 필요"면 readiness 호출 자체가 실패한 것이다. 이 두 갈래로 원인이 확정된다.
5. readiness의 사유 문구 우선순위를 고친다. 자격증명이 없으면 심사 문구보다 자격증명 문구가 먼저 나와야 한다.
6. LoginModal 문구를 확정 한국어로 되돌린다.
7. 코드리뷰의 인증 MAJOR 세 건(늦은 응답이 다른 신원을 덮는 문제)을 처리한다.

## 관측됨 / 미검증 구분

관측됨(로컬 개발 서버 직접 호출, 포트 3456):

- /api/health 200
- 인증 헤더 없이 /api/me 401, 잘못된 Bearer로 /api/me 401, 운영자 토큰으로 /api/me 200에 운영자 판정
- /api/auth/google 200으로 Supabase authorize 주소 정상 반환. 즉 Supabase 프로젝트의 Google 제공자는 켜져 있다
- /login 페이지 200 렌더
- 자격증명 없는 상태의 /api/connect/readiness 200, 전 채널 available false, instagram과 threads의 사유 문구가 실제 원인과 다름

근거 확인(코드와 이력으로 확인, 실행 아님):

- 회장 배포본은 ad096bc1이며 인증 MAJOR 세 건의 코드는 그 이후에 들어왔다
- 배포 워크플로가 어떤 이름의 시크릿을 컨테이너에 넣는지
- NEXT_PUBLIC 계열이 이미지 빌드 인자로만 주입된다는 점

미검증:

- 운영 환경에서의 실제 로그인 시도. 운영 공개 주소가 이 레포에 없고(레포 정책상 서비스 URL 미포함) 세션이 접근할 수 없어 재현하지 못했다
- 운영 컨테이너의 시크릿 실제 주입 여부
- Supabase 콘솔의 복귀 주소 허용목록 상태
- 각 채널 제공자 콘솔의 콜백 주소 등록 상태
- 회장이 본 것이 로그인 화면 오류였는지, 로그인 후 채널 화면이었는지. 회장 피드백 본문에 네 개 실 화면 사용 경험이 상세히 적혀 있는 것으로 보아 앱 안까지는 들어갔던 것으로 읽히지만, 그것이 고객 세션이었는지 운영자 상태였는지는 확인하지 못했다

## 셀프심문

내 판정이 틀렸다면 어디가 틀렸을까.

첫째, "코드는 정상이고 설정 문제"라는 결론은 로컬에서 코드가 돌았다는 것에 기대고 있다. 로컬은 개발 모드이고 운영은 컨테이너 프로덕션 빌드다. 프로덕션에서만 나타나는 분기가 실제로 존재한다. 예컨대 인증 토큰이 없을 때 개발은 통과시키고 운영은 막는 분기가 여러 곳에 있다. 그래서 "로컬에서 됐다"를 "운영에서도 코드는 무죄"로 번역하면 안 된다. 이 점을 반영해 결론을 "코드는 무죄"가 아니라 "설정 가능성이 가장 높고 운영 재현은 미검증"으로 낮췄다.

둘째, 두 증상을 하나의 원인으로 묶고 싶은 유혹이 있었다. 로그인 실패가 연결 실패를 낳는 경로가 실제로 존재하기 때문이다. 그러나 회장은 네 개 실 화면을 상세히 써 놓았고, 그것은 앱 안까지 들어갔다는 뜻이다. 로그인이 완전히 막혔다면 그 피드백 자체가 나올 수 없다. 그래서 하나로 묶지 않고, 어느 쪽인지 가르는 판별 절차를 고치는 순서 4번에 넣었다.

셋째, 코드리뷰 MAJOR 세 건을 "무관"으로 잘라낸 판단이 틀릴 수 있다. 커밋 시각만으로 판단했기 때문이다. 만약 08-29 오전 커밋이 어떤 경로로든 운영에 반영됐다면 이 판단은 뒤집힌다. 다만 세션 기록과 배포 이력이 08-28 22:15 이후 배포 실패를 명시하고 있어 현재로서는 시각 근거가 우세하다고 본다. 배포 이력을 실제 워크플로 실행 기록으로 재확인하는 것은 다음 세션 몫으로 남긴다.
