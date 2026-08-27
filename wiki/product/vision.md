# Product Vision: AI-Powered Content Automation (Current Phase)

**0차 목표 (현재 최우선)**: 운영자가 여러 서비스의 wiki/context를 끌어와서 마케팅 콘텐츠 자동화를 **안정적으로 직접 운영**하는 것.

**1차 목표 (PMF)**: 단 1명이라도 결제해서 쓰거나, 초기 이벤트로 자기 사용량만 내고 실제로 쓰는 사람이 '존재'하는 것.

**Mission**: 비개발자(자영업자, 일반인)가 마케팅 대행사 없이도 안정적으로 콘텐츠 자동화를 돌릴 수 있게 한다. 기존에 귀찮았던 시간/비용을 압도적으로 줄이거나, 불가능했던 것을 가능하게 만든다. (숏폼 자동화로 부수입 기회 포함)

**성과 측정 범위 — Awareness 집중 (회장 R-14, 2026-08-12)**: OSMU는 AAARRR 중 **가장 앞단 A(Awareness, 인지도)**에 집중하는 콘텐츠 마케팅 자동화 에이전시다. 성과 = 콘텐츠를 통해 노출되고 반응하는 정도만 관리·측정한다(플랫폼 API의 조회·저장·좋아요·댓글·팔로우·프로필 방문). **GA4·유입-매출 전환 퍼널·검색 콘솔·검색 어드바이저·Clarity 류 유입/전환 측정은 기본 범위에서 제외(후순위 옵션)** — 웹사이트가 없는 자영업자(음식점·헬스장 사장)가 타겟에 포함되므로 이들에게는 무의미하고, 요구가 쌓이면 웹 가진 고객 한정 옵션으로 붙인다. 단 **트렌드·키워드 도구(네이버/구글 트렌드, 키워드 플래너)는 유입 측정이 아니라 콘텐츠 소재 발굴 = 생성 입력**이라 유지하며, 자체 블로그 SEO도 우리 마케팅 자산으로 유지한다. 상세·AARRR 매핑 = [positioning.md](./positioning.md) "성과 측정 범위 확정".

**Target (현실)**: 코딩/자동화 구축 능력이 없는 일반인·자영업자. 스스로 마케팅 자동화 서비스를 만들고 운영할 수 없는 사람들. API 토큰 발급/등록 과정이 큰 병목이 될 수 있음.

**Product Wiki 전략**: 여기 루트 `wiki/` 는 **이 상품 자체의 지식 베이스**(제품 위키)다. 사용자가 이미 가진 다른 레포/노트 위키를 포인팅해서 컨텍스트를 끌어오는 기능은 별도 구현 필요. 상품 이름은 **OSMU(오스무)** 확정([ADR-005](../decisions/005-brand-naming.md), 구 가칭 SoloClaw는 기각 — 아래 "상품 이름" 절 참조).

**Core Value Proposition**
- **Automation Loop** (from README): Collect trends → AI generate drafts (guided by brand wiki) → Human approve (low effort) → Multi-channel publish (optimized per platform) → Collect reactions + learn → Improve next cycle.
- **Shorts Factory** (killer feature): Turn longform (blog, wiki pages, transcripts) into dozens of high-performing vertical videos (Reels/Shorts/TikTok) with TTS, captions, and publish.
- **Brand Truth Layer**: Project wiki (internal) + tenant Brand Wiki (customer-facing facts) ensure consistent, non-hallucinated output at scale.
- **gstack-Driven Development**: All product work follows rigorous, role-based processes (see guides/gstack-procedures.md). This ensures quality as we scale to support 1000+ teams.

## Why Now (Market Timing)
- AI agents (Claude + OpenClaw runtime binding) have crossed the threshold where one person can ship like a team of 20.
- Social platforms reward consistent, platform-optimized content (shorts especially).
- Operators of multiple services (IT startups, personal brands) are overwhelmed by manual creation + posting + analysis.
- Existing tools (Buffer, n8n, Make) are either too manual or lack LLM judgment + feedback loops.
- Our differentiation: Runtime LLM agent deciding tool sequence + per-tenant wiki grounding + native shorts pipeline + gstack-powered velocity for rapid iteration.

## Current Phase Priorities (gstack CEO Review 반영, 2026-06)

**0차 (현재 최우선, 완벽히 먼저)**: 운영자(나)가 OSMU를 통해 **토픽/소스 → 텍스트 + 이미지 + 영상(숏폼)** 후보를 잘 뽑아 발행하고, 위키 컨텍스트 + 브랜드 톤(후킹)을 제대로 적용하며, **롱폼 영상 소스(로컬 파일 + YouTube URL)를 외부 클리퍼로 잘라 OSMU로 가져와 다듬고 멀티채널로 뿌리는** 상태를 만드는 것. (Hybrid: 전문 클리핑은 외부 API 활용, OSMU는 브랜드/위키 refinement + unified distribution 담당)

**0차 성공 기준 (완벽히 잘 돌아가는 상태, 진행 중 검증)**:
- 토픽/아이디어 → 플랫폼별 텍스트 변형 + 이미지 + 영상(숏폼) 후보가 한 번에 생성되어 발행 준비됨. (studio + sourcing + video)
- 위키 컨텍스트 + 브랜드 톤(후킹, 말투, 사실)이 제대로 주입되어 후보가 브랜드 일관성을 가짐. (sourcing/studio text, clip refinement)
- 롱폼 소스(로컬 파일, YouTube 긴 영상 URL) → AI 클리핑(외부 Reap/Ssemble 등) → OSMU에서 다듬기(위키/톤) → 영상플랫폼 + 텍스트 크로스포스트까지 동작. (new repurpose flow)
- 여러 레포 wiki context 로드 + 프롬프트 주입 (0차 multi-repo context_sources + wiki_path 이미 완료).
- Shorts Factory + multi-channel publish 루프가 에러 없이 (또는 에러가 명확히 설명 가능하게) 동작. (notes + partial)
- 사용자가 "이 에러가 왜 났는지"를 스스로 설명하거나 로그로 재현 가능. (enhanced in sourcing/studio/video/longform)
- 인프라/크론/발행이 재현성 있게 안정. (handoff smoke + constraints respected)
- 온보딩 (토큰 등록 등) 마찰이 최소화되어 혼자서도 셋업 가능. (notes)
- OSMU(오스무)로 자신의 콘텐츠(특히 기존 롱폼 영상 소스)를 실제로 생산/발행하면서 시간 절감 체감.
- handoff 제약 (GHA, build, PORT, smoke) 준수.

**1차 (PMF)**: 0차가 완벽히 된 후, 단 1명이라도 결제해서 쓰거나 초기 이벤트로 자기 사용량만 내고 실제로 쓰는 사람이 '존재'하는 것.

**현재 단계 원칙**: 0차를 완벽하게 구현하고 나서 1차로 넘어간다. 지금은 안정성, 에러 설명력, 온보딩 마찰 최소화, 숏폼 생산 공장 동작에 집중.

**Pricing**: 지금은 "존재만 하면 다행" 수준. 고객들이 에러 상황을 제대로 설명 못 하고, 인프라 다운/에러로 환불·소송까지 가는 상황이 훨씬 큰 위험. Pricing 집착은 나중에.

**Onboarding 현실 + 현재 운영 제약 (handoff 반영, 0차 필수)**: 
- API 토큰 발급/등록이 병목.
- 현재 라이브: cloudflared 터널 (Proxmox) + self-hosted GHA (marketing_runner) + 수동 `gh workflow run deploy-marketing.yml -f services="openclaw-dashboard-osmu"` (포트 18789).
- **빌드/배포 규칙 절대 준수** (handoff에서 고친 치명 버그):
  1. NEXT_PUBLIC_* 는 반드시 build-arg (런타임 .env만 주면 supabaseUrl required로 죽음).
  2. 포트는 DASHBOARD_PORT (기본 34560, PORT 무시).
  3. AuthGate: /login /signup 은 LandingPage 덮어쓰지 않게.
- 스모크 게이트 존재 (deploy 후 /login 200 + /api/me 401 + supabase URL 확인).
- **전체 상세 (배포, 시크릿, 버그, 스모크, 교훈)**: `wiki/learnings/2026-06-19-openclaw-osmu-handoff.md` **0차 작업 전 반드시 전체 읽기**.
- CF for SaaS (Custom Hostnames)는 고객 커스텀 도메인용 (0차 안정 후).

**Wiki 전략 업데이트**:
- 이 `wiki/` = 상품 자체의 지식 베이스 (제품 위키).
- 사용자가 가진 **다른 레포 위키를 포인팅해서 컨텍스트 끌어오는 기능**을 미리 구현해야 함 (CEO 지적).

**상품 이름 — 확정: OSMU(오스무)** (2026-07-10, [ADR-005](../decisions/005-brand-naming.md)):
- 구 가칭 **SoloClaw는 기각** — soloclaw.dev가 동일 OpenClaw 생태계의 라이브 상용 서비스로 선점 확인(2026-07-10 실조사). ClawFactory/SoloForge/ShortsClaw도 도메인 선점 + Claw 종속 문제로 기각.
- 표기·도메인 후보·근거·veto 절차의 정본 = [marketing/naming.md](../marketing/naming.md). 다른 문서에 낡은 표기(SoloClaw)가 남아 있으면 naming.md가 이긴다.
- 숏폼 생산 공장(Shorts Factory) aspect는 부제·기능 강조로: "OSMU — 글 하나 넣으면 전 채널로" 류. 카피 정본은 [marketing/landing-copy.md](../marketing/landing-copy.md).

**최우선 해결 과제 (0차 + handoff 교훈)**:
- **에러 설명력**: 사용자가 "왜 이런 에러가 났는지" 설명할 수 있게 (상세 로그 + 친화적 메시지). 재현성 확보.
- **배포/빌드 규칙·스모크 게이트 절대 준수** — 규칙 3종(NEXT_PUBLIC_* build-arg / DASHBOARD_PORT / AuthGate)과 스모크는 위 "Onboarding 현실 + 현재 운영 제약" 절이 정본. 여기 중복 기술하지 않는다.
- 안정성 (인프라 다운 방지, 크론/발행 재현성).
- 가치 체감: 시간/비용 절감 + 숏폼 부수입 가능.

(기존 고액 SaaS/리텐션 목표는 장기 그림으로 미뤄둠. 지금은 0차/1차에 집중)
(위 내용은 0차/1차 달성 후 참고할 장기 모델. 현재는 신뢰성·온보딩·1명 사용자 존재에 집중. Pricing은 "존재만 해도 OK" 단계.)

## Competitive Benchmarking (2026 Landscape)

> **⚠️ 2026-07-07 갱신 주의**: 아래 절의 경쟁 데이터는 2026-06 기준으로 낡음. 정본 = [marketing/competitors.md](../marketing/competitors.md)(2026-07 표) + [marketing/positioning.md](../marketing/positioning.md). 특히 **"agentic runtime" 차별화 주장은 폐기됨** (Opus가 2025-08 Agent Opus로 확장, Postiz도 같은 언어 사용) — 살아남는 차별화 = 위키/사실 그라운딩 + 발행 후 학습 루프 + 셀프호스트.

**Shorts/Video Repurposing Leaders** (key benchmark for our Shorts Factory):
- **Opus Clip** (dominant, ~$215M val est., ARR est. $8-20M): Long → 10+ shorts (AI clip, virality, captions, B-roll). Pricing 2026: Free 60min (watermark), Starter $15 (150min), Pro $29 (300/mo or 3600/yr ~$0.10/min). 20-40% discard common; billing friction (cancel/charge complaints); video-primary. Strengths: Speed on clean content. Weak: No deep brand facts, high discard, unpredictable cost.
- **Munch**: Higher priced (~$49 Creator 200min → $116+); similar clip focus.
- **Pictory**: Script/blog → video (~$25 Starter, $35-119 Teams); strong stock/ElevenLabs/avatars.
- **Descript**: Transcription-first + edit/clone; more manual control.
- Gaps across: Limited facts grounding (hallucination risk), weak native multi-channel (text+video+blog), credit churn at low ACV.

**Full AI Social Automation**:
- Enrich Labs, Gumloop: End-to-end agents (research + draft + schedule + publish). Credit or subscription.
- Traditional + AI: Buffer, Later with AI copy.

**Our Differentiation (Benchmark-backed 2026)**:
- Agentic runtime (OpenClaw LLM decides dynamically vs rigid n8n/Make).
- Dual Wiki (tenant facts grounding beats Opus/Jasper hallucination/discard; project Obsidian-style brain for velocity — files win for AI agents per trends).
- Multi-channel native (text + shorts/video + blog) + full feedback loop.
- gstack velocity (role reviews + benchmark-first) for out-iteration.
- Hybrid pricing aligned to retention data (mid-tier base + usage vs Opus credit churn).
- Forkable/open core.

**Internal Knowledge Base Benchmarks** (for our Project Wiki):
- Early startups often start minimal (Notion single workspace: Getting Started + top 5 FAQs + processes).
- Popular stacks: Notion (flexible for small teams), Confluence (structured + Jira for eng teams), Obsidian (local files + AI/LLM plugins winning for personal + team "second brain").
- Best practices: Department + process folders, templates, ownership, searchability. Self-hosted options (Outline, Wiki.js) for control.
- Trend: LLM-augmented wikis (Obsidian vaults popular because files are local, wikilinks work great with RAG).
- Our choice (Markdown + Git + clear hierarchy in wiki/): Git-versioned, forkable, perfect for gstack/LLM agents (read specific folders), no lock-in. Aligns with Obsidian + GitBook best practices while being lightweight.

This benchmarking informs our wiki structure (concern-based, index-heavy, gstack-optimized) and product roadmap (beat Opus on multi-channel + facts, match automation depth with agent judgment). 

See reference/benchmarking.md for deeper 2026 tables (Opus exact pricing, NRR by ACV tier from ChartMogul/Optifai, CAGRs, Obsidian vs Notion for AI "Company Brain", X/review sentiment, actionable moat/pricing implications). Re-benchmark before major decisions.

## Major Product Areas

### 1. Content Engine (Generation + Guidance)
- Prompt guides + channel overrides (common + per-platform).
- AI suggestions for guides/keywords.
- Wiki injection (tenant + project) for factual grounding.
- longform-to-shorts + sourcing API (now supports wiki_path).

### 2. Shorts/Video Factory (Differentiation)
- Longform (including wiki pages) → hook/body candidates.
- Slide-based video (ffmpeg + ElevenLabs) or advanced (Higgsfield path).
- Multi-platform variants (shorts text + video).
- Review queue + one-click publish to TikTok/YouTube/IG Reels + text cross-post.
- See [shorts-factory.md](./shorts-factory.md) and the new wiki_path integration in sourcing.

### 3. Multi-Channel Orchestration
- Queue v2 (per-channel status).
- Cron: generate (Sonnet), publish (Haiku), insights, growth, search.
- 14+ publish extensions + video/blog.
- Rate limiting, cleanup, bulk approve.

### 4. Insights & Learning Loop
- Reaction collection + viral detection.
- External trend scraping (threads-search + future gstack-powered).
- Style RAG (style-data.json) + tenant wiki.
- Growth tracking.

### 5. Dashboard & Studio (UX for Operators)
- Marketing Home: grid, performance, cron health, alerts, timeline.
- Channel pages: Queue / Analytics / Growth / Popular / Settings.
- Studio: idea → multi-variant (incl. shorts) + image/video generation + wiki grounding.
- Brand setup: guide + GitHub wiki/repo sync.
- Images, Blog queue, Settings (LLM, automation toggles, credentials).

**화면 범위 확정 — Awareness 집중 반영 (회장 R-14, 2026-08-12)**
- **유지(기본 제품 화면)**: 성과(노출·반응 = 조회·저장·좋아요·댓글·팔로우·프로필 방문) · Studio(생성/수정) · 채널(Queue/Growth/Popular/Settings) · 발행 · 블로그 · 키워드 · 트렌드. 성과 화면의 지표 정의는 "노출·반응"으로 고정하고, 유입/전환 위젯을 섞지 않는다.
- **제거·후순위(웹 고객 옵션)**: GA4 대시보드 · 검색 콘솔 · 검색 어드바이저 · 유입-전환 퍼널 리포트 · Clarity 류. 기본 UI에서 노출하지 않고, 웹사이트를 가진 고객에게만 옵션으로 활성화(기본 제품 범위 밖).
- 근거: 웹 없는 자영업자 타겟 포함. 유입 측정 화면은 이들에게 빈 데이터·혼란만 준다.

### 6. Multi-Tenancy & SaaS Infrastructure
- Workspaces/tenants with RLS.
- Per-tenant data isolation (wiki_docs, drafts, signals).
- Usage recording, onboarding wizard, credential verification.
- Future: payments, reports, A/B, team collab.

## Success Criteria for Early Stage
- Users spend <30 min/week on content ops but see consistent output + measurable growth.
- Wiki adoption: teams connect their knowledge repo and see "no hallucination" improvement.
- Shorts factory produces publish-ready assets that get approved in <5 min.
- Platform supports 1000+ tenants without ops burden (thanks to gstack procedures and clean architecture).

We are building the operating system for startup content teams. The wiki/ you are reading is both the product documentation and the internal knowledge system that makes rapid, high-quality iteration possible.

**Next milestones** (gstack-driven, informed by 2026 benchmark + ADR-003):
- Formalize hybrid pricing + usage tracking (see decisions/003 and data-model updates).
- Deeper wiki-as-source (tenant facts + project wiki) in generation and shorts factory to beat competitor discard rates.
- Shorts Factory quality loop + fact-grounding to differentiate from 20-40% discard tools (Opus benchmark).
- gstack-powered external trend miner for shorts hooks.
- Onboarding + payment/usage flows for v4.0 (base sub + usage add-ons).
- Re-benchmark quarterly (reference/benchmarking.md).

See product/ and architecture/ for details. All major work follows the gstack procedures in guides/.