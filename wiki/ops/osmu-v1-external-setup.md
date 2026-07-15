# OSMU v1 External Setup Runbook

> 2026-07-16 운영 출시 차단 설정. 비밀값은 문서에 기록하지 않는다.

## 1. Google OAuth

1. Google Cloud `osmu-prod-20260712`의 OAuth client 화면을 연다:
   <https://console.cloud.google.com/auth/clients?project=osmu-prod-20260712>
2. `Create client` -> `Web application`을 선택하고 이름을 `OSMU Production`으로 지정한다.
3. Authorized JavaScript origins에 다음을 추가한다:
   `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud`
4. Authorized redirect URIs에 다음을 정확히 추가한다:
   `https://gvtsyyltgwqplrqegrxo.supabase.co/auth/v1/callback`
5. 생성 후 Client ID와 Client Secret을 복사한다.
6. Google Auth Platform의 `Audience`에서 User type이 `External`인지 확인한다. 테스트 상태라면 테스트 사용자만 로그인할 수 있으므로 공개 출시에는 `Publish app`으로 `In production` 상태를 만든다.
7. `Data Access`에서 `openid`, `userinfo.email`, `userinfo.profile` 기본 범위만 사용한다.
8. Supabase Google provider 화면을 연다:
   <https://supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo/auth/providers>
9. `Google`을 열고 Enable을 켠 뒤 Client ID와 Client Secret을 입력하고 저장한다.
10. Supabase URL Configuration에서 Site URL을 운영 URL로 두고 redirect allow list에 운영 URL을 포함한다:
   <https://supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo/auth/url-configuration>

운영 도메인이 바뀌면 Google의 Authorized JavaScript origins와 Supabase Site URL/redirect allow list를 새 도메인으로 갱신한다. Supabase 프로젝트를 유지하는 동안 Google Authorized redirect URI의 `https://gvtsyyltgwqplrqegrxo.supabase.co/auth/v1/callback`은 바뀌지 않는다.

완료 증거: Supabase Google provider의 Enabled 화면. 이후 에이전트가 운영 Google 로그인 왕복과 신규 lead 저장을 직접 검증한다.

## 2. GA4

1. <https://analytics.google.com/> -> `관리` -> `만들기` -> `속성`.
2. 속성 이름 `OSMU Production`, 시간대 `대한민국`, 통화 `KRW`로 생성한다.
3. `데이터 스트림` -> `웹`을 선택한다.
4. 웹사이트 URL에 `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud`, 스트림 이름에 `OSMU Production`을 입력한다.
5. 생성된 `G-`로 시작하는 측정 ID만 에이전트에게 전달한다. 측정 ID는 비밀값이 아니다.

완료 증거: 웹 스트림 상세 화면의 측정 ID. 이후 에이전트가 `OSMU_GA4_MEASUREMENT_ID` GitHub Secret 반영, 재배포, 동의 전 미수집과 동의 후 DebugView 이벤트를 검증한다.

## 3. Slack Alert

1. <https://api.slack.com/apps> -> `Create New App` -> `From scratch`.
2. 앱 이름 `OSMU Ops`, 알림을 받을 workspace를 선택한다.
3. `Incoming Webhooks` -> `Activate Incoming Webhooks`를 켠다.
4. `Add New Webhook to Workspace` -> 운영 알림 채널 선택 -> `Allow`.
5. 생성된 webhook URL을 에이전트에게 전달한다. URL은 비밀값으로 취급한다.

채팅 전달 대신 GitHub에 직접 저장하려면 <https://github.com/seong-jin-jo/openclaw-auto/settings/secrets/actions/new>에서 Name을 `OSMU_ALERT_SLACK_WEBHOOK_URL`, Secret을 webhook URL로 입력한다.

완료 증거: webhook 생성 화면. 이후 에이전트가 GitHub Secret `OSMU_ALERT_SLACK_WEBHOOK_URL`에 저장하고 실제 ping과 장애/복구 알림 수신을 검증한다.

## 4. Google-only Enforcement

1. Supabase provider 화면을 연다: <https://supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo/auth/providers>
2. `Email` provider를 열고 비활성화해 직접 API를 통한 신규 이메일/비밀번호 가입도 차단한다.
3. `Google` provider가 Enabled인지 다시 확인한다.

기존 auth user 레코드는 삭제하지 않는다. 같은 이메일의 Google 로그인은 Supabase identity linking으로 기존 사용자에 Google identity를 연결한다. 첫 실제 Google 로그인 후 운영자 사용자 목록에서 provider와 tenant 보존을 확인한다.

## 5. Instagram and Threads

1. Instagram 프로필 -> `프로필 편집`에서 다음을 설정한다.
   - 표시 이름: `오스무 비서 (OSMU)`
   - 사용자 이름: `osmu.official`, 불가하면 `osmu.secretary`
   - 프로필 이미지: `scratchpad/osmu-launch-assets/profile-osmu-v1.png`
   - 소개: `wiki/marketing/launch-pack-2026-07-16.md`의 `Instagram Bio`
2. Threads 프로필 -> `프로필 편집`에서 같은 이름/이미지를 확인하고 해당 문서의 `Threads Bio`를 입력한다.
3. 같은 문서의 `Threads 고정글`을 첫 게시물로 발행하고 고정한다.

완료 증거: Instagram/Threads 프로필과 첫 Threads 게시물 화면. 자동 발행은 Meta 권한 실검증 전까지 사용하지 않는다.

## Agent Follow-up

외부 값/완료 화면을 받으면 에이전트가 CLI로 secret 반영, 운영 재배포, Google OAuth, lead DB, GA4 DebugView, Slack 수신을 실행한다. 모든 실경로가 관찰된 뒤에만 `v1.0.0`을 태그한다.
