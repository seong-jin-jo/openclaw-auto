import { db, withTenant, type Tenant, type Tier } from "@/lib/db";

// GET /api/analytics — 성과 분석 집계 (DB-backed, 멀티테넌트)
//   ?tenant_id=<UUID>  → 해당 테넌트 단일 상세 분석 (withTenant 경유 = L1 RLS)
//   (tenant_id 없음)   → 크로스테넌트 뷰: 전 테넌트 요약 비교 (tenants는 RLS 제외라 bare db()로 목록 후 테넌트별 withTenant)
//   ?tier=team|private → 기본 team (P4 tier 라우팅). 잘못된 값은 team으로 폴백.
//
// 단방향 읽기 전용. published_posts(플랫폼별 합계 + 터진 글 top) + growth_metrics(채널별 최근 팔로워).

// postgres.js는 bigint/numeric을 문자열로 돌려줄 수 있어 방어적으로 숫자 변환.
function num(v: unknown): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

type PlatformAggRow = {
  platform: string;
  published: unknown;
  views: unknown;
  likes: unknown;
  replies: unknown;
  reposts: unknown;
};

type TopPostRow = {
  id: string;
  platform: string;
  permalink: string | null;
  text: string | null;
  views: unknown;
  likes: unknown;
  replies: unknown;
  reposts: unknown;
  published_at: string;
};

type FollowerRow = {
  channel: string;
  followers: unknown;
  following: unknown;
  recorded_at: string;
};

type TotalsRow = {
  published: unknown;
  views: unknown;
  likes: unknown;
  replies: unknown;
  reposts: unknown;
};

// 단일 테넌트 상세 집계 — withTenant 트랜잭션 내에서 RLS 적용.
async function tenantDetail(tenantId: string, tier: Tier) {
  return withTenant(
    tenantId,
    async (sql) => {
      // 플랫폼별 합계 (발행수 + views/likes/replies/reposts)
      const platforms = await sql<PlatformAggRow[]>`
        SELECT platform,
               COUNT(*) FILTER (WHERE status = 'published') AS published,
               COALESCE(SUM(views), 0)    AS views,
               COALESCE(SUM(likes), 0)    AS likes,
               COALESCE(SUM(replies), 0)  AS replies,
               COALESCE(SUM(reposts), 0)  AS reposts
        FROM published_posts
        WHERE tenant_id = ${tenantId}
        GROUP BY platform
        ORDER BY COALESCE(SUM(views), 0) DESC`;

      // 터진 글 top 10 (views 내림차순)
      const top = await sql<TopPostRow[]>`
        SELECT id, platform, permalink, text, views, likes, replies, reposts, published_at
        FROM published_posts
        WHERE tenant_id = ${tenantId} AND status = 'published'
        ORDER BY COALESCE(views, 0) DESC, published_at DESC
        LIMIT 10`;

      // 채널별 최근 팔로워(가장 최근 1행만)
      const followers = await sql<FollowerRow[]>`
        SELECT DISTINCT ON (channel) channel, followers, following, recorded_at
        FROM growth_metrics
        WHERE tenant_id = ${tenantId}
        ORDER BY channel, recorded_at DESC`;

      return { platforms, top, followers };
    },
    tier,
  );
}

// 테넌트 1건 요약(크로스테넌트 행) — totals + 팔로워 합.
async function tenantSummary(tenantId: string, tier: Tier) {
  return withTenant(
    tenantId,
    async (sql) => {
      const [totals] = await sql<TotalsRow[]>`
        SELECT COUNT(*) FILTER (WHERE status = 'published') AS published,
               COALESCE(SUM(views), 0)    AS views,
               COALESCE(SUM(likes), 0)    AS likes,
               COALESCE(SUM(replies), 0)  AS replies,
               COALESCE(SUM(reposts), 0)  AS reposts
        FROM published_posts
        WHERE tenant_id = ${tenantId}`;

      // 채널별 최근 팔로워의 합 = 총 팔로워
      const [fol] = await sql<{ followers: unknown }[]>`
        SELECT COALESCE(SUM(followers), 0) AS followers
        FROM (
          SELECT DISTINCT ON (channel) channel, followers
          FROM growth_metrics
          WHERE tenant_id = ${tenantId}
          ORDER BY channel, recorded_at DESC
        ) latest`;

      return {
        published: num(totals?.published),
        views: num(totals?.views),
        likes: num(totals?.likes),
        replies: num(totals?.replies),
        reposts: num(totals?.reposts),
        followers: num(fol?.followers),
      };
    },
    tier,
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant_id");
  const tierParam = url.searchParams.get("tier");
  const tier: Tier = tierParam === "private" ? "private" : "team"; // 기본 team

  // ── 단일 테넌트 상세 ──
  if (tenantId) {
    try {
      const { platforms, top, followers } = await tenantDetail(tenantId, tier);

      const totals = platforms.reduce(
        (acc, p) => {
          acc.published += num(p.published);
          acc.views += num(p.views);
          acc.likes += num(p.likes);
          acc.replies += num(p.replies);
          acc.reposts += num(p.reposts);
          return acc;
        },
        { published: 0, views: 0, likes: 0, replies: 0, reposts: 0 },
      );

      return Response.json({
        tenant_id: tenantId,
        totals,
        platforms: platforms.map((p) => ({
          platform: p.platform,
          published: num(p.published),
          views: num(p.views),
          likes: num(p.likes),
          replies: num(p.replies),
          reposts: num(p.reposts),
        })),
        topPosts: top.map((t) => ({
          id: t.id,
          platform: t.platform,
          permalink: t.permalink,
          text: (t.text ?? "").slice(0, 120),
          views: num(t.views),
          likes: num(t.likes),
          replies: num(t.replies),
          reposts: num(t.reposts),
          publishedAt: t.published_at,
        })),
        followers: followers.map((f) => ({
          channel: f.channel,
          followers: num(f.followers),
          following: num(f.following),
          recordedAt: f.recorded_at,
        })),
      });
    } catch (e) {
      return Response.json(
        { tenant_id: tenantId, totals: null, platforms: [], topPosts: [], followers: [], error: String(e) },
        { status: 500 },
      );
    }
  }

  // ── 크로스테넌트 뷰 (tenant_id 없음) ──
  try {
    // tenants는 RLS 제외 — bare db()로 활성 테넌트 목록 조회.
    const sql = db();
    const tenants = await sql<Tenant[]>`
      SELECT id, slug, name, status, created_at
      FROM tenants WHERE status = 'active' ORDER BY created_at`;

    // 테넌트별 요약을 각각 withTenant(RLS)로 집계.
    const rows = await Promise.all(
      tenants.map(async (t) => {
        try {
          const s = await tenantSummary(t.id, tier);
          return { tenant_id: t.id, slug: t.slug, name: t.name, ...s };
        } catch (e) {
          return {
            tenant_id: t.id,
            slug: t.slug,
            name: t.name,
            published: 0,
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            followers: 0,
            error: String(e),
          };
        }
      }),
    );

    const grand = rows.reduce(
      (acc, r) => {
        acc.published += r.published;
        acc.views += r.views;
        acc.likes += r.likes;
        acc.replies += r.replies;
        acc.reposts += r.reposts;
        acc.followers += r.followers;
        return acc;
      },
      { published: 0, views: 0, likes: 0, replies: 0, reposts: 0, followers: 0 },
    );

    return Response.json({ crossTenant: true, totals: grand, tenants: rows });
  } catch (e) {
    return Response.json({ crossTenant: true, totals: null, tenants: [], error: String(e) }, { status: 500 });
  }
}
