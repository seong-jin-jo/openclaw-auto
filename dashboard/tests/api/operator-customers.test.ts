import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const H = vi.hoisted(() => ({
  customers: [
    {
      id: "tenant-1",
      slug: "customer-one",
      name: "Customer One",
      status: "active",
      tier: "team",
      owner_auth_id: "auth-1",
      created_at: "2026-07-01T00:00:00Z",
      integrations: [],
      drafts_count: 0,
      published_count: 0,
      failed_count: 0,
      usage_events_count: 0,
      last_usage_at: null,
      shorts_used: 0,
      generations_used: 0,
    },
  ],
  authUsers: [
    {
      id: "auth-1",
      email: "owner@example.com",
      provider: "email",
      created_at: "2026-07-01T00:00:00Z",
      email_confirmed_at: "2026-07-01T00:01:00Z",
      confirmation_sent_at: null,
      recovery_sent_at: null,
      last_sign_in_at: "2026-07-02T00:00:00Z",
      tenant_id: "tenant-1",
      tenant_slug: "customer-one",
    },
  ],
  fetchUrl: "",
  fetchHeaders: {} as Record<string, string>,
  fetchBody: "",
}));

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => async (strings: TemplateStringsArray) => {
    const sql = Array.from(strings).join("");
    if (sql.includes("FROM auth.users")) return H.authUsers;
    if (sql.includes("FROM tenants t")) return H.customers;
    return [];
  }),
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DASHBOARD_AUTH_TOKEN", "op-token");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
  vi.stubEnv("OSMU_PUBLIC_URL", "https://app.example");
  H.fetchUrl = "";
  H.fetchHeaders = {};
  H.fetchBody = "";
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    H.fetchUrl = String(url);
    H.fetchHeaders = Object.fromEntries(new Headers(init?.headers).entries());
    H.fetchBody = String(init?.body || "");
    return new Response("{}", { status: 200 });
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/api/operator/customers", () => {
  it("운영자 토큰으로 tenants와 auth users를 반환하되 비밀번호 필드는 반환하지 않는다", async () => {
    const { GET } = await import("@/app/api/operator/customers/route");
    const res = await GET(new Request("https://app.example/api/operator/customers", {
      headers: { Authorization: "Bearer op-token" },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.customers[0].slug).toBe("customer-one");
    expect(body.authUsers[0].email).toBe("owner@example.com");
    expect(JSON.stringify(body)).not.toContain("encrypted_password");
    expect(JSON.stringify(body)).not.toContain("password");
  });

  it("운영자 액션은 Supabase recover로 재설정 메일만 발송한다", async () => {
    const { POST } = await import("@/app/api/operator/customers/route");
    const res = await POST(new Request("https://app.example/api/operator/customers", {
      method: "POST",
      headers: { Authorization: "Bearer op-token", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_password_reset", email: "OWNER@EXAMPLE.COM" }),
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(H.fetchUrl).toContain("https://supabase.example/auth/v1/recover");
    expect(H.fetchUrl).toContain("redirect_to=https%3A%2F%2Fapp.example%2Flogin%3Ftype%3Drecovery");
    expect(H.fetchHeaders.apikey).toBe("anon-key");
    expect(JSON.parse(H.fetchBody)).toEqual({ email: "owner@example.com" });
  });

  it("운영자 토큰이 틀리면 차단한다", async () => {
    const { GET } = await import("@/app/api/operator/customers/route");
    const res = await GET(new Request("https://app.example/api/operator/customers", {
      headers: { Authorization: "Bearer wrong" },
    }));

    expect(res.status).toBe(401);
  });
});
