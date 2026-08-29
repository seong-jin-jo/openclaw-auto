<!--
STAMP
line: osmu
artifact: expand-contract-design-review
version: v1
created_at: 2026-08-29 01:25 KST
model: gpt-codex/gpt-5.6-sol
agent: eng-design-reviewer
skills: review
basis: docs/design-docs/osmu-generation-expand-contract-v1.0.1-gpt-codex.md, PRD v8.2.1, DESIGN.md v33, pipeline-state.osmu.md, current SQL/repository/tests/workflow
evidence_urls: https://www.postgresql.org/docs/16/sql-insert.html, https://www.postgresql.org/docs/16/transaction-iso.html, https://www.postgresql.org/docs/16/functions-admin.html, https://www.postgresql.org/docs/16/sql-createfunction.html, https://www.postgresql.org/docs/16/sql-createindex.html
deliberation: trigger/advisory-lock 알고리즘 자체보다 실제 배포기가 매번 과거 migration을 재실행하는 경로를 먼저 공격했다. 그 결과 문서의 E1 상태가 현재 workflow에서 성립하지 않음을 NO-GO 핵심으로 판정했다.
-->

# OSMU 생성 동시성 Expand and Contract 독립 설계 리뷰 v1

> 한 줄 결론: **⛔ RETAKE, NO-GO.** `SECURITY DEFINER BEFORE INSERT trigger + transaction advisory lock + targetless ON CONFLICT + tenant-RLS 재조회` 조합의 동시성 알고리즘은 성립할 수 있다. 그러나 현재 배포기가 먼저 재실행하는 구 migration이 tenant UNIQUE를 삭제하므로 문서의 E1 상태가 만들어지지 않는다. 권한 owner, timeout, 재실행 상태기계, 상류 요구 핀도 미확정이다. 이 문서를 그대로 code-builder에게 넘기면 구 앱 `42P10`, 무기한 lock wait, contract job 재실행 실패가 남는다.

## 목차

1. [판정](#1-판정)
2. [독립 루브릭](#2-독립-루브릭)
3. [구조와 규격](#3-구조와-규격)
4. [MAJOR findings](#4-major-findings)
5. [MINOR findings](#5-minor-findings)
6. [대안 비교](#6-대안-비교)
7. [요구와 테스트 추적성](#7-요구와-테스트-추적성)
8. [Rollback과 repeatability](#8-rollback과-repeatability)
9. [RETAKE 종료 조건](#9-retake-종료-조건)
10. [셀프심문과 레드팀](#10-셀프심문과-레드팀)

## 1. 판정

| 항목 | 판정 |
|---|---|
| 리뷰 대상 | 요청된 v1.0.0이 작업 중 v1.0.1로 교체되어 최신 `docs/design-docs/osmu-generation-expand-contract-v1.0.1-gpt-codex.md`를 리뷰 |
| 기술 타당성 | 핵심 알고리즘은 조건부 타당 |
| 배포 가능성 | **NO-GO** |
| MAJOR | 7 |
| MINOR | 4 |
| RUBRIC | **15/25, RETAKE** |
| 게이트 권고 | eng-design 승인 금지, tech-architect 재작성 뒤 독립 재리뷰 |

## 2. 독립 루브릭

| 축 | 점수 | 독립 판정 |
|---|---:|---|
| 완결성 | 3/5 | 범위, 세 상태, rollback, 테스트는 있다. 하지만 실제 E1을 결정하는 과거 migration, 구체 owner DDL, timeout, API 오류 JSON 계약이 빠졌다. |
| 정밀성 | 3/5 | lock, snapshot, RLS 재조회 논리는 구체적이다. 반면 ERD의 `member_id uuid`가 실제 `TEXT`와 다르고, pseudo SQL만 있어 보안·재실행 계약을 실행할 수 없다. |
| 벤치마크 반영 | 5/5 | PostgreSQL 16 공식문서 5종을 실제 계약에 연결했다. 2차 자료에 의존하지 않았다. |
| 추적성 | 1/5 | PRD 요구 ID가 RTM에 없고, 하루 무료 재생성 R27은 상류 대장에서 `확인 필요`다. 문서의 DESIGN v29 핀도 현행 v33 및 승인핀 v18과 불일치한다. |
| 전문성·톤 | 3/5 | 표준 용어와 위험 고지는 좋다. 그러나 `매핑 gap: 0`, `25/25`, `code-builder 입력 가능`이라는 자기판정이 실제 누락과 충돌한다. |
| **합계** | **15/25** | **20/25 미달이고 추적성 1점이므로 자동 RETAKE** |

## 3. 구조와 규격

| 검사 | 결과 | 근거 |
|---|---|---|
| 최상단 목차·앵커 | PASS | 대상 19~34행 |
| 아키텍처·ERD·sequence 3종 | 조건부 PASS | 71~120행, 200~220행. 문법상 구조는 갖췄으나 mmdc 렌더 증거가 STAMP에 없다. |
| PRD·FDD·QA 분할 | PASS | 대상은 FDD 단독 문서 |
| API 요청·응답 전량 계약 | FAIL | 새 503/retryable/500 behavior를 정의하면서 error JSON의 `code`, `message`, `retryable`, `details`를 확정하지 않았다. |
| DB 필드 타입 전량 | FAIL | 대상 99~119행은 `member_id uuid`로 쓰지만 실제 schema는 `TEXT`; `response_payload JSONB`, `created_at TIMESTAMPTZ`, PK와 FK 속성도 빠졌다. |
| Mermaid 실제 렌더 확인 | FAIL | 대상 STAMP와 푸터에 렌더 명령·결과가 없다. |

## 4. MAJOR findings

### MAJOR-01. E1 이전에 구 migration이 tenant UNIQUE를 삭제한다

**Confidence 10/10.** 대상은 E1에서 tenant UNIQUE를 유지하고 member UNIQUE를 추가하지 않는다고 썼다(349~355행). 동시에 기존 `schema.sql -> 모든 migrations -> app swap` 순서를 유지한다고 썼다(399~404행).

현재 workflow는 실제로 `schema.sql` 뒤 `/db/migrations/*.sql` 전부를 매번 실행한다(`.github/workflows/deploy-marketing.yml:87-93`). 그중 `20260828_010_studio_generation.sql`은 먼저 tenant UNIQUE를 DROP하고 member UNIQUE를 ADD한다.

```sql
ALTER TABLE studio_generation_idempotency
  DROP CONSTRAINT IF EXISTS studio_generation_idempotency_tenant_id_member_id_operation_key;
...
ADD CONSTRAINT uq_studio_generation_idempotency_member_operation_key
  UNIQUE (member_id, operation, idempotency_key);
```

quota도 같은 작업을 한다(`dashboard/db/migrations/20260828_010_studio_generation.sql:69-80`). 따라서 `20260829_010`만 E1로 고쳐도 그 전에 S1이 이미 깨진다. 구 앱의 tenant-target `ON CONFLICT`는 `42P10` 위험에 들어가고 rollback 표의 “tenant UNIQUE가 남아 있음”도 거짓이 된다.

**RETAKE:** `20260828_010`을 파일 책임과 transition matrix에 포함하라. 더 안전한 해법은 자동 wildcard replay를 폐기하고 적용 이력 또는 명시적 phase manifest로 E1만 실행하는 것이다. 최소 수정으로 갈 경우 `20260828_010`을 create-only·constraint-neutral로 바꾸고, fresh bootstrap과 existing upgrade를 별도 fixture로 검증해야 한다.

### MAJOR-02. advisory lock timeout이 실제로 존재하지 않는다

**Confidence 10/10.** 대상 264행은 “기존 statement timeout을 따른다”고 썼다. 실제 DB client는 `postgres(url, { max: 5, idle_timeout: 20 })`만 설정한다(`dashboard/src/lib/db.ts:16-22`). `idle_timeout`은 실행 중 statement timeout이 아니다. repo와 DB DDL 어디에도 `statement_timeout` 또는 `lock_timeout`이 없다.

winner transaction이 외부 이유로 지연되면 동일 member key의 모든 요청이 무기한 대기할 수 있다. 풀은 최대 5개라 적은 hot key로 API 전체 DB 풀이 고갈될 수 있다.

**RETAKE:** transaction 시작 직후 `SET LOCAL statement_timeout`과 필요한 경우 `lock_timeout`을 숫자로 확정하라. timeout SQLSTATE와 HTTP `503 retryable:true` 매핑, 풀 고갈 경계 테스트를 추가하라.

### MAJOR-03. SECURITY DEFINER owner가 설계의 미결사항인데 구현 GO를 선언했다

**Confidence 10/10.** 대상 231~237행은 RLS를 우회하는 NOLOGIN migration owner를 요구하지만, 563~565행에서 실제 역할명을 “E1 구현 차단” 미결사항으로 남겼다. 현재 배포는 `OSMU_DATABASE_URL`의 `current_user`로 DDL을 실행하고, `rls.sql`은 그 역할이 Supabase `postgres`이며 BYPASSRLS라고 명시한다(`dashboard/db/rls.sql:27-30`). 함수에 `ALTER FUNCTION ... OWNER TO <dedicated_nologin_role>` 계약이 없다.

현재 문서대로 구현하면 환경에 따라 두 실패 중 하나다.

- current_user가 login/BYPASSRLS이면 문서의 least-privilege owner 계약 위반
- owner가 FORCE RLS를 우회하지 못하면 cross-tenant EXISTS가 보이지 않아 S1 회원 전역 불변조건 실패

**RETAKE:** 역할 생성 권한, 정확한 role 이름, NOLOGIN·BYPASSRLS 또는 table ownership 전략, `ALTER FUNCTION OWNER`, PUBLIC/role privilege 검증 SQL을 확정하라. CI에서 owner 속성과 cross-tenant visibility를 검사하라.

### MAJOR-04. E3와 C1은 재실행 가능한 migration state machine이 아니다

**Confidence 9/10.** E3 SQL(374~381행)은 index 생성 성공 뒤 constraint attach 전에 job이 죽었을 때 재실행하면 index 이름 충돌로 실패한다. concurrent unique index build 실패 시 invalid index가 남아도 같은 문제가 난다. C1은 고정된 두 constraint 이름만 DROP한다(389~395행). 과거 auto-generated 이름이나 column-set으로 존재하는 constraint는 처리하지 못한다.

**RETAKE:** 각 객체를 `absent`, `invalid index`, `valid unattached index`, `attached constraint`, `unexpected definition`으로 판정하는 preflight state machine을 써라. unexpected definition은 중단한다. C1은 audit artifact에서 확인한 실제 constraint OID/정의를 pin하고 checksum을 검증해야 한다.

### MAJOR-05. 확정되지 않은 무료 quota 요구를 “확정 결정”으로 승격했다

**Confidence 10/10.** 대상 51~57행은 회원 단위 UTC 하루 1회 무료 재생성을 확정 결정으로 선언한다. 하지만 상류 PRD v8.2.1에는 일반 멱등성 NFR `retry20·concurrent20`만 있다(`docs/prd-openclaw-service-v8.2.1-gpt-codex.md:531-537`). 직접 관련된 R27은 요구사항 대장에서 `확인 필요`다(`docs/requests/회장-확정-요구사항-대장.md:444`).

현재 대화에서 회장이 기술 추천대로 진행하라고 승인했더라도, FDD는 그 raw chairman request 또는 결정 로그를 버전핀으로 보존해야 한다. 지금 문서만 신규 개발자에게 넘기면 회원 범위와 UTC 기준의 제품 근거를 찾을 수 없다.

**RETAKE:** 회장 승인 원문을 request provenance에 보존하고 requirement ID를 부여한 뒤 FDD RTM에 연결하라. PRD PATCH가 아니면 적어도 bug-remediation decision record를 정본으로 pin하라.

### MAJOR-06. 요구↔설계↔테스트 RTM이 아니다

**Confidence 10/10.** 대상 470~478행은 user-flow 문장과 endpoint/table/test를 연결하지만 PRD/NFR/회장 요구 ID가 없다. “세 스키마 concurrency matrix”는 테스트 ID나 파일도 아니다. 그럼에도 476행과 557행은 gap 0을 주장한다.

또한 STAMP는 DESIGN v29를 기반으로 적었지만 현재 DESIGN.md 정본은 v33이고(`DESIGN.md:6-10`), pipeline 승인 핀은 v18이며 design stage는 blocked다(`pipeline-state.osmu.md:62-66, 99-103`).

**RETAKE:** `요구 ID -> 불변조건 -> SQL/함수 -> repository branch -> API 응답 -> test ID/file -> rollout gate`를 행 단위로 작성하라. 승인핀, 현행 미승인본, 이번 bug decision을 명확히 분리하라.

### MAJOR-07. 새 오류 계약과 운영 사건 경로가 구현 책임에 빠졌다

**Confidence 9/10.** 대상 334~343행은 `40001`, `40P01`, timeout을 `503 retryable`, `42P10`과 일부 `23505`를 500 및 운영 사건으로 매핑한다. 그러나 파일 책임은 repository/service만 조건부로 적고 route·HTTP error code·observability를 포함하지 않는다(482~490행).

현재 `studioFailure`는 알려지지 않은 오류를 `500 INTERNAL_ERROR retryable:false`로 바꾸며, regeneration route는 생성 route와 달리 500 observability 보고도 하지 않는다. 설계대로라면 클라이언트가 재시도해야 할 503을 재시도 불가 500으로 받거나 운영 사건이 누락될 수 있다.

**RETAKE:** SQLSTATE별 `StudioApiError` code/status/retryable/details JSON과 route observability를 전량 표로 정의하고 파일 책임에 route, errors, http, observability test를 추가하라.

## 5. MINOR findings

1. **ERD 타입 불일치:** 대상 99~119행의 `member_id uuid`는 실제 `TEXT`다. request hash도 `CHAR(64)`이고 response payload·timestamps·PK/FK가 빠졌다.
2. **Mermaid 렌더 증거 없음:** 문법 블록 3종은 존재하지만 mmdc 렌더와 육안 확인 기록이 없다.
3. **구 앱 E1 응답 서술이 부정확:** 대상 357행은 generic 500 가능성을 적었다. 실제 구 repository는 예약 실패 후 tenant 재조회가 없으면 Error를 던지므로 500이 맞지만, 같은 tenant replay와 cross-tenant 500을 각각 contract test ID로 분리해야 한다.
4. **Trigger 제거 gate가 정량화되지 않음:** “최소 한 릴리스”, “latency 확인” 대신 관찰 기간, p95 lock wait, timeout/23505 건수, 제거 승인 증거를 정해야 한다.

## 6. 대안 비교

| 대안 | 회원 전역 무결성 | 구 앱 호환 | 보안·운영 복잡도 | 독립 판정 |
|---|---|---|---|---|
| repository targetless `DO NOTHING`만 | member UNIQUE가 이미 유효할 때만 | S1 전역 계약 불가 | 가장 낮음 | 실제 운영 schema가 S2/S3임이 read-only audit로 확인되면 최우선 |
| E3 global UNIQUE를 먼저 추가 | 무결성 보장 | 경합 중 구 앱 23505 가능 | 낮음 | 짧은 maintenance/오류 창을 허용하면 trigger보다 단순 |
| 현재 trigger + advisory lock | S1부터 가능 | 가능 | privileged function, lock timeout, owner 관리 필요 | 무중단 S1이 실제로 존재할 때만 조건부 채택 |
| maintenance window Big Bang | 가능 | 전환 중 write 중지 | 코드 복잡도 최저, 운영 중단 | 사용량이 작고 중단 허용 시 가장 검증하기 쉬움 |

**추천:** 먼저 운영 schema read-only audit로 실제 상태를 확정한다. 이미 member UNIQUE가 유효한 S2/S3면 trigger를 만들지 말고 targetless repository fix와 tenant constraint contract만 수행한다. 실제 S1이고 write 중단이 불가할 때만 현재 trigger 방식을 사용한다. privileged trigger는 가능한 상태를 모두 위한 기본값이 아니라, 확인된 S1 전환 문제를 위한 임시 장치여야 한다.

## 7. 요구와 테스트 추적성

| 상류 요구 | 설계 | 테스트 | 판정 |
|---|---|---|---|
| NFR-OS81-04 retry20·concurrent20, side effect≤1 | advisory lock, idempotency claim, targetless conflict | GEN-DB-01/02 및 계획된 20-concurrent matrix | 부분 매핑. retry20의 transaction retry와 side effect 계측 없음 |
| R27 하루 1회 무료 재생성, 초과 과금 | member/date quota, UTC, paid 409 | GEN-DB-03/05/06/07 | **상류가 확인 필요. member scope와 UTC fit criterion 근거 없음** |
| NFR-OS81-02 tenant read/write/link 0 | SECURITY DEFINER exists-only, invoker RLS requery | 계획된 RLS payload leak 0 | 부분 매핑. trigger owner·RLS bypass fixture 없음 |
| 배포 중 구 앱 안전 | E1 trigger, E2 app, E3 index, C1 drop | 구 앱 tenant-target contract | **현재 wildcard replay와 20260828 migration 때문에 설계 상태가 성립하지 않음** |
| migration repeatability | 재실행 2회 | 객체 중복 오류 0 | 불충분. partial E3/C1 상태와 invalid index case 누락 |

추적성 gap은 0이 아니라 최소 5건이다.

## 8. Rollback과 repeatability

| 축 | 점수 | 근거 |
|---|---:|---|
| E1 rollback | 2/5 | trigger 제거는 가능하지만 이전 migration이 tenant UNIQUE를 삭제하므로 rollback 전제가 깨짐 |
| E2 app rollback | 2/5 | tenant UNIQUE 존속을 전제로 하나 현재 workflow가 보장하지 않음 |
| E3 rollback | 3/5 | invalid index drop 방향은 맞지만 partial attach 재개 state machine 없음 |
| C1 rollback | 1/5 | “구 앱 rollback 금지”만 있고 tenant UNIQUE 복구 절차·downtime·중복 audit가 없음 |
| migration repeatability | 1/5 | historical wildcard replay, E3 partial failure, constraint name drift를 처리하지 못함 |
| **총평** | **9/25** | 운영 실행 전 RETAKE 필요 |

## 9. RETAKE 종료 조건

1. 자동 배포에서 실행되는 SQL의 정확한 manifest를 정하고 `20260828_010`의 destructive replay를 제거한다.
2. E1 전후 실제 constraint 목록을 fixture로 고정하고 구 앱 tenant-target SQL이 `42P10` 없이 작동함을 증명한다.
3. dedicated SECURITY DEFINER owner DDL과 권한 검증을 완성하거나, 운영 schema가 S2/S3이면 trigger를 제거한다.
4. statement/lock timeout 숫자와 503 error JSON을 확정한다.
5. E3/C1을 partial failure 후 재실행 가능한 state machine으로 만든다.
6. R27 승인 provenance, member scope, UTC 기준을 상류 요구 ID로 pin한다.
7. RTM을 요구 ID부터 test file/ID와 rollout gate까지 1:1로 다시 작성한다.
8. 실제 PostgreSQL 16에서 S1/S2/S3, 구 앱·신 앱, same/cross tenant 20-concurrent, tenant delete, invalid-index resume를 실행한다.

## 10. 셀프심문과 레드팀

**셀프심문:** 이 NO-GO가 틀렸다면 가장 그럴듯한 이유는 code-builder가 암묵적으로 `20260828_010`도 함께 고치고 dedicated owner와 timeout을 구현할 것이기 때문이다. 그러나 FDD의 목적은 구현자가 추측하지 않게 계약을 고정하는 것이다. 파일 책임에서 빠진 위험 DB 변경을 구현자의 재량으로 넘길 수 없으므로 NO-GO를 유지한다.

**레드팀:** 공격자는 SQL injection보다 hot member key를 반복 호출해 advisory lock 대기 5개로 풀을 소진시키는 편이 쉽다. 현재 timeout이 없으므로 이 공격은 문서가 주장한 bounded failure가 아니다. timeout과 pool saturation test가 없으면 privileged trigger를 추가해서는 안 된다.

**검증한 반대 근거:** PostgreSQL 16 격리 컨테이너에서 두 tenant가 같은 member/key를 동시에 INSERT하도록 재현했다. `SECURITY DEFINER BEFORE INSERT`에서 transaction advisory lock 후 `EXISTS`를 수행한 조합은 winner commit 뒤 loser를 `INSERT 0 0`으로 만들고 최종 행 1개를 유지했다. 따라서 trigger 알고리즘 자체를 추측으로 반려한 것이 아니다. 반려 사유는 배포 sequencing, timeout, owner, repeatability, traceability다.

---

SKILLS_USED: review. SQL/Data Safety, Race Conditions, Security, Completeness 렌즈를 설계 문서와 실제 배포 diff에 적용했다.

SKILLS_SKIPPED: code 수정은 과제에서 금지했으므로 review 스킬의 fix-first 단계는 실행하지 않았다.

SOURCES/MODEL: gpt-codex/gpt-5.6-sol | `docs/design-docs/osmu-generation-expand-contract-v1.0.1-gpt-codex.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `docs/requests/회장-확정-요구사항-대장.md` | `DESIGN.md` | `pipeline-state.osmu.md` | `dashboard/db/schema.sql` | `dashboard/db/migrations/20260828_010_studio_generation.sql` | `dashboard/db/migrations/20260829_010_studio_generation_expand_contract.sql` | `dashboard/src/lib/db.ts` | `dashboard/src/lib/studio/generation/repository.ts` | `dashboard/src/lib/studio/generation/http.ts` | `.github/workflows/deploy-marketing.yml` | PostgreSQL 16 official INSERT, Transaction Isolation, Advisory Locks, CREATE FUNCTION, CREATE INDEX docs

RUBRIC total=15/25

PRESENTATION_CHECK: 내부 태그 잔재 없음 확인. Markdown 구조와 표 가독성 확인. Mermaid 신규 삽입 없음.
