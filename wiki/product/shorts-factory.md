# Shorts Factory (숏폼 공장)

Goal: Turn longform knowledge (wiki pages, blogs, transcripts) + trends into high-volume vertical video (Shorts / Reels / TikTok) with review + multi-publish loop. This is a key monetization / SaaS feature.

## Current State (as of plan execution)

- **longform-to-shorts** extension: Chunks text/URL, uses claude -p per chunk → hook + body + caption + hashtags + source_quote. Saves candidates.
- **video-generate**: slides[] (text, duration, optional imageUrl) → ffmpeg 1080x1920 + optional ElevenLabs narration + BGM. Called from dashboard API.
- **Studio**: Supports "shorts" variant output + withVideo toggle (Higgsfield / minimax paths mentioned).
- Publish: YouTube video upload works in dashboard; TikTok extension is limited (audit required).
- Sources: manual idea, blog queue, **or now project wiki/ via /api/sourcing with wiki_path** (e.g. "product/shorts-factory.md").

**New integration (gstack procedure step)**: Project wiki pages can now be used directly as longform source for shorts candidates. This wires our dev knowledge base into the shorts factory for e.g. project update posts, announcement variants, or testing. (Separate from tenant Brand Wiki facts injection.)

## Target Flow (wiki + gstack driven) + Differentiation vs Opus

1. Source: project wiki/ (via wiki_path), tenant Brand Wiki page, longform URL, or blog.
2. Explode with longform_to_shorts — **enriched by dual-wiki facts** (brand voice + real facts injected to reduce hallucination).
3. Select / edit in studio → generate image prompt or card (fact-checked).
4. Render video (ffmpeg base or advanced).
5. Review (drafts or new shorts queue) — **quality scoring** that incorporates source fidelity + virality signals.
6. Publish to video channels + cross-post text (optimized per platform).
7. Collect performance → insights loop → update style RAG + prompts + tenant wiki.

**Key Differentiation vs Opus (20-40% discard problem)**:
- **Facts Grounding**: Tenant Brand Wiki + project context injected → higher factual accuracy and brand consistency. Opus has no equivalent (clips often feel generic or wrong on context).
- **Agentic + Multi-channel**: Full loop (longform → shorts video + text variants) decided dynamically. Not video-clip-only.
- **Learning Flywheel**: Performance data (viral_signals) feeds back into better hooks, style, and future generations per brand.
- **Quality Controls**: Planned review step + source quote preservation + post-publish reaction collection. Goal: meaningfully beat the 20-40% discard rate.
- **Wiki as Source**: Direct use of internal knowledge (product/shorts-factory.md example) for authentic content.

See reference/benchmarking.md for Opus gaps and ADR-003 for moat connection.

## Next Steps (follow gstack procedure)

See root plan and decisions/001 for how this was planned.

Use gstack /autoplan when ready to implement enhancements.

## Related

- extensions/longform-to-shorts/
- extensions/video-generate/
- dashboard/src/app/studio/
- wiki/architecture/overview.md
- Existing tenant wiki for factual grounding.