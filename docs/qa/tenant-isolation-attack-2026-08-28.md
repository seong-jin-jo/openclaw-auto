# 작업 공간 간 테넌트 격리 공격 결과

한 줄 결론: 실제 임시 작업 공간 A와 B에 구분 데이터를 넣고 `localhost:3456`을 183회
공격했다. B 데이터 누출과 변경은 0건이었다. 제품 소스의 격리 결함은 발견되지 않았고,
전체 읽기 경로와 DB RLS CRUD를 고정하는 회귀 테스트를 추가했다.

## 범위와 판정 기준

- 작업 공간: 실제 Postgres에 A와 B를 생성하고 각자 고객 토큰과 구분 데이터를 발급했다.
- 데이터: DB 14종과 테넌트 파일·설정에 서로 다른 표식을 넣었다.
- 누출 판정: A 토큰 요청에 B 표식이 한 글자라도 나오면 실패다.
- 변경 판정: 공격 뒤 B의 DB 원값과 파일·설정 전체 해시가 같아야 한다.
- 인증 판정: 무토큰과 폐기된 고객 토큰은 HTTP 401이어야 한다.
- 몸통 위조 판정: A 토큰과 `tenant_id=B` 몸통을 함께 보내도 쓰기는 A에만 생겨야 한다.

## 전체 읽기 경로 공격표

`A→B`는 A 토큰에 B 작업 공간 ID 또는 B 객체 ID를 넣은 실제 HTTP 상태다.
200이어도 응답은 A 범위 데이터뿐이었고 B 표식은 0건이었다. 무토큰과 폐기 토큰은
아래 54개 경로 전부 HTTP 401이었다.

| 시험 | 읽기 경로 | A→B HTTP | 무토큰 | 폐기 토큰 | 결과 |
|---|---|---:|---:|---:|---|
| READ-01 | `/api/activity` | 200 | 401 | 401 | 누출 0 |
| READ-02 | `/api/agent-logs` | 200 | 401 | 401 | 누출 0 |
| READ-03 | `/api/alerts` | 200 | 401 | 401 | 누출 0 |
| READ-04 | `/api/analytics` | 200 | 401 | 401 | 누출 0 |
| READ-05 | `/api/blog-guide` | 200 | 401 | 401 | 누출 0 |
| READ-06 | `/api/blog-keywords` | 200 | 401 | 401 | 누출 0 |
| READ-07 | `/api/blog-queue` | 200 | 401 | 401 | 누출 0 |
| READ-08 | `/api/blog-stats` | 200 | 401 | 401 | 누출 0 |
| READ-09 | `/api/brand/sync-repo` | 200 | 401 | 401 | 누출 0 |
| READ-10 | `/api/brand/sync-wiki` | 200 | 401 | 401 | 누출 0 |
| READ-11 | `/api/channel-config` | 200 | 401 | 401 | 누출 0 |
| READ-12 | `/api/channel-settings` | 200 | 401 | 401 | 누출 0 |
| READ-13 | `/api/channel-settings/threads` | 200 | 401 | 401 | 누출 0 |
| READ-14 | `/api/channels/{provider}/accounts` | 200 | 401 | 401 | 누출 0 |
| READ-15 | `/api/connect/threads` | 500 | 401 | 401 | 누출 0, OAuth 설정 없음 |
| READ-16 | `/api/connect/readiness` | 200 | 401 | 401 | 누출 0 |
| READ-17 | `/api/engagement?post_id={B}` | 404 | 401 | 401 | B 객체 숨김 |
| READ-18 | `/api/errors` | 200 | 401 | 401 | 누출 0 |
| READ-19 | `/api/growth` | 200 | 401 | 401 | 누출 0 |
| READ-20 | `/api/guide` | 200 | 401 | 401 | 누출 0 |
| READ-21 | `/api/guide/threads` | 200 | 401 | 401 | 누출 0 |
| READ-22 | `/api/images` | 200 | 401 | 401 | 누출 0 |
| READ-23 | `/api/integrations` | 200 | 401 | 401 | 누출 0 |
| READ-24 | `/api/isolation-proof` | 200 | 401 | 401 | `crossTenant=0` |
| READ-25 | `/api/keyword-bank` | 200 | 401 | 401 | 누출 0 |
| READ-26 | `/api/keywords` | 200 | 401 | 401 | 누출 0 |
| READ-27 | `/api/keywords/threads` | 200 | 401 | 401 | 누출 0 |
| READ-28 | `/api/me` | 200 | 401 | 401 | A 작업 공간만 반환 |
| READ-29 | `/api/metrics` | 200 | 401 | 401 | 누출 0 |
| READ-30 | `/api/notification-log` | 200 | 401 | 401 | 누출 0 |
| READ-31 | `/api/onboarding` | 200 | 401 | 401 | 누출 0 |
| READ-32 | `/api/overview` | 200 | 401 | 401 | 누출 0 |
| READ-33 | `/api/popular` | 200 | 401 | 401 | 누출 0 |
| READ-34 | `/api/product-source` | 200 | 401 | 401 | 누출 0 |
| READ-35 | `/api/publish?draft_id={B}` | 200 | 401 | 401 | B 결과 0 |
| READ-36 | `/api/queue` | 200 | 401 | 401 | 누출 0 |
| READ-37 | `/api/schedule` | 200 | 401 | 401 | 누출 0 |
| READ-38 | `/api/settings` | 200 | 401 | 401 | 누출 0 |
| READ-39 | `/api/sourcing/import-to-queue` | 200 | 401 | 401 | 누출 0 |
| READ-40 | `/api/sourcing` | 200 | 401 | 401 | 누출 0 |
| READ-41 | `/api/studio/brand-setup` | 200 | 401 | 401 | 누출 0 |
| READ-42 | `/api/studio/drafts` | 200 | 401 | 401 | 누출 0 |
| READ-43 | `/api/studio/engine-status` | 200 | 401 | 401 | 누출 0 |
| READ-44 | `/api/suggestions` | 200 | 401 | 401 | 누출 0 |
| READ-45 | `/api/threads-username` | 200 | 401 | 401 | 누출 0 |
| READ-46 | `/api/tiktok/creator-info` | 404 | 401 | 401 | B 객체 숨김 |
| READ-47 | `/api/tiktok/publish-status?post_id={B}` | 403 | 401 | 401 | 프록시에서 차단 |
| READ-48 | `/api/trend-report` | 200 | 401 | 401 | 누출 0 |
| READ-49 | `/api/usage` | 200 | 401 | 401 | 누출 0 |
| READ-50 | `/api/video/list` | 200 | 401 | 401 | 누출 0 |
| READ-51 | `/api/voice-tone` | 200 | 401 | 401 | 누출 0 |
| READ-52 | `/api/weekly-report` | 200 | 401 | 401 | 누출 0 |
| READ-53 | `/api/weekly-summary` | 200 | 401 | 401 | 누출 0 |
| READ-54 | `/api/youtube/status` | 200 | 401 | 401 | 누출 0 |

## 변경·삭제·몸통 위조 공격표

| 시험 | 공격 대상 | HTTP | 사후 결과 |
|---|---|---:|---|
| WRITE-01 | B 큐 수정 | 404 | B 원문 유지 |
| WRITE-02 | B 큐 승인 | 404 | B 상태 유지 |
| WRITE-03 | B 큐 검토 요청 | 403 | 프록시에서 차단, B 유지 |
| WRITE-04 | B 큐 삭제 | 404 | B 행·파일 유지 |
| WRITE-05 | B 블로그 수정 | 404 | B 원문 유지 |
| WRITE-06 | B 블로그 삭제 | 404 | B 파일 유지 |
| WRITE-07 | B 채널 기본계정 전환 | 404 | B 기본계정 유지 |
| WRITE-08 | B 채널 삭제 | 404 | B 계정 유지 |
| WRITE-09 | B 편집실 수정 | 404 | B 초안 유지 |
| WRITE-10 | B 편집실 큐 인계 | 404 | B 초안·큐 유지 |
| WRITE-11 | B 댓글 상태 수정 | 404 | B 댓글 상태 유지 |
| WRITE-12 | B 이미지 삭제 | 404 | B 파일 유지 |
| BODY-01 | A 토큰과 `tenant_id=B`로 guide 저장 | 200 | A에만 저장, B 해시 불변 |
| BODY-02 | A 토큰과 `tenant_id=B`로 integration 저장 | 200 | A 1건, B 0건 |
| BODY-03 | A 토큰과 `tenant_id=B`로 schedule 저장 | 200 | A 1건, B 0건 |

## 인증과 RLS 증거

| 시험 | 관찰 | 판정 |
|---|---|---|
| 정상 A | A 토큰으로 A 초안 HTTP 200, A 표식 확인 | 정상 경로 통과 |
| 정상 B | B 토큰으로 B 초안 HTTP 200, B 표식 확인 | B 데이터가 실제 존재함을 확인 |
| 무토큰 | 읽기 54개 모두 HTTP 401 | 차단 |
| 폐기 토큰 | 읽기 54개 모두 HTTP 401 | 차단 |
| 과거 `exp` JWT | `/api/me` HTTP 503 | Supabase 검증기 미구성에서도 fail-closed. 정상적인 만료 JWT 401 분류는 미검증 |
| RLS 정책 | 테넌트 테이블 19개 모두 ENABLE, FORCE, `tenant_iso` USING·WITH CHECK 확인 | 통과 |
| RLS CRUD | A 문맥 자기 삽입·조회 통과, B 조회·수정·삭제 0행, B 명의 삽입 거절 | 통과 |
| 공격 뒤 B DB | 초안·큐·계정·예약·댓글 원값 유지 | 변경 0 |
| 공격 뒤 B 파일 | 데이터 디렉터리와 설정 디렉터리 SHA-256 동일 | 변경 0 |

## 추가한 회귀 안전망

- `dashboard/scripts/verify-tenant-isolation-e2e.mjs`: 두 작업 공간 생성부터 183회 실앱 공격,
  사후 DB·파일 불변 확인, 테스트 데이터 회수까지 한 명령으로 재현한다.
- `dashboard/tests/isolation/tenant-api-attack-script.contract.test.ts`: `effectiveTenantId`를 쓰는
  모든 GET 경로가 공격 목록에 들어 있는지 자동 대조한다.
- `dashboard/tests/isolation/rls-crud-boundary.db.test.ts`: RLS 19개 정책과 A 정상 CRUD,
  B 교차 조회·수정·삭제·삽입 거절을 실제 Postgres에서 검증한다.
- `dashboard/tests/isolation/rls.isolation.test.ts`: 병렬 테스트가 만든 상대 작업 공간의 정상
  데이터까지 세던 기존 오탐을 제거하고, 공격 대상 소유자의 행만 교차 조회하도록 고정했다.

## 개발 단계 검증

| 검증 | 결과 |
|---|---|
| 실앱 공격 | `localhost:3456` 183건 통과, B 누출·변경 0건 |
| 전체 Vitest | 162파일, 1,258건 통과, 선택적 라이브 항목 6건 건너뜀 |
| TypeScript | `npx tsc --noEmit` 통과 |
| 디자인 토큰 | `design-lint.sh dashboard/src` 위반 0건 |
| 프로덕션 빌드 | 커밋 기준 격리 작업 디렉터리에서 최종 실행 뒤 기록 |

## 레드팀과 셀프심문

가장 강한 반론은 200 응답이 많다는 사실만 보고 격리가 뚫렸다고 오해하거나, 반대로 401만
보고 데이터가 애초에 없었다고 착각하는 것이다. 그래서 B 토큰으로 B 표식이 보이는 정상 경로를
먼저 증명한 뒤, 같은 경로를 A 토큰과 B ID로 다시 호출해 본문 표식과 사후 저장값을 대조했다.

이 결론이 틀렸다면 가장 그럴듯한 이유는 새 GET 라우트가 생긴 뒤 공격 목록이 갱신되지 않는
경우다. 계약 테스트가 소스의 모든 `effectiveTenantId` GET 라우트와 공격 목록을 대조하므로,
새 경로가 빠지면 `npm run test`가 실패한다. 다만 Supabase 검증기가 로컬에 구성되지 않아
정상 서명의 만료 JWT가 정확히 401로 분류되는 실경로는 아직 미검증이다.

STAMP | line: osmu-tenant-isolation | 생성: 2026-08-28 06:26 KST | model: gpt-5 | agent: code-builder | skill: 없음 | 고민: 응답 상태만 보지 않고 B 데이터가 실제 존재한 뒤에도 본문과 저장값이 그대로인지 증명했다.

SKILLS_USED: 없음. SKILLS_SKIPPED: 매칭되는 설치 코드 구현 스킬 없음. `dev.md`, `benchmarks.md` 품질 계약 적용.

SOURCES: `pipeline-state.osmu.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/product/사업좌표-OSMU와-ZERO-ONE.md` | `docs/audit/osmu-gap-recheck-2026-08-28.md` | `dashboard/src/lib/tenant-auth.ts` | `dashboard/db/schema.sql` | `dashboard/db/rls.sql` | `dashboard/tests/isolation/` | https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html | https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References

MODEL: gpt-5 / code-builder
