import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  upserts: [] as Array<{ provider: string; values: Record<string, string> }>,
  imports: [] as string[],
  reveals: [] as string[],
  deletes: [] as string[],
  credentialSource: "db" as "db" | "env",
  credentialsComplete: true,
  importFailure: null as null | "incomplete" | "already-db" | "unavailable",
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
      complete: H.credentialsComplete,
      credentialsConfigured: H.credentialsComplete,
      source: H.credentialSource,
      updatedAt: "2026-07-28T00:00:00.000Z",
      callbackUrl: "https://app.example/api/connect/x/callback",
      consoleUrl: "https://console.x.com/",
      docsUrl: "https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code",
      setupSteps: ["Developer Console → App → Settings → User authentication settings"],
      setupSource: "official",
    }]),
    upsertOAuthCredentialSet: vi.fn(async (provider: string, values: Record<string, string>) => {
      H.upserts.push({ provider, values });
      H.credentialSource = "db";
      H.credentialsComplete = true;
      return { updatedAt: "2026-07-28T00:00:00.000Z" };
    }),
    importOAuthCredentialSetFromEnv: vi.fn(async (provider: string) => {
      H.imports.push(provider);
      if (H.importFailure === "incomplete") {
        throw new actual.OAuthCredentialEnvIncompleteError(["X_CLIENT_SECRET"]);
      }
      if (H.importFailure === "already-db") {
        throw new actual.OAuthCredentialAlreadyStoredError();
      }
      if (H.importFailure === "unavailable") {
        throw new Error("credential store unavailable");
      }
      return { updatedAt: "2026-07-28T00:00:00.000Z" };
    }),
    revealOAuthCredentialSet: vi.fn(async (provider: string) => {
      H.reveals.push(provider);
      const imported = H.credentialSource === "env";
      H.credentialSource = "db";
      H.credentialsComplete = true;
      return { provider, source: "db", values: { clientId: "raw-id", clientSecret: "raw-secret" }, imported };
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
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("OSMU_SECRET_KEY", "encryption-key");
  H.upserts = [];
  H.imports = [];
  H.reveals = [];
  H.deletes = [];
  H.credentialSource = "db";
  H.credentialsComplete = true;
  H.importFailure = null;
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

  it.each(["OSMU_SECRET_KEY", "DATABASE_URL"])(
    "GET fails closed with 503 and does not resolve metadata when %s is unavailable",
    async (name) => {
      vi.stubEnv(name, "");
      const credentials = await import("@/lib/oauth-app-credentials");
      const metadata = vi.mocked(credentials.listOAuthCredentialMetadata);
      const { GET } = await import("@/app/api/operator/oauth-credentials/route");
      const res = await GET(new Request("https://app.example/api/operator/oauth-credentials", {
        headers: operatorHeaders,
      }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(body.error).toMatch(/[가-힣]/);
      expect(metadata).not.toHaveBeenCalled();
    },
  );

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

  it("PUT for an unset provider makes the next metadata response complete and DB-backed", async () => {
    H.credentialSource = "env";
    H.credentialsComplete = false;
    const { GET, PUT } = await import("@/app/api/operator/oauth-credentials/route");
    const put = await PUT(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "PUT",
      headers: operatorHeaders,
      body: JSON.stringify({ provider: "x", values: { clientId: "new-id", clientSecret: "new-secret" } }),
    }));
    const get = await GET(new Request("https://app.example/api/operator/oauth-credentials", {
      headers: operatorHeaders,
    }));
    const body = await get.json();

    expect(put.status).toBe(200);
    expect(get.status).toBe(200);
    expect(body.providers[0]).toEqual(expect.objectContaining({
      source: "db",
      complete: true,
      credentialsConfigured: true,
    }));
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

  it("POST reveal atomically imports env-source credentials and returns the DB reveal in one request", async () => {
    H.credentialSource = "env";
    const { POST } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({ action: "reveal", provider: "x" }),
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(body).toEqual({
      provider: "x",
      source: "db",
      values: { clientId: "raw-id", clientSecret: "raw-secret" },
      imported: true,
    });
    expect(H.reveals).toEqual(["x"]);
  });

  it.each(["OSMU_SECRET_KEY", "DATABASE_URL"])(
    "POST reveal fails closed with a Korean 503 reason when %s is unavailable",
    async (name) => {
      vi.stubEnv(name, "");
      const { POST } = await import("@/app/api/operator/oauth-credentials/route");
      const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
        method: "POST",
        headers: operatorHeaders,
        body: JSON.stringify({ action: "reveal", provider: "x" }),
      }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(body.error).toMatch(/[가-힣]/);
      expect(H.reveals).toEqual([]);
    },
  );

  it("POST import-env requires exact operator auth, explicit action, and returns no-store metadata without env values", async () => {
    const { POST } = await import("@/app/api/operator/oauth-credentials/route");
    const unauthorized = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: { Authorization: "Bearer tenant-token", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "import-env", provider: "x" }),
    }));
    expect(unauthorized.status).toBe(401);
    expect(unauthorized.headers.get("Cache-Control")).toContain("no-store");
    expect(H.imports).toEqual([]);

    const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({ action: "import-env", provider: "x" }),
    }));
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(H.imports).toEqual(["x"]);
    expect(text).toContain('"source":"db"');
    expect(text).not.toContain("env-id");
    expect(text).not.toContain("env-secret");
  });

  it.each([
    ["incomplete", 409, "환경변수 세트가 불완전합니다"],
    ["already-db", 409, "이미 DB에 저장된 자격증명"],
    ["unavailable", 500, "환경변수 자격증명을 가져오는 중 데이터베이스 오류"],
  ] as const)("POST import-env fails closed for %s state", async (failure, status, expectedError) => {
    H.importFailure = failure;
    const { POST } = await import("@/app/api/operator/oauth-credentials/route");
    const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
      method: "POST",
      headers: operatorHeaders,
      body: JSON.stringify({ action: "import-env", provider: "x" }),
    }));
    const text = await res.text();

    expect(res.status).toBe(status);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(text).toContain(expectedError);
    expect(text).not.toContain("env-id");
    expect(text).not.toContain("env-secret");
  });

  it.each(["OSMU_SECRET_KEY", "DATABASE_URL"])(
    "POST import-env refuses missing %s before reading or importing env credentials",
    async (name) => {
      vi.stubEnv(name, "");
      const { POST } = await import("@/app/api/operator/oauth-credentials/route");
      const res = await POST(new Request("https://app.example/api/operator/oauth-credentials", {
        method: "POST",
        headers: operatorHeaders,
        body: JSON.stringify({ action: "import-env", provider: "x" }),
      }));

      expect(res.status).toBe(503);
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(H.imports).toEqual([]);
    },
  );

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

  it.each(["OSMU_SECRET_KEY", "DATABASE_URL"])(
    "DELETE fails closed with 503 and does not touch storage when %s is unavailable",
    async (name) => {
      vi.stubEnv(name, "");
      const { DELETE } = await import("@/app/api/operator/oauth-credentials/route");
      const res = await DELETE(new Request("https://app.example/api/operator/oauth-credentials", {
        method: "DELETE",
        headers: operatorHeaders,
        body: JSON.stringify({ provider: "x" }),
      }));
      const body = await res.json();

      expect(res.status).toBe(503);
      expect(res.headers.get("Cache-Control")).toContain("no-store");
      expect(body.error).toMatch(/[가-힣]/);
      expect(H.deletes).toEqual([]);
    },
  );
});
