import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  rows: [] as Array<{ provider?: string; status: string }>,
  query: "",
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = (strings: TemplateStringsArray) => {
      H.query = Array.from(strings).join(" ");
      return Promise.resolve(H.rows);
    };
    return callback(sql);
  }),
}));

beforeEach(() => {
  H.rows = [];
  H.query = "";
});

describe("channel_accounts 연결상태 SSOT", () => {
  it.each([
    ["active", "connected"],
    ["expired", "reconnect"],
    ["revoked", "reconnect"],
  ] as const)("단일 계정 status=%s를 %s로 판정한다", async (status, expected) => {
    H.rows = [{ status }];
    const { isChannelConnected } = await import("@/lib/channel-connection");

    await expect(isChannelConnected("tenant-1", "x")).resolves.toBe(expected);
    expect(H.query).toContain("FROM channel_accounts");
    expect(H.query).toContain("is_default = true");
  });

  it("계정 행이 없으면 disconnected다", async () => {
    const { isChannelConnected } = await import("@/lib/channel-connection");
    await expect(isChannelConnected("tenant-1", "x")).resolves.toBe("disconnected");
  });

  it("벌크 판정은 누락 provider를 disconnected로 채운다", async () => {
    H.rows = [
      { provider: "x", status: "active" },
      { provider: "threads", status: "expired" },
    ];
    const { getChannelConnectionStates } = await import("@/lib/channel-connection");

    await expect(getChannelConnectionStates("tenant-1", ["x", "threads", "instagram"]))
      .resolves.toEqual({ x: "connected", threads: "reconnect", instagram: "disconnected" });
  });
});
