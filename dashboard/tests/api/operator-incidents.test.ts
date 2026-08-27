import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => []);
vi.mock("@/lib/db", () => ({ db: () => sqlMock }));

describe("운영 장애 API 계약", () => {
  beforeEach(() => {
    vi.resetModules();
    sqlMock.mockReset();
    process.env.DASHBOARD_AUTH_TOKEN = "operator-test-token";
  });

  afterEach(() => {
    delete process.env.DASHBOARD_AUTH_TOKEN;
  });

  function request(method = "GET", body?: unknown, token = "operator-test-token") {
    return new Request("http://localhost/api/operator/incidents", {
      method,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  it("관측-06 정상: 장애에 작업 공간 정보와 개입 분류를 붙여 반환한다", async () => {
    sqlMock.mockResolvedValueOnce([{
      id: "11111111-1111-1111-1111-111111111111",
      tenant_id: "cd1d0a40-540d-4524-9b49-bf2445d82182",
      workspace_name: "해낼게",
      workspace_slug: "haenaelge",
      category: "token_expired",
      source: "threads",
      reason_code: "token_expired",
      severity: "error",
      intervention: "human",
      status: "open",
      occurrences: 1,
      first_seen_at: "2026-08-28T06:00:00.000Z",
      last_seen_at: "2026-08-28T06:00:00.000Z",
      recovered_at: null,
      notified_at: null,
    }]);
    const { GET } = await import("@/app/api/operator/incidents/route");

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toEqual({ humanOpen: 1, automaticOpen: 0, recovered: 0 });
    expect(body.incidents[0]).toMatchObject({
      workspaceId: "cd1d0a40-540d-4524-9b49-bf2445d82182",
      workspaceName: "해낼게",
      intervention: "human",
    });
  });

  it("관측-07 거절: 운영자 인증이 없으면 장애 목록을 노출하지 않는다", async () => {
    const { GET } = await import("@/app/api/operator/incidents/route");
    const response = await GET(request("GET", undefined, "wrong-token"));

    expect(response.status).toBe(401);
    expect(sqlMock).not.toHaveBeenCalled();
  });

  it("관측-08 거절: 올바르지 않은 장애 식별자는 알림 완료로 기록하지 않는다", async () => {
    const { POST } = await import("@/app/api/operator/incidents/route");
    const response = await POST(request("POST", { action: "mark_notified", ids: ["invalid-id"] }));

    expect(response.status).toBe(400);
    expect(sqlMock).not.toHaveBeenCalled();
  });
});
