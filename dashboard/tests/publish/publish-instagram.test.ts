import { afterEach, describe, expect, it, vi } from "vitest";
import { publishInstagram } from "@/lib/publish";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("publishInstagram lifecycle", () => {
  it("waits for FINISHED, publishes, and returns the public permalink", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).endsWith("/media")) return { ok: true, json: async () => ({ id: "creation-1" }) } as Response;
      if (String(url).includes("status_code")) return { ok: true, json: async () => ({ status_code: "FINISHED" }) } as Response;
      if (String(url).endsWith("/media_publish")) return { ok: true, json: async () => ({ id: "media-1" }) } as Response;
      return { ok: true, json: async () => ({ permalink: "https://instagram.com/p/one/" }) } as Response;
    }));

    const result = await publishInstagram(
      { token: "token", userId: "ig-user", meta: { api: "instagram_login" } },
      "caption",
      "https://cdn.example/image.png",
    );

    expect(result).toEqual({ ok: true, externalId: "media-1", permalink: "https://instagram.com/p/one/" });
    expect(calls.some((url) => url.includes("/media-1?fields=permalink"))).toBe(true);
  });

  it("fails closed after 20 non-FINISHED states and never calls media_publish", async () => {
    vi.useFakeTimers();
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).endsWith("/media")) return { ok: true, json: async () => ({ id: "creation-2" }) } as Response;
      return { ok: true, json: async () => ({ status_code: "IN_PROGRESS" }) } as Response;
    }));

    const pending = publishInstagram(
      { token: "token", userId: "ig-user", meta: { api: "instagram_login" } },
      "caption",
      "https://cdn.example/image.png",
    );
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.ok).toBe(false);
    expect(result.error).toContain("시간 초과");
    expect(calls.some((url) => url.endsWith("/media_publish"))).toBe(false);
  });

  it("does not expose provider response text on container failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      status: 400,
      text: async () => "secret provider details",
    }) as Response));

    const result = await publishInstagram(
      { token: "token", userId: "ig-user" },
      "caption",
      "https://cdn.example/image.png",
    );

    expect(result.error).toBe("IG container 실패(400)");
    expect(result.error).not.toContain("secret provider details");
  });
});
