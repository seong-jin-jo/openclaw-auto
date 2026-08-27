# Shorts Factory (숏폼 공장)

## 여덟 컨셉 실행 구조 (2026-08-28)

- 시작: `POST /api/studio/v1/shorts-factory/runs`. 한 작업 공간과 컨셉 8개, 동시 실행 한도
  1부터 8을 받는다. 각 컨셉 설정은 기존 Studio 학습 정보와 플랫폼 규격을 그대로 쓴다.
- 상태: `GET /api/studio/v1/shorts-factory/runs/{runId}`와 작업 공간별 실행 목록에서 컨셉마다
  대기, 후보 생성 중, 완료, 실패와 Studio 생성 작업 번호 또는 오류를 본다.
- 격리: `shorts_factory_runs`, `shorts_factory_concept_runs`는 모두 `tenant_id`와 RLS를 쓴다.
  한 작업 공간에는 활성 공장 하나만 허용한다.
- 실패: 한 컨셉의 입력 또는 실행이 실패해도 나머지 컨셉은 계속 돈다. 일부만 실패하면 실행은
  `partial`, 전부 성공하면 `succeeded`다.
- 현재 범위: 기존 Studio 후보 생성 8개를 묶는 운영 장부와 조정 계층까지 구현됐다. 실제 영상
  렌더 8개와 외부 채널 발행 8개의 병렬 실행은 아직 검증되지 않았다.
- 근거: `dashboard/src/lib/studio/shorts-factory/`,
  `dashboard/db/migrations/20260828_shorts_factory_runs.sql`,
  `dashboard/scripts/verify-shorts-factory-e2e.mjs`.

## 코드 기준 갱신 (2026-08-25)

- 영상 API는 `dashboard/src/app/api/video/` 아래 업로드·목록·삭제·생성·발행 계열 route로 구현되어 있다.
- 고급 생성 경로는 Higgsfield API와 분리되어 있다.
- Studio 화면은 `dashboard/src/app/studio/page.tsx`와 `dashboard/src/components/studio/` 구성요소를 사용한다.
- 서비스 경계는 [two-service-boundary.md](../architecture/two-service-boundary.md)를 따른다. 아래 6월 Current State와 gstack 문구는 이력이며 현행 구현 총계·절차가 아니다.

Goal: Turn longform knowledge (wiki pages, blogs, transcripts) + trends into high-volume vertical video (Shorts / Reels / TikTok) with review + multi-publish loop. This is a key monetization / SaaS feature.

## Current State (as of plan execution)

- **longform-to-shorts** extension: Chunks text/URL, uses claude -p per chunk → hook + body + caption + hashtags + source_quote. Saves candidates.
- **video-generate**: slides[] (text, duration, optional imageUrl) → ffmpeg 1080x1920 + optional ElevenLabs narration + BGM. Called from dashboard API. If narration was requested but omitted, the API returns a structured reason and the Videos UI warns explicitly; an unconfigured ElevenLabs key is shown as `내레이션 없이 생성됨 (ElevenLabs 키 미설정)`.
- **Studio**: Supports "shorts" variant output + withVideo toggle (Higgsfield / minimax paths mentioned).
- Publish: YouTube video upload works in dashboard; TikTok extension is limited (audit required).
- Sources: manual idea, blog queue, **or now project wiki/ via /api/sourcing with wiki_path** (e.g. "product/shorts-factory.md").

**New integration (gstack procedure step)**: Project wiki pages can now be used directly as longform source for shorts candidates. This wires our dev knowledge base into the shorts factory for e.g. project update posts, announcement variants, or testing. (Separate from tenant Brand Wiki facts injection).

**0차 Video Repurposing 추가 (2026-06)**: 기존 긴 영상(로컬 파일, YouTube URL)을 외부 전문 클리핑 API (Reap, Ssemble 등)로 잘라 Shorts 후보를 받음. OSMU에서 위키 컨텍스트 + 브랜드 톤으로 살짝 다듬고, 텍스트 변형과 함께 멀티채널 발행. (Hybrid 모델: 클리핑 품질은 외부, refinement + unified publish + brand grounding은 OSMU가 담당. text longform 경로는 그대로 유지)

## Target Flow (wiki + gstack driven) + Differentiation vs Opus

**두 가지 Source 유형 지원 (0차):**
- **Text Longform Sources**: wiki, blog, transcript, topic → longform-to-shorts (텍스트 청킹) → script → video.
- **Video Sources (Repurposing)**: 기존 긴 영상 (로컬 파일 / YouTube URL) → 외부 클리핑 API (Reap/Ssemble) → 후보 클립 수신 → OSMU에서 위키/브랜드 톤 다듬기 (caption/hook refinement) → publish.

1. Source: project wiki/ (via wiki_path), tenant Brand Wiki page, longform URL, blog, **또는 기존 long video (file/YouTube URL)**.
2. (Text) Explode with longform_to_shorts — **enriched by dual-wiki facts**. (Video) 외부 클리퍼 호출로 후보 클립 확보.
3. Select / edit in studio → (Text) generate image prompt or card. (Video) 클립 다듬기 + 위키로 brand tone/hook 보강.
4. Render / finalize video (ffmpeg base, advanced, or external clip).
5. Review (drafts or new shorts queue) — **quality scoring** that incorporates source fidelity + virality signals + brand consistency.
6. Publish to video channels + cross-post text (optimized per platform).
7. Collect performance → insights loop → update style RAG + prompts + tenant wiki.

**Key Differentiation vs Opus (20-40% discard problem)**:
- **Facts Grounding + Brand Tone**: Tenant Brand Wiki + project context injected (text path) 또는 클립 수신 후 OSMU refinement (video path) → higher factual accuracy and brand consistency. Opus has no equivalent (clips often feel generic or wrong on context).
- **Agentic + Multi-channel**: Full loop (text longform or video source → shorts video + text variants) decided dynamically. Not pure video-clip-only.
- **Learning Flywheel**: Performance data (viral_signals) feeds back into better hooks, style, and future generations per brand.
- **Hybrid Quality Controls**: Planned review step + source quote preservation + post-publish reaction collection. External clipping quality + OSMU wiki/brand refinement으로 20-40% discard 극복 목표.
- **Wiki as Source + Refinement**: Text는 직접 wiki longform, Video는 클립 후 wiki로 다듬기. 내부 지식 + 브랜드 톤을 일관되게 적용.

See reference/benchmarking.md for Opus gaps and ADR-003 for moat connection.

## Next Steps (Stage Controller 단계 게이트 적용)

See root plan and decisions/001 for how this was planned.

향상 기능은 현재 단계 승인 뒤 구현한다. gstack은 승인된 단계 안에서 선택적으로 사용한다.

## Related

- extensions/longform-to-shorts/
- extensions/video-generate/
- dashboard/src/app/studio/
- wiki/architecture/overview.md
- Existing tenant wiki for factual grounding.
