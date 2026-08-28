# OSMU 읽기 API 전수 실사 v1

한 줄 결론: `localhost:3456`의 GET export 99개를 모두 실제 호출해 HTTP 500을 0건으로 만들었고, OAuth 구성 부재 오분류와 고객 TikTok 상태 조회 불가를 수정했다. 이 실사 범위는 PASS지만 전체 제품 QA는 운영 고객 Studio 생성과 승인 시안 정합 NG 때문에 PASS가 아니다.

STAMP | line: osmu-api-read-sweep | 생성: 2026-08-29 01:36 KST | model: gpt-codex/gpt-5.6-sol | agent: qa-verifier | skill: qa | 고민: 상태코드만 낮추지 않고 실제 고객 토큰이 핸들러의 작업 공간 경계까지 도달하는지 분리 검증했다.

## 기반과 방법

- 기반: `docs/prototype/openclaw-auto-4room-v63.html`, `docs/requests/회장-확정-요구사항-대장.md`, `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`.
- 이전 실사: `docs/audit/openclaw-api-live-sweep-2026-08-28.md`, 당시 대상 커밋 `5283f7da`.
- 대상: `dashboard/src/app/api/**/route.ts`에서 `GET`을 export하는 모든 파일. 새 스크립트가 파일 목록을 매번 다시 만들기 때문에 수동 목록 누락을 허용하지 않는다.
- 실제 앱: `http://localhost:3456`, 작업 공간 `cd1d0a40-540d-4524-9b49-bf2445d82182`, 관찰 시각 2026-08-29 01:22 KST.
- 인증: 운영자 토큰, Studio 개발 토큰, 실사 직전에 발급하고 직후 폐기한 작업 공간 고객 토큰을 경로 계약에 맞춰 사용했다. 토큰 원문은 결과에 기록하지 않았다.
- 판정: 2xx와 3xx는 정상, 계약에 맞는 4xx와 구성 미완료 503은 의도된 거절, 500과 그 밖의 설명되지 않은 5xx는 고장으로 분류했다.
- 벤치마크 적용: Next.js 공식 Route Handler 계약에 맞춰 실제 Web Response 상태를 관찰했고, RFC 9110의 서버 오류 의미에 따라 일시적 구성 불가를 500이 아닌 503으로 분리했다.

## 최종 관찰

| 판정 | 건수 | 직접 관찰 |
|---|---:|---|
| 정상 | 89 | HTTP 2xx 또는 3xx |
| 의도된 거절 | 10 | 아래 경계 표의 400, 404, 503 |
| HTTP 500 | 0 | 전수 실사 결과 없음 |
| 요청 실패 | 0 | 타임아웃과 연결 실패 없음 |

| 경로 | 상태 | 판정 근거 |
|---|---:|---|
| `/api/connect/threads` | 503 | Threads OAuth 앱 자격증명 미설정. 서버 로직 고장이 아니라 연결 준비 불가 |
| `/api/engagement` | 404 | 지정한 발행 글이 작업 공간에 없음 |
| `/api/figma-mcp/callback` | 400 | OAuth state 불일치 |
| `/api/higgsfield/asset/[file]` | 404 | 없는 파일 |
| `/api/images/deliver/[token]` | 404 | 없는 전달 토큰 |
| `/api/media/[token]` | 404 | 없는 미디어 토큰 |
| `/api/studio/v1/generations/[jobId]` | 404 | 없는 생성 작업 |
| `/api/studio/v1/shorts-factory/runs/[runId]` | 404 | 없는 숏폼 공장 실행 |
| `/api/tiktok/creator-info` | 404 | 연결된 TikTok 계정 없음 |
| `/api/tiktok/publish-status` | 404 | 고객 토큰으로 작업 공간 경계를 통과했으나 지정한 발행 ID가 없음 |

## 발견과 수정

| 테스트번호 | 최초 관찰 | 근본 원인 | 수정 | 종료증거 |
|---|---|---|---|---|
| API-READ-20260829-01 | `/api/connect/threads` HTTP 500 | OAuth 앱 자격증명 부재를 예외와 같은 서버 고장으로 응답 | 구성 미완료를 HTTP 503으로 분리하고 Instagram, Threads, Facebook, LinkedIn, X 계약 테스트를 고정 | 실제 앱 HTTP 503, 전체 전수 실사 HTTP 500 0건, `social-connect.test.ts` 61/61 |
| API-READ-20260829-02 | 운영자 토큰 400, 고객 토큰 403 | 핸들러는 고객 tenant를 요구하지만 프록시는 `/api/tiktok/publish-status`를 운영자 전용으로 막아 성공 가능한 인증 조합이 없었음 | 경로를 고객 tenant-aware 목록에 추가하고 미들웨어 경계 테스트를 고정 | 고객 토큰으로 핸들러 도달 후 없는 발행 ID HTTP 404, 관련 테스트 75/75 |
| REG-FULL-20260829-01 | 전체 Vitest에서 Studio DB 2건 실패 | 구 제약과 신 제약을 동시에 유지하는 배포 호환 DB에서 저장소가 한 고유 제약만 충돌 대상으로 지정 | 두 장부 INSERT를 모든 고유 충돌에 안전한 `ON CONFLICT DO NOTHING`으로 보정하고 배포 호환 계약에 고정 | 집중 실제 DB 10/10, 이후 전체 `npm run test` exit 0 |

첫 결함은 같은 설정 부재를 `/api/connect/readiness`와 `/api/auth/google`이 준비 상태 또는 503으로 분리하는데 연결 시작 경로만 500을 내던 불일치였다. 두 번째 결함은 이전 실사가 400과 403을 모두 의도된 거절로 묶어 실제 고객 화면에서 호출 가능한 인증 조합이 없다는 사실을 놓친 것이다.

## 2026-08-28 실사 대비

| 비교 항목 | 2026-08-28 문서 | 2026-08-29 재실사 | 판단 |
|---|---:|---:|---|
| 문서가 보고한 GET 수 | 84 | 99 | 15 증가로 보이지만 이전 문서의 목록 자체가 11개 누락 |
| 당시 커밋의 정적 GET export 수 | 95 | 해당 없음 | `5283f7da`를 다시 세어 이전 문서의 모수 오차 확인 |
| 실제 코드 증가 | 95 | 99 | 순증 4개 |
| 정상 | 79 | 89 | 매개변수와 인증을 실제 계약에 맞춰 재호출 |
| HTTP 500 | 수정 전 2 | 수정 전 1, 수정 후 0 | 이번 신규 500은 OAuth 구성 부재 오분류 |
| 의도된 거절 | 2로 보고 | 10 | 없는 자원과 구성 불가를 경로별로 명시 |

| 새 읽기 경로 | 최종 상태 | 변화 |
|---|---:|---|
| `/api/engagement` | 404 | 없는 발행 글을 작업 공간 범위에서 거절 |
| `/api/operator/incidents` | 200 | 운영 장애 목록 조회 추가 |
| `/api/studio/v1/shorts-factory/runs` | 200 | 작업 공간의 실행 목록 조회 추가 |
| `/api/studio/v1/shorts-factory/runs/[runId]` | 404 | 없는 실행을 Studio 오류 계약으로 거절 |

경로 코드는 이전 실사 뒤 channel config, onboarding, publish, queue, schedule, Studio drafts와 generation 계열에서도 바뀌었다. 최종 실측에서 해당 GET들은 모두 2xx 또는 위 표의 설명 가능한 404였다.

## 회귀 증거

| 검증 | 판정 | 관찰 증거 |
|---|---|---|
| backend test | PASS | `npm run test` 190파일, 1,358건 통과, 조건부 3건 제외. 최초 Studio DB 실패를 재현하고 보정한 뒤 전체 재통과 |
| web build | PASS | `npm run build` exit 0, 정적 페이지 174/174. 기존 NFT 추적 경고 1건 유지 |
| web typecheck | PASS | `npx tsc --noEmit` exit 0 |
| mobile typecheck | 해당 없음 | 이 저장소에 별도 mobile 앱 없음 |
| health curl | PASS | `/api/health` HTTP 200, 본문 `ok:true`, DB `up` |
| seed | PASS | 기본 흐름이 실제 작업 공간에 생성 작업, 초안, 발행 큐, 성과 제안 인계를 만들고 다시 읽음 |
| 주요 API curl | PASS | GET 99개 중 정상 89, 의도된 거절 10, HTTP 500 0 |
| 기본 흐름 E2E | PASS | `verify-basic-flow-e2e.mjs` 11/11 |
| Studio v1 E2E | PASS | `verify-studio-v1-e2e.mjs` 12/12 |
| Playwright | PASS | 네 방 4개와 390, 768, 1024, 1440의 16화면. 가로 넘침 0, 콘솔 오류 0, 401 URL 0, 성과실에서 생성실 복귀 4/4 |
| Maestro | 해당 없음 | 웹 전용 제품 범위. 실패를 `optional:true`로 숨긴 실행 없음 |
| design lint | PASS | `design-lint.sh dashboard/src`, 디자인 토큰 위반 0 |
| 전체 디자인 정합 | NG 유지 | 이번 변경은 API와 프록시 경계뿐이다. 기존 `docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`의 승인 시안 정합 NG를 뒤집지 않음 |

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R128, R151, R165, R171, R175 | 기존 채널 연결 경로와 화면을 보존하고 채널 화면에서 연결 | API-READ-20260829-01 | PASS | 실제 Threads 연결 시작 경로가 구성 부재를 503으로 분리. 회귀 61/61 |
| R150 | 플랫폼별 지원 기능과 인증 경계를 실제 계약과 일치 | API-READ-20260829-02 | PASS | 고객 토큰으로 TikTok 상태 핸들러에 도달해 작업 공간 범위 404 관찰. 관련 회귀 75/75 |
| R01~R207 | 회장 확정 요구 전건 | REQ-ALL | 이월 | 전건 판정 정본 `docs/qa/osmu-qa-2026-08-28.md`를 승계. 이번 변경 범위 밖 요구의 판정을 바꾸지 않음 |

## 페르소나 결정

질문: 김민서가 채널 연결이 준비되지 않았거나 자신의 TikTok 발행 기록이 없을 때, 서버 고장이나 운영자 전용이라는 잘못된 답 대신 다음 행동을 구분할 수 있는가?

답: 이번 로컬 실사 범위에서는 그렇다. OAuth 앱 구성 부재는 503과 구체 원인으로, 없는 TikTok 발행 기록은 고객 작업 공간 안의 404로 분리됐다. 실제 연결된 TikTok 계정과 외부 provider의 성공 응답은 이번 자격 조건에 없어 미검증이다.

## 레드팀과 셀프심문

레드팀 공격: 500이 0건이어도 운영자 토큰으로만 두드렸다면 고객 경로가 막힌 사실을 숨길 수 있다. 이에 경로별 인증을 분리하고 임시 고객 토큰으로 TikTok 두 경로와 격리 경로를 다시 호출했으며, 토큰을 폐기한 뒤 결과를 확정했다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 정적 목록 누락이나 의미 없는 더미 매개변수가 거절을 만들었기 때문이다. 매 실행마다 GET export를 다시 열거하고, UUID와 작업 공간, provider, 고객 토큰을 실제 계약에 맞춘 뒤에도 남은 10건만 응답 본문으로 분류했다. 외부 계정 연결이 필요한 성공 경로는 미검증으로 남겼다.

SKILLS_USED: qa. 실제 앱 탐색, 경계 분류, 회귀 우선순위, 브라우저 관찰과 증거 기록에 사용. / SKILLS_SKIPPED: 없음.

SOURCES: `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `docs/audit/openclaw-api-live-sweep-2026-08-28.md` | `docs/fdd/test-plan-r02-v1.0.0-opus.md` | `docs/plan/one-thing-v7.3.5.md` | `docs/plan/persona-v7.3.5.md` | https://nextjs.org/docs/app/getting-started/route-handlers | https://www.rfc-editor.org/rfc/rfc9110.html#name-server-error-5xx

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
