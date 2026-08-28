import { readJson, dataPath, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getWeeklyReport as getWeeklyReportDb } from "@/lib/home-metrics";
import { homeDataSource, homeDbUnavailable, logHomeShadowDiff } from "@/lib/home-data-source";

interface WeeklyMetrics {
  published: number;
  drafted: number;
  views: number;
  likes: number;
  replies: number;
  followers: number;
  weekDelta: number;
  channels: Record<string, number>;
  viral: Array<{ text: string; views: number; likes: number }>;
}

function fileWeeklyMetrics(now: number, viralThreshold: number): WeeklyMetrics {
  const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const weekPublished = queue.posts.filter((post) => {
    const at = post.publishedAt as string;
    return at && new Date(at).getTime() > weekAgo;
  });
  const weekDrafted = queue.posts.filter((post) => {
    const at = (post.generatedAt || post.createdAt) as string;
    return at && new Date(at).getTime() > weekAgo;
  });
  const channels: Record<string, number> = {};
  let views = 0;
  let likes = 0;
  let replies = 0;
  for (const post of weekPublished) {
    const engagement = (post.engagement as Record<string, number>) || {};
    views += engagement.views || 0;
    likes += engagement.likes || 0;
    replies += engagement.replies || 0;
    const channelState = (post.channels as Record<string, { status?: string }>) || {};
    for (const [channel, state] of Object.entries(channelState)) {
      if (state.status === "published") channels[channel] = (channels[channel] || 0) + 1;
    }
  }
  if (Object.keys(channels).length === 0 && weekPublished.length > 0) channels.threads = weekPublished.length;
  const growth = readJson<{ records: Array<{ followers: number }> }>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : 0;
  const weekDelta = records.length >= 2
    ? records[records.length - 1].followers - records[Math.max(0, records.length - 7)].followers
    : 0;
  const viral = weekPublished
    .map((post) => {
      const engagement = (post.engagement as Record<string, number>) || {};
      return { text: String(post.text || ""), views: engagement.views || 0, likes: engagement.likes || 0 };
    })
    .filter((post) => post.views >= viralThreshold)
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);
  return { published: weekPublished.length, drafted: weekDrafted.length, views, likes, replies, followers, weekDelta, channels, viral };
}

async function dbWeeklyMetrics(tenantId: string, viralThreshold: number): Promise<WeeklyMetrics> {
  const db = await getWeeklyReportDb(tenantId, viralThreshold);
  return {
    published: db.publishedThisWeek,
    drafted: db.draftedThisWeek,
    views: db.views,
    likes: db.likes,
    replies: db.replies,
    followers: db.followers ?? 0,
    weekDelta: db.weekDelta ?? 0,
    channels: db.byPlatform,
    viral: db.viralPosts,
  };
}

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(tenantId, async () => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 3600 * 1000;
    const settings = readJson<Record<string, number>>(dataPath("settings.json")) || {};
    const viralThreshold = settings.viralThreshold || 500;
    const source = homeDataSource();
    let metrics: WeeklyMetrics;
    let responseSource: string;
    let shadowMatches: boolean | undefined;

    if (!tenantId || source === "file") {
      metrics = fileWeeklyMetrics(now, viralThreshold);
      responseSource = tenantId ? "file-rollback" : "file-legacy";
    } else if (source === "shadow") {
      const file = fileWeeklyMetrics(now, viralThreshold);
      try {
        const db = await dbWeeklyMetrics(tenantId, viralThreshold);
        shadowMatches = logHomeShadowDiff("weekly-report", tenantId, file, db);
      } catch (error) {
        console.error("[home-data-shadow]", error instanceof Error ? error.message : String(error));
        shadowMatches = false;
      }
      metrics = file;
      responseSource = "shadow-file";
    } else {
      try {
        metrics = await dbWeeklyMetrics(tenantId, viralThreshold);
        responseSource = "db";
      } catch (error) {
        return homeDbUnavailable(error);
      }
    }

    const cronData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json")) || { jobs: [] };
    let cronOk = 0;
    let cronErr = 0;
    for (const job of cronData.jobs || []) {
      const state = (job.state as Record<string, unknown>) || {};
      if (state.lastRunStatus === "ok") cronOk++;
      else if (state.lastRunStatus === "error") cronErr++;
    }

    const startDate = new Date(weekAgo);
    const endDate = new Date(now);
    const fmt = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
    const dateRange = `${fmt(startDate)} ~ ${fmt(endDate)}`;
    const engagementRate = metrics.views > 0
      ? Math.round(((metrics.likes + metrics.replies) / metrics.views) * 1000) / 10
      : 0;
    const channelText = Object.entries(metrics.channels).map(([channel, count]) => `${channel}: ${count}건`).join(" | ") || "-";
    let report = `📊 주간 마케팅 리포트 (${dateRange})

📝 콘텐츠
  발행: ${metrics.published}건 | 생성: ${metrics.drafted}건
  ${channelText}

📈 성과
  조회: ${metrics.views.toLocaleString()} | 좋아요: ${metrics.likes} | 댓글: ${metrics.replies}
  참여율: ${engagementRate}%

👥 팔로워
  현재: ${metrics.followers.toLocaleString()}명 (${metrics.weekDelta >= 0 ? "+" : ""}${metrics.weekDelta} 이번 주)

⚙️ 자동화
  크론 정상: ${cronOk}/${cronOk + cronErr}${cronErr > 0 ? ` | 에러: ${cronErr}` : ""}`;
    if (metrics.viral.length > 0) {
      report += `\n\n🔥 터진 글 (${metrics.viral.length}건)`;
      for (const post of metrics.viral) {
        report += `\n  "${post.text.slice(0, 40)}..." 조회 ${post.views.toLocaleString()} / 좋아요 ${post.likes}`;
      }
    }

    return Response.json({
      report,
      dateRange,
      stats: {
        published: metrics.published,
        drafted: metrics.drafted,
        views: metrics.views,
        likes: metrics.likes,
        replies: metrics.replies,
        engRate: engagementRate,
        followers: metrics.followers,
        weekDelta: metrics.weekDelta,
        viral: metrics.viral.length,
        channels: metrics.channels,
        cronOk,
        cronErr,
      },
      source: responseSource,
      ...(shadowMatches === undefined ? {} : { shadowMatches }),
    });
  });
}
