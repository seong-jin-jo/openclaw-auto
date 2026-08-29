<!--
STAMP
line: osmu
artifact: generation-expand-contract-design-review
version: v2
created_at: 2026-08-29 01:51 KST
model: gpt-codex/gpt-5.6-sol
agent: eng-design-reviewer
skills: review
basis: docs/design-docs/osmu-generation-expand-contract-v1.0.2-gpt-codex.md, 독립리뷰 v1, 현재 코드와 DB 배포 경로
evidence_urls: https://www.postgresql.org/docs/16/runtime-config-client.html, https://www.postgresql.org/docs/16/explicit-locking.html, https://www.postgresql.org/docs/16/sql-insert.html, https://www.postgresql.org/docs/16/sql-createfunction.html, https://www.postgresql.org/docs/16/sql-createindex.html
deliberation: v1의 이전 MAJOR 7건과 MINOR 4건을 폐쇄 증거별로 재검수하고, PostgreSQL 16에서 advisory lock timeout을 독립 재현했다. 전체 게이트와 generation 한정 구현 가능성을 분리 판정했다.
-->

# OSMU generation expand-contract 독립 설계 재리뷰 v2

> 한 줄 결론: v1.0.2는 이전 MAJOR 7건의 기술 결함을 모두 설계상 폐쇄했다. generation idempotency 수정 범위는 **GO**다. 다만 전체 eng-design 게이트는 R27과 승인 DESIGN 불일치라는 추적성 gap 2가 남아 **RETAKE / NO-GO**다. quota C1과 formal build 승인은 진행하면 안 된다.

## 1. 독립 판정

| 범위 | 판정 | 근거 |
|---|---|---|
| generation idempotency E1, E2, E3, generation C1 설계 | **GO** | 명시 manifest, baseline-only 역사 migration, S1 전용 trigger, 확정 owner, timeout, 재실행 상태기계, rollback이 닫혔다 |
| quota C1 | **NO-GO** | R27의 member scope와 UTC 날짜 기준이 상류 정본에서 미확정이다 |
| 전체 eng-design 게이트 및 formal build stage | **RETAKE / NO-GO** | RTM이 스스로 gap 2를 보고한다. 추적성 gap 0이라는 합격 조건을 충족하지 않는다 |

이 판정은 구현 완료 판정이 아니다. v1.0.2는 기술설계 문서이며 manifest, ledger, migration, repository, test가 실제 코드에 반영되고 실행됐다는 증거는 아직 없다.

## 2. v1 지적 폐쇄 대조

| 이전 지적 | v1.0.2 판정 | 폐쇄 증거 |
|---|---|---|
| MAJOR-01 wildcard migration replay와 `20260828_010` 선실행 | **폐쇄** | 역사 파일을 checksum-pin baseline-only로 선언하고 일반 배포의 wildcard와 schema bootstrap을 금지했다. ledger와 6단계 explicit manifest를 정의했다 |
| MAJOR-02 실행 중 timeout 부재 | **폐쇄** | transaction에 `statement_timeout=5000ms`, `lock_timeout=1500ms`를 고정하고 `55P03`, `57014` 공개 오류와 pool 회수 시험을 연결했다 |
| MAJOR-03 SECURITY DEFINER owner 미확정 | **폐쇄** | `osmu_generation_guard_owner`를 NOLOGIN, BYPASSRLS, 최소권한으로 확정했다. owner, `proconfig`, PUBLIC 및 service EXECUTE 0 preflight를 정의했다 |
| MAJOR-04 E3/C1 partial failure 재실행 불가 | **폐쇄** | invalid, valid-unattached, attached, drift 상태와 C1 partial/no-op/rollback attach 전이를 정의했다. OID, definition checksum, ledger state로 이름 drift도 차단했다 |
| MAJOR-05 R27 미확정을 확정 계약처럼 사용 | **폐쇄** | R27을 명시적으로 미확정으로 돌리고 quota C1 및 제품 완료 주장을 금지했다 |
| MAJOR-06 RTM gap 0 허위 주장 | **폐쇄** | PRD v8.2.1, 승인 DESIGN v18, 미승인 v33을 분리하고 RTM gap을 2로 정정했다. 다만 이 정직한 정정 때문에 전체 게이트는 아직 통과하지 못한다 |
| MAJOR-07 오류와 관측 계약 누락 | **폐쇄** | `23505`, `40001`, `40P01`, `55P03`, `57014`, `42P10`의 처리, HTTP status, retryable, 운영 사건을 표로 정의했다 |
| MINOR-01 ERD 타입 불일치 | **폐쇄** | UUID, text, char64, jsonb, timestamptz 수준으로 교정했다 |
| MINOR-02 Mermaid 렌더 증거 없음 | **잔존** | 아키텍처, ERD, sequence 3종 문법은 육안상 유효하나 실제 renderer 실행 증거는 없다 |
| MINOR-03 구 앱 E1 전후 호환 테스트 분리 부족 | **폐쇄** | legacy commit fixture와 S1/S2/S3, E1 전후, `42P10=0` 수용 기준을 추가했다 |
| MINOR-04 cleanup gate 비정량 | **부분 폐쇄** | 7일과 rollback manifest `pending=0`은 정량화했다. 그러나 7일 동안 허용할 error rate, timeout rate, p95 latency 임계값은 없다 |

## 3. 신규 지적

### MINOR-05 공개 오류 JSON 예시가 실제 API 계약과 다름

설계 406행은 `field_errors: null`을 예시로 든다. 현재 `StudioApiError`는 누락 시 `[]`로 초기화하고 `studioFailure`도 배열을 그대로 직렬화한다.

- 근거: `dashboard/src/lib/studio/generation/errors.ts:20-21`
- 근거: `dashboard/src/lib/studio/generation/http.ts:48-55`
- 영향: client contract test가 문서와 현재 serializer 중 어느 쪽을 정본으로 삼을지 모호하다.
- RETAKE: 예시를 `field_errors: []`로 고치거나 serializer를 nullable로 변경한다. 추천은 기존 전역 계약을 유지하는 `[]`다.

### MINOR-06 기술 결정 ID의 durable provenance가 없다

RTM의 `BR-OSMU-GEN-EC-20260829`는 문서 내부에는 있으나 상류 request 또는 decision log 경로가 핀되지 않았다. 기술 범위 자체는 현재 코드와 리뷰에서 추적 가능하므로 generation GO를 막지는 않지만, 제3자가 결정 원문을 재현할 수는 없다.

- RETAKE: decision ID를 `docs/requests/`의 실제 raw 요청 또는 결정 대장 항목에 연결한다.

## 4. PostgreSQL 16 동시성 교차 검증

공식 문서는 `lock_timeout`이 database object lock 획득 대기를 중단하고, advisory lock은 transaction-level lock으로 서로 block한다고 명시한다. 문구만으로 advisory lock에 timeout이 적용되는지 모호할 수 있어 PostgreSQL 16 isolated instance에서 직접 검증했다.

검증 조건:

- transaction A가 `pg_advisory_xact_lock(424242)`를 잡고 8초 유지
- transaction B가 `SET LOCAL lock_timeout='1500ms'`, `SET LOCAL statement_timeout='5000ms'` 뒤 같은 lock 획득
- 관찰 결과: 약 1.58초에 `canceling statement due to lock timeout`, SQLSTATE 계약상 `55P03`
- 임시 PostgreSQL container는 검증 뒤 제거했다

따라서 v1.0.2의 “advisory lock 대기를 1.5초 안에 끊는다”는 핵심 주장은 타당하다. 실제 앱 경로 hot-key 20회와 pool 5 회수는 build/QA에서 별도로 증명해야 한다.

## 5. 구조와 규격 실검

| 항목 | 결과 | 비고 |
|---|---|---|
| 최상단 목차와 앵커 | PASS | 14개 섹션 링크가 대상 heading과 대응한다 |
| Mermaid 아키텍처, ERD, flow | PASS with MINOR | 3종 존재, 육안 문법 유효. renderer 실행 증거는 없다 |
| PRD, FDD, QA 분할 | PASS | 설계와 리뷰 및 테스트 계획이 파일 책임상 분리돼 있다 |
| API JSON 및 DB field type | PASS with MINOR | 핵심 계약은 전량 기술했다. `field_errors` null 대 array 불일치는 MINOR-05다 |

## 6. 요구, 설계, 테스트 추적성

| 요구 | 설계 | 테스트 | 판정 |
|---|---|---|---|
| `NFR-OS81-04` 멱등성 | E1/E2/E3/C1 generation, targetless INSERT, re-read | GEN-DB-01/02/04, S1/S2/S3 concurrent20 | gap 0 |
| `NFR-OS81-02` tenant 격리 | exists-only SECURITY DEFINER trigger, invoker RLS reread | GEN-RLS-01/02, owner fixture | gap 0 |
| generation 배포 안전성 기술 결정 | ledger, explicit manifest, X1/X2/X3 state machine | GEN-MIG-01..08 계획 | 기술설계 gap 0, provenance MINOR |
| `R27` 무료 재생성 | conditional quota path | 기존 회귀 테스트만 | **gap 1, 상류 결정 필요** |
| 승인 DESIGN v18 대 현재 v33 | route만 구현, UI 미연결 | UI E2E 없음 | **gap 1, 승인본 불일치** |

추적성 gap은 정확히 2다. 문서가 이를 숨기지 않은 것은 개선이지만, doc-review 합격 규칙상 gap 1개 이상이면 전체 eng-design 게이트는 RETAKE다.

## 7. 독립 RUBRIC

| 축 | 점수 | 근거 |
|---|---:|---|
| 완결성 | 5/5 | 정상, 실패, rollback, partial resume, 권한, 배포 선후관계를 모두 다룬다 |
| 정밀성 | 3/5 | API JSON 한 필드 불일치와 cleanup 운영 임계값 누락이 있다 |
| 벤치마크 반영 | 5/5 | PostgreSQL 16 INSERT, isolation, advisory lock, function security, concurrent index 계약을 설계에 직접 연결했다 |
| 추적성 | 3/5 | gap 2를 정확히 보고했지만 gap 0은 아니며 기술 결정 raw provenance도 없다 |
| 전문성·톤 | 5/5 | 상태기계, 최소안 steelman, 권한 경계, 운영자 판정표가 client-ready 수준이다 |
| **합계** | **21/25** | 점수선은 넘지만 추적성 gap이 있어 전체 게이트는 반려 |

## 8. 필수 후속

1. code-builder가 generation 한정 E1/E2/E3/C1 generation을 구현할 수 있다. 구현 전 운영 DB read-only fingerprint로 S1/S2/S3를 확정해야 한다.
2. quota C1은 R27의 member scope와 UTC 기준이 PRD PATCH로 확정될 때까지 금지한다.
3. product-designer와 회장이 DESIGN v33 승인 gap을 닫기 전 formal build 승인은 금지한다.
4. tech-architect 리테이크는 `field_errors: []`, cleanup SLO 임계값, `BR-OSMU-GEN-EC-20260829` provenance를 보정해야 한다.

## 9. 셀프심문과 레드팀

이 판정이 틀렸다면 가장 그럴듯한 이유는 RTM gap 2 때문에 generation 한정 GO까지 막아야 한다는 해석이다. 반박 결과, 두 gap은 quota 제품 의미와 UI 승인본에 있고 확정 NFR인 generation idempotency의 설계, endpoint, DB transition, 테스트 연결에는 gap이 없다. 그래서 전체 게이트는 NO-GO로 유지하되 generation 버그 수정만 분리 GO로 판정했다.

까다로운 운영자 관점의 공격은 “문서의 ledger와 state machine은 아직 코드가 아니다”다. 맞다. 따라서 이 리뷰는 구현 완료를 승인하지 않고, 실제 manifest checksum, migration repeatability, S1/S2/S3 concurrency, rollback을 build/QA 증거로 다시 요구한다.

---

SKILLS_USED: review. SQL/Data Safety, Race Conditions, Security, Completeness 렌즈를 기술설계와 현재 코드 계약에 적용했다.

SKILLS_SKIPPED: 없음

SOURCES/MODEL: gpt-codex/gpt-5.6-sol | `docs/design-docs/osmu-generation-expand-contract-v1.0.2-gpt-codex.md` | `docs/qa/osmu-expand-contract-design-review-v1-gpt-codex.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `docs/requests/회장-확정-요구사항-대장.md` | `DESIGN.md` | `pipeline-state.osmu.md` | `dashboard/src/lib/studio/generation/errors.ts` | `dashboard/src/lib/studio/generation/http.ts` | PostgreSQL 16 official runtime configuration, advisory lock, INSERT, CREATE FUNCTION, CREATE INDEX docs | PostgreSQL 16 isolated lock-timeout reproduction

PRESENTATION_CHECK: 내부 태그 잔재 없음 확인, Markdown 구조와 표 가독성 확인

RUBRIC total=21/25
