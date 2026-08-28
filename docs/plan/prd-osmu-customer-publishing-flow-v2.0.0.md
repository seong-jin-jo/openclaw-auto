# OSMU 고객 연결→초안→검수→실발행 PRD v2.0.0

연결됨 배지가 아니라, 새 고객이 자기 계정으로 올린 실제 게시물의 permalink가 OSMU의 첫 성공이다.

| 항목 | 값 |
|---|---|
| 문서 상태 | `plan in-progress` — 회장 질문 답변 및 `/approve plan` 전 미확정 |
| 작업 라인 | `openclaw-auto-osmu` |
| 작성일 | 2026-08-01 KST |
| 상류 입력 | `pipeline-state.md` 2026-08-01 reopen · `docs/qa-tracker.md` 시크릿 창 FAIL/P0-6 · `wiki-1-mellow-wadler.md` |
| 제품 단계 | 기존 13개 요청, 신규 고객 실패, 2차 백로그를 단일 고객 여정으로 재편하는 plan 산출물 |
| 금지 경계 | 화면 배치·API 계약·DB 스키마·엔티티·시스템 아키텍처·가격 숫자 확정 금지 |

## 1. 한 줄 결론

OSMU v2는 신규 고객이 자기 SNS 계정을 식별 가능한 상태로 연결하고, 브랜드 근거가 표시된 초안을 같은 작업 구조에서 검수한 뒤, 실제 발행 permalink를 확인하게 만드는 제품이다.

기존 계획은 결함을 파일과 컴포넌트 단위로 닫았지만, 2026-08-01 시크릿 창 검증에서는 OAuth 동의 뒤에도 연결 상태가 어긋났고 초안→검수→발행 경로를 찾지 못했다. 이번 PRD는 로컬 테스트나 `connected=true`를 활성화 증거로 쓰지 않는다. 고객이 보는 계정명과 실제 게시물 URL을 제품 가치의 양 끝으로 삼는다.

## 2. 문제 정의와 기획 범위

### 2.1 관찰된 문제

- Threads 동의 뒤 Channel Info는 `연결 안 됨`으로 남았다.
- Instagram 동의 뒤에도 OAuth 연결 버튼과 `재연결 필요`가 남았고, 별도의 빈 수동 토큰 폼이 보여 두 정본처럼 보였다.
- Settings와 채널 화면이 같은 계정 상태를 보여주지 않았다.
- Threads와 Instagram의 탭·기능 구조가 달라 고객이 다음 행동을 예측할 수 없었다.
- 초안 생성→사실 근거 확인→수정/승인→실발행→permalink 확인이 하나의 여정으로 이어지지 않았다.
- 운영 502가 관찰됐지만 이후 health 200만 남아 발생 시각·영향 요청·upstream 실패가 보존되지 않았다.
- 다른 OSMU 고객으로 로그인해도 Threads 동의 화면은 기존 `zero_to_one_ai` 세션을 제시했다. Meta/Threads가 현재 활성 브라우저 계정을 쓰는 제약과 OSMU가 저장한 계정의 불일치를 고객이 판별할 장치가 없었다.

### 2.2 이번 plan이 결정하는 것

- 고객 가치, 주 사용자, One Thing, 성공/중단 기준.
- 고객이 이해할 수 있는 연결·발행 상태와 공통 행동 순서.
- Threads/Instagram MVP capability와 기능 노출 원칙.
- 기존 13개 요구·신규 실패·2차 백로그의 요구–수용기준 추적성.
- BM 선택지, 운영 부하, 법적·시장·기술 리스크, 하류 단계에 넘길 미결정.

### 2.3 이번 plan이 결정하지 않는 것

- callback/API의 URL·payload·HTTP 계약.
- 연결 상태를 저장할 테이블·컬럼·enum·마이그레이션.
- 화면별 레이아웃, 탭 이름, 컴포넌트 구조, 디자인 토큰.
- queue·publication·usage 원장의 물리적 통합 방식.
- 구체 가격, 크레딧 환율, 포함량, 결제사업자, 환불 회계 방식.

이 항목은 plan 승인 뒤 디자인 또는 기술설계에서 선택지와 트레이드오프를 회장과 합의한다.

## 3. 주 페르소나 — 김민서, 34세, 1인 온라인 클래스·상담 사업자

김민서는 서울에서 직장인 대상 재무 습관 온라인 클래스와 1:1 상담을 혼자 운영한다. 월매출 700만~1,200만 원, 고객 유입의 절반 이상이 Instagram과 Threads, SNS 작업시간 평일 밤 40분, 대행비 월 150만 원, 잘못된 안내로 문의 2건, 게시 공백 10일은 모두 **(unsourced: 인터뷰 전 페르소나 가설)**이다. 이 숫자는 시장 사실이나 가격 근거로 사용하지 않고, 외부 자격고객 인터뷰에서 검증·교체한다. 상품 설계, 상담, 정산, CS까지 직접 맡는다는 역할 가설 아래, ChatGPT로 문장을 만들더라도 최신 커리큘럼·금지 표현·후기 범위를 매번 다시 붙여 넣어야 하는 반복 작업을 겪는 인물로 설정한다.

민서는 개발자 도구에 익숙하지 않다. `Client ID`, `redirect URI`, `Graph API token`이 한 화면에 보이면 무엇부터 해야 할지 모른다. 원하는 것은 “OAuth가 뭔지 배우기”가 아니라, Instagram 또는 Threads에서 지금 로그인한 계정명이 OSMU에 그대로 표시되고, 그 계정으로 무엇이 나갈지 마지막으로 확인하는 것이다. 특히 개인 계정과 사업 계정을 같은 브라우저에서 쓰기 때문에 잘못된 계정에 게시되는 사고를 가장 두려워한다. 연결 후에는 홈페이지·기존 SNS·가격표를 넣어 브랜드 위키 초안을 받고, 어떤 사실이 이번 글에 쓰였는지 확인한 뒤 문장 두세 군데만 고치고 발행하고 싶다. 성공의 장면은 초록 배지가 아니다. “@minseo_money에 발행됨” 옆의 실제 Threads 또는 Instagram URL을 눌러 자기 게시물을 보는 순간이다. 실패했을 때도 `error 190`이나 502 대신 “Instagram 권한이 만료되어 다시 연결해야 함”, “GitHub 호출 한도가 14:32에 풀림”처럼 다음 행동이 한글로 보여야 다시 시도한다. 민서는 자동화가 많아서 결제하지 않는다. 잘못된 계정·사실·발행 성공 표시 때문에 생길 정신비용을 줄여 주면 결제한다.

### 페르소나 pain 한 줄

SNS는 매출에 필요하지만, 계정 연결부터 브랜드 사실 확인과 발행 결과 검증까지 매번 자신이 시스템 관리자가 되어야 하는 것이 가장 큰 고통이다.

### 근거

- 내부 제품 비전의 1순위 타깃은 코딩·자동화 구축 능력이 없는 자영업자·1인 대표다.
- 2026-08-01 사용자 실화면에서 OAuth·수동 토큰·상태 불일치가 동시에 관찰됐다.
- Buffer도 Threads/Instagram은 브라우저에서 현재 활성인 계정이 연결되며, 여러 계정 중 목록을 API로 가져올 수 없다고 안내한다. 이 제약은 “연결 버튼 하나면 계정 선택까지 OSMU가 통제한다”는 가정을 반박한다.

## 4. JTBD와 One Thing

### 4.1 핵심 JTBD

“내 사업을 운영하느라 SNS를 직접 관리할 시간이 없을 때, 잘못된 계정이나 사실로 게시될 걱정 없이 내 브랜드 근거가 적용된 초안을 검수하고 실제 게시 결과까지 확인하고 싶다.”

### 4.2 One Thing 후보와 잘못된 답의 함정

| 후보 | 매력 | 잘못된 답의 함정 | 판정 |
|---|---|---|---|
| A. 20개 채널을 한 번에 자동화한다 | 기능 폭을 크게 보이게 한다 | 연결·발행 능력이 다른 채널을 같은 카드로 노출해 현재 IA 실패를 반복한다. Blotato/Postiz와 기능 수 경쟁에 들어간다. | 탈락 |
| B. 브랜드 위키로 헛소리 없는 콘텐츠를 만든다 | 차별화와 일치한다 | 연결·검수·실발행이 실패하면 좋은 초안도 고객 가치가 아니다. | 단독 One Thing으로 탈락, 핵심 보조축 |
| C. OAuth 연결 성공률을 높인다 | 현재 P0에 직접 대응한다 | callback 성공을 제품 성공으로 오인해 `연결됨` 뒤의 초안·발행 단절을 다시 숨긴다. | 탈락 |
| D. AI가 글·이미지·영상을 모두 만든다 | 로드맵 포괄성이 높다 | operator 전용 크레딧·TTS·SSRF·비용 원장이 닫히기 전 고객 약속이 과도하다. | MVP 보조 기능으로 제한 |
| E. 신규 고객이 자기 계정을 확인하고 초안에서 실발행 URL까지 간다 | 고객의 첫 가치와 QA 종료증거가 같다 | 기능 수가 적어 보일 수 있으나 가장 하중을 받는 가정을 검증한다. | 채택 |

### 4.3 최종 One Thing

**외부 고객 1명이 자기 Threads 계정 1개를 확인하고, 고객이 확인한 브랜드 사실로 초안 1건을 검수·실발행해 실제 permalink 1개를 여는 것.**

Instagram은 요구에서 빠지지 않는다. 다만 R1 첫 실험의 하중 가정은 Threads 한 채널로 축소하고, Instagram은 동일 시점의 R0 회귀 차단과 별도 실계정 계약 검증 대상으로 둔다. Threads의 계정 전환 제약을 Instagram에 일반화하지 않는다.

## 5. 성공 지표, 가드레일, kill-criteria

### 5.1 북극성 지표의 분모·시계·제외 규칙

`Verified Publish Activation Rate` = **분자 / 분모**다.

- **분모:** 초대받은 외부 자격고객 중, 본인 소유 Threads 계정으로 OAuth 시작을 누르고 실험 동의까지 마친 고유 tenant 수. 같은 tenant의 재시도는 분모를 늘리지 않는다.
- **분자:** 해당 tenant가 ①OAuth 반환 handle을 본인 계정이라고 확인하고 ②고객이 확인한 브랜드 사실을 최소 1개 사용해 초안 1건을 만들고 ③최종 문안을 승인하고 ④Threads 실발행 뒤 permalink를 열어 외부 게시물을 확인한 경우다.
- **시계 시작:** 첫 OAuth 시작 클릭. **시계 종료:** permalink 첫 열기 또는 24시간 경과. OAuth 취소 후 재시도와 provider 장애 대기는 같은 tenant의 한 시계에 포함하되 별도 이탈 원인으로 기록한다.
- **내부 제외:** 회장·직원·에이전트·자동화 테스트·Meta 앱 테스터 전용 계정·교육사업 dogfood tenant는 외부 activation 분모/분자에서 제외한다. 교육사업 1곳은 제품 회귀와 운영 연습 표본으로만 별도 집계한다.
- **permalink 규칙:** provider가 반환한 외부 게시물 식별자에 대응하고, 로그인 가능한 독립 브라우저에서 목표 handle의 게시물로 열려야 한다. 내부 history URL, callback URL, 빈 URL, 추정 조합 URL은 인정하지 않는다.
- **시간 기준:** `15분`은 목표가 아니다. 최초 외부 5명의 실제 소요시간 기준선이 생기기 전에는 15분 합격선을 확정하지 않는다. 5명 이후 중앙값·상위 이탈 단계와 함께 회장이 목표시간을 승인한다.

### 5.2 단계별 퍼널

| 단계 | 고객이 보는 종료증거 | 목표 초안 |
|---|---|---|
| A0 자격·동의 | 외부 자격고객·소유계정·실험동의 확인 | 내부/dogfood 제외 규칙 100% 적용 |
| A1 연결 | provider·계정명·프로필 식별자와 `연결됨` | Threads·Instagram 별도 실계정 회귀 100% |
| A2 그라운딩 | 적용된 브랜드 근거의 출처·개수 표시 | 생성 시 표시 누락 0건 |
| A3 검수 | 수정 또는 승인한 최종본 고정 | 초안 대비 최종본 추적 가능 |
| A4 발행 | 실제 provider permalink 열림 | 성공 표시의 URL 누락 0건 |

시간 목표는 외부 5명 기준선 뒤 확정한다. 첫 실험 표본·중단선은 아래 kill-criteria가 정하며, 디자인 문구나 내부 테스트가 이를 대체하지 않는다.

### 5.3 가드레일

- 다른 tenant의 계정명·토큰·초안·위키·게시 결과 노출 0건.
- permalink 없는 결과를 `발행됨`으로 표시하는 경우 0건.
- 외부 provider가 확인 불가한 상태를 `연결 안 됨`이나 `연결됨`으로 단정하는 경우 0건.
- private 서비스의 콘텐츠 원문·계정 식별자·행동 로그를 `postAGI-analytics`에 적재하는 경우 0건.
- 토큰·Client Secret·BYOK 원문을 화면 기본상태, 로그, analytics, 문서에 남기는 경우 0건.

### 5.4 kill-criteria

- **수요:** 2주 동안 외부 자격고객 100명에게 구체적인 파일럿 제안을 보냈는데 유상/무상 파일럿 참여 동의가 3명 미만이면 R1 개발 확대를 멈추고 페르소나·문제·제안을 다시 검증한다. `100명/3명`은 **(unsourced: 첫 실험 중단선)**이며 시장 평균으로 주장하지 않는다.
- **첫 가치:** 외부 자격고객 10명 중 3명 미만이 Threads A1→A4를 끝내면 Instagram·영상·채널 확대를 중단하고 가장 큰 이탈 단계의 제품 계약을 다시 연다. 모집 실패는 위 수요 kill과 분리한다.
- **반복 가치:** 첫 외부 10명 중 3명 미만이 첫 permalink 이후 14일 안에 두 번째 실발행 permalink를 만들면 “첫 게시만 돕는 데모”로 판정하고 유료 self-service credit·채널 확대를 보류한다. `10명/3명/14일`은 **(unsourced: 반복가치 실험선)**이다.
- **기술 신뢰:** 10영업일 동안 신규 외부 tenant의 Threads 실계정 E2E 20회 중 wrong-account, false-success, cross-tenant write/read, permalink 없는 완료가 1회라도 나오면 출하를 중단한다. 자동 테스트와 교육사업 dogfood는 20회에 포함하지 않는다.
- **장애 복구:** 고객이 502/timeout을 본 요청이 중복 게시 없이 재개·조회되지 않거나, 운영자가 상관 ID로 원인·영향·배포버전을 추적하지 못하면 해당 출하를 중단한다. 고객 복구와 운영 추적은 서로 다른 종료증거다.

## 6. R0 회귀 차단과 R1 첫 실험

29개 요구는 모두 master에 남기되 한 릴리스로 묶지 않는다. **R0는 사용자가 이미 관찰한 거짓 상태·오연결·502 재발을 막는 출하 전제**, **R1은 외부 고객 1명의 Threads 첫 permalink를 검증하는 5개 기능**이다.

| R1 기능 | 고객 결과 | One Thing 연결 | 제외/경계 |
|---|---|---|---|
| M1. 자기 Threads 계정 확인 | OAuth 반환 handle을 고객이 직접 확인한다. provider 세션 변경 안내→재OAuth→handle 확인을 완료조건으로 삼는다. | 자기 Threads 계정 1개 | OSMU account picker를 약속하지 않음. Instagram 전환 계약에 그대로 복사하지 않음 |
| M2. 확인된 브랜드 사실 1개 | 고객이 사실·출처를 보고 최소 1개를 확인한다. | 확인된 브랜드 사실 | AI 자동채움 전체와 GitHub 고급 sync는 첫 실험 필수 아님 |
| M3. Threads 초안 1건 | 확인된 사실을 사용한 Threads 초안을 만들고 적용 근거를 표시한다. | 초안 1건 | 다채널 동시 생성·영상·카드뉴스 제외 |
| M4. 사람 검수 | 고객이 문안을 수정하거나 승인하고 목표 handle을 다시 본다. | 검수 | 완전 자동발행 제외 |
| M5. 실발행 permalink | 중복 클릭을 막고 실제 Threads 게시물 URL을 열어 확인한다. | 실제 permalink 1개 | 내부 성공 배지·history URL은 불인정 |

R0는 Threads와 Instagram 모두에 적용한다. 특히 Instagram은 OAuth 성공 뒤 연결 CTA가 사라지고 계정 정보/초안 CTA로 교체되어야 하며, live 검증 근거 없이 `재연결 필요`를 표시하지 않고, 빈 `Instagram Graph API 토큰` 폼은 기본 화면에서 보이지 않아야 하며, Settings에서 같은 계정·상태를 찾을 수 있어야 한다. 이 네 조건은 서로 묶지 않고 각각 독립 TC로 검증한다.

## 7. 고객 여정과 상태 언어

### 7.1 공통 고객 여정

1. 연결할 채널을 고른다.
2. OAuth 기본 경로에서 provider 계정을 인증한다. 현재 활성 계정이 목표 계정과 다르면 provider 소유 세션을 바꾸는 정확한 안내를 거친다.
3. OSMU로 돌아오면 저장 완료가 아니라 provider identity 검증까지 끝난 계정명·프로필을 확인한다.
4. 홈페이지·SNS·직접 입력·GitHub 중 소스를 추가해 사이트 내 브랜드 위키 초안을 만든다.
5. 글감을 입력하거나 자동 제안을 선택하고, 이번 생성에 적용된 근거를 확인한다.
6. 채널별 변형을 같은 검수 구조에서 수정·승인한다. 미지원 capability는 선택 전에 사유와 함께 비활성으로 보인다.
7. 발행한다. 각 채널은 `발행됨+permalink`, `실패+조치`, `부분성공+중복발행 금지/복구` 중 하나로 끝난다.

### 7.2 고객용 연결 상태 어휘

| 상태 | 의미 | 고객이 할 수 있는 다음 행동 |
|---|---|---|
| 연결 전 | 저장된 자격증명 없음 | OAuth 연결 시작 |
| 연결 중 | provider 인증 또는 callback 처리 중 | 창을 닫지 않고 대기, 시간 초과 시 재시도 |
| 계정 확인 필요 | callback 결과의 계정이 목표 계정인지 고객 확인 필요 | 계정명 확인 또는 provider 세션 전환 |
| 연결됨 | 저장과 provider identity 검증이 모두 성공 | 초안 만들기 |
| 확인 불가 | 저장 정보는 있으나 provider 5xx/네트워크로 현재 검증 불가 | 기존 값을 보존하고 나중에 다시 확인 |
| 재연결 필요 | 토큰 만료·권한 철회·identity 불일치 | OAuth 재연결 |
| 권한 부족 | 계정은 확인됐으나 발행 capability 권한 없음 | 필요한 권한과 App Review/계정 조건 확인 |

`connected`, `valid`, `live`, `not connected`, `error 190`을 화면마다 다르게 번역하지 않는다. 최종 한글 용어와 마이크로카피는 디자인 단계에서 확정하되 의미는 이 표를 유지한다.

### 7.3 고객용 발행 상태 어휘

| 상태 | 완료 주장 가능 여부 | 필수 표시 |
|---|---|---|
| 초안 | 불가 | 생성 근거, 수정 가능 본문 |
| 검수 대기 | 불가 | 채널별 차이·경고·승인 행동 |
| 발행 중 | 불가 | 대상 계정명·채널, 중복 클릭 방지 |
| 발행됨 | 가능 | provider 외부 ID와 permalink |
| 일부 성공 | 불가 | 채널별 결과, 성공 URL, 재시도 안전성 |
| 기록 복구 필요 | 불가 | 외부 발행 URL, 외부 재발행 금지, 내부 기록 복구 안내 |
| 실패 | 불가 | 한글 원인, 고객/운영자/외부 provider 중 조치 소유자 |

## 8. capability matrix 기반 공통 IA 계약

이 표는 화면 탭이나 컴포넌트를 확정하지 않는다. 고객이 어떤 채널에서도 같은 행동 순서를 예측하도록 제품 능력과 차이를 정의한다.

| capability | Threads MVP | Instagram MVP | 공통 노출 원칙 |
|---|---|---|---|
| OAuth 연결 | 지원 | 지원 | 가장 먼저, 수동 토큰보다 우선 |
| 현재 계정 확인 | handle/profile 확인 | handle/profile 확인 | callback 뒤 같은 위치·언어로 확인 |
| 다중계정/전환 | 공식 근거가 확인된 현재 세션 제약 안내→재OAuth→반환 handle 확인 | **미확정:** Instagram Login의 계정 선택·재인증 계약을 공식 문서와 신규 실계정에서 별도 검증 | provider별 계약을 공유 가정으로 만들지 않음 |
| 텍스트 초안 | 지원 | caption 지원 | 공통 초안–검수 단계 |
| 이미지 | R1 제외 | Instagram 피드 발행 조건에 맞춰 별도 정의 | Threads 첫 실험 요구를 Instagram에 강제하지 않음 |
| 카드뉴스 | 미지원/해당 없음 | 후속 capability | 공통 흐름을 깨는 별도 홈이 아니라 지원 범위로 표시 |
| 영상/TTS | 후속 | Reels 후속 | 고객별 비용·권한·TTS 권리 계약 전 기본 노출 금지 |
| 즉시 발행 | 지원 | 지원 | 검수 뒤 같은 행동 위치 |
| 예약 발행 | 기존 자산 유지, MVP 우선순위는 회장 결정 | 동일 | 미지원이면 연결 가능과 발행 가능을 구분 |
| permalink | 필수 | 필수 | 없으면 `발행됨` 금지 |
| Analytics | provider가 제공하는 범위 | provider가 제공하는 범위 | capability 없음을 빈 탭으로 만들지 않음 |
| Growth/Popular | Threads 차별 capability | 미지원 | 공통 핵심 여정 뒤의 채널 전용 영역 |

## 9. 29개 master 요구–AC–QA 추적 매트릭스

단계는 `R0 회귀차단`, `R1 첫 실험`, `R2 반복가치 이후`, `Backlog`, `기존완료-회귀TC` 중 하나다. `기존완료-회귀TC`도 운영 완료를 뜻하지 않는다. 현재 증거가 자동 테스트뿐이거나 새 사용자 관찰과 충돌하면 **미검증**으로 표기한다. 소유자 약어는 `PD=product-designer`, `TA=tech-architect`, `CB=code-builder`, `QV=qa-verifier`, `OPS=운영자`다.

### 9.1 기존 회장 요청 13개

| ID | 요구 | 단계 | 현재 증거 | owner | 원자 AC | QA TC |
|---|---|---|---|---|---|---|
| L-01 | GitHub 주소 그대로 입력 | 기존완료-회귀TC | 자동 검증·일부 운영 호출 관찰, Studio 실화면 **미검증** | CB→QV | **Given** 지원 GitHub URL **When** sync 전 확인 **Then** repo/ref/path가 보이고 비-GitHub·userinfo·순회는 호출 전 거부 | TC-L01-URL-NORM |
| L-02 | sync 오류 표시 | 기존완료-회귀TC | 자동 테스트, 신규 고객 실화면 **미검증** | CB→QV | **Given** sync 외부실패 **When** 종료 **Then** 성공 배너 없이 한글 원인·다음 행동 표시 | TC-L02-SYNC-ERROR |
| L-03 | fine-grained PAT 404 분리 | 기존완료-회귀TC | 자동 테스트, private 실레포 **미검증** | TA/CB→QV | **Given** 403/404 **When** 진단 **Then** 레포·권한·브랜치·키·Wiki·한도를 상호배타적으로 표시 | TC-L03-PAT-CAUSE |
| L-04 | md 저장·보안 | 기존완료-회귀TC | 코드/RLS 테스트, 운영 교차 tenant **미검증** | TA/CB→QV | **Given** A 문서/PAT **When** B tenant·로그·analytics 조회 **Then** 원문 노출 0건 | TC-L04-TENANT-SECRET |
| L-05 | GitHub 없는 고객 대안 | R1 첫 실험 | 미구현/미검증 | PD→TA/CB→QV | **Given** GitHub 없는 외부 고객 **When** 브랜드 사실 1개 입력·확인 **Then** Threads 초안 근거로 선택 가능 | TC-L05-MANUAL-FACT |
| L-06 | 계정·생성 근거 표시 | R1 첫 실험 | 사용자 관찰상 계정 상태 FAIL, 근거 표시는 미검증 | PD→CB→QV | **Given** 확인 계정·사실 1개 **When** 초안 생성 **Then** 목표 handle과 사용 사실·출처가 함께 표시 | TC-L06-HANDLE-GROUND |
| L-07 | 브랜드 AI 자동채움 | R2 | 미구현/미검증 | PD→TA/CB→QV | **Given** URL/답변 **When** 자동채움 **Then** 사실·추론·미확인이 분리되고 사람 확인 전 발행 근거가 아님 | TC-L07-AUTOFILL-REVIEW |
| L-08 | 고객 transactions 403 제거 | 기존완료-회귀TC | 자동 테스트; 이번 실화면 콘솔 **미검증** | CB→QV | **Given** 일반 고객 **When** Studio 진입 **Then** operator 거래 API 요청·403 각각 0건 | TC-L08-NO-OPERATOR-CALL |
| L-09 | 채널 글자수 | 기존완료-회귀TC | 자동 테스트; Threads/Instagram 실화면 **미검증** | CB→QV | **Given** 채널 상한 초과 **When** 검수 **Then** 현재/상한 표시 후 provider 호출 전 차단 | TC-L09-LIMIT-BLOCK |
| L-10 | 영상 생성/TTS 정직성 | R2 | 무음 사유 자동 테스트; 고객 실생성·비용·권리 **미검증** | PD→TA/CB→QV | **Given** TTS 불가 **When** 영상 생성 **Then** 무음임과 사유를 표시하고 음성 성공으로 집계하지 않음 | TC-L10-TTS-TRUTH |
| L-11 | 발행 거짓 성공 차단 | R0 회귀차단 | 자동 테스트·과거 구현, 신규 고객 발행 경로 자체 미발견 | CB→QV | **Given** 실패/부분/외부성공-내부실패 **When** 종료 **Then** permalink 없는 `발행됨` 0건 | TC-L11-NO-FALSE-SUCCESS |
| L-12 | Threads tenant·계정 오기입 차단 | R0 회귀차단 | 사용자 실관찰 FAIL; 격리 자동 테스트만 존재 | PD→TA/CB→QV | **Given** 타 Threads 세션+A tenant **When** OAuth 반환 **Then** handle 확인 전 연결 완료 금지, B tenant read/write 0건 | TC-L12-WRONG-ACCOUNT-TENANT |
| L-13 | AI 플랜·사용량·토큰 | R2 | BYOK 자동 집계만; credit·고객 원장 미구현/미검증 | TA→CB→QV | **Given** BYOK/credit 실행 **When** 성공·실패·취소 **Then** 비용 주체·사용량·차감/환불이 중복 없이 표시 | TC-L13-USAGE-LEDGER |

### 9.2 2026-08-01 사용자 실관찰 7개를 반영한 신규 요구 9개

실관찰 7개는 ①Threads OAuth 뒤 `not connected` ②Instagram OAuth 뒤 CTA 유지 ③Instagram의 근거 없는 `재연결 필요` ④빈 Graph API token 폼 병렬 노출 ⑤Settings 연결 계정 미표시 ⑥Threads/Instagram IA 불일치와 초안→발행 경로 부재 ⑦다른 OSMU 계정에서도 기존 `zero_to_one_ai` Threads consent 노출이다. 502는 같은 날 별도 운영 장애로 관찰되어 N-09에 분리한다.

| ID | 요구 | 단계 | 현재 증거 | owner | 원자 AC | QA TC |
|---|---|---|---|---|---|---|
| N-01 | OAuth 성공 뒤 상태·CTA 정합 | R0 회귀차단 | Threads·Instagram 사용자 실관찰 FAIL | PD→TA/CB→QV | **AC-N01-A:** Given Instagram identity 검증 성공 When callback 복귀 Then `Instagram OAuth 연결`은 사라지고 확인 계정+`초안 만들기`가 보임. **AC-N01-B:** Given 저장 토큰이 있고 live 검증이 장애/미실행 When 화면 표시 Then 근거 없이 `재연결 필요`를 쓰지 않고 `확인 불가`+재시도 표시 | TC-N01-IG-CTA / TC-N01-RECONNECT-EVIDENCE |
| N-02 | provider별 계정 전환 계약 | R0 회귀차단 | Threads 타계정 consent FAIL; Instagram은 **미검증** | PD→TA/CB→QV | **Given** Threads 목표 외 세션 **When** 재OAuth **Then** 지원 가능한 전환 안내와 반환 handle 확인. **Given** Instagram **When** 연결 **Then** 공식 계약·실계정으로 별도 정의한 선택/재인증만 사용 | TC-N02-THREADS-SWITCH / TC-N02-IG-SEPARATE |
| N-03 | OAuth 기본·빈 수동 토큰 기본 비노출 | R0 회귀차단 | Instagram 사용자 실관찰 FAIL | PD→CB→QV | **AC-N03-A:** Given Instagram 기본 연결 화면 When 진입 Then 빈 Graph API token 폼은 0개. **AC-N03-B:** Given 고급/복구를 명시적으로 열 때 Then 적용 범위·위험·취소가 보임 | TC-N03-TOKEN-HIDDEN / TC-N03-ADVANCED-OPEN |
| N-04 | Settings discoverability·동일 상태 | R0 회귀차단 | 사용자 실관찰 FAIL | PD→TA/CB→QV | **Given** provider identity 검증 성공 When Settings 진입 Then 같은 handle·상태·마지막 확인시각과 관리 진입점 표시 | TC-N04-SETTINGS-DISCOVER |
| N-05 | 공통 핵심 여정·capability 차이 | R0 회귀차단 | 탭/기능 구조 불일치 사용자 관찰 | PD→QV | **Given** Threads↔Instagram 이동 When 채널 능력이 달라도 Then 연결→초안→검수→발행 위치는 예측 가능하고 전용 기능은 별도 표시 | TC-N05-CROSS-CHANNEL-IA |
| N-06 | Threads 초안→검수→실발행 | R1 첫 실험 | 사용자가 경로를 찾거나 실행하지 못함 | PD→TA/CB→QV | **Given** 확인된 Threads 계정·사실 When 초안 생성→승인→발행 Then 실제 permalink가 목표 handle 게시물로 열림 | TC-N06-THREADS-FIRST-PUBLISH |
| N-07 | 고객 상태·오류 한글 계약 | R0 회귀차단 | `not connected`/`재연결 필요` 혼재 관찰 | PD→CB→QV | **Given** 고객 상태/오류 When 표시 Then 영문 단독·raw code 단독 0건, `무슨 일/누가/다음 행동` 한글 표시 | TC-N07-KO-STATE |
| N-08 | GitHub rate-limit | R2 | 운영 호출 후 오진 추정, 헤더 포함 실재현 **미검증** | TA/CB→QV | **Given** remaining=0/retry 헤더 When sync 실패 Then 레포 없음과 분리하고 재시각 전 자동 반복 0건 | TC-N08-RATE-LIMIT |
| N-09 | 502 고객 복구·운영 추적 분리 | R0 회귀차단 | 사용자 502 관찰, 후속 health 200뿐; 원인 미검증 | PD→TA/CB/OPS→QV | **AC-N09-A:** Given 발행 요청 중 502/timeout When 고객 재진입/재시도 Then 기존 외부 결과를 조회하고 중복 발행 0건. **AC-N09-B:** Given 사건 상관 ID When OPS 조회 Then 시각·영향·단계·upstream·배포버전 추적 가능 | TC-N09-CUSTOMER-RESUME / TC-N09-OPS-TRACE |

### 9.3 2차 백로그 7개

| ID | 요구 | 단계 | 현재 증거 | owner | 원자 AC | QA TC |
|---|---|---|---|---|---|---|
| B-01 | 사이트 내 위키 에디터 | R1 첫 실험 | 미구현/미검증 | PD→TA/CB→QV | **Given** 외부 고객 When 사실 1개 생성·수정·확인 Then tenant 안에서 출처와 함께 다음 초안에 선택 | TC-B01-FACT-CRUD |
| B-02 | 브랜드 AI 자동채움 | R2 | 미구현/미검증 | PD→TA/CB→QV | **Given** URL/답변 When 자동채움 Then 사실·추론·미확인 분리, 확인 전 정본 아님 | TC-B02-AI-DRAFT |
| B-03 | BYOK+credit | R2 | BYOK 일부만 자동 검증; self-service credit 없음 | TA→CB→QV | **Given** 모드 전환/생성 When 종료 Then 비용 주체·차감·환불·tenant 한도 표시 | TC-B03-BILLING-MODES |
| B-04 | grounding 표시 | R1 첫 실험 | 기존 주입 코드 자산은 있으나 고객 표시 **미검증** | PD→CB→QV | **Given** 확인 사실 1개 When Threads 초안 반환 Then 사실·출처·적용 여부 표시 | TC-B04-GROUNDING |
| B-05 | ElevenLabs TTS | R2 | 실권한·잔액·음성권리 미검증 | TA/CB→QV | **Given** 유효 권리·잔액 When TTS 실행 Then 음성 결과 확인, 실패 무음 폴백은 명시 동의 전 금지 | TC-B05-TTS |
| B-06 | Midjourney `docker exec` 제거 | Backlog | 기존 의존 보고, 대체 경로 미설계 | TA→CB→QV | **Given** 생성 서비스 재시작 When 이미지 요청 Then 셸 접속 없이 지원 경로로 결과/설명가능 실패 | TC-B06-NO-DOCKER-EXEC |
| B-07 | Slack 분류 계약 정정 | Backlog | 구현=OAuth·주석=webhook 불일치 확인, 고객 영향 미검증 | TA/CB→QV | **Given** Slack capability 조회 When 문서·화면 표시 Then 실제 OAuth/webhook 방식과 준비 절차 일치 | TC-B07-SLACK-CONTRACT |

### 9.4 추적 규칙과 stage 종료증거

- master ID는 13+9+7=`29`개로 고정한다. 하위 AC/TC는 추가할 수 있지만 master 요구를 삭제·완료 추정하지 않는다.
- R0는 Threads/Instagram 새 브라우저 실계정에서 각각 검증한다. Threads에서 확인된 제약을 Instagram TC의 기대값으로 복사하지 않는다.
- R1 activation은 외부 고객 Threads 1계정만 분모에 넣는다. Instagram 동시 성공을 activation 조건으로 강제하지 않는다.
- mock/unit/build는 회귀 보조증거다. 신규 외부 tenant가 목표 handle→확인 사실→초안→검수→실게시 permalink를 관찰해야 R1 성공이다.

## 10. BM과 비용 원칙

### 10.1 병행 모델

| 모드 | 고객이 사는 것 | 장점 | 리스크 | 필수 운영 계약 |
|---|---|---|---|---|
| BYOK | OSMU 소프트웨어·호스팅·워크플로우, AI 사용료는 고객 계정 | 원가 변동 위험이 낮고 파워유저에게 투명 | 비개발자 온보딩 마찰, 키 보안 CS | 키 상태·사용량·청구 주체 표시, 원문 비노출 |
| OSMU 크레딧 | 키 없이 쓰는 편의성과 선불 사용량 | 첫 가치가 빠르고 비개발자 적합 | 원가 급등·실패 차감·환불·부정사용·tenant 혼선 | 사전 원가 추정, reserve→확정/환불, 잔액·내역, tenant별 상한 |

두 모드는 장기 제품 범위에 남지만 첫 10명의 비용 공급 방식은 회장 결정 전 미확정이다. **추천은 tenant별 상한을 둔 초대형 운영 크레딧을 기본 제공하고 BYOK는 선택으로 열며, self-service credit 충전은 14일 내 두 번째 발행이 검증된 뒤 여는 것**이다. 이 안은 비개발자의 첫 가치 마찰을 줄이면서 원가 폭주를 초대·상한으로 제한한다. 선택하지 않고 BYOK만 강제하면 비용 위험은 낮지만 외부 자격고객의 키 발급 능력을 제품 수요로 오인할 수 있다. 반대로 self-service credit부터 만들면 결제·환불·부정사용이 첫 permalink보다 앞선다. 현재 operator 공용 Higgsfield 크레딧을 고객 크레딧으로 간주하지 않으며, 고객별 사용량·한도·실패 복구 계약 전 영상 생성은 유료 고객 기능으로 개방하지 않는다.

### 10.2 BM 가설

- 기본 구독료는 채널 연결, 위키/그라운딩, 검수·발행 워크플로우와 운영 신뢰성의 대가다.
- AI·영상 원가가 발생하는 행동은 BYOK 또는 크레딧으로 분리한다.
- “채널 수”보다 “검증된 발행 워크스페이스/계정 수”가 과금 단위 후보에 가깝다. 다만 구체 단위는 첫 10명 사용 데이터 뒤 결정한다.
- 첫 유료 검증은 할인율보다 A1→A4 실사용이 있는 1명의 결제가 우선이다.

### 10.3 첫 실험 모집과 공급 경계

- 교육사업 1곳 dogfood는 운영 리허설·회귀 표본이며 외부 activation에서 제외한다.
- 외부 자격고객 최소 3명은 dogfood와 별도로 모집한다. 외부 3명 중 최소 1명은 제품팀이 소유하지 않은 Threads 계정과 브랜드 사실을 사용해야 한다.
- 첫 실험의 primary 경로는 외부 SaaS로 운영할지 내부 인프라로 운영할지 회장 결정 전 미확정이다. **추천은 외부 SaaS primary+OSMU 검수/근거/permalink 증거 레이어**다. 선택하면 infra 구축보다 고객가치 검증이 앞선다. 선택하지 않고 내부 인프라 primary로 가면 통제권은 커지지만 502·OAuth·발행 복구가 수요 검증을 삼킬 위험이 있다.

## 11. 운영 부하

| 운영 영역 | 예상 부하 | 완화 원칙 | plan 단계 판정 |
|---|---|---|---|
| Meta 앱 심사·권한 | privacy URL, use-case 영상, 앱 Live 상태, 권한 변경 | provider별 readiness와 외부 소유자 표시 | P0 외부 선행조건 |
| 계정 전환 CS | third-party 쿠키·다계정·2FA·OTP rate limit | 현재 계정 확인, provider별 정확한 전환 안내, 재연결 | P0 |
| 토큰 갱신 | 만료·권한 철회·identity mismatch | `확인 불가`와 `재연결 필요` 분리, 사전 알림 | P0 |
| GitHub sync | PAT 권한·기본 branch·rate limit·GitHub Wiki | 사이트 위키 기본화, GitHub 고급화, retry 시각 | P0/P1 |
| 발행 복구 | 외부 성공 후 내부 기록 실패·permalink 지연 | 중복발행 금지, URL-only 복구, 상관 ID | P0 |
| 502·provider 장애 | 간헐 장애가 health 200 뒤 사라짐 | 고객 영향 기준 사건 기록, secret 없는 trace | P0 |
| AI 비용 | BYOK/credit 이중 원장, 모델별 단가 변동 | 실행 전 모드·예상비용, 확정/환불 원장 | P1 |
| 영상/TTS | 동기 렌더, 공용 크레딧, 음성 권리, SSRF | tenant 상한·비동기 처리 여부는 기술설계, 권리 확인 | P1 |
| 콘텐츠 품질 | 자동채움의 잘못된 사실, 오래된 위키 | 출처·마지막 갱신·사람 확정·grounding 표시 | P0 |

## 12. 리스크와 대응

### 12.1 법적·정책 리스크

- 고객 비밀번호 수집과 browser-login 대행은 금지한다. OAuth와 플랫폼 공식 동의를 사용한다.
- Meta App Review·권한·공개/전문 계정 조건을 만족하지 못한 provider는 “연결 가능”으로 판매하지 않는다.
- 개인정보처리방침에는 소셜 계정 식별정보, 토큰 처리, 게시물 처리, 보유·삭제, subprocessors를 명시해야 한다.
- AI 생성물의 저작권·상표·초상권, TTS 음성 사용권, 사용자 제공 자료의 이용 권한을 고객이 확인하게 한다.
- 자동발행 빈도·콘텐츠가 각 플랫폼 스팸/자동화 정책을 위반하지 않게 계정별 rate limit과 사람 검수 기본값을 둔다.

### 12.2 시장 리스크

- Buffer/Postiz는 연결→composer→sent history를 이미 제공한다. 단순 스케줄러로 보이면 전환 이유가 없다.
- Jasper는 브랜드 Knowledge·Voice를 한 생성 문맥에서 보여 준다. 위키가 있어도 적용 여부가 안 보이면 차별화가 체감되지 않는다.
- ChatGPT/Claude에 브랜드 문서를 연결하고 각 플랫폼 native 앱에서 직접 게시하면 새 SaaS 연결비용 없이 비슷한 결과를 얻을 수 있다. OSMU는 “AI 글 생성”만으로는 이 대안을 이기지 못한다.
- Notion/Google Docs에서 캘린더·검수를 하고 Buffer로 보내는 조합은 도구가 둘 이상이어도 역할이 명확하고 교체 가능하다. OSMU의 단일 화면이 더 불투명하면 통합이 장점이 아니다.
- 프리랜서·VA는 계정 연결뿐 아니라 전략·댓글·예외판단까지 맡는다. 자동화 비용이 사람과 비슷하거나 오게시 책임이 고객에게 남으면 OSMU가 열위다.
- 기능 폭 경쟁은 Postiz 27개 플랫폼, Blotato 번들에 불리하다. 초기 마케팅 약속은 Threads/Instagram의 검증된 발행과 브랜드 근거에 좁힌다.

### 12.3 기술 리스크

- provider가 계정 선택 UI나 계정 목록 API를 제공하지 않을 수 있다. OSMU는 지원하지 않는 파라미터를 만들지 않고 반환 identity 확인을 제품 계약으로 둔다.
- 위 문장은 Threads에 확인된 제약을 설명한다. Instagram Login의 계정 선택·재인증·전문계정 조건은 Meta 공식 계약과 별도 실계정 관찰 전 같은 제약으로 단정하지 않는다.
- callback 저장 성공과 read-only 검증 성공이 다른 시점이면 상태가 흔들릴 수 있다. 단일 상태의 물리 구현은 eng-design에서 멱등성·일관성·캐시 무효화 선택지로 합의한다.
- 대시보드 직접 발행과 OpenClaw extension 발행의 이원화가 같은 draft를 다르게 처리할 수 있다. 기술설계에서 권위 경로와 reconciliation 책임을 결정해야 한다.
- 사용량 DB·파일 원장, customer BYOK, operator CLI, credit가 중복 집계될 수 있다. 가격을 열기 전에 하나의 청구 사건 정의가 필요하다.
- 영상 생성은 SSRF·자원고갈·공용 크레딧 혼선 위험이 이미 확인됐다. 텍스트 MVP와 같은 권한으로 성급히 개방하지 않는다.

### 12.4 데이터 격리·analytics 하드라인

- 모든 고객 원문, 위키, 초안, 소셜 계정 식별자, 토큰, permalink는 tenant-scoped다.
- `postAGI-analytics`에는 public 서비스의 승인된 집계 지표만 보낼 수 있다. private 서비스의 사용자·콘텐츠·성과·계정 데이터는 원문과 집계 모두 섞지 않는다.
- 제품 퍼널 분석은 익명/가명 사건 ID, 단계, 성공 여부, 지연시간, 오류 분류까지만 기본 수집한다. 본문·위키 내용·토큰·외부 계정 handle은 분석 이벤트에 넣지 않는다.

## 13. postAGI 루트 규칙 정합성

- OSMU는 `openclaw-auto` 독립 마케팅 인프라 레포이며 PostAGI-public/private 코드 레포와 git history를 합치지 않는다.
- Romeo 8080/42080, Dark-Cupid 9090/42090, Yeon 8083/18080, OKgram 8084/18084, 폴리아모리 8085/18086 포트를 사용하지 않는다. 현 OSMU 운영 계약의 `DASHBOARD_PORT`와 외부 18789 라우팅을 유지하며 새 포트 배정은 eng-design 결정이다.
- OSMU 고객 데이터는 기존 PostgreSQL tenant/RLS 경계를 유지한다. PostAGI 서비스의 MySQL/MariaDB에 소셜 토큰·위키·usage를 복제하지 않는다.
- private 서비스 데이터는 `postAGI-analytics`에 포함하지 않는다.
- 시크릿 실값은 PRD·wiki·git·로그·analytics에 쓰지 않는다. 로컬/CI secret store 역할을 분리한다.
- prod 배포는 QA와 회장 승인 뒤 수동이며, plan 산출물이 배포 권한을 열지 않는다.

## 14. 경쟁·레퍼런스 벤치마크

| 레퍼런스 | 확인한 현재 동작 | 차용 | 변경/차별화 | 차용하지 않을 것 |
|---|---|---|---|---|
| Buffer | 채널 연결이 publishing의 첫 단계이고, composer→Sent history로 이어진다. Threads/Instagram은 브라우저의 현재 활성 계정이 연결되며 Threads 계정 목록 API가 없음을 명시한다. | 연결→작성→발행이 끊기지 않는 순서, Sent 결과 기록, 계정 전환 제약의 솔직한 안내 | callback 뒤 OSMU 안에서 실제 반환 계정명을 확인하고 브랜드 grounding을 함께 표시 | Buffer UI·카피·기능 수 복제 |
| Postiz | `draft/now/schedule` 공통 상태와 provider-specific settings로 27개 플랫폼 차이를 처리한다. OAuth 연결과 post 작성이 분리된 공용 계약이다. | 공통 draft→publish 상태와 capability별 차이 모델 | 초기 2개 provider에서 permalink와 사실 근거를 더 강한 완료조건으로 둔다 | 지원 수를 가치로 내세우는 확장 |
| Jasper IQ | Knowledge, Brand Voice, Audience, Style을 한 context 카드에서 적용 개수와 함께 보여 주고 URL/파일/텍스트로 Knowledge를 채운다. | 생성에 무엇이 적용됐는지 보이는 grounding, URL 기반 자동채움 후 편집 | 고객 소유 사이트 위키를 정본으로 두고 발행 결과까지 연결 | enterprise 권한 구조·브랜드 표현 복제 |
| ChatGPT/Claude + native 앱 | 연결 문서를 대화 컨텍스트로 쓰고 초안을 만든 뒤 Instagram/Threads 앱에서 사람이 게시할 수 있다. ChatGPT 앱은 연결 데이터 검색·write action과 실행 전 확인을 공식 지원한다. | 문서 근거를 대화 안에서 확인하고 외부 행동 전 사람이 확인하는 원리 | OSMU는 목표 계정·브랜드 사실·실제 permalink를 한 감사 가능한 사건으로 묶음 | 범용 챗 UI·모델 기능을 OSMU 고유가치로 포장 |
| Notion/Docs + Buffer | Notion/Docs는 편집·승인, Buffer는 queue·sent history를 담당한다. Buffer도 Notion→Buffer 자동화와 draft 흐름을 공식 소개한다. | 도구별 책임 분리와 교체 가능성 | OSMU는 첫 고객에게 복수 도구 설정비용을 줄이되 각 단계 증거는 숨기지 않음 | 단일 화면 자체를 무조건 우월하다고 주장 |
| 프리랜서/VA | 사람은 전략·카피·게시·예외처리·커뮤니티까지 묶어 맡을 수 있다. Upwork는 social manager의 범위를 게시·콘텐츠·분석·응대로 설명한다. | 예외 상황에서 사람 승인과 책임 소유를 명확히 하는 것 | OSMU는 반복 발행의 비용·증거·tenant 경계를 표준화 | 사람의 판단·관계 업무까지 자동화됐다고 주장 |
| GitHub REST | `x-ratelimit-remaining=0`, `x-ratelimit-reset`, `retry-after`로 재시도 시점을 판단하고, 403/429 동안 반복 요청을 피하라고 명시한다. | rate limit을 레포 없음과 구분하고 재시도 시각 표시 | 비개발자용 한글 조치와 사이트 위키 fallback 제공 | 헤더/원문 오류를 고객에게 그대로 노출 |
| Linear Method/Shape Up | 이슈와 스펙을 구분하고 appetite·중단 기준으로 범위를 통제한다. | One Thing·kill-criteria·채널 확대 보류 | 현재 P0 운영 실패를 appetite보다 우선 | 6주 숫자 자체 복제 |

## 15. 6사업 자기잠식·시너지

OSMU는 개별 데이팅·교육·경제 서비스의 고객가치를 대체하지 않고, 각 벤처가 승인한 브랜드 사실을 SNS로 출고하는 공통 마케팅 인프라다. 자기잠식 위험은 OSMU가 각 사업의 내부 데이터와 브랜드 전략을 한 원장에 섞거나, 운영자가 승인하지 않은 자동발행으로 각 브랜드의 목소리를 평준화할 때 생긴다. 대응은 tenant·public/private 격리, 채널별 승인, grounding 출처 표시다. 시너지는 각 사업이 별도 대행사·자동화 코드를 만들지 않고 같은 검수·발행 증거 구조를 재사용하는 데 있다.

## 16. steelman, premortem, 셀프심문

### 16.1 Steelman — “이 제품은 Buffer+Jasper 두 개를 붙인 열화판이다”

회의적 고객의 가장 강한 반론은 Buffer가 이미 연결·예약·Sent를 잘하고 Jasper가 Knowledge·Brand Voice를 더 성숙하게 제공한다는 것이다. OSMU가 둘보다 적은 채널과 거친 편집기를 내놓으면 새 도구를 배울 이유가 없다. 이 반론을 견디려면 기능 수가 아니라 “내 브랜드 근거가 이번 초안에 쓰였고, 내가 확인한 계정으로 실제 URL이 생겼다”를 한 여정에서 증명해야 한다. 이 증거가 없으면 출시 메시지를 바꾸는 것이 아니라 제품을 중단한다.

### 16.2 Premortem — 3개월 뒤 신규 고객이 모두 이탈했다면

첫 시나리오는 Meta 세션 제약 때문에 고객 10명 중 6명이 잘못된 계정을 보고 연결을 포기했는데, 팀은 callback 200과 단위 테스트만 보고 정상이라 판단한 경우다. 대응은 시크릿 창과 기존 타계정 세션을 별도 E2E로 두고, 반환 계정명을 확인하지 않으면 활성화로 집계하지 않는 것이다.

두 번째 시나리오는 크레딧을 먼저 열어 영상 한 건의 외부 비용과 실패 환불 문의가 월 구독 수익을 넘긴 경우다. 대응은 텍스트 A1→A4가 검증되기 전 영상 고객 개방을 막고, BYOK/credit 원장과 reserve→확정/환불 계약을 기술설계·QA에서 먼저 증명하는 것이다.

### 16.3 셀프심문 — “이 결론이 틀렸다면 가장 그럴듯한 이유는?”

가장 하중을 받는 가정은 고객이 콘텐츠 품질보다 연결·발행 신뢰에 먼저 돈을 낸다는 것이다. 실제로는 좋은 초안이 없으면 permalink까지 가도 재사용하지 않을 수 있다. 그래서 MVP에 사이트 위키·AI 자동채움·grounding 표시를 포함하고, 북극성 지표와 별도로 2주 내 두 번째 초안 검수율을 보조 리텐션 지표로 측정한다. 다만 첫 발행을 못 끝낸 고객에게 생성 품질 설문만 묻는 오류는 피한다.

## 17. 회장 질문 — plan 승인 전 결정 3개

### Q1. 첫 외부 파일럿의 발행 인프라를 외부 SaaS primary로 둘지 내부 인프라 primary로 둘지

- **추천: 외부 SaaS primary + OSMU의 계정 확인·브랜드 근거·검수·permalink 증거 레이어.** 선택하면 OAuth/발행 복구 인프라를 다시 짓기 전에 고객이 통합 증거에 돈을 내는지 검증한다.
- 내부 인프라 primary를 선택하면 데이터·기능 통제권과 장기 마진은 커질 수 있으나, 현재 502·연결 상태 불일치가 수요 실험을 다시 지연시킨다.
- 결정하지 않으면 product-designer가 어느 경로의 사용자 플로우를 설계해야 하는지 확정할 수 없어 design gate를 열지 않는다.

### Q2. R1 activation을 Threads 한 채널로 좁힐지, Threads+Instagram 동시 성공으로 둘지

- **추천: R1 activation은 Threads 한 채널, R0 출하 회귀는 Threads와 Instagram 각각 통과.** 선택하면 외부 고객 1명·계정 1개·게시물 1건의 하중 가정을 빠르게 검증하면서 Instagram의 현재 거짓 상태를 방치하지 않는다.
- 동시 성공을 선택하면 두 채널 상품 약속은 강하지만, 서로 다른 OAuth·미디어·계정 조건이 한 실험에 묶여 무엇이 실패했는지 분리하기 어렵다.
- 결정하지 않으면 R1 분모와 성공 판정이 달라져 모집 문구·QA 표본을 확정할 수 없다.

### Q3. 첫 10명의 AI 비용을 누가 어떻게 공급할지

- **추천: tenant별 상한을 둔 초대형 운영 크레딧 기본 + BYOK 선택, self-service credit는 14일 내 두 번째 발행 검증 뒤.** 선택하면 비개발자 첫 가치와 원가 통제를 동시에 시험한다.
- BYOK만 선택하면 원가 위험은 낮지만 키 발급 마찰을 제품 수요 부족으로 오인할 수 있다. self-service credit부터 선택하면 결제·환불·부정사용이 One Thing보다 앞선다.
- 결정하지 않으면 외부 고객에게 누가 비용을 부담하는지 약속할 수 없어 유료/초대 파일럿 운영 계약을 열 수 없다.

### 확정 운영원칙 — 회장 질문 아님

Threads는 OSMU가 계정 목록 선택기를 제공한다고 약속하지 않는다. provider 세션 변경 안내→재OAuth→반환 handle의 고객 확인을 완료조건으로 한다. Instagram은 이 원칙을 복사하지 않고 Meta 공식 계약과 별도 실계정 관찰로 선택·재인증 흐름을 확정한다.

## 18. 단계 게이트와 하류 전달

### plan gate 미통과 항목

- Q1~Q3 회장 결정 미수렴.
- `plan-critic`의 독립 비평은 실행됐고 본 문서에 1차 리테이크를 반영했다. 회장 답변 뒤 최종 PATCH와 재비평이 남았다.
- One Thing·MVP·kill-criteria에 대한 회장 `/approve plan` 없음.
- 디자인 user-flow·IA·마이크로카피 미작성/미승인.
- API·DB·상태 일관성·사용량 원장·관측성 기술 대안 미합의.

### 다음 stage 진입 가능 여부

**현재 design 진입 불가.** 본 PRD는 plan 리테이크이며, 회장 질문 3개 답변→필요 시 최종 PATCH→plan-critic 재확인→`/approve plan`이 먼저다.

### AI 코드생성 5단 스펙 처리

1단 목적과 2단 고객 입출력·수용기준은 이 문서에 정의했다. 3단 데이터 스키마, 4단 API 계약은 이번 과제의 명시적 금지사항이므로 확정하지 않았다. 5단 테스트 경계는 AC→QA 씨앗까지만 정의했으며, 정확한 fixture·endpoint·필드값은 eng-design 승인 산출물에서 확정한다.

## 19. 7원칙 판정표

| # | 원칙 | 판정 | 근거 |
|---|---|---|---|
| 1 | 용어 통일 | PASS | 연결·발행 고객 상태를 §7 한 표로 고정 |
| 2 | 구체화 | PASS | 29개 master를 단계·증거·owner·원자 AC·QA TC로 고정; 15분은 기준선 전 확정하지 않음 |
| 3 | 입출력 분리 | PASS | 고객 입력(Threads handle 확인·브랜드 사실·검수)과 출력(초안 1건·permalink 1개) 분리 |
| 4 | 정합성 | **FAIL** | 외부 SaaS/내부 인프라, Threads 단독/Instagram 동시, 첫 10명 비용의 회장 결정 전에는 모집·플로우·운영 계약이 하나로 닫히지 않음 |
| 5 | 정책 상세 | **FAIL** | Instagram 계정 선택/재인증 공식 계약과 502 고객 복구의 세부 시간·재시도 정책은 design/eng-design 합의 전 미확정 |
| 6 | 추출 철저 | PASS | 연결→위키→초안→검수→발행 전 단계에 MVP와 AC 존재 |
| 7 | 논리 영역 | PASS | `좋은 UX` 대신 관찰 가능한 상태·지표·종료증거 사용 |

**전체 판정: FAIL(5/7 PASS).** 리테이크가 지적을 숨기지 않는다. Q1~Q3 답변과 Instagram 공식 계약/실관찰이 반영되기 전 plan 산출물은 미완성이며 `/approve plan` 대상이 아니다.

## 20. INVEST 자가점검

- Independent: 연결·그라운딩·초안/검수·발행 결과를 capability 단위로 분리했다.
- Negotiable: 화면/API/DB·가격 숫자는 하류 합의로 남겼다.
- Valuable: 각 요구가 계정 확인 또는 permalink 도달에 연결된다.
- Estimable: MVP 5개와 AC ID로 하류 추정이 가능하다.
- Small: R1은 외부 고객 1명·Threads 1계정·확인 사실·초안/게시물 각 1건으로 제한한다.
- Testable: 모든 요구에 Given/When/Then과 운영 종료증거가 있다.

---

🏷 STAMP | line: openclaw-auto-osmu | 생성: 2026-08-01 18:42 KST | model: gpt-5.6-sol | agent: prd-architect retake
skills: 매칭 PRD 스킬 없음 — planning.md·benchmarks.md·writing.md·artifact-stamp.md 직접 적용 | 근거: Buffer·Postiz·Jasper·GitHub·OpenAI·Anthropic·Upwork 공식/1차 페이지, 내부 PRD/QA/wiki
고민: 29개 요구를 삭제하지 않으면서 R1을 외부 고객 1명·Threads 1계정·확인 사실/초안/게시물/permalink 각 1개로 줄였고, 과거 자동 PASS를 운영 완료로 승격하지 않았다.

SKILLS_USED: 없음 — 현재 세션에 PRD/제품기획 전용 skill이 노출되지 않아 `/Users/sj/.claude/standards/planning.md`와 `writing.md`를 방법론으로 적용
SKILLS_SKIPPED: `brand-positioning-kit` 등 마케팅 스킬은 제품 PRD 요구–수용기준 과업과 직접 일치하지 않아 스킵

SOURCES:
- 내부 기반: `/Users/sj/sj_code_master/postAGI/CLAUDE.md`; `AGENTS.md`; `CLAUDE.md`; `README.md`; `dashboard/CLAUDE.md`; `dashboard/README.md`; `pipeline-state.md`; `docs/qa-tracker.md`; `docs/USERFLOW.md`; `docs/feature-spec.md`; `docs/channel-ui-spec.md`; `/Users/sj/.claude/plans/wiki-1-mellow-wadler.md`
- 내부 wiki: `wiki/product/vision.md`; `wiki/product/studio.md`; `wiki/ops/multi-tenant.md`; `wiki/ops/session-state.md`; `wiki/decisions/004-social-connect-oauth-not-passwords.md`; `wiki/architecture/overview.md`; `wiki/architecture/system-architecture.md`; `wiki/reference/brand-grounding.md`; `wiki/reference/channel-status.md`; `wiki/marketing/{brand,positioning,competitors}.md`
- 품질헌법: `/Users/sj/.claude/standards/{planning,writing,benchmarks,artifact-stamp}.md`
- Buffer 공식 도움말/리소스: https://support.buffer.com/article/600-getting-started-with-buffers-publishing-features ; https://support.buffer.com/article/857-using-threads-with-buffer ; https://support.buffer.com/article/568-connecting-your-instagram-business-or-creator-account-to-buffer ; https://support.buffer.com/article/517-understanding-sent-post-metrics-within-buffer-publish ; https://buffer.com/resources/content-creation-automation/
- Postiz 공식 문서: https://docs.postiz.com/public-api/integrations/connect ; https://docs.postiz.com/public-api/posts/create
- Jasper 공식 도움말: https://help.jasper.ai/hc/en-us/articles/18618707176347-Knowledge-Base ; https://help.jasper.ai/hc/en-us/articles/18618654325787-Jasper-IQ ; https://help.jasper.ai/hc/en-us/articles/18618693085339-Brand-Voice
- GitHub 공식 문서: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- OpenAI 공식 Apps 도움말: https://help.openai.com/en/articles/11487775-connectors-in
- Anthropic 공식 Integrations: https://www.anthropic.com/news/integrations
- Upwork social media manager 대안: https://www.upwork.com/hire/social-media-managers/
- Meta 공식 문서(접근 제한으로 내부 ADR의 기존 확인 근거를 재사용): https://developers.facebook.com/docs/threads/get-started/get-access-tokens-and-permissions ; https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login

MODEL: gpt-5.6-sol
RUBRIC_SCORE: hook=5/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=23/25
WEAKEST_LINE: "Instagram은 요구에서 빠지지 않는다." — 범위 오해를 막지만 고객 장면보다 내부 스코프 방어에 가까운 문장이다.
