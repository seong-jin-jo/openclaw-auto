import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMock = vi.fn(async (..._args: unknown[]) => []);
const withTenantMock = vi.fn(async (_tenantId: string, fn: (tx: typeof sqlMock) => Promise<unknown>) => fn(sqlMock));

vi.mock("@/lib/db", () => ({
  withTenant: withTenantMock,
}));

describe("운영 장애 원장 계약", () => {
  beforeEach(() => {
    sqlMock.mockClear();
    withTenantMock.mockClear();
  });

  it("관측-01 정상: 동일 작업 공간 장애는 열린 fingerprint에 누적한다", async () => {
    const { recordOperationalIncident } = await import("@/lib/observability/incidents");
    const stored = await recordOperationalIncident({
      workspaceId: "cd1d0a40-540d-4524-9b49-bf2445d82182",
      category: "token_expired",
      source: "threads",
      reasonCode: "token_expired",
      severity: "error",
      intervention: "human",
    });

    expect(stored).toBe(true);
    expect(withTenantMock).toHaveBeenCalledWith(
      "cd1d0a40-540d-4524-9b49-bf2445d82182",
      expect.any(Function),
    );
    const sql = (sqlMock.mock.calls[0][0] as unknown as TemplateStringsArray).join(" ");
    expect(sql).toContain("INSERT INTO operational_incidents");
    expect(sql).toContain("occurrences = operational_incidents.occurrences + 1");
  });

  it("관측-02 거절: 올바르지 않은 작업 공간 식별자는 DB에 쓰지 않는다", async () => {
    const { recordOperationalIncident } = await import("@/lib/observability/incidents");
    const stored = await recordOperationalIncident({
      workspaceId: "not-a-workspace",
      category: "publish_failed",
      source: "threads",
      reasonCode: "unknown",
      severity: "warning",
      intervention: "human",
    });

    expect(stored).toBe(false);
    expect(withTenantMock).not.toHaveBeenCalled();
  });

  it("관측-03 정상: 성공 신호가 오면 같은 분류의 열린 장애만 복구 처리한다", async () => {
    const { recoverOperationalIncidents } = await import("@/lib/observability/incidents");
    const recovered = await recoverOperationalIncidents(
      "cd1d0a40-540d-4524-9b49-bf2445d82182",
      { category: "external_service_error", source: "instagram" },
    );

    expect(recovered).toBe(true);
    const sql = (sqlMock.mock.calls[0][0] as unknown as TemplateStringsArray).join(" ");
    expect(sql).toContain("SET status = 'recovered'");
    expect(sql).toContain("AND status = 'open'");
  });
});
