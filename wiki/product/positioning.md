# Positioning — OSMU 마케팅 에이전트 (브랜딩·마케팅 정본)

<!--
STAMP
created_at: 2026-08-08 22:05 KST
model: claude-opus-5[1m]
agent: content-growth-marketer
skills: brand-positioning-kit
evidence_sources: 12 (PRD v7.3.5 계열 4 + wiki 3 + 코드 2 + 외부 WebSearch 4)
deliberation: 회장이 짚은 4개 차별점 중 1층(API 키·심사 대행)은 경쟁사가 이미 하는 진입자격이다. 아부하지 않고 그 판정을 문서 앞에 둔다.
-->

| 항목 | 값 |
|---|---|
| 문서 성격 | 브랜딩·마케팅 정본 (제품 정의 정본은 PRD v7.3.5) |
| 상태 | 포지셔닝 확정 초안. 가격·WTP·성과환류는 pilot 전 가설 |
| 씨앗 | 회장 발화 2026-08-08 |

## 목차

- [한 줄 포지셔닝](#한-줄-포지셔닝)
- [회장 발화 원문](#회장-발화-원문)
- [차별점 4층 판정](#차별점-4층-판정)
- [톤·금기·긴장](#톤금기긴장)
- [AARRR 매핑](#aarrr-매핑)
- [마케팅 메시지 후보](#마케팅-메시지-후보)
- [아직 주장하면 안 되는 것](#아직-주장하면-안-되는-것)
- [셀프심문과 steelman](#셀프심문과-steelman)

## 한 줄 포지셔닝

> **마케팅 담당자가 없는 1인 브랜드 대표를 위해, 목표 하나를 맡기면 조사·브리프 승인·세 형식 납품·정확히 한 번의 발행·결과 보고까지 한 캠페인의 계보로 증명해 주는 마케팅 실행 에이전트.**

두세 마디 훅: **"초안은 팔지 않습니다. 발행 증거를 팝니다."**

치환 테스트: 이 문장에 Buffer·Later·Metricool 이름을 넣으면 성립하지 않는다. 이들은 예약 발행과 분석을 팔고, 업무위임서·브리프 승인권자·수정 회차·발행 증거·다음 실험 변수를 한 캠페인 정체성으로 묶어 책임지지 않는다. 반대로 "여러 SNS를 한 곳에서 관리하세요"는 네 회사 모두에 붙으므로 우리 카피에서 폐기한다.

개봉 장면 1컷: 연결 버튼이 초록으로 바뀌었는데 실제로는 토큰이 붙지 않은 화면. 우리 제품에서 실제로 보고된 OAuth 거짓 성공이다(근거: `wiki/reference/channel-status.md` "OAuth false-success" 미해결 항목). 그날부터 우리는 "됐습니다"라는 문구를 팔지 않고 증거를 팔기로 했다.

빌런은 사람이 아니라 구조다. 플랫폼마다 정책·심사·쿼터가 다르고, 그 결과 1인 사업자가 마케팅의 PM 노동을 떠안게 되는 구조다.

## 회장 발화 원문

> "그렇게 플랫폼 별 정책 다 다르고 API 키 등록하고 승인하는 과정을 다 없애준다는게 우리 SaaS장점이겠네.
> 위키로 관리도하면서 각 사업에 맞는 컨텐츠 생성 발행을 도와준다는것도 어필될거고(누적해서더좋은 컨텐츠를 발행하게됨)
> 나중엔 성과도 연동하고 단순히 컨텐츠 자동화를 넘어 AAARR퍼널 마케팅이 가능하다는게 우리 장점아닐까 싶기도하고."

출처: 회장 2026-08-08 구술. 표기 정정: AAARR → **AARRR** (Acquisition, Activation, Retention, Revenue, Referral).

## 차별점 4층 판정

판정 기준은 두 개다. ①우리 쪽 증거가 코드·PRD·조사 사실로 있는가 ②경쟁사가 이미 제공하는가. 둘째가 예면 그건 차별점이 아니라 시장에 앉을 자격(진입자격)이다.

### 1층. 플랫폼 정책·API 키·심사 대행

- 주장: 플랫폼마다 다른 심사와 키 발급을 우리가 뚫어두고, 고객은 로그인 한 번으로 연결한다.
- 우리 증거: `dashboard/src/lib/oauth-app-credentials.ts`가 provider별 `externalReview` 필드를 갖고 있고 instagram·threads·youtube·naver_blog·pinterest·tiktok·facebook 7개가 `"required"`로 박혀 있다. 즉 심사 필요 여부가 코드 수준의 사실로 관리된다. 외부 사실: Instagram 발행은 `instagram_business_basic` + `instagram_business_content_publish` 두 권한의 앱 심사가 필요하고 심사는 제출 1회당 2~4주, 권한마다 별도 화면녹화(연결→권한요청→사용까지 전 여정)를 제출해야 하며, 내 소유가 아닌 계정에 발행하려면 Advanced Access 추가 심사가 붙는다. YouTube는 쿼터가 Google Cloud 프로젝트 단위로 공유되며 기본 하루 10,000 유닛이고 증량에 규정준수 감사가 필요하다.
- 경쟁사: 이미 한다. Buffer는 Instagram·Facebook·LinkedIn·X·TikTok·YouTube Shorts·Pinterest·Google Business·Threads·Bluesky·Mastodon 11개를 승인된 파트너 앱으로 제공한다. Later는 8개 플랫폼, Metricool도 발행+분석을 묶어 제공한다. 고객이 자기 API 키를 발급하는 제품은 이 시장에 사실상 없다.
- 판정: **진입자격. 차별점 아님.** 게다가 현재는 우리 쪽 적자다. Live는 Threads 1개, Instagram은 Connected(자동화 미시작)이고 나머지 13채널은 구현 완료·미연결이다(`wiki/reference/channel-status.md`). X는 발행용 Developer Portal 등록을 고객이 직접 하도록 2026-07-06에 결정했으므로 "키 없이 끝"이 X에는 적용되지 않는다.
- 그래서 어떻게 쓰나: 자랑 문구가 아니라 **신뢰 문구**로 쓴다. "심사 2~4주가 걸리는 권한을 우리가 대신 통과합니다"는 통과 시점 이후에만 채널명을 특정해 말한다. 광고 카피의 주력에서 내린다.

### 2층. 브랜드 위키 기반 생성

- 주장: 각 사업의 사실·톤·금기·증거를 위키로 관리하고, 그 승인된 근거 위에서만 생성한다. 아무 말 생성기가 아니다.
- 우리 증거: PRD v7.3.5의 Ground 단계가 `source family5 · adapter6 → active knowledge1 + active guide1`로 수렴하고, fact/source/tone/taboo/proof 스냅샷을 남기며, 두 저장소가 서로 다른 값을 주면 conflict hold를 건다(`docs/one-thing.md`, `docs/risks.md` dual knowledge truth 항목). 예전 산출물이 최신 가이드로 바뀐 것처럼 보이지 않게 immutable generation snapshot을 둔다. 페르소나 근거: 김민서는 AI 초안이 예전 가격이나 없는 혜택을 섞을까 봐 회사소개서를 다시 연다(`docs/persona.md`).
- 경쟁사: **절반은 이미 한다.** 톤 학습은 흔하다. HubSpot은 업로드한 글 표본에서 문장 구조·인칭·형식을 분석해 brand voice를 만들고, Jasper는 Brand Voice와 Knowledge Base를 제공하며, 2026년 스케줄러 시장 정리 기사들도 "과거 글·브랜드 가이드·톤 문서로 학습"을 표준 기능으로 다룬다. 하지만 **가격·혜택 같은 사실 단위의 버전 승인, 충돌 시 생성 중단, 산출물마다 어느 버전으로 만들어졌는지의 계보**는 이 등급 도구의 표준 기능이 아니다(미확인: Jasper Knowledge Base가 fact 버전 승인·conflict hold를 제공하는지는 직접 확인하지 못했다).
- 판정: **"톤 학습"은 진입자격, "사실의 버전 책임"은 차별점.** 따라서 카피에서 말할 것은 "우리 AI가 브랜드 톤을 배웁니다"가 아니라 "승인하지 않은 사실은 글에 못 들어옵니다"다.

### 3층. 누적 학습

- 주장: 발행 결과가 쌓여 다음 콘텐츠가 좋아진다.
- 우리 증거: Learn 단계가 정의돼 있다. threshold 적격 native 데이터에서 인과 주장이 아닌 가설을 만들고, 증거 ID를 붙이고, **변수 하나만** 바꿔 다음 실험에 넣는다. 얇은 표본으로 톤과 CTA를 동시에 바꾸는 것을 금지하고, baseline 승인 전에는 전부 hold다(`docs/one-thing.md` Learn, `docs/risks.md` thin-data false eligible). 현재 상태는 hold다. channel×metric 기준이 승인되기 전에는 이 기능을 팔지 않는다는 것이 BM 문서의 판정 조건이다(`docs/bm.md` Insight threshold readiness).
- 경쟁사: 얕게 이미 한다. Buffer Insights는 AI takeaway를 주고, Metricool은 AI 성과 예측과 Studio 자동 리포트를 준다.
- 판정: **현재는 차별점 아님. 로드맵.** 다만 방향은 반대라서 가치가 있다. 경쟁사는 요약을 더 준다. 우리는 요약 대신 다음 생성 입력을 실제로 바꾼다. 그 차이는 "링크만 열리고 입력 변화 0"을 실패로 규정한 fake learning 게이트로만 증명된다. 증명 전에는 카피 금지.

### 4층. AARRR 퍼널

- 주장: 성과를 연동해 콘텐츠 자동화를 넘어 퍼널 마케팅을 한다.
- 우리 증거: 시장 공백은 실재한다. 2026년 조사에서 사회적 활동과 매출을 명확히 연결할 수 있다고 답한 팀은 35%뿐이다. 우리 쪽 착수물은 `wiki/product/plan-ga4-slack-central.md`(GA4·슬랙 중앙 성과 통합)이며 **설계만, 구현 다음 세션** 상태다. 즉 지금은 계획 문서 1개가 근거의 전부다.
- 경쟁사: 상단은 이미 한다. Hootsuite는 Google Analytics·Salesforce·HubSpot 연동으로 클릭에서 전환·파이프라인까지 잇고, Oktopost는 B2B 퍼널 분석을 CRM과 붙인다. 다만 이들은 **측정 쪽**이다. 목표를 받아 콘텐츠를 만드는 주체와 퍼널을 읽는 주체가 같은 에이전트인 제품은 확인하지 못했다.
- 판정: **가장 강한 전략적 차별점이지만 증거가 가장 얇다.** 우리 표현은 "퍼널 분석을 제공합니다"가 아니라 "이번 달 신규 20석이라는 목표를 받은 그 에이전트가, 그 목표 기준으로 다음 주 콘텐츠를 바꿉니다"다. 구현 전에는 비전 섹션에만 쓴다.

### 결론

진짜 차별점은 회장이 1번으로 짚은 진입 장벽 제거가 아니라, **2층의 사실 버전 책임**과 **4층의 목표-생성 일체화**다. 3층은 2층과 4층이 서면 따라오는 결과다. 그리고 네 층을 하나로 묶는 것은 개별 기능이 아니라 계보다. 업무위임서에서 시작해 승인된 브리프, 세 형식 납품물, 정확히 한 번의 발행 증거, 보고서, 승인된 변수 하나까지가 같은 캠페인 번호로 이어진다. 이것이 경쟁사가 복사하기 어려운 지점이고, 우리가 "도구"가 아니라 "대행"으로 값을 받는 근거다.

## 톤·금기·긴장

톤 3형용사와 각각의 반례:

1. **정직한.** 단 자기비하는 아니게. 반례: "아직 부족하지만"으로 시작하는 문장. 못 하는 것은 조건과 시점으로 말한다("Instagram은 심사 통과 후 지원").
2. **건조한.** 단 무성의하지는 않게. 반례: 숫자만 나열하고 고객이 무엇을 덜 하게 되는지 안 쓰는 문장.
3. **책임지는.** 단 과잉 약속은 아니게. 반례: "완전 자동", "알아서 최적화".

금기 4개:

1. 게시물 수만으로 과금하지 않는다. 스팸 유인이 된다(`docs/bm.md`).
2. 수집되지 않은 성과를 0이나 가짜 시각으로 표시하지 않는다. 미수집은 미수집이라고 쓴다.
3. 고객의 원본·브랜드 자료·최종 결과물 권리를 가져가지 않는다.
4. 무승인 대량 DM·댓글·팔로우 자동화는 만들지 않는다(anti-persona).

긴장 1개: 우리는 "11개 플랫폼에 한 번에 뿌립니다"를 자랑하지 않는다. 채널 수로 고르는 고객은 Buffer로 가는 것이 맞고, 우리는 그 고객을 놓치는 대가로 발행 정확성을 산다. 밀어내는 고객은 세 부류다. 채널 개수로 값을 매기는 고객, 승인 없이 자동 발행되기를 원하는 고객, 광고비 집행 대행을 원하는 고객.

## AARRR 매핑

| 단계 | 우리 제품의 무엇 | 화면·근거 | 상태 |
|---|---|---|---|
| Acquisition 획득 | 브랜드 근거 기반 콘텐츠를 채널에 발행해 유입을 만든다 | Studio, `multi-channel-publish` 크론, Marketing Home | 부분 구현. Threads만 Live, Instagram은 Connected |
| Activation 활성화 | 첫 성공 경험은 workspace 생성 또는 초대 참여 후 브랜드 자료 가져오기와 첫 발행까지 | workspace create/join/switch, source family5·adapter6, 빠른 1회 게시 | PRD 목표. source family5·adapter6과 wiki CRUD는 신규 target이며 구현 완료 아님 |
| Retention 유지 | 예약과 큐로 반복 발행이 끊기지 않게 하고 인사이트를 다시 생성에 붙인다 | Queue·Inbox·Calendar, `threads-collect-insights`, `threads-track-growth` | Threads 기준 구현. 다채널 확장은 연결 대기 |
| Revenue 수익 | Starter·Campaign·Managed 3티어. 과금 단위는 생성량이 아니라 캠페인이 증거까지 닫히는 것 | `docs/bm.md` 상품 가설 | 미구현. 가격·WTP·원가 전부 pilot 전 가설 |
| Referral 추천 | 없음 | 없음 | 미구현. 로드맵에도 아직 없음 |

전환 연결(광고 클릭에서 신청까지의 추적)은 GA4·슬랙 중앙 성과 통합 계획에 설계만 있다. 따라서 현재 우리가 정직하게 말할 수 있는 범위는 **Acquisition과 Retention의 실행 자동화 + Activation의 근거 정리**까지다. Revenue·Referral은 제품 기능이 아니라 사업 계획이다.

한 가지 경계. AARRR을 "우리가 퍼널 전체를 대신 돌린다"로 말하면 4층의 미구현이 허위가 된다. 대신 이렇게 쓴다. 우리는 퍼널의 첫 두 칸을 대신 돌리고, 나머지 칸을 볼 준비를 하고 있다.

## 마케팅 메시지 후보

헤드라인 5개:

1. 초안은 팔지 않습니다. 발행 증거를 팝니다.
2. 승인하지 않은 사실은 글에 들어가지 못합니다.
3. 마케팅 담당자 대신, 마케팅 담당자의 일을 맡습니다.
4. 목표 하나만 맡기세요. 조사부터 보고까지 한 캠페인으로 돌아옵니다.
5. 심사 2주, 화면녹화 제출, 쿼터 신청. 그 줄에 서는 건 우리 쪽 일입니다.

서브 카피 5개:

1. 회사소개서를 다시 열어 가격을 확인하는 시간을 없앱니다. 승인된 사실만 콘텐츠로 나갑니다.
2. 같은 글이 두 번 올라가는 일은 실패로 취급합니다. 정확히 한 번, 증거와 함께 발행합니다.
3. 수집되지 않은 성과는 0으로 쓰지 않습니다. 왜 못 가져왔고 무엇을 하면 되는지 씁니다.
4. 텍스트, 카드, 영상 순서로 받습니다. 승인할 것만 확인하시면 됩니다.
5. 결과를 봤다고 톤과 문구를 한꺼번에 바꾸지 않습니다. 근거가 선 변수 하나만 바꿉니다.

각 장치의 심리 근거: 1번 헤드라인은 부정 대비(경쟁 제품이 파는 것을 먼저 부정), 2번은 손실 회피(잘못된 정보 발행 공포), 3번은 정체성 전환(도구 구매에서 인력 채용으로 프레임 이동), 5번은 비용 이전(고객이 겪는 노동을 우리가 가져감). 퍼널 단계는 전부 관심에서 사용 진입 구간이며, 측정 지표는 랜딩에서 workspace 생성 전환율과 첫 발행 도달률이다.

## 아직 주장하면 안 되는 것

| 주장 | 금지 이유 | 해금 조건 |
|---|---|---|
| "16개 채널 자동 발행" | Live는 Threads 1개. 13채널은 미연결 | 채널별 credential 검증 + 실 발행 증거 후, 그 채널명만 특정해 표기 |
| "Instagram 자동 발행" | `instagram_business_content_publish` 심사 미통과 | 앱 심사 승인 + Advanced Access 확보 + 실 발행 1건 관찰 후 |
| "YouTube 대량 발행" | 쿼터가 프로젝트 단위 공유, 기본 하루 10,000 유닛 | 규정준수 감사 통과와 증량 승인 후 |
| "AI가 성과를 보고 자동 최적화" | channel×metric threshold 미승인, 학습은 hold | baseline 리포트 승인 + 적격 발행 20건에서 증거 연결 변경 50% 이상 |
| "AARRR 퍼널 마케팅 제공" | 전환 추적 설계만 존재 | GA4 연동 구현 + 전환 1건 실측 후 |
| "월 OO원" 가격 표기 | WTP·원가 미측정 | pilot 원가 실측(텍스트 p95, 영상 p95) 후 |
| "네이버 블로그·Medium·Substack 발행" | export/preview까지만. verified adapter 없음 | adapter 검증 후. 그 전에는 "초안·내보내기"로만 표기 |

이 표는 마케팅 자율성이 아니라 윤리 하드라인이다. 없는 실적·없는 제휴·없는 승인을 암시하면 신뢰 자본과 법적 방어선이 동시에 무너진다.

## 셀프심문과 steelman

**이 포지셔닝이 틀렸다면 왜인가.** 가장 그럴듯한 이유는 고객이 "계보"에 돈을 내지 않는다는 것이다. 1인 대표가 실제로 사는 것은 시간 절약이고, 그가 보는 화면은 발행됐다는 초록 배지 하나다. 버전 계보와 증거는 사고가 났을 때만 값이 생기고, 사고를 겪기 전에는 비용(승인 클릭, 브리프 확인)으로만 느껴진다. 그래서 온보딩이 무거워지면 우리 포지셔닝은 첫 가치 도달 시간을 죽인다. 대응은 PRD가 이미 잡아둔 분리다. 빠른 1회 게시와 대행 캠페인을 갈라 두고, 선택률·완료시간·오류율을 측정한다.

**steelman 반론.** "OSMU는 Buffer의 발행, Jasper의 브랜드 보이스, Hootsuite의 퍼널 연동을 각각 열등하게 합친 제품이 될 것이다. 1인 대표는 세 제품 무료 티어를 쓰면 되고, 우리 강점인 계보는 그가 겪지 않은 사고에 대한 보험이다." 이 반론은 맞다. 반박은 범위 축소로만 가능하다. 전문 편집기·CRM·광고비 집행·범용 CMS를 만들지 않고, 우리가 소유하는 것은 목표에서 증거까지의 계보 하나로 제한한다. 그리고 이 반론이 옳았음을 판정할 숫자는 BM 문서에 이미 있다. workspace 3곳 중 2곳이 28일 안에 발행에서 증거까지 2회 돌지 않으면 "마케팅 대행" 약속을 내리고 grounded composer로 축소한다.

**0번 게이트 확인.** 매칭 스킬 brand-positioning-kit을 실제 호출했고, 그 산출 형식(핵심 포지션·톤 시스템·메시징 필러·금기·긴장)을 이 문서 구조에 반영했다.

---

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=5/5 slop=5/5 total=23/25
WEAKEST_LINE: "이 표는 마케팅 자율성이 아니라 윤리 하드라인이다." 선언이라 장면이 없다. 실제 위반 사례 한 컷으로 바꾸는 것이 낫다.

SKILLS_USED: brand-positioning-kit — 포지셔닝 1문장·톤 3형용사와 반례·금기·긴장·메시징 후보 구조
SKILLS_SKIPPED: hook-angle-lab — 헤드라인 5종은 본 스킬의 메시징 필러 범위 안에서 처리해 별도 훅 랩을 열지 않음

PRESENTATION_CHECK: 툴 잔재 0, 목차·표 구조 확인, 제품 UI 카피 후보에 em dash 0건

SOURCES:
- `/Users/sj/sj_code_master/openclaw-auto/docs/openclaw-auto-marketing-agent-prd-v7.3.5-gpt-codex.md` (참조: One Thing·Persona·BM·Risks가 가리키는 정본)
- `/Users/sj/sj_code_master/openclaw-auto/docs/one-thing.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/persona.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/bm.md`
- `/Users/sj/sj_code_master/openclaw-auto/docs/risks.md`
- `/Users/sj/sj_code_master/openclaw-auto/wiki/product/index.md`
- `/Users/sj/sj_code_master/openclaw-auto/wiki/reference/channel-status.md`
- `/Users/sj/sj_code_master/openclaw-auto/dashboard/src/lib/oauth-app-credentials.ts` (externalReview: instagram·threads·youtube·naver_blog·pinterest·tiktok·facebook = required)
- `/Users/sj/sj_code_master/openclaw-auto/dashboard/src/lib/constants.ts` (IMPLEMENTED_PLUGINS 16)
- https://buffer.com/resources/buffer-vs-metricool/ (Buffer 11 플랫폼, AI Caption Writer, Insights AI takeaway)
- https://hashtagtools.io/blog/buffer-vs-later-vs-metricool-best-scheduler-2026 (Later 8 플랫폼·유료 시작가, Metricool 분석 강점)
- https://zernio.com/blog/instagram-graph-api (instagram_business_basic + content_publish 심사, Advanced Access)
- https://postproxy.dev/blog/post-to-instagram-via-api/ (앱 심사 2~4주, 권한별 화면녹화)
- https://knowledge.hubspot.com/branding/set-up-brand-voice-using-content-samples (표본 글 기반 brand voice = 시장 표준)
- https://www.designrush.com/agency/social-media-marketing/trends/social-media-management-tools (매출 연결 가능 팀 35%)
- https://blog.hootsuite.com/social-media-management/ (GA·Salesforce·HubSpot 연동으로 클릭→전환)
- https://diggrowth.com/blogs/analytics/6-best-tools-for-social-attribution/ (Oktopost B2B 퍼널 분석)
- 미확인: Jasper Knowledge Base의 fact 버전 승인·conflict hold 지원 여부, YouTube 쿼터 증량 감사 절차의 최신 문구는 공식 문서 직접 확인 전이다.

MODEL: claude-opus-5[1m]
