export type PublishReturnSource = "inbox" | "calendar";

export interface PublishReturnContext {
  sourceRoute: PublishReturnSource;
  queuePostId: string;
  draftId: string | null;
  returnUrl: string;
}

export function isPublishReturnSource(value: string | null): value is PublishReturnSource {
  return value === "inbox" || value === "calendar";
}

export function buildPublishReturnContext(
  post: Record<string, unknown>,
  sourceRoute: PublishReturnSource,
): PublishReturnContext | null {
  if (typeof post.id !== "string" || !post.id) return null;
  const draftId = typeof post.draftId === "string" && post.draftId
    ? post.draftId
    : typeof post.draft_id === "string" && post.draft_id
      ? post.draft_id
      : null;
  const params = new URLSearchParams({ queue_id: post.id, from: sourceRoute });
  if (draftId) params.set("draft_id", draftId);
  return {
    sourceRoute,
    queuePostId: post.id,
    draftId,
    returnUrl: `/studio?${params.toString()}`,
  };
}
