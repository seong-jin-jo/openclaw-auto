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
  medium: "Medium",
  substack: "Substack",
  google_analytics: "Google Analytics",
  search_console: "Search Console",
  google_business: "Google Business",
};

/** Channel categories for sidebar */
export const CHANNEL_CATEGORIES = [
  {
    key: "social",
    label: "Social",
    channels: ["threads", "x", "instagram", "facebook", "linkedin", "bluesky", "pinterest", "tumblr"],
  },
  {
    key: "video",
    label: "Video",
    channels: ["tiktok", "youtube"],
  },
  {
    key: "blog",
    label: "Blog",
    channels: ["naver_blog", "medium", "substack"],
  },
  {
    key: "messaging",
    label: "Messaging",
    channels: ["telegram", "discord", "slack", "line", "kakao", "whatsapp"],
  },
  {
    key: "data",
    label: "Data & SEO",
    channels: ["google_analytics", "search_console", "google_business"],
  },
] as const;

/** Messaging channels — no Content Guide/Keywords */
export const MESSAGING_CHANNELS = ["telegram", "discord", "slack", "line", "kakao", "whatsapp"];

/** Data channels */
export const DATA_CHANNELS = ["google_analytics", "search_console", "google_business"];

/** Status badge styles */
export const CH_STATUS_BADGE: Record<string, string> = {
  live: "bg-green-900/50 text-green-400",
  connected: "bg-blue-900/50 text-blue-400",
  available: "",
  soon: "",
};

export const CH_STATUS_LABEL: Record<string, string> = {
  live: "Live",
  connected: "Connected",
  available: "",
  soon: "Coming Soon",
};

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
];

/** Automation feature definitions */
export const AUTOMATION_FEATURES = [
  { key: "content_generation", label: "Content Generation", description: "prompt-guide 기반 글 배치 생성 → draft 저장", default: true },
  { key: "auto_publish", label: "Auto Publish", description: "승인된 글 자동 발행 (1개씩)", default: true },
  { key: "insights_collection", label: "Insights Collection", description: "발행 글 views/likes/replies 수집", default: true },
  { key: "auto_like_replies", label: "Auto Like Replies", description: "내 글에 달린 댓글에 좋아요", default: true },
  { key: "auto_reply", label: "Auto Reply", description: "미답변 댓글에 AI 톤 자동 답글", default: false },
  { key: "low_engagement_cleanup", label: "Low Engagement Cleanup", description: "24시간 후 반응 저조 글 자동 삭제", default: false },
  { key: "trending_collection", label: "Trending Collection", description: "키워드 기반 외부 인기글 브라우저 수집", default: true },
  { key: "trending_rewrite", label: "Trending Rewrite", description: "수집된 인기글을 우리 톤으로 재가공", default: false },
  { key: "quote_trending", label: "Quote Trending", description: "외부 인기글 인용 게시 (우리 관점 추가)", default: false },
  { key: "series_followup", label: "Series Follow-up", description: "반응 좋은 토픽으로 시리즈 후속글", default: false },
  { key: "casual_posts", label: "Casual Posts", description: "일상/감성 톤 글 (사람처럼 보이기)", default: false },
  { key: "follower_tracking", label: "Growth Tracking", description: "팔로워 수 일간 추적", default: true },
  { key: "image_generation", label: "Image Generation", description: "배치 중 일부에 AI 이미지 자동 생성", default: false },
  { key: "instagram_carousel", label: "Instagram Carousel", description: "카드뉴스 자동 생성 + Instagram 캐러셀 발행", default: false },
  { key: "youtube_shorts", label: "YouTube Shorts", description: "카드뉴스 기반 짧은 영상 생성 + Shorts 발행", default: false },
];

/** Default notification settings */
export const DEFAULT_NOTIFICATION_SETTINGS = {
  onPublish: { enabled: false, channels: [] as string[] },
  onViral: { enabled: false, channels: [] as string[] },
  onError: { enabled: true, channels: [] as string[] },
  weeklyReport: { enabled: false, channels: [] as string[] },
};
