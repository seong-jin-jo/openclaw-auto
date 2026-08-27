# Plan — GA4·슬랙 중앙 성과 통합 (회장님 directive 명령②)

> 상태 갱신(2026-08-25): 구현 전 계획의 이력 문서다. 현재 저장소에는 GA 분석 코드와 Slack 설정·테스트·미리보기·전송 API 및 화면이 존재한다. 기능의 기본 제품 노출 여부는 [vision.md](./vision.md)의 Awareness 범위 결정이 우선한다. 후속 변경은 Stage Controller 게이트로 진행한다.

> 출처: brain `business/decision-2026-06-4사업-OUTPUT-집중` 명령② + 사용자 상품화 논의(2026-06-26).
> 원래 상태: 설계 계획. 현재 구현 상태는 위 갱신 문단을 따른다.

> 2026-07-29 보안 경계: 현재 `ga-config`/`ga-analytics`와 Slack report 설정·preview·custom
> send는 global 운영자 자산이다. customer UI에서는 이 컨트롤과 API 호출을 숨겼으며 customer
> proxy allowlist도 넓히지 않았다. 고객용 GA4/Slack 리포팅은 아래 Phase 2의 per-tenant 저장소와
> credential 계약이 구현된 뒤 다시 노출한다.

## One Thing
4앱(ZERO-ONE·D-EDU·CUPID·JOGON) 마케팅 성과를 **한 곳에서** 본다 + 주간 슬랙 알림.
directive 하이브리드 결정 준수: **수집 태그(gtag)는 각 앱이 분산**, **분석·리포팅·슬랙은 MARKETING 중앙**.

## 이미 있는 자산 (바닥부터 아님 — 확장)
- `api/ga-analytics` — **GA4 Data API(`analyticsdata.googleapis.com/v1beta/.../runReport`)를 서비스계정으로 이미 호출**. 단 **단일 property**(`data/ga-config.json`의 propertyId 1개, 파일 기반).
- `api/ga-config` — propertyId 저장(단일). `lib/gsc-auth.ts` — `getGoogleAccessToken(serviceAccount, scope)`.
- 슬랙 풀스택 — `slack-config`/`slack-template`/`slack-report-preview`/`slack-send-custom`/`slack-test` + `weekly-report`/`weekly-summary` + `lib/send-notification`. **단 weekly-report는 GA4 숫자 미연결.**
- 멀티테넌트 인프라 — `withTenant`(RLS), `getChannelCred`(테넌트별 credential) 패턴 확립.

## 핵심 분기 (상품화 관점)
같은 GA4 Data API + property-credential 아키텍처가 두 청중을 다 커버한다:
1. **내부 4앱 중앙 뷰(운영자)** — directive ②. SJ가 4 property를 한 화면에서 비교.
2. **고객별 성과(SaaS 상품화)** — 테넌트가 자기 GA4 property를 연결해 자기 성과를 봄.

→ **둘은 다른 제품이 아니라 같은 멀티테넌트 GA4 연결의 두 뷰.** 내부 4앱 = 운영자가 4 테넌트를
가로질러 보는 특수 케이스. 멀티테넌트로 짓고 운영자 크로스-테넌트 뷰를 얹으면 한 번에 둘 다.

## 단계 계획

### Phase 1 — 내부 4앱 중앙 리포팅 (6월, 빠른 OUTPUT)
SJ가 4 property를 다 소유 → **OAuth 불필요, 서비스계정 + property ID 4개**가 최단 경로.
1. `ga-config` 단일 → **멀티 property**(앱별 `{key,label,propertyId}` 배열). 서비스계정에 4 property
   viewer 권한 부여(운영자 액션, GA4 콘솔).
2. **중앙 비교 대시보드** — 4앱 핵심지표(users/sessions/conversions/유입소스)를 `ga-analytics` 확장으로
   property별 병렬 조회 → 한 화면 비교 카드/표.
3. **주간 슬랙 리포트에 GA4 연결** — 기존 `weekly-report`가 4앱 GA4 요약을 슬랙으로(이미 슬랙 발송
   인프라 있음 → 콘텐츠만 추가).
- 산출 검증: GA4 Data API 응답 mock E2E(`tests/`) + 배포 browse + 실제 슬랙 발송 1회.

### Phase 2 — 테넌트별 GA4 연결 (상품화)
1. property 설정을 파일 단일 → **DB per-tenant**(channel credential과 동형, `withTenant`). 고객이 자기
   GA4 property ID + 서비스계정 grant(또는 OAuth) 연결.
2. 테넌트별 성과 대시보드 + **테넌트별 슬랙 알림**(이미 slack-config가 테넌트 스코프면 재사용).
3. 운영자 크로스-테넌트 뷰 = Phase 1 중앙 뷰를 "전 테넌트" 모드로(= publish-due 운영자 스윕과 동형).

알림 전송 성공은 provider 응답 계약으로 fail-closed 판정한다. Telegram은 HTTP 2xx와 JSON
`ok: true`가 모두 필요하고 Discord/Slack/LINE은 HTTP 2xx가 필요하다. Slack test/custom send도
non-2xx를 성공으로 응답하지 않는다.

## 선행 조건 (directive 공통 — 각 앱이 함)
**gtag 수집 태그를 4앱이 각자 자기 웹에 심어야 GA4에 데이터가 쌓인다.** 이 대시보드 앱도 포함.
태그 없으면 Data API가 읽을 게 없음 → Phase 1 전에/동시에 4앱 태깅 확인.

## 다음 세션 착수 순서
1. gstack `/office-hours`→`/plan-eng-review`→`/autoplan`로 Phase 1 설계 확정(벤치마킹 포함).
2. ga-config 멀티 property + 중앙 대시보드 + weekly-report GA4 연결 구현(E2E 선통과).
3. wiki(이 문서 + `architecture/data-model` GA4 스키마) 갱신, session-state 기록.

## Open Q
- 서비스계정 1개로 4 property 다 grant vs 앱별 분리? (운영 단순성 vs 격리)
- Phase 2 고객 연결 = OAuth(친절) vs 서비스계정 grant(단순)? — SaaS 친절성 vs 구현 속도.
- gtag 수집을 각 앱이 6월 내 다 심었는지 4앱 STATE 크로스체크 필요.
