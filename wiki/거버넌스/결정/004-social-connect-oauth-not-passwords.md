# ADR-004 — 고객 소셜 연결: OAuth "연결" + App Review (비번 수집 금지)

**상태**: accepted · **날짜**: 2026-06-29

## 맥락
고객 온보딩에서 가장 어려운 구간 = Meta(Facebook/Instagram/Threads) 앱·토큰 셋업.
"고객한테 Meta 앱·IG/Threads 계정 비번 등 계정정보를 받아 에이전트가 권한·API를 자동 설정하면
편하지 않을까"라는 아이디어가 나왔다(에이전트가 우리 자체 계정 셋업을 브라우저로 운전 가능함을 보고).

## 결정
**고객 비밀번호를 받거나 저장하지 않는다. 고객 소셜 연결은 OAuth "연결" 플로우 + App Review로 한다.**

- 고객은 **"Instagram/Facebook 연결" 버튼** 클릭 → Meta 공식 OAuth 동의 → 우리는 **access/refresh
  토큰만** 수령(비번은 절대 안 받음). 토큰은 `OSMU_SECRET_KEY`로 암호화 저장, 갱신은 우리가.
- 임의 고객 계정에 *대신 발행*하려면 앱이 **App Review**로 발행/인사이트 권한 고급 액세스를 받는다
  (자기 소유 테스터 계정은 review 없이 동작 — 내부 5브랜드는 테스터 방식).
- 이는 앞서 정한 per-tenant "Google 연결"·GA4/슬랙 "플랫폼이 인터페이스" 모델과 동일 계보.

## 왜 비번 수집은 안 되는가 (Why)
1. **치명적 책임** — 고객 소셜 비번 저장 = 한 번 유출되면 전 고객 계정 탈취, 법적·평판 재앙.
2. **Meta ToS 위반** — 비번 기반 자동 로그인은 플랫폼 정책 위반 → 앱·계정 정지.
3. **기술적으로 불안정** — 2FA·캡차·동적 UI로 자동화가 깨짐. Meta가 봇 로그인을 능동 차단.
4. OAuth는 이 셋을 다 푼다 — 비번 안 받고, 정책 준수, 토큰 갱신으로 안정.

## 에이전트 브라우저 자동화의 자리
GStack 브라우저로 Meta 콘솔을 운전하는 건 **우리 자신의 계정 셋업(우리 세션, 일회성 내부 작업)에만**
쓴다. **고객 온보딩 메커니즘으로는 쓰지 않는다**(고객 세션·비번을 우리가 운전 = 위 1~3 위반).

## How to apply
- 상품화 빌드: 채널 Settings에 "Instagram/Facebook/Threads 연결"(OAuth) 버튼 → 콜백 토큰 저장(per-tenant
  integrations) → publish/insights는 저장된 토큰으로. (per-tenant OAuth 연결 빌드 = 기존 백로그.)
- 내부 5브랜드(지금): 우리 앱에 각 계정 테스터 추가 + 토큰 발급(에이전트 브라우저로 우리가 운전 가능).
- 관련: [[../../4-reference/brand-grounding]], ADR-003(pricing), `wiki/3-operations/session-state.md` Meta 셋업.

## 중앙 개발자 앱 credential 운영 (2026-07-28 보강)

- 고객별 `channel_accounts` access/refresh token과 운영자의 중앙 OAuth App ID/Secret은 다른
  보안 경계다. 전자는 tenant 소유, 후자는 모든 tenant의 OAuth 진입에 쓰는 전역 인프라다.
- 운영자는 Admin의 provider 카드에서 callback·공식 콘솔/문서·필수 필드·설정 단계를 확인하고,
  중앙 값을 전체 세트 단위로 등록/교체한다. 저장은 `oauth_app_credentials`에 각 필드별
  pgcrypto 암호화로만 한다.
- 기본 조회는 source(DB/env), 설정 여부, 마스킹 값, 갱신시각만 반환한다. 원문은 정확한 운영자
  Bearer를 다시 요구하는 explicit reveal에서만 no-store 응답으로 반환하고 30초 뒤 UI 메모리에서
  지운다. update/reveal은 `oauth_credential_audit`에 secret 없이 기록한다.
- 기존 운영 환경변수 원문을 별도 HTTP 응답으로 직접 덤프하지 않는다. Admin의 단일
  `원문 확인` 요청이 env 출처의 완전한 provider 세트를 `oauth_app_credentials`에 암호화 INSERT한
  뒤, **같은 DB 트랜잭션 안에서 DB 행을 다시 복호화해 reveal**한다. `import`와 `reveal` 감사 행도
  같은 트랜잭션에 secret 없이 기록한다. 별도 가져오기 버튼은 두지 않는다.
- INSERT는 `ON CONFLICT DO NOTHING`을 유지한다. 요청 사이에 기존 DB 행이 발견되거나 새로 생기면
  env로 덮어쓰지 않고 잠근 DB 행을 정본으로 reveal한다. env 일부 누락, DB·암호화 키 장애,
  불완전한 DB 행은 아무 필드도 혼합하지 않고 fail-closed한다. 성공 응답 뒤 metadata를 즉시
  새로고침해 source DB·준비 상태를 표시한다.
- 런타임은 `resolveOAuthCredentialSet()`만 사용한다. DB 완전 세트 우선 → DB 행이 없으면 기존 env
  완전 세트 fallback → DB 일부만 있으면 env와 섞지 않고 fail-closed다.
- 2026-07-26의 “Admin은 secret 이름/준비상태만 표시하고 원문 입력을 받지 않는다” 운영 결정은
  회장의 2026-07-28 명시 지시로 이 절에서 대체됐다. 고객 UI/tenant token에는 중앙 입력·조회
  endpoint를 노출하지 않는 원칙은 유지한다.

보안 벤치마크:
- OWASP Secrets Management Cheat Sheet의 최소권한, 암호화 저장, secret 비로깅, lifecycle 감사
  원칙을 차용했다:
  https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html
- 민감 응답 캐시 방지는 OWASP REST Security Cheat Sheet의 `Cache-Control: no-store`를 적용했다:
  https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- 차별화: env secret을 브라우저로 먼저 reveal한 뒤 재전송하지 않고, 단일 운영자 요청·단일 DB
  트랜잭션에서 provider 전체 세트를 암호화 DB로 이동한 다음 DB 값을 reveal해 HTTP 노출면과
  필드 혼합 가능성을 함께 제거했다.

## 계정 전환·provider 세션 경계 (2026-07-24 보강)

- 우리 대시보드 origin은 Meta·Google·X·TikTok 등 **다른 origin이 소유한 로그인 쿠키를 삭제할 수 없다**.
  따라서 “다른 계정 연결”을 누른 것만으로 provider 로그아웃이 됐다고 주장하지 않는다.
- 지원되지 않거나 공식 문서에 없는 `force_authentication`·자동 로그아웃 파라미터를 추측해 붙이지 않는다.
  Meta 계열은 Meta Accounts Center, X/TikTok은 각 계정 설정, YouTube는 Google 앱 연결 관리 화면을
  `noopener noreferrer` 새 탭으로 열어 사용자가 계정/세션을 직접 확인한 뒤 재연결하게 한다.
- Google/YouTube OAuth는 공식 `prompt=consent select_account`를 유지해 연결할 때 계정 선택 화면을 요청한다.
  이 provider 지원 동작과 우리 origin에서 third-party 세션을 삭제할 수 없다는 경계는 동시에 성립한다.
- UI의 약속은 “관리 화면을 연다 → 사용자가 전환/로그아웃한다 → 돌아와 OAuth 연결을 다시 누른다”까지다.
  실제 provider 세션 변경이나 callback 성공은 관찰 전까지 미검증이다.
- 2026-07-30 재확인에서도 Meta의 Threads Authorization Window와 Instagram Login 공식 문서에는
  Google `prompt=select_account`·TikTok `disable_auto_auth`에 대응하는 계정 선택 파라미터가
  문서화돼 있지 않았다. 따라서 Threads·Instagram 연결 버튼 근처에는 각각
  `threads.net`·`instagram.com`에서 먼저 로그아웃하라는 안내와 Meta 계정 센터 링크를 제공한다.
- identity 경계는 path와 세션을 함께 본다. `/operator*`에서는 의도적인 운영자 토큰을 Supabase
  세션보다 우선한다. 고객 로그인/고객 화면에서 Supabase 세션이 확립되면 잔존 운영자 토큰 대신
  고객 JWT를 승격하며, 운영자↔고객·고객 A↔고객 B 전환과 로그아웃 때 `active_workspace`를 비운다.
- path가 바뀌거나 AuthGate가 unmount된 뒤 완료된 Supabase `getSession()` 결과와 그 run의
  `onAuthStateChange` callback은 폐기한다. 이전 customer path의 비동기 초기화가
  `/operator*`에 도착해 운영자 토큰을 고객 JWT로 교체하거나 뒤이은 `SIGNED_OUT`으로 지우면
  위 identity 우선순위가 순서에 따라 뒤집히기 때문이다.
- `/api/connect/{provider}`와 `/api/connect/readiness`는 고객 JWT가 확정한 tenant와 쿼리
  `tenant_id`가 다르면 JWT tenant를 계속 사용하면서 `oauth_connect_tenant_mismatch` 사실만
  구조 로그로 남긴다. tenant id·Bearer·secret 값은 로그에 포함하지 않는다.

근거:
- MDN, third-party cookies: https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies
- Meta, Accounts Center: https://www.facebook.com/help/943858526073065
- Meta, Threads access tokens and permissions:
  https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions
- Meta, Instagram API with Instagram Login:
  https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
- Meta 공식 Postman Threads API collection:
  https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
- Meta 공식 Postman Instagram API collection:
  https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Google OAuth web-server `prompt=select_account`:
  https://developers.google.com/identity/protocols/oauth2/web-server

## 실증 (2026-06-29) — 콘솔 스크립트 운전의 한계
에이전트가 GStack 브라우저로 Meta 콘솔의 IG 권한 추가를 시도한 결과: 스냅샷 ref가 SPA 재렌더마다
바뀌어 "추가" 버튼 클릭이 반복 빗나가고, 그 과정에서 `instagram_branded_content_creator`가 의도치
않게 추가되는 오클릭 발생. 결론 재확인: **콘솔 UI 스크립팅은 불안정·실앱에 부작용 위험 → 고객 온보딩
메커니즘으로 부적합. 우리 자체 계정도 민감 토글은 사람이 눈으로 클릭(페어)이 안전. 제품 자동화는 OAuth.**

## ★실제 사고 (2026-07-01) — 자동화가 개발자 계정 플래그 유발
GStack 브라우저로 Meta 콘솔(IG 설정 페이지) 자동 운전 중, Meta가 **"계정 확인이 필요합니다 — 이
개발자 계정에서 비정상적인 활동이 감지되었습니다"**를 띄우며 개발자 계정을 플래그(액세스 차단). 봇 탐지에
걸린 것. → **결론 확정·강화: Meta 콘솔 자동 운전은 금지.** 콘솔 셋업(env·redirect URI·권한·테스터)은
사용자가 손으로(일회성). 제품 자동화는 OAuth 연결 버튼(콘솔 미접촉)만. 계정 복구(계정 확인/신원·2FA)는
계정주 본인만 가능(에이전트 불가).

## 권한 부여 메커니즘 — 테스터(개발) vs App Review(상품화)
"고객 로그인만 하면 우리가 모든 세팅" = 가능. 단 메커니즘 구분:
- **개발 모드(지금, 내부 5브랜드)**: 각 계정을 앱에 테스터 초대 + 그 계정에서 수락(수동, 자기 계정). 50명 한계.
- **상품화(외부 고객)**: 앱 **App Review 1회** 통과 → 누구나 OAuth "연결" → **Meta 동의 화면에서 권한
  (content_publish·insights 등) 승인** → 우리가 토큰+권한 수령. **테스터 등록·웹사이트권한 수락·콘솔 작업 0.**
  권한 부여는 OAuth 동의가 처리한다(콘솔 자동운전 불필요·금지).
- 상품화 마일스톤 = App Review 준비(privacy policy URL + 이용사례 데모 영상 + 검수 제출).

## 토큰 내구성 계약 (2026-08-14 보강)

- Instagram·Threads는 authorization code로 받은 단기 토큰을 반드시 provider 장기 토큰으로 교환한 뒤 저장한다. 장기 교환 실패 시 단기 토큰 폴백은 금지한다.
- Facebook은 단기 user token, 장기 user token, `/me/accounts` page token 순서를 전부 통과해야 저장한다. 장기 교환이 실패하면 page token 조회로 진행하지 않는다.
- provider가 반환한 `expires_in`은 callback 시점의 절대시각으로 변환해 `channel_accounts.token_expires_at`에 저장한다. access token과 refresh token은 각각 `secret_enc`, `refresh_enc`에 암호화한다.
- Threads·Instagram·X·YouTube는 저장 전 실제 계정 조회로 신원을 확인한다. 실패, 타임아웃, ID 누락을 토큰 교환 응답 ID로 덮지 않고 callback을 실패시켜 `active` 오판을 막는다.
- 연결 판정은 status만 보지 않고 만료시각과 암호화 refresh token 유무를 함께 본다. Meta 장기 토큰 계정이 `active`여도 만료시각이 없으면 `reconnect`다.
- YouTube refresh는 기존 `refresh_enc` 경로를 유지하고 새 access token의 `expires_in`으로 만료시각도 갱신한다. Threads·Instagram의 provider refresh endpoint 자동 호출은 아직 미구현이므로 만료 후에는 재연결이 필요하다.

근거:
- Meta 공식 Postman Threads API: https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api
- Meta Instagram API: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api
- Google OAuth web server: https://developers.google.com/identity/protocols/oauth2/web-server
