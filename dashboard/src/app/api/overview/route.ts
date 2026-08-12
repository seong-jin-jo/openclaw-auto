import { readJson, dataPath } from "@/lib/file-io";
import { readSettings } from "@/lib/settings-store";
import { parsePopularPosts } from "@/lib/popular-posts";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getHomeSummary } from "@/lib/home-metrics";

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
export async function GET(request: Request) {
  const __t = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(__t, async () => {
  const settings = readSettings();
  const vt = settings.viralThreshold ?? 500;

  if (__t) {
    try {
      const summary = await getHomeSummary(__t, vt);
      const popular = parsePopularPosts();
      const popularSourceCounts: Record<string, number> = {};
      for (const pp of popular) {
        const src = pp.source || "unknown";
        popularSourceCounts[src] = (popularSourceCounts[src] || 0) + 1;
      }
      return Response.json({
        statusCounts: summary.statusCounts,
        followers: summary.followers,
        weekDelta: summary.weekDelta,
        viralPosts: summary.viralPosts,
        popularPostsCount: popular.length,
        popularSourceCounts,
        channelCounts: summary.channelCounts,
        // F3 성과 요약 1블록이 바로 쓰는 단일 소스 집계(published_posts)
        summary: {
          published: summary.published,
          views: summary.views,
          likes: summary.likes,
          replies: summary.replies,
          engagementRate: summary.engagementRate,
        },
        source: "db",
      });
    } catch {
      // DB 미가용. 파일 폴백으로 계속한다. 무중단 롤백 경로다.
    }
  }

  const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
  const posts = queue.posts || [];
  const statusCounts = {
    draft: posts.filter((p) => p.status === "draft").length,
    approved: posts.filter((p) => p.status === "approved").length,
    published: posts.filter((p) => p.status === "published").length,
    failed: posts.filter((p) => p.status === "failed").length,
  };
  interface GrowthData { records: Array<{ followers: number; date: string }> }
  const growth = readJson<GrowthData>(dataPath("growth.json")) || { records: [] };
  const records = growth.records || [];
  const followers = records.length ? records[records.length - 1].followers : null;
  let weekDelta: number | null = null;
  if (records.length >= 2) {
    const weekRecords = records.slice(-7);
    weekDelta = weekRecords[weekRecords.length - 1].followers - weekRecords[0].followers;
  }
  const viralPosts = posts
    .filter((p) => (p.engagement?.views ?? 0) >= vt)
    .map((p) => ({ id: p.id, text: p.text?.slice(0, 80), views: p.engagement?.views ?? 0, likes: p.engagement?.likes ?? 0 }));
  const popular = parsePopularPosts();
  const popularSourceCounts: Record<string, number> = {};
  for (const pp of popular) {
    const src = pp.source || "unknown";
    popularSourceCounts[src] = (popularSourceCounts[src] || 0) + 1;
  }
  const channelCounts: Record<string, number> = { threads: 0, x: 0 };
  for (const p of posts) {
    const ch = p.channels || {};
    if (ch.threads?.status === "published") channelCounts.threads++;
    if (ch.x?.status === "published") channelCounts.x++;
  }
  return Response.json({
    statusCounts, followers, weekDelta, viralPosts, popularPostsCount: popular.length,
    popularSourceCounts, channelCounts, source: "file-fallback",
  });
  });
}
