<!--
STAMP
line: studio
artifact: api-contract-studio
version: v4.0
created_at: 2026-08-23 00:20 KST
model: gpt-codex/gpt-5.6-sol
agent: tech-architect
skills: 없음. 기술설계 전용 설치 스킬이 없어 dev.md와 doc-review.md를 직접 적용했다.
basis: 사업계획 v1.3 §3.4.1~3.4.3, 회장 확정 요구 대장 최신 묶음, FDD Studio v4.0, 기존 API 계약 v3.0
evidence_urls: https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md, https://docs.stripe.com/webhooks, https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
deliberation: 공개 Studio API, 서비스 간 동기화 API, 무상태 엔진 포트를 분리하고 모든 재시도 계약을 멱등하게 만든다.
-->

# Studio 통신 계약 v4.0

> 한 줄 결론: 공개 API는 회원과 `S0 S1 U2 U3 X4 L5 R6`을 다루고, 동기화 API는 정본 판을 밀며, 엔진 포트는 판이 고정된 봉투 한 건만 실행한다.

| 항목 | 값 |
|---|---|
| 기준 계약 | `docs/사업계획-osmu-v1.0.md` 내부 판 v1.3, 요구 대장 R01~R99 |
| 기능 설계 | `studio/docs/fdd-studio-v4.0.md` |
| 데이터 설계 | `studio/docs/fdd-studio-v4.0.md` §4, 기존 `studio/docs/erd-studio-생성-v3.0.md` 승계 |
| 호환 대상 | 기존 `/api/studio/*`는 전환 어댑터로 유지 |
| 기본 형식 | JSON UTF-8 |
| 시간 형식 | RFC 3339 UTC |
| 식별자 | UUID v7 권고, 문자열로 전달 |
| 금액 | 통화 최소 단위 정수 |
| 계약 판 | `4.0`, API 경로 `v4` |

## 목차

- [0. 논의와 미결](#논의)
- [1. 공통 규칙](#공통)
- [2. 인증과 범위](#인증)
- [3. 오류와 멱등성](#오류)
- [4. 층 봉투](#봉투)
- [5. 엔진 반환물](#반환)
- [6. 회원과 준비 상태 API](#회원)
- [7. 개인과 작업 공간 API](#범위-api)
- [8. 목소리와 금지 표현 API](#목소리-api)
- [9. 스킬 API](#스킬-api)
- [10. 생성 API](#생성-api)
- [11. 동기화 API](#동기화-api)
- [12. 삭제와 충돌 API](#삭제-api)
- [13. 상태 기계와 사건](#상태)
- [14. 흐름 대 엔드포인트 매핑](#매핑)
- [15. 하위 호환과 전환](#호환)
- [16. 보안과 제한](#보안)
- [17. 회수 목록](#회수)
- [18. 자기심문과 레드팀](#자기심문)
- [SOURCES, MODEL, RUBRIC](#sources)

## 0. 논의와 미결 <a id="논의"></a>

이 절만 미결을 담는다. 1절부터 18절은 사업계획 v1.3에서 이미 확정된 서비스 경계와 교환 형식을 정식 계약으로 쓴다. 아래 선택 전에는 관련 보유 기간, 연결 병합, 외부 스킬 실행, 구 계약 폐기, 경보 수치를 상수로 구현하지 않는다.

| ID | 정할 것 | 선택지 | 추천안 | 미확정 영향 |
|---|---|---|---|---|
| D-01 | Studio 회원과 openclaw 회원 연결 | 자동 병합 / 사용자가 양쪽 식별자를 보고 연결 승인 | 사용자 승인 | `POST /members/link-intents`의 확정 동작과 충돌 처리 미확정 |
| D-02 | R6 원문 보유 기간 | 30일 / 90일 | 30일 | 삭제 스케줄과 410 전환 시각 미확정 |
| D-03 | 외부 X4 실행 권한 | 기본 차단 / 검토 통과 뒤 선택 허용 | 기본 차단 | permissions 검증과 실행 격리 정책 미확정 |
| D-04 | v3 계약 전환 창 | 즉시 종료 / 30일 읽기 전용 호환 | 30일 읽기 전용 | v3 어댑터 제거일 미확정 |
| D-05 | 동기화 실패 경보 | 모든 실패 동일 / 멈추는 값 15분, 그 밖 24시간 | 영향도 분리 | 경보 임계 상수 미확정 |

채널별 제목·소개·해시태그·첫 댓글은 최신 R88에 따라 Studio 편집실이 만든다. 첫 사용자는 R89에 따라 채널 연결 없이 글 또는 영상 갈래만 고르고 제작한다.

**판정: 정책 gap 5건으로 build stage 진입 불가.** 아래 본문은 선택과 무관하게 유지되는 봉투, 상태, 오류, 멱등성 계약이다.

## 1. 공통 규칙 <a id="공통"></a>

### 1.1 기본 머리말

모든 공개 요청은 다음을 사용한다.

| 머리말 | 필수 | 설명 |
|---|---|---|
| `Authorization: Bearer <token>` | 예 | Studio 세션 또는 합친 배치 위임 토큰 |
| `Content-Type: application/json` | 본문 있을 때 | UTF-8 JSON |
| `Accept: application/json` | 예 | 응답 형식 |
| `Idempotency-Key` | 명령형 POST | 회원 범위 중복 방지 키 |
| `X-Contract-Version` | 서비스 간 호출 | 예: `4.0` |
| `X-Correlation-Id` | 권고 | 전체 흐름 추적 식별자 |

응답은 다음 머리말을 포함한다.

| 머리말 | 설명 |
|---|---|
| `X-Request-Id` | Studio가 발급한 요청 식별자 |
| `X-Contract-Version` | 응답을 만든 계약 판 |
| `Retry-After` | 429 또는 재시도 가능한 503일 때 초 단위 |

### 1.2 공통 응답 봉투

성공:

```json
{
  "data": {},
  "meta": {
    "request_id": "uuid",
    "contract_version": "4.0",
    "served_at": "2026-08-22T00:00:00Z"
  }
}
```

실패:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "사용자가 이해할 한국어 설명",
    "retryable": false,
    "field_errors": [],
    "details": {}
  },
  "meta": {
    "request_id": "uuid",
    "contract_version": "4.0"
  }
}
```

### 1.3 열거값 규칙

- 서버가 모르는 열거값을 받으면 422다.
- 클라이언트가 모르는 응답 열거값은 `unknown` 화면으로 보존하고 원문을 로그에 남긴다.
- 같은 주 번호에서 새 선택 필드는 추가할 수 있다.
- 같은 주 번호에서 기존 필드 의미를 바꾸지 않는다.

### 1.4 페이지 나누기

목록은 커서 방식을 쓴다.

```json
{
  "data": { "items": [] },
  "meta": {
    "next_cursor": "opaque-or-null",
    "has_more": false
  }
}
```

기본 `limit`은 20, 최대 100이다.

### 1.5 동시 수정

층 항목과 작업 공간 수정은 `If-Match`에 현재 판을 보낸다.

판이 다르면 409 `REVISION_CONFLICT`다.

서버는 현재 판과 사용자가 보낸 기준 판을 돌려준다.

### 1.6 표기

| 표기 | 뜻 |
|---|---|
| API | 서비스 사이 요청과 응답 규격 |
| HTTP | 웹 요청과 응답 전송 규약 |
| JSON | 키와 값으로 구성된 본문 형식 |
| UUID | 충돌 가능성이 매우 낮은 128비트 식별자 |
| RFC 3339 | 인터넷 날짜와 시각 표기 규격 |
| UTF-8 | 이 계약이 사용하는 문자 인코딩 |
| SHA-256 | 본문 무결성 지문에 쓰는 해시 함수 |

## 2. 인증과 범위 <a id="인증"></a>

### 2.1 토큰 종류

| 토큰 | 발급자 | 사용 |
|---|---|---|
| Studio 회원 세션 | Studio 인증 | 독립 웹과 앱 |
| openclaw 위임 토큰 | openclaw 서버 | 회원 대리 생성, 정본 밀기, 제작 요청 |
| Studio 서비스 토큰 | Studio 운영 | 내부 worker와 engine 경계 |

브라우저는 서비스 토큰을 받지 않는다.

### 2.2 범위 확정

회원 식별자는 토큰에서 확정한다.

`workspace_id`는 요청에서 받을 수 있지만 서버가 토큰의 `studio_member_id`와 회원 관계를 다시 검사한다.

다른 회원이나 작업 공간의 식별자는 404로 응답해 존재 여부를 숨긴다.

운영 감사에는 실제 거부 이유를 남긴다.

### 2.3 위임 토큰 권한

위임 토큰은 다음 범위를 분리한다.

- `member:provision`
- `layers:push`
- `productions:create`
- `productions:read`
- `handoffs:receive`

토큰 하나에 필요한 범위만 준다.

### 2.4 회원 매핑

합친 배치의 외부 회원은 `source_service + source_member_id`로 유일하다.

Studio 내부 회원 식별자는 외부에 정본처럼 노출하지 않는다.

## 3. 오류와 멱등성 <a id="오류"></a>

### 3.1 상태 코드

| HTTP | 의미 |
|---:|---|
| 200 | 조회 또는 멱등 재응답 성공 |
| 201 | 새 자원 생성 |
| 202 | 비동기 명령 접수 |
| 204 | 본문 없는 삭제 접수 |
| 400 | JSON 또는 머리말 형식 오류 |
| 401 | 인증 실패 |
| 403 | 유효 토큰이나 범위 부족 |
| 404 | 자원 없음 또는 범위 밖 |
| 409 | 판, 상태, 중복 의미 충돌 |
| 410 | tombstone으로 삭제된 자원 |
| 412 | `If-Match` 불일치 |
| 422 | 의미 검증 실패 |
| 429 | 회원 또는 비용 비율 제한 |
| 503 | 의존 서비스 장애, 재시도 가능 여부 명시 |

### 3.2 안정 오류 코드

| 코드 | HTTP | 재시도 | 뜻 |
|---|---:|---|---|
| AUTH_REQUIRED | 401 | 아니오 | 인증 없음 |
| TOKEN_INVALID | 401 | 아니오 | 토큰 무효 |
| SCOPE_DENIED | 403 | 아니오 | 권한 부족 |
| RESOURCE_NOT_FOUND | 404 | 아니오 | 없음 또는 범위 밖 |
| REVISION_CONFLICT | 409 | 아니오 | 기준 판이 오래됨 |
| STATE_CONFLICT | 409 | 아니오 | 현재 상태에서 명령 불가 |
| IDEMPOTENCY_CONFLICT | 409 | 아니오 | 같은 키에 다른 본문 |
| VERSION_UNSUPPORTED | 422 | 아니오 | 계약 주 번호 미지원 |
| VOICE_SLOT_INVALID | 422 | 아니오 | 목소리 칸 구조 오류 |
| SKILL_DECLARATION_INVALID | 422 | 아니오 | 스킬 여덟 칸 미완성 |
| SKILL_PERMISSION_DENIED | 403 | 아니오 | 실행 권한 초과 |
| SYNC_REVISION_REGRESSION | 409 | 아니오 | 정본 판 역행 |
| SYNC_MAPPING_CONFLICT | 409 | 아니오 | 식별자 매핑 충돌 |
| STALE_STOPPING_VALUE | 409 | 예 | 멈추는 값 투영 실패와 오래됨 |
| COST_APPROVAL_REQUIRED | 409 | 아니오 | 상한 승인 필요 |
| COST_CEILING_REACHED | 409 | 아니오 | 추가 호출 중지 |
| MODEL_PRIMARY_UNAVAILABLE | 503 | 예 | 주 모델 장애 |
| MODEL_ALL_UNAVAILABLE | 503 | 예 | 예비 모델까지 장애 |
| OUTPUT_FORBIDDEN_PHRASE | 422 | 조건부 | 금지 표현 적발 |
| OUTPUT_WORKSPACE_FACT_CONFLICT | 422 | 조건부 | 브랜드 사실 불일치 |
| OUTPUT_RIGHTS_BLOCKED | 422 | 아니오 | 소재 권리 미확인 |
| PARTIAL_SUCCESS | 200 | 선택 | 성공분과 실패분 공존 |

### 3.3 멱등성

명령형 POST는 `Idempotency-Key`가 필수다.

고유 범위는 `member_id + endpoint_family + key`다.

서버는 정규화 본문 지문을 저장한다.

같은 키와 같은 지문은 최초 응답을 반환한다.

같은 키와 다른 지문은 409다.

보관 기간은 작업 최대 재시도 창보다 길어야 한다.

### 3.4 비동기 상태 조회

202 응답은 `operation_id`, `status_url`, `retry_after_seconds`를 준다.

웹훅을 쓰지 않는 클라이언트는 상태 URL을 지수 간격으로 조회한다.

## 4. 층 봉투 <a id="봉투"></a>

### 4.1 봉투 불변조건

- 하나의 Studio 회원만 포함한다.
- 하나의 작업 공간만 포함한다.
- 각 항목은 항목 식별자, 판, 정본 서비스, 마지막 갱신 시각을 가진다.
- 스킬은 `layers.x4`안에 들어가며 층 계보에 포함된다.
- R6는 항목 정본으로 저장하지 않고 작업 기록 안에만 남는다.
- 엔진은 봉투 밖 값을 조회하지 않는다.

### 4.2 봉투 전문

```json
{
  "envelope_id": "uuid",
  "contract_version": "4.0",
  "request_id": "uuid",
  "mode": "standalone|combined",
  "source_service": "studio|openclaw",
  "member": {
    "studio_member_id": "uuid",
    "source_service": "studio|openclaw",
    "source_member_id": "string|null"
  },
  "scope": {
    "workspace_id": "uuid",
    "language": "ko-KR",
    "content_branch": "teach|show|announce|sell|entertain|other",
    "channel_targets": ["threads", "instagram_reels"],
    "format": "short_video"
  },
  "normalized_input": {
    "topic": "string",
    "purpose": "education",
    "source_refs": ["uuid"],
    "raw_request_ref": "uuid|null",
    "normalization_fingerprint": "sha256"
  },
  "layers": {
    "s0": [],
    "s1": [],
    "u2": [],
    "u3": [],
    "x4": [
      {
        "item_id": "uuid",
        "revision": 3,
        "integrity": "sha256",
        "inspection_status": "passed",
        "assembly_contract": {
          "reads": ["U3.workspace_facts", "R6.topic"],
          "writes": ["storyboard.scenes", "channel_copy"],
          "forbidden_overrides": ["S0", "U3.forbidden_phrases", "U3.material_rights"]
        }
      }
    ],
    "l5": [],
    "r6": [
      {
        "request_adjustment_id": "uuid",
        "topic": "string",
        "purpose": "education",
        "constraints": [],
        "created_at": "timestamp"
      }
    ]
  },
  "workspace_context": {
    "workspace_facts": [],
    "expression_rules": [],
    "forbidden_phrases": [],
    "material_rights": [],
    "goals": [],
    "free_note": "차분하지만 답답하지 않게"
  },
  "cost_policy": {
    "currency": "KRW",
    "approved_ceiling_minor": 5000,
    "fallback_allowed": true
  },
  "channel_context": {
    "status": "not_applicable|spec_only|connected",
    "spec_snapshot_ids": [],
    "credential_refs": []
  },
  "layer_versions": {
    "S0": [{ "item_id": "uuid", "revision": 7, "authority": "studio", "updated_at": "timestamp" }],
    "S1": [],
    "U2": [],
    "U3": [],
    "X4": [{ "item_id": "uuid", "revision": 3 }],
    "L5": [],
    "R6": [{ "request_adjustment_id": "uuid" }]
  },
  "created_at": "timestamp"
}
```

### 4.3 층 항목 공통 구조

```json
{
  "item_id": "uuid",
  "revision_id": "uuid",
  "revision": 4,
  "layer": "U3",
  "scope_kind": "workspace",
  "scope_id": "uuid",
  "item_kind": "workspace_fact",
  "value": {},
  "authority": {
    "service": "openclaw",
    "item_id": "external-id",
    "revision": 11
  },
  "projection": {
    "kind": "projection",
    "received_at": "timestamp",
    "last_push_succeeded_at": "timestamp",
    "has_failed_push": false
  },
  "stopping_class": "workspace_fact",
  "updated_at": "timestamp"
}
```

### 4.4 L5 조건

```json
{
  "workspace_id": "uuid|null",
  "language": "ko-KR",
  "channel": "threads|null",
  "format": "short_video",
  "metric": "completion_rate|null",
  "measurement_window": { "from": "date|null", "to": "date|null" },
  "sample_size": 12,
  "approval_scope": "workspace",
  "confidence": 0.84,
  "expires_at": "timestamp|null",
  "rollback_state": "active|reverted|held"
}
```

### 4.5 U2, U3, X4 값 경계

U2에는 개인의 주 언어와 개인 선호만 둔다.

작업 공간 금지 표현은 U2가 아니라 U3의 `forbidden_phrase_set` 항목이다.

브랜드 사실, 표현 규칙, 금지 표현, 소재 권리, 타깃, 컨셉, 목표, 반입 요약은 모두 작업 공간 범위 `U3`다. 이를 담는 별도 브랜드 개체나 층은 만들지 않는다.

제작 구조·순서·길이·장면 조립법은 `X4` 스킬 층이다. X4는 U3의 브랜드 사실·금지 표현·소재 권리와 R6의 이번 요청을 덮지 않는다.

U3 금지 표현 예:

```json
{
  "item_kind": "forbidden_phrase_set",
  "stopping_class": "forbidden_phrase",
  "value": {
    "language": "ko-KR",
    "phrases": [
      { "text": "금지할 표현", "status": "confirmed" }
    ]
  }
}
```

U3 브랜드 사실 예:

```json
{
  "item_kind": "workspace_fact",
  "stopping_class": "workspace_fact",
  "value": {
    "fact_key": "service_name",
    "fact_value": "string",
    "source_refs": ["uuid"]
  }
}
```

U3 소재 권리 예:

```json
{
  "item_kind": "material_rights",
  "stopping_class": "material_rights",
  "value": {
    "material_id": "uuid",
    "rights_status": "confirmed",
    "allowed_uses": ["commercial_generation"],
    "expires_at": null
  }
}
```

## 5. 엔진 반환물 <a id="반환"></a>

### 5.1 반환 전문

```json
{
  "envelope_id": "uuid",
  "execution_id": "uuid",
  "status": "succeeded|partial|failed",
  "outputs": [
    {
      "output_id": "uuid",
      "slot": "candidate_a",
      "status": "succeeded|failed|blocked",
      "artifact": {
        "media_type": "application/json",
        "storage_ref": "opaque-ref|null",
        "content_hash": "sha256|null"
      },
      "failure": null,
      "inspection_inputs": {
        "text": "string|null",
        "material_refs": []
      }
    }
  ],
  "attempts": [
    {
      "attempt_id": "uuid",
      "provider": "provider-name",
      "model": "model-name",
      "fallback": false,
      "started_at": "timestamp",
      "finished_at": "timestamp",
      "cost_minor": 120,
      "currency": "KRW",
      "status": "succeeded"
    }
  ],
  "applied_layers": [],
  "skill_applications": [],
  "warnings": [],
  "finished_at": "timestamp"
}
```

### 5.2 부분 실패

`status=partial`일 때 outputs에는 성공과 실패가 함께 들어간다.

성공 output에는 failure가 null이다.

실패 output에는 안정 오류 코드와 재시도 가능 여부가 있다.

클라이언트는 성공분을 버리지 않는다.

### 5.3 제작 정보

각 결과는 다음을 역추적할 수 있어야 한다.

- layer_versions
- skill_id와 skill_version
- model과 provider
- fallback 여부
- cost
- inspection 결과
- source_refs
- normalization_fingerprint

### 5.4 배치별 조립 입출력과 서비스 교환 계약

#### 5.4.1 공통 경계

| 항목 | Studio 단독 | openclaw 결합 |
|---|---|---|
| 회원 정본 | Studio `studio_members` | 각 서비스 자기 회원, `external_member_links`로 명시 연결 |
| U2·U3·L5·R6 정본 | Studio | openclaw 정본, Studio는 받은 판과 R6를 불변 제작 봉투로 고정 |
| X4 | Studio의 스킬층 | Studio의 스킬층. openclaw는 스킬 원문을 실행하지 않음 |
| 채널 자격증명 | 없음 | openclaw만 소유. Studio 봉투로 전달 금지 |
| 편집실 문구 | Studio 생성·확정 | Studio 생성·확정 뒤 openclaw에 인계 |
| 성과 관찰 | 사용자가 연결한 성과 또는 선택·수정 관찰 | openclaw가 CloudEvent로 전달 |
| 실패 종착점 | Studio 다운로드·보관·재시도 | 인계 실패는 발행 실패와 분리하고 Studio 결과 보존 |

`mode`는 동작을 숨기는 플래그가 아니다. 같은 조립 엔진을 사용하되 호출 전후의 서비스 포트만 바꾼다. `standalone`에서 발행·SNS 계정·openclaw 회원을 요구하면 422 `MODE_CONTRACT_VIOLATION`이다.

#### 5.4.2 Studio 단독 조립 입력 전문

```json
{
  "envelope_id": "018f0000-0000-7000-8000-000000000001",
  "contract_version": "4.0",
  "request_id": "018f0000-0000-7000-8000-000000000002",
  "mode": "standalone",
  "source_service": "studio",
  "member": {
    "studio_member_id": "018f0000-0000-7000-8000-000000000003",
    "source_service": "studio",
    "source_member_id": null
  },
  "scope": {
    "workspace_id": "018f0000-0000-7000-8000-000000000004",
    "language": "ko-KR",
    "content_branch": "teach",
    "channel_targets": [],
    "format": "short_video"
  },
  "normalized_input": {
    "topic": "첫 숏폼",
    "purpose": "education",
    "source_refs": [],
    "raw_request_ref": "018f0000-0000-7000-8000-000000000005",
    "normalization_fingerprint": "sha256:example"
  },
  "layers": {
    "s0": [{"item_id":"s0-1","revision":7}],
    "s1": [{"item_id":"s1-1","revision":2}],
    "u2": [{"item_id":"u2-1","revision":3}],
    "u3": [{"item_id":"u3-1","revision":11}],
    "x4": [{"item_id":"x4-1","revision":4,"inspection_status":"passed"}],
    "l5": [{"item_id":"l5-1","revision":2,"approval_scope":"workspace"}],
    "r6": [{"request_adjustment_id":"r6-1","topic":"첫 숏폼","purpose":"education","constraints":[]}]
  },
  "channel_context": {
    "status": "not_applicable",
    "spec_snapshot_ids": [],
    "credential_refs": []
  },
  "cost_policy": {
    "currency": "KRW",
    "approved_ceiling_minor": 5000,
    "fallback_allowed": true
  }
}
```

단독 입력의 `channel_targets`는 편집 규격을 아직 고르지 않았으면 빈 배열이다. `credential_refs`는 언제나 빈 배열이며, 응답에도 발행 계정 필드는 없다.

#### 5.4.3 openclaw에서 Studio로 보내는 결합 요청 전문

엔드포인트는 `POST /v4/studio/combined/assembly-requests`다. `Authorization`은 회원 세션이 아니라 짧은 수명의 audience 제한 위임 토큰이고, `Idempotency-Key`, `X-Contract-Version: 4.0`, `X-Correlation-Id`가 필수다.

```json
{
  "request_id": "018f0000-0000-7000-8000-000000000101",
  "mode": "combined",
  "source_service": "openclaw",
  "source_member": {
    "openclaw_member_id": "oc-member-17",
    "member_link_id": "018f0000-0000-7000-8000-000000000102"
  },
  "source_workspace": {
    "openclaw_workspace_id": "oc-workspace-9",
    "studio_workspace_id": "018f0000-0000-7000-8000-000000000103"
  },
  "requested_projection_revisions": [
    {"layer":"U3","authority_item_id":"oc-u3-3","revision":14},
    {"layer":"L5","authority_item_id":"oc-l5-2","revision":6}
  ],
  "request_adjustment": {
    "topic": "이번 주 출시 소식",
    "purpose": "announce",
    "format": "short_video",
    "language": "ko-KR",
    "constraints": ["30초 이하"]
  },
  "channel_specs": [
    {
      "provider": "instagram",
      "surface": "reels",
      "spec_revision": "2026-08-01",
      "aspect_ratio": "9:16",
      "max_duration_seconds": 30
    }
  ],
  "credential_refs": [],
  "callback": {
    "handoff_endpoint": "https://openclaw.example/internal/studio-handoffs",
    "audience": "openclaw-studio-handoff"
  }
}
```

Studio는 `member_link_id`와 양쪽 작업 공간 매핑을 서버에서 대조한다. 요청 본문에 SNS 토큰, 쿠키, 공급자 비밀값이 있으면 422 `FORBIDDEN_CREDENTIAL_FIELD`다. 요구한 정본 판이 없으면 임의로 최신 판을 쓰지 않고 409 `PROJECTION_REVISION_MISSING`과 필요한 항목을 반환한다.

#### 5.4.4 Studio에서 openclaw로 보내는 인계 전문

```json
{
  "specversion": "1.0",
  "id": "018f0000-0000-7000-8000-000000000201",
  "source": "urn:postagi:studio-service",
  "type": "com.postagi.studio.handoff.ready.v4",
  "subject": "production/018f0000-0000-7000-8000-000000000202",
  "time": "2026-08-23T09:00:00Z",
  "datacontenttype": "application/json",
  "dataschema": "https://contracts.postagi.example/studio/handoff/4.0",
  "data": {
    "contract_version": "4.0",
    "mode": "combined",
    "handoff_id": "018f0000-0000-7000-8000-000000000203",
    "member_link_id": "018f0000-0000-7000-8000-000000000102",
    "studio_workspace_id": "018f0000-0000-7000-8000-000000000103",
    "production_id": "018f0000-0000-7000-8000-000000000202",
    "completed_original": {
      "storage_ref": "studio-object:opaque",
      "content_hash": "sha256:example",
      "media_type": "video/mp4"
    },
    "channel_packages": [
      {
        "provider": "instagram",
        "surface": "reels",
        "title": "확정 제목",
        "description": "확정 소개",
        "hashtags": ["#예시"],
        "first_comment": "확정 첫 댓글",
        "revision": 3
      }
    ],
    "production_metadata": {
      "layer_versions": {"S0":7,"S1":2,"U2":3,"U3":14,"X4":4,"L5":6,"R6":"r6-1"},
      "skill_applications": [{"skill_id":"x4-1","revision":4}],
      "model_attempt_refs": ["attempt-1"],
      "inspection_status": "passed",
      "cost_minor": 920,
      "currency": "KRW"
    },
    "observations": {
      "selected_candidate_id": "candidate-b",
      "selection_reason": "도입이 명확함",
      "edit_summary": ["두 번째 장면 길이 축소"]
    }
  }
}
```

openclaw는 `channel_packages`를 임의 재작성하지 않는다. 규격 검증 실패는 409 `CHANNEL_SPEC_DRIFT`로 반환하며 Studio 원본과 문구 판은 보존한다. 같은 CloudEvent `source`와 `id`는 같은 확인 응답을 돌려준다.

#### 5.4.5 openclaw에서 Studio로 보내는 성과 관찰 전문

```json
{
  "specversion": "1.0",
  "id": "018f0000-0000-7000-8000-000000000301",
  "source": "urn:postagi:openclaw-service",
  "type": "com.postagi.performance.observed.v4",
  "subject": "handoff/018f0000-0000-7000-8000-000000000203",
  "time": "2026-08-23T12:00:00Z",
  "datacontenttype": "application/json",
  "dataschema": "https://contracts.postagi.example/performance/4.0",
  "data": {
    "contract_version": "4.0",
    "member_link_id": "018f0000-0000-7000-8000-000000000102",
    "studio_workspace_id": "018f0000-0000-7000-8000-000000000103",
    "production_id": "018f0000-0000-7000-8000-000000000202",
    "channel": "instagram_reels",
    "published_at": "2026-08-23T09:30:00Z",
    "measurement_window": {"from":"2026-08-23T09:30:00Z","to":"2026-08-23T11:30:00Z"},
    "metrics": {"views":1200,"completion_rate":0.42,"saves":31},
    "metric_definitions_revision": "instagram-reels-2026-08",
    "sample_comparability_key": "instagram_reels:short_video:ko-KR"
  }
}
```

성과 사건 한 건은 바로 L5를 만들지 않는다. `learning_observations`에 멱등 저장하고 비교 가능한 성과 5건 조건을 충족해도 `근거 부족` 후보만 만든다. 사용자의 승낙 명령 뒤에만 L5 판을 만든다.

#### 5.4.6 응답과 오류 제약

| 경계 | 성공 | 재시도 가능 오류 | 재시도 불가 또는 사용자 결정 |
|---|---|---|---|
| 결합 조립 요청 | 202와 `operation_id` | 503 `PROJECTION_TEMPORARILY_UNAVAILABLE` | 409 `PROJECTION_REVISION_MISSING`, 422 `MEMBER_LINK_REQUIRED` |
| Studio 인계 | 200 `accepted|duplicate` | 429, 503 | 409 `CHANNEL_SPEC_DRIFT`, 422 `FORBIDDEN_CREDENTIAL_FIELD` |
| 성과 관찰 | 200 `applied|duplicate|held` | 429, 503 | 409 `UNKNOWN_PRODUCTION`, 422 `INCOMPARABLE_METRIC` |

모든 재시도는 같은 멱등 키 또는 같은 CloudEvent `source`와 `id`를 유지한다. outbox 레코드와 도메인 변경은 한 DB 트랜잭션으로 커밋한다. 소비자는 중복과 역순을 정상 입력으로 처리하고, 최대 재시도 뒤 DLQ에 넣되 멈추는 값과 일반 관찰을 다른 경보 등급으로 분리한다.

## 6. 회원과 준비 상태 API <a id="회원"></a>

### `POST /v4/studio/sessions`

목적: Studio 회원 세션을 만들거나 외부 세션을 교환한다.

요청:

```json
{
  "mode": "studio_login|external_exchange",
  "credential": "opaque",
  "source_service": "openclaw|null"
}
```

응답 201:

```json
{
  "data": {
    "member": { "id": "uuid", "status": "active" },
    "access_token": "shown-once",
    "expires_at": "timestamp"
  }
}
```

저장: `studio_members`, `member_external_mappings`, `studio_sessions`.

### `POST /v4/studio/members/provision`

목적: 합친 배치에서 openclaw가 Studio 회원을 대리 생성한다.

필요 범위: `member:provision`.

요청:

```json
{
  "source_service": "openclaw",
  "source_member_id": "string",
  "display_name": "string",
  "email_hash": "sha256|null"
}
```

같은 외부 회원은 같은 Studio 회원을 반환한다.

### `GET /v4/studio/readiness`

응답은 `plan_code`, `workspace_limit`, `active_workspace_count`, `free_actual_video_remaining`을 포함한다. 한도는 무료 1, 스타터 1, 프로 3, 기업은 협의된 값이다.

목적: 생성 전 누락 정보를 보여 준다.

질의: `workspace_id`.

응답:

```json
{
  "data": {
    "ready": false,
    "missing": [
      { "field": "workspace.voice.v3_structure", "blocking": false },
      { "field": "workspace.material_rights", "blocking": true }
    ],
    "sync": {
      "stopping_values_stale": 1,
      "non_stopping_values_stale": 0
    }
  }
}
```

## 7. 개인과 작업 공간 API <a id="범위-api"></a>

### `GET /v4/studio/profile`

목적: U2 개인 층 현재 판 조회.

응답은 각 항목의 정본, 투영 여부, 판, 갱신 시각을 포함한다.

### `PUT /v4/studio/profile`

목적: Studio가 정본인 U2 항목 새 판 생성.

요청:

```json
{
  "base_revision": 3,
  "language": "ko-KR",
  "preferences": {},
  "consent": { "learning": true }
}
```

투영본이면 409 `AUTHORITY_REMOTE`와 정본 서비스 편집 정보를 반환한다.

### `POST /v4/studio/workspaces`

목적: 작업 공간 개체 생성.

요청:

```json
{
  "name": "작업 공간 이름",
  "default_language": "ko-KR",
  "authority_service": "studio"
}
```

응답 201은 workspace_id를 준다.

활성 또는 삭제 중 작업 공간이 한도에 닿으면 409 `WORKSPACE_LIMIT_REACHED`다.

### `GET /v4/studio/workspaces`

목적: 회원이 접근 가능한 작업 공간 목록.

다른 회원의 작업 공간은 반환하지 않는다.

### `GET /v4/studio/workspaces/{workspaceId}`

목적: 작업 공간 현재 값, 정본, 동기화 상태 조회.

### `PATCH /v4/studio/workspaces/{workspaceId}`

목적: 이름, 상태, 기본 언어 변경.

`If-Match` 필수.

### `POST /v4/studio/workspaces/{workspaceId}/copies`

목적: 다른 작업 공간 값을 자동 상속하지 않고 명시적으로 복사한다.

요청:

```json
{
  "target_workspace_id": "uuid",
  "item_ids": ["uuid"],
  "copy_mode": "independent"
}
```

새 항목과 판을 만들고 `copied_from_item_id`를 남긴다.

### `DELETE /v4/studio/workspaces/{workspaceId}`

목적: 작업 공간 tombstone 생성.

응답 202는 삭제 작업 식별자를 준다.

### `PUT /v4/studio/workspaces/{workspaceId}/brief`

목적: 작업 공간 `U3` 구조화 정보의 새 판 생성.

요청:

```json
{
  "workspace_facts": [{ "key": "service_name", "value": "string", "source_refs": ["uuid"] }],
  "target": "string",
  "concept": "string",
  "goal": "string",
  "expression_rules": ["string"],
  "forbidden_phrases": ["string"],
  "material_rights_refs": ["uuid"],
  "free_note": "string|null"
}
```

`If-Match`에 현재 U3 판을 보낸다. 브랜드 개체 식별자는 받지 않는다.

### `POST /v4/studio/material-imports`

목적: URL, 문서, 텍스트를 자료 후보로 반입하고 권리와 출처를 확인한다.

요청:

```json
{
  "workspace_id": "uuid",
  "source": {
    "kind": "url|document|text",
    "uri": "https://example.com|null",
    "upload_ref": "opaque|null",
    "text": "string|null"
  },
  "rights_declaration": {
    "owner": "member|licensed|unknown",
    "commercial_use": true,
    "license": "string|null"
  }
}
```

응답 202:

```json
{
  "data": {
    "import_id": "uuid",
    "status": "queued",
    "operation_id": "uuid"
  }
}
```

권리 미확인은 자료 저장은 허용하되 제작 봉투 사용을 막는다.

저장: `material_imports`, `layer_revision_sources`, 승인 뒤 U3 또는 U3 판.

### `GET /v4/studio/references`

목적: 작업 공간, 언어, 채널, 형식에 맞는 실제 사례와 S1 신호를 조회한다.

필수 질의: `workspace_id`, `language`, `channel`, `format`.

응답 항목:

```json
{
  "id": "uuid",
  "title": "string",
  "source_url": "https://example.com",
  "source_checked_at": "timestamp",
  "valid_until": "timestamp",
  "reason": "왜 이 작업에 참고하는지",
  "signal_revision": 4
}
```

만료 S1은 기본 응답에서 제외한다.

`include_expired=true`는 운영자만 쓴다.

## 8. U3 표현 규칙과 멈춤 값 API <a id="목소리-api"></a>

### `GET /v4/studio/workspaces/{workspaceId}/context`

목적: U3의 브랜드 사실, 표현 규칙, 금지 표현, 소재 권리, 목표, 자유 서술과 각 판의 최신성 조회.

### `PUT /v4/studio/workspaces/{workspaceId}/context`

요청:

```json
{
  "workspace_facts": [{ "key": "service_name", "value": "string", "source_refs": ["uuid"] }],
  "expression_rules": ["존댓말을 쓰되 지나친 가격 표현은 피한다"],
  "forbidden_phrases": ["무조건 성공"],
  "material_rights_refs": ["uuid"],
  "goals": ["입문자 이해"],
  "free_note": "차분하지만 답답하지 않게"
}
```

서버는 사실·권리 참조를 검증하고 새 `U3` 판을 만든다. 자유 서술은 구조화 필드를 덮어쓰지 않는다.

### `POST /v4/studio/workspaces/{workspaceId}/forbidden-phrases/translate`

목적: 원문 금지 표현을 대상 언어 후보로 번역하고 사람 확인 전 보류한다.

요청:

```json
{
  "source_language": "ko-KR",
  "target_languages": ["en-US", "ja-JP"],
  "phrases": ["string"]
}
```

응답에는 후보와 상태 `pending_review`가 있다.

확인 전에는 멈추는 값 정본에 승격하지 않는다.

### `POST /v4/studio/workspaces/{workspaceId}/pending-outputs/recheck`

목적: 새 금지 표현으로 발행 대기 결과를 다시 검사한다.

응답은 결과별 `clear|blocked`와 걸린 표현을 준다.

## 9. 스킬 API <a id="스킬-api"></a>

### `POST /v4/studio/skills/inspections`

목적: 업로드 스킬을 실행 전에 검사한다.

요청은 원문 저장 참조, X4 조립 선언, 파일·명령·네트워크 권한 목록을 포함한다.

응답:

```json
{
  "data": {
    "inspection_id": "uuid",
    "status": "accepted|rejected|held|downgraded",
    "checks": [
      { "name": "s0_bypass", "result": "pass" },
      { "name": "identity_impersonation", "result": "pass" },
      { "name": "undeclared_force", "result": "downgraded" },
      { "name": "license", "result": "held" },
      { "name": "runtime_permission", "result": "pass" }
    ]
  }
}
```

### `POST /v4/studio/skills`

목적: 검사 통과 또는 승인된 스킬 판 등록.

선언 여덟 칸이 모두 필요하다.

### `GET /v4/studio/skills/{skillId}/versions/{revision}`

목적: 과거 결과 계보를 위한 불변 판 조회.

### `POST /v4/studio/productions/{jobId}/skill-resolution`

목적: 봉투의 채움 상태와 스킬 default, force를 적용한다.

응답은 필드별 판정을 준다.

```json
{
  "data": {
    "applications": [
      {
        "field": "voice.v3_structure.intro",
        "user_filled": false,
        "skill_mode": "default",
        "action": "applied",
        "reason": "사용자가 구조 칸을 비움"
      },
      {
        "field": "voice.v1_style.formality",
        "user_filled": true,
        "skill_mode": "default",
        "action": "skipped",
        "reason": "회원 값 유지"
      }
    ]
  }
}
```

## 10. 생성 API <a id="생성-api"></a>

### `POST /v4/studio/proposal-sets`

목적: 사례와 스타일 제안 묶음을 만든다.

요청:

```json
{
  "workspace_id": "uuid",
  "topic": "string",
  "language": "ko-KR",
  "channel": "threads",
  "format": "short_video",
  "source_refs": []
}
```

응답 202는 proposal_set_id와 operation_id를 준다.

### `POST /v4/studio/proposal-sets/{proposalSetId}/retry`

목적: 전체 거절 후 새 제안 묶음을 만든다.

무료 왕복 횟수와 비용 승인을 먼저 검사한다.

### `POST /v4/studio/production-estimates`

목적: 공급자 호출 전 비용과 시간을 산정한다.

응답:

```json
{
  "data": {
    "estimate_id": "uuid",
    "currency": "KRW",
    "min_minor": 1200,
    "max_minor": 4800,
    "recommended_ceiling_minor": 5000,
    "estimated_seconds_min": 60,
    "estimated_seconds_max": 300,
    "assumptions": []
  }
}
```

### `POST /v4/studio/productions`

목적: 비용 승인 뒤 작업을 만든다.

요청:

```json
{
  "proposal_set_id": "uuid",
  "estimate_id": "uuid",
  "approved_ceiling_minor": 5000,
  "consent": {
    "store_raw_request": true,
    "learning": false
  }
}
```

응답 201은 job_id와 초기 상태를 준다.

무료 회원의 첫 실제 영상 한 편은 `entitlement=free_actual_video_1`로 소비한다. 최종 출력 계약은 `width=1080`, `height=1920`, `fps=30`, `target_duration_seconds=90`이며 렌더 성공 전에는 사용량을 확정 차감하지 않는다.

### `PUT /v4/studio/productions/{jobId}/request-adjustment`

목적: R6 이번 요청 조정을 저장한다.

R6는 일반 층 항목으로 승격하지 않는다.

### `POST /v4/studio/productions/{jobId}/assemble`

목적: 판을 고정하고 봉투를 만든다.

멈추는 값이 오래되었고 밀기 실패 이력이 있으면 409다.

### `POST /v4/studio/productions/{jobId}/conflicts/resolve`

목적: 자동 해소할 수 없는 충돌에 사용자 선택을 저장한다.

요청은 `conflict_id`, `choice`, `note`를 가진다.

choice는 `keep_higher_priority|use_request_value|merge|cancel` 중 서버가 제시한 값만 허용한다.

### `POST /v4/studio/productions/{jobId}/execute-previews`

목적: 무상태 엔진 실행을 큐에 넣는다.

응답 202.

### `GET /v4/studio/productions/{jobId}/skill-plan`

목적: 실행 전에 적용할 스킬 이름표, 판, 읽기와 쓰기 필드, 예상 적용을 보여 준다.

응답은 스킬 본문 전체가 아니라 회원 권한에 맞는 설명과 무결성 지문을 준다.

### `GET /v4/studio/productions/{jobId}`

목적: 작업과 결과별 상태 조회.

부분 성공이면 HTTP 200과 `status=partial`을 쓴다.

### `POST /v4/studio/productions/{jobId}/selections`

목적: 후보 선택과 선택 이유를 저장한다.

요청:

```json
{
  "selected_output_id": "uuid",
  "reason_axes": ["hook", "structure"],
  "note": "string|null"
}
```

### `GET /v4/studio/workspaces/{workspaceId}/learning-candidates`

목적: 같은 선택 3회 또는 비교 가능한 성과 5건에서 나온 후보를 조회한다. 임계 전에는 빈 목록이다. 응답 카드는 `evidence_kind`, `evidence_count`, `evidence_refs`, `notice="근거 부족"`을 포함한다.

### `POST /v4/studio/learning-candidates/{candidateId}/accept`

목적: 회원이 후보를 승낙하고 작업 공간 범위 L5 새 판을 만든다.

```json
{
  "edited_rule": {},
  "acknowledged_notice": "근거 부족"
}
```

후보 상태 변경, L5 항목·판, 승낙 사건을 한 트랜잭션으로 저장한다.

### `POST /v4/studio/learning-candidates/{candidateId}/reject`

목적: 후보를 거절하되 관찰 근거를 보존한다. L5 판은 만들지 않는다.

### `POST /v4/studio/productions/{jobId}/promotions`

목적: 선택 후보 하나를 고해상도로 승격한다.

### `POST /v4/studio/outputs/{outputId}/inspections`

목적: 저장된 결과를 최신 봉투 규칙으로 재검사한다.

### `GET /v4/studio/productions/{jobId}/provenance`

목적: 항목 판, 스킬 판, 모델, 비용, 결과 계보 조회.

### `POST /v4/studio/productions/{jobId}/disposition`

요청 action은 `confirm|archive|request_alternatives`다.

### `POST /v4/studio/productions/{jobId}/resume`

목적: 만료되지 않은 실행 공간 또는 불변 봉투로 재개한다.

### `POST /v4/studio/handoffs`

목적: 성공 결과와 제작 정보를 openclaw 편집 또는 발행 흐름에 인계한다.

인계는 참조를 보내며 Studio 결과를 조용히 변형하지 않는다.

### `POST /v4/studio/edits`

목적: 선택한 생성 결과를 부모로 삼아 편집 작업을 연다.

```json
{
  "workspace_id": "uuid",
  "parent_output_id": "uuid",
  "channel_targets": ["instagram_reels"],
  "mode": "standalone|combined"
}
```

201 응답은 `edit_id`, `parent_output_id`, `recipe_revision`, `status=ready`를 반환한다. 부모 결과가 회원 작업 공간 밖이면 404다.

### `POST /v4/studio/edits/{editId}/instructions`

목적: 대화 지시, 선택지, 직접 조작을 동일한 순서 사건으로 저장한다.

```json
{
  "instruction_type": "prompt|choice|direct_manipulation",
  "sequence": 7,
  "payload": {
    "text": "말투를 더 짧게",
    "target_refs": ["scene-2"],
    "geometry": null
  },
  "base_recipe_revision": 5
}
```

`sequence` 중복은 같은 지문이면 기존 응답, 다른 지문이면 409 `INSTRUCTION_SEQUENCE_CONFLICT`다.

### `POST /v4/studio/edits/{editId}/render`

목적: 영향 범위를 계산해 로컬 재렌더 또는 필요한 컷만 생성한다.

```json
{
  "instruction_through_sequence": 7,
  "render_scope": "auto|local_only|regenerate_affected",
  "approved_ceiling_minor": 800
}
```

202 응답은 `operation_id`, `affected_scene_ids`, `estimated_cost_minor`, `status_url`을 반환한다. 전체 원본을 새 작업으로 바꾸지 않고 부모와 결과 계보를 연결한다.

### `POST /v4/studio/channel-spec-snapshots`

목적: 계정 연결 없이 선택 채널의 공개 규격 판을 편집실에 고정한다.

```json
{
  "workspace_id": "uuid",
  "targets": [
    {"provider":"instagram","surface":"reels","spec_revision":"2026-08-01"}
  ]
}
```

자격증명과 계정 식별자는 받지 않는다. 결합 모드에서도 openclaw가 규격만 전달한다.

### `POST /v4/studio/outputs/{outputId}/channel-packages`

목적: Studio 편집실이 제목, 소개, 해시태그, 첫 댓글을 채널별로 만들고 판을 확정한다.

```json
{
  "spec_snapshot_id": "uuid",
  "targets": ["instagram_reels"],
  "fields": ["title","description","hashtags","first_comment"],
  "base_output_revision": 3
}
```

201 응답은 채널별 `package_id`, `revision`, 네 문구 필드, `inspection_status`를 반환한다. openclaw는 이 판을 발행하되 임의로 다시 쓰지 않는다.

## 11. 동기화 API <a id="동기화-api"></a>

### 11.1 사건 형식

CloudEvents 필수 문맥을 사용한다.

```json
{
  "specversion": "1.0",
  "id": "uuid",
  "source": "urn:postagi:openclaw-service",
  "type": "com.postagi.layer.revision.pushed",
  "subject": "layer-item/external-id",
  "time": "timestamp",
  "datacontenttype": "application/json",
  "dataschema": "https://contracts.postagi.example/layers/4.0",
  "data": {
    "contract_version": "4.0",
    "authority_service": "openclaw",
    "member_id": "external-member-id",
    "workspace_id": "external-workspace-id|null",
    "item_id": "external-item-id",
    "layer": "U3",
    "item_kind": "workspace_fact",
    "revision": 14,
    "stopping_class": "workspace_fact",
    "operation": "upsert|delete",
    "value": {},
    "authority_updated_at": "timestamp"
  }
}
```

### `POST /v4/studio/sync/events`

목적: openclaw 정본 변경을 Studio로 민다.

필요 범위: `layers:push`.

응답:

```json
{
  "data": {
    "event_id": "uuid",
    "status": "applied|duplicate|rejected|held",
    "local_item_id": "uuid|null",
    "applied_revision": 14,
    "acknowledged_at": "timestamp"
  }
}
```

같은 source와 id는 같은 처리 결과를 반환한다.

### `POST /v4/studio/sync/comparisons`

목적: 계약이 허용한 세 경우에 특정 항목 판을 대조한다.

요청:

```json
{
  "reason": "failed_delivery_recovery|member_requested_recovery|contract_major_crosscheck",
  "items": [
    {
      "authority_service": "openclaw",
      "authority_item_id": "string",
      "local_revision": 13
    }
  ]
}
```

다른 reason은 422다.

### `GET /v4/studio/sync/status`

질의는 `workspace_id`다.

응답은 항목별 정본, 적용 판, 마지막 성공, 실패 이력, 재시도 상태, 오래됨을 준다.

### 확인 응답 규칙

- 정본 판보다 큰 판을 요구하지 않는다.
- 적용 성공 뒤에만 applied를 반환한다.
- 저장은 성공했지만 후속 색인이 실패하면 `applied_with_warning`이 아니라 `applied`와 별도 warning을 쓴다.
- 매핑 충돌이면 held로 두고 자동으로 새 항목을 만들지 않는다.

### 재시도 규칙

- 지수 백오프와 jitter를 사용한다.
- 동일 사건 id를 유지한다.
- 최대 시도 뒤 사망 편지 대기열로 이동한다.
- 멈추는 값은 높은 우선순위 알림을 만든다.
- 소비자는 중복을 정상으로 취급한다.

## 12. 삭제와 충돌 API <a id="삭제-api"></a>

### 삭제 사건

동기화 사건의 operation이 delete면 value는 없어야 한다.

다음은 필수다.

```json
{
  "operation": "delete",
  "revision": 15,
  "deleted_at": "timestamp",
  "deletion_reason": "user_request|authority_deleted|account_closed"
}
```

### `POST /v4/studio/reconciliations`

목적: 독립 Studio와 openclaw 연결 시 자동 병합하지 않고 조정 세션을 만든다.

응답은 항목별 양쪽 값과 추천을 주되 선택하지 않는다.

### `POST /v4/studio/reconciliations/{id}/decisions`

action은 `choose_studio|choose_openclaw|keep_both|hold`다.

결정은 새 정본 판 또는 매핑을 만든다.

과거 판을 덮지 않는다.

## 13. 상태 기계와 사건 <a id="상태"></a>

### 13.1 작업 상태

| 상태 | 들어오는 명령 | 나가는 상태 |
|---|---|---|
| accepted | assemble | waiting_sync, waiting_cost, queued |
| waiting_sync | sync ack, cancel | queued, blocked_stale, canceled |
| waiting_cost | approve, cancel | queued, canceled |
| queued | worker claim, cancel | running, canceled |
| running | result | succeeded, partial, failed |
| partial | retry failed, decide | running, succeeded, failed |
| succeeded | handoff, archive | handed_off, archived |
| failed | retry, archive | queued, archived |
| blocked_stale | sync repaired, cancel | queued, canceled |

정의되지 않은 전이는 409 `STATE_CONFLICT`다.

### 13.2 결과 상태

`queued`, `running`, `succeeded`, `failed`, `blocked`, `rejected_quality`, `archived`.

작업 상태와 결과 상태를 한 열거값으로 섞지 않는다.

### 13.3 외부 사건

| 사건 | 생산자 | 소비자 |
|---|---|---|
| layer.revision.pushed | 정본 서비스 | Studio SyncReceiver |
| layer.deleted | 정본 서비스 | Studio SyncReceiver |
| production.started | Studio | 운영 관측 |
| production.partial | Studio | studio-web, openclaw 선택 |
| production.succeeded | Studio | studio-web |
| handoff.ready | Studio | openclaw |

## 14. 흐름 대 엔드포인트 매핑 <a id="매핑"></a>

| 시험 | 사용자 또는 시스템 행위 | 엔드포인트 | 화면 구성요소 | 저장 검증 |
|---|---|---|---|---|
| FLOW-01 | Studio 세션 시작 | `POST /v4/studio/sessions` | `StudioAuthGate` | `studio_sessions` |
| FLOW-02 | 작업 공간 목록과 현재 공간 선택 | `GET /v4/studio/workspaces` | `WorkspaceSwitcher` | `workspaces`, `member_workspace_roles` |
| FLOW-03 | 작업 공간 생성, 글·영상 갈래만 선택 | `POST /v4/studio/workspaces` | `WorkspaceStartPicker` | `workspaces`, `layer_items`, `layer_revisions` |
| FLOW-04 | 학습 정보 열람·수정 | `GET /v4/studio/workspaces/{workspaceId}/layers`, `POST /v4/studio/layer-items/{itemId}/revisions` | `LearningInfoPanel` | `layer_items`, `layer_revisions` |
| FLOW-05 | 소재·참고자료 반입 | `POST /v4/studio/material-imports` | `MaterialImportReview` | `material_imports`, 승인 뒤 `layer_items`, `layer_revisions` |
| FLOW-06 | 근거 있는 사례와 추천 3개 조회 | `POST /v4/studio/proposal-sets` | `DisplayProposalDeck` | `reference_views`, `proposal_sets`, `production_outputs` |
| FLOW-07 | 비용·시간 범위 확인 | `POST /v4/studio/production-estimates` | `CostTimeApproval` | `cost_entries` |
| FLOW-08 | 제작 작과 R6 생성 | `POST /v4/studio/productions` | `GenerationProgress` | `production_jobs`, `request_adjustments` |
| FLOW-09 | 일곱 층 조립과 사실 충돌 판정 | `POST /v4/studio/productions/{jobId}/assemble` | `ConflictQuestion` | `production_envelopes`, `production_conflicts` |
| FLOW-10 | 저해상도 후보 3개 실행 | `POST /v4/studio/productions/{jobId}/execute-previews` | `DisplayLoadingState` | `production_attempts`, `production_outputs`, `cost_entries` |
| FLOW-11 | 세 후보 전부 거절 후 재요청 | `POST /v4/studio/proposal-sets/{setId}/retry` | `ProposalRetryAction` | `proposal_sets`, `production_attempts` |
| FLOW-12 | 후보 하나와 이유 선택 | `POST /v4/studio/productions/{jobId}/selections` | `CandidateChooser` | `production_decisions`, `learning_observations` |
| FLOW-13 | 선택 후보만 고품질 승격 | `POST /v4/studio/productions/{jobId}/promotions` | `PromotionProgress` | `production_outputs`, `production_attempts`, `cost_entries` |
| FLOW-14 | 품질·금지 표현·사실·권리 검사 | `POST /v4/studio/outputs/{outputId}/inspections` | `QualityGateResult` | `output_inspections` |
| FLOW-15 | 확정·보관·다른 제안 선택 | `POST /v4/studio/productions/{jobId}/disposition` | `ResultDispositionBar` | `production_jobs`, `production_decisions` |
| FLOW-16 | 편집실에서 부모 결과 열기 | `POST /v4/studio/edits` | `EditPreview` | `edit_jobs`, `production_outputs`, `production_recipes` |
| FLOW-17 | 대화·선택·직접 조작 편집 지시 | `POST /v4/studio/edits/{editId}/instructions` | `EditInstructionPanel` | `edit_instructions` |
| FLOW-18 | 영향 컷만 재생성 또는 로컬 재렌더 | `POST /v4/studio/edits/{editId}/render` | `EditRenderProgress` | `production_attempts`, `production_outputs`, `cost_entries` |
| FLOW-19 | 세부 채널 규격 받기, 계정 연결은 안 함 | `POST /v4/studio/channel-spec-snapshots` | `ChannelTargetPicker` | `channel_spec_projections` |
| FLOW-20 | 제목·소개·해시태그·첫 댓글 생성 | `POST /v4/studio/outputs/{outputId}/channel-packages` | `ChannelCopyEditor` | `channel_text_packages`, `channel_text_revisions` |
| FLOW-21 | 완성 원본·문구·제작 정보 인계 | `POST /v4/studio/handoffs` | `HandoffStatus` | `handoff_records`, `production_outputs` |
| FLOW-22 | 발행 시점에 채널 연결 | `POST /api/connect/{provider}` | `ChannelConnect` | openclaw `channel_accounts` |
| FLOW-23 | 지금 발행·승인 보관·예약 | `POST /api/publish`, `POST /api/schedule` | `PublishOptions` | openclaw `schedules`, `published_posts` |
| FLOW-24 | 성과 조회 | `GET /api/analytics` | `PerformanceRoom` | openclaw `published_posts`, `growth_metrics` |
| FLOW-25 | 선택·수정·성과 관찰 밀기 | `POST /v4/studio/sync/events` | `LearningInfoBadge` | `sync_inbox`, `learning_observations` |
| FLOW-26 | 3회 선택 또는 5건 성과 후 후보 제시 | `GET /v4/studio/workspaces/{workspaceId}/learning-candidates` | `LearningCandidateCard` | `learning_candidates` |
| FLOW-27 | 후보 승낙, L5 판 생성 | `POST /v4/studio/learning-candidates/{candidateId}/accept` | `LearningConsentAction` | `learning_candidates`, `layer_items`, `layer_revisions` |
| FLOW-28 | 후보 거절, 관찰 보존 | `POST /v4/studio/learning-candidates/{candidateId}/reject` | `LearningRejectAction` | `learning_candidates`, `learning_observations` |
| FLOW-29 | 되돌리기, 원본 보존·앞 방 항목 추가 | `POST /v4/studio/productions/{jobId}/forks` | `RollbackBanner` | `production_jobs`, `provenance_events` |
| FLOW-30 | 새 브랜드·언어·취향용 작업 공간 복제 | `POST /v4/studio/workspaces/{workspaceId}/copies` | `WorkspaceCopyAction` | `workspaces`, `layer_items`, `layer_revisions` |
| FLOW-31 | 정본 판·삭제를 투영 서비스로 밀기 | `POST /v4/studio/sync/events` | `SyncStatusBadge` | `sync_outbox`, `sync_inbox`, `sync_mappings` |
| FLOW-32 | 작업 공간 삭제 전파와 새 작 차단 | `DELETE /v4/studio/workspaces/{workspaceId}` | `WorkspaceDeleteConfirm` | `workspaces`, `sync_outbox`, `projection_sync_states` |


전체 단계 32, 엔드포인트 빈칸 0, 화면 구성요소 빈칸 0, 저장 대상 빈칸 0, 매핑 gap 0.

### 14.1 32행 실행 계약 전수표

공통 성공 봉투는 §1.2, 공통 오류와 멱등성은 §3을 따른다. 아래 request와 success는 각 행의 `data` 최소 계약이다. `idem=필수`인 명령은 `Idempotency-Key`가 없으면 400, 같은 키와 다른 지문이면 409다. 401·403·404는 모든 회원 범위 endpoint에 공통이다.

| FLOW | endpoint와 목적 | request JSON 최소 계약 | success JSON 최소 계약 | 고유 오류·멱등성 |
|---|---|---|---|---|
| 01 | `POST /v4/studio/sessions`, 세션 시작 | `{"mode":"studio_login","credential":"opaque"}` | `{"session_id":"uuid","member_id":"uuid","expires_at":"timestamp"}` | 401 `INVALID_CREDENTIAL`, idem=필수 |
| 02 | `GET /v4/studio/workspaces`, 목록 | `{"cursor":null}` | `{"items":[],"next_cursor":null}` | 읽기, idem=해당 없음 |
| 03 | `POST /v4/studio/workspaces`, 공간 생성 | `{"name":"string","content_branch":"teach","default_language":"ko-KR"}` | `{"workspace_id":"uuid","status":"active"}` | 409 `WORKSPACE_LIMIT_REACHED`, idem=필수 |
| 04 | `GET /v4/studio/workspaces/{workspaceId}/layers`, 층 조회<br>`POST /v4/studio/layer-items/{itemId}/revisions`, 새 판 | `{"layers":["S0","S1","U2","U3","X4","L5"]}`<br>`{"value_schema":"string","value":{},"base_revision":3}` | `{"items":[]}`<br>`{"revision_id":"uuid","revision":4}` | 409 `REVISION_CONFLICT`, POST idem=필수 |
| 05 | `POST /v4/studio/material-imports`, 자료 반입 | `{"workspace_id":"uuid","source":{"kind":"url","uri":"https://example.com"},"rights_declaration":{"owner":"member","commercial_use":true}}` | `{"import_id":"uuid","status":"queued"}` | 422 `RIGHTS_DECLARATION_REQUIRED`, idem=필수 |
| 06 | `POST /v4/studio/proposal-sets`, 사례·후보 3개 | `{"workspace_id":"uuid","topic":"string","language":"ko-KR","source_refs":[]}` | `{"proposal_set_id":"uuid","proposals":[{},{},{}]}` | 422 `INSUFFICIENT_REFERENCE`, idem=필수 |
| 07 | `POST /v4/studio/production-estimates`, 견적 | `{"workspace_id":"uuid","format":"short_video","quality":"preview"}` | `{"estimate_id":"uuid","cost_minor":500,"duration_seconds":60}` | 422 `UNSUPPORTED_FORMAT`, idem=필수 |
| 08 | `POST /v4/studio/productions`, 작업·R6 | `{"workspace_id":"uuid","proposal_set_id":"uuid","request_adjustment":{}}` | `{"job_id":"uuid","status":"accepted"}` | 409 `COST_APPROVAL_REQUIRED`, idem=필수 |
| 09 | `POST /v4/studio/productions/{jobId}/assemble`, 봉투 고정 | `{"expected_layer_revisions":{},"approved_cost_ceiling_minor":5000}` | `{"envelope_id":"uuid","status":"assembled","conflicts":[]}` | 409 `FACT_CONFLICT`, idem=필수 |
| 10 | `POST /v4/studio/productions/{jobId}/execute-previews`, 후보 실행 | `{"envelope_id":"uuid","candidate_count":3}` | `{"operation_id":"uuid","status":"queued"}` | 409 `ENVELOPE_MISMATCH`, idem=필수 |
| 11 | `POST /v4/studio/proposal-sets/{setId}/retry`, 후보 재요청 | `{"reason":"all_rejected","adjustment":{}}` | `{"proposal_set_id":"uuid","retry_of":"uuid"}` | 409 `RETRY_NOT_ALLOWED`, idem=필수 |
| 12 | `POST /v4/studio/productions/{jobId}/selections`, 후보 선택 | `{"selected_output_id":"uuid","reason_axes":[],"note":null}` | `{"decision_id":"uuid","status":"selected"}` | 409 `OUTPUT_NOT_SELECTABLE`, idem=필수 |
| 13 | `POST /v4/studio/productions/{jobId}/promotions`, 선택본 승격 | `{"selected_output_id":"uuid","quality":"final"}` | `{"operation_id":"uuid","status":"queued"}` | 409 `SELECTION_REQUIRED`, idem=필수 |
| 14 | `POST /v4/studio/outputs/{outputId}/inspections`, 출력 검사 | `{"inspection_types":["safety","facts","rights"]}` | `{"inspection_id":"uuid","result":"passed","blocking":false}` | 409 `OUTPUT_NOT_FINAL`, idem=필수 |
| 15 | `POST /v4/studio/productions/{jobId}/disposition`, 결과 처분 | `{"action":"confirm","output_id":"uuid"}` | `{"job_id":"uuid","status":"succeeded"}` | 409 `STATE_CONFLICT`, idem=필수 |
| 16 | `POST /v4/studio/edits`, 편집 작업 열기 | `{"workspace_id":"uuid","parent_output_id":"uuid","mode":"standalone"}` | `{"edit_id":"uuid","recipe_revision":1,"status":"ready"}` | 409 `OUTPUT_NOT_EDITABLE`, idem=필수 |
| 17 | `POST /v4/studio/edits/{editId}/instructions`, 편집 지시 | `{"instruction_type":"prompt","sequence":1,"payload":{},"base_recipe_revision":1}` | `{"instruction_id":"uuid","sequence":1}` | 409 `INSTRUCTION_SEQUENCE_CONFLICT`, idem=필수 |
| 18 | `POST /v4/studio/edits/{editId}/render`, 영향 렌더 | `{"instruction_through_sequence":1,"render_scope":"auto","approved_ceiling_minor":800}` | `{"operation_id":"uuid","affected_scene_ids":[],"status":"queued"}` | 409 `RECIPE_REVISION_CONFLICT`, idem=필수 |
| 19 | `POST /v4/studio/channel-spec-snapshots`, 규격 고정 | `{"workspace_id":"uuid","targets":[{"provider":"instagram","surface":"reels","spec_revision":"2026-08-01"}]}` | `{"snapshot_ids":["uuid"]}` | 422 `ACCOUNT_CREDENTIAL_FORBIDDEN`, idem=필수 |
| 20 | `POST /v4/studio/outputs/{outputId}/channel-packages`, 문구 확정 | `{"spec_snapshot_id":"uuid","targets":["instagram_reels"],"fields":["title","description","hashtags","first_comment"]}` | `{"packages":[{"package_id":"uuid","revision":1}]}` | 409 `CHANNEL_SPEC_DRIFT`, idem=필수 |
| 21 | `POST /v4/studio/handoffs`, openclaw 인계 | `{"production_id":"uuid","output_ids":["uuid"],"channel_package_ids":["uuid"]}` | `{"handoff_id":"uuid","status":"queued"}` | 422 `MODE_CONTRACT_VIOLATION`, idem=필수 |
| 22 | openclaw `POST /api/connect/{provider}`, 발행 시 연결 | `{"redirect_uri":"https://app.example/callback"}` | `{"connection_id":"string","status":"connected"}` | openclaw 정본, 409 `ALREADY_CONNECTED`, idem=필수 |
| 23 | openclaw `POST /api/publish`, 즉시 발행<br>`POST /api/schedule`, 예약·보관 | `{"handoff_id":"uuid","channel_account_id":"string"}`<br>`{"handoff_id":"uuid","publish_at":"timestamp"}` | `{"published_post_id":"string","external_url":"https://example.com"}`<br>`{"schedule_id":"string","status":"scheduled"}` | openclaw 정본, 409 `DUPLICATE_PUBLICATION`, idem=필수 |
| 24 | openclaw `GET /api/analytics`, 성과 조회 | `{"published_post_id":"string","window":{"from":"timestamp","to":"timestamp"}}` | `{"metrics":{},"metric_definitions_revision":"string"}` | openclaw 정본, 422 `INCOMPARABLE_METRIC`, idem=해당 없음 |
| 25 | `POST /v4/studio/sync/events`, 관찰 수신 | `{"specversion":"1.0","id":"uuid","source":"urn:postagi:openclaw-service","type":"com.postagi.performance.observed.v4","data":{}}` | `{"event_id":"uuid","status":"applied"}` | idem=source+id, 다른 지문은 409 |
| 26 | `GET /v4/studio/workspaces/{workspaceId}/learning-candidates`, 후보 조회 | `{"status":"pending"}` | `{"items":[]}` | 임계 전 빈 배열, idem=해당 없음 |
| 27 | `POST /v4/studio/learning-candidates/{candidateId}/accept`, L5 승낙 | `{"edited_rule":{},"acknowledged_notice":"근거 부족"}` | `{"candidate_id":"uuid","layer_revision_id":"uuid","status":"accepted"}` | 409 `CANDIDATE_ALREADY_DECIDED`, idem=필수 |
| 28 | `POST /v4/studio/learning-candidates/{candidateId}/reject`, 후보 거절 | `{"reason":"not_relevant"}` | `{"candidate_id":"uuid","status":"rejected"}` | 409 `CANDIDATE_ALREADY_DECIDED`, idem=필수 |
| 29 | `POST /v4/studio/productions/{jobId}/forks`, 원본 보존 되돌리기 | `{"from_output_id":"uuid","return_to":"generation","adjustment":{}}` | `{"job_id":"uuid","forked_from_job_id":"uuid","status":"accepted"}` | 409 `FORK_SOURCE_INVALID`, idem=필수 |
| 30 | `POST /v4/studio/workspaces/{workspaceId}/copies`, 독립 복제 | `{"name":"string","item_ids":["uuid"],"copy_mode":"independent"}` | `{"workspace_id":"uuid","copied_item_ids":[]}` | 409 `WORKSPACE_LIMIT_REACHED`, idem=필수 |
| 31 | `POST /v4/studio/sync/events`, 정본 판·삭제 밀기 | `{"specversion":"1.0","id":"uuid","source":"urn:postagi:studio-service","type":"com.postagi.layer.revision.pushed","data":{}}` | `{"event_id":"uuid","status":"applied"}` | idem=source+id, 역순은 409 `REVISION_OUT_OF_ORDER` |
| 32 | `DELETE /v4/studio/workspaces/{workspaceId}`, 삭제 전파 | `{"deletion_reason":"user_request"}` | `{"operation_id":"uuid","status":"deletion_pending"}` | 409 `ACTIVE_PRODUCTION_EXISTS`, idem=필수 |

전수 판정: FLOW 32/32가 목적, request JSON, success JSON, 오류, 멱등성, 저장 정본을 가진다. Studio endpoint 계약 29행, openclaw 외부 계약 3행이며 gap은 0이다.

## 15. 하위 호환과 전환 <a id="호환"></a>

### 15.1 판 규칙

API 경로 주 번호와 의미 계약 판을 구분한다.

`/v4`는 현재 통신 표면이다.

`X-Contract-Version: 4.0`은 층 의미와 동기화 의미다.

같은 주 번호에서 선택 필드 추가는 허용한다.

필수 필드 삭제나 의미 변경은 새 주 번호다.

### 15.2 두 판 동시 수용

현재 v4와 직전 v3 해석기를 D-04가 정한 창 동안 함께 둔다. 직전 판의 실제 호출량이 0이고 낮은 판 재전송·롤백 훈련이 통과하면 해석기를 제거한다. 제거 시각은 API 응답과 운영 알림에 표시한다.

### 15.3 기존 경로 어댑터

| 기존 | 새 호출 | 보존 |
|---|---|---|
| GET brand-setup | GET workspace context | 기존 prompt_guide 읽기 모양 |
| POST brand-setup | PUT workspace context, U3 항목 판 | 기존 위저드 입력. `brand` 개체는 생성하지 않음 |
| POST text | POST productions와 execute | 기존 플랫폼 변형 응답 |
| GET drafts | GET productions | 최근 50과 평탄 응답 |
| POST drafts | disposition 또는 legacy import | 기존 초안 저장 |

어댑터는 새 필드를 버리지 않고 새 저장소에 보존한다.

### 15.4 폐기 조건

- 직전 판 실제 호출량 0
- 기존 호출량 0 또는 승인된 고객 전환
- 그림자 비교 불일치 0
- 롤백 훈련 통과
- PRD, FDD, API, ERD, 시험 계획 재승인

## 16. 보안과 제한 <a id="보안"></a>

### 16.1 입력 제한

| 항목 | 제한 |
|---|---|
| JSON 본문 | 기본 1 MiB |
| 원문 파일 | 직접 JSON 금지, 서명 업로드 참조 |
| 층 항목 수 | 봉투당 500 이하 |
| 스킬 수 | 봉투당 20 이하 |
| source_refs | 100 이하 |
| 자유 서술 | 4,000자 이하 |
| 금지 표현 | 작업 공간과 언어당 10,000개 이하 |

### 16.2 비밀값

API 응답은 비밀값 원문을 반환하지 않는다.

스킬 permissions에는 비밀값 별칭만 쓴다.

로그는 토큰, 원문, 공급자 키를 가린다.

### 16.3 비율 제한

비율 제한 키는 회원, 엔드포인트군, 비용 등급이다.

동기화는 source_service와 token subject를 함께 쓴다.

한 작업 공간의 폭주가 다른 작업 공간 실행 큐를 고갈시키지 않도록 작업 공간별 공정성 큐를 둔다.

### 16.4 응답 필드 필터

viewer는 원문, 비용 상세, 스킬 본문, 내부 검사 원문을 볼 수 없다.

editor는 자기 허용 작업 공간만 본다.

owner도 다른 회원 작업 공간는 볼 수 없다.

## 17. 상류 갭과 보정 <a id="회수"></a>

| 이전 갭 | API 보정 |
|---|---|
| 작업 공간 아래 둘째 작업 공간 생성 | 하나의 `POST /workspaces`와 `PUT /workspaces/{id}/context`로 분리 |
| X4를 `layers`에서 제거 | `layers.x4`에 항목 판·무결성·검사 결과를 포함 |
| 채널 연결을 첫 생성 조건으로 사용 | `content_branch`만 첫 요청에 받고 연결 계약은 openclaw 발행 단계에 둔다 |
| 채널별 문구 소유 불명 | `POST /outputs/{id}/channel-packages`는 Studio가 생성. openclaw는 규격 검증·발행 |
| 학습 후보 임계 부재 | 선택 3회 또는 성과 5건 전에는 후보 없음. 제시 시 `근거 부족`, 승낙 후만 L5 생성 |

남은 API 매핑 갭은 0개다.

## 18. 자기심문과 레드팀 <a id="자기심문"></a>

### 18.0 공식 벤치마크 차용과 차별화

| 공식 근거 | 확인한 사실 | 차용 | Studio에서 변경·차별화 |
|---|---|---|---|
| Stripe Webhooks | 중복과 순서 역전 가능, 서명 검증과 비동기 처리가 필요 | 사건 ID 기반 멱등 소비와 빠른 확인 응답 | 결제 사건이 아니라 층 판·인계·성과 사건이며 `source+id`와 authority revision을 함께 검사 |
| Stripe Idempotent Requests | 같은 멱등 키 재시도는 최초 결과 재사용, 다른 매개변수는 오류 | 모든 명령형 POST의 키와 요청 지문 저장 | 회원·엔드포인트·키를 복합 범위로 두고 작업 최대 재시도 창보다 오래 보존 |
| AWS Transactional Outbox | DB 변경과 사건 발행의 이중 쓰기 불일치를 피하고 소비자는 중복에 대비 | 도메인 변경과 `sync_outbox`를 한 트랜잭션으로 커밋 | Studio와 openclaw가 각자 outbox를 갖고 상대 DB를 쓰지 않음 |
| CloudEvents | 표준 문맥 속성 및 `source+id` 유일성 | 동기화·인계·성과 사건의 공통 문맥 | 민감값을 문맥에 넣지 않고 서비스별 data schema를 4.0으로 고정 |
| Confluent Schema Compatibility | backward와 transitive 호환 정책을 구분 | 이전 판 호환 fixture와 제거 조건 | D-04 확정 전 v3 제거일은 상수화하지 않음 |
| AWS EventBridge Retry/DLQ | 재시도 정책과 DLQ로 미처리 사건을 격리 | 지수 백오프, jitter, 최대 시도 뒤 DLQ | 멈추는 값과 일반 관찰의 경보를 분리하고 Studio 결과는 보존 |

### 18.1 이 계약이 틀렸다면

가장 그럴듯한 이유는 엔드포인트가 너무 잘게 쪼개져 화면 왕복이 늘어나는 것이다.

그러나 1:1 추적을 위해 명령 의미를 분리해야 한다.

수정은 public API 명령은 분리하되 studio-web의 서버 계층이 필요할 때 한 화면 제출을 여러 도메인 명령으로 조정하게 한 것이다.

두 번째 이유는 `POST assemble`과 `POST skill-resolution`이 구현상 하나의 트랜잭션이어야 할 수 있다는 점이다.

외부 계약은 결과 조회와 재현을 위해 분리했지만, 내부 구현은 assemble 명령 안에서 skill resolution을 호출해 원자적으로 봉투를 고정할 수 있다.

### 18.2 경쟁자 공격

공격: `정본 밀기 API가 너무 복잡하다.`

응답: 중복, 역순, 삭제, 판 불일치를 처리하지 않는 단순 API는 데이터 오염을 사용자에게 떠넘긴다. CloudEvents 머리말과 항목별 revision으로 복잡성을 제한했다.

공격: `부분 성공인데 HTTP 200이면 오류를 숨긴다.`

응답: 전송은 성공했고 작업 결과가 partial이므로 200이 맞다. 본문 status와 실패 배열이 필수이며 UI가 부분 상태를 명시한다.

### 18.3 까다로운 개발자 공격

공격: `If-Match와 body base_revision을 둘 다 쓰면 중복이다.`

수정: 공개 리소스 PATCH와 PUT은 `If-Match`를 정본으로 쓰고, JSON의 base_revision은 호환 어댑터에서만 받는다. 새 클라이언트는 머리말 하나를 쓴다.

공격: `엔진 반환 storage_ref가 엔진의 상태 의존 아닌가.`

수정: engine이 저장소를 직접 고르는 것이 아니라 서비스가 준 단기 출력 포트나 in-memory 결과를 통해 opaque ref를 받는다. 영속 소유는 studio-service다.

## SOURCES, MODEL, RUBRIC <a id="sources"></a>

SOURCES:

- `docs/사업계획-osmu-v1.0.md` 내부 판 v1.3 §3.4
- `docs/requests/회장-확정-요구사항-대장.md` R01~R99
- `studio/docs/fdd-studio-v4.0.md`
- `studio/docs/api-contract-studio-생성-v3.0.md`
- `studio/docs/prd-studio-service-v1.2.1-gpt-codex.md`
- `docs/user-flow.md`
- `dashboard/src/app/api/studio/brand-setup/route.ts`
- `dashboard/src/app/api/studio/text/route.ts`
- `dashboard/src/app/api/studio/drafts/route.ts`
- `dashboard/src/lib/tenant-auth.ts`
- Stripe Webhooks: https://docs.stripe.com/webhooks
- Stripe Idempotent Requests: https://docs.stripe.com/api/idempotent_requests
- CloudEvents Specification: https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md
- Confluent Schema Compatibility: https://docs.confluent.io/platform/current/schema-registry/fundamentals/schema-evolution.html
- AWS Transactional Outbox: https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html
- PostgreSQL Row Security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- AWS EventBridge Retry Policy and DLQ: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-retry-policy.html
- `/Users/sj/.claude/standards/dev.md`
- `/Users/sj/.claude/standards/doc-review.md`
- `/Users/sj/.claude/standards/templates/doc-template-fdd.md`

MODEL: gpt-codex/gpt-5.6-sol

RUBRIC_SCORE: 완결성=5/5 정밀성=5/5 벤치마크=5/5 추적성=5/5 전문성=5/5 total=25/25

WEAKEST_LINE: 호환 판 제거 시점과 동기화 감지 창은 실측 전이므로 응답 숫자로 고정하지 않았다.

SKILLS_USED: 없음

SKILLS_SKIPPED: 설치된 스킬 목록에 API 계약 또는 분산 동기화 설계 전용 스킬이 없다. dev.md와 doc-review.md를 직접 적용했다.
