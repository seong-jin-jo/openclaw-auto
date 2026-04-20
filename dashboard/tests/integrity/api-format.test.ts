import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTempDir, setupTestEnv, cleanupTestEnv, copyFixture } from "../helpers";

let tempDir: string;

beforeEach(() => {
  tempDir = createTempDir();
  copyFixture(tempDir, "queue.json");
  copyFixture(tempDir, "settings.json");
  copyFixture(tempDir, "openclaw.json");
  copyFixture(tempDir, "growth.json");
  copyFixture(tempDir, "channel-settings.json");
  setupTestEnv(tempDir);
});

afterEach(() => {
  cleanupTestEnv(tempDir);
});

describe("API response format integrity", () => {
  it("/api/overview returns required keys", async () => {
    vi.resetModules();
    process.env.DATA_DIR = tempDir;
    process.env.CONFIG_DIR = tempDir;
    const { GET } = await import("../../src/app/api/overview/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty("statusCounts");
    expect(data).toHaveProperty("followers");
    expect(data).toHaveProperty("weekDelta");
    expect(data).toHaveProperty("viralPosts");
    expect(data).toHaveProperty("popularPostsCount");
    expect(data).toHaveProperty("channelCounts");
  });

  it("/api/queue returns {posts, total}", async () => {
    vi.resetModules();
    process.env.DATA_DIR = tempDir;
    process.env.CONFIG_DIR = tempDir;
    const { GET } = await import("../../src/app/api/queue/route");
    const req = new Request("http://localhost/api/queue");
    const res = await GET(req);
    const data = await res.json();
    expect(data).toHaveProperty("posts");
    expect(data).toHaveProperty("total");
    expect(Array.isArray(data.posts)).toBe(true);
    expect(typeof data.total).toBe("number");
  });

  it("/api/cron-status returns {jobs}", async () => {
    vi.resetModules();
    process.env.DATA_DIR = tempDir;
    process.env.CONFIG_DIR = tempDir;
    const { GET } = await import("../../src/app/api/cron-status/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty("jobs");
    expect(Array.isArray(data.jobs)).toBe(true);
  });

  it("/api/channel-config returns threads and x keys", async () => {
    vi.resetModules();
    process.env.DATA_DIR = tempDir;
    process.env.CONFIG_DIR = tempDir;
    const { GET } = await import("../../src/app/api/channel-config/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty("threads");
    expect(data).toHaveProperty("x");
    expect(data.threads).toHaveProperty("keys");
    expect(data.x).toHaveProperty("keys");
  });

  it("/api/notification-settings returns 4 event keys", async () => {
    vi.resetModules();
    process.env.DATA_DIR = tempDir;
    process.env.CONFIG_DIR = tempDir;
    const { GET } = await import("../../src/app/api/notification-settings/route");
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveProperty("onPublish");
    expect(data).toHaveProperty("onViral");
    expect(data).toHaveProperty("onError");
    expect(data).toHaveProperty("weeklyReport");
  });
});
