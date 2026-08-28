import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const incidentMocks = vi.hoisted(() => ({
  record: vi.fn(async () => true),
  recover: vi.fn(async () => true),
}));

vi.mock("@/lib/observability/incidents", () => ({
  recordOperationalIncident: incidentMocks.record,
  recoverOperationalIncidents: incidentMocks.recover,
}));

describe("작업 공간별 장애 알림 분기 계약", () => {
  const workspaceId = "cd1d0a40-540d-4524-9b49-bf2445d82182";
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    incidentMocks.record.mockReset().mockResolvedValue(true);
    incidentMocks.recover.mockReset().mockResolvedValue(true);
    fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.OSMU_ALERT_SLACK_WEBHOOK_URL = "https://hooks.slack.test/operator";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    errorSpy.mockRestore();
    delete process.env.OSMU_ALERT_SLACK_WEBHOOK_URL;
  });

  it("F1-관측-09 정상: 토큰 만료를 원장에 기록하고 운영자 슬랙에도 보낸다", async () => {
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({
      event: "token_expired",
      severity: "error",
      workspaceId,
      context: { provider: "threads", reason: "token_expired" },
    });

    expect(incidentMocks.record).toHaveBeenCalledWith(expect.objectContaining({
      workspaceId,
      category: "token_expired",
      source: "threads",
      intervention: "human",
    }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("https://hooks.slack.test/operator");
    expect(errorSpy.mock.calls[0][0]).toContain(`"workspaceId":"${workspaceId}"`);
  });

  it("F1-관측-09B 경계: 사람 개입 장애의 원장 저장이 실패해도 운영자 슬랙은 보낸다", async () => {
    incidentMocks.record.mockResolvedValue(false);
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({
      event: "publish_failed",
      severity: "error",
      workspaceId,
      context: { platform: "threads", reason: "http_error", httpStatus: 400 },
    });

    expect(incidentMocks.record).toHaveBeenCalledWith(expect.objectContaining({ intervention: "human" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("관측-10 거절: 자동 복구 외부 오류는 원장 저장이 실패해도 슬랙 알림을 보내지 않는다", async () => {
    incidentMocks.record.mockResolvedValue(false);
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({
      event: "external_service_error",
      severity: "warning",
      workspaceId,
      context: { provider: "instagram", reason: "http_5xx", httpStatus: 503 },
    });

    expect(incidentMocks.record).toHaveBeenCalledWith(expect.objectContaining({ intervention: "automatic" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("관측-11 거절: 지원하지 않는 플랫폼과 미설정 상태는 운영 장애로 만들지 않는다", async () => {
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({
      event: "publish_failed",
      severity: "warning",
      workspaceId,
      context: { platform: "unknown_platform", reason: "unsupported_platform" },
    });

    expect(incidentMocks.record).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("관측-12 정상: 성공 신호는 같은 작업 공간 장애를 복구 처리한다", async () => {
    const { reportRecovery } = await import("@/lib/observability");
    await reportRecovery({ workspaceId, category: "publish_failed", source: "threads" });

    expect(incidentMocks.recover).toHaveBeenCalledWith(workspaceId, {
      workspaceId,
      category: "publish_failed",
      source: "threads",
    });
  });
});
