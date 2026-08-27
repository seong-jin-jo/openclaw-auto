import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({ publishThreads: vi.fn() }));
vi.mock("@/lib/publish", () => ({ publishThreads: H.publishThreads }));

describe("BE-V63-09 provider 댓글 어댑터", () => {
  beforeEach(() => {
    H.publishThreads.mockReset();
    vi.unstubAllGlobals();
  });

  it("BE-V63-09 정상 경로: Threads conversation 본문을 공통 댓글 모양으로 바꾼다", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) => new Response(JSON.stringify({
      data: [{ id: "reply-1", text: "댓글 본문", username: "maker", timestamp: "2026-08-28T01:00:00Z", replied_to: { id: "post-1" } }],
      paging: { cursors: { after: "next" } },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { listProviderComments } = await import("@/lib/engagement-provider");
    const result = await listProviderComments("threads", { token: "secret" }, "post-1");
    expect(result.items[0]).toMatchObject({ id: "reply-1", body: "댓글 본문", author: "@maker", parentId: "post-1" });
    expect(result.nextCursor).toBe("next");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("undefined");
  });

  it("BE-V63-09 정상 경로: Threads 답글과 좋아요를 provider에 보낸다", async () => {
    H.publishThreads.mockResolvedValue({ ok: true, externalId: "brand-reply-1" });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 })));
    const { likeProviderComment, replyToProvider } = await import("@/lib/engagement-provider");
    await expect(replyToProvider("threads", { token: "secret" }, "reply-1", "답글")).resolves.toMatchObject({ ok: true, externalId: "brand-reply-1" });
    await expect(likeProviderComment("threads", { token: "secret" }, "reply-1")).resolves.toMatchObject({ ok: true });
    expect(H.publishThreads).toHaveBeenCalledWith({ token: "secret" }, "답글", undefined, "reply-1");
  });

  it("BE-V63-09 거절 경로: 계약 없는 TikTok 댓글 조회를 provider 호출 없이 거절한다", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { listProviderComments } = await import("@/lib/engagement-provider");
    await expect(listProviderComments("tiktok", { token: "secret" }, "video-1")).rejects.toThrow("계약이 없습니다");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
