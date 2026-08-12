import { readJson, dataPath, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getWeeklyReport as getWeeklyReportDb } from "@/lib/home-metrics";
import { homeDataSource, homeDbUnavailable, logHomeShadowDiff } from "@/lib/home-data-source";

interface WeeklySummary {
  published: number;
  drafted: number;
  views: number;
  likes: number;
  replies: number;
  engagementRate: number;
  channels: Record<string, number>;
  cronOk: number;
  cronErr: number;
}

function cronCounts() {
  const cronData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json")) || { jobs: [] };
  let cronOk = 0;
  let cronErr = 0;
  for (const job of cronData.jobs || []) {
    const state = (job.state as Record<string, unknown>) || {};
    if (state.lastRunStatus === "ok") cronOk++;
    if (state.lastRunStatus === "error") cronErr++;
  }
  return { cronOk, cronErr };
}

function fileSummary(): WeeklySummary {
  const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const published = queue.posts.filter((post) => {
    const at = post.publishedAt as string;
    return at && new Date(at).getTime() > weekAgo;
  });
  const drafted = queue.posts.filter((post) => {
    const at = post.generatedAt as string;
    return at && new Date(at).getTime() > weekAgo && post.status === "draft";
  });
  let views = 0;
  let likes = 0;
  let replies = 0;
  const channels: Record<string, number> = { threads: 0, x: 0 };
  for (const post of published) {
    const engagement = (post.engagement as Record<string, number>) || {};
    views += engagement.views || 0;
    likes += engagement.likes || 0;
    replies += engagement.replies || 0;
    const state = (post.channels as Record<string, { status?: string }>) || {};
    if (state.threads?.status === "published") channels.threads++;
    if (state.x?.status === "published") channels.x++;
  }
  return {
    published: published.length,
    drafted: drafted.length,
    views,
    likes,
    replies,
    engagementRate: views > 0 ? Math.round(((likes + replies) / views) * 1000) / 10 : 0,
    channels,
    ...cronCounts(),
  };
}

async function dbSummary(tenantId: string): Promise<WeeklySummary> {
  const report = await getWeeklyReportDb(tenantId);
  return {
    published: report.publishedThisWeek,
    drafted: report.draftedThisWeek,
    views: report.views,
    likes: report.likes,
    replies: report.replies,
    engagementRate: report.views > 0 ? Math.round(((report.likes + report.replies) / report.views) * 1000) / 10 : 0,
    channels: report.byPlatform,
    ...cronCounts(),
  };
}

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(tenantId, async () => {
    const source = homeDataSource();
    if (!tenantId || source === "file") {
      return Response.json({ ...fileSummary(), source: tenantId ? "file-rollback" : "file-legacy" });
    }
    if (source === "shadow") {
      const file = fileSummary();
      try {
        const db = await dbSummary(tenantId);
        const shadowMatches = logHomeShadowDiff("weekly-summary", tenantId, file, db);
        return Response.json({ ...file, source: "shadow-file", shadowMatches });
      } catch (error) {
        console.error("[home-data-shadow]", error instanceof Error ? error.message : String(error));
        return Response.json({ ...file, source: "shadow-file", shadowMatches: false });
      }
    }
    try {
      return Response.json({ ...await dbSummary(tenantId), source: "db" });
    } catch (error) {
      return homeDbUnavailable(error);
    }
  });
}
