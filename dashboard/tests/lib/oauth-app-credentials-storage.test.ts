import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  queries: [] as Array<{ sql: string; values: unknown[] }>,
  selectResult: [] as unknown[],
  selectError: null as unknown,
  beginCount: 0,
}));

vi.mock("@/lib/db", () => {
  const tagged = Object.assign(
    vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = Array.from(strings).join(" ");
      H.queries.push({ sql, values });
      if (sql.includes("FROM oauth_app_credentials")) {
        if (H.selectError) throw H.selectError;
        return H.selectResult;
      }
      if (sql.includes("INSERT INTO oauth_app_credentials")) {
        return [{ updated_at: "2026-07-28T00:00:00.000Z" }];
      }
      return [];
    }),
    {
      begin: vi.fn(async (callback: (tx: typeof tagged) => unknown) => {
        H.beginCount += 1;
        return callback(tagged);
      }),
    },
  );
  return { db: vi.fn(() => tagged) };
});

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgres://test");
  vi.stubEnv("OSMU_SECRET_KEY", "encryption-key");
  vi.stubEnv("X_CLIENT_ID", "env-id");
  vi.stubEnv("X_CLIENT_SECRET", "env-secret");
  H.queries = [];
  H.selectResult = [];
  H.selectError = null;
  H.beginCount = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("OAuth credential encrypted storage and audit", () => {
  it("updates every field and the update audit row in one transaction", async () => {
    const { upsertOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");
    const result = await upsertOAuthCredentialSet("x", {
      clientId: "new-client-id",
      clientSecret: "new-client-secret",
    });

    expect(result.updatedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(H.beginCount).toBe(1);
    const sql = H.queries.map((query) => query.sql).join("\n");
    expect(sql).toContain("INSERT INTO oauth_app_credentials");
    expect(sql).toContain("pgp_sym_encrypt");
    expect(sql).toContain("ON CONFLICT (provider) DO UPDATE");
    expect(sql).toContain("INSERT INTO oauth_credential_audit");
    expect(sql).toContain("'update'");
    expect(sql).not.toContain("new-client-secret");
  });

  it("audits reveal without placing any secret value in audit SQL", async () => {
    H.selectResult = [{
      provider: "x",
      client_id: "db-id",
      client_secret: "db-secret",
      config_id: null,
      updated_at: "2026-07-28T00:00:00.000Z",
    }];
    const { revealOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");
    const result = await revealOAuthCredentialSet("x");

    expect(result.values).toEqual({ clientId: "db-id", clientSecret: "db-secret" });
    const audit = H.queries.find((query) => query.sql.includes("oauth_credential_audit"));
    expect(audit?.sql).toContain("'reveal'");
    expect(audit?.sql).not.toContain("db-secret");
    expect(audit?.values).toEqual(["x"]);
  });

  it("missing additive table is a rollback-safe env fallback, but other DB errors fail closed", async () => {
    H.selectError = { code: "42P01" };
    const { resolveOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");
    const rollback = await resolveOAuthCredentialSet("x");
    expect(rollback).toEqual(expect.objectContaining({
      complete: true,
      source: "env",
      values: { clientId: "env-id", clientSecret: "env-secret" },
    }));

    H.selectError = { code: "28P01" };
    const dbFailure = await resolveOAuthCredentialSet("x");
    expect(dbFailure).toEqual(expect.objectContaining({
      complete: false,
      source: "db",
      values: {},
      reason: "credential_store_unavailable",
    }));
  });
});
