import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyChannel } from "@/lib/verify-channel";

// 신뢰 검증: 네트워크 실패 시 verified=true로 "통과시키지 않고" unverified로 구분하는지.
// 그리고 X가 실제 호출 결과(200→계정 / 401→실패)를 반영하는지.

afterEach(() => vi.restoreAllMocks());

describe("verifyChannel 신뢰성", () => {
  it("네트워크 실패(threads) → verified=false, unverified=true (true 아님)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed: ENOTFOUND graph.threads.net")));
    const r = await verifyChannel("threads", { accessToken: "x" });
    expect(r.verified).toBe(false);
    expect(r.unverified).toBe(true);
  });

  it("discord webhook 네트워크 실패 → unverified (저장만)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));
    const r = await verifyChannel("discord", { webhookUrl: "https://discord.com/api/webhooks/1/abc" });
    expect(r.verified).toBe(false);
    expect(r.unverified).toBe(true);
  });

  it("X 키 누락 → verified=false (호출 전 차단)", async () => {
    const r = await verifyChannel("x", { apiKey: "a" });
    expect(r.verified).toBe(false);
    expect(r.unverified).toBeFalsy();
  });

  it("X 200 → verified=true + @account", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ screen_name: "myhandle" }),
    }));
    const r = await verifyChannel("x", {
      apiKey: "a", apiKeySecret: "b", accessToken: "c", accessTokenSecret: "d",
    });
    expect(r.verified).toBe(true);
    expect(r.account).toBe("@myhandle");
  });

  it("X 401 → verified=false (unverified 아님 — 진짜 인증 실패)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false, status: 401, json: async () => ({}), text: async () => "",
    }));
    const r = await verifyChannel("x", {
      apiKey: "a", apiKeySecret: "b", accessToken: "c", accessTokenSecret: "d",
    });
    expect(r.verified).toBe(false);
    expect(r.unverified).toBeFalsy();
  });
});
