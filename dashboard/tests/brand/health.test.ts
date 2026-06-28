import { describe, it, expect, beforeEach, vi } from "vitest";

// L5 — /api/health 헬스체크. DB 핑 성공 200, 실패 503. 부작용 없음(테넌트/인증 미관여).
const H = vi.hoisted(() => ({ dbOk: true }));

vi.mock("@/lib/db", () => ({
  db: vi.fn(() => () => (H.dbOk ? Promise.resolve([{ "?column?": 1 }]) : Promise.reject(new Error("connection refused")))),
}));

async function health() {
  const { GET } = await import("@/app/api/health/route");
  const res = await GET();
  return { status: res.status, body: await res.json() };
}

beforeEach(() => { vi.resetModules(); H.dbOk = true; });

describe("GET /api/health", () => {
  it("DB 정상 → 200 ok", async () => {
    const { status, body } = await health();
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.db).toBe("up");
  });

  it("DB 불가 → 503 (모니터가 감지)", async () => {
    H.dbOk = false;
    const { status, body } = await health();
    expect(status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.db).toBe("down");
  });
});
