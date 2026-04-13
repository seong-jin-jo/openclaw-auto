export interface ChannelStatus {
  status: "pending" | "published" | "failed" | "skipped";
  publishedAt: string | null;
  error: string | null;
  mediaId?: string | null;
  tweetId?: string | null;
}

export interface Post {
  id: string;
  text: string;
  status: "draft" | "approved" | "published" | "failed";
  createdAt: string;
  approvedAt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  generatedAt?: string;
  imageUrl?: string;
  topic?: string;
  model?: string;
  hashtags?: string[];
  channels?: Record<string, ChannelStatus>;
  engagement?: {
    views?: number;
    likes?: number;
    replies?: number;
  };
}

export interface BlogPost {
  id: string;
  title: string;
  body: string;
  content?: string;
  status: "draft" | "approved" | "published" | "failed";
  createdAt: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeyword?: string;
  blogPostUrl?: string;
  tags?: string[];
}
