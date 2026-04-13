import { readJson, readText, dataPath } from "@/lib/file-io";
import { readSettings } from "@/app/api/settings/route";

interface QueueData {
  posts: Array<{
    id: string;
    text: string;
    status: string;
    engagement?: { views?: number; likes?: number };
    channels?: Record<string, { status?: string }>;
  }>;
}

interface GrowthData {
  records: Array<{ followers: number; date: string }>;
}

function parsePopularPosts(): Array<Record<string, string>> {
  const content = readText(dataPath("popular-posts.txt"));
  if (!content) return [];

  const blocks = content.split("---");
  const posts: Record<string, string>[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const post: Record<string, string> = {};
    const lines = trimmed.split("\n");
    const textLines: string[] = [];
    let inText = false;

    for (const line of lines) {
      if (line.startsWith("text:")) {
        inText = true;
        textLines.push(line.slice(5).trim());
      } else if (inText) {
        textLines.push(line.trim());
      } else if (line.includes(":")) {
        const idx = line.indexOf(":");
        post[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
    if (textLines.length) post.text = textLines.join(" ").trim();
    if (post.text) posts.push(post);
  }
  return posts;
}

export async function GET() {
  const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];

  const statusCounts = {
    draft: posts.filter((p) => p.status === "draft").length,
    approved: posts.filter((p) => p.status === "approved").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };

  // Follower info
  const growth = readJson<GrowthData>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : null;
  let weekDelta: number | null = null;
  if (records.length >= 2) {
    const weekRecords = records.slice(-7);
    weekDelta = weekRecords[weekRecords.length - 1].followers - weekRecords[0].followers;
  }

  // Viral posts
  const settings = readSettings();
  const vt = settings.viralThreshold ?? 500;
  const viralPosts = posts
    .filter((p) => (p.engagement?.views ?? 0) >= vt)
    .map((p) => ({
      id: p.id,
      text: p.text?.slice(0, 80),
      views: p.engagement?.views ?? 0,
      likes: p.engagement?.likes ?? 0,
    }));

  // Popular posts source distribution
  const popular = parsePopularPosts();
  const popularSourceCounts: Record<string, number> = {};
  for (const pp of popular) {
    const src = pp.source || "unknown";
    popularSourceCounts[src] = (popularSourceCounts[src] || 0) + 1;
  }

  // Channel publish counts
  const channelCounts: Record<string, number> = { threads: 0, x: 0 };
  for (const p of posts) {
    const ch = p.channels || {};
    if (ch.threads?.status === "published") channelCounts.threads++;
    if (ch.x?.status === "published") channelCounts.x++;
  }

  return Response.json({
    statusCounts,
    followers,
    weekDelta,
    viralPosts,
    popularPostsCount: popular.length,
    popularSourceCounts,
    channelCounts,
  });
}
