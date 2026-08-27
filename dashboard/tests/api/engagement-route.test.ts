import { beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  tenantId: "11111111-1111-4111-8111-111111111111" as string | null,
  list: vi.fn(),
  draft: vi.fn(),
  reply: vi.fn(),
  like: vi.fn(),
  defer: vi.fn(),
  handoff: vi.fn(),
}));

vi.mock("@/lib/tenant-auth", () => ({ effectiveTenantId: vi.fn(async () => H.tenantId) }));
vi.mock("@/lib/anthropic", () => ({
  sharedAiApprovalErrorResponse: vi.fn(() => null),
  sharedGenerationQuotaErrorResponse: vi.fn(() => null),
}));
vi.mock("@/lib/engagement-service", () => ({
  EngagementError: class EngagementError extends Error {},
  listEngagement: H.list,
  createReplyDraft: H.draft,
  sendReply: H.reply,
  likeComment: H.like,
  deferComment: H.defer,
  handoffCommentToEditor: H.handoff,
}));

describe("BE-V63-08 댓글 HTTP 계약", () => {
  const tenantId = "11111111-1111-4111-8111-111111111111";
  const postId = "22222222-2222-4222-8222-222222222222";
  const baseBody = { tenant_id: tenantId, post_id: postId, comment_id: "comment-1" };

  beforeEach(() => {
    H.tenantId = tenantId;
    for (const mock of [H.list, H.draft, H.reply, H.like, H.defer, H.handoff]) mock.mockReset();
  });

  it("BE-V63-08 정상 경로: 댓글 본문 목록을 반환한다", async () => {
    H.list.mockResolvedValue({ platform: "threads", items: [{ id: "comment-1", body: "본문" }] });
    const { GET } = await import("@/app/api/engagement/route");
    const response = await GET(new Request(`http://localhost/api/engagement?tenant_id=${tenantId}&post_id=${postId}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ platform: "threads", items: [{ body: "본문" }] });
  });

  it("BE-V63-08 정상 경로: 초안·전송·좋아요·나중 처리·편집실 인계를 각각 실행한다", async () => {
    H.draft.mockResolvedValue({ draft: "답글 초안" });
    H.reply.mockResolvedValue({ ok: true, externalId: "reply-1" });
    H.like.mockResolvedValue({ ok: true });
    H.defer.mockResolvedValue({ ok: true, state: { state: "deferred" } });
    H.handoff.mockResolvedValue({ ok: true, href: "/studio?room=edit&draft_id=draft-1" });
    const { POST } = await import("@/app/api/engagement/route");
    const cases = [
      ["draft_reply", H.draft], ["send_reply", H.reply], ["like", H.like],
      ["defer", H.defer], ["editor_handoff", H.handoff],
    ] as const;
    for (const [action, handler] of cases) {
      const response = await POST(new Request("http://localhost/api/engagement", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...baseBody, action, text: "보낼 답글", request_key: "request-1234" }),
      }));
      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalled();
    }
  });

  it("BE-V63-08 거절 경로: 모르는 동작과 작업 공간 없는 요청을 거절한다", async () => {
    const { POST } = await import("@/app/api/engagement/route");
    const unknown = await POST(new Request("http://localhost/api/engagement", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseBody, action: "pretend_supported" }),
    }));
    expect(unknown.status).toBe(400);

    H.tenantId = null;
    const noTenant = await POST(new Request("http://localhost/api/engagement", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(baseBody),
    }));
    expect(noTenant.status).toBe(400);
  });
});
