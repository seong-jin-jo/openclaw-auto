import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  queries: [] as string[],
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = (strings: TemplateStringsArray) => {
      const query = Array.from(strings).join(" ").replace(/\s+/g, " ").trim();
      H.queries.push(query);
      if (query.includes("generated_at::text FROM queue_posts")) {
        return Promise.resolve([{ id: "draft-1", text: "새 초안", generated_at: "2026-08-12T01:00:00Z" }]);
      }
      if (query.includes("count(*)::text AS count FROM queue_posts")) {
        return Promise.resolve([{ count: "4" }]);
      }
      if (query.includes("FROM queue_posts") && query.includes("GROUP BY status")) {
        return Promise.resolve([{ status: "draft", cnt: "2" }, { status: "approved", cnt: "1" }]);
      }
      if (query.includes("FROM growth_metrics")) {
        return Promise.resolve([{ followers: 120 }, { followers: 100 }]);
      }
      if (query.includes("coalesce(views, 0)")) {
        return Promise.resolve([{ id: "viral-1", text: "터진 글", views: 900, likes: 80 }]);
      }
      if (query.includes("GROUP BY platform")) {
        return Promise.resolve([{ platform: "threads", cnt: "2" }, { platform: "x", cnt: "1" }]);
      }
      if (query.includes("count(*)::text AS published")) {
        return Promise.resolve([{ published: "3", views: "1200", likes: "100", replies: "20" }]);
      }
      if (query.includes("ORDER BY published_at DESC")) {
        return Promise.resolve([
          { id: "post-1", platform: "threads", text: "첫 발행", published_at: "2026-08-12T00:00:00Z", status: "published", views: 900 },
          { id: "post-2", platform: "x", text: "실패 발행", published_at: "2026-08-11T00:00:00Z", status: "failed", views: 0 },
        ]);
      }
      if (query.includes("published_at > now()")) {
        return Promise.resolve([
          { platform: "threads", text: "A", views: 100, likes: 10, replies: 2 },
          { platform: "x", text: "B", views: 200, likes: 20, replies: 3 },
        ]);
      }
      return Promise.resolve([]);
    };
    return callback(sql);
  }),
}));

beforeEach(() => {
  H.queries = [];
});

describe("R-02 홈 DB 단일 집계", () => {
  it("성과 요약을 queue_posts·published_posts·growth_metrics에서 집계한다", async () => {
    const { getHomeSummary } = await import("@/lib/home-metrics");
    const result = await getHomeSummary("tenant-1", 500);

    expect(result).toEqual(expect.objectContaining({
      statusCounts: { draft: 2, approved: 1, published: 0, failed: 0 },
      followers: 120,
      weekDelta: 20,
      published: 3,
      views: 1200,
      likes: 100,
      replies: 20,
      engagementRate: 10,
    }));
    expect(result.channelCounts).toEqual(expect.objectContaining({ threads: 2, x: 1 }));
    expect(result.viralPosts).toHaveLength(1);
  });

  it("최근 활동을 published_posts 시간순 응답으로 변환한다", async () => {
    const { getActivityEvents } = await import("@/lib/home-metrics");
    const result = await getActivityEvents("tenant-1", 20);

    expect(result).toEqual([
      expect.objectContaining({ id: "draft:draft-1", type: "draft", text: "새 초안" }),
      expect.objectContaining({ id: "publish:post-1", type: "publish", text: "첫 발행", channel: "threads" }),
      expect.objectContaining({ id: "viral:post-1", type: "viral", views: 900 }),
      expect.objectContaining({ id: "publish:post-2", type: "publish_failed", text: "실패 발행", channel: "x" }),
    ]);
  });

  it("주간 성과도 같은 DB 테이블에서 플랫폼별로 집계한다", async () => {
    const { getWeeklyReport } = await import("@/lib/home-metrics");
    const result = await getWeeklyReport("tenant-1");

    expect(result).toEqual({
      publishedThisWeek: 2,
      draftedThisWeek: 4,
      views: 300,
      likes: 30,
      replies: 5,
      byPlatform: { threads: 1, x: 1 },
      followers: 120,
      weekDelta: 20,
      viralPosts: [],
    });
  });
});
