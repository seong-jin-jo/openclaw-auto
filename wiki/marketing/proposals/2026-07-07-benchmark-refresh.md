> **상태: 리서치 원자료 (2026-07-07)** — content-growth-marketer 산출(검증 PASS: 스킬 1·웹리서치 39회). 결론은 marketing/positioning·competitors·playbook에 반영됨; 이 파일은 출처 보존용 아카이브.

# OSMU(가칭 SoloClaw) 벤치마크 리프레시 — 2026-07 기준

작성: content-growth-marketer (서브에이전트) / 대상: wiki/reference/benchmarking.md + wiki/product/vision.md "Competitive Benchmarking" 절 갱신용
검증 방식: WebSearch 13건 (2026-07-07 실행). wiki 직접 수정 안 함 — 컨트롤러 검증 후 반영.

---

## 0. 기존 위키 데이터 대비 델타 (무엇이 낡았나)

| 기존 wiki 주장 (2026-06) | 2026-07 확인 결과 | 판정 |
|---|---|---|
| Opus Clip "~$215M valuation est." | 확정 사실: 2025-03 SoftBank Vision Fund 2에서 $20M 조달, $215M 밸류. 총 $50M 조달. ARR ~$20M, 유저 10M+ ([Sacra](https://sacra.com/c/opusclip/), [Forbes](https://www.forbes.com/sites/ianshepherd/2025/03/13/softbank-is-betting-on-the-future-of-ai-content-creation-with-opusclip/)) | 업데이트 (est.→확정) |
| Opus = "clip-only, 비디오 전용" | **낡음.** 2025-08 "Agent Opus" 출시 — 클리핑을 넘어 웹 소스 수집→스크립트→플랫폼별 완성 영상까지 end-to-end 에이전트로 확장 ([Sacra](https://sacra.com/c/opusclip/), [OpusClip blog](https://www.opus.pro/blog/opusclip-raises-a-new-round-of-funding-from-softbank-and-launches-opussearch)) | **전략 함의 큼** — "우리만 agentic" 주장 폐기 필요 |
| Opus 가격 Free/$15/$29 | 유지 (Free 60min 워터마크, Starter $15/150min, Pro $29/300 credits). 신규 확인된 마찰: 구독 취소 시 3일 내 프로젝트 삭제, API는 Business 플랜 전용 ([eesel](https://www.eesel.ai/blog/opusclip-pricing), [opus.pro/pricing](https://www.opus.pro/pricing)) | 유지 + 마찰 추가 |
| Opus "~40% discard rate" | 이번 조사에서 재확인 못 함 — 계속 인용하려면 (unsourced) 태그 유지 | 태그 필요 |
| 신흥주자 (Postiz/Blotato/FeedHive/Typefully/Hypefury/vidyo.ai) | **위키에 전무.** 아래 §1에 신규 수록 | 신규 |
| Descript "transcription-first, more manual" | 2026 크레딧 기반 AI 과금 전환으로 기존 무제한 기능이 크레딧 소모형이 됨 → 유저 마찰 ([fluxnote](https://fluxnote.io/guides/ai-video-tools-comparison-pricing-2026)) | 업데이트 |
| Munch "Creator ~$49" | 유지 (~$49/mo) ([fluxnote](https://fluxnote.io/guides/ai-video-tools-comparison-pricing-2026)) | 유지 |
| Pictory "Starter ~$25" | Starter $19, Professional $29(월결제)/~$35(연), Teams $99-119 ([pictory.ai/pricing](https://pictory.ai/pricing/), [saasworthy](https://www.saasworthy.com/product/pictory-ai/pricing)) | 소폭 수정 |
| benchmarking.md 자체 | **같은 블록이 4-5회 중복 붙여넣기 되어 있음** (Opus 딥다이브·NRR표·위키 벤치가 반복). 갱신 시 dedupe 필수 | 구조 문제 |

---

## 1. 경쟁 제품 최신화 (2026-07)

### 1a. 숏폼/클리핑 계열

| 제품 | 가격 (2026-07) | 포지셔닝 | 최근 변화 | 우리와의 갭 |
|---|---|---|---|---|
| **Opus Clip** | Free(60min, 워터마크)/Starter $15(150min)/Pro $29(300cr)/Business 커스텀 | 시장 리더. 10M+ 유저, ARR ~$20M, $215M 밸류 | **Agent Opus**(2025-08): 클리핑→생성형 end-to-end 에이전트. OpusSearch 출시 | 위키 사실 그라운딩 없음. API가 최고가 플랜 전용. 취소 시 3일 내 프로젝트 삭제. 텍스트 채널 오케스트레이션 없음 |
| **vidyo.ai** | Free/Lite $15/Essential $20(300cr)/Growth $25(600-1800cr) | Opus 저가 대체. 발행·스케줄·브랜드킷은 크레딧 미소모 | 크레딧-무료액션 분리 과금 ([vidyo-ai.com/pricing](https://vidyo-ai.com/pricing)) | 동일 — 클립 중심, 그라운딩·텍스트 루프 없음 |
| **Munch** | Creator ~$49+ | 웨비나/팟캐스트 리퍼포징 | 큰 변화 없음, 가격대 높음 | 동일 |
| **Pictory** | Starter $19/Pro $29-35/Teams $99+ | 스크립트·블로그→영상 (스톡+보이스) | 유저 이탈 조짐 — "ditching Pictory" 류 비교글 다수 ([ngram](https://www.ngram.com/blog/top-9-ai-video-creator-alternatives-to-pictory-in-2026-reviewed-and-compared)) | 발행 루프 없음 |
| **Descript** | Creator $24 | 편집기 (transcription-first) | 무제한→크레딧 전환으로 마찰 | 자동화 아님 |

### 1b. 신흥주자 — 스케줄러/리퍼포징 엔진 (위키에 없던 것, 우리와 가장 직접 경쟁)

| 제품 | 가격 (2026-07) | 포지셔닝 | 우리와의 갭 |
|---|---|---|---|
| **Postiz** | **셀프호스트 무료(오픈소스)** / Cloud $29-99, 30+ 플랫폼 | "agentic social media scheduling" — 우리와 같은 언어를 이미 씀. GitHub 퍼널로 성장 ([postiz.com](https://postiz.com/), [GitHub](https://github.com/gitroomhq/postiz-app)) | 스케줄링 중심 — 생성 품질·브랜드 위키 그라운딩·인사이트 학습 루프 없음. 그러나 **"오픈소스+셀프호스트+멀티채널" 포지션을 선점** — 우리 open-core 스토리의 직접 경쟁 |
| **Blotato** | Starter $29/Creator $97/Agency $499 | "8-in-1 AI 콘텐츠 엔진" — 롱폼→클립·캐러셀·페이스리스 영상, 20계정, **n8n/Make API 노드 제공**, 창업자 주간 오피스아워 ([blotato.com](https://www.blotato.com/), [ryandoser](https://ryandoser.com/blotato-review/)) | 기능 폭은 유사 방향. 갭 = 위키 그라운딩·피드백 학습·셀프호스트 없음. $29에 이 번들 = **우리 가격 스토리에 압박** |
| **FeedHive** | $15-30 | AI 소셜 스케줄러 (예측·리사이클) | 생성 깊이 얕음 |
| **Typefully** | Free/$12.5/Creator $19/Team $39 | X/스레드 작성+스케줄, 인디 창업자 애용 | 단일 플랫폼 중심 |
| **Hypefury** | $25~Creator $65~Agency $150 | X 자동화·인게이지먼트 (자동 리트윗, 플러그) | 자동화 트릭 중심, 콘텐츠 생성 얕음 ([socialrails](https://socialrails.com/blog/hypefury-pricing)) |

### 1c. 포지셔닝 함의 (레드팀 반영)

- **"agentic"은 더 이상 차별화 단어가 아니다.** Opus(Agent Opus)·Postiz가 이미 같은 언어를 쓴다. 살아남는 차별화 = ① **위키/사실 그라운딩**(아무도 안 함) ② **발행→반응수집→학습 클로즈드 루프** ③ **open core + 셀프호스트 가능** (Postiz와 공유하나, Postiz는 생성 품질이 없음).
- Blotato $29 번들 때문에 "기능 폭"으로는 못 이긴다. **"네 브랜드 사실을 아는 자동화"**(no hallucination)로 좁혀야 함.
- ADR-003의 하이브리드 가격 방향은 여전히 유효 (unsourced 재검증 없음 — NRR 표는 기존 wiki 데이터 유지).

---

## 2. 잘나가는 SaaS 마케팅 실무 벤치마크 (채널별 실사례)

### 2a. Build-in-public / 창업자 개인계정
1. **Pieter Levels**: 10년간 X 팔로워 60만 축적하며 40+ 제품 공개 런칭. Photo AI 출시 첫 주 $5.4K → 18개월 $132K MRR, 현재 $138K/mo, 연 $3M ([FastSaaS](https://www.fast-saas.com/blog/pieter-levels-success-story/), [nomadicblueprint](https://nomadicblueprint.com/case-studies/pieter-levels)). 핵심 구조: **유통(팔로워)을 먼저 쌓고 제품을 그 위에 얹음.**
2. **Marc Lou**: 2025년 $1.03M, 28개 제품 전부 공개 런칭+매출 공개. 단일 히트가 아니라 포트폴리오+반복 런칭 서사 ([Indie Hackers](https://www.indiehackers.com/post/what-marc-lou-s-1m-year-reveals-about-solo-saas-compounding-Kd7SbxGXTYn5gMdfoY8R)).
3. **Buffer (transparency 원조)**: 급여·매출 전면 공개 → Business Insider/Forbes가 헤드라인으로 받아 백링크 자석화, 블로그 월 150만 방문, ARR $20M+ ([startupspells](https://startupspells.com/p/buffer-open-salaries-backlink-magnet-pr-hack-seo-case-study), [buffer.com/open](https://buffer.com/open)). 구조: **투명성 = 무료 PR + SEO 복리.**
4. **Tally**: 부트스트랩 $175K MRR(2025-02, 8명). 성장 공개 블로깅 + 커뮤니티가 핵심 채널 ([blog.tally.so](https://blog.tally.so/bootstrapping-to-150k-mrr-by-doing-less-better/), [GTM Strategist](https://knowledge.gtmstrategist.com/p/tallys-bootstrapped-journey-to-500000-users)).

### 2b. 제품 자체가 유통 (워터마크/뱃지)
1. **Opus Clip**: Free 플랜 워터마크 클립이 곧 광고 → 출시 7개월 만에 5M 유저, 2025 초 10M+ ([Sacra](https://sacra.com/c/opusclip/)).
2. **Tally**: 무료 폼의 "Made with Tally" 뱃지가 리드 생성기, 무료→Pro 전환 ~3% ([thesuccessfulprojects](https://www.thesuccessfulprojects.com/case-study-7-marie-filip-tally/)).

### 2c. Programmatic SEO
1. **Zapier**: 통합조합 페이지 5만 개 ("Gmail+Slack" 등 데이터 기반 고유 페이지) → 월 5.8M+ 오가닉, 3년 만에 오가닉 4배 ([seomatic](https://seomatic.ai/blog/programmatic-seo-examples), [salt.agency](https://salt.agency/blog/how-zapier-quadrupled-organic-traffic/)).
2. **Canva**: 템플릿 페이지 2.2M+, 50만 키워드, pSEO 오가닉 월 1.3M+ ("resume templates" 단일 페이지 월 144만) ([Thrillax](https://www.thrillax.com/programmatic-seo-saas-strategy/), [concurate](https://concurate.com/programmatic-seo-examples/)).
- 공통 구조: **반복 템플릿 × 고유 데이터셋** (통합 목록, 템플릿, 유즈케이스). 얇은 복제 페이지는 실패.

### 2d. 오픈소스/커뮤니티-led
1. **n8n**: fair-code 셀프호스트 무료 + 클라우드 유료 → 유저 20만+, 커뮤니티 확장 2,200+, AI 전환으로 ARR 5배, 2025-03 시리즈B $60M, 주간 인바운드 리드 1,000+ ([Medium 딥다이브](https://medium.com/@takafumi.endo/inside-n8n-how-a-fair-code-open-source-platform-leads-ai-powered-workflow-automation-e8128890d496), [HockeyStack](https://www.hockeystack.com/case-studies/n8n)).
2. **Postiz**: GitHub 리포 자체가 획득 퍼널 (오픈소스 스케줄러로 리뷰/비교글 대량 발생) ([GitHub](https://github.com/gitroomhq/postiz-app)).

### 2e. 숏폼 오가닉 (SaaS/앱)
1. **TripBFF**: UGC 계정 30+ 운영 → 누적 475.5M 뷰, $60K MRR/월 4만 다운로드 ([socialgrowthengineers](https://www.socialgrowthengineers.com/2025-tiktok-organic-growth-report-lessons-trends-and-the-road-to-2026)).
2. **FlowTrack**(B2B): "Office Hack" 5부작 현지화로 14일 만에 독일 팔로워 15,000 ([tokportal](https://www.tokportal.com/use-cases/saas-tiktok-marketing-b2b-growth)).
3. 리드 타임 실측: 계정 권위 30일 + 테스트 30-60일 → **첫 리드는 보통 60-90일차** ([tokportal](https://www.tokportal.com/use-cases/saas-tiktok-marketing-b2b-growth)). 즉효 채널 아님.

### 2f. 창업자 LinkedIn (참고 — 출처가 대행사 블로그라 방향성 지표로만)
- 주 3-5회 × 18개월 포스팅 시 $0.5-2M 파이프라인 주장; 개인 프로필이 회사 페이지 대비 5-10x 도달 ([foundera](https://www.foundera.co/blog/founder-led-linkedin-growth), [averi](https://www.averi.ai/how-to/linkedin-marketing-for-b2b-saas-the-complete-strategy-guide-for-2026)). 수치는 프로모셔널 — 방향("개인계정 > 회사계정")만 채택.

---

## 3. OSMU 0차 단계 마케팅 실무 우선순위 5 (지금 당장)

전제: 0차 = 운영자 직접 사용, PMF 전, 포털 OAuth 셋업 중. 원칙 = **제품 사용 자체가 마케팅이 되게 설계** (0차 안정화 리소스를 뺏지 않는 것이 1순위 제약).

| # | 실무 | 무엇을 | 노력 | 기대효과 | 근거 벤치마크 |
|---|---|---|---|---|---|
| 1 | **도그푸딩 build-in-public** | OSMU로 OSMU(및 6사업체) 콘텐츠를 실제 발행하면서, 그 과정·수치(발행 수, 터진 글, 절감 시간, 실패까지)를 창업자 개인 계정(Threads/X)에 주 3-5회 공개. 콘텐츠 자체를 OSMU 큐로 생산 = 제품이 자기 증명 | 낮음 (제품이 이미 생산) | PMF 전 유통 자산(팔로워) 선축적 + 1차 목표(유저 1명)의 리드 풀 | Levels(유통 먼저 10년), Marc Lou(공개 런칭 28회), Tally(성장 공개) — §2a |
| 2 | **발행물에 "Made with" 훅 심기** | 자동 발행되는 글/숏폼 끝에 서명 라인 또는 워터마크 (예: "이 글은 SoloClaw가 자동 발행"). 발행 파이프라인에 옵션 플래그 1개 | 최소 (코드 한 줄급) | 발행량이 곧 노출량 — 배포 자체가 획득 채널화 | Opus 워터마크(7개월 5M 유저), Tally 뱃지(전환 3%) — §2b |
| 3 | **공개 성과 페이지 (open metrics)** | OSMU가 실제 발행한 글 수·채널 수·바이럴 감지 수·운영 시간 절감을 자동 집계하는 공개 대시보드 1페이지 (이미 insights 데이터 있음) | 중 (기존 insights 재노출) | 신뢰 + PR/백링크 자석 + 랜딩 증거 블록. "AI 자동화가 진짜 도나?"에 대한 유일한 답 | Buffer open metrics(블로그 150만/월, 백링크 복리) — §2a-3 |
| 4 | **Waitlist 랜딩 1장 + 후킹 각도 고정** | 포지셔닝을 "agentic"이 아니라 **"네 브랜드 위키를 아는 콘텐츠 자동화 — 헛소리(할루시네이션) 없는 자동 발행"**으로 고정한 waitlist 페이지. #1의 개인계정 CTA를 전부 여기로 | 중 (1페이지) | 0차 중 수요 신호 수집 — 1차(결제 1명) 후보 리스트 | §1c 포지셔닝 갭 (그라운딩만 무주공산) + founder-led 트래픽의 착지점 필요 — §2f |
| 5 | **pSEO 시드: 채널 셋업 가이드 공개 문서화** | 이미 내부에 있는 채널별 setup guide(setup-guides.ts, 14+ 채널)를 "{채널} API 자동 발행 연동 가이드" 공개 페이지로 전환. 채널×유즈케이스 조합이 고유 데이터셋 | 중 (기존 자산 재활용) | 장기 오가닉 복리 — 토큰 발급이 온보딩 병목(vision.md)인 만큼 검색 수요 존재 | Zapier 통합 페이지(월 5.8M), Canva 템플릿 — §2c |

**순서 논리**: 1→2는 즉시·무비용, 3→4는 0차 산출물 재활용, 5는 장기 복리. 오픈소스 GitHub 퍼널(n8n/Postiz형)은 강력하지만 upstream openclaw와 우리 fork의 관계 정리가 필요해 우선순위에서 제외 (⛔ 회수 필요 참조).

---

## 4. 위키 시스템 개선 제안 — `wiki/marketing/` 신설

현재 구조(architecture/decisions/product/ops/guides/learnings/reference)에 마케팅·브랜드 지식의 자리가 없어 benchmarking.md(reference)에 전략·가격·마케팅이 뒤엉켜 중복 증식 중. 제안:

```
wiki/marketing/
  index.md          — 섹션 지도 + 현재 마케팅 단계(0차) 한 줄 선언
  positioning.md    — 포지셔닝·차별화 정본 (vision.md "Competitive Benchmarking" 절에서 '우리 주장'만 이관; 경쟁 데이터는 competitors.md로)
  competitors.md    — 경쟁사 표 정본 (본 문서 §1; 분기 갱신, 갱신일 명기; benchmarking.md의 경쟁 블록 이관+dedupe)
  playbook.md       — 채널별 마케팅 실무 플레이북 (본 문서 §2 — 사례·구조·우리 적용)
  brand.md          — 이름(가칭 SoloClaw)·톤·메시지·금지 표현 (레포 서비스중립 정책과의 경계 명시)
  growth-log.md     — 실험 원장: 언제 무엇을 돌렸고 수치 결과 (append-only)
  assets.md         — 랜딩/워터마크/공개 대시보드 등 마케팅 자산 인벤토리와 위치
```

- **reference/benchmarking.md** = "리서치 원자료 아카이브"로 축소 (결론은 marketing/으로, 원자료·표만 남김 + 중복 4-5회 블록 dedupe).
- **decisions/**에는 그대로 ADR (가격·포지셔닝 변경 시 ADR-004 등).

---

## 5. 셀프심문 (CoVe) + 레드팀

**Q1. "우선순위 1(build-in-public)이 틀렸다면 왜?"** — 0차 핵심 리스크는 안정성인데 마케팅이 주의를 분산시킬 수 있다. 또 한국어 시장에서 X/Threads build-in-public의 효력은 영어권 사례(Levels/Lou)만큼 검증 안 됨. → 수정: 1·2번을 "제품 사용의 부산물"로만 설계 (별도 제작 노력 0에 수렴할 때만 실행). 한국어 시장 효력은 (unsourced) — 실측은 growth-log로.

**Q2. "워터마크(2번)가 틀렸다면 왜?"** — 초기 품질이 낮으면 워터마크가 역광고. → 수정: 사람 승인(approve) 통과 글에만 서명 노출, 옵션 기본 off로 시작.

**Q3. "pSEO(5번)가 틀렸다면 왜?"** — 도메인 권위 0인 신규 사이트에서 pSEO는 수개월+ 무반응이 정상이고, 얇은 페이지는 구글 스팸 판정 위험. → 수정: 5번은 "시드"로만 (14페이지 수준, 실제 셋업 가이드 품질), 대량 생성은 1차 이후.

**Q4. "경쟁 데이터가 틀렸다면 왜?"** — 가격은 리뷰 블로그 다수 교차확인이지만 공식 pricing 페이지 직접 크롤은 Opus/Postiz/Pictory만 링크 확보. Blotato $29/97/499, Hypefury Creator $65 등은 리뷰 사이트 수치 — 위키 반영 시 "2026-07 리뷰 소스 기준" 명기 권장. Opus "40% discard"는 이번에도 원출처 미확인 → (unsourced) 유지 또는 삭제 권고.

**Q5. "0번 게이트 — 스킬을 실제 호출했나?"** — viral-trend-research 호출함 (리서치 렌즈로 사용). series/hook 계열은 이번 산출물(리서치)에 비매칭이라 미사용.

**레드팀(회의적 투자자 관점)**: "Opus가 이미 에이전트로 확장했고 Blotato가 $29에 8-in-1을 주는데 OSMU가 낄 자리가 있나?" → 반박: 둘 다 '브랜드 사실 그라운딩 + 발행 후 학습 루프 + 셀프호스트'가 없다. 단, 이 갭은 12-18개월짜리 창이므로 포지셔닝 메시지를 지금 고정(우선순위 4)하고 도그푸딩 증거(1·3)를 선점하는 것이 방어. "그라운딩" 우위는 주장이 아니라 공개 성과 페이지로 증명해야 함.

---

## ⛔ 회수 필요 (회장/메인세션 결정)

1. **창업자 개인계정 build-in-public 채널·언어**: 한국어 Threads 중심 vs 영어 X 중심 vs 병행 — 타깃(한국 자영업자 vs 글로벌 인디)이 갈린다. 우선순위 1의 방향타.
2. **오픈소스 GitHub 퍼널 채택 여부**: n8n/Postiz형 성장은 강력하나, 이 레포는 "서비스 중립 공통 플랫폼 + Custom Integration은 fork" 정책. 우리 fork를 공개 마케팅 자산으로 쓸지(브랜드 노출)와 upstream과의 관계 정리는 회장 결정 사안.
3. **"Made with SoloClaw" 서명**: 이름이 가칭인 상태에서 워터마크에 박을지 (이름 최종 확정은 0차 안정 후로 되어 있음 — vision.md). 임시 서명 문구 결정 필요.

---

SKILLS_USED: viral-trend-research — 경쟁 트렌드/마케팅 채널 사례 리서치 렌즈·출력 규율에 사용
SKILLS_SKIPPED: series-content-planner·hook-angle-lab — 이번 산출물은 리서치/플레이북이지 콘텐츠 제작이 아니라 비매칭. skill-scout-report — 대상이 Claude 스킬이 아니라 경쟁 SaaS라 비매칭.

SOURCES/MODEL: model=claude-fable-5 (Fable 5). 읽은 파일: wiki/reference/benchmarking.md, wiki/product/vision.md, wiki/decisions/003-moat-and-pricing-strategy.md. 주요 출처: sacra.com/c/opusclip, opus.pro/pricing, eesel.ai/blog/opusclip-pricing, postiz.com + github.com/gitroomhq/postiz-app, blotato.com + ryandoser.com/blotato-review, socialrails.com/blog/hypefury-pricing, wearefounders.uk (Hypefury vs Typefully), fluxnote.io/guides/ai-video-tools-comparison-pricing-2026, pictory.ai/pricing, vidyo-ai.com/pricing, fast-saas.com (Levels), indiehackers.com (Marc Lou), buffer.com/open + startupspells.com, blog.tally.so + thesuccessfulprojects.com, seomatic.ai + salt.agency (Zapier), thrillax.com (Canva), medium.com/@takafumi.endo + hockeystack.com (n8n), socialgrowthengineers.com + tokportal.com (숏폼). 미확인 잔존 주장: Opus 40% discard (unsourced), founder-led LinkedIn 파이프라인 수치(대행사 블로그 — 방향성만).
