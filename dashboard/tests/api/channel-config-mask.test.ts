import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createTempDir, setupTestEnv, cleanupTestEnv, readTempJson } from "../helpers";
import { SECRET_MASK } from "@/lib/secret-mask";

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => null),
}));

vi.mock("@/lib/verify-channel", () => ({
  verifyChannel: vi.fn(async () => ({ verified: true, account: "@ok" })),
}));

let tmpDir: string;

function writeConfig() {
  fs.writeFileSync(path.join(tmpDir, "openclaw.json"), JSON.stringify({
    plugins: {
      entries: {
        "threads-publish": { enabled: true, config: { accessToken: "TH_REAL", userId: "1784" } },
        "x-publish": { enabled: true, config: { apiKey: "AK_REAL", apiKeySecret: "AKS_REAL", accessToken: "AT_REAL", accessTokenSecret: "ATS_REAL" } },
        "facebook-publish": { enabled: true, config: { accessToken: "FB_REAL", pageId: "990011" } },
      },
    },
  }), "utf-8");
}

const params = (channel: string) => ({ params: Promise.resolve({ channel }) });

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  writeConfig();
});

afterEach(() => cleanupTestEnv(tmpDir));

describe("/api/channel-config secret masking", () => {
  it("GET은 수동 저장된 토큰/키를 원문으로 내려보내지 않는다", async () => {
    const { GET } = await import("@/app/api/channel-config/route");
    const res = await GET(new Request("http://localhost/api/channel-config"));
    const data = await res.json();

    expect(data.threads.keys.accessToken).toBe(SECRET_MASK);
    expect(data.threads.keys.userId).toBe("1784");
    expect(data.x.keys.apiKey).toBe(SECRET_MASK);
    expect(data.x.keys.apiKeySecret).toBe(SECRET_MASK);
    expect(data.x.keys.accessToken).toBe(SECRET_MASK);
    expect(data.x.keys.accessTokenSecret).toBe(SECRET_MASK);
    expect(data.facebook.keys.accessToken).toBe(SECRET_MASK);
    expect(data.facebook.keys.pageId).toBe("990011");
    expect(JSON.stringify(data)).not.toContain("TH_REAL");
    expect(JSON.stringify(data)).not.toContain("AK_REAL");
    expect(JSON.stringify(data)).not.toContain("FB_REAL");
  });

  it("POST에 마스킹 값이 돌아오면 기존 비밀값을 덮어쓰지 않는다", async () => {
    const { POST } = await import("@/app/api/channel-config/[channel]/route");
    const req = new Request("http://localhost/api/channel-config/x", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: SECRET_MASK,
        apiKeySecret: SECRET_MASK,
        accessToken: SECRET_MASK,
        accessTokenSecret: SECRET_MASK,
      }),
    });
    const res = await POST(req, params("x"));
    expect(res.status).toBe(200);

    const config = readTempJson<{ plugins: { entries: Record<string, { config: Record<string, string> }> } }>(tmpDir, "openclaw.json")!;
    expect(config.plugins.entries["x-publish"].config).toEqual({
      apiKey: "AK_REAL",
      apiKeySecret: "AKS_REAL",
      accessToken: "AT_REAL",
      accessTokenSecret: "ATS_REAL",
    });
  });
});
