# QA Tracker — openclaw-auto-osmu (pipeline qa 단계 증거)

> 2026-07-02 밤샘 라이브 QA(browse+curl, 직접 관찰). 형식: 증거 항목 → 결과 → 근거.

## requires_evidence 현황

| 증거 | 상태 | 근거 |
|---|---|---|
| prod-health-200 | ✅ | `GET /api/health` → `{ok:true,db:up}` 200 (반복 실측) |
| prod-demo-login-200 | 🟡 부분 | 운영자 `/api/me` 200 `{isOperator:true}` 실측. **고객 가입 로그인은 Supabase Email Confirm ON에 막힘**(가입→"이메일 확인" 대기 실측) → 아침 토글 후 재검 |
| e2e-happy | 🟢 대부분 | vitest 146 pass. 라이브: IG auth-url 생성 ✅, **콘텐츠 생성 라이브 성공 ✅**(CLAUDE_CODE_OAUTH_TOKEN 배선, 실제 한국어 콘텐츠). 남은 건 IG 연결 로그인(사용자)→실발행 |
| e2e-edge | ✅(유닛)/🟡(라이브) | 잘못된 키 400·미연결 분기·state누락 등 vitest. 라이브 Threads "미설정" 에러 일관 실측 |

## 라이브 실측 결과 (2026-07-02 밤)

**정상 동작 확인:**
- `/api/health` 200, DB up (pg_trgm·pgcrypto·osmu_service·핵심 7테이블 적용 확인 — psql 실측)
- 운영자 인증(`/api/me`), 워크스페이스 8개 존재(ZERO-ONE·D-Edu·Romeo 등)
- **IG OAuth 연결 auth-url 라이브 생성** — 실제 instagram.com OAuth URL + client_id + callback (컨테이너 env IG_APP_ID/SECRET 적재 실측)
- 가입 폼 동작(중복 가드·이메일 검증·pending 안내 화면), 대시보드 번들에 "Instagram 연결" 버튼 문자열 존재

**발견 → 수정한 버그(2088a456 배포):**
1. **간헐 Cloudflare 520 → /_next 청크 로드 실패 → 하이드레이션 전멸 → 전체 버튼 무반응** (콘솔 520 실측; "구글 로그인 안 먹음"의 앱측 원인) → layout에 청크 에러 자동복구 스크립트(15s 가드 1회 reload)
2. `/login?mode=signup`·`/signup` 딥링크 미적용(실측) → mount 후 URL 재동기화

**막힌 것(사용자/설정 필요 — 아침 체크리스트):**
1. **Supabase Email Confirm ON** → 신규 가입이 메일 확인 대기에 걸림(실측). 콘솔 토글 필요
2. **생성 502** — 컨테이너 claude CLI 미인증(호스트 `~/.claude` 빈 폴더 실측) + Anthropic 키 미보유. `claude setup-token` 값 또는 API 키 필요
3. **Meta redirect URI 미등록** — IG auth-url은 나오지만 Meta가 callback 거부할 상태
4. VM crontab(publish-due)·autoheal 기동 — classifier가 프로덕션 시스템 변경 차단 → 사용자 승인/실행 필요
5. Threads/FB 연결 — `THREADS/FB_APP_ID/SECRET` 시크릿 미제공

## 판정
qa = **in-progress** (ship 게이트 잠김 유지). 아침 체크리스트 1~3 처리 후 고객 가입→생성→IG 연결 라이브 재검 → `/approve qa`.
