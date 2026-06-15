import { readJson, dataPath, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 격리 (본문 로직 불변)
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

  // Posts published this week
  const weekPublished = posts.filter((p) => {
    const at = p.publishedAt as string;
    return at && new Date(at).getTime() > weekAgo;
  });

  // Posts drafted this week
  const weekDrafted = posts.filter((p) => {
    const at = p.generatedAt as string;
    return at && new Date(at).getTime() > weekAgo && p.status === "draft";
  });

  // Engagement this week
  const totalViews = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.views || 0);
  }, 0);
  const totalLikes = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.likes || 0);
  }, 0);
  const totalReplies = weekPublished.reduce((s, p) => {
    const eng = (p.engagement as Record<string, number>) || {};
    return s + (eng.replies || 0);
  }, 0);

  // Channel breakdown
  const channels: Record<string, number> = { threads: 0, x: 0 };
  for (const p of weekPublished) {
    const ch = (p.channels as Record<string, Record<string, unknown>>) || {};
    if (ch.threads?.status === "published") channels.threads++;
    if (ch.x?.status === "published") channels.x++;
  }

  // Cron status
  const cronData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json")) || { jobs: [] };
  let cronOk = 0;
  let cronErr = 0;
  for (const j of cronData.jobs || []) {
    const state = (j.state as Record<string, unknown>) || {};
    if (state.lastRunStatus === "ok") cronOk++;
    if (state.lastRunStatus === "error") cronErr++;
  }

  return Response.json({
    published: weekPublished.length,
    drafted: weekDrafted.length,
    views: totalViews,
    likes: totalLikes,
    replies: totalReplies,
    engagementRate: totalViews > 0 ? Math.round((totalLikes + totalReplies) / totalViews * 1000) / 10 : 0,
    channels,
    cronOk,
    cronErr,
  });
  });
}
