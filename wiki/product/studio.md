# Studio: Assisted Content Creation

Studio is the "power user" surface for one-off or assisted generation, complementing the fully automated cron/queue flow. It is the primary place where operators interact with the AI engine + wiki grounding + multi-platform output + video rendering.

## Generation API v1, 2026-08-27

- `POST /api/studio/v1/generations`: 학습 정보 7층과 요청 시점 platform spec을 검사하고 A/B/C 후보 3장을 만든다.
- `GET /api/studio/v1/generations/[jobId]`: 본인이 속한 workspace의 생성 결과만 조회한다.
- `POST /api/studio/v1/regenerations/[jobId]`: 회원 전체 기준 하루 1회 무료 재생성을 소비하고, 추가 요청은 과금 승인 계약으로 거절한다.
- 반환되는 후보는 구조화된 스토리보드이다. 실제 이미지·영상 provider 생성 결과가 아니다.
- 현재 identity와 job ledger는 명시적 development mode와 단일 process 메모리 runtime으로만 열린다. production에서는 fail closed한다. R104, R105를 위한 신규 DB table과 object storage signing adapter는 기술설계 합의 전까지 미구현이다.

## Purpose in the SaaS
- Quick idea → publishable assets (text variants + visuals + shorts video).
- Experiment with tones, wiki facts, or new hooks.
- Onboarding hook: first value in < 2 minutes.
- For 1000+ subscriber startups: power users (founders, marketers) use Studio for high-leverage posts while cron handles volume.

## Core Flow
1. Enter idea or load from blog/wiki. **또는 기존 Long Video (로컬 파일 / YouTube URL) 입력 (0차 Video Repurposing)**.
2. Select brand guide (or let wiki provide facts).
3. Generate:
   - Independent text variants for Threads / Facebook / X / IG / Shorts hook-body-cta.
   - Image prompt.
   - (Optional) Video via Higgsfield/Midjourney or ffmpeg path **또는 외부 클리핑 API로 기존 영상에서 후보 Shorts 추출 후 OSMU refinement**.
4. Edit, preview per platform (wiki/brand tone 반영).
5. Save as draft or directly select/publish to the four current Studio targets (Threads / X / Facebook / Instagram).
6. (New) wiki_path support via sourcing for pulling project knowledge directly.
7. (0차 추가) Long video repurpose: 클립 후보 수신 → 위키 컨텍스트로 다듬기 → queue로.

## Generation and publish boundaries

- Higgsfield image/video generation, credit balance, and transaction history are operator-only.
  Studio first confirms `/api/me`; customer sessions receive no `/api/higgsfield/*` SWR key or
  generation request and see a Korean operator-only notice. The proxy allowlist remains closed
  because the credit pool and generation log are not tenant-isolated.
- Studio has **seven visual previews** (Threads, X, Facebook, Instagram, Shorts, Reels, TikTok), but direct
  select/publish supports **four** targets only: Threads, X, Facebook, Instagram. Shorts, Reels, and TikTok
  remain generation/preview outputs, default OFF, and show
  `발행 미지원(생성 전용)` instead of a publish selector.
- Publish progress counts only confirmed `ok:true` results. A failed target carries a danger-token
  badge and its server reason. Mixed or all-failed runs persist as `partial`, never `published`;
  only an all-success run displays `발행 완료` and stores `published`.
- The existing external-publish/internal-record failure path remains a reconciliation state:
  it stores `partial`, preserves the permalink/recovery metadata, and blocks automatic republish.
- Channel body limits are defined only in `dashboard/src/lib/channel-text-limits.ts`, with an
  official reference URL beside every value. Preview cards show the current count against each
  platform's own limit; limits intentionally differ by provider.
- Threads and Facebook reject over-limit content before any provider API call. They do not silently
  truncate user-edited copy, because losing the ending/CTA without consent is more damaging than an
  actionable preflight error. X and existing credential channels retain their documented truncation
  behavior.
- Higgsfield video responses expose whether requested narration was included. A silent result shows
  a warning in Studio with the machine reason translated for the user (for example, server TTS
  runner unavailable) instead of appearing to be a fully narrated success.

**Wiki Integration** (recent):
- Tenant Brand Wiki injected for "facts only, no invention".
- Project wiki (this one) now loadable via `wiki_path` in sourcing API for internal/project-related content.
- "Common from copy" + per-channel overrides.

## UI Components
- Idea input + guide selector.
- Platform preview cards (grouped: Text, Video 9:16, Card News).
- Generation buttons (text / image / video).
- Draft history (per workspace).
- Brand setup wizard (guide + repo/wiki sync).
- Schedule panel 구현됨: `dashboard/src/components/studio/SchedulePanel.tsx`, `dashboard/src/app/api/schedule/`.

See studio-mock*.html in public/ for visual references.

## Technical Implementation
- Frontend: `dashboard/src/app/studio/page.tsx` + components (PlatformPreview, RepoConnect, BrandSetupWizard).
- Backend:
  - `POST /api/studio/text` — idea + guide + tenant wiki context → multi-variant JSON.
  - `POST /api/studio/drafts` — save/restore work.
  - `POST /api/sourcing` — longform → shorts candidates (now accepts `wiki_path`).
  - Video: `/api/video/generate`, `/api/video/publish`.
- Studio 변경은 Stage Controller 현재 단계와 승인 산출물을 먼저 확인한다.

## Initial render and accessibility, 2026-08-28

- `room` 쿼리는 첫 렌더와 같은 `/studio` 안 이동의 진실원이다. 저장된 이전 방을 먼저 그렸다가
  바꾸지 않는다.
- 플랫폼 계정과 첫 댓글 기능은 발행실 전용이다. 생성실·편집실에서는 관련 요청을 시작하지 않는다.
- 라이트·다크 텍스트 토큰은 WCAG AA를 만족하고, 모든 링크·단추·입력에는 공통 `focus-visible`
  링이 나타나야 한다.
- 성능 회귀는 `dashboard/scripts/measure-room-experience.mjs`, 키보드·대비 회귀는
  `dashboard/scripts/verify-room-accessibility.mjs`로 실제 앱에서 확인한다.

## For Scaling to 1000+ Users
- Workspace isolation.
- Usage metering on generations/publishes.
- Template library from successful wiki + guide combos.
- Export to queue for cron handoff.

Current local implementation turns an idea into visual variants and can directly select four publish targets;
it must not be described as “5 channels + video.” See [Marketing Hub surface map](./marketing-hub-surface-map.md)
for the distinct visual, direct-publish, text-adapter, and video inventories plus verification limits.
