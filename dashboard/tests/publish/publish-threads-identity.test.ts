import { describe, it, expect, vi, afterEach } from "vitest";
import { publishThreads } from "@/lib/publish";

// SNS-009 회귀: 저장된 meta.userId(stale)가 아니라 토큰의 실제 신원(/me?fields=id)으로
// 발행해야 한다. https://developers.facebook.com/docs/graph-api/guides/error-handling/

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("publishThreads identity resolution (SNS-009)", () => {
  it("stale stored userId + live /me 다른 id → 실제 id로 container/publish 호출", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("/me?fields=id")) {
        return { ok: true, json: async () => ({ id: "live-real-id" }) } as Response;
      }
      if (String(url).includes("/threads_publish")) {
        return { ok: true, json: async () => ({ id: "media-1" }) } as Response;
      }
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        return { ok: true, json: async () => ({ id: "container-1" }) } as Response;
      }
      // permalink lookup
      return { ok: true, json: async () => ({ permalink: "https://threads.net/p/1" }) } as Response;
    }));

    const result = await publishThreads({ token: "tok", userId: "stale-old-id" }, "hello");

    expect(result.ok).toBe(true);
    expect(result.externalId).toBe("media-1");
    // stale id는 어디에도 쓰이지 않고, 실제 조회된 id(live-real-id)로만 발행 URL이 구성돼야 한다.
    const usedStale = calls.some((u) => u.includes("stale-old-id"));
    expect(usedStale).toBe(false);
    const containerCall = calls.find((u) => u.includes("/threads") && !u.includes("_publish") && !u.includes("/me"));
    expect(containerCall).toContain("live-real-id");
    const publishCall = calls.find((u) => u.includes("/threads_publish"));
    expect(publishCall).toContain("live-real-id");
  });

  it("신원 조회(/me) 실패 → container 생성 전에 안전한 한국어 오류로 중단, 원문 미노출", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: { message: "Invalid OAuth access token: super-secret-detail", code: 190 } }),
        } as Response;
      }
      throw new Error("container/publish should not be called after identity lookup failure");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok", userId: "old-id" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("super-secret-detail");
    expect(result.error).not.toContain("tok");
    // container/threads_publish 엔드포인트는 신원 확인 실패 후 호출되면 안 된다.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("신원 조회 네트워크 오류 → 안전한 오류 메시지로 실패", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed: ENOTFOUND graph.threads.net")));

    const result = await publishThreads({ token: "tok", userId: "old-id" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).not.toContain("ENOTFOUND");
  });

  it("저장 userId가 없어도 토큰의 live id로 발행한다", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-only-id" }) } as Response;
      if (String(url).includes("/threads_publish")) return { ok: true, json: async () => ({ id: "media-2" }) } as Response;
      if (String(url).includes("/threads")) return { ok: true, json: async () => ({ id: "container-2" }) } as Response;
      return { ok: true, json: async () => ({ permalink: "https://threads.net/p/2" }) } as Response;
    }));

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(true);
    expect(calls.some((url) => url.includes("/live-only-id/threads"))).toBe(true);
  });

  it("container 실패 원문은 응답에 포함하지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      return { ok: false, status: 400, text: async () => "provider-secret-detail" } as Response;
    }));

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toContain("container 실패(400)");
    expect(result.error).not.toContain("provider-secret-detail");
  });
});
