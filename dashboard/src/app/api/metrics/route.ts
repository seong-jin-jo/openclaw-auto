import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { getChannelCred } from "@/lib/publish";
import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { runWithTenant } from "@/lib/tenant-context";
import {
  buildPerformanceMetricsCoverage,
  type MetricsCoverageAggregateRow,
} from "@/lib/performance-metrics-coverage";

const THREADS_API = "https://graph.threads.net/v1.0";

// 온보딩 체크리스트용: 성과 수집을 한 번이라도 돌리면 "analytics 확인" 단계 완료로 표시.
function markAnalyticsViewed(tenantId: string) {
  try {
    runWithTenant(tenantId, () => {
      const s = readJson<Record<string, unknown>>(dataPath("settings.json")) || {};
      if (s.analyticsViewed !== true) { s.analyticsViewed = true; writeJson(dataPath("settings.json"), s); }
    });
  } catch { /* 비차단 */ }
}

// GET /api/metrics?tenant_id=... — 발행물 + 성과 목록(성과 대시보드)
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) {
    return Response.json({ posts: [], coverage: buildPerformanceMetricsCoverage([]) });
  }
  try {
    const { posts, coverageRows } = await withTenant(tenantId, async (sql) => {
      const posts = await sql`
        SELECT id, platform, external_id, permalink, text, status, error, published_at,
               views, likes, replies, reposts, metrics_at
        FROM published_posts WHERE tenant_id = ${tenantId}
        ORDER BY published_at DESC LIMIT 100`;
      const coverageRows = await sql<MetricsCoverageAggregateRow[]>`
        SELECT platform,
               COUNT(*) FILTER (WHERE status = 'published')::int AS published_count,
               COUNT(*) FILTER (WHERE status = 'published' AND metrics_at IS NOT NULL)::int AS collected_count,
               MAX(metrics_at)::text AS last_collected_at
        FROM published_posts
        WHERE tenant_id = ${tenantId}
        GROUP BY platform`;
      return { posts, coverageRows };
    });
    return Response.json({ posts, coverage: buildPerformanceMetricsCoverage(coverageRows) });
  } catch (e) {
    return Response.json({
      posts: [],
      coverage: buildPerformanceMetricsCoverage([]),
      error: String(e),
    }, { status: 500 });
  }
}

// POST /api/metrics — 성과 수집 { tenant_id } (Threads insights). 토큰 필요.
export async function POST(request: Request) {
  const __b = await request.json();
  const tenant_id = await effectiveTenantId(request, __b.tenant_id);
  if (!tenant_id) return Response.json({ error: "tenant_id required" }, { status: 400 });
  const cred = await getChannelCred(tenant_id, "threads");
  if (!cred) return Response.json({ ok: false, error: "threads 채널 미연결" }, { status: 400 });
  try {
    const { updated, total } = await withTenant(tenant_id, async (sql) => {
      const rows = await sql<{ id: string; external_id: string }[]>`
        SELECT id, external_id FROM published_posts
        WHERE tenant_id = ${tenant_id} AND platform = 'threads' AND external_id IS NOT NULL`;
      let n = 0;
      for (const r of rows) {
        try {
          const resp = await fetch(`${THREADS_API}/${r.external_id}/insights?metric=views,likes,replies,reposts&access_token=${cred.token}`);
          if (!resp.ok) continue;
          const data = (await resp.json()) as { data?: { name: string; values: { value: number }[] }[] };
          const m: Record<string, number> = {};
          for (const d of data.data ?? []) m[d.name] = d.values?.[0]?.value ?? 0;
          await sql`
            UPDATE published_posts
            SET views = ${m.views ?? 0}, likes = ${m.likes ?? 0}, replies = ${m.replies ?? 0},
                reposts = ${m.reposts ?? 0}, metrics_at = now()
            WHERE id = ${r.id}`;
          n++;
        } catch { /* 개별 실패 skip */ }
      }
      return { updated: n, total: rows.length };
    });
    markAnalyticsViewed(tenant_id);
    return Response.json({ ok: true, updated, total });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
