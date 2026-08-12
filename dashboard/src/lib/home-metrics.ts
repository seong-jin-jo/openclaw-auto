// F3(fdd-r02): 홈 계열 라우트(overview/activity/weekly-report)가 파일(queue.json/growth.json) 대신
// DB(queue_posts·published_posts·growth_metrics)를 읽도록 하는 공용 집계 헬퍼.
// migration-filestore-to-db-v1.0.0-opus.md §4 소스 매핑표를 그대로 구현한다.
import { withTenant } from "@/lib/db";

export interface StatusCounts {
  draft: number;
  approved: number;
  published: number;
  failed: number;
}

export interface ViralPost {
  id: string;
  text: string;
  views: number;
  likes: number;
}

export interface HomeSummary {
  statusCounts: StatusCounts;
  followers: number | null;
  weekDelta: number | null;
  viralPosts: ViralPost[];
  channelCounts: Record<string, number>;
  // 성과 요약 1블록(F3 UI 통합). published_posts 단일 소스 집계.
  published: number;
  views: number;
  likes: number;
  replies: number;
  engagementRate: number | null; // (likes+replies) / max(views,1)
}

export async function getHomeSummary(tenantId: string, viralThreshold = 500): Promise<HomeSummary> {
  return withTenant(tenantId, async (sql) => {
    const statusRows = await sql<{ status: string; cnt: string }[]>`
      SELECT status, count(*)::text AS cnt FROM queue_posts
      WHERE tenant_id = ${tenantId} GROUP BY status`;
    const statusCounts: StatusCounts = { draft: 0, approved: 0, published: 0, failed: 0 };
    for (const r of statusRows) {
      if (r.status in statusCounts) statusCounts[r.status as keyof StatusCounts] = Number(r.cnt);
    }

    const growthRows = await sql<{ followers: number; recorded_at: string }[]>`
      SELECT followers, recorded_at::text FROM growth_metrics
      WHERE tenant_id = ${tenantId} ORDER BY recorded_at DESC LIMIT 8`;
    const followers = growthRows.length ? growthRows[0].followers : null;
    let weekDelta: number | null = null;
    if (growthRows.length >= 2) {
      const oldest = growthRows[growthRows.length - 1].followers;
      weekDelta = growthRows[0].followers - oldest;
    }

    const viralRows = await sql<{ id: string; text: string | null; views: number | null; likes: number | null }[]>`
      SELECT id, text, views, likes FROM published_posts
      WHERE tenant_id = ${tenantId} AND status = 'published' AND coalesce(views, 0) >= ${viralThreshold}
      ORDER BY views DESC LIMIT 20`;
    const viralPosts: ViralPost[] = viralRows.map((r) => ({
      id: r.id, text: (r.text || "").slice(0, 80), views: r.views ?? 0, likes: r.likes ?? 0,
    }));

    const channelRows = await sql<{ platform: string; cnt: string }[]>`
      SELECT platform, count(*)::text AS cnt FROM published_posts
      WHERE tenant_id = ${tenantId} AND status = 'published' GROUP BY platform`;
    const channelCounts: Record<string, number> = { threads: 0, x: 0 };
    for (const r of channelRows) channelCounts[r.platform] = Number(r.cnt);

    const [agg] = await sql<{ published: string; views: string; likes: string; replies: string }[]>`
      SELECT count(*)::text AS published,
             coalesce(sum(views), 0)::text AS views,
             coalesce(sum(likes), 0)::text AS likes,
             coalesce(sum(replies), 0)::text AS replies
      FROM published_posts WHERE tenant_id = ${tenantId} AND status = 'published'`;
    const published = Number(agg?.published || 0);
    const views = Number(agg?.views || 0);
    const likes = Number(agg?.likes || 0);
    const replies = Number(agg?.replies || 0);
    const engagementRate = views > 0 ? Math.round(((likes + replies) / views) * 1000) / 10 : null;

    return { statusCounts, followers, weekDelta, viralPosts, channelCounts, published, views, likes, replies, engagementRate };
  });
}

export interface ActivityEvent {
  id: string;
  type: string;
  text: string;
  at: string;
  channel?: string;
  views?: number;
}

export async function getActivityEvents(tenantId: string, limit = 30, viralThreshold = 500): Promise<ActivityEvent[]> {
  return withTenant(tenantId, async (sql) => {
    const publishedRows = await sql<{ id: string; platform: string; text: string | null; published_at: string; status: string; views: number | null }[]>`
      SELECT id, platform, text, published_at::text, status, views FROM published_posts
      WHERE tenant_id = ${tenantId} ORDER BY published_at DESC LIMIT ${limit}`;
    const draftRows = await sql<{ id: string; text: string | null; generated_at: string }[]>`
      SELECT id, text, generated_at::text FROM queue_posts
      WHERE tenant_id = ${tenantId} AND generated_at IS NOT NULL
      ORDER BY generated_at DESC LIMIT ${limit}`;
    const events: ActivityEvent[] = [];
    for (const row of publishedRows) {
      events.push({
        id: `publish:${row.id}`,
        type: row.status === "failed" ? "publish_failed" : "publish",
        text: (row.text || "").slice(0, 60),
        channel: row.platform,
        at: row.published_at,
      });
      if (row.status === "published" && (row.views ?? 0) >= viralThreshold) {
        events.push({
          id: `viral:${row.id}`,
          type: "viral",
          text: (row.text || "").slice(0, 60),
          views: row.views ?? 0,
          at: row.published_at,
        });
      }
    }
    for (const row of draftRows) {
      events.push({ id: `draft:${row.id}`, type: "draft", text: (row.text || "").slice(0, 60), at: row.generated_at });
    }
    return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  });
}

export interface WeeklyReport {
  publishedThisWeek: number;
  draftedThisWeek: number;
  views: number;
  likes: number;
  replies: number;
  byPlatform: Record<string, number>;
  followers: number | null;
  weekDelta: number | null;
  viralPosts: Array<{ text: string; views: number; likes: number }>;
}

export async function getWeeklyReport(tenantId: string, viralThreshold = 500): Promise<WeeklyReport> {
  return withTenant(tenantId, async (sql) => {
    const rows = await sql<{ platform: string; text: string | null; views: number | null; likes: number | null; replies: number | null }[]>`
      SELECT platform, text, views, likes, replies FROM published_posts
      WHERE tenant_id = ${tenantId} AND status = 'published' AND published_at > now() - interval '7 days'`;
    const [draftCount] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM queue_posts
      WHERE tenant_id = ${tenantId} AND generated_at > now() - interval '7 days'`;
    let views = 0, likes = 0, replies = 0;
    const byPlatform: Record<string, number> = {};
    for (const r of rows) {
      views += r.views ?? 0; likes += r.likes ?? 0; replies += r.replies ?? 0;
      byPlatform[r.platform] = (byPlatform[r.platform] || 0) + 1;
    }
    // 팔로워도 overview와 동일 소스(growth_metrics)로 읽어 라우트 간 값 상충을 방지한다(F3 AC).
    const growthRows = await sql<{ followers: number }[]>`
      SELECT followers FROM growth_metrics
      WHERE tenant_id = ${tenantId} ORDER BY recorded_at DESC LIMIT 8`;
    const followers = growthRows.length ? growthRows[0].followers : null;
    const weekDelta = growthRows.length >= 2 ? growthRows[0].followers - growthRows[growthRows.length - 1].followers : null;
    const viralPosts = rows
      .filter((row) => (row.views ?? 0) >= viralThreshold)
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 3)
      .map((row) => ({ text: row.text || "", views: row.views ?? 0, likes: row.likes ?? 0 }));
    return {
      publishedThisWeek: rows.length,
      draftedThisWeek: Number(draftCount?.count || 0),
      views,
      likes,
      replies,
      byPlatform,
      followers,
      weekDelta,
      viralPosts,
    };
  });
}
