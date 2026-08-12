import { readJson, dataPath, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getWeeklyReport as getWeeklyReportDb } from "@/lib/home-metrics";

// F3(fdd-r02): 홈 page.tsx가 실제로 소비하는 라우트(useWeeklySummary). migration 문서가 지목한
// weekly-report/route.ts와 별개 엔드포인트지만 같은 dual-datastore 결함 클래스라 동일 처리한다.
// DB(published_posts) 우선, 실패시에만 파일 폴백.
export async function GET(request: Request) {
  const __t = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(__t, async () => {
  if (__t) {
    try {
      const w = await getWeeklyReportDb(__t);
      return Response.json({
        published: w.publishedThisWeek,
        drafted: 0,
        views: w.views,
        likes: w.likes,
        replies: w.replies,
        engagementRate: w.views > 0 ? Math.round(((w.likes + w.replies) / w.views) * 1000) / 10 : 0,
        channels: w.byPlatform,
        cronOk: 0,
        cronErr: 0,
        source: "db",
      });
    } catch {
      // DB 미가용. 아래 파일 폴백으로 이동한다.
    }
  }
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
    source: "file-fallback",
  });
  });
}
