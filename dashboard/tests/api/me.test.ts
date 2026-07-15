import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// /api/me — 고객 JWT를 운영자로 둔갑시키지 않는지(P0-2 인증 단순화 회귀).
// effectiveTenantId·db를 목으로 고정하고 Authorization 헤더 분기만 검증.

const H = vi.hoisted(() => {
  class AuthErrorMock extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.name = "AuthError";
      this.status = status;
      this.code = code;
    }
  }
  return {
    tenantId: null as string | null,
    tenantRow: null as { id: string; slug: string; name: string; status?: string; shared_cli_approved_at?: string | null } | null,
    effectiveThrows: null as { status: number; code: string; message: string } | null,
    AuthErrorMock,
  };
});

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => {
    if (H.effectiveThrows) {
      throw new H.AuthErrorMock(H.effectiveThrows.status, H.effectiveThrows.code, H.effectiveThrows.message);
    }
    return H.tenantId;
  }),
  AuthError: H.AuthErrorMock,
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
  H.effectiveThrows = null;
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

describe("GET /api/me — 계정 게이트(paused/unavailable만, active는 항상 통과) + sharedAiApproved", () => {
  it("레거시 pending 테넌트(신규 가입은 더 이상 이 값을 안 씀) → 200 + accountUnavailable:true (effectiveTenantId는 allowInactive라 throw하지 않음)", async () => {
    H.tenantId = "t-pending";
    H.tenantRow = { id: "t-pending", slug: "acme", name: "Acme", status: "pending" };
    const { status, body } = await me(JWT);
    expect(status).toBe(200);
    expect(body.isOperator).toBe(false);
    expect(body.accountUnavailable).toBe(true);
    expect(body.accessPaused).toBeUndefined();
    expect(body.tenant.status).toBe("pending");
  });

  it("paused 테넌트 → 200 + accessPaused:true", async () => {
    H.tenantId = "t-paused";
    H.tenantRow = { id: "t-paused", slug: "acme", name: "Acme", status: "paused" };
    const { status, body } = await me(JWT);
    expect(status).toBe(200);
    expect(body.accessPaused).toBe(true);
    expect(body.accountUnavailable).toBeUndefined();
    expect(body.tenant.status).toBe("paused");
  });

  it("active 테넌트 → accessPaused/accountUnavailable 둘 다 없음(정상 페이로드), sharedAiApproved는 shared_cli_approved_at 유무를 그대로 반영", async () => {
    H.tenantId = "t-active";
    H.tenantRow = { id: "t-active", slug: "acme", name: "Acme", status: "active", shared_cli_approved_at: null };
    const { body } = await me(JWT);
    expect(body.accessPaused).toBeUndefined();
    expect(body.accountUnavailable).toBeUndefined();
    expect(body.tenant.name).toBe("Acme");
    expect(body.tenant.status).toBe("active");
    expect(body.sharedAiApproved).toBe(false);
  });

  it("active + 공유 AI 승인된 테넌트 → sharedAiApproved:true", async () => {
    H.tenantId = "t-approved";
    H.tenantRow = { id: "t-approved", slug: "acme", name: "Acme", status: "active", shared_cli_approved_at: "2026-07-14T00:00:00Z" };
    const { body } = await me(JWT);
    expect(body.sharedAiApproved).toBe(true);
    expect(body.accessPaused).toBeUndefined();
    expect(body.accountUnavailable).toBeUndefined();
  });

  it("무효 토큰(AuthError 401) → 운영자로 둔갑하지 않고 401 그대로 전달", async () => {
    H.effectiveThrows = { status: 401, code: "invalid_token", message: "유효하지 않은 세션 토큰" };
    const { status, body } = await me(JWT);
    expect(status).toBe(401);
    expect(body.isOperator).toBeUndefined();
    expect(body.code).toBe("invalid_token");
  });

  it("검증기 장애(AuthError 503) → 503 그대로 전달, 운영자 아님", async () => {
    H.effectiveThrows = { status: 503, code: "service_unavailable", message: "세션 토큰 검증 불가" };
    const { status, body } = await me(JWT);
    expect(status).toBe(503);
    expect(body.isOperator).toBeUndefined();
  });
});
