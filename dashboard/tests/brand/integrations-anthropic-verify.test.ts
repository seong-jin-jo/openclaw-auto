import { describe, it, expect, beforeEach, vi } from "vitest";

// A3 검증 — Anthropic 키는 저장 전 실제 호출로 유효성 검사. 잘못된 키는 400으로 거부(저장 안 함),
// 유효 키는 저장. anthropic 외 kind는 검증 스킵. fetch를 모킹해 키별 응답을 흉내.

const H = vi.hoisted(() => ({
  tenantId: "tenant-1" as string | null,
  inserts: 0,
  fetchStatus: 200,
  fetchCalls: 0,
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async (_req: Request, fb?: string | null) => H.tenantId ?? fb ?? null),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, cb: (sql: unknown) => unknown) => {
    const sql = Object.assign(
      () => {
        H.inserts++;
        return Promise.resolve([]);
      },
      { json: (v: unknown) => v },
    );
    return cb(sql);
  }),
}));

async function postIntegration(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/integrations/route");
  const res = await POST(
    new Request("http://localhost/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  vi.resetModules();
  H.tenantId = "tenant-1";
  H.inserts = 0;
  H.fetchStatus = 200;
  H.fetchCalls = 0;
  process.env.OSMU_SECRET_KEY = "test-secret";
  vi.stubGlobal("fetch", vi.fn(async () => {
    H.fetchCalls++;
    return new Response(H.fetchStatus === 200 ? '{"content":[{"text":"x"}]}' : "err", { status: H.fetchStatus });
  }));
});

describe("POST /api/integrations — Anthropic 키 검증 (A3)", () => {
  it("유효한 anthropic 키(200) → 검증 호출 후 저장", async () => {
    H.fetchStatus = 200;
    const { status, body } = await postIntegration({ tenant_id: "tenant-1", kind: "anthropic", label: "claude", secret: "sk-ant-good" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(H.fetchCalls).toBe(1); // 검증 호출됨
    expect(H.inserts).toBe(1); // 저장됨
  });

  it("잘못된 anthropic 키(401) → 400 거부, 저장 안 함", async () => {
    H.fetchStatus = 401;
    const { status, body } = await postIntegration({ tenant_id: "tenant-1", kind: "anthropic", label: "claude", secret: "sk-ant-bad" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/검증 실패|인증 실패/);
    expect(H.inserts).toBe(0); // 저장 안 됨
  });

  it("anthropic 외 kind(channel)는 검증 스킵하고 저장", async () => {
    const { status } = await postIntegration({ tenant_id: "tenant-1", kind: "channel", label: "threads", secret: "tok" });
    expect(status).toBe(200);
    expect(H.fetchCalls).toBe(0); // 검증 안 함
    expect(H.inserts).toBe(1);
  });
});
