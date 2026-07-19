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
      if (String(url).includes("fields=status")) {
        return { ok: true, json: async () => ({ status: "FINISHED" }) } as Response;
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
      if (String(url).includes("fields=status")) return { ok: true, json: async () => ({ status: "FINISHED" }) } as Response;
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

  it("container 생성 중 네트워크 오류 → 안전한 오류로 실패하고 publish는 호출되지 않는다", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        throw new Error("fetch failed: ECONNRESET graph.threads.net secret-token=tok");
      }
      throw new Error("publish should not be called after container network failure");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("ECONNRESET");
    expect(result.error).not.toContain("tok");
    expect(result.error).not.toContain("graph.threads.net");
    expect(fetchMock).toHaveBeenCalledTimes(2); // /me + container attempt만, publish는 호출 안 됨
  });

  it("container 응답이 200이지만 malformed JSON(id 없음) → 안전하게 실패", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        return { ok: true, json: async () => ({ unexpected: "shape" }) } as Response;
      }
      throw new Error("publish should not be called after malformed container response");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("publish 중 네트워크 오류 → 안전한 오류로 실패, 원문/토큰 미노출", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("fields=status")) return { ok: true, json: async () => ({ status: "FINISHED" }) } as Response;
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        return { ok: true, json: async () => ({ id: "container-1" }) } as Response;
      }
      if (String(url).includes("/threads_publish")) {
        throw new Error("fetch failed: ETIMEDOUT access_token=tok");
      }
      throw new Error("permalink should not be called after publish network failure");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toContain("ETIMEDOUT");
    expect(result.error).not.toContain("tok");
    expect(fetchMock).toHaveBeenCalledTimes(4); // /me + container + status + publish attempt
  });

  it("publish 응답이 200이지만 malformed JSON(id 없음) → 안전하게 실패, permalink는 호출 안 됨", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("fields=status")) return { ok: true, json: async () => ({ status: "FINISHED" }) } as Response;
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        return { ok: true, json: async () => ({ id: "container-1" }) } as Response;
      }
      if (String(url).includes("/threads_publish")) {
        return { ok: true, json: async () => ({ unexpected: "shape" }) } as Response;
      }
      throw new Error("permalink should not be called after malformed publish response");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("container가 IN_PROGRESS 후 FINISHED가 되면 그 뒤에만 publish한다", async () => {
    vi.useFakeTimers();
    let statusCalls = 0;
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      calls.push(String(url));
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("fields=status")) {
        statusCalls++;
        return { ok: true, json: async () => ({ status: statusCalls === 1 ? "IN_PROGRESS" : "FINISHED" }) } as Response;
      }
      if (String(url).includes("/threads_publish")) return { ok: true, json: async () => ({ id: "media-ready" }) } as Response;
      if (String(url).includes("/threads")) return { ok: true, json: async () => ({ id: "container-ready" }) } as Response;
      return { ok: true, json: async () => ({ permalink: "https://threads.net/p/ready" }) } as Response;
    }));

    const pending = publishThreads({ token: "tok" }, "hello");
    await vi.runAllTimersAsync();
    const result = await pending;

    expect(result.ok).toBe(true);
    expect(statusCalls).toBe(2);
    expect(calls.findIndex((url) => url.includes("/threads_publish")))
      .toBeGreaterThan(calls.findIndex((url) => url.includes("fields=status")));
    vi.useRealTimers();
  });

  it.each(["ERROR", "EXPIRED"])("container %s 상태면 publish하지 않는다", async (status) => {
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("/me?fields=id")) return { ok: true, json: async () => ({ id: "live-id" }) } as Response;
      if (String(url).includes("fields=status")) return { ok: true, json: async () => ({ status }) } as Response;
      if (String(url).includes("/threads") && !String(url).includes("_publish")) {
        return { ok: true, json: async () => ({ id: "container-bad" }) } as Response;
      }
      throw new Error("publish should not be called for terminal container failure");
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await publishThreads({ token: "tok" }, "hello");

    expect(result.ok).toBe(false);
    expect(result.error).not.toContain("tok");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
