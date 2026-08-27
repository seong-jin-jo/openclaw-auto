# Extension System

OpenClaw's power comes from runtime-registered tools. Every capability (publish, generate, search, video, etc.) is an extension.

## Structure of an Extension
```
extensions/my-feature/
├── package.json
├── openclaw.plugin.json
├── index.ts
└── src/my-feature-tool.ts
```

## Registration
- Copied into openclaw/extensions/ at build time (see docker and install steps).
- `OPENCLAW_EXTENSIONS` env controls which are loaded.
- Tools become available to the agent via the registry.

## 현행 Extension 인벤토리 (2026-08-25)

`extensions/`에는 실제 디렉터리 30개가 있다. 발행 15개(bluesky, discord, facebook, instagram, line, linkedin, naver-blog, pinterest, slack, telegram, threads, tiktok, tumblr, x, youtube), 생성·변환 6개(card-generator, generate-drafts, longform-to-shorts, midjourney-image, sample-blog, video-generate), Threads 운영 5개(threads-growth, threads-insights, threads-queue, threads-search, threads-style), 기타 4개(blog-queue, image-upload, seo-keywords, sync-insights)다. 디렉터리 존재와 런타임 로드는 다르므로 실제 활성화는 `OPENCLAW_EXTENSIONS` 설치 설정을 함께 확인한다.

## 기존 요약 (불완전한 대표 목록)
- publish (threads, x, instagram, youtube, tiktok, blog, etc.)
- generate-drafts
- longform-to-shorts
- video-generate
- threads-queue, threads-insights, threads-search, threads-style, threads-growth
- card-generator, midjourney-image, image-upload
- sourcing-related logic in dashboard

## Recent Change: wiki Integration
The sourcing API (and by extension longform-to-shorts flow) now accepts `wiki_path` to pull content directly from the project `wiki/` folder. This is the first bridge between the internal Project Wiki and the content generation engine.

See:
- dashboard/src/app/api/sourcing/route.ts (wiki_path handling)
- wiki/product/shorts-factory.md
- extensions/longform-to-shorts/

## Development Rule
New extensions or major changes to existing ones must:
- Stage Controller의 현재 단계와 승인 상태를 확인한다.
- Have corresponding docs in wiki/architecture/extensions.md and wiki/product/ or guides/.
- UI 또는 외부 API가 포함되면 해당 단계의 QA 증거를 남긴다.

This plugin model is what allows the platform to remain service-neutral while supporting 20+ channels and growing video capabilities.
