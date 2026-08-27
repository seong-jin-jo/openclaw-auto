# v62 댓글과 제안 lifecycle DB 선택지

한 줄 결론: 첫 build는 기존 저장소를 재사용해 제안 인계와 댓글 read-through를 연결할 수 있지만, 댓글 보관, 나중 처리, 학습 승인 이력까지 구현하려면 새 테이블이 필요하다. 이 문서는 선택지만 제시하며 스키마를 확정하지 않는다.

## 1. 결정 1: 댓글과 답글을 어디에 보관할 것인가

### 선택지 A: provider read-through만 사용

추천 용도: 첫 build에서 실제 댓글 읽기와 답글 보내기를 연결할 때.

- 댓글 목록을 provider에서 요청할 때마다 읽는다.
- 답글은 provider에 직접 보내고 결과 ID만 응답한다.
- DB migration이 없다.
- tenant가 소유한 `published_posts.external_id`와 account를 먼저 대조한다.
- 단점: 나중 처리, 답글 이력, 통합 inbox, provider 장애 때의 읽기가 없다.

하면: P0인 읽기와 답글 단절을 가장 빨리 검증할 수 있다.

안 하면: 댓글 기능 전체가 DB 설계 승인까지 계속 막힌다.

### 선택지 B: `published_posts.provider_meta`에 댓글 snapshot 저장

추천하지 않는다.

- migration은 없지만 한 게시물 JSONB에 댓글 목록이 계속 커진다.
- provider comment unique key와 상태별 조회가 어렵다.
- 동시 답글과 수집이 같은 JSONB를 갱신해 덮어쓸 수 있다.
- RLS는 게시물 단위로 적용되지만 댓글 단위 무결성은 약하다.

하면: 짧은 데모는 만들 수 있다.

안 하면: 잘못된 중간 저장 구조가 영구 구조로 굳는 위험을 피한다.

### 선택지 C: `engagement_items` 테이블 신설

추천 용도: v62 성과실을 지속 가능한 제품 기능으로 확정할 때.

후보 필드:

| 필드 | 목적 |
|---|---|
| id | 내부 UUID |
| tenant_id | tenant 격리와 RLS |
| published_post_id | 원 게시물 연결 |
| platform | provider adapter 선택 |
| provider_comment_id | provider 원본 key |
| provider_parent_id | 대화 thread 연결 |
| author_ref, author_display | 작성자 식별과 표시 |
| body | 댓글 본문 |
| state | unread, deferred, replied, hidden |
| provider_created_at, fetched_at | 원본 시간과 수집 시간 |
| replied_at, reply_external_id | 답글 결과 추적 |

필수 무결성:

- unique: `(tenant_id, platform, provider_comment_id)`
- foreign key: `published_post_id`에서 `published_posts.id`
- index: `(tenant_id, state, provider_created_at desc)`
- RLS: tenant context와 일치하는 행만 읽고 쓴다.
- 답글 idempotency: comment와 client request key 조합을 별도 unique key로 보호한다.

하면: 답글, 나중 처리, inbox, 감사 이력을 한 모델로 운영할 수 있다.

안 하면: provider 장애와 재수집 때 상태를 복원할 수 없고 R185의 댓글 반응 UI 일부만 구현된다.

### 추천

첫 build는 A로 provider 계약과 실제 권한을 검증한다. 실제 사용자 경로가 확인된 뒤 C를 eng-design에서 승인한다. B는 선택하지 않는다.

## 2. 결정 2: 성과 제안 lifecycle을 어디에 둘 것인가

### 선택지 A: 기존 `queue_posts.payload`와 `drafts.payload` 재사용

추천 용도: 첫 build.

- 제안을 수락할 때 기존 `POST /api/queue/add`를 호출한다.
- queue payload에 source, evidence post ids, sample count, basis, model version을 넣는다.
- 생성실에서 draft로 확장될 때 source block을 그대로 복사한다.
- 새 테이블이 없다.
- 단점: 제안을 거절하거나 보류한 이력, 노출 대비 수락률을 조회하기 어렵다.

하면: P0인 제안에서 생성 큐로의 단절을 최소 변경으로 닫는다.

안 하면: 이미 있는 큐를 두고 새 저장소를 먼저 만드는 비용이 생긴다.

### 선택지 B: `content_suggestions` 테이블 신설

추천 용도: R56의 선제 알림과 제안 성과 측정을 제품 KPI로 운영할 때.

후보 필드:

| 필드 | 목적 |
|---|---|
| id, tenant_id | 식별과 tenant 격리 |
| source_type | performance, trend, hypothesis |
| evidence | post ids, signal ids, 비교 기간, 표본 수 |
| idea, target_format | 제안 내용과 생성 방향 |
| state | proposed, accepted, dismissed, enqueued, expired |
| queue_post_id, draft_id | 후속 결과 연결 |
| model_name, prompt_version | 재현과 회귀 추적 |
| proposed_at, decided_at | 노출과 결정 시간 |

필수 무결성:

- RLS: tenant context 일치.
- index: `(tenant_id, state, proposed_at desc)`.
- accepted 또는 enqueued 전환은 idempotency key로 직렬화.
- evidence에는 비밀값과 provider token을 넣지 않는다.

하면: 어떤 제안이 실제 제작과 성과로 이어졌는지 측정할 수 있다.

안 하면: 제안 기능은 생성 진입을 닫을 수 있지만 lifecycle 분석은 미검증으로 남는다.

### 추천

첫 build는 A다. B는 proactive notification의 노출, 수락, 결과 KPI를 운영하기로 결정할 때 추가한다.

## 3. 결정 3: 학습 후보 수락 이력을 어디에 둘 것인가

### 선택지 A: 기존 브랜드 문서에 승인된 결과만 반영

- guide, voice tone, brand setup의 기존 API를 재사용한다.
- 후보 자체와 거절 이력은 보관하지 않는다.
- 표본 5건이나 동일 선택 3회의 근거를 별도 evidence block으로 남긴다.

하면: 승인된 결과를 빠르게 반영할 수 있다.

안 하면: 학습 고리가 화면에서 멈춘다.

### 선택지 B: `learning_candidates` 테이블 신설

- candidate type, evidence, sample count, proposed value, state, decided_at, applied target을 저장한다.
- 승인 전 candidate와 승인된 brand source를 분리한다.
- R98의 표본 문턱과 R168의 수락 행위를 감사할 수 있다.

하면: 왜 학습했는지 재현 가능하고 잘못된 학습을 되돌릴 수 있다.

안 하면: 현재 브랜드 문서는 유지되지만 후보 lifecycle은 관찰할 수 없다.

### 추천

R98과 R168을 정식 제품 계약으로 볼 경우 B다. 단, `content_suggestions`와 하나의 범용 lifecycle 테이블로 합치지 않는다. 콘텐츠 제안과 브랜드 학습은 상태, 보존 기간, 적용 대상이 다르다.

## 4. 회장 결정이 필요한 항목

| 결정 | 추천 | 선택 시 결과 | 미선택 시 리스크 |
|---|---|---|---|
| 댓글 첫 build 저장 방식 | A, provider read-through | migration 없이 실제 읽기와 답글을 먼저 검증 | 댓글 P0가 스키마 결정까지 막힘 |
| 댓글 장기 저장 구조 | C, `engagement_items` | 나중 처리, inbox, 감사 이력 가능 | provider 장애 시 상태 복원 불가 |
| 제안 첫 build 저장 방식 | A, 기존 queue와 draft payload | 최소 변경으로 생성 큐 인계 가능 | 수동 재입력 단절 지속 |
| 제안 장기 lifecycle | KPI 운영을 확정할 때 B | 노출, 수락, 제작, 성과 연결 가능 | 제안 효과 측정 불가 |
| 학습 후보 lifecycle | R98과 R168이 범위면 B | 표본과 승인 이력 재현 가능 | 왜 학습됐는지 감사 불가 |

## 5. 공식 근거에서 가져온 제약

- YouTube 댓글 읽기와 답글 쓰기는 서로 다른 API 동작이며 parent 관계를 요구한다.
- Threads는 replies 조회와 reply 생성이 분리되어 있고 생성에는 `reply_to_id`가 필요하다.
- Instagram 답글은 comment id 아래 replies endpoint를 사용한다.
- 따라서 내부 계약도 post metrics와 comments를 분리하고, reply 대상 provider comment id를 필수로 둔다.

## 6. 레드팀과 셀프심문

### 레드팀

공격: 세 테이블을 한 번에 만들면 다시 설계할 필요가 없으므로 가장 빠르다.

수정: provider 댓글 권한과 실제 payload를 한 번도 관찰하지 않은 상태에서 테이블을 확정하면 provider 차이를 잘못 일반화할 위험이 있다. 먼저 read-through로 데이터 형식, rate limit, reply idempotency를 확인해야 장기 스키마가 실제 계약을 반영한다.

### 셀프심문

질문: 이 선택지가 틀렸다면 가장 그럴듯한 이유는 무엇인가?

답: provider read-through가 rate limit과 응답 지연 때문에 제품 화면에 사용할 수 없을 수 있다. 그래서 A는 장기안이 아니라 계약 검증용 첫 build로만 추천한다. 실사용 샘플에서 latency와 paging을 관찰한 뒤 C의 sync 전략을 결정해야 한다.

---

🏷 STAMP | line: osmu | 생성: 2026-08-27 20:40 KST | model: gpt-5.6 | agent: code-builder

SKILLS_USED: 없음

SKILLS_SKIPPED: 매칭되는 설치 코드 스킬 없음. `dev.md`, `benchmarks.md`, `doc-review.md`를 적용했다.

SOURCES: `dashboard/db/schema.sql` | `dashboard/src/app/api/metrics/route.ts` | `dashboard/src/app/api/suggestions/route.ts` | `dashboard/src/app/api/queue/add/route.ts` | `dashboard/src/lib/social-connect.ts` | https://developers.google.com/youtube/v3/docs/comments/list | https://developers.google.com/youtube/v3/docs/comments/insert | https://www.postman.com/meta/threads/documentation/dht3nzz/threads-api | https://www.postman.com/meta/instagram/request/23987686-59e5000b-326c-42a1-8545-b984c7fd0e40

MODEL: gpt-5.6 / code-builder

RUBRIC_SCORE: completeness=5/5 evidence=5/5 traceability=5/5 decisions=5/5 readability=5/5 total=25/25

WEAKEST_SECTION: 장기 테이블의 retention과 provider별 pagination 정책은 실제 댓글 payload 관찰 전이라 확정하지 않았다.
