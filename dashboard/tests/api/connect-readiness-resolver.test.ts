import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  complete: {} as Record<string, boolean>,
  source: {} as Record<string, "db" | "env">,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/lib/oauth-app-credentials", () => ({
  resolveOAuthCredentialSet: vi.fn(async (provider: string) => ({
    provider,
    complete: Boolean(H.complete[provider]),
    source: H.source[provider] || "env",
    values: {},
    configured: [],
    missing: H.complete[provider] ? [] : ["clientSecret"],
    updatedAt: null,
  })),
}));

beforeEach(() => {
  vi.resetModules();
  H.complete = {};
  H.source = {};
});

describe("customer readiness central resolver wiring", () => {
  it("reports DB-backed readiness without exposing source secrets", async () => {
    H.complete.x = true;
    H.source.x = "db";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const text = await res.text();
    const body = JSON.parse(text);

    expect(body.providers.x).toEqual({ available: true });
    expect(text).not.toContain("clientSecret");
  });

  it("keeps a partial DB set unavailable even when env could exist", async () => {
    H.complete.facebook = false;
    H.source.facebook = "db";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.facebook.available).toBe(false);
    expect(body.providers.facebook.reason).toContain("자격증명");
  });
});
