import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  upserts: [] as Array<{ provider: string; values: Record<string, string> }>,
  reveals: [] as string[],
  deletes: [] as string[],
  revealSource: "db" as "db" | "env",
}));

vi.mock("@/lib/oauth-app-credentials", async () => {
  const actual = await vi.importActual<typeof import("@/lib/oauth-app-credentials")>("@/lib/oauth-app-credentials");
  return {
    ...actual,
    listOAuthCredentialMetadata: vi.fn(async () => [{
      provider: "x",
      label: "X",
      fields: [
        { key: "clientId", env: "X_CLIENT_ID", label: "Client ID", secret: false, configured: true, maskedValue: "••••••••" },
        { key: "clientSecret", env: "X_CLIENT_SECRET", label: "Client Secret", secret: true, configured: true, maskedValue: "••••••••" },
      ],
      complete: true,
      source: "db",
      updatedAt: "2026-07-28T00:00:00.000Z",
      callbackUrl: "https://app.example/api/connect/x/callback",
      consoleUrl: "https://console.x.com/",
      docsUrl: "https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code",
      setupSteps: ["Developer Console → App → Settings → User authentication settings"],
      setupSource: "official",
    }]),
    upsertOAuthCredentialSet: vi.fn(async (provider: string, values: Record<string, string>) => {
      H.upserts.push({ provider, values });
      return { updatedAt: "2026-07-28T00:00:00.000Z" };
    }),
    revealOAuthCredentialSet: vi.fn(async (provider: string) => {
      H.reveals.push(provider);
      if (H.revealSource === "env") {
        throw new actual.OAuthCredentialSourceNotRevealableError();
      }
      return { provider, source: "db", values: { clientId: "raw-id", clientSecret: "raw-secret" } };
    }),
    deleteOAuthCredentialSet: vi.fn(async (provider: string) => {
      H.deletes.push(provider);
      return { deleted: true };
    }),
  };
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DASHBOARD_AUTH_TOKEN", "operator-token");
  vi.stubEnv("OSMU_SECRET_KEY", "encryption-key");
  H.upserts = [];
  H.reveals = [];
  H.deletes = [];
  H.revealSource = "db";
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const operatorHeaders = {
  Authorization: "Bearer operator-token",
  "Content-Type": "application/json",
};

describe("/api/operator/oauth-credentials", () => {
  it("GET returns masked metadata with no-store and never raw values", async () => {
    const { GET } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await GET(new Request("https://app.example/api/operator/oauth-credentials", {
      headers: operatorHeaders,
    }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(text).toContain("••••••••");
    expect(text).not.toContain("raw-id");
    expect(text).not.toContain("raw-secret");
  });

  it("rejects tenant/wrong tokens and non-exact Bearer syntax", async () => {
    const { GET } = await import("@/app/api/operator/oauth-credentials/route");
    for (const authorization of ["Bearer tenant-token", "bearer operator-token", "Bearer  operator-token"]) {
      const res = await GET(new Request("https://app.example/api/operator/oauth-credentials", {
        headers: { Authorization: authorization },
      }));
      expect(res.status).toBe(401);
    }
  });

  it("PUT validates provider/fields then performs one atomic set upsert without echoing raw values", async () => {
    const { PUT } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await PUT(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "PUT",
      headers: operatorHeaders,
      body: JSON.stringify({ provider: "x", values: { clientId: "new-id", clientSecret: "new-secret" } }),
    }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(H.upserts).toEqual([{ provider: "x", values: { clientId: "new-id", clientSecret: "new-secret" } }]);
    expect(text).not.toContain("new-id");
    expect(text).not.toContain("new-secret");
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("PUT rejects unknown providers, partial sets, unknown fields, and missing encryption key", async () => {
    const { PUT } = await import("@/app/api/operator/oauth-credentials/route");
    const bodies = [
      { provider: "unknown", values: { clientId: "id", clientSecret: "secret" } },
      { provider: "x", values: { clientId: "id" } },
      { provider: "x", values: { clientId: "id", clientSecret: "secret", extra: "nope" } },
    ];
    for (const body of bodies) {
      const res = await PUT(new Request("https://app.example/api/operator/oauth-credentials", {
        method: "PUT",
        headers: operatorHeaders,
        body: JSON.stringify(body),
      }));
      expect(res.status).toBe(400);
    }
    vi.stubEnv("OSMU_SECRET_KEY", "");
    const noKey = await PUT(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "PUT",
      headers: operatorHeaders,
      body: JSON.stringify({ provider: "x", values: { clientId: "id", clientSecret: "secret" } }),
    }));
    expect(noKey.status).toBe(503);
    expect(H.upserts).toHaveLength(0);
  });

  it("POST reveal requires explicit action and returns raw values only on the authenticated no-store response", async () => {
    const { POST } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({ action: "reveal", provider: "x" }),
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(body.values).toEqual({ clientId: "raw-id", clientSecret: "raw-secret" });
    expect(H.reveals).toEqual(["x"]);
  });

  it("POST reveal refuses env-source credentials without returning raw values", async () => {
    H.revealSource = "env";
    const { POST } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({ action: "reveal", provider: "x" }),
    }));
    const text = await res.text();

    expect(res.status).toBe(409);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(text).not.toContain("raw-id");
    expect(text).not.toContain("raw-secret");
  });

  it("DELETE requires exact operator auth, deletes one DB set, audits in storage, and never echoes secrets", async () => {
    const { DELETE } = await import("@/app/api/operator/oauth-credentials/route");
    const unauthorized = await DELETE(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "DELETE",
      headers: { Authorization: "bearer operator-token", "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "x" }),
    }));
    expect(unauthorized.status).toBe(401);

    const res = await DELETE(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "DELETE",
      headers: operatorHeaders,
      body: JSON.stringify({ provider: "x" }),
    }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(H.deletes).toEqual(["x"]);
    expect(text).not.toContain("raw-id");
    expect(text).not.toContain("raw-secret");
  });
});
