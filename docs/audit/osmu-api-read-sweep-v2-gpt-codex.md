# OSMU 읽기 API 전수 재실사 v2

한 줄 결론: 커밋 `d5ac3d1c`의 `localhost:3456`에서 GET export 99개를 모두 실제 호출했다. 정상 89개, 의도된 거절 10개, HTTP 500과 요청 실패는 각각 0개였다. 이번 읽기 API 범위는 PASS지만 전체 제품 QA는 기존 디자인 정합과 운영 실채널 검증 NG 때문에 PASS가 아니다.

STAMP | line: osmu-api-read-sweep | 생성: 2026-08-29 05:30 KST | model: gpt-codex/gpt-5.6-sol | agent: qa-verifier | skill: qa | 고민: HTTP 500이 없다는 수치만 믿지 않고 고객 토큰, 동적 매개변수, 응답 본문을 함께 확인해 의도된 거절을 분리했다.

## 기반과 실사 조건

- 기반: `docs/prototype/openclaw-auto-4room-v63.html`, `docs/requests/회장-확정-요구사항-대장.md`, `wiki/product/사업좌표-OSMU와-ZERO-ONE.md`의 실제 정본인 `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md`.
- 이전 실사: `docs/audit/openclaw-api-live-sweep-2026-08-28.md`, 당시 대상 커밋 `5283f7da`.
- 직전 재실사: `docs/audit/osmu-api-read-sweep-v1-gpt-codex.md`, 당시 대상 커밋 `04f91170`.
- 현재 대상: `dashboard/src/app/api/**/route.ts`에서 GET을 export하는 모든 파일, 커밋 `d5ac3d1cc8500cccba37a46f7549d183b8b991ba`.
- 실제 앱과 작업 공간: `http://localhost:3456`, `cd1d0a40-540d-4524-9b49-bf2445d82182`.
- 관찰 시각: 2026-08-29 05:12 KST.
- 인증: 운영자 토큰, Studio 개발 토큰, 실사 직전에 발급하고 직후 폐기한 작업 공간 고객 토큰을 경로 계약에 맞춰 사용했다. 토큰 원문은 결과에 기록하지 않았다. 폐기 뒤 같은 표식의 활성 토큰 수 0을 DB에서 확인했다.
- 판정: 2xx와 3xx는 정상이다. 계약에 맞는 400, 404와 자격증명 미설정 503은 응답 본문을 확인한 뒤 의도된 거절로 확정했다. 500과 설명되지 않은 5xx는 고장이다.

## 최종 관찰

| 판정 | 건수 | 직접 관찰 |
|---|---:|---|
| 정상 | 89 | HTTP 2xx 또는 3xx |
| 의도된 거절 | 10 | 아래 경계 표의 400, 404, 503 |
| HTTP 500 | 0 | 전수 실사 결과 없음 |
| 요청 실패 | 0 | 타임아웃과 연결 실패 없음 |

첫 실행에서는 `/api/higgsfield/status`가 실사 클라이언트의 15초 제한을 넘겨 요청 실패 1건으로 기록됐다. 같은 앱을 35초 제한으로 즉시 재호출하자 4.38초에 HTTP 200을 반환했고, 임시 고객 토큰을 적용한 두 번째 전수 실행에서도 HTTP 200이었다. 최종 판정은 두 번째 완주 결과를 사용했다.

### 의도된 거절 10개

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
| `/api/tiktok/publish-status` | 404 | 고객 토큰으로 작업 공간 경계를 통과했으나 지정한 발행 기록이 없음 |

## 이전 실사와 변화

| 비교 항목 | 2026-08-28 문서 | 직전 v1 | 이번 v2 | 판단 |
|---|---:|---:|---:|---|
| 문서가 보고한 GET 수 | 84 | 99 | 99 | 8월 28일 문서는 당시 정적 GET 95개 중 11개를 누락했다 |
| 실제 정적 GET 수 | 95 | 99 | 99 | 8월 28일 이후 순증 4개, 직전 v1 이후 증감 없음 |
| 정상 | 79 | 89 | 89 | 직전 실사와 동일 |
| 의도된 거절 | 2로 보고 | 10 | 10 | 없는 자원과 구성 불가를 경로별로 고정 |
| HTTP 500 | 수정 전 2 | 수정 후 0 | 0 | 새 500 없음, 제품 코드 수정 불필요 |
| 요청 실패 | 미기록 | 0 | 0 | 최종 완주 실행 기준 |

8월 28일 이후 추가된 GET은 `/api/engagement` 404, `/api/operator/incidents` 200, `/api/studio/v1/shorts-factory/runs` 200, `/api/studio/v1/shorts-factory/runs/[runId]` 404다. 직전 v1 이후 경로 수와 최종 상태 분포는 바뀌지 않았다. 다만 `/api/studio/drafts` GET은 payload의 `editFormat`을 반환하도록 확장됐고 실제 HTTP 200이었다. `/api/studio/v1/generations/[jobId]`는 Studio principal 해석 경계를 사용하도록 바뀌었으며, 고객 토큰과 없는 UUID에서 HTTP 404를 반환했다.

실사 종료 뒤 다른 워커가 공유 작업 트리의 `/api/metrics` GET에 수집 커버리지를 추가했다. 이 미커밋 변경은 대상 커밋 `d5ac3d1c`에 포함되지 않지만 최신 dev 앱에서 즉시 재호출했다. HTTP 200, `posts` 배열, `coverage.version`, `coverage.source`, `coverage.platforms`, 오류 없음으로 관찰돼 전수 실사의 HTTP 500 0건 결론은 유지된다.

## 99개 경로 상태

| 경로 | 상태 | 판정 |
|---|---:|---|
| `/api/activity` | 200 | 정상 |
| `/api/agent-logs` | 200 | 정상 |
| `/api/ai-runtime` | 200 | 정상 |
| `/api/alerts` | 200 | 정상 |
| `/api/analytics` | 200 | 정상 |
| `/api/auth/google` | 200 | 정상 |
| `/api/blog-guide` | 200 | 정상 |
| `/api/blog-keywords` | 200 | 정상 |
| `/api/blog-queue` | 200 | 정상 |
| `/api/blog-stats` | 200 | 정상 |
| `/api/brand/sync-repo` | 200 | 정상 |
| `/api/brand/sync-wiki` | 200 | 정상 |
| `/api/card-slides/00000000` | 200 | 정상 |
| `/api/channel-config` | 200 | 정상 |
| `/api/channel-settings/threads` | 200 | 정상 |
| `/api/channel-settings` | 200 | 정상 |
| `/api/channels/threads/accounts` | 200 | 정상 |
| `/api/chat-channels` | 200 | 정상 |
| `/api/clipping-config` | 200 | 정상 |
| `/api/connect/threads/callback` | 200 | 정상 |
| `/api/connect/threads` | 503 | 의도된 거절 |
| `/api/connect/readiness` | 200 | 정상 |
| `/api/cron-runs` | 200 | 정상 |
| `/api/cron-status` | 200 | 정상 |
| `/api/design-tools` | 200 | 정상 |
| `/api/elevenlabs-config` | 200 | 정상 |
| `/api/elevenlabs-voices` | 200 | 정상 |
| `/api/engagement` | 404 | 의도된 거절 |
| `/api/errors` | 200 | 정상 |
| `/api/figma-mcp/callback` | 400 | 의도된 거절 |
| `/api/figma-mcp/start-oauth` | 200 | 정상 |
| `/api/ga-analytics` | 200 | 정상 |
| `/api/ga-config` | 200 | 정상 |
| `/api/growth` | 200 | 정상 |
| `/api/gsc-analytics` | 200 | 정상 |
| `/api/gsc-config` | 200 | 정상 |
| `/api/guide/threads` | 200 | 정상 |
| `/api/guide` | 200 | 정상 |
| `/api/health` | 200 | 정상 |
| `/api/higgsfield/asset/%EC%97%86%EB%8A%94-%ED%8C%8C%EC%9D%BC.png` | 404 | 의도된 거절 |
| `/api/higgsfield/status` | 200 | 정상 |
| `/api/higgsfield/transactions` | 200 | 정상 |
| `/api/images/deliver/%EC%97%86%EB%8A%94-%ED%86%A0%ED%81%B0` | 404 | 의도된 거절 |
| `/api/images` | 200 | 정상 |
| `/api/integrations` | 200 | 정상 |
| `/api/isolation-proof` | 200 | 정상 |
| `/api/keyword-bank` | 200 | 정상 |
| `/api/keywords/threads` | 200 | 정상 |
| `/api/keywords` | 200 | 정상 |
| `/api/kw-planner-config` | 200 | 정상 |
| `/api/llm-config` | 200 | 정상 |
| `/api/me` | 200 | 정상 |
| `/api/media/%EC%97%86%EB%8A%94-%ED%86%A0%ED%81%B0` | 404 | 의도된 거절 |
| `/api/metrics` | 200 | 정상 |
| `/api/naver-datalab-config` | 200 | 정상 |
| `/api/notification-log` | 200 | 정상 |
| `/api/notification-settings` | 200 | 정상 |
| `/api/nsa-data` | 200 | 정상 |
| `/api/onboarding` | 200 | 정상 |
| `/api/operator/customers` | 200 | 정상 |
| `/api/operator/incidents` | 200 | 정상 |
| `/api/operator/oauth-credentials` | 200 | 정상 |
| `/api/overview` | 200 | 정상 |
| `/api/popular` | 200 | 정상 |
| `/api/product-source` | 200 | 정상 |
| `/api/publish/first-comment-capabilities` | 200 | 정상 |
| `/api/publish` | 200 | 정상 |
| `/api/queue` | 200 | 정상 |
| `/api/r2-config` | 200 | 정상 |
| `/api/schedule` | 200 | 정상 |
| `/api/seo-settings` | 200 | 정상 |
| `/api/settings` | 200 | 정상 |
| `/api/slack-config` | 200 | 정상 |
| `/api/slack-report-preview` | 200 | 정상 |
| `/api/slack-template` | 200 | 정상 |
| `/api/sourcing/import-to-queue` | 200 | 정상 |
| `/api/sourcing` | 200 | 정상 |
| `/api/studio/brand-setup` | 200 | 정상 |
| `/api/studio/drafts` | 200 | 정상 |
| `/api/studio/engine-status` | 200 | 정상 |
| `/api/studio/v1/generations/00000000-0000-4000-8000-000000000000` | 404 | 의도된 거절 |
| `/api/studio/v1/shorts-factory/runs/00000000-0000-4000-8000-000000000000` | 404 | 의도된 거절 |
| `/api/studio/v1/shorts-factory/runs` | 200 | 정상 |
| `/api/suggestions` | 200 | 정상 |
| `/api/tenant-info` | 200 | 정상 |
| `/api/tenant-tokens` | 200 | 정상 |
| `/api/tenants` | 200 | 정상 |
| `/api/threads-username` | 200 | 정상 |
| `/api/tiktok/creator-info` | 404 | 의도된 거절 |
| `/api/tiktok/publish-status` | 404 | 의도된 거절 |
| `/api/token-status` | 200 | 정상 |
| `/api/trend-report` | 200 | 정상 |
| `/api/usage` | 200 | 정상 |
| `/api/video/list` | 200 | 정상 |
| `/api/voice-tone` | 200 | 정상 |
| `/api/weekly-report` | 200 | 정상 |
| `/api/weekly-summary` | 200 | 정상 |
| `/api/workspaces` | 200 | 정상 |
| `/api/youtube/status` | 200 | 정상 |

## 회귀 증거

| 검증 | 판정 | 관찰 증거 |
|---|---|---|
| backend test | PASS | 기본 병렬 실행은 시스템 부하 중 Studio DB 2건이 5초 제한으로 실패했다. 같은 파일 9/9 통과 뒤 단일 워커 전체 실행에서 194파일, 1,404건 통과, 조건부 1건 제외 |
| web build | PASS | 실제 작업 트리 `npm run build` 종료 코드 0, 정적 페이지 174/174. 기존 NFT 추적 경고 1건 유지 |
| web typecheck | PASS | `npx tsc --noEmit` 종료 코드 0 |
| mobile typecheck | 해당 없음 | 별도 mobile 앱 없음 |
| health curl | PASS | `/api/health` HTTP 200, 본문 `ok:true`, DB `up` |
| seed | PASS | 기본 흐름이 실제 작업 공간에 생성 작업, 초안, 발행 큐, 성과 제안 인계를 만들고 다시 읽음 |
| 주요 API curl | PASS | GET 99개 중 정상 89, 의도된 거절 10, HTTP 500과 요청 실패 0 |
| 기본 흐름 E2E | PASS | `verify-basic-flow-e2e.mjs` 11/11 |
| Studio v1 E2E | PASS | `verify-studio-v1-e2e.mjs` 12/12 |
| Playwright | PASS | 네 방 4개와 390, 768, 1024, 1440의 16화면. 가로 넘침 0, 콘솔 오류 0, 401 URL 0, 성과실에서 생성실 복귀 4/4 |
| Maestro | 해당 없음 | 웹 전용 범위. 실패를 `optional:true`로 숨긴 실행 없음 |
| design lint | PASS | `design-lint.sh dashboard/src`, 디자인 토큰 위반 0 |
| 승인 프로토타입 정합 | NG 유지 | v63을 기반으로 화면을 관찰했지만 기존 정합 NG를 뒤집는 디자인 수정이나 재승인은 이번 API 범위에 없음 |

기본 병렬 테스트의 두 실패는 `tests/studio/generation-db.integration.test.ts`의 `GEN-DB-01`, `GEN-DB-01B`가 각각 5초 제한에 걸린 것이다. 집중 재실행에서는 885ms와 410ms, 단일 워커 전체 회귀에서는 878ms와 525ms에 통과했다. 기능 실패로 재현되지 않았지만 병렬 부하 민감성은 남아 있다.

첫 격리 build 시도는 Turbopack이 작업공간 밖 `node_modules` 심볼릭 링크를 거부해 종료됐다. 같은 현재 작업 트리에서 심볼릭 링크 없이 실행한 정식 build는 컴파일, TypeScript, 정적 페이지 174/174를 통과했다. 첫 실패는 소스 결함이 아니라 검증 격리 방식 결함으로 분류했다.

## 요청 번호 승계

| 요청번호 | 요청 요지 | 테스트번호 | 판정 | 증거 |
|---|---|---|---|---|
| R128, R151, R165, R171, R175 | 기존 채널 연결 경로와 화면을 보존하고 채널 화면에서 연결 | API-READ-RERUN-01 | PASS | Threads 연결 준비 경계 503, readiness와 채널 조회 200, 새 HTTP 500 0 |
| R150 | 플랫폼별 지원 기능과 인증 경계를 실제 계약과 일치 | API-READ-RERUN-02 | PASS | 고객 토큰으로 TikTok 조회 경계 도달, 계정과 발행 기록 부재 404 |
| R132, R146, R147, R182 | Studio 편집 형식값을 저장하고 다시 읽기 | API-READ-RERUN-03 | PASS | `/api/studio/drafts` HTTP 200, `editFormat` 반환 구현 확인 |
| R01~R207 | 회장 확정 요구 전건 | REQ-ALL | 이월 | 전건 판정 정본을 유지. 이번 읽기 API 범위 밖 판정을 변경하지 않음 |

## 페르소나 결정

질문: 김민서가 연결 준비가 안 된 상태와 서버 고장을 구분하고, 자신의 작업 공간 읽기 경계를 통과할 수 있는가?

답: 이번 로컬 범위에서는 그렇다. Threads 앱 구성 부재는 503으로, 없는 고객 TikTok 기록과 Studio 작업은 404로 분리됐다. 실제 연결 계정과 외부 provider의 성공 응답은 이번 자격 조건에 없어 미검증이다.

## 레드팀과 셀프심문

레드팀 공격: HTTP 500이 0이어도 운영자 토큰만 사용하면 고객 경로가 프록시에서 막힌 사실을 숨길 수 있다. 실사 직전 작업 공간 고객 토큰을 발급해 tenant-aware 경로를 다시 호출하고, 전수 실행 뒤 토큰 폐기와 활성 수 0을 확인했다.

셀프심문: 이 결론이 틀렸다면 가장 그럴듯한 이유는 정적 목록 누락, 의미 없는 동적 매개변수, 느린 외부 상태 경로의 타임아웃이다. 매 실행마다 GET export를 다시 열거했고 UUID와 토큰을 경로 형태에 맞췄다. 첫 Higgsfield 타임아웃은 개별 재호출과 두 번째 전수 완주로 교차 확인했다. 외부 계정 성공 경로는 미검증으로 남겼다.

벤치마크 적용: Next.js 공식 Route Handler 지침에서 실제 HTTP 응답을 검증 단위로 삼았다. Playwright 공식 API testing 지침처럼 서버 전후 상태와 브라우저 네트워크를 함께 확인했다. RFC 9110의 상태 의미에 따라 설명 가능한 4xx와 일시적 구성 불가 503을 500과 구분했다.

SKILLS_USED: qa. 실제 앱 요청, 경계 분류, 회귀 우선순위, 브라우저 관찰과 증거 기록에 사용. / SKILLS_SKIPPED: 없음.

SOURCES: `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `docs/audit/openclaw-api-live-sweep-2026-08-28.md` | `docs/fdd/test-plan-r02-v1.0.0-opus.md` | `docs/plan/one-thing-v7.3.5.md` | `docs/plan/persona-v7.3.5.md` | https://nextjs.org/docs/app/guides/backend-for-frontend | https://playwright.dev/docs/api-testing | https://www.rfc-editor.org/rfc/rfc9110.html

MODEL: gpt-codex/gpt-5.6-sol / qa-verifier
