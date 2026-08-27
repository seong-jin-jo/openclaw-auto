<!--
STAMP
line: studio
artifact: eng-design independent review v1
created_at: 2026-08-23 01:21 KST
model: gpt-5.6-sol
agent: eng-design-reviewer
skill: review
basis: FDD v4.0, API contract v4.0, business plan v1.3 section 3.4,
  chairman requirements R01-R99
benchmark_urls: https://spec.openapis.org/oas/latest.html,
  https://docs.arc42.org/home/,
  https://www.postgresql.org/docs/current/ddl-rowsecurity.html
judgment: 문법 통과와 구현 착수 가능성은 다른 문제다.
  계약 충돌과 추적성 공백을 먼저 공격했다.
-->

<!-- markdownlint-disable MD013 -->

# Studio FDD v4.0 독립 설계 리뷰

> **판정: ⛔ RETAKE**

독립 점수는 **13/25**다. 합격선 20/25에 못 미치고, 완결성과 추적성이 각각 1점이므로 총점과 무관하게 반려한다. Mermaid 10개는 모두 실제 렌더됐지만, 문서가 주장하는 `mapping gap 0`과 Studio 단독 판매 성립은 증거로 지지되지 않는다. eng-design 게이트 통과를 권고하지 않는다.

## 1. 30초 다이제스트

1. 이 설계는 Studio를 자체 회원, 작업 공간, 일곱 정보층, 생성·편집·학습을 가진 독립 상태 서비스로 약속한다.
2. 생성 엔진은 DB를 직접 읽지 않고 불변 봉투만 받아 실행하며, openclaw는 발행·예약·성과 관찰을 소유한다고 약속한다.
3. FDD는 55개 안팎의 테이블과 32개 흐름을, API 문서는 52개 엔드포인트 제목과 오류·멱등성 원칙을 제시한다.
4. 그러나 결제, 구독, 회원 생명주기, 단독 다운로드 계약이 없어 화면만 붙여 Studio를 단독 판매한다는 약속은 실행 경로로 닫히지 않는다.
5. 요구사항 R01부터 R99까지의 1:1 추적표가 없고 같은 API의 요청·응답이 절마다 달라, 신규 개발자가 어느 계약을 구현해야 하는지 확정할 수 없다.

## 2. 독립 RUBRIC 채점

| 축 | 점수 | 독립 판정 |
| --- | ---: | --- |
| 완결성 | 1/5 | 단독 판매에 필요한 가입·인증 갱신·결제·구독·권한 변경·다운로드가 닫히지 않았다. 일부 API는 JSON 전문이 없다. |
| 정밀성 | 3/5 | 필드와 상태를 폭넓게 적었지만 같은 endpoint의 상세 절과 전수표가 서로 다른 request·response를 정의한다. DB의 닫힌 소유권 FK와 RLS도 선언 수준이다. |
| 벤치마크 반영 | 5/5 | OpenAPI, arc42, PostgreSQL 공식 자료를 실조회해 계약 단일성, 문서 구조, RLS 우회 조건을 대조했다. 차용과 Studio 적용 차이를 아래에 명시했다. |
| 추적성 | 1/5 | 상류 대장은 R01부터 R99까지 99건인데 FDD에 명시된 고유 요구 ID는 6건, API 계약은 4건뿐이다. 20개 요약 요구를 99건 전수 추적으로 볼 수 없다. |
| 전문성·톤 | 3/5 | 문장은 대체로 외부 전달 가능한 톤이지만 절 번호 역전, 중복 앵커, `90초 안팡` 오타, 근거보다 앞선 `gap 0` 자가판정이 신뢰를 훼손한다. |
| **합계** | **13/25** | **⛔ RETAKE. 1점 축이 2개이므로 자동 반려.** |

### 2.1 구조·규격 실검

| 검사 | 결과 | 관찰 증거 |
| --- | --- | --- |
| 최상단 목차와 앵커 | FAIL | FDD는 최상단 목차가 있으나 `기록`, `동기화`, `목소리`, `생성`, `수명`, `스킬`, `실패`, `회수`, `회원` 등의 명시 앵커가 중복된다. `## 2` 아래 `### 4·8·15·16·19`, `## 3` 아래 `### 5·12·13·14`가 배치돼 계층 번호도 역전된다. API 문서의 명시 앵커 20개는 중복이 없었다. |
| Mermaid 아키텍처·ERD·플로우 | PASS | FDD의 Mermaid 코드블록 10개를 Mermaid CLI 11.16.0으로 각각 SVG 렌더했다. 10/10 성공했다. 이전 판 8.1 문법오류는 재발하지 않았다. |
| PRD·FDD·QA 분할 | PASS, 조건부 | PRD와 FDD는 분리됐고 본문은 시험 계획이지 QA 결과를 가장하지 않는다. 다만 3,989줄 FDD가 아키텍처·55개 표·1,300줄대 시험 계획을 한 파일에 묶어 client-ready 탐색성은 낮다. |
| API 요청·응답 JSON 전량 | FAIL | 프로필, 작업 공간 조회·수정, 스킬 등록·조회, 충돌 해결, provenance, resume 등 여러 endpoint가 설명문만 있고 request 또는 success JSON 전문이 없다. 같은 endpoint의 상세 절과 §14.1 전수표도 서로 다르다. |
| DB 필드 타입 | PASS, 조건부 | 개별 표의 필드 타입은 대부분 있다. 그러나 `전체 ERD`는 실제 표 전체를 포함하지 않고, 복합 소유권 FK와 RLS policy DDL이 없어 무결성 구현 규격은 불완전하다. |
| 논의 내용의 0절 격리 | FAIL | 두 문서 모두 0절에 미결을 모았지만 API §15.2와 §18.0이 D-04 미확정 값을 다시 본문 동작 조건으로 참조하고, FDD §7.2와 품질 푸터도 D-01부터 D-05를 본문에 반복한다. `0절만 미결을 담는다`는 자체 규칙을 엄격히 충족하지 못한다. |

## 3. 치명 결함

### 3.1 요구사항 99건이 설계와 시험으로 전수 추적되지 않는다

**위치:** `studio/docs/fdd-studio-v4.0.md:60`, `:3628-3665`, `studio/docs/api-contract-studio-v4.0.md:1515-1594`

FDD는 `매핑 gap은 0`, `요구 빈칸: 0`이라고 선언하지만 역추적표는 요구 ID가 없는 20개 요약 행이다. 상류 요구 대장은 R01부터 R99까지 99건이다. FDD 본문에 명시된 고유 R ID는 R01·R88·R89·R92·R96·R99 6건, API 본문은 R01·R88·R89·R99 4건뿐이다. 32개 화면 흐름이 endpoint·component·table·test를 가진 것은 흐름 내부 추적이지, 상류 요구 전수 추적이 아니다.

**왜 치명적인가:** R71의 Studio 단독 상품, R96의 무료 실제 영상, R97의 작업 공간 과금처럼 제품 성립에 직접 영향을 주는 요구가 구현·시험까지 어느 행에서 닫히는지 증명되지 않는다. `gap 0` 판정이 개발 누락을 가린다.

**고치는 법:** R01부터 R99까지 한 행씩 두고 `적용 여부 / PRD 절 / FDD 컴포넌트 / API operationId / 테이블·제약 / 시험 ID / 비고`를 채운다. 비적용 요구도 삭제하지 말고 N/A 사유와 소유 서비스를 적는다. 빈 셀 0과 참조 대상 실재를 스크립트로 검증한다.

### 3.2 같은 API가 두 계약을 가져 구현 정본이 없다

**위치:** `studio/docs/api-contract-studio-v4.0.md:755-781`, `:887-901`, `:1153-1168`, `:1559-1592`

예를 들어 `POST /sessions`의 상세 응답은 `member`, `access_token`, `expires_at`인데 §14.1은 `session_id`, `member_id`, `expires_at`이다. `POST /productions` 상세 요청은 `proposal_set_id`, `estimate_id`, `approved_ceiling_minor`, `consent`인데 §14.1은 `workspace_id`, `proposal_set_id`, `request_adjustment`다. 작업 공간 복제도 상세 절은 대상 workspace ID를 받지만 §14.1은 새 이름을 받는다.

**왜 치명적인가:** 서버, 웹, E2E 작성자가 서로 다른 유효 계약을 선택할 수 있다. 자동 생성 SDK나 스키마 검증도 불가능하다.

**고치는 법:** OpenAPI 문서를 단일 정본으로 만들고 Markdown은 operationId를 참조해 생성한다. endpoint마다 request schema, 모든 status response, 오류 schema, 보안 scheme, idempotency 조건을 한 번만 정의한다. §14.1은 별도 수기 계약이 아니라 정본에서 생성한 인덱스로 바꾼다.

### 3.3 Studio 단독 판매가 데이터 모델과 API로 닫히지 않는다

**위치:** `studio/docs/fdd-studio-v4.0.md:234-241`, `:944-959`, `studio/docs/api-contract-studio-v4.0.md:755-804`, `:1153-1268`

`member_entitlements`는 요금제와 한도를 저장할 수 있지만, checkout, 결제 provider 경계, 결제 webhook, 구독 갱신·해지·환불·실패, entitlement 부여·회수 감사 계약이 없다. `POST /sessions`는 `credential: opaque`를 받을 뿐 회원가입, identity 검증, refresh rotation, logout·revoke, 계정 복구를 정의하지 않는다. 결과 종착점도 openclaw handoff만 있고 Studio 단독 signed download 또는 export endpoint가 없다.

**왜 치명적인가:** `화면만 붙이면 단독 판매`는 UI가 아니라 가입, 지불, 권한 획득, 생성, 내려받기, 해지까지의 폐쇄 루프다. 지금 설계는 이미 권한을 가진 회원이 내부 생성 흐름을 쓰는 경우만 부분적으로 성립한다.

**고치는 법:** `IdentityPort`, `BillingPort`, `EntitlementLedger`, `OutputDeliveryPort` 경계를 추가한다. 결제 성공·실패·환불·해지 사건에서 entitlement가 어떻게 바뀌는지, 단독 결과의 보관·signed URL·만료·재발급·삭제를 API와 테이블·시험에 1:1로 연결한다.

### 3.4 회원·작업 공간 격리는 선언됐지만 DB가 강제하지 않는다

**위치:** `studio/docs/fdd-studio-v4.0.md:1339-1359`, `:1628-1651`, `:1919-1945`

`production_jobs`는 `studio_member_id`와 `workspace_id`를 각각 FK로만 적고 `닫힌 FK`라고 서술한다. 실제로 같은 회원 소유를 강제할 composite unique key와 composite FK 정의가 없다. `learning_candidates.workspace_id`는 nullable이라 작업 공간 전용 L5 후보가 범위 없이 생길 수 있다. RLS도 owner/editor/viewer 설명만 있고 표별 `USING`, `WITH CHECK`, session context, worker role, `ENABLE/FORCE ROW LEVEL SECURITY`가 없다.

**왜 치명적인가:** 애플리케이션 버그 한 건이 다른 작업 공간 또는 회원의 데이터 참조로 이어질 수 있다. PostgreSQL은 기본적으로 table owner가 RLS를 우회하므로 `FORCE ROW LEVEL SECURITY`와 실행 역할 분리가 없으면 `기본 거부` 선언만으로는 충분하지 않다.

**고치는 법:** 모든 회원·작업 공간 하위 표에 복합 소유권 키를 강제하거나 member ID 중복 저장을 제거하고 부모를 통해서만 소유권을 도출한다. 표별 RLS DDL, 앱·worker 역할, owner bypass 방지, 교차 tenant INSERT·UPDATE·SELECT·DELETE 음성 시험을 작성한다.

### 3.5 비동기 작업과 공통 멱등 저장소의 실패모드가 비어 있다

**위치:** `studio/docs/api-contract-studio-v4.0.md:257-275`, `studio/docs/fdd-studio-v4.0.md:1339-1359`

API는 모든 명령형 POST에 `member_id + endpoint_family + key` 멱등 범위를 요구하지만 이를 전 endpoint에 공통 적용할 저장 표와 원자적 쓰기 규칙이 없다. 202 응답은 `status_url`을 약속하지만 공통 operation 조회 계약, lease, heartbeat, deadline, orphan reaper, 취소·재개 상태 전이와 worker crash 후 소유권 회수가 없다.

**왜 치명적인가:** 재시도 시 중복 과금·중복 생성이 생기거나, worker가 죽은 작업이 영원히 `running`에 머물 수 있다.

**고치는 법:** 공통 `idempotency_records`와 `operations` 계약을 추가하고 상태 전이표를 하나로 고정한다. 요청 지문, 최초 응답, 보관 기간, lease owner·expiry, heartbeat, retry count, terminal reason, cancel semantics를 DB 제약과 API·시험에 연결한다.

### 3.6 첫 생성 전 채널 지연 요구가 API에서 다시 깨진다

**위치:** `docs/사업계획-osmu-v1.0.md:676`, `docs/requests/회장-확정-요구사항-대장.md:34`, `studio/docs/api-contract-studio-v4.0.md:969`, `:1113-1120`

상류는 첫 사용자가 글·영상 갈래만 정하고 세부 채널은 편집실에서 고르도록 고정했다. 그러나 참고자료 조회는 `channel`을 필수 query로 두고 proposal set 요청도 `channel: threads`를 받는다.

**왜 치명적인가:** API 클라이언트가 채널을 알지 못하면 첫 제안·생성 준비를 끝낼 수 없다. 문서의 R89 수용 주장을 실제 request schema가 반박한다.

**고치는 법:** 첫 요청에서는 `content_branch: text|video`만 필수로 받고 channel은 nullable 또는 후속 editor 명령으로 이동한다. reference 검색은 branch와 목적 기준으로 수행하고, channel-specific package는 편집 단계 이후 생성한다.

### 3.7 문서 자체 링크와 논의 격리가 client-ready 기준에 못 미친다

**위치:** `studio/docs/fdd-studio-v4.0.md:244-246`, `:628 이후`, `:869 이후`, `studio/docs/api-contract-studio-v4.0.md:1610-1612`, `:1686-1695`

FDD 절 번호가 상위 번호보다 크게 역전되고 동일 explicit anchor가 여러 번 나온다. 두 문서의 0절은 존재하지만 D-04가 호환 동작과 벤치마크 해석에 다시 섞여 있다.

**왜 치명적인가:** 외부 클라이언트와 신규 개발자가 링크로 특정 계약을 가리킬 수 없고, 미확정 정책과 확정 구현 계약을 구분하기 어렵다.

**고치는 법:** arc42처럼 안정된 번호 체계로 재편하고 anchor ID를 문서 전체에서 유일하게 만든다. 0절의 결정 ID는 본문에 값을 대입하지 말고 `결정 전 차단` 링크만 둔다. 확정 뒤에는 0절에서 결정을 닫고 본문에 결정값과 근거를 반영한다.

## 4. 사업계획 v1.3 §3.4 대조

| 사업계획 계약 | FDD·API 상태 | 판정 | 필요한 수정 |
| --- | --- | --- | --- |
| 일곱 층 `S0 S1 U2 U3 X4 L5 R6`, 별도 브랜드 층 없음 | 층 코드, 작업 공간 격리, 복제 모델이 있다 | 일치 | R01-R99 RTM에 해당 요구 ID를 연결한다. |
| 일반 우선순위 `R6 → L5 → X4 → U3 → U2 → S1`, S0·U3 금지선 잠금, 사실 충돌은 질문 | 조립과 conflict 구조는 있으나 conflict resolve 요청이 잠금 종류별 허용·금지 타입을 강제하지 않는다 | 부분 일치 | safety·rights는 해제 불가, fact는 질문 응답만 허용하도록 discriminated schema를 둔다. |
| 첫 생성은 글·영상 갈래만, 세부 채널은 편집실, 계정 연결은 발행 때 | 화면 흐름 표는 일치하지만 reference와 proposal API가 첫 생성 전에 channel을 요구한다 | 불일치 | channel을 후속 editor 계약으로 이동한다. |
| 같은 선택 3회 또는 비교 가능한 성과 5건부터 `근거 부족` 후보, 승낙 뒤 L5 | 임계값과 accept/reject API가 있다 | 부분 일치 | `learning_candidates.workspace_id`를 필수화하고 후보가 다른 공간으로 이동하지 못하게 한다. |
| 안정 prefix와 가변 suffix를 분리한 조립 | 공통 봉투에는 실제 workspace context가 있으나 단독 전문은 S0·S1·U2·U3·L5를 ID·revision만 적어 engine 입력 전문과 충돌한다 | 부분 일치 | 공통 schema 한 개로 실제 값, 해시, 판을 정의하고 모드별 차이는 source authority만 바꾼다. |
| Studio 단독은 자체 학습 담당, 결합 상품은 openclaw 성과 관찰 수신 | Studio learning observation·candidate와 sync event가 있다 | 일치, 무결성 보완 필요 | standalone과 combined의 observation source·비교가능성 판정을 schema로 분리한다. |
| Studio 결과는 완성 원본, 채널별 준비본, 제작 꼬리표이며 openclaw가 발행·성과 루프 소유 | channel package와 handoff는 있으나 standalone 원본 다운로드가 없다 | 불일치 | Studio object storage 기반 output delivery와 signed download 계약을 추가한다. |
| Studio는 독립 상품으로 가입부터 구매·생성·내려받기까지 성립 | entitlement 표만 있고 가입 생명주기, billing, download가 없다 | 불일치 | identity·billing·entitlement·delivery 네 경계를 설계한다. |
| 작업 공간 추가가 유료 축 | 기본 plan별 limit만 있고 유료 추가 공간의 주문·갱신·회수 모델이 없다 | 불일치 | base allowance와 paid add-on quantity를 분리해 entitlement ledger와 billing event에 연결한다. |

## 5. 독립 Codex 교차검토 병합

인증, 보안, DB 무결성, 동시성, 전환 설계가 포함돼 read-only 2nd-pass를 별도로 실행했다. 교차검토 점수는 15/25였고 판정은 동일하게 RETAKE였다.

| 위험 | 본 리뷰 | Codex 2nd-pass | 병합 판정 |
| --- | --- | --- | --- |
| 단독 결제 생명주기 부재 | 치명 | CRITICAL | 치명, build 전 계약 필요 |
| 단독 결과 내려받기 부재 | 치명 | CRITICAL | 치명, standalone 종착점 없음 |
| API 상세 절과 전수표 충돌 | 치명 | HIGH | 치명, OpenAPI 단일 정본 필요 |
| 인증 refresh·revoke·recovery 부재 | 치명 | HIGH | 치명, 회원 경계 미완결 |
| RLS·복합 소유권 강제 부재 | 치명 | HIGH | 치명, 교차 tenant 위험 |
| 공통 멱등 저장·worker 회수 부재 | 치명 | HIGH | 치명, 중복 실행과 stuck 작업 위험 |
| 단독 봉투에 실제 층 값이 없는 충돌 | 중대 | HIGH | 중대, 엔진 재현성 훼손 |
| nullable parent의 unique 제약 | 중대 | MEDIUM | NULL 중복을 막는 제약 필요 |

## 6. 회장에게 물어야 할 질문

아래는 문서 작성자가 기술적으로 임의 확정할 수 없는 제품·비용·데이터 권리
결정이다. 결정 전 관련 migration과 외부 연동 구현을 막는 것이 맞다.

### Q1. Studio 단독 상품의 인증과 결제 정본을 어디에 둘 것인가

**추천안:** Studio가 자체 회원 정본을 유지하고, 인증·결제 공급자는 adapter로만
연결한다. 결제 사건을 Studio entitlement ledger가 소비한다.

- 하면: 공급자를 바꿔도 Studio 회원·권한·감사 기록이 유지되고 독립 판매가 성립한다.
- 안 하면: openclaw 또는 특정 공급자가 회원·권한 정본이 돼 Studio 단독 경계가 무너지고 해지·환불 책임도 불명확해진다.

### Q2. Studio 단독 결과의 기본 전달 방식을 무엇으로 할 것인가

**추천안:** Studio 저장소의 원본과 채널 준비본을 짧은 만료 signed URL로
내려받게 한다. 재발급·삭제·보관 기간은 Studio가 책임진다.

- 하면: openclaw 없이 가입부터 내려받기까지 닫힌다.
- 안 하면: handoff가 사실상 필수가 돼 `Studio 단독`은 이름뿐인 결합 상품이 된다.

### Q3. 유료 작업 공간 추가를 구독 플랜에 포함할지 별도 add-on으로 팔지 정할 것인가

**추천안:** 기본 포함 수량과 별도 add-on 수량을 entitlement에 분리한다. add-on은 구독과 같은 갱신 주기를 쓴다.

- 하면: R97의 작업 공간 추가 과금을 수량과 권한으로 집행할 수 있다.
- 안 하면: plan_code별 고정 limit만 남아 추가 공간을 판매하거나 회수할 방법이 없다.

### Q4. 기존 openclaw 회원과 Studio 회원을 어떻게 연결할 것인가

**추천안:** 작업 공간·학습 정보 미리보기를 보여 준 뒤 사용자가 연결을 승인한다.

- 하면: 잘못된 계정 병합과 private 작업 공간 노출 위험을 줄인다.
- 안 하면: 자동 병합 규칙이 틀릴 때 데이터 권리 사고가 발생하고 복구 기준도 불명확하다.

### Q5. 원문 보유와 외부 X4 실행의 첫 출시 경계를 어디에 둘 것인가

**추천안:** 원문 기본 30일, 외부 X4의 파일·망·비밀값 권한 전부 차단으로 시작한다.

- 하면: 재현에 필요한 짧은 창을 유지하면서 개인정보와 supply-chain 공격면을 줄인다.
- 안 하면: 90일 보유와 선택 권한 실행의 운영·법적 비용을 첫 출시부터 감당해야 한다.

## 7. 가장 강한 전제에 대한 steelman 반박

이 문서의 가장 강한 전제는 `상태를 가진 Studio 서비스 + DB를 모르는 무상태
엔진 + 불변 봉투`가 단독 상품과 결합 상품을 동시에 지탱한다는 것이다. 이 전제는
서비스 경계를 단순화하고 생성 재현성을 높인다는 점에서 가장 설득력이 있다.
엔진이 회원 DB와 openclaw DB를 읽지 않으면 같은 입력에 대한 회귀 시험도
쉬워진다.

그러나 현재 계약에서는 바로 그 봉투가 단일 정본이 아니다. 공통 봉투는 실제
`workspace_context` 값을 담는데 단독 전문은 여러 층을 ID와 revision으로만
적는다. 엔진이 DB를 읽을 수 없다면 누락된 실제 값은 어디에서도 복구되지 않는다.
반대로 실행 직전에 서비스가 암묵 조회해 채운다면 `불변 봉투만 실행`이라는 전제가
깨진다. 상태 비의존성이 결함을 격리하는 대신 불완전한 입력을 대량 재현하는 장치가
될 수 있다.

따라서 이 전제를 살리려면 모드별 문서 두 개가 아니라 하나의 canonical envelope
schema가 필요하다. 모든 effective value, source authority, revision, value hash,
rights state, conflict resolution을 봉투에 넣고, 단독·결합 모드는 값을 가져온
정본만 달라야 한다. 이 조건이 충족되기 전에는 무상태 엔진을 장점으로 채점할 수
없다.

## 8. 벤치마크 실조사와 적용

| 공식 출처 | 확인한 사실 | 이번 리뷰에 차용 | Studio에서 다르게 적용할 점 |
| --- | --- | --- | --- |
| [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/latest.html) | API 설명은 소스코드나 추가 문서 없이 사람과 컴퓨터가 상호작용을 이해할 수 있어야 하며 operation은 request body와 responses를 계약한다 | 동일 endpoint의 수기 계약을 둘로 두지 않고 machine-readable 단일 정본을 요구했다 | Studio의 idempotency, authority revision, 비용 승인은 reusable component와 extension으로 명시한다. |
| [arc42 documentation](https://docs.arc42.org/home/) | 요구 개요, context, building blocks, runtime, decisions, quality, risks를 안정된 구조로 분리한다 | 뒤섞인 절 번호와 중복 anchor를 client-ready 결함으로 판정했다 | FDD를 무조건 12개 절로 복제하지 않고 현재 산출물 체계를 유지하되 번호와 링크 유일성을 강제한다. |
| [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) | RLS를 켰어도 table owner는 보통 우회하며, owner까지 적용하려면 FORCE ROW LEVEL SECURITY가 필요하다 | `기본 거부` 문장만으로 격리 통과를 주지 않았다 | 앱·worker·migration 역할을 나누고 표별 USING·WITH CHECK와 교차 tenant 음성 시험을 요구했다. |

## 9. 셀프심문과 레드팀

**이 판정이 틀렸다면 가장 그럴듯한 이유는?** 요구 99건 중 상당수가 Studio FDD
적용 대상이 아니어서 ID 수 비교가 과도할 수 있다. 그래서 누락 수 자체를 모두 구현
결함으로 단정하지 않았다. 대신 각 요구를 N/A까지 포함해 분류하는 전수 RTM이
없다는 사실과, 단독 판매·R89처럼 명백히 적용되는 요구가 실제 계약에서 닫히지
않았다는 점을 반려 근거로 삼았다.

**까다로운 클라이언트의 공격:** “표와 시험이 이렇게 많은데 왜 미완성인가”라고
물을 수 있다. 표의 양은 계약 충돌을 상쇄하지 못한다. 신규 개발자가 같은
endpoint의 두 요청 중 하나를 임의 선택해야 하고, 구매자에게 돈을 받은 뒤 권한을
주고 결과를 내려줄 경로가 없으면 문서 분량과 무관하게 client-ready가 아니다.

**0번 게이트 확인:** `review` 스킬을 실제로 읽고 인터페이스 계약, 경계,
실패모드, 확장성, 가독성의 5축 렌즈를 설계 문서에 적용했다. 코드는 검토하거나
수정하지 않았다.

## 10. 재작성 지시와 재검수 종료증거

tech-architect에게 다음 순서로 재위임한다.

1. 회장 결정 Q1부터 Q5를 0절에서 닫고, 미확정 값은 본문 실행 계약에서 제거한다.
2. R01부터 R99까지 전수 RTM을 만들고 N/A에도 사유와 소유 서비스를 적는다.
3. OpenAPI 단일 정본으로 request·response·error·security·idempotency를 정의하고
   Markdown 전수표를 생성한다.
4. standalone 가입·결제·entitlement·생성·다운로드·해지 E2E를 데이터·API·시험으로 닫는다.
5. composite ownership FK, 표별 RLS DDL, 공통 idempotency·operation lease를 명시한다.
6. 번호와 anchor를 정리하고 Mermaid 10개와 모든 내부 링크를 다시 검증한다.

재검수 종료증거는 `R01-R99 누락 0`, `OpenAPI validation 0 errors`,
`endpoint schema 이중정의 0`, `Mermaid 10/10`, `내부 링크 오류 0`,
`standalone 가입→결제→권한→생성→다운로드→해지 계약 E2E 전 단계 매핑`,
`cross-tenant 음성 시험 전수 매핑`이다.

RUBRIC_SCORE: 완결성=1/5 정밀성=3/5 벤치마크반영=5/5 추적성=1/5 전문성·톤=3/5 total=13/25

WEAKEST_LINE: `매핑 gap은 0이지만 정책 gap이 5`라는 선언은 R01부터 R99까지의
전수 요구 매트릭스로 증명되지 않았다.

SKILLS_USED: review, 설계 문서의 인터페이스 계약·경계·실패모드·확장성·가독성 검토에 적용

SKILLS_SKIPPED: 없음

PRESENTATION_CHECK: Markdown 구조, 표, 내부 태그, 금칙어, HTML 변환 결과를 최종 검증함

### Sources

- `studio/docs/fdd-studio-v4.0.md` v4.0
- `studio/docs/api-contract-studio-v4.0.md` v4.0
- `docs/사업계획-osmu-v1.0.md` v1.3 §3.4
- `docs/requests/회장-확정-요구사항-대장.md` R01-R99
- `/Users/sj/.claude/standards/doc-review.md`
- `/Users/sj/.claude/standards/dev.md`
- `/Users/sj/.claude/standards/benchmarks.md`
- `/Users/sj/.claude/standards/artifact-stamp.md`
- [OpenAPI Specification 3.2.0](https://spec.openapis.org/oas/latest.html)
- [arc42 documentation](https://docs.arc42.org/home/)
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- `/tmp/studio-eng-review-codex.log`

SOURCES/MODEL: gpt-5.6-sol; FDD v4.0; API v4.0; total=13/25; cross=15/25
