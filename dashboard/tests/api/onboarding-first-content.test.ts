import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupTestEnv, createTempDir, readTempJson, setupTestEnv } from "../helpers";

vi.mock("@/lib/tenant-auth", () => ({ effectiveTenantId: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ withTenant: vi.fn() }));

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
});

afterEach(() => cleanupTestEnv(tmpDir));

describe("POST /api/onboarding 첫 콘텐츠 계약", () => {
  it("FE7-API-01 정상: 채널 0개와 유효한 콘텐츠 갈래를 저장한다", async () => {
    const { POST } = await import("@/app/api/onboarding/route");
    const response = await POST(new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry: "tech", contentBranch: "text_image", channels: [] }),
    }));

    expect(response.status).toBe(200);
    const settings = readTempJson<Record<string, unknown>>(tmpDir, "settings.json");
    expect(settings).toMatchObject({
      onboardingComplete: true,
      industry: "tech",
      contentBranch: "text_image",
      channels: [],
    });
  });

  it("FE7-API-02 거절: 알 수 없는 콘텐츠 갈래는 저장하지 않는다", async () => {
    const { POST } = await import("@/app/api/onboarding/route");
    const response = await POST(new Request("http://localhost/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry: "tech", contentBranch: "audio", channels: [] }),
    }));

    expect(response.status).toBe(400);
    expect(readTempJson<Record<string, unknown>>(tmpDir, "settings.json")).toBeNull();
  });
});
