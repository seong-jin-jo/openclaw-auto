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
- 관련: [[reference/brand-grounding]], ADR-003(pricing), `wiki/ops/session-state.md` Meta 셋업.
