import { buildPublishReturnContext, type PublishReturnContext } from "@/lib/publish-return-context";

export interface QueueReviewRequest {
  status: "requested";
  requestedAt: string;
  sourceRoom: "studio";
  inboxUrl: "/inbox";
  publishContext: PublishReturnContext;
}

export type ReviewTransitionResult =
  | { ok: true; post: Record<string, unknown>; reviewRequest: QueueReviewRequest; reused: boolean }
  | { ok: false; code: "not_reviewable"; error: string };

export function requestReviewTransition(
  post: Record<string, unknown>,
  requestedAt: string,
): ReviewTransitionResult {
  if (post.status !== "draft") {
    return {
      ok: false,
      code: "not_reviewable",
      error: `status ${String(post.status ?? "unknown")} cannot request review`,
    };
  }

  const current = post.reviewRequest;
  if (current && typeof current === "object" && (current as { status?: unknown }).status === "requested") {
    return {
      ok: true,
      post,
      reviewRequest: current as QueueReviewRequest,
      reused: true,
    };
  }

  const publishContext = buildPublishReturnContext(post, "inbox");
  if (!publishContext) {
    return { ok: false, code: "not_reviewable", error: "queue post id required" };
  }

  const reviewRequest: QueueReviewRequest = {
    status: "requested",
    requestedAt,
    sourceRoom: "studio",
    inboxUrl: "/inbox",
    publishContext,
  };
  post.reviewRequest = reviewRequest;
  return { ok: true, post, reviewRequest, reused: false };
}
