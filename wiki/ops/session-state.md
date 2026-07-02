# 세션 작업 상태 (재실행 가능한 핸드오프)

> 작업 하네스 규칙 #3. 30초 재개. 상세 이력: [archive/session-2026-06.md](archive/session-2026-06.md) (2026-07-02 롤오버).
> 단계 진실원: 루트 `pipeline-state.md`(현재 **qa**, ship은 `/approve qa` 후). QA 증거: `docs/qa-tracker.md`.

**최종 갱신:** 2026-07-02 새벽(밤샘 오토런) · `main` · 라이브 health 200.

## ☀️ 아침 체크리스트 (이것만 하면 마케팅 운영 시작)

1. **Supabase 콘솔 → Auth → "Confirm email" OFF** — 신규 가입이 메일 대기에 걸리는 것 실측됨. 지인 온보딩 마찰 #1.
2. **Meta 콘솔 → IG 로그인 설정 → 콜백 URL 등록**(1분):
   `https://openclaw.sj-onpremise-cloudflare-tunnel.cloud/api/connect/instagram/callback`
3. **콘텐츠 생성 엔진 켜기(1분, 둘 중 하나)** — 지금 생성 502(컨테이너 claude 미인증 실측):
   - (a) Mac 터미널에서 `claude setup-token` → 나온 토큰을 나한테(또는 VM env `CLAUDE_CODE_OAUTH_TOKEN`) → 내가 배선
   - (b) Anthropic API 키를 각 워크스페이스 Settings→AI Engine에 등록
4. **OSMU → Instagram 채널 → "Instagram 연결"**(테스터 계정: zero_to_one_ai 등) → 로그인·동의 → 토큰 자동. 성공하면 나한테 "연결됨" — 위키→생성→실발행 풀 E2E 바로 밟는다.
5. **VM 운영 배선 승인**(classifier 차단 — 2026-07-02 "고치고 보고" 지시로 재시도했으나 재차단, **명시적 "VM 배선 걸어" 필요**): autoheal 기동 + publish-due crontab. 한마디면 내가 실행:
   - `cd /home/marketing/actions-runner-oc/_work/openclaw-auto/openclaw-auto && docker compose -f docker-compose.postagi-4tenants.yml up -d autoheal`
   - crontab: `*/10 * * * * <래퍼>` (래퍼가 .env.osmu에서 토큰 로드 — 준비돼 있음)
6. (선택) **Threads/FB 연결 켜기**: Meta 콘솔의 Threads App ID/Secret (+FB) 주면 내가 gh secret+배포+콜백 안내.
7. (보안) 채팅에 노출됐던 **IG App Secret·인스타 비번 2개 rotate** 권장.

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
