# Shorts Factory (숏폼 공장)

Goal: Turn longform knowledge (wiki pages, blogs, transcripts) + trends into high-volume vertical video (Shorts / Reels / TikTok) with review + multi-publish loop. This is a key monetization / SaaS feature.

## Current State (as of plan execution)

- **longform-to-shorts** extension: Chunks text/URL, uses claude -p per chunk → hook + body + caption + hashtags + source_quote. Saves candidates.
- **video-generate**: slides[] (text, duration, optional imageUrl) → ffmpeg 1080x1920 + optional ElevenLabs narration + BGM. Called from dashboard API.
- **Studio**: Supports "shorts" variant output + withVideo toggle (Higgsfield / minimax paths mentioned).
- Publish: YouTube video upload works in dashboard; TikTok extension is limited (audit required).
- Sources today: manual idea or blog queue. Wiki (brand) can be used for facts.

## Target Flow (wiki + gstack driven)

1. Source: wiki/product/ page or longform URL or blog.
2. Explode with longform_to_shorts (enriched by wiki context).
3. Select / edit in studio → generate image prompt or card.
4. Render video (ffmpeg base or advanced).
5. Review (drafts or new shorts queue).
6. Publish to video channels + cross-post text.
7. Collect performance (gstack browse for public metrics where API weak) → learnings.

## Next Steps (follow gstack procedure)

See root plan and decisions/001 for how this was planned.

Use gstack /autoplan when ready to implement enhancements.

## Related

- extensions/longform-to-shorts/
- extensions/video-generate/
- dashboard/src/app/studio/
- wiki/architecture/overview.md
- Existing tenant wiki for factual grounding.