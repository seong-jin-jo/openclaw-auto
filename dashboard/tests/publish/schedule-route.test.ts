import { describe, it, expect, beforeEach, vi } from "vitest";

// /api/schedule 검증 분기 (인프라 無, 항상 실행). INSERT/read-back은 DB 필요 → 별도 db-gated.
// effectiveTenantId를 고정해 라우트 검증 로직만 본다. withTenant는 검증 통과 전엔 호출 안 됨.

const H = vi.hoisted(() => ({ tenantId: "tenant-1" as string | null }));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async () => H.tenantId),
}));

// 검증 분기 테스트에선 DB에 도달하지 않지만, 모듈 로드 시 throw 방지를 위해 목.
vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async () => {
    throw new Error("withTenant는 검증 통과 후에만 호출되어야 함");
  }),
}));

async function schedule(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/schedule/route");
  const res = await POST(
    new Request("http://localhost/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  H.tenantId = "tenant-1";
});

describe("POST /api/schedule — 검증 분기", () => {
  it("테넌트 해석 불가 → 400", async () => {
    H.tenantId = null;
    const { status, body } = await schedule({ platforms: ["x"], scheduled_at: future() });
    expect(status).toBe(400);
    expect(body.error).toMatch(/tenant_id/);
  });

  it("platforms 비어있음 → 400", async () => {
    const { status, body } = await schedule({ platforms: [], scheduled_at: future() });
    expect(status).toBe(400);
    expect(body.error).toMatch(/platforms/);
  });

  it("scheduled_at 누락 → 400", async () => {
    const { status, body } = await schedule({ platforms: ["x"] });
    expect(status).toBe(400);
    expect(body.error).toMatch(/scheduled_at required/);
  });

  it("scheduled_at 형식 오류 → 400", async () => {
    const { status, body } = await schedule({ platforms: ["x"], scheduled_at: "not-a-date" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/형식 오류/);
  });

  it("과거 시각 → 400 (미래만 허용)", async () => {
    const { status, body } = await schedule({ platforms: ["x"], scheduled_at: "2020-01-01T00:00:00Z" });
    expect(status).toBe(400);
    expect(body.error).toMatch(/미래/);
  });
});

// 미래 시각(now+1h) ISO. 테스트 안에서 Date 사용은 허용(워크플로 스크립트 제약과 무관).
function future(): string {
  return new Date(Date.now() + 3600000).toISOString();
}
