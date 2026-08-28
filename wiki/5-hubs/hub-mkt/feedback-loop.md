# Feedback Loop — 반응→반영 루프 정본 (고객 신호가 공장을 조정한다)

**작성: 2026-07-16** · 작성: content-growth-marketer (openclaw-creative-brief 스킬) · 회장 지시: "고객 반응 보면서 계속 디벨롭 — 태그나 루프 형성, 피드백을 기획·디자인·마케팅에 바로 반영"
정본 계층: 태그가 참조하는 번호 체계 = [hook-bank.md](./hook-bank.md)(H-XX)·[content-calendar.md](./content-calendar.md)(S1–S4·Day)·[growth-log.md](./growth-log.md)(실험 EXP-1~10)·[gtm-plan.md](./gtm-plan.md)(GA4 이벤트) — **이 파일은 그 문서들을 수정하지 않고 연결만 한다.** 워딩 = [naming.md](../../1-team-brand/naming.md) §2 공장 세계관(출고/생산/라인/리포트).

**퍼널 위치 (marketing.md §1)**: 이 루프가 움직이는 단계 = **반응→바이럴→추천** (발행 후 신호를 다음 생산에 반영). 성공 측정 = 주간 루프 실행률(주 1회 빠짐없이 growth-log에 판정 줄이 쌓이는가) + 신호→반영 리드타임(신호 발생 주 → 반영 발행 주).

> 한 줄 요약: **모든 출고물에 태그를 찍고, 모든 신호를 태그로 되돌려 집계하고, 목요일 리포트 직전에 한 번 판정한다.** 마케팅 조정은 하위모델이 즉시, 기획·디자인 반영은 회장 게이트.

## 1. 신호 수집 층 (무엇을 · 어디서 · 누가)

| # | 신호 | 소스 | 수집 주체 | 주기 | 적재 위치 |
|---|---|---|---|---|---|
| G-1 | 글별 반응(도달·좋아요·댓글·저장), 터진 글(`VIRAL_THRESHOLD` 초과), 저조 글 | `threads_insights` (크론 `threads-collect-insights`) | 자동화 | 6h | insights 데이터 (큐 항목과 mediaId로 연결) |
| G-2 | 팔로워 증감 | `threads_growth` (크론 `threads-track-growth`) | 자동화 | 매일 | growth 데이터 |
| G-3 | 외부 인기글·경쟁 포맷 | `threads_search` (크론 `threads-fetch-trending`) | 자동화 | 주 1회 | trending 데이터 |
| G-4 | 댓글 텍스트 신호 — 업종 제보(C-07 응답), 퀴즈 정답 참여(H-12), 반론·질문·오정보 지적 | 발행 글 댓글 | **하위모델** (주간 루프 시 훑기 — API 조회 범위 내. 화면 자동 운전 금지, ADR-004) | 주 1회 | §3 집계표 + growth-log |
| G-5 | DM 인바운드 문의 (업종·시나리오 유형·발송일만 — 전문 기록 금지) | [dm-playbook.md](./dm-playbook.md) §5 로그 | 회장/운영자 (수동) | 발생 시 | dm 로그 → 주간 루프에서 건수·유형만 합산 |
| G-6 | `waitlist_submit`·`cta_click`·`sns_outbound`·`page_view` (utm 채널 기여) | GA4 Data API ([gtm-plan.md](./gtm-plan.md) §2 — 랜딩 라이브 후) | 하위모델 (MARKETING 중앙 집계 — 각 앱 콘솔 열지 않음) | 주 1회 | 주간 리포트 |

수집 원칙: **신호는 원본 위치에 두고, 주간 루프가 태그 기준으로 긁어모은다.** 신호마다 별도 DB를 만들지 않는다 — 0차 파이프라인 리소스 보호(gtm-plan §0 원칙 1).

## 2. 태그 체계 (출고물 → 신호 역추적의 열쇠)

### 2.1 규칙

**모든 큐 항목은 적재 시점에 큐 메모(notes)에 태그 줄 1개를 갖는다.** 캘린더가 이미 Day별로 시리즈·후크를 매핑하고 있으므로, 이 태그는 그 매핑을 "발행 후에도 기계가 읽을 수 있게" 큐 항목에 박제하는 것이다. 태그 없는 항목은 approve 대상에서 제외(집계 불가 = 실험 오염).

### 2.2 태그 문법 (grep-파서블 한 줄, key=value 공백 구분)

```text
tags: day=D12 series=S3 hook=H-32 pillar=P4 risk=raw exp=EXP-7 vm=V4
```

| key | 값 | 필수 | 참조 정본 |
|---|---|---|---|
| `day` | D1~D30 (2사이클부터 D31+) | 필수 | content-calendar §3 |
| `series` | S1~S4 | 필수 | content-calendar §1 |
| `hook` | H-01~H-45 (변형은 `H-22v`) | 필수 | hook-bank |
| `pillar` | P1~P5 | 필수 | brand.md 필러 5 |
| `risk` | safer / raw | 필수 | hook-bank §0.2 |
| `exp` | EXP-1~EXP-10 (실험 소속 글만) | 조건부 | growth-log 백로그 |
| `vm` | V1~V8 (바이럴 장치 소속 글만) | 조건부 | [viral-mechanics.md](./viral-mechanics.md) |

- 신규 key 발명 금지(하위모델). 필요하면 이 파일에 제안 append 후 회장 승인.
- 인바운드 신호(G-4·G-5)에는 수집 시 분류 태그를 붙인다: `sig=pain`(시간·운영 고충) / `sig=feature`(기능 요청) / `sig=price`(가격 문의) / `sig=misinfo`(오정보 지적) / `sig=complaint`(항의) / `sig=lead`(도입 문의). 이 6종 밖이면 `sig=etc`로 두고 주간 루프에서 재분류.

### 2.3 왜 태그인가 (근거)

SaaS 피드백 운영의 표준은 "수집 시점 태깅 + 고정 주기 triage" — 태그 없는 피드백은 분석 비용이 10배가 되고, 주기 없는 triage는 목소리 큰 신호에 끌려간다 ([tendril.us 피드백 루프 가이드](https://www.tendril.us/post/how-to-build-customer-feedback-loops-that-drive-product-roadmaps), [formbricks.com 5단계 루프](https://formbricks.com/blog/product-feedback-loop) — 둘 다 "intake 시점 타입·세그먼트 태그, 주간 고정 triage"를 공통 골격으로 제시). 우리 각색: 세그먼트 태그 대신 **콘텐츠 좌표 태그**(어느 시리즈·후크·실험의 글이 이 신호를 만들었나)를 쓴다 — 우리 1차 목적은 로드맵이 아니라 **다음 주 출고물의 조정**이기 때문.

## 3. 주간 루프 (매주 목요일 S1 리포트 직전 1회)

타이밍 근거: S1 주간 리포트가 목요일 고정(content-calendar §0-2)이므로, **집계→판정을 목요일 오전(리포트 발행 전)에 끝내면 판정 결과가 그대로 리포트 소재가 된다** — 루프 운영 자체가 콘텐츠가 되는 구조(공장 세계관: 주간 생산 리포트에 품질검사 결과 포함).

```text
[목요일 오전 — 하위모델]
1. 지난 7일 발행분의 태그·반응을 §4 체크리스트대로 집계
2. 태그별 판정 → growth-log에 1줄 append (즉시, 게이트 없음)
3. 반영 라우팅(§3.1 표) — 자동 항목은 즉시 실행, 게이트 항목은 제안문 작성
4. S1 리포트 초안에 집계 숫자 공급
[회장 — 비동기]
5. 게이트 항목 승인/반려 (다음 주 루프 전까지)
```

### 3.1 반영 라우팅 표 (무엇이 자동이고 무엇이 회장 게이트인가 — 이 표가 이 문서의 심장)

| 신호 패턴 | 반영 액션 | 실행 주체 | 게이트 |
|---|---|---|---|
| 특정 hook family가 2주 연속 도달 우위 | 다음 주 발행에서 그 family 비중 확대 (캘린더 §0-4 대체 규칙 범위 내 — 같은 시리즈 안에서 후크만 교체) | 하위모델 | **자동** (growth-log 기록 의무) |
| 지표형 항목 실측 미확보 | 비지표 에피소드로 대체 + 사유 기록 | 하위모델 | **자동** (캘린더 §0-4 기존 규칙) |
| 터진 글(G-1 viral 감지) 발생 | 같은 태그 조합으로 후속 1건 다음 주 큐 적재 + growth-log 기록 | 하위모델 | **자동** (초안까지 — approve는 기존 큐 규칙) |
| 실험(EXP) 판정 기준 도달 | growth-log 원장에 결과·판정 append | 하위모델 | **자동** — 단 ⚠️ 표시 실험(2·6·7)은 판정 기록까지만, 적용은 회장 |
| hook-bank 실측치 갱신·신규 후크 등록 | hook-bank append 제안문 작성 | 하위모델 → 상위모델 | **회장/메인세션** (hook-bank §0-1: append는 상위모델 몫) |
| 주간 리듬·요일·시리즈 구조 변경 | content-calendar 개정 제안 | 하위모델 | **회장** (정본 구조 변경 — 실험 2 ⚠️와 동일 급) |
| `sig=pain`·`sig=feature` 신호 주 3건+ 동일 주제 누적 | [product/vision.md](../../2-product/build/vision.md) 반영 제안문 (신호 verbatim 인용 포함) | 하위모델 | **회장** (기획 반영 = 제품 정본) |
| IG 카드뉴스 저장·도달이 특정 표지 유형에서 우위 | [design-system.md](../hub-design/design-system.md) 카드 규격 개정 제안 | 하위모델 | **회장** (디자인 정본) |
| `sig=price` 누적 | 가격 페이지·landing-copy 반영 제안 | 하위모델 | **회장** (가격 = 회장 전결) |
| `sig=misinfo`·`sig=complaint` | §5 에스컬레이션 — 주간 루프를 기다리지 않는다 | 즉시 | 혼합 (§5) |

게이트 설계 원리: **가역적·캘린더가 이미 허용한 범위 = 자동 / 정본 파일 수정·제품 방향·돈 = 회장.** (CLAUDE.md §6.3 리스크 비례 — 가역성 × 파급.)

### 3.2 판정 줄 포맷 (growth-log append용 — 원장 형식 그대로)

```text
| 2026-07-23 | 주간루프: S2 업종제보 4건(카페2·네일1·정육1), H-22v 도달 1.8배 | Threads | 제보→D19 소재 채택, H-22 비중 유지 | 계속 | tags 집계 |
```

## 4. 하위모델 실행 체크리스트 (이 절만 읽고 루프 1회를 돌릴 수 있어야 함)

1. **[읽기]** 이 파일 §2·§3 + growth-log 최신 5줄 + content-calendar §0. (다른 문서는 라우팅 표가 가리킬 때만.)
2. **[집계]** 지난 7일 발행분: 큐에서 `tags:` 줄 추출 → insights의 글별 반응과 mediaId로 결합 → `series`·`hook`·`exp`·`vm` 키별 평균 도달·반응·저장 집계.
3. **[댓글 훑기]** 발행 글 댓글에서 G-4 신호 수집 → `sig=` 분류. 업종 제보는 업종명만 목록화(다음 S2 소재).
4. **[DM 합산]** dm-playbook §5 로그에서 이번 주 건수·`sig=` 유형만 합산 (전문 열람 불필요).
5. **[GA4]** (랜딩 라이브 후) `waitlist_submit`·`sns_outbound`를 utm_source별 집계 — 어느 채널·어느 주 발행이 전환을 만들었는지 1줄.
6. **[판정]** 태그별 우위/열위를 §3.2 포맷으로 growth-log에 append (실측 없으면 "표본 미달, 판정 보류"도 판정이다 — 빈 주 금지).
7. **[자동 반영]** §3.1 자동 행만 실행. 실험 판정 기준(growth-log 백로그의 숫자)을 임의 완화 금지.
8. **[제안문]** 게이트 행 해당 신호가 있으면 제안문 작성 — 형식: ①신호(숫자·verbatim) ②제안 ③하면/안 하면 ④추천. 회장 결정 전 자가 종결 금지.
9. **[리포트 공급]** 집계 숫자를 S1 목요일 리포트 초안에 전달 (발행은 기존 큐 규칙).
10. **[중단 조건]** 집계 도구 실패·insights 공백 시: 추측으로 채우지 말고 growth-log에 "수집 실패, 사유" 1줄 + 메인세션 보고.

## 5. 에스컬레이션 (주간 루프를 기다리지 않는 신호)

| 신호 | 즉시 액션 (하위모델/자동화) | 게이트 |
|---|---|---|
| `sig=misinfo` — 발행 글의 사실 오류 지적 | ①위키·출처와 대조해 사실 확인 ②오류 확정 시 해당 글 큐 status를 내리고(저조 삭제와 동일 경로) 메인세션 보고 ③정정 글 초안 작성 | 정정 **발행**은 회장 승인. 내리는 것은 즉시 (오정보 방치가 더 큰 리스크) |
| `sig=complaint` — 항의·연락 중단 요구 | dm-playbook §2.5 즉시 적용 (opt-out, 설득 금지) | 없음 — 즉시가 규칙 |
| raw 글(S3 논쟁각)에 업계 반발 | 사실 기반 반론 = 출처로 1회 응대 초안 / 인신공격 = 무대응. **논쟁과 항의를 구분**: 댓글 논쟁은 V4 장치의 정상 작동, 항의 DM은 이 표 2행 | 응대 발행은 회장 승인 |
| 도달 급락·플랫폼 경고 (스팸 판정 의심) | 신규 발행 즉시 중단(큐 draft 동결) + 회장 보고 | 재개는 회장 (ADR-004 계정 플래그 이력 — 계정은 한 번 죽으면 끝) |

## 6. 레드팀 셀프체크

- **공격 1**: "주간 루프가 하위모델 재량으로 '자동 반영'을 확대 해석해 정본을 고치기 시작하면?" → 방어: §3.1 자동 행은 전부 **기존 정본이 이미 허용한 대체 규칙**(캘린더 §0-4, growth-log 기록)뿐이다. 정본 파일 수정이 필요한 액션은 예외 없이 게이트 열에 있고, hook-bank §0-1이 append 권한 자체를 상위모델로 제한한다.
- **공격 2**: "신호가 거의 없는 초기(팔로워 소수)에 태그별 집계가 노이즈 판정을 낳지 않나?" → 방어: §4-6에 "표본 미달 = 판정 보류"를 명시했고, 실험 판정 기준(growth-log)이 표본 하한을 이미 갖는다(예: 실험 9 = 방문 500 도달까지). 보류도 기록하므로 루프 실행률 지표는 유지된다.

⛔ 회수 필요: 없음 — 단 G-4 댓글 수집이 API 조회로 충분한지(수동 화면 확인이 필요한 범위가 있는지)는 첫 루프 실행 시 실측으로 확인하고, 수동 확인이 필요하면 그 몫을 회장/운영자 행으로 옮기는 개정 제안을 올릴 것.

---

RUBRIC_SCORE: hook=4/5 detail=5/5 rhythm=4/5 voice=4/5 slop=5/5 total=22/25
WEAKEST_LINE: "신호는 원본 위치에 두고, 주간 루프가 태그 기준으로 긁어모은다." (§1) — 원칙 선언인데 실패 사례(신호별 DB 난립이 왜 죽는지)의 구체 장면이 없어 논리로만 밀고 있음. 첫 루프 실측 후 실패/성공 사례로 보강할 것.
SKILLS_USED: openclaw-creative-brief — 신호→태그→주간 triage→게이트 라우팅의 SOP 구조화·하위모델 체크리스트 설계에 사용
SOURCES/MODEL: claude-fable-5 (Fable 5) · 내부 = wiki/5-hubs/hub-mkt/{naming,brand,hook-bank,content-calendar,growth-log,gtm-plan,dm-playbook,design-system}.md, wiki/2-product/build/vision.md, CLAUDE.md(threads_insights·threads_search·크론 명세), ~/.claude/standards/{writing,marketing}.md(2026-07-16 Read) · 외부(WebSearch 2026-07-16) = tendril.us/post/how-to-build-customer-feedback-loops-that-drive-product-roadmaps + formbricks.com/blog/product-feedback-loop(수집 시점 태깅·주간 고정 triage 골격), influencers-time.com/build-in-public-how-a-saas-brand-achieved-compounding-growth(지표는 결정에 쓰이는 것만 공개 — §3.1 라우팅 표에 반영) — 구조만 차용, 문구 전재 없음
