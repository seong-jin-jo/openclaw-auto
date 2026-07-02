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

**남은 것(사용자만 가능):**
1. **Instagram redirect URI 등록 위치 수정** — developers.facebook.com → 앱 → Instagram → API setup
   with Instagram login → Business login settings → Valid OAuth Redirect URIs 에
   `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback`(끝슬래시X) → Save.
   그 후 재로그인 → "연결됨" → 내가 실발행 풀 E2E.
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
