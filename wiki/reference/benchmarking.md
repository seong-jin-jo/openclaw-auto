# Benchmarking — 리서치 원자료 아카이브

**역할 (2026-07-07 재정의):** 시장·리테션·위키도구 등 **원자료 데이터만** 보관한다. 결론·전략은 [marketing/](../marketing/index.md)이 정본 — 경쟁사 표 = [marketing/competitors.md](../marketing/competitors.md), 포지셔닝 = [marketing/positioning.md](../marketing/positioning.md), 마케팅 실무 = [marketing/playbook.md](../marketing/playbook.md).
(구버전은 같은 블록이 4–5회 중복 붙여넣기된 상태였음 — 2026-07-07 dedupe 재작성. 원문은 git 이력.)

## 시장 규모 (2026-06 조사)

- AI content automation/tools: ~$4.83B (2025) → $31.7B (2033), 26.5% CAGR.
- AI-generated content 전체: $18.4B (2025) → $212B+ (2034), 31%+ CAGR.
- AI video gen: $0.72B (2025) → $3.35B (2034), ~19% CAGR.
- Vertical SaaS 밸류에이션 프리미엄 ~46%.

## AI SaaS 가격·리텐션 (ChartMogul/Optifai 2026)

- 과금 모델 분포: 53% 구독 / 11% 순수 사용량 / 31% 하이브리드.
- **저ACV AI 툴 리텐션 붕괴**: <$50/mo → 32% NRR (23% GRR) / $50–249 → 61% NRR / >$250 → 85% NRR. AI-native 상위는 120%+ NRR (높은 ACV 또는 moat 전제).
- 건강 기준: Logo retention >90%, NRR >110%, ARPA 성장 5–15% YoY.
- 함의: 하이브리드(기본 구독 ₩100–200k + 사용량)로 mid-tier NRR 확보 — [decisions/003](../decisions/003-moat-and-pricing-strategy.md) 근거 데이터.

## 내부 지식관리(위키) 도구 벤치마크

- **Notion**: 초기 팀에 빠름, 스케일에서 지저분·검색 저하·lock-in.
- **Obsidian**: AI/LLM 시대 승자 — 로컬 markdown = RAG/에이전트 친화, wikilinks, no lock-in. "Company Brain" 프로젝트 다수.
- **Confluence**: 엔지니어링 조직용 구조·버저닝, 무거움.
- 우리 선택 (markdown + Git + concern-based 폴더 + 인덱스): Obsidian-inspired, gstack/LLM 에이전트가 폴더 단위로 읽기 최적. 내부(개발 지식) vs tenant Brand Wiki(생성용 사실) 분리.
- 베스트 프랙티스: 최소로 시작(overview+processes+ADR+FAQ) → 템플릿·오너십·서브인덱스로 확장.

## gstack / 고속개발 벤치마크

- gstack = 역할 기반 가상 팀 (CEO/Eng/QA/Doc/Retro) + planning-first + 리뷰 루프 + 지식 레이어(GBrain).
- Garry Tan 벤치마크: 810x 페이스, 60일에 600k+ 프로덕션 라인 (YC 운영과 병행).
- 교훈: 구조+역할+지식 > ad-hoc 프롬프팅. 우리 wiki(brain) + guides/gstack-procedures.md(프로세스)와 정합.

## 유저 감정 스냅샷 (2026 X/리뷰)

- Opus: 취소 후 과금 불만, 품질 비일관("review everything"), 클립 반복/회귀 보고.
- 공통 욕구: 예측 가능한 비용 + 브랜드 컨트롤 + "그냥 되는" 멀티플랫폼.
- (Opus "~40% discard rate"는 2026-07 재확인 실패 — (unsourced), 인용 주의.)

## 실행 함의 (탄탄한 AI SaaS용)

- **가격**: 하이브리드 기본(채널·자동화·위키·숏폼 쿼터) + 사용량(추가 생성) → 61%+ NRR 바닥, 헤비유저 확장으로 110%+.
- **Moat**: 듀얼 위키(tenant 사실 주입 + 프로젝트 brain) + 숏폼 품질 루프 + insights 데이터.
- **리스크**: 모델 품질 회귀 모니터링, 과금 UX 투명성(Opus 반면교사), 저ACV 이탈(mid-tier 유지).

## 갱신 프로세스

- 중대 결정(가격·포지셔닝·주요 기능) 전 재조사: 매출/ARR, 공식 pricing 페이지, Trustpilot/Reddit/X 이탈 신호.
- 경쟁 표 갱신은 [marketing/competitors.md](../marketing/competitors.md)에 (분기), 원자료·시장 데이터는 여기에.
- 소스: opus.pro/pricing, pictory.ai/pricing, ChartMogul/Optifai 2026 리텐션 리포트, Grand View/Fortune/Dataintelo 시장 데이터, Trustpilot/ProductHunt/Reddit/X, gstack repo. 2026-07 추가분: [marketing/proposals/2026-07-07-benchmark-refresh.md](../marketing/proposals/2026-07-07-benchmark-refresh.md).
