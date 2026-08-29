# OSMU 운영 고객 인증·네 방 QA

<!--
STAMP
created_at: 2026-08-29 01:19 KST
updated_at: 2026-08-29 03:21 KST
model: gpt-codex/gpt-5.6-sol
agent: qa-verifier
skills: qa
evidence: 운영 Supabase Auth REST, 운영 /api/me, 운영 Studio 네 방 390·768·1440 브라우저 캡처, 운영 Studio generation API, 운영 Exhaustive 회귀
deliberation: 실제 고객 세션으로 정상 흐름뿐 아니라 만료, 상태보존, 중복 클릭, 연결 채널 0개 거절 경계를 확인하되 외부 게시와 유료 부작용은 만들지 않았다.
-->

## 2026-08-29 03:21 운영 Exhaustive 회귀 판정

수정 배포본의 고객 생성 201과 DB 멱등 수렴은 유지된다. 다만 실제 고객이 계속 쓰는 경계에서 High 2건, Medium 4건, Low 2건을 재현해 운영 Exhaustive 판정은 NG다.

| 범위 | 판정 | 직접 관찰 증거 |
|---|---|---|
| 세션 새로고침·복구 | 부분 PASS | 유효 세션 `/api/me` 200. 만료 세션은 고객 로그인 대신 `/operator`와 운영자 토큰 화면으로 이동 |
| 네 방 왕복·상태보존 | NG | 편집·발행 작업물은 유지. 생성실 목적·대상·권리 동의는 왕복과 새로고침 뒤 유실 |
| 생성 validation·중복 클릭 | NG | 빈 입력 거절은 PASS. 연타 시 generation POST 201 두 건, 단추 비활성화 없음 |
| 후보 재생성 | NG | A·B·C 선택만 있고 후보 전체 거절·무료 재생성 UI 0 |
| 편집 저장·복귀 | 부분 PASS | 카드뉴스 저장과 큐 인계 PASS. enabled `글` 단추는 눌러도 카드뉴스 선택 유지 |
| 채널 0개·부분선택·오류 | NG | 연결 0개인데 3개 기본 선택. 0개 선택 단추도 enabled. 미연결 Threads publish 400 뒤 안내 |
| 390·1440 | PASS | 네 방 8화면 가로 넘침 0 |
| 외부 SNS 게시·유료 부작용 | 미실행 | 연결 계정 0개, 외부 게시물 0, 유료 재생성 0 |

상세 재현 절차, 건강 점수 74/100, 25개 캡처는 `docs/qa/studio-prod-exhaustive-regression-v1-gpt-codex.md`에 있다. 제품 코드는 수정하지 않았다.

## 2026-08-29 수정 배포 재검증 판정

main `72afa863`의 운영 배포 run `33195231594`에서 이전 두 BLOCK은 해소됐다. 기존 QA 고객 계정으로 로그인, 후보 3개 생성, 중복 요청의 동일 작업 수렴, A안 선택, 편집실 인계, 발행실 준비까지 실제 운영에서 PASS다.

| 테스트 | 결과 | 직접 관찰 증거 |
|---|---|---|
| 배포 | PASS | GitHub Actions run `33195231594` success, head `72afa863df89226f1219387d06da427be09abb19` |
| 고객 인증 | PASS | 기존 QA 계정 password grant 200, `/api/me` 200, `isOperator=false`, active tenant |
| 생성 API | PASS | `POST /api/studio/v1/generations` HTTP 201, job `9262649a-3a25-4e89-b9e2-1740363c34fe`, 후보 A·B·C 3개 |
| 운영 멱등 | PASS | 같은 키 동시 POST 2건이 모두 201, 최초 포함 3응답이 같은 job ID와 후보 3개로 수렴 |
| 생성실 브라우저 | PASS | 입력·권리 확인 뒤 `A안 선택`, `B안 선택`, `C안 선택` 3개 직접 관찰, 콘솔 오류 0 |
| 편집실 인계 | PASS | A안 선택 뒤 `/studio?room=edit`, 실제 생성 주제 대사와 4개 구조 줄 직접 관찰, 콘솔 오류 0 |
| 발행 준비 | PASS | 인앱 이동으로 `/studio?room=publish`, `3곳에 올리기`와 플랫폼 미리보기 직접 관찰, 콘솔 오류 0 |
| 실채널 발행 | 미실행 | QA tenant 연결 계정 0개. 외부 계정 부작용을 만들지 않고 준비 화면까지만 판정 |

이 재검증은 이전의 고객 JWT와 Studio identity 단절, DB 멱등 경합 두 BLOCK을 닫는다. 실채널 발행과 전체 디자인 정합은 별도 미검증 범위다.

최신 캡처는 `create-fixed-main-1440.png`, `edit-handoff-fixed-main-1440.png`, `publish-ready-fixed-main-1440.png`다.

## 최초 판정, 수정 전 이력

운영 고객 로그인과 네 방 진입은 실제 세션으로 PASS다. 그러나 첫 콘텐츠 생성은 고객 JWT가 Studio 인증으로 연결되지 않아 UI에서 막히고 API도 HTTP 503을 반환한다. 따라서 운영 QA와 실채널 발행은 PASS가 아니다.

## 시험 계정과 안전 경계

- Supabase 프로젝트: `gvtsyyltgwqplrqegrxo`
- 테스트 사용자: `8bb3b816-be1e-44ab-a0cc-aebc9763b0d6`
- 테스트 테넌트: `e2429359-a6b7-4583-b3c3-98a7770397ec`
- 식별 prefix: `osmu-qa-20260829011231`
- 계정 상태: `active`
- 공유 AI 자격: 테스트 범위에서만 승인
- 채널 연결: 0개
- 비밀값: access token, refresh token, password는 저장소와 보고서에 기록하지 않았다.
- 임시 인증 파일: QA 종료 전에 `/tmp`의 request·response 7개를 삭제했고 존재하지 않음을 확인했다. 브라우저에는 재검증용 세션만 남겼다.
- 정리 계획: Studio 운영 인증 수정과 재검증이 끝날 때까지 계정을 유지한다. 종료 뒤 공유 AI 자격을 회수하고 테스트 테넌트와 Auth 사용자를 Supabase Admin 경로로 삭제한다. 고객 데이터나 기존 테넌트는 건드리지 않는다.

## 요청 추적

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R08 | 생성실·편집실·발행실·성과실 네 방을 실제 사용자 흐름으로 제공 | PROD-AUTH-ROOM-01 | PASS | 고객 JWT로 4개 방을 390·768·1440에서 열어 12개 화면 직접 관찰 |
| R168 | 가입자 학습 정보와 첫 생성 경로를 주 흐름에 둔다 | PROD-AUTH-GEN-01 | NG | 입력과 권리 확인 뒤 `후보 세 장 만들기`가 `Studio 인증이 비어 있습니다`로 종료 |
| R01~R207 | 확정 요구 전건 승계 | REQ-ALL | 이월 | 전건 판정은 `docs/qa/osmu-qa-2026-08-28.md` 정본 유지. 이번 범위는 운영 인증과 네 방 기본 흐름 |

## 직접 관찰 결과

| 테스트 | 결과 | 관찰 증거 |
|---|---|---|
| Auth 설정 | PASS | `/auth/v1/settings` HTTP 200, signup 활성, email 자동확인 활성 |
| 테스트 가입 | PASS | `/auth/v1/signup` HTTP 200, email confirmed, access session 발급 |
| 고객 테넌트 | PASS | `/api/me` HTTP 200, `isOperator=false`, tenant `active` |
| 성과실 | PASS | 운영 `/` 진입, 고객 workspace·빈 성과 상태 표시, 콘솔 오류 0 |
| 생성실 | 화면 PASS | 운영 `/studio?room=create` 진입, 주제·목적·대상·권리 입력 가능, 콘솔 오류 0 |
| 편집실 | 빈 상태 PASS | 운영 `/studio?room=edit` 진입, 편집 도구와 저장 비활성 경계 확인, 콘솔 오류 0 |
| 발행실 | 빈 상태 PASS | 운영 `/studio?room=publish` 진입, `발행할 작업물을 먼저 가져와 주세요` 확인, 콘솔 오류 0 |
| 반응형 | PASS | 네 방 390·768·1440에서 `scrollWidth == innerWidth`, 가로 넘침 0 |
| 첫 생성 | NG | UI가 API 호출 전에 `Studio 인증이 비어 있습니다` 표시 |
| Studio API | NG | 고객 JWT로 `POST /api/studio/v1/generations` 직접 호출, HTTP 503 `IDENTITY_ADAPTER_NOT_CONFIGURED` |
| 채널 연결 | 안전 차단 | `/api/channel-config` HTTP 200, 연결 계정 0개 |
| 실채널 발행 | 미실행 | 이 테스트 테넌트에는 연결 계정이 없고 생성 결과도 없어 외부 부작용을 만들지 않음 |

## 회귀 판정

인증·Studio 집중 테스트 4파일 45건과 TypeScript, design lint, production build 174경로는 통과했다. 전체 Vitest는 189파일 중 188파일이 통과했지만 Studio DB 경합 2건이 실패했다. 1,352건 PASS, 2건 FAIL, 4건 SKIP이다.

- `GEN-DB-01`: 같은 멱등 키 동시 생성이 한 응답으로 수렴하지 않고 `uq_studio_generation_idempotency_tenant_member_operation_key` 위반
- `GEN-DB-03`: 동시 무료 재생성 두 건 중 한 건만 fulfilled
- `GEN-DB-01` 단독 재실행도 다시 실패해 전체 suite 간섭만으로 설명되지 않는다.

DB에는 회원 전역과 작업 공간 포함 unique 제약이 동시에 있다. 저장소 INSERT는 회원 전역 conflict target 하나만 지정하므로 다른 unique 제약과 동시에 충돌한 경합을 잡지 못한다. 전체 회귀가 실패했으므로 QA PASS를 줄 수 없다.

## 원인

브라우저 로그인은 `dashboard_auth_token`에 Supabase 고객 JWT를 저장한다. 반면 생성실은 별도 `sessionStorage.studio_generation_token`과 `studio_skill_version_id`를 요구한다. 운영 고객 로그인은 이 값을 채우지 않는다. 서버의 `resolveDevelopmentPrincipal()`도 `NODE_ENV=production`이면 입력 토큰과 무관하게 `IDENTITY_ADAPTER_NOT_CONFIGURED`를 반환한다.

따라서 Google 자동화나 테스트 계정 문제가 아니다. 고객 인증 경계와 Studio 생성 인증 경계가 서로 연결되지 않은 제품 결함이다.

## 의미

운영 고객은 로그인해 네 방을 둘러볼 수 있지만 제품의 첫 가치인 콘텐츠 후보 생성을 시작할 수 없다. 화면 진입 PASS를 제품 QA PASS로 확대하면 안 된다. 이 결함이 수정되기 전에는 생성→편집→발행→성과의 운영 E2E와 실채널 발행을 검증할 수 없다.

## 캡처

- `docs/qa/osmu-prod-authenticated-qa-20260829/create-{390,768,1440}.png`
- `docs/qa/osmu-prod-authenticated-qa-20260829/edit-{390,768,1440}.png`
- `docs/qa/osmu-prod-authenticated-qa-20260829/publish-{390,768,1440}.png`
- `docs/qa/osmu-prod-authenticated-qa-20260829/performance-{390,768,1440}.png`
- `docs/qa/osmu-prod-authenticated-qa-20260829/create-after-generate-1440.png`

## 레드팀

까다로운 고객은 로그인 성공이나 네 방 노출이 아니라 첫 결과가 나오는지를 본다. 그래서 네 방 진입을 PASS로 남기되 생성 버튼과 API를 따로 공격했다. DB 경합 회귀도 함께 실행해 운영 핵심 흐름과 멱등 장부가 모두 출고 기준을 충족하지 못함을 확인했다.

## 셀프심문

이 결론이 틀렸다면 가장 그럴듯한 이유는 UI에만 토큰 주입이 빠지고 API는 고객 JWT를 받을 수 있는 경우다. 고객 JWT로 generation API를 직접 호출해 같은 503을 재현했으므로 UI만의 결함이 아니다.

SKILLS_USED: qa. 운영 고객 세션 성립, 실브라우저 3폭 네 방 관찰, 콘솔·네트워크·안전 경계 판정에 사용. SKILLS_SKIPPED: 없음.

SOURCES: `dashboard/src/components/studio/StudioRooms.tsx` | `dashboard/src/lib/studio/generation/client.ts` | `dashboard/src/lib/studio/generation/identity.ts` | `dashboard/src/lib/tenant-auth.ts` | `docs/requests/회장-확정-요구사항-대장.md` | https://supabase.com/docs/reference/javascript/auth-signup | https://supabase.com/docs/guides/auth/general-configuration | https://playwright.dev/docs/test-ui-mode

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
