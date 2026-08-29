# OSMU 읽기 API 전수 재실사 v3

한 줄 결론: 커밋 `783b97ce`의 `localhost:3456`에서 GET export 99개를 실제 호출했다. 정상 89개, 의도된 거절 10개, HTTP 500과 요청 실패는 각각 0개였다. 직전 v2 이후 읽기 경로 수와 상태 변화는 없었고, 변경된 `/api/metrics`는 HTTP 200과 coverage v1, 플랫폼 7건을 반환했다. 이번 읽기 API 범위는 PASS지만 전체 제품 QA의 기존 디자인 정합과 운영 실채널 검증 NG는 유지한다.

STAMP | line: osmu-api-read-sweep | 생성: 2026-08-29 09:15 KST | model: gpt-codex/gpt-5.6-sol | agent: qa-verifier | skill: qa | 고민: 같은 99개와 같은 상태 분포라도 직전 실행을 승계하지 않고 현재 dev 앱, 고객 토큰, 응답 본문, 전체 회귀를 다시 관찰했다.

## 기반과 실사 조건

- 기반: `docs/prototype/openclaw-auto-4room-v63.html`, `docs/requests/회장-확정-요구사항-대장.md`, `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`.
- 최초 비교 기준: `docs/audit/openclaw-api-live-sweep-2026-08-28.md`, 대상 커밋 `5283f7da`.
- 직전 비교 기준: `docs/audit/osmu-api-read-sweep-v2-gpt-codex.md`, 대상 커밋 `d5ac3d1c`.
- 현재 대상: `dashboard/src/app/api/**/route.ts`에서 GET을 export하는 모든 파일, 커밋 `783b97ce50d9ccba1f1b4f7ffe808f1be4c17ae7`.
- 실제 앱과 작업 공간: `http://localhost:3456`, `cd1d0a40-540d-4524-9b49-bf2445d82182`.
- 관찰 시각: 2026-08-29 09:05 KST.
- 인증: 운영자 토큰, Studio 개발 토큰, 실사 직전에 발급하고 직후 폐기한 고객 토큰을 경로 계약에 맞춰 사용했다. 토큰 원문은 기록하지 않았다. 폐기 HTTP 200과 활성 토큰 0건을 확인했다.
- 판정: 2xx와 3xx는 정상이다. 계약에 맞는 400, 404와 자격증명 미설정 503은 응답 본문을 확인해 의도된 거절로 분류했다. 500과 설명되지 않은 5xx는 고장이다.

## 최종 관찰

| 판정 | 건수 | 직접 관찰 |
|---|---:|---|
| 정상 | 89 | HTTP 2xx 또는 3xx |
| 의도된 거절 | 10 | 아래 경계 표의 400, 404, 503 |
| HTTP 500 | 0 | 전수 실사 결과 없음 |
| 요청 실패 | 0 | 타임아웃과 연결 실패 없음 |

| 경로 | 상태 | 판정 근거 |
|---|---:|---|
| `/api/connect/threads` | 503 | Threads OAuth 앱 자격증명 미설정. 연결 준비 불가를 서버 고장과 분리 |
| `/api/engagement` | 404 | 지정한 발행 글이 작업 공간에 없음 |
| `/api/figma-mcp/callback` | 400 | OAuth state 불일치 |
| `/api/higgsfield/asset/[file]` | 404 | 없는 파일 |
| `/api/images/deliver/[token]` | 404 | 없는 전달 토큰 |
| `/api/media/[token]` | 404 | 없는 미디어 토큰 |
| `/api/studio/v1/generations/[jobId]` | 404 | 없는 생성 작업 |
| `/api/studio/v1/shorts-factory/runs/[runId]` | 404 | 없는 숏폼 공장 실행 |
| `/api/tiktok/creator-info` | 404 | 연결된 TikTok 계정 없음 |
| `/api/tiktok/publish-status` | 404 | 고객 작업 공간에 지정한 발행 기록이 없음 |

전체 99개 경로와 상태는 직전 v2의 `## 99개 경로 상태` 표와 한 행도 다르지 않다. 이번 실행 결과를 해당 표와 경로명, 상태코드로 기계 대조한 결과 추가 0, 삭제 0, 상태 변화 0이다. 현재 목록은 `dashboard/scripts/verify-api-read-sweep.mjs`가 route 파일에서 매번 다시 만든다.

## 이전 실사와 변화

| 비교 항목 | 2026-08-28 문서 | 직전 v2 | 이번 v3 | 판단 |
|---|---:|---:|---:|---|
| 문서가 보고한 GET 수 | 84 | 99 | 99 | 8월 28일 문서는 당시 정적 GET 95개 중 11개를 누락 |
| 실제 정적 GET 수 | 95 | 99 | 99 | 8월 28일 이후 순증 4개, v2 이후 증감 0 |
| 정상 | 79 | 89 | 89 | v2 대비 상태 변화 0 |
| 의도된 거절 | 2로 보고 | 10 | 10 | v2 대비 상태 변화 0 |
| HTTP 500 | 수정 전 2 | 0 | 0 | 새 고장 없음 |
| 요청 실패 | 미기록 | 0 | 0 | 현재 완주 실행도 0 |

| v2 이후 코드 변화 | v2 | v3 | 판정 |
|---|---|---|---|
| GET route 파일 | `/api/metrics` 기존 `posts` 응답 | `/api/metrics`에 coverage v1 추가 | HTTP 200, `posts` 호환 유지, coverage 플랫폼 7건 |
| 경로 추가·삭제 | 없음 | 없음 | 추가 0, 삭제 0 |
| 상태코드 변화 | 없음 | 없음 | 99개 전부 동일 |

`/api/metrics`는 현재 응답 최상위 키 `coverage`, `posts`, coverage version `v1`, source `published_posts`, 플랫폼 7건을 반환했다. `posts`는 현재 작업 공간에서 0건이었다. 새 coverage 계약은 결과가 없음을 수집 미지원과 구분하지만, Threads 외 실제 provider 수집 성공을 증명하지는 않는다.

## 회귀 증거

| 검증 | 판정 | 직접 관찰 증거 |
|---|---|---|
| backend와 web test | PASS | `npm run test`, 198파일, 1,433건 통과, 조건부 1건 제외 |
| web typecheck | PASS | `npx tsc --noEmit` 종료 코드 0 |
| production build | PASS | `npm run build` 종료 코드 0, 정적 페이지 174/174. 기존 NFT 추적 경고 1건 유지 |
| mobile typecheck | 해당 없음 | 별도 mobile 앱 없음 |
| health curl | PASS | `/api/health` HTTP 200, DB `up` |
| seed와 주요 흐름 | PASS | 기본 흐름이 후보 생성, 초안, 편집, 발행 큐, 성과 제안 인계를 실제 작업 공간에 만들고 다시 읽음 |
| 주요 API curl | PASS | GET 99개 중 정상 89, 의도된 거절 10, HTTP 500과 요청 실패 0 |
| 기본 흐름 E2E | PASS | `verify-basic-flow-e2e.mjs` 11/11 |
| Studio v1 E2E | PASS | `verify-studio-v1-e2e.mjs` 12/12 |
| Playwright | PASS | 네 방 4개와 390, 768, 1024, 1440. 가로 넘침, 전체 화면 모달, 브라우저 401, 콘솔 오류 각각 0 |
| Maestro | 해당 없음 | 웹 전용 제품. 실패를 `optional:true`로 숨긴 실행 없음 |
| design lint | PASS | `design-lint.sh dashboard/src`, 디자인 토큰 위반 0 |
| 승인 프로토타입 정합 | NG 유지 | 이번 변경은 읽기 API 실사와 `/api/metrics` 응답 확인이다. 기존 전체 화면 정합 NG를 뒤집는 디자인 수정이나 재승인은 없음 |

첫 테스트 시도에서 `--pool=forks --maxWorkers=1` 조합이 Vitest 설정과 충돌해 테스트 0건인데 종료 코드 0을 냈다. 이 결과는 폐기했다. 옵션 없는 정본 명령 `npm run test`를 다시 실행해 198파일, 1,433건을 실제 통과시켰다. 첫 build 시도도 다른 세션의 build 잠금으로 실행되지 않아 폐기했고, 잠금 소유 프로세스 종료 후 다시 실행해 174/174를 확인했다.

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R128, R151, R165, R171, R175 | 기존 채널 연결 경로와 화면을 보존하고 채널 화면에서 연결 | API-READ-V3-01 | PASS | Threads 연결 준비 503, readiness와 채널 조회 200, HTTP 500 0 |
| R150 | 플랫폼별 지원 기능과 인증 경계를 실제 계약과 일치 | API-READ-V3-02 | PASS | 임시 고객 토큰으로 TikTok 경계 도달, 계정과 발행 기록 부재 404, 토큰 폐기 확인 |
| R207 | 성과실에서 통한 콘텐츠와 배울 정보를 제공 | API-READ-V3-03 | 범위 PASS | `/api/metrics` HTTP 200, coverage v1, source `published_posts`, 플랫폼 7건. 실제 외부 수집은 미검증 |
| R01~R207 | 회장 확정 요구 전건 | REQ-ALL | 이월 | 기존 전건 요구 추적표 유지. 이번 읽기 API 범위 밖 판정은 변경하지 않음 |

## 페르소나 결정

질문: 김민서가 읽기 경로에서 서버 고장과 연결 준비 전, 없는 자신의 자원을 구분할 수 있는가?

답: 이번 로컬 범위에서는 그렇다. GET 99개 중 설명되지 않은 서버 오류는 0건이다. Threads OAuth 앱 미설정은 503, 없는 고객 작업과 TikTok 기록은 404로 분리된다. 실제 연결 계정과 외부 provider 성공 응답은 이번 자격 조건에 없어 미검증이다.

## 레드팀과 셀프심문

레드팀 공격: 같은 스크립트와 같은 더미 매개변수로 99개를 반복하면 고객 인증 경계나 실제 데이터 모양이 깨져도 상태코드 분포만 같을 수 있다. 고객 토큰을 새로 발급해 tenant-aware 경로를 통과시키고, `/api/metrics`는 성공 본문의 키, version, source, 플랫폼 수까지 별도 확인했다. 토큰은 즉시 폐기했다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 GET 열거 누락, dev 앱과 HEAD 불일치, 또는 느린 외부 상태 경로의 일시 성공이다. 스크립트가 현재 route 파일에서 목록을 다시 만들었고 API route의 미커밋 diff는 0이다. 전체 실행의 요청 실패는 0이었지만 `/api/chat-channels`는 8.04초로 가장 느렸다. 15초 제한 안에 200이었으므로 고장으로 분류하지 않았고 지연 위험은 숨기지 않는다.

SKILLS_USED: qa. 실제 앱 요청, 정상과 거절 분류, 전체 회귀, Playwright, 증거 기록에 사용. / SKILLS_SKIPPED: 없음.

SOURCES: `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `docs/audit/openclaw-api-live-sweep-2026-08-28.md` | `docs/audit/osmu-api-read-sweep-v2-gpt-codex.md` | `docs/fdd/test-plan-r02-v1.0.0-opus.md` | `docs/plan/one-thing-v7.3.5.md` | `docs/plan/persona-v7.3.5.md` | https://nextjs.org/docs/app/getting-started/route-handlers | https://playwright.dev/docs/api-testing | https://www.rfc-editor.org/rfc/rfc9110.html

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
