# OSMU 네 방 design_spec 독립 검수 v1

## 0. 판정

**REVIEW_VERDICT: BLOCK**

`docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md`는 네 방의 차이를 유한한 목록으로 바꾸고 C1 계약, C2 표현, C3 증거를 분리하려는 방향은 맞다. 그러나 현 상태로는 design gate의 승인 기준이 될 수 없다.

무엇이 깨져 있었나. 상류 plan 승인 상태가 서로 반대이고, 미결정으로 제외한다고 선언한 D-10을 PB-04에서 확정했으며, 34개 방 단위 AC가 기존 12개 화면 행과 1:1로 연결되지 않는다. 최신 main 기준 matched-pair도 0쌍이다.

그래서 회장과 사업에 무엇이 달라지나. 이 문서를 그대로 승인하면 개발은 서로 다른 두 정답을 받는다. 한 팀은 PRD의 미결정 경계를 따르고 다른 팀은 PB-04를 따를 수 있다. QA는 12행 중 무엇을 닫았는지 증명하지 못한 채 방 단위 PASS를 화면 전체 PASS로 확대할 수 있다. 지금 승인하지 않는 것이 일정 지연이 아니라 재작업을 막는 가장 짧은 길이다.

- 독립 Design Score: **C+**
- v64 시각물 자체의 기존 A- 주장은 재평가하지 않았다. 이 점수는 design_spec의 게이트 적합성 점수다.
- 최신 main 12화면 시각 정합: **미검증**
- 기존 2026-08-28 v63 기준선: **12/12 NG 유지**
- design stage 다음 단계 진입: **불가**

## 1. 검수 범위와 방법

기반 산출물은 다음 다섯 개로 고정했다.

1. `docs/prd-openclaw-service-v8.2.1-gpt-codex.md`
2. `DESIGN.md` v33
3. `docs/prototype/openclaw-auto-4room-v64.html`
4. `docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md`
5. `docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md`

교차 근거로 `pipeline-state.osmu.md`, `docs/requests/회장-확정-요구사항-대장.md`, `docs/qa/osmu-qa-2026-08-28.md`, v64 캡처 폴더와 최신 matched-pair 작업 폴더를 읽었다. 제품 코드는 수정하지 않았다.

공식 벤치마크는 2026-08-29 KST에 다시 검색하고 원문을 열었다. Buffer 공식 도움말은 공통 초안 뒤 네트워크별 별도 상자와 채널별 미디어 차이, 채널별 preview를 명시한다. 이는 발행실의 공통값과 채널별 차이 표시를 지지하지만, 제품 결정 D-10을 승인하는 권한은 아니다. W3C WCAG 2.2는 24x24 CSS px 또는 간격 예외를 AA 최소로 둔다. 44x44는 합리적인 제품 강화 기준이지만 WCAG AA 자체의 숫자로 보고하면 안 된다. W3C Dragging Movements는 끌기 기능에 단일 포인터 대안을 요구하므로 ED-05의 키보드 또는 위, 아래 이동 대안이 필요하다는 방향을 지지한다.

## 2. P0 차단 결함

### P0-1. plan 승인 상태가 세 진실원에서 서로 반대다

발견:

- `pipeline-state.osmu.md`는 `approved_stages: [plan]`이고 승인 PRD를 v8.2.1로 가리킨다.
- 같은 파일의 `stages.plan`도 `approved`다.
- 그러나 PRD v8.2.1 §17.3은 독립 plan-critic 미실행, plan 승인 미통과, design 진입 불가라고 명시한다.
- design_spec은 PRD v8.2.1을 상류 입력으로 사용하면서 이 충돌을 판 충돌 표에 올리지 않았다.

의미:

디자인이 승인되지 않은 plan을 기반으로 했는지, PRD의 상태 문구만 낡았는지 현재 문서만으로는 판정할 수 없다. 어느 쪽이든 controller가 승인 로그와 해시를 대조해 한쪽을 정정하기 전 design 승인은 무효 위험이 있다.

필수 수정:

- approval log와 `/approve plan` 증거로 정본을 하나로 확정한다.
- PRD 상태가 낡았으면 새 PATCH 버전에서 §17.3을 고친다.
- pipeline-state가 잘못됐으면 approved artifact pin을 되돌리고 design을 reopen한다.

### P0-2. D-10을 제외한다고 선언하고 PB-04에서 확정했다

발견:

- design_spec §1.1과 §8은 D-08, D-09, D-10을 회장 승인 전 제외한다고 쓴다.
- PRD FR-028, AC-028, §16.4는 채널별 독립 편집 허용 범위와 상속, override 정책을 D-10 승인 전 확정하지 말라고 한다.
- 그러나 PB-04는 플랫폼 A를 바꿔도 B부터 G가 변하지 않는다는 완전 독립 계약을 제목, 표시 이름, 해시태그, 첫 댓글까지 확정한다.
- R124와 R184는 플랫폼별 값을 그 자리에서 고칠 수 있어야 한다는 요구다. 이 요구가 공통 기본값의 상속과 override 전파 규칙까지 확정했다는 추적 근거는 design_spec에 없다.

의미:

Buffer 공식 사례는 채널별 customize가 유용하다는 시장 근거일 뿐 회장 미결정을 대신하지 않는다. PB-04를 그대로 build에 넘기면 design이 plan 결정을 선점한다.

필수 수정:

- D-10을 승인받아 PB-04를 유지하거나,
- 승인 전에는 PB-04를 `공통값, 채널별 결과, 절단 차이를 표시한다. 편집과 전파 범위는 D-10 승인값을 따른다`로 좁힌다.
- R124, R184와 D-10의 관계를 명시한 결정 기록을 붙인다.

### P0-3. 12개 화면의 닫힘 기준이 원자적이지 않다

발견:

- design_spec에는 CR 7개, ED 8개, PB 10개, PF 9개로 총 34개 AC가 있다.
- 고정 캡처 행렬은 4개 방 x 3개 폭 12행을 요구한다.
- 그러나 34개 AC가 어느 화면, 어느 폭, 어느 C1 또는 C2를 닫는지 1:1 매핑이 없다.
- 예를 들어 CR-02와 PF-03만 폭을 직접 열거한다. CR-03, ED-05, PB-04 같은 기능 계약은 3개 폭 모두의 증거가 필요한지, 한 폭의 E2E로 충분한지 정하지 않았다.
- 기존 12행 NG의 각 셀에 있던 주축, 순서, 열 수, 표시, 글꼴, 버튼 위계를 어떤 AC가 대체하는지도 없다.

의미:

QA가 방 단위 테스트 하나를 통과시키고 3개 폭을 모두 닫았다고 해석할 수 있다. 반대로 같은 결함을 폭마다 세 번 중복 계산할 수도 있다. 12행이 유한해졌다는 문서의 핵심 약속이 아직 실행 가능한 형태가 아니다.

필수 수정:

각 12행에 다음 필드를 가진 acceptance matrix를 추가한다.

`screen_id | room | viewport | seed | C1 AC | C1 test | C2 property | prototype selector | actual selector | tolerance | evidence pair | verdict`

### P0-4. 최신 main matched-pair는 현재 0/12다

발견:

- 최신 확인 HEAD는 `31754f8f`, 2026-08-29 00:30 KST다.
- 기존 matched-pair는 2026-08-28 v63과 당시 구현을 비교한 자료다. 이후 main과 로컬 구현이 바뀌었다.
- `docs/prototype/qa-v64/`에는 12개 이미지가 있지만 4방 x 3폭의 prototype과 actual 짝이 아니다. create와 edit는 1440만 있고, 나머지는 변경 장면과 chat 상태 중심이다.
- 2026-08-29 00:34 KST 현재 `docs/qa/osmu-v64-matched-pair-20260829/`에는 prototype `create-1440.png` 1개와 actual auth, login blocker 이미지 5개만 있다. 같은 방, 같은 폭, 같은 seed의 완성된 pair는 0개다.

의미:

기존 12행 NG는 기준선으로 유효하지만 최신 main의 현재 판정으로 확대할 수 없다. 이미 고친 C2가 있을 수도 있고 새 회귀가 있을 수도 있다. 따라서 현재 12행은 PASS도 NG 확정도 아닌 `기존 NG, 최신 미검증`으로 관리해야 한다.

필수 수정:

- 동일 commit, 동일 customer auth, 동일 seed, 동일 브라우저 배율로 12쌍을 촬영한다.
- auth blocker 화면은 제품 화면 matched-pair를 대신하지 않는다.
- pair마다 DOM 계산값과 console error를 같이 남긴다.

## 3. P1 주요 결함

### P1-1. DESIGN v33과 design_spec의 상속 규칙이 일치하지 않는다

| 항목 | DESIGN v33 | design_spec | 판정 |
|---|---|---|---|
| 톤앵커 | 담백한, 정직한, 곁에 있는 | 절제된, 증거 중심, 사람다운 | 새 톤앵커 발명. 계승 실패 |
| 발행 이력 | Layout과 component inventory는 232px rail 유지 | R183에 따라 rail 0 | 요구 대장이 상위라 spec 방향은 맞지만 DESIGN v33 미보정 |
| 생성 후보 간격 | v64 source 8px | §3.5 8px, §4.1 24px | 같은 문서 안 두 값 |
| 타입 스케일 | DESIGN 본문은 24px h1과 32px hero도 사용 | 12, 13, 15, 17, 21과 32 예외만 선언, 뒤에서 24와 19 사용 | 허용값 계약 불완전 |
| 모바일 조작면 | 제품 기준 44px | 공통 44px | 방향은 일치. v64 source의 일부 40px 선언은 computed 검증 필요 |

발견:

R183이 DESIGN v33의 오래된 발행 이력 규칙보다 상위라는 판단은 맞다. 문제는 이 충돌을 `DESIGN.md 후속 보정 대상`으로 남겨 놓고 같은 v33을 현행 디자인 시스템으로 승인 후보에 묶었다는 점이다. DESIGN.md와 prototype 불일치가 결함이라는 품질 규칙을 스스로 위반한다.

의미:

build가 component inventory를 따르면 history rail을 되살리고, design_spec을 따르면 제거한다. 톤앵커와 수치도 어느 문서를 따른 개발자인지에 따라 달라진다.

필수 수정:

- DESIGN v34에서 R183, tone anchor, type scale, spacing 수치를 v64와 한 판으로 정리한다.
- design_spec은 정리된 DESIGN 버전과 해시만 가리킨다.

### P1-2. PRD 핵심 계약의 추적이 빠졌다

| PRD 계약 | design_spec 상태 | 결함 |
|---|---|---|
| FR-005부터 008, 백지 없는 8단계 | 생성실 1개 화면 순서만 있음 | 8단계와 AC 연결 없음 |
| 추천 1개 먼저, 대안 2개 이상, `다르게 보기` | 후보 3개 동등 3열 | 우선순위와 점진 공개 누락 |
| 저해상도 후보3, 선택본1만 고해상도 | 후보 3개만 표시 | 저해상도, 승격, 비용, 시간, 추가 과금 상태 누락 |
| 근거 라벨 3종 | 성과실의 다른 basis 3종만 정의 | 생성 추천의 우리 실험 로그, 공개 사례, 가설과 혼동 |
| user flow의 16개 named state | generic 5상태와 일부 오류 | source-conflict, estimate-changed, rights, disclosure, wrong-account 등 누락 |
| AC-020 변경된 추천과 승인 전 profile mutation0 | 네 방 연결 한 줄 | 변경 diff와 사람 승인 AC 없음 |

발견:

design_spec은 v24의 12화면 정합을 닫는 좁은 문서라고 주장하지만 design gate 산출물로 쓰려면 승인 PRD의 핵심 전환 계약을 누락할 수 없다. 특히 후보가 왜 저비용인지와 어떤 하나만 고해상도로 승격되는지는 PRD One Thing의 일부다.

의미:

현재 명세대로 시각 정합만 맞추면 3개 후보가 잘 보이는 생성기는 만들 수 있지만, 비용과 과금 원칙을 어긴 비싼 제품이 될 수 있다. 화면은 예뻐져도 사업 모델이 틀린다.

필수 수정:

- 34개 AC마다 상류 `FR/AC/R`를 최소 1개 연결한다.
- PRD 범위 밖이면 명시적으로 `not covered by this spec`과 별도 design artifact owner를 적는다.
- gate 승인 전 전체 PRD coverage가 다른 artifact에서 닫혔다는 핀을 제공한다.

### P1-3. C1과 C2를 이름만 분리했고 증거 단위는 아직 섞였다

발견:

- 원인표는 C1과 C2를 구분한다.
- 그러나 화면별 구현 차이에는 `C1, C2`가 한 셀에 같이 들어간다.
- 12행 capture matrix는 데이터 상태만 있고 C1 test와 C2 image diff 열이 없다.
- 자동 측정에는 기능 테스트와 시각 측정이 한 목록으로 섞여 있다.

의미:

플랫폼 독립 값 테스트가 PASS여도 320px 벽이 틀리면 C2는 NG다. 반대로 캡처가 닮아도 저장과 복원이 안 되면 C1은 NG다. 둘을 한 verdict로 유지하면 정확히 무엇을 고쳐야 하는지 다시 흐려진다.

필수 수정:

- 각 12행에 `C1 verdict`, `C2 verdict`, `combined gate verdict`를 따로 둔다.
- C1은 E2E 또는 DOM 상태 전이 증거, C2는 matched-pair와 계산값으로만 닫는다.
- combined는 둘 중 하나라도 NG 또는 미검증이면 PASS를 금지한다.

## 4. 12화면 독립 판정

아래는 최신 main의 PASS 판정표가 아니다. 기존 v63 기준선과 현재 증거 공백을 함께 표시한 gate 검수표다.

| 화면 | 폭 | 기존 기준선 | C1 추적 | C2 추적 | 최신 matched-pair | 현재 판정 |
|---|---:|---|---|---|---|---|
| 생성실 | 390 | NG | CR-01, 03부터 07이 폭별 test로 분해되지 않음 | CR-02 일부 | 없음 | 미검증, 기존 NG 유지 |
| 생성실 | 1024 | NG | 동일 | 3열 외 여백, 위계 tolerance 없음 | 없음 | 미검증, 기존 NG 유지 |
| 생성실 | 1440 | NG | HUMAN-01 기준선은 후보 생성 차단 | 8px와 24px 충돌 | 없음 | 미검증, 기존 NG 유지 |
| 편집실 | 390 | NG | ED-05, 06 test 필요 | 순서 외 세로 길이, target 기준 불완전 | 없음 | 미검증, 기존 NG 유지 |
| 편집실 | 1024 | NG | 동일 | 168px 목차 외 tolerance 없음 | 없음 | 미검증, 기존 NG 유지 |
| 편집실 | 1440 | NG | HUMAN-03 기준선은 재정렬과 영속 실패 | placeholder 제거 기준 있음 | 없음 | 미검증, 기존 NG 유지 |
| 발행실 | 390 | NG | PB-04가 D-10과 충돌 | wall 내부 overflow 계약 있음 | 없음 | 미검증, 기존 NG 유지 |
| 발행실 | 1024 | NG | 동일 | 320px wall 기준은 있음 | 없음 | 미검증, 기존 NG 유지 |
| 발행실 | 1440 | NG | HUMAN-04 기준선은 영상 캡션 결합 | 실제 플랫폼 순서의 구체 selector 없음 | 없음 | 미검증, 기존 NG 유지 |
| 성과실 | 390 | NG | PF-02, 05, 06, 09 test 필요 | 2열 기준 있음 | 없음 | 미검증, 기존 NG 유지 |
| 성과실 | 1024 | NG | 동일 | 4열 기준 있음 | 없음 | 미검증, 기존 NG 유지 |
| 성과실 | 1440 | NG | 기존 제안 enqueue는 부분 PASS | fold 기준의 정확한 높이와 seed 없음 | 없음 | 미검증, 기존 NG 유지 |

발견의 의미는 명확하다. 기존 NG를 지울 새 증거가 없고, 새 명세도 12행을 닫는 세부 계약으로 아직 충분하지 않다. 따라서 `12/12 PASS`가 아니라 `12/12 최신 미검증`이 정확한 현재 상태다.

## 5. 공식 벤치마크 적용 판정

### Buffer

공식 도움말은 공통 base에서 시작한 뒤 `Customize for each network`로 네트워크별 별도 상자를 만들고, 채널별 미디어와 첫 댓글 능력이 다르며, 게시 뒤 보일 모습을 채널별 preview로 보여 준다고 설명한다. 이 원리는 PB-03, PB-05, 공통값과 차이 표시를 지지한다.

차용할 것: 공통 시작값, 네트워크별 차이의 명시, 실제 preview, 미완성 draft 복원.

차용하지 않을 것: Buffer의 화면 외형과 브랜드 자산, Buffer 기능 범위를 OSMU backend 능력으로 간주하는 것, D-10 미결정을 벤치마크로 대신 승인하는 것.

### W3C WCAG 2.2

SC 2.5.8은 최소 24x24 CSS px 또는 정해진 간격 예외를 요구한다. 중요한 조작에 더 큰 표적을 쓰는 것을 권장하지만 44px을 AA 최소라고 말하지 않는다. OSMU의 44px은 좋은 제품 기준이며 문서도 대체로 이 경계를 정확히 설명한다.

SC 2.5.7은 dragging 기능에 dragging 없는 single pointer 대안을 요구한다. ED-05는 keyboard만 적을 것이 아니라 위, 아래 단추 같은 single pointer 대안도 AC에 고정해야 한다. v64에 위, 아래 이동이 있다면 actual 구현과 같은 selector로 추적한다.

## 6. 승인 전 최소 리테이크

1. plan 승인 상태를 PRD와 pipeline-state에서 한 값으로 만든다.
2. D-10을 승인받거나 PB-04를 미결정 경계 안으로 축소한다.
3. DESIGN v34로 history rail, tone anchor, 8px와 24px, type scale 충돌을 정리한다.
4. 34개 AC를 PRD FR, AC, 요구 R과 연결한다.
5. 12행 acceptance matrix에 C1과 C2 증거를 분리한다.
6. 최신 main, customer auth, 같은 seed로 12개 matched-pair를 만든다.
7. C1 E2E와 C2 pair가 모두 PASS인 행만 combined PASS로 바꾼다.

이 일곱 개가 닫히기 전 design 승인은 불가하다. 닫힌 뒤에는 새 시각 방향을 다시 만들 필요가 없다. v64를 유지하고 문서와 증거를 정합시키는 PATCH 리테이크면 된다.

## 7. 레드팀

회의적 투자자의 공격: 문서가 34개 AC를 가졌다는 사실은 사업 위험을 줄이지 않는다. 승인되지 않은 plan과 미결정 가격, 메타데이터 정책을 그대로 둔 채 화면만 정교해지면 재작업 비용만 커진다. 이 공격을 반영해 시각 품질 A-를 gate 적합성 점수와 분리했다.

까다로운 고객의 공격: 플랫폼별 캡션이 독립적으로 보이는 것과 실제로 저장, 재진입, 발행 proof까지 독립인 것은 다르다. 이 공격을 반영해 PB-04를 screenshot으로 닫지 못하게 하고 C1 E2E를 별도 요구했다.

경쟁자의 공격: Buffer 원리를 가져왔다는 설명으로 제품 결정을 정당화하면 OSMU는 결국 Buffer 복제품이 된다. 차별점은 담당 대화와 네 방 폐루프지만, 현재 명세는 PRD의 저비용 후보와 근거 변경 루프를 충분히 추적하지 않는다. 이 누락을 P1로 올렸다.

## 8. 셀프심문

질문: 이 BLOCK 결론이 틀렸다면 가장 그럴듯한 이유는 무엇인가?

답: 현재 다른 워커가 matched-pair를 생성 중이고, D-10도 회장 요구 R124와 R184로 이미 사실상 확정됐다고 볼 수 있다.

수정: matched-pair는 작성 시각을 명시해 진행 중 상태와 최종 증거를 구분했다. D-10은 R124, R184의 기능과 위치 요구를 인정하되 상속과 override 전파 범위까지 확정했다는 결정 기록이 없다는 좁은 결함으로 한정했다. 이후 완성된 12쌍과 승인 기록이 생기면 P0-4와 P0-2는 증거로 해소할 수 있다.

가장 load-bearing한 가정은 `pipeline-state`의 plan 승인과 PRD의 plan 미승인이 단순 문구 노후가 아니라 게이트 무결성 문제라는 판단이다. approval log가 v8.2.1을 명시적으로 승인했다면 PRD PATCH로 상태를 바로잡아 이 결함을 닫을 수 있다. 그 증거가 없으므로 현재는 추정 통과를 주지 않는다.

## 9. 품질 점수

Design Score: **C+**

| 축 | 점수 | 근거 |
|---|---:|---|
| 상류 정합 | 1/5 | plan 상태 충돌, D-10 선확정 |
| 요구 추적성 | 2/5 | 방 단위 AC는 있으나 PRD 핵심 계약과 1:1 연결 부족 |
| 12화면 검증 가능성 | 2/5 | 캡처 행렬은 있으나 행별 selector, seed, tolerance 없음 |
| C1, C2 분리 | 3/5 | 분류 개념은 맞지만 verdict와 증거 단위가 섞임 |
| 디자인 시스템 정합 | 2/5 | R183 방향은 맞으나 v33과 tone, 수치 충돌 |

RUBRIC_SCORE: upstream-coherence=1/5 traceability=2/5 twelve-screen-testability=2/5 c1-c2-separation=3/5 design-system-fidelity=2/5 total=10/25

WEAKEST_LINE: `D-08, D-09, D-10을 제외한다`고 선언한 문서가 PB-04에서 D-10의 독립 편집 범위를 확정한다.

SKILLS_USED: 없음. 현재 Codex 런타임에 독립 product design review 또는 design-review callable skill이 노출되지 않았다. 지정 기반 문서, 디자인 품질헌법, 공식 벤치마크 원문을 직접 대조했다.

SKILLS_SKIPPED: design-review. 호출 가능한 스킬이 없어 실행하지 않았으며 실행했다고 주장하지 않는다. 이 문서는 새 시각물을 채점한 것이 아니라 design_spec의 게이트 적합성을 독립 검수했다.

SOURCES: `/Users/sj/.claude/standards/design.md` | `/Users/sj/.claude/standards/benchmarks.md` | `/Users/sj/.claude/standards/artifact-stamp.md` | `pipeline-state.osmu.md` | `docs/prd-openclaw-service-v8.2.1-gpt-codex.md` | `DESIGN.md` v33 | `docs/prototype/openclaw-auto-4room-v64.html` | `docs/design-spec-osmu-4room-convergence-v1.0.1-gpt-codex-20260829-0025.md` | `docs/qa/osmu-v24-design-conformance-matrix-v1-gpt-codex.md` | `docs/qa/osmu-qa-2026-08-28.md` | `docs/requests/회장-확정-요구사항-대장.md` | Buffer official Scheduling Posts, verified 2026-08-29, <https://support.buffer.com/en-us/articles/scheduling-posts-4Qdld7giAZ> | W3C official Understanding SC 2.5.8, verified 2026-08-29, <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html> | W3C official Understanding SC 2.5.7, verified 2026-08-29, <https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html>

MODEL: gpt-codex/gpt-5.6-sol / product-designer independent reviewer

STAMP: 2026-08-29 00:33 KST | line=osmu | artifact=design-spec-independent-review | version=v1 | model=gpt-codex/gpt-5.6-sol | agent=product-designer-independent-reviewer | skills=none, design-review unavailable | evidence=approved artifact pins, PRD and DESIGN source, v64 source and capture inventory, old 12-row QA, in-progress matched-pair inventory, Buffer and W3C official Web Search and Open | 고민=시각물 A-와 게이트 적합성을 분리하고, 기존 NG와 최신 미검증을 같은 말로 섞지 않아야 다음 개발이 정확히 선다.
