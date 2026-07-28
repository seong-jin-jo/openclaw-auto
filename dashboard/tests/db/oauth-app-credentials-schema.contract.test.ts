import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const schema = fs.readFileSync(path.resolve(process.cwd(), "db/schema.sql"), "utf8");
const rls = fs.readFileSync(path.resolve(process.cwd(), "db/rls.sql"), "utf8");

describe("global OAuth app credential schema contract", () => {
  it("adds one encrypted global row per provider plus a secret-free audit table", () => {
    expect(schema).toContain("CREATE TABLE IF NOT EXISTS oauth_app_credentials");
    expect(schema).toMatch(/provider\s+TEXT PRIMARY KEY/);
    expect(schema).toMatch(/client_id_enc\s+TEXT NOT NULL/);
    expect(schema).toMatch(/client_secret_enc\s+TEXT NOT NULL/);
    expect(schema).toMatch(/config_id_enc\s+TEXT/);
    expect(schema).toMatch(/updated_at\s+TIMESTAMPTZ NOT NULL DEFAULT now\(\)/);

    expect(schema).toContain("CREATE TABLE IF NOT EXISTS oauth_credential_audit");
    expect(schema).toMatch(/action\s+TEXT NOT NULL/);
    expect(schema).toMatch(/occurred_at\s+TIMESTAMPTZ NOT NULL DEFAULT now\(\)/);
    expect(schema).not.toMatch(/oauth_credential_audit[\s\S]{0,500}(secret|credential)_enc/i);
  });

  it("forces RLS on both global tables without adding them to tenant policies", () => {
    expect(rls).toContain("ALTER TABLE oauth_app_credentials ENABLE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_app_credentials FORCE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_credential_audit ENABLE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_credential_audit FORCE ROW LEVEL SECURITY");

    const tenantPolicyLoop = rls.match(/FOREACH t IN ARRAY ARRAY\[([\s\S]*?)\] LOOP/)?.[1] || "";
    expect(tenantPolicyLoop).not.toContain("oauth_app_credentials");
    expect(tenantPolicyLoop).not.toContain("oauth_credential_audit");
  });
});
