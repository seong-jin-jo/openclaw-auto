import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  cred: { token: "secret", accountId: "22222222-2222-2222-2222-222222222222" } as { token: string; accountId: string } | null,
  creator: { username: "creator", nickname: "Creator", privacyLevels: ["SELF_ONLY"] } as Record<string, unknown> | null,
  calls: [] as unknown[][],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "11111111-1111-1111-1111-111111111111"),
  AuthError: class AuthError extends Error {},
}));
vi.mock("@/lib/db", () => ({ withTenant: vi.fn() }));
vi.mock("@/lib/publish", () => ({
  getChannelCred: vi.fn(async (...args: unknown[]) => { H.calls.push(args); return H.cred; }),
}));
vi.mock("@/lib/tiktok", () => ({ queryTikTokCreatorInfo: vi.fn(async () => H.creator) }));

describe("GET /api/tiktok/creator-info", () => {
  beforeEach(() => {
    H.cred = { token: "secret", accountId: "22222222-2222-2222-2222-222222222222" };
    H.creator = { username: "creator", nickname: "Creator", privacyLevels: ["SELF_ONLY"] };
    H.calls = [];
    vi.resetModules();
  });

  it("returns sanitized creator capabilities for the selected tenant account", async () => {
    const { GET } = await import("@/app/api/tiktok/creator-info/route");
    const response = await GET(new Request("http://localhost/api/tiktok/creator-info?account_id=33333333-3333-3333-3333-333333333333"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ connected: true, ready: true, creator: { username: "creator" } });
    expect(JSON.stringify(body)).not.toContain("secret");
    expect(H.calls[0]).toEqual(["11111111-1111-1111-1111-111111111111", "tiktok", "33333333-3333-3333-3333-333333333333"]);
  });

  it("rejects malformed account ids before credential lookup", async () => {
    const { GET } = await import("@/app/api/tiktok/creator-info/route");
    const response = await GET(new Request("http://localhost/api/tiktok/creator-info?account_id=other-tenant"));
    expect(response.status).toBe(400);
    expect(H.calls).toHaveLength(0);
  });
});
