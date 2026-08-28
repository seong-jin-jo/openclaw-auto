import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TENANT = "11111111-1111-1111-1111-111111111111";
const H = vi.hoisted(() => ({ fail: false }));

vi.mock("@/lib/tenant-auth", () => ({ effectiveTenantId: vi.fn(async () => TENANT) }));
vi.mock("@/lib/tenant-context", () => ({ runWithTenant: vi.fn(async (_tenant: string, callback: () => unknown) => callback()) }));
vi.mock("@/lib/settings-store", () => ({ readSettings: () => ({ viralThreshold: 500 }) }));
vi.mock("@/lib/popular-posts", () => ({ parsePopularPosts: () => [] }));
vi.mock("@/lib/file-io", () => ({
  dataPath: (...parts: string[]) => parts.join("/"),
  configPath: (...parts: string[]) => parts.join("/"),
  readJson: (file: string) => {
    if (file.endsWith("queue.json")) return { posts: [] };
    if (file.endsWith("growth.json")) return { records: [] };
    if (file.endsWith("jobs.json")) return { jobs: [] };
    if (file.endsWith("settings.json")) return { viralThreshold: 500 };
    return null;
  },
}));
vi.mock("@/lib/home-metrics", () => ({
  getHomeSummary: vi.fn(async () => {
    if (H.fail) throw new Error("db unavailable");
    return {
      statusCounts: { draft: 1, approved: 0, published: 0, failed: 0 },
      followers: 10,
      weekDelta: 2,
      viralPosts: [],
      channelCounts: { threads: 1, x: 0 },
      published: 1,
      views: 20,
      likes: 2,
      replies: 1,
      engagementRate: 15,
    };
  }),
  getActivityEvents: vi.fn(async () => {
    if (H.fail) throw new Error("db unavailable");
    return [{ id: "publish:1", type: "publish", text: "DB 글", channel: "threads", at: "2026-08-12T00:00:00Z" }];
  }),
  getWeeklyReport: vi.fn(async () => {
    if (H.fail) throw new Error("db unavailable");
    return {
      publishedThisWeek: 1,
      draftedThisWeek: 2,
      views: 20,
      likes: 2,
      replies: 1,
      byPlatform: { threads: 1 },
      followers: 10,
      weekDelta: 2,
      viralPosts: [],
    };
  }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  H.fail = false;
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("R-02 홈 API DB 컷오버", () => {
  it.each([
    ["overview", "@/app/api/overview/route"],
    ["activity", "@/app/api/activity/route"],
    ["weekly-report", "@/app/api/weekly-report/route"],
    ["weekly-summary", "@/app/api/weekly-summary/route"],
  ])("%s는 기본 모드에서 DB 응답만 제공한다", async (_name, modulePath) => {
    const { GET } = await import(modulePath);
    const response = await GET(new Request(`http://localhost/api/${_name}`));
    expect(response.status).toBe(200);
    expect((await response.json()).source).toBe("db");
  });

  it.each([
    ["overview", "@/app/api/overview/route"],
    ["activity", "@/app/api/activity/route"],
    ["weekly-report", "@/app/api/weekly-report/route"],
    ["weekly-summary", "@/app/api/weekly-summary/route"],
  ])("%s는 DB 실패를 파일 성공으로 위장하지 않고 503으로 닫는다", async (_name, modulePath) => {
    H.fail = true;
    const { GET } = await import(modulePath);
    const response = await GET(new Request(`http://localhost/api/${_name}`));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "home_db_unavailable", retryable: true });
  });

  it("명시적 파일 롤백과 섀도우 모드는 응답 출처를 구분한다", async () => {
    vi.stubEnv("HOME_DATA_SOURCE", "file");
    let route = await import("@/app/api/overview/route");
    let response = await route.GET(new Request("http://localhost/api/overview"));
    expect((await response.json()).source).toBe("file-rollback");

    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("SHADOW_HOME_DB", "1");
    route = await import("@/app/api/overview/route");
    response = await route.GET(new Request("http://localhost/api/overview"));
    expect(await response.json()).toMatchObject({ source: "shadow-file", shadowMatches: false });
  });
});
