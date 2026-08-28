<!--
STAMP
line: studio
artifact: studio-생성-api-갭-선택지
version: v1
created_at: 2026-08-27 05:07 KST
model: gpt-codex/gpt-5.6
agent: code-builder
skills: pipeline
basis: pipeline-state.studio.md, studio/docs/api-contract-studio-v5.0.md, studio/docs/fdd-studio-v5.0.md, studio/docs/erd-studio-생성-v3.0.md, docs/prototype/openclaw-auto-4room-v62.html, docs/requests/회장-확정-요구사항-대장.md, docs/학습정보-층계-계약-v1.0.md, docs/학습정보-층계-계약-v2.1.md, docs/사업계획-osmu-v1.0.md v1.4 §3.2~3.4
evidence_urls: https://docs.stripe.com/api/idempotent_requests, https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html, https://developers.openai.com/api/docs/guides/background, https://developers.openai.com/api/docs/guides/structured-outputs, https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/multitenancy.html
deliberation: 회장 확정 이후도 재작업되지 않은 계약을 소스로 옮기면 폐기된 소유 경계가 DB에 고정된다. 소스 작성보다 게이트 상태와 상류 충돌을 먼저 고정했다.
-->

# Studio 생성 API 갭과 선택지 v1

> 한 줄 결론: 현재 계약은 최신 요구와 충돌하고 `build` 승인도 없다. 소스나 Flyway migration을 쓰면 안 되며, 아래 7가지를 확정한 뒤 API와 DB 계약을 새 판으로 작성해야 한다.

## 1. 게이트 판정

| 항목 | 관찰 증거 | 판정 |
|---|---|---|
| 현재 단계 | `pipeline-state.studio.md`: `current_stage: eng-design` | 기술설계 진행 중 |
| 승인 기록 | `approved_stages: []` | build 승인 없음 |
| build 상태 | `status: pending`, `artifacts_ok: false` | 소스 수정 금지 |
| Studio 구현 | `studio/` 안에 독립 API `src` 없음 | 실행 증거 0건 |
| 구현 현황 | `studio/pipelines/구현현황.md`에 영상 실험만 존재 | 생성 API는 미구현 |

이 문서는 build 산출물이 아니다. `eng-design` 승인을 받기 위한 갭과 선택지다.

## 2. 기반 산출물 현행화

### 2.1 요청에 명시된 문서

| 문서 | 실측 | 현재 지위 |
|---|---:|---|
| API v5.0 | 2,761행 | R01~R99를 기반으로 하는 `재작업필요` 계약 |
| FDD v5.0 | 4,834행 | R01~R99, user-flow v45 기반. 자체적으로 build 불가를 명시 |
| ERD 생성 v3.0 | 1,303행 | R01~R99 기반. 스키마 결함 존재 |
| 프로토타입 v62 | 15,406행 | 생성실 활성 렌더 경로와 후보 3장 표현의 실제 입력 |
| 회장 요구 대장 | 512행 | 고유 ID 205건. R154, R155, R208~R210 누락 |
| 학습 정보 계약 v1.0 | 216행 | 파일 자체가 v2.0 대체를 명시한 이력본 |
| 사업계획 §3.2~3.4 | 현재 문서 판 v1.4 | R83~R86에 따라 학습 정보의 정본 |

### 2.2 진실원 순서

1. 회장 요구 대장의 최신 확정과 폐기 관계
2. 사업계획 v1.4 §3.4
3. 승인 프로토타입 v62의 활성 렌더 경로
4. 승인된 새 FDD, API, ERD, test plan
5. v5.0과 같은 이력 계약

`docs/학습정보-층계-계약-v2.1.md`도 현재 정본이 아니다. R85가 브랜드 층 신설을 반려했고 R86이 스킬을 `X4` 층으로 복원했다. 현재 이름은 `S0 S1 U2 U3 X4 L5 R6`이며, 브랜드와 취향 격리는 작업 공간 추가와 복제로 한다.

## 3. 갭 목록

| ID | 영역 | 기존 계약 | 최신 정본과 프로토타입 | 영향 |
|---|---|---|---|---|
| G01 | 게이트 | v5 FDD도 build 불가를 명시 | `pipeline-state.studio.md` 또한 build pending | 코드와 migration 작성 불가 |
| G02 | 요구 범위 | v5, 생성 v3/v4 문서 모두 R01~R99 | 요구 대장은 R207까지 존재 | R100~R207의 소유 경계와 UI 흐름 미반영 |
| G03 | 요구 무결성 | 문서가 210건이라는 전제 | 고유 ID 205건, R154, R155, R208~R210 없음 | 전수 추적 불가 |
| G04 | 프로토타입 판 | FDD v5는 user-flow v45, 생성 FDD v4는 오래된 화면 | 확정 화면은 v62 | 단계, 대화창 선택, 후보 표현이 틀림 |
| G05 | 이번 범위 | v5는 생성, 편집, 발행 인계, 성과, 결제, 해지까지 포함 | R37은 생성 하나로 제한 | 불필요한 API와 테이블이 MVP에 고정될 위험 |
| G06 | 소유 경계 | v5와 생성 v3은 Studio가 채널 문구 패키지를 만듬 | R132는 제목, 문구, 해시태그, 댓글을 openclaw 소유로 확정 | 해당 생성과 저장은 Studio에서 제거 |
| G07 | 플랫폼 규격 | `channel-spec-snapshots`, `channel_spec_projections` 저장 | R133은 요청 시점에 받아 쓰고 저장하지 않음 | 규격 본문 영속 금지. 판 참조와 digest만 제작 정보에 남김 |
| G08 | 자격 정보 | v5 봉투에 `credential_refs` 필드 존재 | 생성실은 채널 연결과 비밀값을 받지 않음 | 필드 자체를 공개 계약에서 제거. 유사 필드는 422 거절 |
| G09 | 회원 소유 | v5 미결 Q1이 회원 소유를 다시 물음 | R104가 Studio 회원과 권한 장부 소유를 확정 | 소유자 재질문 금지. 인증과 결제는 adapter로 격리 |
| G10 | 작업 공간 | ERD는 제한 snapshot, FDD는 append-only grant를 정본으로 써서 충돌 | R85, R97, R106은 공간 격리와 요금제별 한도, 초과 구매를 확정 | 권한의 정본을 append-only grant로 하는 결정 필요 |
| G11 | 7층 | 지정된 v1.0은 Studio를 사실상 무상태로 둔 폐기본. v2.1은 U3 브랜드와 U4 작업 공간을 나누고 스킬을 층에서 분리 | 사업계획 v1.4는 U2 개인, U3 작업 공간, X4 스킬을 확정 | 신규 계약은 사업계획을 그대로 반영해야 함 |
| G12 | 생성 차단 | v5 `readiness`와 생성 POST의 필수 층 연결이 불분명 | 프로토타입은 9개 질문이 비면 생성을 멈춤. 단, 그 중 금지어와 말투를 U2로 분류한 것은 사업계획과 충돌 | 차단 필드 집합과 소속 층을 확정해야 함 |
| G13 | 제안과 후보 | v5는 `proposal-sets` 뒤 여러 명령을 연결하지만 결과는 불투명 `result_ref` 중심 | v62는 화면 제안 3장 선택 뒤 같은 화면의 결 후보 A, B, C 3장을 비교 | 제안 3장과 후보 3장의 공개 스키마가 필요 |
| G14 | 후보 스키마 | v5 `GET production`은 output 참조와 실패를 중심으로 반환 | v62 후보는 A/B/C 표시, 각도, 설명, 예상 가격, 예상 시간, 540p 미리보기를 표시 | 단순 output ID로는 프론트 계약을 만족하지 못함 |
| G15 | R27 재생성 | v5는 `all_rejected` 이유와 `free_retry_consumed` 결과만 제공 | 하루 1회 무료, 이후 과금이 확정 | 일자 경계, 사용자 범위, 경합 원자성, 다음 무료 시각 응답이 없음 |
| G16 | R105 내려받기 | v5는 `signed_url|stream_ticket|auto`를 다시 선택으로 열어 둠 | R105는 만료 URL을 확정. R108은 결과물을 회원 자산으로 확정 | URL 방식은 닫고 TTL, 재발급, 삭제, 보관만 확정해야 함 |
| G17 | 후보 부분 실패 | v5는 부분 성공을 공개 상태로 허용 | v62는 비교할 3장을 항상 전제 | 2장만 반환할지, 서버가 빈 자리를 재시도할지 확정 필요 |
| G18 | 상태 충돌 | `If-Match` 불일치가 409와 412로 나뉘어 있음 | 공개 계약은 하나의 어드버스 규칙이 필요 | 클라이언트 재시도 분기가 불안정 |
| G19 | 서비스 중립성 | v5 예시에 특정 브랜드 URN과 URL이 포함 | 레포는 서비스 중립이어야 함 | 중립 명명과 설정값으로 교체 |
| G20 | ERD 구조 결함 | `material_imports.workspace_id` 중복, 인덱스에 `workspace_id` 중복, `learning_candidates.workspace_id` nullable, X4 문구 자체 충돌 | 최신 요구는 작업 공간 격리와 X4 층을 강제 | 기존 ERD를 migration으로 옮기면 즉시 결함 |
| G21 | 재생성 저장 | ERD에 일일 무료 재생성을 원자적으로 막는 정보 구조 없음 | R27은 동시 요청에서도 1회만 무료여야 함 | 사용 장부와 unique 제약 필요 |
| G22 | 전달 저장 | ERD v3에 R105의 발급, 만료, 재발급, 접근 감사를 완결하는 구조 부족 | R105, R108은 Studio가 이 수명을 소유하도록 함 | `output_deliveries` 성격의 장부 필요 |

## 4. 이미 닫힌: 다시 묻지 않는 것

| 항목 | 확정값 | 근거 |
|---|---|---|
| 회원과 권한 장부 | Studio 소유. 인증과 결제 업체는 adapter | R104 |
| 독립 상품 | Studio 단독으로 회원, U2, U3, R6를 갖춤 | R71 |
| 브랜드 격리 | 브랜드 층을 만들지 않고 작업 공간을 추가하거나 복제 | R85, R87 |
| 스킬 | `X4` 층 | R86 |
| 플랫폼 지식 | openclaw 소유. Studio는 규격 본문을 저장하지 않음 | R132, R133 |
| 채널 문구 | 제목, 문구, 해시태그, 댓글은 openclaw 발행실 소유 | R132, R139 |
| 작업 공간 제한 | 무료와 스타터 1개, 프로 3개, 기업 협의, 초과 월 과금 | R97, R106 |
| 결과 전달 | 만료되는 내려받기 URL | R105 |
| 결과물과 입력 자산 | 회원 자산. 해지가 자동 삭제는 아님 | R108 |

## 5. 회장 확정이 필요한 선택지

### D1. 공개 생성 API를 어떻게 쪼갤 것인가

**추천 A. 프로토타입의 두 결정을 두 공개 명령으로 둔다.**

- `POST /v1/generation-proposal-sets`: 작업 공간과 R6를 받고 화면 제안 3장을 비동기로 만든다.
- `GET /v1/generation-proposal-sets/{id}`: 준비 중이거나 확정된 3장을 반환한다.
- `POST /v1/generation-jobs`: 고른 제안과 이번 조정을 받고 A, B, C 후보 3장을 만든다.
- `GET /v1/generation-jobs/{id}`: 준비 중, 성공, 실패 상태와 후보 3장을 반환한다.
- 명령형 POST는 회원 범위 `Idempotency-Key`를 필수로 한다.

고르면: v62의 제안 3장과 후보 3장이 API에서도 다른 자원이 된다. v5의 다섯 이상 중간 명령은 서버 내부로 숨긴다.

**B. v5의 제안, 견적, 승인, 조립, 실행 API를 그대로 공개한다.**

고르면: 각 중간 상태를 외부에서 세밀하게 제어할 수 있다. 대신 클라이언트가 서버 상태기계를 알아야 하고, 간헐적 실패와 판 충돌이 늘어난다.

### D2. DB는 얼마나 작게 시작할 것인가

**추천 A. 생성 수직 절편에 필요한 장부만 두고 불변 이력으로 확장한다.**

후보 개체는 다음과 같다.

1. `studio_members`
2. `member_auth_identities`
3. `workspaces`
4. `workspace_members`
5. `entitlement_grants`
6. `layer_items`
7. `layer_revisions`
8. `skills`
9. `skill_versions`
10. `generation_proposal_sets`
11. `generation_proposals`
12. `generation_jobs`
13. `generation_attempts`
14. `generation_candidates`
15. `idempotency_records`
16. `daily_regeneration_uses`
17. `output_deliveries`

`channel_spec_projections`, 편집, 발행, 성과, 댓글, 구독 해지 테이블은 이번 범위에 두지 않는다. 작업 lease는 `generation_jobs`에, 실제 자산 참조는 후보와 전달 장부에 둔다.

고르면: R37 범위에서 직접 쓰는 구조만 만든다. 나중 편집과 발행을 열 때 새 migration으로 늘린다.

**B. v5 ERD의 전체 정규화 구조를 먼저 만든다.**

고르면: 나중 기능을 붙일 때 migration이 줄어든다. 대신 아직 제품 경계가 변하는 편집, 발행, 성과 테이블까지 폐기된 전제로 고정할 위험이 크다.

### D3. 회원과 작업 공간 권한을 어떻게 담을 것인가

**추천 A. 회원, 외부 인증 식별자, 작업 공간, membership를 분리한다.**

- `studio_members`는 Studio 회원 정본이다.
- `member_auth_identities`는 교체 가능한 인증 제공자의 `issuer + subject`만 매핑한다.
- `workspace_members`는 owner, editor, viewer 권한을 담는다.
- 모든 작업 공간 자원은 `workspace_id` 범위를 강제한다.

고르면: R104의 권한 장부를 처음부터 표현하고 인증 업체 교체와 협업자 추가를 migration 없이 받는다.

**B. `workspaces.owner_member_id`만 두고 협업 권한은 나중에 붙인다.**

고르면: 표가 하나 줄어든다. 대신 R104의 권한 장부를 소유자 하나로 축소하고, 협업 요구가 나오면 모든 foreign key와 인가 검사를 바꿨야 한다.

### D4. R27의 "하루 1회"를 어느 범위로 셀 것인가

**추천 A. 회원 전체, U2 시간대의 현지 일자 기준으로 센다.**

- 작업 공간을 여러 개 만들어 무료 재생성을 우회하지 못한다.
- `daily_regeneration_uses(member_id, local_date, kind)` unique 제약과 하나의 transaction으로 경합을 막는다.
- 응답에 `free_retry_eligible`, `free_retry_resets_at`, `paid_retry_quote`를 함께 둔다.

고르면: 과금 우회를 막지만 서로 다른 브랜드 작업도 하루 한번만 무료다.

**B. 회원과 작업 공간별로 센다.**

고르면: 서로 다른 브랜드는 각각 하루 1회를 받는다. 대신 무료 작업 공간을 추가해 재생성 횟수를 늘릴 수 있다.

### D5. 생성 전 필수 학습 정보를 어디까지 받을 것인가

**추천 A. 안전과 생성 타당성에 필수인 값만 차단하고, 나머지는 기본값과 후속 질문으로 보강한다.**

차단 후보는 다음이다.

- U3 작업 공간 목적
- U3 대상
- U3 글과 이미지 또는 영상 갈래
- U3 브랜드 사실. 없음을 확인하는 것도 허용
- U3 금지 표현. 없음을 확인하는 것도 허용
- U3 소재 권리 확인
- R6 이번 주제
- R6 이번 출력 언어

말투와 세부 콘셉은 필수로 막지 않고 U3와 X4 기본값으로 보강한다. 생성 POST는 원본 층 값을 중복해 받지 않고 `workspace_id`, R6, 고른 `skill_version_id`, 기대한 층 판만 받는다. 서버가 정본 층을 읽어 봉투를 조립한다.

고르면: R24와 R28의 최소 질문을 지키면서 첫 가치 시간을 줄인다. 단, v62의 9개 모두가 채워져야 하는 흐름은 수정되어야 한다.

**B. v62의 9개를 모두 차단 필수로 한다.**

고르면: 프로토타입을 문자 그대로 따른다. 대신 금지 표현과 말투가 U2로 잘못 분류된 상태까지 스키마에 고정되고, 첫 가치까지 질문이 많아진다.

### D6. 후보 하나가 실패했을 때 무엇을 반환할 것인가

**추천 A. 서버는 성공한 자리를 보존하고 빈 자리만 제한 횟수로 재시도한다. 사용자에게는 3장 전부가 준비됐을 때만 성공으로 반환한다.**

고르면: v62의 비교 계약을 지킨다. 공급자 장애로 인한 2장 반환을 회원의 선택 문제로 넘기지 않는다. 항구 실패 시 job은 실패하되 성공한 자산은 내부 재시도에 재사용한다.

**B. 성공한 2장을 `partial` 상태로 반환한다.**

고르면: 빠리 볼 수 있지만 회원은 정상 3장과 편향된 2장을 비교하게 된다.

### D7. 내려받기 URL의 기본 TTL을 얼마로 할 것인가

**추천 A. 15분.**

고르면: 링크 노출 창을 줄이고, 만료 후에도 소유권을 재검증해 재발급한다. 객체 보관 기간과 URL TTL은 분리한다.

**B. 60분.**

고르면: 큰 파일이나 느린 회선에서 재발급이 줄어든다. 대신 누출된 링크가 유효한 시간이 네 배다.

## 6. 추천 응답 계약 골격

아래는 D1 A를 고를 때의 계약 골격이다. 확정 계약이 아니며 migration이나 OpenAPI로 옮기전 승인이 필요하다.

### 6.1 생성 요청

```json
{
  "workspace_id": "uuid",
  "request": {
    "topic": "string",
    "output_language": "ko",
    "adjustments": {}
  },
  "content_branch": "text_image|video",
  "skill_version_id": "uuid",
  "expected_layer_revisions": {
    "s0": 1,
    "s1": 3,
    "u2": 2,
    "u3": 7,
    "x4": 4,
    "l5": 5
  },
  "platform_spec": {
    "reference": "opaque-string",
    "version": "opaque-string",
    "digest": "sha256-string",
    "body": {}
  }
}
```

`platform_spec.body`는 요청 처리 메모리에서만 사용하고 영속하지 않는다. `reference`, `version`, `digest`는 제작 정보에 남기되 규격 본문을 복원할 수 없다. `platform_spec`은 Studio 단독이면 없을 수 있다.

### 6.2 후보 세트 응답

```json
{
  "job_id": "uuid",
  "status": "queued|running|succeeded|failed",
  "candidates": [
    {
      "candidate_id": "uuid",
      "ordinal": 1,
      "label": "A",
      "angle": "string",
      "summary": "string",
      "preview": {
        "kind": "video|image|text|audio",
        "url": "short-lived-url",
        "quality": "540p"
      },
      "estimated_final_cost_minor": 0,
      "estimated_final_seconds": 0,
      "provenance": {
        "layer_revisions": {},
        "skill_version_id": "uuid",
        "model_adapter": "configured-adapter"
      }
    }
  ],
  "regeneration": {
    "free_retry_eligible": true,
    "free_retry_resets_at": "RFC3339 timestamp",
    "paid_retry_quote": null
  }
}
```

`succeeded`에서 `candidates` 길이는 항상 3이다. 상태가 `queued|running|failed`면 `candidates`는 빈 배열이다. 응답의 URL은 자산 보관 URL이 아니라 미리보기를 위한 짧은 만료 URL이다.

### 6.3 재생성 요청

`POST /v1/generation-jobs/{id}/regenerations`

```json
{
  "reason": "all_rejected",
  "cost_approval": {
    "approved_ceiling_minor": 0,
    "currency": "configured-currency"
  }
}
```

무료 회차면 상한은 0이다. 유료 회차면 서버가 가격을 제시한 뒤 별도 승인된 상한이 필요하다. 같은 `Idempotency-Key`는 무료 회차를 두 번 차감하지 않는다.

### 6.4 내려받기 발급

`POST /v1/outputs/{outputId}/deliveries`

```json
{
  "purpose": "download"
}
```

응답은 `delivery_id`, `download_url`, `expires_at`, `sha256`, `content_length`, `media_type`을 반환한다. 만료한 링크를 열면 재발급만 가능하고 기존 URL은 부활하지 않는다.

## 7. build 승인 후 작성할 계약 테스트

| 시험 항목 | 정상 경로 | 거절 경로 | 경합 경로 |
|---|---|---|---|
| CT-GEN-01 제안 3장 생성 | 준비된 작업 공간에서 제안 3장 | 필수 학습 정보 누락은 422 | 같은 멱등 키 동시 요청은 job 1개 |
| CT-GEN-02 후보 3장 생성 | 고른 제안에서 A, B, C 3장 | 다른 작업 공간의 제안 ID는 404 | 동일 작업의 중복 실행은 1개 |
| CT-GEN-03 R27 재생성 | 첫 재생성은 무료 | 두 번째 무승인 요청은 409 | 동시 무료 요청 2개 중 1개만 성공 |
| CT-AUTH-01 작업 공간 격리 | 권한 있는 회원 접근 | 권한 없는 작업 공간은 404 | 해당 없음 |
| CT-DL-01 만료 내려받기 | 소유자에게 TTL 링크 발급 | 타인 자산은 404, 만료 링크는 410 | 동일 멱등 키는 delivery 1개 |

각 기능의 단위 테스트와 실제 DB를 붙인 통합 테스트를 build 단계에서 쓴다. E2E와 브라우저 테스트는 QA 소유다.

## 8. 벤치마크 적용

| 공식 자료 | 확인한 사실 | 차용 | 변경 |
|---|---|---|---|
| [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) | POST 재시도는 멱등 키로 첫 응답을 재사용하고 같은 키의 다른 파라미터를 거절 | 명령형 POST 전부에 회원 범위 멱등 키 | Studio는 job ID와 operation 상태를 함께 반환 |
| [OpenAI background mode](https://developers.openai.com/api/docs/guides/background) | 오래 걸리는 응답을 백그라운드로 시작하고 `queued`, `in_progress`, 종료 상태를 polling | 202 + job 조회 | 특정 모델 API를 공개하지 않고 provider-neutral job으로 감쌐 |
| [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs) | JSON Schema로 응답 형태를 구속하고 refusal과 incomplete을 별도로 처리 | 제안 3장과 후보 3장의 내부 provider 응답을 schema로 검증 | 클라이언트 성공 계약은 내부 provider 응답보다 더 엄격하게 정확히 3장 |
| [AWS S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) | 설정한 만료 시각까지 임시 접근을 제공하며 임시 자격이 더 먼저 만료하면 URL도 더 먼저 끝남 | 객체 보관과 다른 짧은 download URL | 특정 저장소는 adapter 뒤로 숨김 |
| [Spring Security multi-tenancy](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/multitenancy.html) | tenant를 resolve하고 신뢰할 수 있는 issuer만 선택해야 함 | 외부 인증 식별자와 Studio 회원을 adapter mapping으로 분리 | 권한 판정은 요청이 보낸 workspace ID를 신뢰하지 않고 서버 membership을 조회 |

## 9. 자기심문과 레드팀

### 이 결론이 틀렸다면 가장 그럴듯한 이유

프로토타입의 화면 제안 3장과 후보 3장을 서로 다른 자원으로 본 것이 과설계일 수 있다. 둘은 사용자에게 연속된 하나의 생성 흐름이다. 그래서 클라이언트에는 두 명령만 남기고, 견적, 봉투 조립, provider 실행, 부분 재시도는 서버 내부로 숨겼다.

가장 무거운 미확정 전제는 D5다. 첫 가치 시간을 줄이려는 추천이 소재 권리와 브랜드 사실을 너무 많이 물을 수 있다. 반대로 v62의 9개를 그대로 받으면 단순한 첫 생성도 질문 흐름에 막힌다. 이 선택은 API 스키마보다 온보딩 전환을 더 크게 바꾼다.

### 까다로운 고객 관점의 공격

> "내가 아직 생성물도 보지 못했는데 질문을 여덟 개나 답하라고 한다. 또 세 장을 풀로 만들고 하나가 실패하면 모두 대기시키는 것은 느리다. 복잡한 계약을 나한테 떠넘기는 것 아니냐."

이 공격을 버티려면 첫 화면을 빨리 보여 줄 필요가 있다. D5는 안전에 필수인 값만 막고 나머지를 보강하는 A를 추천한다. D6은 3장 전부를 준비하되, 서버가 성공한 자리를 재사용해 낭비를 줄이는 A를 추천한다. 서버 복잡도를 회원에게 노출하지 않는다.

## 10. 판정과 다음 게이트

| 항목 | 현재 상태 |
|---|---|
| 갭 목록 | 근거 확인 |
| DB, entity, endpoint | 선택지 제시. 미확정 |
| Java, Gradle, Flyway | 작성하지 않음 |
| 단위, 통합 테스트 | build 승인 전이므로 작성하지 않음 |
| 실행 요청과 응답 | 실행할 소스가 없고 게이트가 닫혀 0건, 미검증 |

게이트를 열려면 다음이 필요하다.

1. 요구 대장에 R154, R155, R208~R210을 복구하거나 205건이 전부임을 확정한다.
2. D1~D7을 확정한다.
3. 확정값으로 FDD, API, ERD, test plan을 새 판으로 작업한다.
4. `eng-design` 독립 리뷰와 `/approve eng-design`를 통과한다.
5. `pipeline-state.studio.md` 상 build 승인을 확인한 뒤만 소스를 작성한다.

⭕ 회수 필요: D1~D7과 요구 대장 누락 5건을 회장이 확정해야 기술설계 새 판을 만들 수 있다. 확정 전에 DB 스키마와 endpoint를 코드로 고정하면 안 된다.

## 검증 메타데이터

품질헌법은 산출 전에 실제로 읽었다.

- `/Users/sj/.claude/standards/README.md`
- `/Users/sj/.claude/standards/dev.md`
- `/Users/sj/.claude/standards/doc-review.md`
- `/Users/sj/.claude/standards/benchmarks.md`
- `/Users/sj/.claude/standards/artifact-stamp.md`

실제 `search_query`로 확인한 주제는 다음 다섯 건이다.

1. Stripe idempotent requests 공식 계약
2. AWS S3 presigned URL 만료 규칙
3. OpenAI background mode 상태 모델
4. OpenAI structured outputs JSON Schema 보장
5. Spring Security resource server multi-tenancy 경계

## SOURCES / MODEL

SOURCES:

- `pipeline-state.studio.md`
- `studio/docs/api-contract-studio-v5.0.md`
- `studio/docs/fdd-studio-v5.0.md`
- `studio/docs/erd-studio-생성-v3.0.md`
- `docs/prototype/openclaw-auto-4room-v62.html`
- `docs/requests/회장-확정-요구사항-대장.md`
- `docs/학습정보-층계-계약-v1.0.md`, 이력 비교
- `docs/학습정보-층계-계약-v2.1.md`, R85~R86 반려 대상 비교
- `docs/사업계획-osmu-v1.0.md` 내부 판 v1.4 §3.2~3.4
- 위 벤치마크 표의 공식 문서 5건

MODEL: gpt-codex/gpt-5.6

SKILLS_USED: `pipeline`, `pipeline-state.studio.md`의 `eng-design` 게이트와 build 미승인을 재검증해 소스 작성을 멈추는 데 사용.

SKILLS_SKIPPED: 없음. 설치된 스킬 중 API 기술설계 전용 스킬은 없음.
