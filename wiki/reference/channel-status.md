# Channel Status & Implementation

**Live (production, verified)**: Threads, X, Instagram (core social + video publish + insights).

**Ready / Partial**: YouTube (upload works), TikTok (API limited), Blog queue, Naver, etc.

**Coming Soon / Extensions exist**: Facebook, LinkedIn, Bluesky, Pinterest, Telegram, Discord, Slack, LINE, etc.

Full list and UI rules in docs/feature-spec.md and wiki/product/.

For each channel the pattern is:
1. Extension (publish tool)
2. Credential verification
3. Guide + keywords support
4. Queue channel status
5. (Video channels) media handling

See extensions/ directory and dashboard/src/lib/constants.ts for IMPLEMENTED_PLUGINS.

When adding channels, follow guides/gstack-procedures.md and update this reference + product/ docs.