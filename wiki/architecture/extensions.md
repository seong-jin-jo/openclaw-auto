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

## Key Existing Extensions (as of now)
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
- Be planned via gstack procedures.
- Have corresponding docs in wiki/architecture/extensions.md and wiki/product/ or guides/.
- Include verification with /qa where UI or external APIs are involved.

This plugin model is what allows the platform to remain service-neutral while supporting 20+ channels and growing video capabilities.