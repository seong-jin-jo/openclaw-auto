import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  credentials: {} as Record<string, {
    complete: boolean;
    source: "db" | "env";
    values: Record<string, string>;
    missing?: string[];
  }>,
}));

vi.mock("@/lib/oauth-app-credentials", () => ({
  resolveOAuthCredentialSet: vi.fn(async (provider: string) => H.credentials[provider] || {
    provider,
    complete: false,
    source: "env",
    values: {},
    configured: [],
    missing: ["clientId", "clientSecret"],
    updatedAt: null,
  }),
}));

beforeEach(() => {
  vi.resetModules();
  H.credentials = {};
});

describe("social OAuth uses the central credential resolver", () => {
  it("authorize URL uses the resolved DB client ID and Facebook configuration ID", async () => {
    H.credentials.facebook = {
      complete: true,
      source: "db",
      values: { clientId: "db-facebook-id", clientSecret: "db-facebook-secret", configId: "db-config-id" },
    };
    const { buildAuthUrl, getProvider } = await import("@/lib/social-connect");
    const url = await buildAuthUrl(getProvider("facebook")!, "https://app.example", "facebook", "state");

    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.searchParams.get("client_id")).toBe("db-facebook-id");
    expect(parsed.searchParams.get("config_id")).toBe("db-config-id");
    expect(url).not.toContain("db-facebook-secret");
  });

  it("callback code exchange uses one resolved DB set for client ID and secret", async () => {
    H.credentials.x = {
      complete: true,
      source: "db",
      values: { clientId: "db-x-id", clientSecret: "db-x-secret" },
    };
    let tokenBody = "";
    const fetchMock = vi.fn(async (_url: URL | RequestInfo, init?: RequestInit) => {
      tokenBody = String(init?.body || "");
      return new Response(JSON.stringify({ access_token: "ACCESS" }), { status: 200 });
    });
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("x", "code", "https://app.example", { codeVerifier: "verifier" }, fetchMock);

    expect(result.accessToken).toBe("ACCESS");
    expect(tokenBody).toContain("client_id=db-x-id");
    expect(tokenBody).toContain("client_secret=db-x-secret");
  });

  it("partial resolver result fails closed before any provider request", async () => {
    H.credentials.x = {
      complete: false,
      source: "db",
      values: {},
      missing: ["clientSecret"],
    };
    const fetchMock = vi.fn();
    const { exchangeCode } = await import("@/lib/social-connect");
    const result = await exchangeCode("x", "code", "https://app.example", {}, fetchMock);

    expect(result.accessToken).toBe("");
    expect(result.error).toContain("자격증명");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
