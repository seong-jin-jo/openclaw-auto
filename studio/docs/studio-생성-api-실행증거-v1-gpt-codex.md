# Studio 생성 API 실행 증거 v1

> STAMP | line: studio | 생성: 2026-08-27 23:10 KST | model: gpt-5.6 | agent: code-builder | skills: dev.md, benchmarks.md | 기반: Studio 생성 API 코드와 요구 픽스처

## 실행 조건

- Next.js development server를 임시 복제본에서 시작하고 요청 후 종료했다.
- 요청 본문: `dashboard/tests/studio/generation-request.json`
- 인증: 비밀값을 기록하지 않은 development identity adapter
- 견적: 실제 provider 결제 금액이 아니라 검증 환경에 주입한 KRW 예상 범위

## 1. 정상 생성, HTTP 201

```json
{"data":{"job_id":"843c842c-470b-4bea-80f6-6fba439d2ce8","workspace_id":"11111111-1111-4111-8111-111111111111","status":"succeeded","candidates":[{"candidate_id":"257f1b18-afc4-453c-9bec-9b50589729f7","ordinal":1,"label":"A","angle":"problem_first","title":"자동화가 실패했을 때 확인할 세 가지: 문제부터 여는 안","rationale":"업무 자동화를 처음 접하는 1인 사업가가 겪는 문제를 첫 장면에 놓고 목표인 \"처음 보는 사람에게 복잡한 개념을 설명한다\"를 빠르게 이해시키는 구성입니다.","format":{"content_branch":"video","preview_kind":"structured_storyboard","quality":"draft","outline":["사용자가 겪는 문제","문제가 생기는 이유","바로 적용할 다음 행동"]},"estimated_cost":{"status":"quoted","currency":"KRW","min_minor":1200,"max_minor":3600,"assumptions":["후보 한 장의 draft 생성 기준","외부 공급자 최종 응답 전 예상값"]},"channels":[{"target_id":"vertical-video-primary","format":"short-video","aspect_ratio":"9:16","max_duration_seconds":60}]},{"candidate_id":"a91b297c-12fc-4dfa-9455-f5d7fc6173c4","ordinal":2,"label":"B","angle":"proof_first","title":"자동화가 실패했을 때 확인할 세 가지: 증거부터 보여주는 안","rationale":"결론이나 관찰 가능한 증거를 먼저 보여 준 뒤 업무 자동화를 처음 접하는 1인 사업가에게 필요한 맥락을 붙이는 구성입니다.","format":{"content_branch":"video","preview_kind":"structured_storyboard","quality":"draft","outline":["확인 가능한 결과","결과를 만든 핵심 원리","같이 적용할 조건"]},"estimated_cost":{"status":"quoted","currency":"KRW","min_minor":1200,"max_minor":3600,"assumptions":["후보 한 장의 draft 생성 기준","외부 공급자 최종 응답 전 예상값"]},"channels":[{"target_id":"vertical-video-primary","format":"short-video","aspect_ratio":"9:16","max_duration_seconds":60}]},{"candidate_id":"3967cf13-3bc0-4e64-918a-91c9293024a7","ordinal":3,"label":"C","angle":"process_first","title":"자동화가 실패했을 때 확인할 세 가지: 과정을 따라가는 안","rationale":"\"처음 보는 사람에게 복잡한 개념을 설명한다\"에 도달하는 과정을 순서대로 보여 주어 처음 보는 사람도 따라오게 하는 구성입니다.","format":{"content_branch":"video","preview_kind":"structured_storyboard","quality":"draft","outline":["시작 조건","핵심 과정","완료 뒤 확인할 것"]},"estimated_cost":{"status":"quoted","currency":"KRW","min_minor":1200,"max_minor":3600,"assumptions":["후보 한 장의 draft 생성 기준","외부 공급자 최종 응답 전 예상값"]},"channels":[{"target_id":"vertical-video-primary","format":"short-video","aspect_ratio":"9:16","max_duration_seconds":60}]}],"layer_revisions":{"s0":1,"s1":2,"u2":3,"u3":4,"x4":5,"l5":6},"platform_spec_receipt":{"reference":"opaque-platform-contract","version":"2026-08","digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"created_at":"2026-08-27T14:04:04.080Z","regeneration":{"free_retries_per_day":1,"scope":"member","time_zone":"Asia/Seoul"}},"meta":{"request_id":"f78efaf3-7aff-491f-9b0a-6e634bafcb7f","contract_version":"1.0","served_at":"2026-08-27T14:04:04.083Z"}}
```

## 2. 필수 U3 목적 누락, HTTP 422

```json
{"error":{"code":"LEARNING_CONTEXT_INCOMPLETE","message":"생성에 필요한 학습 정보가 덜 채워졌습니다","retryable":false,"field_errors":[{"field":"learning_context.u3.purpose","reason":"필수 문자열입니다"}],"details":{}},"meta":{"request_id":"cca5c537-d0da-4cb8-be66-c6c508adf8f2","contract_version":"1.0"}}
```

## 3. 첫 재생성, HTTP 201

응답의 `replacement.candidates`는 1번 응답과 동일한 완전한 A/B/C 구조를 새 candidate ID로 반환했다.

```json
{"data":{"free_retry_consumed":true,"replacement":{"job_id":"c84d2e36-3452-455a-9dce-99745b8966be","workspace_id":"11111111-1111-4111-8111-111111111111","status":"succeeded","candidates":[{"candidate_id":"7e4cf62b-4c0f-4818-b124-7157a953595c","ordinal":1,"label":"A","angle":"problem_first","title":"자동화가 실패했을 때 확인할 세 가지: 문제부터 여는 안"},{"candidate_id":"8f7f5efc-e388-4e7b-9c0e-c785ed3cb9c1","ordinal":2,"label":"B","angle":"proof_first","title":"자동화가 실패했을 때 확인할 세 가지: 증거부터 보여주는 안"},{"candidate_id":"655ae06b-1e34-4f85-a4ad-5bef8b18ae32","ordinal":3,"label":"C","angle":"process_first","title":"자동화가 실패했을 때 확인할 세 가지: 과정을 따라가는 안"}],"layer_revisions":{"s0":1,"s1":2,"u2":3,"u3":4,"x4":5,"l5":6},"platform_spec_receipt":{"reference":"opaque-platform-contract","version":"2026-08","digest":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},"created_at":"2026-08-27T14:04:05.176Z","regeneration":{"free_retries_per_day":1,"scope":"member","time_zone":"Asia/Seoul"}},"free_retry_resets_at":"2026-08-27T15:00:00.000Z"},"meta":{"request_id":"cf97e004-758a-4adf-84f6-03bae71f9799","contract_version":"1.0","served_at":"2026-08-27T14:04:05.180Z"}}
```

## 4. 두 번째 재생성, HTTP 409

```json
{"error":{"code":"PAID_REGENERATION_APPROVAL_REQUIRED","message":"오늘의 무료 재생성을 이미 사용했습니다","retryable":false,"field_errors":[],"details":{"free_retry_resets_at":"2026-08-27T15:00:00.000Z","paid_retry_quote":{"currency":"KRW","amount_minor":4900}}},"meta":{"request_id":"76c23b58-471d-4f07-9bb0-28dbf4d7e8d5","contract_version":"1.0"}}
```

## 셀프 검증

- 이 결론이 틀렸다면 가장 그럴듯한 이유: 메모리 runtime의 통과를 production 영속성 증거로 오해하는 것. 문서와 identity adapter에 production fail-closed 경계를 명시했다.
- 레드팀: 다중 instance에서는 일일 무료 사용량과 idempotency가 각 process로 갈라진다. 따라서 production 준비로 부르지 않고, 신규 DB table 합의 항목으로 회수했다.

SKILLS_USED: `dev.md`, 완료 증거 2종과 실제 HTTP 경로 검증에 적용. `benchmarks.md`, 공식 기술 계약 소스 선별에 적용.

SOURCES: [IETF Idempotency-Key draft](https://datatracker.ietf.org/doc/html/draft-ietf-httpapi-idempotency-key-header) | [AWS S3 presigned URL](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) | `docs/prototype/openclaw-auto-4room-v63.html` | `docs/요청/`의 회장 확정 요구사항 대장 | `docs/학습정보-층계-계약-v1.0.md`

MODEL: gpt-5.6 / code-builder
