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

  it("keeps global tables default-deny for customers while allowing the bare owner/BYPASSRLS connection", () => {
    expect(rls).toContain("ALTER TABLE oauth_app_credentials ENABLE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_app_credentials NO FORCE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_credential_audit ENABLE ROW LEVEL SECURITY");
    expect(rls).toContain("ALTER TABLE oauth_credential_audit NO FORCE ROW LEVEL SECURITY");
    expect(rls).not.toMatch(/ALTER TABLE oauth_(app_credentials|credential_audit) FORCE ROW LEVEL SECURITY/);

    const tenantPolicyLoop = rls.match(/FOREACH t IN ARRAY ARRAY\[([\s\S]*?)\] LOOP/)?.[1] || "";
    expect(tenantPolicyLoop).not.toContain("oauth_app_credentials");
    expect(tenantPolicyLoop).not.toContain("oauth_credential_audit");
  });

  it("applies tenant policies before guarded global-table alters so additive rollback cannot abort tenant RLS", () => {
    const tenantPolicyIndex = rls.indexOf("FOREACH t IN ARRAY");
    const globalGuardIndex = rls.indexOf("to_regclass('public.oauth_app_credentials')");
    const globalAlterIndex = rls.indexOf("ALTER TABLE oauth_app_credentials ENABLE ROW LEVEL SECURITY");

    expect(tenantPolicyIndex).toBeGreaterThan(-1);
    expect(globalGuardIndex).toBeGreaterThan(tenantPolicyIndex);
    expect(globalAlterIndex).toBeGreaterThan(globalGuardIndex);
    expect(rls).toContain("to_regclass('public.oauth_credential_audit')");
  });
});
