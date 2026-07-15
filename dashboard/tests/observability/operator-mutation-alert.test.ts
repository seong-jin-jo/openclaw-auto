import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// /api/operator/customers POST — operator_mutation_failed 알림 경계. 성공 뮤테이션에는 알림이
// 없고, 실행 중 예외가 나면(예: DB 뮤테이션 실패) reportFailure가 action명만 담아 호출되며,
// 응답 status/body(500 + error 메시지)는 알림 유무와 무관하게 기존과 동일해야 한다.
// (고객 인증은 Google OAuth 전용 — SMTP/Resend 기반 send_password_reset 경로는 제거됐다.)

const H = vi.hoisted(() => ({
  reportCalls: [] as unknown[],
  authUsersById: {} as Record<string, { id: string; email: string | null }>,
  tenantByAuthId: {} as Record<string, { id: string }>,
}));

vi.mock("@/lib/observability", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/observability")>();
  return {
    ...actual,
    reportFailure: vi.fn(async (input: unknown) => {
      H.reportCalls.push(input);
    }),
  };
});

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const sql = Array.from(strings).join(" ");
    if (sql.includes("FROM auth.users WHERE id")) {
      const found = H.authUsersById[String(values[0])];
      return found ? [found] : [];
    }
    if (sql.includes("FROM tenants WHERE owner_auth_id")) {
      const t = H.tenantByAuthId[String(values[0])];
      return t ? [t] : [];
    }
    if (sql.includes("INSERT INTO tenants")) return [{ id: "new-tenant" }];
    if (sql.includes("UPDATE tenants SET status")) {
      if (String(values[0]) === "paused" && String(values[1]) === "tenant-throw") {
        throw new Error("db unavailable");
      }
      return [];
    }
    return [];
  }),
}));

function req(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/operator/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer operator-secret" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetModules();
  H.reportCalls = [];
  H.authUsersById = {
    "11111111-1111-1111-1111-111111111111": { id: "11111111-1111-1111-1111-111111111111", email: "owner@example.com" },
    "22222222-2222-2222-2222-222222222222": { id: "22222222-2222-2222-2222-222222222222", email: "flaky@example.com" },
  };
  H.tenantByAuthId = {
    "11111111-1111-1111-1111-111111111111": { id: "tenant-1" },
    "22222222-2222-2222-2222-222222222222": { id: "tenant-throw" },
  };
  process.env.DASHBOARD_AUTH_TOKEN = "operator-secret";
});

afterEach(() => {
  delete process.env.DASHBOARD_AUTH_TOKEN;
  vi.unstubAllGlobals();
});

describe("/api/operator/customers POST — operator_mutation_failed 알림 경계", () => {
  it("정상 계정정지(pause_user) → reportFailure 호출 안 함", async () => {
    const { POST } = await import("@/app/api/operator/customers/route");
    const res = await POST(req({ action: "pause_user", user_id: "11111111-1111-1111-1111-111111111111" }));
    expect(res.status).toBe(200);
    expect(H.reportCalls).toHaveLength(0);
  });

  it("정상 계정정지(pause_user) DB 뮤테이션 실패 → reportFailure(error, action만) 호출, 응답은 기존과 동일(500)", async () => {
    const { POST } = await import("@/app/api/operator/customers/route");
    const res = await POST(req({ action: "pause_user", user_id: "22222222-2222-2222-2222-222222222222" }));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(typeof body.error).toBe("string");
    expect(H.reportCalls).toHaveLength(1);
    const call = H.reportCalls[0] as { event: string; severity: string; context: Record<string, unknown> };
    expect(call.event).toBe("operator_mutation_failed");
    expect(call.severity).toBe("error");
    expect(call.context).toEqual({ action: "pause_user" });
  });

  it("Google OAuth 전용 정책 — send_password_reset은 unsupported(400), reportFailure 호출 안 함", async () => {
    const { POST } = await import("@/app/api/operator/customers/route");
    const res = await POST(req({ action: "send_password_reset", email: "owner@example.com" }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toMatch(/unsupported/i);
    expect(H.reportCalls).toHaveLength(0);
  });

  it("알 수 없는 user_id(404, 정상 입력검증) → reportFailure 호출 안 함", async () => {
    const { POST } = await import("@/app/api/operator/customers/route");
    const res = await POST(req({ action: "pause_user", user_id: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(404);
    expect(H.reportCalls).toHaveLength(0);
  });
});
