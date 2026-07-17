# GTM Plan — 0차 안정 → 공개까지 실행 시퀀스 정본

**갱신: 2026-07-10** · 작성: content-growth-marketer
[playbook.md](./playbook.md) 우선순위 5를 실행 순서·선행 조건·담당·지표·완료 기준으로 구체화. 0차/1차 정의는 [../product/vision.md](../product/vision.md), 표기는 [naming.md](./naming.md)가 진실원.

## 0. 원칙

1. **0차 안정화 리소스를 뺏지 않는다** (playbook 제약 1순위). 마케팅 실행은 0차 산출물(발행 로그·insights)의 재활용이 기본.
2. **증거 먼저, 주장 나중.** "그라운딩 우위"는 랜딩 카피가 아니라 공개 성과(단계 4)로 증명 (positioning.md 리스크 절).
3. **담당 구분**: `회장` = 계정·도메인·결제·veto 등 사람만 할 수 있는 것 / `자동화` = OSMU 크론·insights가 스스로 하는 것 / `하위모델` = 이 wiki를 읽고 실행하는 Haiku/Sonnet 세션.
4. **계측 원칙 (GA4)**: **수집 태그는 각 앱**(랜딩·성과 페이지·pSEO 페이지 각각에 gtag 설치), **분석·리포팅은 MARKETING 중앙**(GA4 Data API로 중앙에서 집계·주간 리포트). 하위모델은 각 앱에 property를 난립시키지 말고, property 생성·연결은 회장/메인세션 결정 사항.

## 1. 단계 시퀀스

### 단계 1 — 도그푸딩 증거 축적 (지금, 진행 중)

| 항목 | 내용 |
|---|---|
| 무엇을 | OSMU로 초안을 생산해 큐에 적재하고, 발행 수·실패·절감 시간·비용을 기록 ([content-calendar.md](./content-calendar.md) 실행) |
| 선행 조건 | 없음 — 0차 파이프라인이 곧 실행 수단. 채널 연결 전엔 큐 적재만 |
| 담당 | 자동화(초안 생성 크론) + 하위모델(캘린더 실행·growth-log 기록) + 회장(큐 approve) |
| 지표 | 주간 큐 적재 건수, approve율, 생성→approve 소요. (GA4 아님 — 내부 큐 데이터) |
| 완료 기준 | **4주 연속 주 3건 이상** 초안이 approve 가능한 품질로 적재 + 실측 지표가 growth-log에 4주치 기록 |

### 단계 2 — 계정 리브랜딩 + 발행 개시

| 항목 | 내용 |
|---|---|
| 무엇을 | IG를 최종 핸들(표시 이름 낙점 후 [naming.md](./naming.md) §2 확정값)로 리네임(Threads 자동 연동), YouTube·X 핸들 확보, 프로필(bio·아바타·배너) 적용, 첫 목요일 운영 보고 발행 = 캘린더 Day 1 |
| 선행 조건 | ①표시 이름 회장 낙점(naming.md §5) ②기존 IG 팔로워 성격 확인(naming.md §2 잔여 확인 1건) ③단계 1 품질 기준 근접 |
| 담당 | **회장**(리네임·개설 — wiki 작업 범위 밖) + 하위모델(bio·고정글 카피 준비) |
| 지표 | 팔로워 baseline 스냅샷(리네임 직후 기록), 주간 팔로워 증감, 발행 준수율(캘린더 대비 실발행 %) |
| 완료 기준 | 핸들 3플랫폼 확보 + 목요일 운영 보고 2회 연속 실발행 + baseline이 growth-log에 기록 |

### 단계 3 — Waitlist 랜딩 1장

| 항목 | 내용 |
|---|---|
| 무엇을 | [landing-copy.md](./landing-copy.md) 정본 카피로 1페이지 구현·배포. SNS 프로필 링크·워터마크 링크를 전부 여기로 수렴 |
| 선행 조건 | ①osmu.kr 도메인 등록(**회장**) ②단계 2 개시(트래픽 소스 없인 랜딩 무의미) ③GA4 property 준비(회장/메인세션) |
| 담당 | 하위모델(구현) + 회장(도메인·배포 승인 — 파이프라인 게이트 준수) |
| 지표 (GA4) | `page_view`, `waitlist_submit`(핵심 전환), `cta_click`(A/B variant), `sns_outbound`. 전환율 벤치 = 평균 2%, 목표 5% (상위권 20%) |
| 완료 기준 | 랜딩 라이브 + GA4 이벤트 4종이 실수집되는 것을 **직접 관찰** + 첫 등록 1건 |

### 단계 4 — 공개 성과 페이지 (open metrics)

| 항목 | 내용 |
|---|---|
| 무엇을 | insights 데이터 재노출 — 발행 수·채널 수·바이럴 감지·비용을 자동 집계하는 공개 1페이지 (Buffer open-metrics 모델). 랜딩 §5 증거 블록의 데이터 소스 |
| 선행 조건 | ①발행 실데이터 4주 이상 ②단계 3 라이브(성과 페이지→waitlist 동선) |
| 담당 | 자동화(집계) + 하위모델(페이지 구현) — 수기 갱신 금지, 자동이어야 지속됨 |
| 지표 (GA4) | 성과 페이지 `page_view` → `waitlist_submit` 전환 기여(경로 분석), 외부 인용·백링크 수(GSC) |
| 완료 기준 | 자동 갱신 성과 페이지 라이브 + 랜딩 증거 블록이 이 데이터를 참조 |

### 단계 5 — pSEO 시드 (14페이지)

| 항목 | 내용 |
|---|---|
| 무엇을 | `setup-guides.ts`의 14+ 채널 셋업 가이드를 "{채널} API 자동 발행 연동 가이드" 공개 페이지로 전환. **시드만** — 대량 생성은 1차 이후 (얇은 페이지 = 스팸 판정 위험, playbook 근거) |
| 선행 조건 | ①단계 3 도메인·사이트 존재 ②페이지당 실품질(실제 화면·실제 절차 — 우리가 직접 연결해본 채널 우선) |
| 담당 | 하위모델(초안 — setup-guides 원문 기반) + 회장(발행 승인) |
| 지표 | GSC 노출·클릭·인덱싱 수, 페이지→waitlist 전환. **주의: 신규 도메인 pSEO는 수개월 무반응이 정상** — 4주 무유입으로 실패 판정 금지 |
| 완료 기준 | 14페이지 발행 + GSC 인덱싱 확인. 성과 판정은 90일 후 |

### 병행 트랙 — "Made with OSMU" 워터마크 (playbook #2)

- 단계에 안 묶임: 기능 플래그는 언제든 가능(**기본 off, approve 통과 글에만**). 문구 "Made with OSMU"는 확정([playbook.md](./playbook.md) 미결정 3 해소). 링크 목적지는 단계 3 전=브랜드 계정 프로필(naming.md §2), 후=랜딩. 효과 측정 = growth-log 실험 5.

## 2. 계측 정본 (GA4 이벤트 명세 — 하위모델은 이 이름 그대로)

| 이벤트 | 위치 | 파라미터 | 의미 |
|---|---|---|---|
| `waitlist_submit` | 랜딩 | `cta_variant`(A/B) | 핵심 전환 (KPI) |
| `cta_click` | 랜딩·성과 페이지 | `cta_variant`, `section` | 전환 퍼널 중간 |
| `sns_outbound` | 랜딩·성과 페이지 | `platform` | 계정 동선 |
| `page_view` | 전 페이지 | 기본 | 유입 (source/medium으로 채널 기여 분석) |

- SNS 프로필→랜딩 링크에는 UTM 고정: `utm_source={platform}&utm_medium=social&utm_campaign=osmu-factory`.
- 주간 리포트: MARKETING 중앙이 Data API로 집계 — 하위모델이 각 앱 GA4 콘솔을 열지 않는다.

## 3. 단계 이동 규칙

- 단계는 순차가 기본이되, **완료 기준 미달 시 다음 단계 착수 금지** (0차 리소스 보호).
- 각 단계 완료 시 growth-log에 1줄 기록 + 이 파일의 해당 단계에 완료일 추기.
- 실험(growth-log 백로그)은 단계와 독립 실행 가능 — 단 실험별 명시된 선행 조건은 따른다.

## 4. 미결정 연동 (playbook §미결정 — 회장)

1. build-in-public 언어·채널(국문 Threads vs 영문 X vs 병행) → **growth-log 실험 6으로 데이터 판정 제안** (단계 2 이후).
2. 오픈소스 GitHub 퍼널(n8n/Postiz형) — 서비스중립 레포 정책과 충돌 정리 전 보류. 이 계획에 미포함.
3. 워터마크 문구 — naming veto 통과 시 "Made with OSMU"로 자동 확정 제안.

SOURCES/MODEL: [Fable 5] · 내부 = wiki/marketing/{playbook,positioning,naming,landing-copy,content-calendar}.md, wiki/product/vision.md(0차/1차 정의·온보딩 제약), wiki/reference/channel-status.md · 외부 = getlaunchlist.com·flowjam.com waitlist 전환 벤치(2%/20%), playbook.md 수록 기존 사례(Buffer·Zapier·Opus — 원출처는 playbook 참조)
