# OSMU 테넌트 접속 기록 핸드오프

## 무엇을 어디까지 했나

- 핸드오프 기준: 회장이 지정한 `테넌트 로그인과 사용 기록을 남긴다` build 과제와
  `pipeline-state.osmu.md`의 승인 산출물 핀.
- 고객 신원을 확인하는 `ensureTenantForUser`에서 최대 15분에 한 번
  `tenants.last_accessed_at`과 `tenant_access_events`를 한 SQL 문장으로 기록한다.
- 접속 이력은 `tenant_id`, `accessed_at`만 저장한다. IP, 위치, 브라우저, 사용자 에이전트,
  지문은 저장하지 않는다.
- 기록 실패는 인증을 실패시키지 않는다. 운영자 계정 조치는 고객 접속 이력을 만들지 않는다.
- `/api/operator/customers`와 운영자 고객 화면에 마지막 접속과 최근 30일 접속 일수를 연결했다.
  이력이 없으면 `접속 기록 없음`으로 표시하고 0으로 대신하지 않는다.
- 추가 전용 migration, RLS 경계, 아키텍처, 구현현황, QA tracker를 갱신했다.
- 최종 로컬 커밋: `4d32a4c1 feat(tenant): 고객 접속 이력과 운영자 조회를 연결한다`.

## 남은 이슈와 블로커

- `git push origin feat/design-system-and-missing-features`는 실행 정책이 승인 필요 작업으로
  판정했으나 현재 세션은 승인을 요청할 수 없어 subprocess 시작 전에 차단됐다.
- 마지막 확인 원격 HEAD는 `d57796ba`다. push 대상인 현재 브랜치 HEAD에는 구현 커밋
  `4d32a4c1`과 이 핸드오프 기록 커밋이 모두 포함된다.
- 로컬 PostgreSQL이 없어 실제 DB를 붙이는 접속 경합 테스트 1건은 조건부 제외됐다.
- 운영 DB migration, 운영자 화면 브라우저 실측, 운영 배포는 실행하지 않았다.
- 공유 워크트리의 `dashboard/src/app/studio/page.tsx`, `session-state.osmu.md`,
  `wiki/ops/session-state.md`, `wiki/거버넌스/실수.md`, `.codex/logs/harness.jsonl` 변경은
  다른 작업 소유라 수정하거나 커밋하지 않았다.

## 다음에 칠 명령

1. push 권한이 있는 부모 컨트롤러가 `git push origin feat/design-system-and-missing-features`를
   실행하고 원격 HEAD가 현재 로컬 브랜치 HEAD와 같은지 확인한다.
2. PostgreSQL을 연결한 QA 환경에서
   `cd dashboard && npx vitest run tests/isolation/tenant-access.db.test.ts`를 실행한다.
3. migration 적용 뒤 운영자 고객 화면에서 기록 없는 고객의 `접속 기록 없음`, 로그인 고객의
   마지막 접속 시각, 최근 30일 접속 일수를 브라우저로 확인한다.

## 검증했나

- 깨끗한 최종 커밋 기준 `npx vitest run`: 214파일, 1,540건 통과, 실패 0,
  로컬 환경 조건부 38건 제외.
- `npx tsc --noEmit`: 종료 코드 0.
- `npm run build`: 정적 페이지 177/177, 종료 코드 0. 기존 Studio NFT 추적 경고 1건 유지.
- `bash ~/.claude/harness/bin/design-lint.sh src`: 디자인 토큰 위반 0.
- 집중 계약 테스트: 5파일, 78건 통과, PostgreSQL 조건부 1건 제외.
- 운영 DB와 운영 화면: 미검증.

STAMP | line: osmu-tenantlog0901 | 생성: 2026-09-01 05:04 KST | model: gpt-codex/gpt-5.6-sol | agent: code-builder | skill: 없음

SKILLS_USED: 없음 / SKILLS_SKIPPED: 직접 대응하는 build 스킬 없음

SOURCES: `pipeline-state.osmu.md` | `wiki/거버넌스/결정.md` ADR-004·ADR-006 | `wiki/거버넌스/실수.md` | `wiki/5-hubs/hub-eng/architecture/system-architecture.md` | `dashboard/db/schema.sql` | `DESIGN.md` | `docs/prototype/openclaw-auto-4room-v64.html`

MODEL: gpt-codex/gpt-5.6-sol / code-builder
