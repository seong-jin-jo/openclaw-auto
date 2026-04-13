import { readJson, dataPath } from "@/lib/file-io";

interface QueuePost {
  publishedAt?: string;
  engagement?: { views?: number; likes?: number; replies?: number };
  text: string;
  [key: string]: unknown;
}

export async function GET() {
  const queue = readJson<{ posts: QueuePost[] }>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];
  const now = Date.now();
  const weekAgoMs = now - 7 * 24 * 3600 * 1000;

  const weekPublished = posts.filter(p => {
    if (!p.publishedAt) return false;
    return new Date(p.publishedAt).getTime() > weekAgoMs;
  });

  const totalViews = weekPublished.reduce((s, p) => s + (p.engagement?.views || 0), 0);
  const totalLikes = weekPublished.reduce((s, p) => s + (p.engagement?.likes || 0), 0);
  const totalReplies = weekPublished.reduce((s, p) => s + (p.engagement?.replies || 0), 0);

  const growth = readJson<{ records: Array<{ followers: number; delta?: number }> }>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : 0;
  const weekDelta = records.length >= 7
    ? records[records.length - 1].followers - records[records.length - 7].followers
    : records.length ? (records[records.length - 1].delta || 0) : 0;

  const settings = readJson<Record<string, number>>(dataPath("settings.json")) || {};
  const vt = settings.viralThreshold || 500;
  const viral = weekPublished.filter(p => (p.engagement?.views || 0) >= vt);

  const engRate = totalViews > 0 ? Math.round((totalLikes + totalReplies) / totalViews * 1000) / 10 : 0;

  let report = `📊 주간 마케팅 리포트
━━━━━━━━━━━━━━━━
📝 발행: ${weekPublished.length}건
👀 조회수: ${totalViews.toLocaleString()}
❤️ 좋아요: ${totalLikes}
💬 댓글: ${totalReplies}
📈 참여율: ${engRate}%
👥 팔로워: ${followers.toLocaleString()} (${weekDelta >= 0 ? "+" : ""}${weekDelta})
🔥 바이럴: ${viral.length}건 (>= ${vt} views)\n`;

  if (viral.length) {
    report += "\n🏆 Top 바이럴:\n";
    for (const v of viral.slice(0, 3)) {
      const views = v.engagement?.views || 0;
      report += `  • ${v.text.slice(0, 40)}... (${views.toLocaleString()} views)\n`;
    }
  }

  return Response.json({
    report,
    stats: {
      published: weekPublished.length,
      views: totalViews,
      likes: totalLikes,
      replies: totalReplies,
      engRate,
      followers,
      weekDelta,
      viral: viral.length,
    },
  });
}
