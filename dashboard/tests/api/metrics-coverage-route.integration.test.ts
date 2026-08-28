import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  tenantId: "tenant-metrics" as string | null,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = (strings: TemplateStringsArray) => {
      const query = strings.join(" ").replace(/\s+/g, " ");
      if (query.includes("GROUP BY platform")) {
        return Promise.resolve([
          {
            platform: "threads",
            published_count: 2,
            collected_count: 1,
            last_collected_at: "2026-08-29T01:00:00.000Z",
          },
        ]);
      }
      return Promise.resolve([{
        id: "post-1",
        platform: "threads",
        status: "published",
        metrics_at: "2026-08-29T01:00:00.000Z",
      }]);
    };
    return callback(sql);
  }),
}));

vi.mock("@/lib/publish", () => ({ getChannelCred: vi.fn() }));
vi.mock("@/lib/file-io", () => ({ readJson: vi.fn(), writeJson: vi.fn(), dataPath: vi.fn() }));
vi.mock("@/lib/tenant-context", () => ({ runWithTenant: vi.fn() }));

beforeEach(() => {
  H.tenantId = "tenant-metrics";
  vi.resetModules();
});

describe("GET /api/metrics 성과 수집 범위 계약", () => {
  it("METRICS-COVERAGE-API-01 정상: 게시물과 함께 일곱 플랫폼 coverage를 반환한다", async () => {
    const { GET } = await import("@/app/api/metrics/route");
    const response = await GET(new Request("http://localhost/api/metrics?tenant_id=tenant-metrics"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toHaveLength(1);
    expect(body.coverage.version).toBe("v1");
    expect(body.coverage.platforms).toHaveLength(7);
    expect(body.coverage.platforms.find((item: { platform: string }) => item.platform === "threads")).toEqual(expect.objectContaining({
      collectionSupported: true,
      missingReason: expect.objectContaining({ code: "PARTIAL_COLLECTION" }),
    }));
  });

  it("METRICS-COVERAGE-API-02 거절: 작업 공간을 해석할 수 없으면 빈 게시물과 수집 전 사유만 반환한다", async () => {
    H.tenantId = null;
    const { GET } = await import("@/app/api/metrics/route");
    const response = await GET(new Request("http://localhost/api/metrics"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.posts).toEqual([]);
    expect(body.coverage.platforms.every((item: { missingReason: { code: string } }) => item.missingReason.code === "NO_PUBLISHED_POST")).toBe(true);
  });
});
