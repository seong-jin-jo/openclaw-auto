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

  it("Facebook callback exchange uses the same resolved DB app set", async () => {
    H.credentials.facebook = {
      complete: true,
      source: "db",
      values: { clientId: "db-facebook-id", clientSecret: "db-facebook-secret", configId: "db-config-id" },
    };
    const calls: string[] = [];
    const responses = [
      { access_token: "USER" },
      { access_token: "LONG_USER", expires_in: 5_184_000 },
      { data: [{ access_token: "PAGE", id: "page-1" }] },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      calls.push(String(input));
      return Response.json(responses.shift() || {});
    });
    const { exchangeFacebookCode } = await import("@/lib/social-connect");
    const result = await exchangeFacebookCode("code", "https://app.example", fetchMock);

    expect(result).toEqual(expect.objectContaining({ accessToken: "PAGE", userId: "page-1" }));
    expect(calls[0]).toContain("client_id=db-facebook-id");
    expect(calls[0]).toContain("client_secret=db-facebook-secret");
    expect(calls[1]).toContain("client_id=db-facebook-id");
    expect(calls[1]).toContain("client_secret=db-facebook-secret");
  });

  it("Facebook 장기 user token 교환 실패 시 단기 token으로 페이지를 조회하지 않는다", async () => {
    H.credentials.facebook = {
      complete: true,
      source: "db",
      values: { clientId: "db-facebook-id", clientSecret: "db-facebook-secret", configId: "db-config-id" },
    };
    const calls: string[] = [];
    const responses = [
      { access_token: "SHORT_USER" },
      { error: { message: "exchange failed" } },
    ];
    const fetchMock = vi.fn(async (input: URL | RequestInfo) => {
      calls.push(String(input));
      const body = responses.shift() || {};
      return Response.json(body, { status: "error" in body ? 400 : 200 });
    });
    const { exchangeFacebookCode } = await import("@/lib/social-connect");
    const result = await exchangeFacebookCode("code", "https://app.example", fetchMock);

    expect(result.accessToken).toBe("");
    expect(result.error).toContain("exchange failed");
    expect(calls).toHaveLength(2);
    expect(calls.some((url) => url.includes("/me/accounts"))).toBe(false);
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
