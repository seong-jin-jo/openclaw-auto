# System Architecture

**이 문서는 wiki/ 의 공식 아키텍처 레퍼런스입니다.** 
root CLAUDE.md 는 이제 고수준 포인터 역할만 합니다 (상세는 wiki/ 참조).

gstack 사용 시 항상 "Load gstack. Read wiki/architecture/system-architecture.md + wiki/index.md 먼저" 하세요.

## High Level

```
Cron Jobs (jobs.json)
    ↓
OpenClaw Gateway + Claude Agent
    ↓ (Tool Registry)
Extensions (publish, generate, insights, video, longform-to-shorts, search...)
    ↓
Dashboard APIs (Next.js) + Data (queue.json, wiki_docs per tenant, etc.)
    ↓
External: Threads/X/IG/YouTube/TikTok APIs + R2 + ElevenLabs + Midjourney
```

## Core Components

**1. Content Generation**
- prompt-guide.txt + channel-specific overrides
- search-keywords
- longform-to-shorts: chunk → claude -p → candidates (hook/body)
- studio/text: idea → multi-platform variants + shorts + image_prompt (wiki context injected)

**2. Publishing**
- multi-channel-publish cron
- schedule-publish-due dashboard cron endpoint for Studio reservations
- Per-channel extensions (threads-publish, x-publish, instagram-publish, tiktok-publish, youtube-publish...)
- Queue schema v2 with per-channel status

**3. Insights & Learning**
- threads-insights, sync-insights
- threads-search (playwright scrape for external trends)
- growth tracking
- viral_signals table

**4. Video / Shorts Factory**
- slides model: text + duration + imageUrl
- Higgsfield path for advanced video
- Instagram Reels publish path (SNS-015, **operating observed 2026-07-21** — commit `1a6e7e5a` 운영 배포 후
  실제 Reel permalink `https://www.instagram.com/reel/DbBPRa7iFff/` 회수, 동일 요청 재시도
  `alreadyPublished:true` 동일 permalink, DB rows 1/published 1/distinct external 1/permalink 1/failed 0):
  `POST /api/video/upload` → tenant-scoped `data/videos` → 15분 만료 HMAC 서명 URL
  `GET|HEAD /api/media/<token>`(Range 지원, 프록시 인증 우회 후 핸들러 자체 서명 검증) →
  Meta `media_type=REELS` 컨테이너 생성(`video_url`은 `OSMU_PUBLIC_URL` 정본 origin만 사용) →
  `status_code` 폴링 최대 5분(1분 간격, `ERROR`/`EXPIRED`/timeout fail-closed) →
  `media_publish` → permalink 재조회 후 DB/queue 기록.
- 토큰은 **암호화가 아니라 서명**이다. payload는 base64url 평문 JSON(tenantId·파일명·만료)이라
  토큰 보유자는 내용을 읽을 수 있다. 보장은 변조 불가 + 만료 두 가지뿐이다.
- 테넌트(고객 OAuth/JWT)에게 열린 영상 라우트는 list / upload / delete / publish 4개다.
- `/api/video/generate`는 **운영자 전용**이다. 요청 본문의 `imageUrl`/`bgmUrl`을 서버가 그대로
  fetch(SSRF)하고 슬라이드 수만큼 동기 ffmpeg를 돌려(자원 고갈) tenant-aware allowlist에서 의도적으로 제외했다.
- 업로드/발행 공통 애플리케이션 상한은 100 MiB(`lib/video-limits.ts`). 프록시/플랫폼 본문 상한 뒤의 2차 방어선이다.
- 중복 발행은 DB에서 막는다. `published_posts`에 `status='in_progress'` 예약 INSERT를 하고
  `draft_id` 기준 partial unique index가 `published`/`in_progress`를 유일하게 강제한다.
  경쟁에서 진 요청은 성공을 흉내내지 않고 409 `publish_in_progress`로 fail-closed 응답한다.

**5. Wiki (two kinds)**
- Product: tenant wiki_docs (GitHub sync, trgm search, prompt injection for facts)
- This Project Wiki: `wiki/` (internal dev knowledge, decisions, procedures)

**6. Dashboard (Next.js)**
- Studio (assisted gen + video)
- Channel pages (Queue/Analytics etc.)
- Brand setup (guide + wiki/repo sync)
- Tenants/workspaces

**0차 아키텍처 포커스 (2026-06-19)**
- 단일 앱 + 테넌트 완전 격리 (UI + DB, RLS + withTenant).
- Cloudflare Custom Hostnames 지원 (고객 도메인 직접 사용).
- Multi-repo wiki context pulling (다른 레포 위키를 product context로).
- Reliability: 에러를 사용자가 설명/재현 가능하게.
- Shorts Factory + automation loop을 operator(0차)의 다중 서비스에서 안정 동작.

## Data Flow for Shorts Factory (target)

Longform (wiki page / blog) → longform_to_shorts → candidates
→ Studio review + visuals
→ video_generate (ffmpeg base)
→ Drafts → Approve → Publish (YouTube/TikTok + cross post)
→ Performance (gstack browse or API) → learnings → next prompt

## gstack Integration (now in this repo)

- Team mode activated (./setup --team)
- .claude/ hooks and settings for enforcement
- Follow procedures in wiki/guides/gstack-procedures.md
- Use for all product work: office-hours → plan reviews → autoplan → implement → review/qa/ship

See root CLAUDE.md for environment and cron details.

This architecture is service-neutral — custom per fork in data/ and config/.
