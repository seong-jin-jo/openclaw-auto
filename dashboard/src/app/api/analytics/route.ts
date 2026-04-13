import { readJson, dataPath } from "@/lib/file-io";
import { readSettings } from "@/app/api/settings/route";

interface Post {
  id: string;
  text: string;
  status?: string;
  topic?: string;
  hashtags?: string[];
  publishedAt?: string;
  engagement?: {
    views?: number;
    likes?: number;
    replies?: number;
    reposts?: number;
    quotes?: number;
  };
}

interface QueueData {
  posts: Post[];
}

interface HistoryData {
  posts: Post[];
}

function hourlyPerformance(postStats: Array<Record<string, unknown>>) {
  const hours: Record<number, { count: number; views: number; likes: number }> = {};
  for (const p of postStats) {
    const publishedAt = p.publishedAt as string;
    if (!publishedAt) continue;
    try {
      const h = new Date(publishedAt).getUTCHours();
      if (!hours[h]) hours[h] = { count: 0, views: 0, likes: 0 };
      hours[h].count++;
      hours[h].views += (p.views as number) || 0;
      hours[h].likes += (p.likes as number) || 0;
    } catch {
      continue;
    }
  }
  const result: Record<number, { count: number; avgViews: number; avgLikes: number }> = {};
  for (const [h, d] of Object.entries(hours)) {
    const c = d.count;
    result[Number(h)] = {
      count: c,
      avgViews: Math.round(d.views / c),
      avgLikes: Math.round(d.likes / c),
    };
  }
  return result;
}

export async function GET() {
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) {
    return Response.json({ error: "queue.json not found" }, { status: 404 });
  }

  const posts = queue.posts || [];
  const published = posts.filter((p) => p.status === "published");

  // Merge archived posts from analytics-history.json
  const history = readJson<HistoryData>(dataPath("analytics-history.json"));
  const archived = history?.posts || [];

  // Per-post engagement (archived + current)
  const postStats: Array<Record<string, unknown>> = [];

  for (const p of archived) {
    const eng = p.engagement || {};
    postStats.push({
      id: p.id,
      text: (p.text || "").slice(0, 80),
      topic: p.topic || "",
      publishedAt: p.publishedAt,
      views: eng.views || 0,
      likes: eng.likes || 0,
      replies: eng.replies || 0,
      reposts: eng.reposts || 0,
      quotes: eng.quotes || 0,
      archived: true,
    });
  }

  for (const p of published) {
    const eng = p.engagement || {};
    postStats.push({
      id: p.id,
      text: (p.text || "").slice(0, 80),
      topic: p.topic || "",
      publishedAt: p.publishedAt,
      views: eng.views || 0,
      likes: eng.likes || 0,
      replies: eng.replies || 0,
      reposts: eng.reposts || 0,
      quotes: eng.quotes || 0,
    });
  }

  // Topic stats
  const topicStats: Record<string, { count: number; views: number; likes: number; replies: number; avgViews?: number; avgLikes?: number; avgReplies?: number }> = {};
  for (const p of postStats) {
    const topic = (p.topic as string) || "unknown";
    if (!topicStats[topic]) topicStats[topic] = { count: 0, views: 0, likes: 0, replies: 0 };
    topicStats[topic].count++;
    topicStats[topic].views += (p.views as number) || 0;
    topicStats[topic].likes += (p.likes as number) || 0;
    topicStats[topic].replies += (p.replies as number) || 0;
  }
  for (const topic of Object.keys(topicStats)) {
    const c = topicStats[topic].count;
    if (c > 0) {
      topicStats[topic].avgViews = Math.round(topicStats[topic].views / c);
      topicStats[topic].avgLikes = Math.round(topicStats[topic].likes / c);
      topicStats[topic].avgReplies = Math.round(topicStats[topic].replies / c);
    }
  }

  // Hashtag stats
  const hashtagStats: Record<string, { count: number; views: number; likes: number; avgViews?: number; avgLikes?: number }> = {};
  for (const p of [...published, ...archived]) {
    const eng = p.engagement || {};
    const views = eng.views || 0;
    const likes = eng.likes || 0;
    for (let tag of p.hashtags || []) {
      tag = tag.replace(/^#/, "");
      if (!hashtagStats[tag]) hashtagStats[tag] = { count: 0, views: 0, likes: 0 };
      hashtagStats[tag].count++;
      hashtagStats[tag].views += views;
      hashtagStats[tag].likes += likes;
    }
  }
  for (const tag of Object.keys(hashtagStats)) {
    const c = hashtagStats[tag].count;
    if (c > 0) {
      hashtagStats[tag].avgViews = Math.round(hashtagStats[tag].views / c);
      hashtagStats[tag].avgLikes = Math.round(hashtagStats[tag].likes / c);
    }
  }

  // Summary
  const totalViews = postStats.reduce((s, p) => s + ((p.views as number) || 0), 0);
  const totalLikes = postStats.reduce((s, p) => s + ((p.likes as number) || 0), 0);
  const settings = readSettings();
  const vt = settings.viralThreshold ?? 500;
  const viralCount = postStats.filter((p) => ((p.views as number) || 0) >= vt).length;

  return Response.json({
    summary: {
      totalPublished: published.length,
      totalViews,
      totalLikes,
      avgViews: published.length ? Math.round(totalViews / published.length) : 0,
      avgLikes: published.length ? Math.round(totalLikes / published.length) : 0,
      viralCount,
      viralThreshold: vt,
    },
    posts: postStats,
    topics: topicStats,
    hashtags: hashtagStats,
    hourlyPerformance: hourlyPerformance(postStats),
    statusCounts: {
      draft: posts.filter((p) => p.status === "draft").length,
      approved: posts.filter((p) => p.status === "approved").length,
      published: posts.filter((p) => p.status === "published").length,
      failed: posts.filter((p) => p.status === "failed").length,
    },
  });
}
