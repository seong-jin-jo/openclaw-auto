import { withTenant } from "@/lib/db";

export interface EngagementStateRow {
  provider_comment_id: string;
  state: "unread" | "deferred" | "replying" | "replied" | "editor_handoff";
  reply_request_key: string | null;
  reply_text: string | null;
  reply_external_id: string | null;
  replied_at: string | null;
  liked_at: string | null;
  deferred_at: string | null;
  editor_handoff_at: string | null;
  editor_draft_id: string | null;
}

export async function listEngagementStates(tenantId: string, postId: string): Promise<EngagementStateRow[]> {
  return withTenant(tenantId, (sql) => sql<EngagementStateRow[]>`
    SELECT provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
           replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id
    FROM engagement_items
    WHERE tenant_id = ${tenantId} AND published_post_id = ${postId}`);
}

export async function getEngagementState(tenantId: string, platform: string, commentId: string): Promise<EngagementStateRow | null> {
  const [row] = await withTenant(tenantId, (sql) => sql<EngagementStateRow[]>`
    SELECT provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
           replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id
    FROM engagement_items
    WHERE tenant_id = ${tenantId} AND platform = ${platform} AND provider_comment_id = ${commentId}`);
  return row ?? null;
}

export async function claimReply(input: {
  tenantId: string; postId: string; platform: string; commentId: string; requestKey: string; text: string;
}): Promise<{ status: "claimed" | "replay" | "conflict"; row: EngagementStateRow | null }> {
  return withTenant(input.tenantId, async (sql) => {
    const [claimed] = await sql<EngagementStateRow[]>`
      INSERT INTO engagement_items
        (tenant_id, published_post_id, platform, provider_comment_id, state, reply_request_key, reply_text)
      VALUES
        (${input.tenantId}, ${input.postId}, ${input.platform}, ${input.commentId}, 'replying', ${input.requestKey}, ${input.text})
      ON CONFLICT (tenant_id, platform, provider_comment_id) DO UPDATE
      SET state = 'replying', reply_request_key = EXCLUDED.reply_request_key,
          reply_text = EXCLUDED.reply_text, updated_at = now()
      WHERE engagement_items.replied_at IS NULL AND engagement_items.state <> 'replying'
      RETURNING provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
                replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id`;
    if (claimed) return { status: "claimed" as const, row: claimed };
    const [existing] = await sql<EngagementStateRow[]>`
      SELECT provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
             replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id
      FROM engagement_items
      WHERE tenant_id = ${input.tenantId} AND platform = ${input.platform} AND provider_comment_id = ${input.commentId}`;
    if (existing?.replied_at && existing.reply_request_key === input.requestKey) return { status: "replay" as const, row: existing };
    return { status: "conflict" as const, row: existing ?? null };
  });
}

export async function releaseReplyClaim(tenantId: string, platform: string, commentId: string, requestKey: string): Promise<void> {
  await withTenant(tenantId, (sql) => sql`
    UPDATE engagement_items
    SET state = 'unread', reply_request_key = NULL, reply_text = NULL, updated_at = now()
    WHERE tenant_id = ${tenantId} AND platform = ${platform} AND provider_comment_id = ${commentId}
      AND state = 'replying' AND reply_request_key = ${requestKey}`);
}

export async function completeReply(input: {
  tenantId: string; platform: string; commentId: string; requestKey: string; externalId: string | null;
}): Promise<EngagementStateRow> {
  const [row] = await withTenant(input.tenantId, (sql) => sql<EngagementStateRow[]>`
    UPDATE engagement_items
    SET state = 'replied', reply_external_id = ${input.externalId}, replied_at = now(), updated_at = now()
    WHERE tenant_id = ${input.tenantId} AND platform = ${input.platform}
      AND provider_comment_id = ${input.commentId} AND reply_request_key = ${input.requestKey}
    RETURNING provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
              replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id`);
  if (!row) throw new Error("답글 결과를 저장하지 못했습니다.");
  return row;
}

export async function markEngagement(input: {
  tenantId: string; postId: string; platform: string; commentId: string;
  action: "like" | "defer" | "editorHandoff"; draftId?: string | null;
}): Promise<EngagementStateRow> {
  const state = input.action === "defer" ? "deferred" : input.action === "editorHandoff" ? "editor_handoff" : "unread";
  const [row] = await withTenant(input.tenantId, (sql) => sql<EngagementStateRow[]>`
    INSERT INTO engagement_items
      (tenant_id, published_post_id, platform, provider_comment_id, state, liked_at, deferred_at, editor_handoff_at, editor_draft_id)
    VALUES
      (${input.tenantId}, ${input.postId}, ${input.platform}, ${input.commentId}, ${state},
       ${input.action === "like" ? new Date() : null}, ${input.action === "defer" ? new Date() : null},
       ${input.action === "editorHandoff" ? new Date() : null}, ${input.action === "editorHandoff" ? input.draftId ?? null : null})
    ON CONFLICT (tenant_id, platform, provider_comment_id) DO UPDATE
    SET state = CASE WHEN engagement_items.replied_at IS NOT NULL THEN engagement_items.state ELSE EXCLUDED.state END,
        liked_at = COALESCE(EXCLUDED.liked_at, engagement_items.liked_at),
        deferred_at = COALESCE(EXCLUDED.deferred_at, engagement_items.deferred_at),
        editor_handoff_at = COALESCE(EXCLUDED.editor_handoff_at, engagement_items.editor_handoff_at),
        editor_draft_id = COALESCE(EXCLUDED.editor_draft_id, engagement_items.editor_draft_id),
        updated_at = now()
    RETURNING provider_comment_id, state, reply_request_key, reply_text, reply_external_id,
              replied_at::text, liked_at::text, deferred_at::text, editor_handoff_at::text, editor_draft_id`);
  return row;
}
