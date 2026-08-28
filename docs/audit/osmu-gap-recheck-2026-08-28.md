# 갭 감사 재확인 2026-08-28

한 줄 결론: 이전 재확인 문서가 남았다고 적은 댓글 다섯 항목은 현재 코드에 모두 구현돼 있다. 2026-08-29 build는 비율, 자막, 속도, 목소리, 배경, 음악 형식값의 서버 validation 부족 판정을 추가로 닫았다.

이 문서는 `docs/audit/osmu-v62-api-gap-audit-v1-gpt-codex.md`의 2026-08-28 현재 정정본이다. 원 감사의 당시 판정은 보존하되 새 작업 발주는 이 문서를 먼저 본다.

## 2026-08-29 이번 build에서 닫은 갭

원 감사와 직전 재확인의 `비율, 자막, 음악, 카드 등 형식별 서버 validation 완결`을 선택했다. 생성 결과를 편집하고 발행하기 직전의 기본 흐름에 붙어 있으며, 기존 코드는 편집값을 화면 로컬 상태에만 두어 잘못된 값도 서버가 거절할 수 없었다.

| 계약 | 구현 | 관찰 증거 |
|---|---|---|
| 승인 형식 단일 계약 | 영상 9:16·1:1·16:9, 카드 1:1·4:5, 자막 3단계, 속도 4단계, 목소리·배경·음악 허용 목록을 순수 도메인 계약으로 고정 | 정상·거절 단위 계약 통과 |
| 편집값 보존 | 편집실 선택값을 작업 공간 로컬 상태와 초안 payload에 저장하고 다시 불러옴 | 실제 작업 공간 초안 POST 200, GET 200, 카드 4:5 형식값 재조회 |
| 발행 전 차단 | Studio 발행 body에 `edit_format`을 넣고 `/api/publish`가 자격 조회와 provider 호출 전에 검증 | 잘못된 4:3 영상 비율을 localhost에서 HTTP 422 `INVALID_EDIT_FORMAT`으로 관찰 |
| 사전 검증 | `/api/content/validate`도 같은 계약을 사용 | 승인된 9:16, 1.25배 영상 형식을 localhost에서 HTTP 200, `valid:true`로 관찰 |
| 기존 흐름 보존 | 기존 생성, 편집 인계, 큐, 성과 제안 경로는 그대로 유지 | 기본 흐름 11/11, Studio v1 12/12 |

서버 계약이 받는 허용값은 승인 프로토타입 v63의 값과 일치한다. Next.js 공식 지침의 외부 시스템 전달 전 입력 검증 원칙을 적용했고, YouTube 공식 규격에서 세로·정사각·16:9 비율을 교차 확인했다. 실제 provider가 이 형식대로 영상이나 카드를 렌더하는지는 이번 범위에서 검증하지 않았다.

검증 결과는 전체 Vitest 193파일, 1,388건 통과와 조건부 1건 제외, `npx tsc --noEmit`, production build 174/174, design lint 위반 0이다. production build의 기존 NFT 추적 경고 1건은 유지됐다. 운영 배포와 실제 공개 채널 발행은 미검증이다.

STAMP | line: osmu-gapfill082903 | 생성: 2026-08-29 03:27 KST | model: gpt-codex/gpt-5.6-sol | agent: code-builder | skill: 없음 | 고민: 편집 화면에만 있던 값을 새 API나 DB 없이 기존 초안과 발행 경계에 연결했다.

SKILLS_USED: 없음. 설치된 스킬 중 build 코드 구현에 직접 대응하는 스킬이 없다. SKILLS_SKIPPED: qa는 QA 단계의 브라우저 E2E 소유 스킬이라 사용하지 않았다.

SOURCES: `docs/audit/osmu-v62-api-gap-audit-v1-gpt-codex.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | https://nextjs.org/docs/app/guides/backend-for-frontend | https://support.google.com/youtube/answer/1722171?hl=en | https://support.google.com/youtube/answer/15424877?hl=en

MODEL: gpt-codex/gpt-5.6-sol / code-builder

## 두 감사 문서 대조 결과

이전 재확인 문서의 `아직 못 하는 것` 다섯 줄은 더 이상 개발 갭이 아니다.

| 이전 잔여 항목 | 현재 코드 근거 | 현재 판정 |
|---|---|---|
| 댓글과 반응의 본문 목록 | `GET /api/engagement`, `engagement_items` | 구현됨. 실 provider 읽기는 미검증 |
| 댓글 답글 초안 만들기 | `engagement-service.ts`, 성과실 댓글 행동 | 구현됨 |
| 답글 보내기 | engagement reply route와 경합 계약 | 구현됨. 실 provider 발송은 미검증 |
| 댓글 좋아요와 나중 처리 | like, defer 상태 전환과 DB 잠금 | 구현됨. 실 provider 좋아요는 미검증 |
| 댓글에서 편집실로 넘기기 | draft 생성과 `comment_id`, `draft_id` 인계 | 구현됨 |

따라서 댓글 저장 구조를 새로 만들지 않았다. 이미 승인된 migration과 서비스 위에 중복 구현하는 선택을 배제했다.

## 이번에 닫은 갭

원 감사의 발행실 항목 `inbox와 calendar에서 발행실로 복귀`를 선택했다. 생성, 편집, 발행, 성과의 기본 흐름 중 편집 결과를 검토하거나 예약한 뒤 다시 발행 상태로 돌아오는 연결이기 때문이다.

| 계약 | 구현 | 관찰 증거 |
|---|---|---|
| 검토 요청과 원 초안 연결 | Studio가 초안을 먼저 저장하고 queue에 `draftId`를 보존 | 정상 및 저장 실패 거절 계약 통과 |
| inbox 복귀 | 각 항목에 `발행실로 돌아가기` 링크와 source context 제공 | 실제 Chromium 클릭 후 발행실 도착 |
| calendar 복귀 | 선택 날짜의 각 항목에 같은 복귀 링크 제공 | 실제 Chromium 클릭 후 발행실 도착 |
| 발행 상태 복원 | 연결 초안의 플랫폼별 본문을 우선 사용하고, 본문 없는 편집 인계 초안은 queue 본문과 초안 메타데이터를 결합 | 실제 편집 인계 초안 제목과 `3곳에 올리기` 노출 |
| 잘못된 URL 거절 | queue 항목이 없거나 본문이 없으면 빈 작업물을 발행 가능 상태로 만들지 않음 | 거절 계약 통과 |

localhost 실요청에서 같은 queue 항목이 inbox와 calendar 각각에 대해 source, queue ID, draft ID, Studio 복귀 URL을 반환했다. Studio 복귀 페이지는 HTTP 200이었다. 미디어 없는 검증 항목으로 inbox와 calendar 링크를 실제 Chromium에서 눌렀고 브라우저 401과 콘솔 오류는 각각 0건이었다. 임시 queue와 고객 토큰은 검증 뒤 삭제했다.

## 아직 남은 감사 항목

이번 범위에서는 다음 원 감사 항목을 구현하지 않았다.

- 일곱 플랫폼을 아우르는 서버 측 발행 중지 계약
- 게시물별 성과 시계열 snapshot과 재현 가능한 30일 비교
- 학습 후보 수락 및 거절 이력
- 플랫폼별 실제 성과 수집 범위와 결측 이유의 단일 계약

현재 코드에 부분 구현이 있으므로 다음 작업 전에는 각 항목을 다시 실측해야 한다. 이 목록만 보고 새 스키마나 API를 만들면 안 된다.

## 검증

- `npm run test -- --maxWorkers=8 --minWorkers=1 --testTimeout=15000`: 187파일, 1,336건 통과, 조건부 6건 건너뜀
- `npx tsc --noEmit`: 통과
- `npm run build`: 정적 경로 174개 생성, exit 0. 기존 NFT 추적 경고 1건 유지
- 기본 흐름 E2E: 11/11
- Studio v1 E2E: 12/12
- UI 토큰 감사와 design lint: 위반 0건
- localhost Chromium: inbox 복귀, calendar 복귀, 401 0건, 콘솔 오류 0건

운영 배포, 실제 공개 채널 발행, 실 provider 댓글 행동은 미검증이다. 전체 v63 디자인 정합 NG와 단계 승인 보류도 유지한다.

STAMP | line: osmu-gapfill082823 | 생성: 2026-08-28 23:46 KST | model: gpt-5.6-sol | agent: code-builder | skill: pipeline | 고민: 이미 구현된 댓글 기능을 재창조하지 않고 기본 발행 흐름의 실제 단절을 선택했다.

SKILLS_USED: pipeline. build 허용 범위와 단계 gate 확인에 사용. SKILLS_SKIPPED: 설치 코드 구현 전용 매칭 스킬 없음.

SOURCES: `docs/audit/osmu-v62-api-gap-audit-v1-gpt-codex.md` | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/requests/회장-확정-요구사항-대장.md` | `wiki/2-product/build/사업좌표-OSMU와-ZERO-ONE.md` | `DESIGN.md` | https://support.buffer.com/en-us/articles/managing-and-approving-draft-posts-57li7M8tDA

MODEL: gpt-5.6-sol / code-builder
