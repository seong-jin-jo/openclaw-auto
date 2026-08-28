import { readJson, dataPath } from "@/lib/file-io";
import { readSettings } from "@/lib/settings-store";
import { parsePopularPosts } from "@/lib/popular-posts";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getHomeSummary } from "@/lib/home-metrics";
import { homeDataSource, homeDbUnavailable, logHomeShadowDiff } from "@/lib/home-data-source";

interface QueueData {
  posts: Array<{
    id: string;
    text: string;
    status: string;
    engagement?: { views?: number; likes?: number };
    channels?: Record<string, { status?: string }>;
  }>;
}

// F3(fdd-r02) / migration-filestore-to-db: 파일(queue.json) 대신 DB(queue_posts·published_posts·
// growth_metrics)를 단일 소스로 읽는다. 실측(2026-08-12): 이 라우트가 읽던 tenant별 queue.json은
// 마이그레이트된 적이 없어(0건) 항상 비어있었고, published_posts DB에는 실제 발행 15건(published 12·
// failed 3)이 있었다. 즉 파일 소스가 "낡음"이 아니라 "애초에 채워진 적 없음"이었다. 컷오버는
// 데이터 유실이 아니라 이미 실재하는 DB 값을 처음으로 노출하는 것이다(§8-A 회수 근거).
// 롤백: DB 조회 실패 시에만 파일로 폴백(무중단 원칙 유지).
function popularCounts() {
  const popular = parsePopularPosts();
  const popularSourceCounts: Record<string, number> = {};
  for (const post of popular) {
    const source = post.source || "unknown";
    popularSourceCounts[source] = (popularSourceCounts[source] || 0) + 1;
  }
  return { popularPostsCount: popular.length, popularSourceCounts };
}

function fileOverview(viralThreshold: number) {
  const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];
  const statusCounts = {
    draft: posts.filter((post) => post.status === "draft").length,
    approved: posts.filter((post) => post.status === "approved").length,
    published: posts.filter((post) => post.status === "published").length,
    failed: posts.filter((post) => post.status === "failed").length,
  };
  interface GrowthData { records: Array<{ followers: number; date: string }> }
  const growth = readJson<GrowthData>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : null;
  const weekRecords = records.slice(-7);
  const weekDelta = weekRecords.length >= 2
    ? weekRecords[weekRecords.length - 1].followers - weekRecords[0].followers
    : null;
  const viralPosts = posts
    .filter((post) => (post.engagement?.views ?? 0) >= viralThreshold)
    .map((post) => ({ id: post.id, text: post.text?.slice(0, 80), views: post.engagement?.views ?? 0, likes: post.engagement?.likes ?? 0 }));
  const channelCounts: Record<string, number> = { threads: 0, x: 0 };
  for (const post of posts) {
    const channels = post.channels || {};
    if (channels.threads?.status === "published") channelCounts.threads++;
    if (channels.x?.status === "published") channelCounts.x++;
  }
  const views = posts.reduce((sum, post) => sum + (post.engagement?.views ?? 0), 0);
  const likes = posts.reduce((sum, post) => sum + (post.engagement?.likes ?? 0), 0);
  return {
    statusCounts,
    followers,
    weekDelta,
    viralPosts,
    ...popularCounts(),
    channelCounts,
    summary: { published: statusCounts.published, views, likes, replies: 0, engagementRate: views > 0 ? Math.round((likes / views) * 1000) / 10 : null },
  };
}

async function dbOverview(tenantId: string, viralThreshold: number) {
  const summary = await getHomeSummary(tenantId, viralThreshold);
  return {
    statusCounts: summary.statusCounts,
    followers: summary.followers,
    weekDelta: summary.weekDelta,
    viralPosts: summary.viralPosts,
    ...popularCounts(),
    channelCounts: summary.channelCounts,
    summary: {
      published: summary.published,
      views: summary.views,
      likes: summary.likes,
      replies: summary.replies,
      engagementRate: summary.engagementRate,
    },
  };
}

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(tenantId, async () => {
  const settings = readSettings();
  const vt = settings.viralThreshold ?? 500;
  const source = homeDataSource();
  const legacy = () => fileOverview(vt);

  if (!tenantId || source === "file") {
    return Response.json({ ...legacy(), source: tenantId ? "file-rollback" : "file-legacy" });
  }

  if (source === "shadow") {
    try {
      const file = legacy();
      const db = await dbOverview(tenantId, vt);
      const shadowMatches = logHomeShadowDiff("overview", tenantId, file, db);
      return Response.json({ ...file, source: "shadow-file", shadowMatches });
    } catch (error) {
      console.error("[home-data-shadow]", error instanceof Error ? error.message : String(error));
      return Response.json({ ...legacy(), source: "shadow-file", shadowMatches: false });
    }
  }

  try {
    return Response.json({ ...await dbOverview(tenantId, vt), source: "db" });
  } catch (error) {
    return homeDbUnavailable(error);
  }
  });
}
