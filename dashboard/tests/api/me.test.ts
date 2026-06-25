import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// /api/me — 고객 JWT를 운영자로 둔갑시키지 않는지(P0-2 인증 단순화 회귀).
// effectiveTenantId·db를 목으로 고정하고 Authorization 헤더 분기만 검증.

const H = vi.hoisted(() => ({
  tenantId: null as string | null,
  tenantRow: null as { id: string; slug: string; name: string } | null,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => (_s: TemplateStringsArray, ..._v: unknown[]) =>
    Promise.resolve(H.tenantRow ? [H.tenantRow] : []),
  ),
}));

async function me(authToken?: string) {
  const { GET } = await import("@/app/api/me/route");
  const headers: Record<string, string> = {};
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await GET(new Request("http://localhost/api/me", { headers }));
  return { status: res.status, body: await res.json() };
}

const OP = "operator-secret";
const JWT = "aaa.bbb.cccccccccccccccccccccccccccccccccccccccccc"; // 3-part, >40

beforeEach(() => {
  H.tenantId = null;
  H.tenantRow = null;
  process.env.DASHBOARD_AUTH_TOKEN = OP;
});

afterEach(() => {
  delete process.env.DASHBOARD_AUTH_TOKEN;
});

describe("GET /api/me — 운영자/고객 구분", () => {
  it("테넌트 해석됨 → isOperator:false + tenant", async () => {
    H.tenantId = "t-1";
    H.tenantRow = { id: "t-1", slug: "acme", name: "Acme" };
    const { body } = await me(JWT);
    expect(body.isOperator).toBe(false);
    expect(body.tenant.name).toBe("Acme");
  });

  it("운영자 토큰 + 테넌트 없음 → isOperator:true", async () => {
    const { body } = await me(OP);
    expect(body.isOperator).toBe(true);
    expect(body.tenant).toBeNull();
  });

  it("고객 JWT인데 테넌트 해석 실패 → 운영자 아님, tenantError:true", async () => {
    const { body } = await me(JWT);
    expect(body.isOperator).toBe(false);
    expect(body.tenantError).toBe(true);
  });

  it("토큰 없음 + 운영자 인증 비활성(dev) → isOperator:true", async () => {
    delete process.env.DASHBOARD_AUTH_TOKEN;
    const { body } = await me();
    expect(body.isOperator).toBe(true);
  });

  it("토큰 없음 + 운영자 토큰 설정됨(prod) → 운영자 아님(미인증 취급)", async () => {
    const { body } = await me();
    expect(body.isOperator).toBe(false);
    expect(body.tenantError).toBe(true);
  });

  it("dev(운영자 토큰 미설정) + 임의 토큰 + 테넌트 미해석 → isOperator:true (운영자 콘솔 동작)", async () => {
    delete process.env.DASHBOARD_AUTH_TOKEN;
    const { body } = await me("any-operator-token");
    expect(body.isOperator).toBe(true);
  });
});
