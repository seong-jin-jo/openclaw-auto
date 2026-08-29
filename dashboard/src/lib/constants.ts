/** Channel display names */
export const CH_LABELS: Record<string, string> = {
  threads: "Threads",
  x: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  bluesky: "Bluesky",
  pinterest: "Pinterest",
  tumblr: "Tumblr",
  tiktok: "TikTok",
  youtube: "YouTube",
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
  line: "LINE",
  kakao: "Kakao",
  whatsapp: "WhatsApp",
  naver_blog: "Naver Blog",
  midjourney: "Midjourney",
  medium: "Medium",
  substack: "Substack",
  google_analytics: "Google Analytics",
  search_console: "Search Console",
  google_business: "Google Business",
  seo_keywords: "SEO Keywords",
  custom_api: "Custom API",
  rss: "RSS Feed",
};

/**
 * 예약 발행이 실제로 지원하는 플랫폼 SSOT.
 * SchedulePanel(UI 체크박스)과 publish-due 백엔드(SUPPORTED_PLATFORMS)가 같은 목록을 공유한다.
 * "노출=발행가능" 원칙 — 여기 없는 플랫폼은 예약 UI에 노출하지 않는다.
 * 영상(shorts/reels/tiktok)은 텍스트 예약 루프가 아직 못 다루므로 제외(드리프트 방지).
 * bluesky/telegram/discord/slack(2026-07, credential·webhook 방식) 추가 — OAuth 앱 등록형 4채널(threads/x/facebook/instagram)과
 * 달리 자격증명 직접 입력(app password/bot token/webhook URL)만으로 발행 가능.
 *
 * /api/publish가 실제로 분기 처리하는 플랫폼과 정확히 1:1 — 이 목록에 없는 채널은
 * POST /api/publish에서 `{platform} 미지원`으로 거부된다(src/app/api/publish/route.ts).
 */
export const SCHEDULABLE_PLATFORMS = [
  "threads", "x", "facebook", "instagram",
  "bluesky", "telegram", "discord", "slack",
] as const;
export type SchedulablePlatform = (typeof SCHEDULABLE_PLATFORMS)[number];

// 텍스트 예약 루프와 별도인 /api/video/publish 직접 발행 provider.
// SocialConnectButton의 "직접 발행 미지원" 표기가 실제 영상 API와 드리프트하지 않게 공유한다.
export { PUBLISH_CHANNEL_GROUPS, VIDEO_PUBLISH_PLATFORMS } from "@/lib/channel-capabilities";

/** 발행 채널 그룹 — 사이드바와 Settings>Channels와 ChannelConnect 모달의 단일 소스(SSOT).
 * "사이드바=연결가능=실제 발행가능" 원칙: 여기 있는 채널만 노출한다.
 * SCHEDULABLE_PLATFORMS(=/api/publish가 실제 지원하는 8채널)를 그대로 그룹화한 것 —
 * OAuth 앱 등록만 돼 있고 실제 POST /api/publish 분기가 없는 나머지 7채널
 * (linkedin/pinterest/tumblr/tiktok/youtube/naver_blog/line)은 "발행가능"으로 오인되지 않도록
 * 여기서 제외한다(2026-07-16 P0 QA 정정 — 라벨/extension 설정은 constants 하단에 보존, 노출만 제거).
 * video/blog 그룹은 실제 항목이 없어 삭제. */
export const SCHEDULABLE_PLATFORM_LABELS: Record<SchedulablePlatform, string> = {
  threads: "Threads",
  x: "X",
  facebook: "Facebook",
  instagram: "Instagram",
  bluesky: "Bluesky",
  telegram: "Telegram",
  discord: "Discord",
  slack: "Slack",
};

/** Messaging channels — no Content Guide/Keywords */
export const MESSAGING_CHANNELS = ["telegram", "discord", "slack", "line", "kakao", "whatsapp"];

/** Data channels */
export const DATA_CHANNELS = ["google_analytics", "search_console", "google_business"];

/** Status badge styles */
export const CH_STATUS_BADGE: Record<string, string> = {
  live: "bg-success/15 text-success",
  connected: "bg-accent-soft text-accent",
  available: "",
  soon: "",
};

export const CH_STATUS_LABEL: Record<string, string> = {
  live: "Live",
  connected: "Connected",
  available: "",
  soon: "Coming Soon",
};

// OSMU 1차 정식 제공 채널 (실배포 OPENCLAW_EXTENSIONS = threads/x/instagram publish).
// UI(사이드바·연결배너·그리드)는 이 집합만 노출. 나머지는 추후/포크.
export const OSMU_CHANNELS: string[] = ["threads", "x", "instagram"];

/** Implemented plugins — channels with extensions */
export const IMPLEMENTED_PLUGINS: string[] = [
  "threads",
  "x",
  "instagram",
  "facebook",
  "bluesky",
  "telegram",
  "discord",
  "slack",
  "line",
  "tumblr",
  "pinterest",
  "linkedin",
  "tiktok",
  "youtube",
  "naver_blog",
  "midjourney",
];

/** Automation feature definitions — implemented: 크론잡 연결됨, coming_soon: 토글만 */
export const AUTOMATION_FEATURES = [
  { key: "content_generation", label: "Content Generation", description: "prompt-guide 기반 글 배치 생성 → draft 저장", default: true, implemented: true },
  { key: "auto_publish", label: "Auto Publish", description: "승인된 글 자동 발행 (1개씩)", default: true, implemented: true },
  { key: "insights_collection", label: "Insights Collection", description: "발행 글 views/likes/replies 수집", default: true, implemented: true },
  { key: "auto_like_replies", label: "Auto Like Replies", description: "내 글에 달린 댓글에 좋아요", default: true, implemented: true },
  { key: "auto_reply", label: "Auto Reply", description: "미답변 댓글에 AI 톤 자동 답글", default: false, implemented: false },
  { key: "low_engagement_cleanup", label: "Low Engagement Cleanup", description: "24시간 후 반응 저조 글 자동 삭제", default: false, implemented: false },
  { key: "trending_collection", label: "Trending Collection", description: "키워드 기반 외부 인기글 브라우저 수집", default: true, implemented: true },
  { key: "trending_rewrite", label: "Trending Rewrite", description: "수집된 인기글을 우리 톤으로 재가공", default: false, implemented: false },
  { key: "quote_trending", label: "Quote Trending", description: "외부 인기글 인용 게시 (우리 관점 추가)", default: false, implemented: false },
  { key: "series_followup", label: "Series Follow-up", description: "반응 좋은 토픽으로 시리즈 후속글", default: false, implemented: false },
  { key: "casual_posts", label: "Casual Posts", description: "일상/감성 톤 글 (사람처럼 보이기)", default: false, implemented: false },
  { key: "follower_tracking", label: "Growth Tracking", description: "팔로워 수 일간 추적", default: true, implemented: true },
  { key: "image_generation", label: "Image Generation", description: "배치 중 일부에 AI 이미지 자동 생성", default: false, implemented: false },
  { key: "instagram_carousel", label: "Instagram Carousel", description: "카드뉴스 자동 생성 + Instagram 캐러셀 발행", default: false, implemented: true },
  { key: "youtube_shorts", label: "YouTube Shorts", description: "카드뉴스 기반 짧은 영상 생성 + Shorts 발행", default: false, implemented: false },
];

/**
 * 안 터진 글 판정 기준 (VIRAL_THRESHOLD의 반대 짝).
 * 발행 후 이 나이(ms)가 지나고, views/likes가 이 기준 미만이면 "안 터진 글" 후보다.
 * 채널/워크스페이스별 override는 channel-settings.json의 low_engagement_min_views/
 * low_engagement_min_likes에 저장(없으면 이 기본값 사용) — /api/channel-settings/[channel] 참고.
 */
export const LOW_ENGAGEMENT_MIN_AGE_MS = 24 * 60 * 60 * 1000;
export const LOW_ENGAGEMENT_MIN_VIEWS_DEFAULT = Number(process.env.LOW_ENGAGEMENT_MIN_VIEWS) || 100;
export const LOW_ENGAGEMENT_MIN_LIKES_DEFAULT = Number(process.env.LOW_ENGAGEMENT_MIN_LIKES) || 3;

/**
 * 실제로 게시물 삭제 API가 존재하는 채널 SSOT. 다른 채널(x/instagram 등)은 publish
 * extension에 delete가 없어 이 목록에 없으면 "채널 미지원"으로 거부한다.
 * UI(AutomationRulesPanel)와 API(/api/threads/low-engagement-cleanup)가 이 배열을 공유한다.
 */
export const DELETE_SUPPORTED_CHANNELS: string[] = ["threads"];

/** Default notification settings */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  onPublish: { enabled: false, channels: [] as string[] },
  onViral: { enabled: false, channels: [] as string[] },
  onError: { enabled: true, channels: [] as string[] },
  weeklyReport: { enabled: false, channels: [] as string[] },
};
