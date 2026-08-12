import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  rows: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = () => Promise.resolve(H.rows);
    return callback(sql);
  }),
}));

beforeEach(() => {
  vi.resetModules();
  H.rows = [];
});

describe("GET /api/studio/drafts R-02 본문 복원", () => {
  it("정규 payload.text를 그대로 반환한다", async () => {
    H.rows = [{
      id: "draft-1",
      idea: "정규 초안",
      payload: { text: { threads: "본문" }, includes: { text: true } },
      status: "draft",
      updated_at: "2026-08-12T00:00:00Z",
    }];
    const { GET } = await import("@/app/api/studio/drafts/route");
    const body = await (await GET(new Request("http://localhost/api/studio/drafts"))).json();

    expect(body.drafts[0]).toEqual(expect.objectContaining({ text: { threads: "본문" } }));
  });

  it("레거시 최상위 플랫폼 키를 text variants로 복원한다", async () => {
    H.rows = [{
      id: "draft-legacy",
      idea: "레거시 초안",
      payload: { threads: "Threads 본문", x: "X 본문", instagram: "Instagram 본문", ignored: "제외" },
      status: "draft",
      updated_at: "2026-08-12T00:00:00Z",
    }];
    const { GET } = await import("@/app/api/studio/drafts/route");
    const body = await (await GET(new Request("http://localhost/api/studio/drafts"))).json();

    expect(body.drafts[0].text).toEqual({
      threads: "Threads 본문",
      x: "X 본문",
      instagram: "Instagram 본문",
    });
  });

  it("실제 본문이 없으면 null로 반환해 UI 빈상태를 구분한다", async () => {
    H.rows = [{
      id: "draft-empty",
      idea: "빈 초안",
      payload: { img: null, includes: {} },
      status: "draft",
      updated_at: "2026-08-12T00:00:00Z",
    }];
    const { GET } = await import("@/app/api/studio/drafts/route");
    const body = await (await GET(new Request("http://localhost/api/studio/drafts"))).json();

    expect(body.drafts[0].text).toBeNull();
  });
});
