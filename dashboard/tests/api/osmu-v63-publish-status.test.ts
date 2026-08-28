import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  tenantId: "11111111-1111-4111-8111-111111111111" as string | null,
  rows: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = () => Promise.resolve(H.rows);
    sql.json = (value: unknown) => value;
    return callback(sql);
  }),
}));

describe("BE-V63-06 플랫폼별 발행 진행 상태 통합", () => {
  const draftId = "13730d99-a268-47de-9cf9-90157ea1fa79";

  beforeEach(() => {
    H.tenantId = "11111111-1111-4111-8111-111111111111";
    H.rows = [];
  });

  async function status(query = `draft_id=${draftId}`) {
    const { GET } = await import("@/app/api/publish/route");
    return GET(new Request(`http://localhost/api/publish?${query}`));
  }

  it("BE-V63-06 정상 경로: 일곱 플랫폼의 최신 상태와 URL을 한 응답으로 합친다", async () => {
    H.rows = [
      { platform: "threads", status: "published", external_id: "th-1", provider_post_id: null, permalink: "https://example.invalid/th-1", error: null, published_at: "2026-08-27T10:00:00Z" },
      { platform: "instagram_reels", status: "in_progress", external_id: "reel-job-1", provider_post_id: null, permalink: null, error: null, published_at: "2026-08-27T10:01:00Z" },
      { platform: "tiktok", status: "failed", external_id: "tt-job-1", provider_post_id: null, permalink: null, error: "publish failed", published_at: "2026-08-27T10:02:00Z" },
    ];
    const response = await status();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.overall).toBe("in_progress");
    expect(body.summary).toEqual({ total: 7, queued: 4, processing: 1, published: 1, failed: 1 });
    expect(body.targets.find((target: { platform: string }) => target.platform === "reels")).toMatchObject({
      status: "processing",
      externalId: "reel-job-1",
      stop: { supported: false },
    });
  });

  it("BE-V63-06 거절 경로: 알 수 없는 플랫폼은 DB 조회 전에 400으로 거절한다", async () => {
    const response = await status(`draft_id=${draftId}&platforms=threads,myspace`);
    expect(response.status).toBe(400);
  });
});
