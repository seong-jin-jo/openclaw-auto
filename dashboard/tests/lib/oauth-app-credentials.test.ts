import { describe, expect, it } from "vitest";
import {
  resolveCredentialSet,
  type OAuthCredentialDefinition,
  type StoredOAuthCredentialRow,
} from "@/lib/oauth-app-credentials";

const definition: OAuthCredentialDefinition = {
  provider: "facebook",
  fields: [
    { key: "clientId", env: "FB_APP_ID", label: "App ID", secret: false },
    { key: "clientSecret", env: "FB_APP_SECRET", label: "App Secret", secret: true },
    { key: "configId", env: "FB_CONFIG_ID", label: "Configuration ID", secret: false },
  ],
};

function dbRow(values: Partial<Record<"clientId" | "clientSecret" | "configId", string>>): StoredOAuthCredentialRow {
  return {
    provider: "facebook",
    client_id: values.clientId ?? null,
    client_secret: values.clientSecret ?? null,
    config_id: values.configId ?? null,
    updated_at: "2026-07-28T00:00:00.000Z",
  };
}

describe("OAuth credential resolver set semantics", () => {
  it("a complete DB set wins over a complete env set", () => {
    const result = resolveCredentialSet(
      definition,
      dbRow({ clientId: "db-id", clientSecret: "db-secret", configId: "db-config" }),
      { FB_APP_ID: "env-id", FB_APP_SECRET: "env-secret", FB_CONFIG_ID: "env-config" },
    );

    expect(result).toEqual(expect.objectContaining({
      complete: true,
      source: "db",
      values: { clientId: "db-id", clientSecret: "db-secret", configId: "db-config" },
    }));
  });

  it("no DB row falls back to a complete env set", () => {
    const result = resolveCredentialSet(
      definition,
      null,
      { FB_APP_ID: "env-id", FB_APP_SECRET: "env-secret", FB_CONFIG_ID: "env-config" },
    );

    expect(result).toEqual(expect.objectContaining({
      complete: true,
      source: "env",
      values: { clientId: "env-id", clientSecret: "env-secret", configId: "env-config" },
    }));
  });

  it("a partial DB row fails closed and never fills missing fields from env", () => {
    const result = resolveCredentialSet(
      definition,
      dbRow({ clientId: "db-id", clientSecret: "db-secret" }),
      { FB_APP_ID: "env-id", FB_APP_SECRET: "env-secret", FB_CONFIG_ID: "env-config" },
    );

    expect(result.complete).toBe(false);
    expect(result.source).toBe("db");
    expect(result.missing).toEqual(["configId"]);
    expect(result.values).toEqual({});
    expect(JSON.stringify(result)).not.toContain("env-config");
  });

  it("a partial env set also fails closed without returning usable values", () => {
    const result = resolveCredentialSet(
      definition,
      null,
      { FB_APP_ID: "env-id", FB_APP_SECRET: "env-secret" },
    );

    expect(result.complete).toBe(false);
    expect(result.source).toBe("env");
    expect(result.values).toEqual({});
    expect(result.missing).toEqual(["configId"]);
  });
});
