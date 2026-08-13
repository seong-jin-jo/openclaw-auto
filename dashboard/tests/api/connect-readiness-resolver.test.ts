import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  complete: {} as Record<string, boolean>,
  source: {} as Record<string, "db" | "env">,
  reason: {} as Record<string, "credential_store_unavailable" | undefined>,
  externalReview: {} as Record<string, "required" | "unknown">,
  connection: {} as Record<string, "connected" | "reconnect" | "disconnected">,
  connectionError: false,
  bulkCalls: [] as string[][],
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => "tenant-1"),
}));

vi.mock("@/lib/oauth-app-credentials", () => ({
  resolveOAuthCredentialSets: vi.fn(async (providers: string[]) => {
    H.bulkCalls.push(providers);
    return Object.fromEntries(providers.map((provider) => [provider, {
      provider,
      complete: Boolean(H.complete[provider]),
      source: H.source[provider] || "env",
      values: {},
      configured: [],
      missing: H.complete[provider] ? [] : ["clientSecret"],
      updatedAt: null,
      externalReview: H.externalReview[provider] || "unknown",
      reason: H.reason[provider],
    }]));
  }),
}));

vi.mock("@/lib/channel-connection", () => ({
  getChannelConnectionStates: vi.fn(async (_tenantId: string, providers: string[]) => {
    if (H.connectionError) throw new Error("channel account DB unavailable");
    return Object.fromEntries(providers.map((provider) => [provider, H.connection[provider] || "disconnected"]));
  }),
}));

beforeEach(() => {
  vi.resetModules();
  H.complete = {};
  H.source = {};
  H.reason = {};
  H.externalReview = {};
  H.connection = {};
  H.connectionError = false;
  H.bulkCalls = [];
});

describe("customer readiness central resolver wiring", () => {
  it("reports DB-backed readiness without exposing source secrets", async () => {
    H.complete.x = true;
    H.source.x = "db";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const text = await res.text();
    const body = JSON.parse(text);

    expect(body.providers.x).toEqual({ status: "not_connected", available: true });
    expect(text).not.toContain("clientSecret");
    expect(H.bulkCalls).toHaveLength(1);
    expect(new Set(H.bulkCalls[0])).toContain("facebook");
  });

  it("keeps a partial DB set unavailable even when env could exist", async () => {
    H.complete.facebook = false;
    H.source.facebook = "db";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.facebook).toMatchObject({ status: "opening_soon", available: false });
    expect(body.providers.facebook.reason).toContain("자격증명");
  });

  it("reports credential-store outages distinctly instead of telling customers to reconfigure OAuth", async () => {
    H.reason.x = "credential_store_unavailable";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.x).toEqual({
      status: "error",
      available: false,
      reason: "OAuth 자격증명 저장소에 일시적으로 연결할 수 없습니다. 관리자 복구 후 다시 시도해주세요.",
    });
    expect(H.bulkCalls).toHaveLength(1);
  });

  it("distinguishes tenant connection from operator readiness", async () => {
    H.complete.x = true;
    H.connection.x = "connected";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.x).toEqual({ status: "connected", available: true });
  });

  it("returns publish_pending for a connected account while external review is pending", async () => {
    H.complete.instagram = true;
    H.externalReview.instagram = "required";
    H.connection.instagram = "connected";
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.instagram).toMatchObject({
      status: "publish_pending",
      available: false,
    });
    expect(body.providers.instagram.reason).toContain("외부 앱 심사");
  });

  it("fails closed with error when tenant channel accounts cannot be read", async () => {
    H.complete.x = true;
    H.connectionError = true;
    const { GET } = await import("@/app/api/connect/readiness/route");
    const res = await GET(new Request("https://app.example/api/connect/readiness?tenant_id=tenant-1"));
    const body = await res.json();

    expect(body.providers.x).toMatchObject({ status: "error", available: false });
  });
});
