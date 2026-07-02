# 세션 작업 상태 (재실행 가능한 핸드오프)

> 작업 하네스 규칙 #3. 30초 재개. 상세 이력: [archive/session-2026-06.md](archive/session-2026-06.md) (2026-07-02 롤오버).
> 단계 진실원: 루트 `pipeline-state.md`(현재 **qa**, ship은 `/approve qa` 후). QA 증거: `docs/qa-tracker.md`.

**최종 갱신:** 2026-07-02 새벽(밤샘 오토런) · `main` · 라이브 health 200.

## 진행 상태 (2026-07-03)

**✅ 해결됨(라이브 검증):**
- **콘텐츠 생성** — `CLAUDE_CODE_OAUTH_TOKEN` gh secret+env 배선(배포 765935ca). 라이브 `/api/studio/text` →
  실제 한국어 콘텐츠(threads/x/ig/shorts) 생성 성공. 502 해소.
- **VM 운영 배선** — autoheal 컨테이너 Up(healthy) + publish-due crontab(*/10) 등록. 래퍼가 컨테이너 env에서
  운영자 토큰 로드. 라이브 테스트 `all-tenants sweep 200 processed:0`(due 없어 정상).
- **IG redirect URI** — 사용자가 Meta 콘솔에 `.../api/connect/instagram/callback` 등록(스샷 확인).
- 버튼 죽는 버그(청크520)·가입 딥링크 — 수정·라이브 검증.

**✅ 추가 해결(2026-07-03, 라이브 검증):**
- **"Invalid redirect_uri" 버그** — 프록시 뒤 `new URL(request.url).origin`이 `0.0.0.0:18789`를
  잡아 Meta 등록값과 불일치(실측). `publicOrigin()`(OSMU_PUBLIC_URL>x-forwarded-*>request) 도입,
  auth-url·callback 통일. gh secret `OSMU_PUBLIC_URL` 설정, 배포(run 28611637538 success).
  라이브 redirect_uri = `https://openclaw.../api/connect/instagram/callback` 확인. 커밋 e8603547.
  회귀 테스트 2개(9 pass). 배포 서비스명은 `openclaw-dashboard-osmu`(단축 'osmu' 아님 — 오타 주의).

**✅ IG 플로우 직접 재현 검증(2026-07-03):** 라이브 authUrl을 curl -L로 끝까지 추적 → 인스타가 302로
동의 페이지 거쳐 `/accounts/login/`(username/Password)까지 정상 도착, **"Invalid redirect_uri" 안 뜸**.
즉 서버측 완전 정상. 사용자가 본 에러 = 배포 전/캐시된 옛 팝업. → **하드 리프레시 후 재클릭** 안내함.
그래도 나면 팝업 URL/스샷 요청(캐시 아닌 다른 문제).

**🔴 IG 블로커 — 원인 확정(2026-07-03, 사용자 콘솔 스샷):** redirect URI 문자열은 **완벽히 일치**
(`https://openclaw.../api/connect/instagram/callback`, 끝슬래시X). 단 등록 **위치가 틀림** —
사용자가 **앱 설정 > 고급 설정 > "콜백 URL 승인"(=Facebook 로그인용 필드)** 에 넣음. 우리 흐름은
`instagram.com/oauth/authorize`(Instagram 전용 로그인)라 Meta가 **Instagram 전용 리디렉션 필드**를
대조 → 거긴 비어서 콜백단 튕김. **수정 위치 = 이용 사례 > Instagram > 맞춤설정 > 비즈니스 로그인 설정 >
OAuth 리디렉션 URI** 에 같은 값 추가. Meta 콘솔=사용자 수동(ADR-004, 자동조작 계정정지 이력).
사용자에게 "이용 사례 > Instagram" 화면 스샷 요청(정확한 칸 확인, 추측 금지). 코드 유지(path#1 Instagram
Login이 FB Page 불필요 → 셀프서브에 맞음, FB Login path로 안 바꿈).

**✅ 방식 확정(실측, 2026-07-03):** FB 로그인 전환 검토했으나 `1534059948198965`가 Facebook Login
client_id로는 `PLATFORM__INVALID_APP_ID`(그건 인스타 전용 앱ID). FB로 가면 다른 Meta App ID+시크릿+
연결된 FB페이지가 더 필요 → 현행 Instagram Login 방식이 최소마찰. 유지 확정.
**✅ 발행 경로 선반영(커밋 4438a3ca, 배포 success):** 테넌트 연결 토큰(Instagram Login)은
`graph.instagram.com`로 media/media_publish, 레거시 env는 `graph.facebook.com` 유지. callback이
meta.api 플래그 저장. → 연결 성공 즉시 발행 호환. Meta redirect 위치는 Meta 공식문서로 확정(아래).

**✅✅ redirect_uri 블로커 해결(2026-07-03, gstack 브라우저로 내가 직접 콘솔 설정):**
사용자 요청으로 gstack 헤디드 브라우저(사용자 real Chrome 세션=Meta 로그인됨)로 진입:
- 앱 "정성컴퍼니"(Meta App ID **1553503759757107**) → 이용 사례에 **Threads API + Instagram 메시지·콘텐츠
  관리** 둘 다 설정돼 있음 확인. Instagram 이용사례 = `INSTAGRAM_BUSINESS` 커스터마이즈.
- **Instagram 앱 ID = 1534059948198965** = 우리 IG_APP_ID와 일치 확인(같은 앱 소속).
- **섹션 4 "Instagram 비즈니스 로그인 설정" → 설정 모달 → "리디렉션 URL"** 칸에
  `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback` 입력 → 저장.
- Meta 자동생성 OAuth URL에 우리 redirect_uri 박혀 나옴 = 등록 확정.
- **E2E 검증**: 그 authorize URL로 이동 → `invalidRedirect=false`(에러 사라짐), 인스타 로그인 화면 도달.
  (스샷: scratchpad/meta_ig_*.png)
- 참고: "앱 설정>고급 설정>콜백 URL 승인"은 Facebook 로그인용이라 무관(그대로 둠).

**남은 것(계정 로그인 = 사용자 세션):**
1. OSMU 로그인(이 브라우저는 OSMU 미로그인) → IG 채널 Settings → **"Instagram 연결"** 클릭 →
   인스타 계정 로그인·동의 → 토큰 저장(meta.api=instagram_login) → "연결됨".
   그 후 내가 위키→생성→graph.instagram.com 실발행 풀 E2E.
2. **Supabase Email Confirm OFF**(지인 가입용): `https://supabase.com/dashboard/project/gvtsyyltgwqplrqegrxo/auth/providers`
   → Email → "Confirm email" OFF → Save.
3. (선택) **Threads/FB 켜기**: gh secret `THREADS_APP_ID/SECRET`·`FB_APP_ID/SECRET` **미설정 확인**
   (컨테이너 env MISSING 실측). Threads는 IG와 별개 앱 자격증명(developers.facebook.com Threads
   use-case). 값 주면 IG와 같은 코드 경로로 배선 + redirect URI `.../api/connect/{threads,facebook}/callback` 등록.
4. (보안) 채팅 노출된 IG App Secret·claude oat 토큰·인스타 비번 rotate 권장.

## 밤샘 오토런 결과 (2026-07-02)

**검증(직접 관찰):** DB 완비(pg_trgm·pgcrypto·osmu_service·7테이블), 운영자 API·워크스페이스 8개,
**IG 연결 auth-url 라이브 생성**(env 적재 확인), 가입 폼·pending 화면 동작, 번들에 IG 연결 버튼 존재.
**버그 발견→수정→배포(2088a456):** ①간헐 520 청크 실패→하이드레이션 전멸→버튼 무반응("구글 로그인
안 먹음" 앱측 원인) → 자동복구 스크립트 ②가입 딥링크 미적용 → mount 재동기화. 146 pass/8 skip·tsc0·build✓.
**차단됨(classifier, 사용자 승인 필요):** VM crontab·autoheal·auth.users 테스트계정 confirm.
**아침 4번 후 내가 즉시:** 위키 sync→콘텐츠 생성→IG 실발행 라이브 E2E + browse 스크린샷 → `/approve qa` 증거 완성.

## 규율(불변)
- Meta 콘솔 **자동 운전 금지**(계정 플래그 사고, ADR-004). 콘솔은 사용자 수동.
- 배포는 pipeline qa 게이트 — **ship은 `/approve qa` 후만**. 고객 비번 수집·자동로그인 금지(ADR-004).
- 발행/브랜드/연결 구조 변경 시 wiki 반영 + 이 파일 갱신 + E2E 선통과.

## 참조
- QA 증거: `docs/qa-tracker.md` · 단계: `pipeline-state.md` · 결정: `wiki/decisions/004-social-connect-oauth-not-passwords.md`
- 라이브: `openclaw.sj-onpremise-cloudflare-tunnel.cloud` · VM: `ssh marketing-vm` · 컴포즈: `/home/marketing/actions-runner-oc/_work/openclaw-auto/openclaw-auto`
- 상세 이력(장애 RCA·셀프서브 코어·OAuth 빌드·Meta 셋업 전체): `archive/session-2026-06.md`
