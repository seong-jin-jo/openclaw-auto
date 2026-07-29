import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  queries: [] as Array<{ sql: string; values: unknown[] }>,
  selectResult: [] as unknown[],
  selectResults: [] as unknown[][],
  selectError: null as unknown,
  deleteResult: [] as unknown[],
  insertResult: [{ updated_at: "2026-07-28T00:00:00.000Z" }] as unknown[],
  beginCount: 0,
}));

vi.mock("@/lib/db", () => {
  const tagged = Object.assign(
    vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = Array.from(strings).join(" ");
      H.queries.push({ sql, values });
      if (sql.includes("DELETE FROM oauth_app_credentials")) {
        return H.deleteResult;
      }
      if (sql.includes("FROM oauth_app_credentials")) {
        if (H.selectError) throw H.selectError;
        if (H.selectResults.length > 0) return H.selectResults.shift();
        return H.selectResult;
      }
      if (sql.includes("INSERT INTO oauth_app_credentials")) {
        return H.insertResult;
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
  H.selectResults = [];
  H.selectError = null;
  H.deleteResult = [];
  H.insertResult = [{ updated_at: "2026-07-28T00:00:00.000Z" }];
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

  it("imports one complete env set into encrypted DB storage and audits import without secret values", async () => {
    const { importOAuthCredentialSetFromEnv } = await import("@/lib/oauth-app-credentials");
    const result = await importOAuthCredentialSetFromEnv("x");

    expect(result.updatedAt).toBe("2026-07-28T00:00:00.000Z");
    expect(H.beginCount).toBe(1);
    const insert = H.queries.find((query) => query.sql.includes("INSERT INTO oauth_app_credentials"));
    const audit = H.queries.find((query) => query.sql.includes("oauth_credential_audit"));
    expect(insert?.sql).toContain("pgp_sym_encrypt");
    expect(insert?.sql).toContain("ON CONFLICT (provider) DO NOTHING");
    expect(insert?.values).toContain("env-id");
    expect(insert?.values).toContain("env-secret");
    expect(audit?.sql).toContain("'import'");
    expect(audit?.values).toEqual(["x"]);
    expect(audit?.sql).not.toContain("env-id");
    expect(audit?.sql).not.toContain("env-secret");
  });

  it("refuses incomplete env sets before opening a transaction or issuing SQL", async () => {
    vi.stubEnv("X_CLIENT_SECRET", "");
    const {
      importOAuthCredentialSetFromEnv,
      OAuthCredentialEnvIncompleteError,
    } = await import("@/lib/oauth-app-credentials");

    await expect(importOAuthCredentialSetFromEnv("x")).rejects.toBeInstanceOf(
      OAuthCredentialEnvIncompleteError,
    );
    expect(H.beginCount).toBe(0);
    expect(H.queries).toEqual([]);
  });

  it("never overwrites or mixes an existing DB set during env import", async () => {
    H.insertResult = [];
    const {
      importOAuthCredentialSetFromEnv,
      OAuthCredentialAlreadyStoredError,
    } = await import("@/lib/oauth-app-credentials");

    await expect(importOAuthCredentialSetFromEnv("x")).rejects.toBeInstanceOf(
      OAuthCredentialAlreadyStoredError,
    );
    expect(H.beginCount).toBe(1);
    expect(H.queries.some((query) => query.sql.includes("oauth_credential_audit"))).toBe(false);
    const insert = H.queries.find((query) => query.sql.includes("INSERT INTO oauth_app_credentials"));
    expect(insert?.sql).not.toContain("DO UPDATE");
  });

  it.each([
    ["DATABASE_URL", ""],
    ["OSMU_SECRET_KEY", ""],
  ])("fails closed without SQL when %s is unavailable", async (name, value) => {
    vi.stubEnv(name, value);
    const { importOAuthCredentialSetFromEnv } = await import("@/lib/oauth-app-credentials");

    await expect(importOAuthCredentialSetFromEnv("x")).rejects.toThrow("credential store unavailable");
    expect(H.beginCount).toBe(0);
    expect(H.queries).toEqual([]);
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

  it("atomically imports a complete env set and reveals the DB round-trip with both secret-free audits", async () => {
    H.selectResults = [
      [],
      [{
        provider: "x",
        client_id: "env-id",
        client_secret: "env-secret",
        config_id: null,
        updated_at: "2026-07-30T00:00:00.000Z",
      }],
    ];
    const { revealOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");

    const result = await revealOAuthCredentialSet("x");

    expect(result).toEqual({
      provider: "x",
      source: "db",
      values: { clientId: "env-id", clientSecret: "env-secret" },
      imported: true,
    });
    expect(H.beginCount).toBe(1);
    const insert = H.queries.find((query) => query.sql.includes("INSERT INTO oauth_app_credentials"));
    expect(insert?.sql).toContain("ON CONFLICT (provider) DO NOTHING");
    const audits = H.queries.filter((query) => query.sql.includes("oauth_credential_audit"));
    expect(audits).toHaveLength(2);
    expect(audits[0]?.sql).toContain("'import'");
    expect(audits[1]?.sql).toContain("'reveal'");
    expect(JSON.stringify(audits)).not.toContain("env-secret");
  });

  it("reveals an existing DB set without overwriting it from env", async () => {
    H.selectResult = [{
      provider: "x",
      client_id: "db-id",
      client_secret: "db-secret",
      config_id: null,
      updated_at: "2026-07-30T00:00:00.000Z",
    }];
    const { revealOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");

    const result = await revealOAuthCredentialSet("x");

    expect(result).toEqual(expect.objectContaining({
      source: "db",
      values: { clientId: "db-id", clientSecret: "db-secret" },
      imported: false,
    }));
    expect(H.queries.some((query) => query.sql.includes("INSERT INTO oauth_app_credentials"))).toBe(false);
    const audits = H.queries.filter((query) => query.sql.includes("oauth_credential_audit"));
    expect(audits).toHaveLength(1);
    expect(audits[0]?.sql).toContain("'reveal'");
  });

  it("bulk-resolves every requested provider with one decrypt query while preserving env fallback per missing row", async () => {
    vi.stubEnv("SLACK_CLIENT_ID", "env-slack-id");
    vi.stubEnv("SLACK_CLIENT_SECRET", "env-slack-secret");
    H.selectResult = [{
      provider: "x",
      client_id: "db-x-id",
      client_secret: "db-x-secret",
      config_id: null,
      updated_at: "2026-07-28T00:00:00.000Z",
    }];
    const { resolveOAuthCredentialSets } = await import("@/lib/oauth-app-credentials");
    const resolved = await resolveOAuthCredentialSets(["x", "slack"]);

    expect(H.queries.filter((query) => query.sql.includes("FROM oauth_app_credentials"))).toHaveLength(1);
    expect(resolved.x).toEqual(expect.objectContaining({
      complete: true,
      source: "db",
      values: { clientId: "db-x-id", clientSecret: "db-x-secret" },
    }));
    expect(resolved.slack).toEqual(expect.objectContaining({
      complete: true,
      source: "env",
      values: { clientId: "env-slack-id", clientSecret: "env-slack-secret" },
    }));
  });

  it("builds the full Admin metadata list from one bulk credential query", async () => {
    const { listOAuthCredentialMetadata, OAUTH_CREDENTIAL_DEFINITIONS } = await import(
      "@/lib/oauth-app-credentials"
    );
    const metadata = await listOAuthCredentialMetadata("https://app.example");

    expect(metadata).toHaveLength(Object.keys(OAUTH_CREDENTIAL_DEFINITIONS).length);
    expect(H.queries.filter((query) => query.sql.includes("FROM oauth_app_credentials"))).toHaveLength(1);
  });

  it.each(["DATABASE_URL", "OSMU_SECRET_KEY"])(
    "marks every Admin provider unavailable without querying or trusting env fallback when %s is absent",
    async (name) => {
      vi.stubEnv(name, "");
      const { listOAuthCredentialMetadata, OAUTH_CREDENTIAL_DEFINITIONS } = await import(
        "@/lib/oauth-app-credentials"
      );

      const metadata = await listOAuthCredentialMetadata("https://app.example");

      expect(metadata).toHaveLength(Object.keys(OAUTH_CREDENTIAL_DEFINITIONS).length);
      expect(metadata.every((item) => (
        item.credentialsConfigured === false
        && item.complete === false
        && item.unavailableReason === "credential_store_unavailable"
      ))).toBe(true);
      expect(H.queries).toEqual([]);
    },
  );

  it("deletes one DB set and writes a secret-free delete audit in the same transaction", async () => {
    H.deleteResult = [{ provider: "x" }];
    const { deleteOAuthCredentialSet } = await import("@/lib/oauth-app-credentials");
    const result = await deleteOAuthCredentialSet("x");

    expect(result).toEqual({ deleted: true });
    expect(H.beginCount).toBe(1);
    const deleteQuery = H.queries.find((query) => query.sql.includes("DELETE FROM oauth_app_credentials"));
    const auditQuery = H.queries.find((query) => query.sql.includes("oauth_credential_audit"));
    expect(deleteQuery?.values).toEqual(["x"]);
    expect(auditQuery?.sql).toContain("'delete'");
    expect(auditQuery?.values).toEqual(["x"]);
    expect(JSON.stringify(H.queries)).not.toContain("env-secret");
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
