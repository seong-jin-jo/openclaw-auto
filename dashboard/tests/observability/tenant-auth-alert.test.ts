import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// lib/tenant-auth.ts — 인증 검증기/서비스 장애(503) 경계에서만 reportFailure가 호출되는지 검증.
// 무효 토큰(401)·정지 계정(403)은 정상 사용자 입력 결과일 뿐이라 알림 대상이 아니다(스팸 방지) —
// 이 회귀를 함께 고정한다. AuthError의 status/code/message(응답 계약)는 알림 추가 전과 동일해야 한다.

const H = vi.hoisted(() => ({
  reportCalls: [] as unknown[],
  supabaseResult: { status: "invalid" } as { status: "valid" | "invalid" | "unavailable"; user?: unknown },
  tenantTokenRow: null as { tenant_id: string } | null,
  tenantTokenThrows: false,
  tenantStatusThrows: false,
  tenantStatusRow: null as { status: string } | null,
}));

vi.mock("@/lib/observability", () => ({
  reportFailure: vi.fn(async (input: unknown) => {
    H.reportCalls.push(input);
  }),
}));

vi.mock("@/lib/supabase", () => ({
  verifySupabaseJwt: vi.fn(async () => H.supabaseResult),
}));

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => (strings: TemplateStringsArray) => {
    const text = strings.join("?");
    if (text.includes("tenant_tokens")) {
      if (text.includes("UPDATE")) return Promise.resolve([]); // last_used_at 비차단 갱신
      if (H.tenantTokenThrows) return Promise.reject(new Error("db unreachable"));
      return Promise.resolve(H.tenantTokenRow ? [H.tenantTokenRow] : []);
    }
    if (text.includes("FROM tenants") && text.includes("status")) {
      if (H.tenantStatusThrows) return Promise.reject(new Error("db unreachable"));
      return Promise.resolve(H.tenantStatusRow ? [H.tenantStatusRow] : []);
    }
    return Promise.resolve([]);
  }),
}));

const JWT = "aaa.bbb.cccccccccccccccccccccccccccccccccccccccccc"; // 3-part, >40(me.test.ts와 동일 형태)

function req(bearer?: string): Request {
  const headers: Record<string, string> = {};
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  return new Request("http://localhost/api/x", { headers });
}

beforeEach(() => {
  vi.resetModules();
  H.reportCalls = [];
  H.supabaseResult = { status: "invalid" };
  H.tenantTokenRow = null;
  H.tenantTokenThrows = false;
  H.tenantStatusThrows = false;
  H.tenantStatusRow = null;
  process.env.DASHBOARD_AUTH_TOKEN = "operator-secret";
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  delete process.env.DASHBOARD_AUTH_TOKEN;
  vi.unstubAllEnvs();
});

describe("tenant-auth — auth_service_unavailable 알림 경계", () => {
  it("Supabase 검증기 장애(status:unavailable) → reportFailure(critical) 호출 + AuthError(503) 그대로", async () => {
    H.supabaseResult = { status: "unavailable" };
    const { effectiveTenantId, AuthError } = await import("@/lib/tenant-auth");
    await expect(effectiveTenantId(req(JWT), null)).rejects.toMatchObject({
      status: 503,
      code: "service_unavailable",
    });
    expect(H.reportCalls).toHaveLength(1);
    const call = H.reportCalls[0] as { event: string; severity: string; context: Record<string, unknown> };
    expect(call.event).toBe("auth_service_unavailable");
    expect(call.severity).toBe("critical");
    expect(call.context.reason).toBe("supabase_jwt_verify_unreachable");
    // context에 tenant/email/token 등 PII 키가 없어야 한다(호출부 자체 계약)
    expect(Object.keys(call.context)).toEqual(["reason"]);
    void AuthError;
  });

  it("osmu 토큰 DB 조회 실패 → reportFailure(critical) 호출 + AuthError(503)", async () => {
    H.tenantTokenThrows = true;
    const { effectiveTenantId } = await import("@/lib/tenant-auth");
    await expect(effectiveTenantId(req("osmu_abc123"), null)).rejects.toMatchObject({ status: 503 });
    expect(H.reportCalls).toHaveLength(1);
    expect((H.reportCalls[0] as { context: { reason: string } }).context.reason).toBe("osmu_token_db_unreachable");
  });

  it("osmu 토큰은 유효하나 테넌트 상태 조회(DB) 실패 → reportFailure(critical) + AuthError(503)", async () => {
    H.tenantTokenRow = { tenant_id: "t-1" };
    H.tenantStatusThrows = true;
    const { effectiveTenantId } = await import("@/lib/tenant-auth");
    await expect(effectiveTenantId(req("osmu_abc123"), null)).rejects.toMatchObject({ status: 503 });
    expect(H.reportCalls).toHaveLength(1);
    expect((H.reportCalls[0] as { context: { reason: string } }).context.reason).toBe("tenant_status_db_unreachable");
  });

  it("무효 토큰(401, invalid) → reportFailure 호출 안 함 (스팸 방지)", async () => {
    H.supabaseResult = { status: "invalid" };
    const { effectiveTenantId } = await import("@/lib/tenant-auth");
    await expect(effectiveTenantId(req(JWT), null)).rejects.toMatchObject({ status: 401 });
    expect(H.reportCalls).toHaveLength(0);
  });

  it("정지 계정(403, forbidden) → reportFailure 호출 안 함", async () => {
    H.tenantTokenRow = { tenant_id: "t-1" };
    H.tenantStatusRow = { status: "paused" };
    const { effectiveTenantId } = await import("@/lib/tenant-auth");
    await expect(effectiveTenantId(req("osmu_abc123"), null)).rejects.toMatchObject({ status: 403, code: "account_paused" });
    expect(H.reportCalls).toHaveLength(0);
  });
});
