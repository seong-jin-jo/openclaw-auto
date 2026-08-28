import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  providerResult: { ok: false, error: "실패", failureKind: "definitive" } as {
    ok: boolean; error?: string; failureKind?: "definitive" | "indeterminate";
  },
  release: vi.fn(),
  touch: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => Promise<unknown>) => callback(async () => [{
    id: "11111111-1111-4111-8111-111111111111",
    platform: "facebook",
    external_id: "provider-post-1",
    provider_post_id: "provider-post-1",
    account_id: null,
    draft_id: null,
    text: "발행 본문",
  }])),
}));
vi.mock("@/lib/publish", () => ({ getChannelCred: vi.fn(async () => ({ token: "secret" })) }));
vi.mock("@/lib/engagement-provider", () => ({
  listProviderComments: vi.fn(async () => ({
    items: [{ id: "comment-1", parentId: null, author: "작성자", body: "댓글", createdAt: "", likeCount: 0, permalink: null }],
    nextCursor: null,
  })),
  replyToProvider: vi.fn(async () => H.providerResult),
  likeProviderComment: vi.fn(),
}));
vi.mock("@/lib/engagement-store", () => ({
  claimReply: vi.fn(async () => ({ status: "claimed", row: null })),
  releaseReplyClaim: H.release,
  touchReplyClaim: H.touch,
  completeReply: H.complete,
  getEngagementState: vi.fn(),
  listEngagementStates: vi.fn(),
  markEngagement: vi.fn(),
}));
vi.mock("@/lib/anthropic", () => ({ generateText: vi.fn() }));
vi.mock("@/lib/wiki-retrieve", () => ({ getWikiContext: vi.fn() }));

describe("C4 답글 실패 확정성 계약", () => {
  beforeEach(() => {
    H.providerResult = { ok: false, error: "확정 거절", failureKind: "definitive" };
    H.release.mockReset().mockResolvedValue(undefined);
    H.touch.mockReset().mockResolvedValue(undefined);
    H.complete.mockReset();
  });

  it("C4-BE-V63-08 확정 거절: 답글 청구를 풀어 안전한 재시도를 허용한다", async () => {
    const { sendReply } = await import("@/lib/engagement-service");
    await expect(sendReply(
      "22222222-2222-4222-8222-222222222222",
      "11111111-1111-4111-8111-111111111111",
      "comment-1",
      "답글",
      "request-definitive",
    )).rejects.toMatchObject({ code: "PROVIDER_REPLY_FAILED" });
    expect(H.release).toHaveBeenCalledOnce();
    expect(H.touch).not.toHaveBeenCalled();
  });

  it("C4-BE-V63-08 시간 초과: 답글 청구를 유지해 공개 중복 답글을 막는다", async () => {
    H.providerResult = { ok: false, error: "결과 미확정", failureKind: "indeterminate" };
    const { sendReply } = await import("@/lib/engagement-service");
    await expect(sendReply(
      "22222222-2222-4222-8222-222222222222",
      "11111111-1111-4111-8111-111111111111",
      "comment-1",
      "답글",
      "request-uncertain",
    )).rejects.toMatchObject({ code: "PROVIDER_REPLY_STATUS_UNKNOWN" });
    expect(H.touch).toHaveBeenCalledOnce();
    expect(H.release).not.toHaveBeenCalled();
  });
});
