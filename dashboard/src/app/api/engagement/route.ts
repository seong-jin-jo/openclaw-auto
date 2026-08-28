import { AuthError, effectiveTenantId } from "@/lib/tenant-auth";
import {
  EngagementError, createReplyDraft, deferComment, handoffCommentToEditor, likeComment, listEngagement, sendReply,
} from "@/lib/engagement-service";
import { sharedAiApprovalErrorResponse, sharedGenerationQuotaErrorResponse } from "@/lib/anthropic";

function errorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  const approval = sharedAiApprovalErrorResponse(error);
  if (approval) return approval;
  const quota = sharedGenerationQuotaErrorResponse(error);
  if (quota) return quota;
  if (error instanceof EngagementError) {
    return Response.json({ error: error.message, code: error.code, capability: error.capability }, { status: error.status });
  }
  return Response.json({ error: "댓글 처리 중 오류가 발생했습니다.", code: "ENGAGEMENT_FAILED" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = await effectiveTenantId(request, url.searchParams.get("tenant_id"));
    if (!tenantId) return Response.json({ error: "작업 공간을 확인할 수 없습니다." }, { status: 400 });
    const postId = url.searchParams.get("post_id") ?? "";
    return Response.json(await listEngagement(tenantId, postId));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || Array.isArray(body)) return Response.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });
    const tenantId = await effectiveTenantId(request, typeof body.tenant_id === "string" ? body.tenant_id : null);
    if (!tenantId) return Response.json({ error: "작업 공간을 확인할 수 없습니다." }, { status: 400 });
    const action = typeof body.action === "string" ? body.action : "";
    const postId = typeof body.post_id === "string" ? body.post_id : "";
    const commentId = typeof body.comment_id === "string" ? body.comment_id : "";
    if (action === "draft_reply") return Response.json(await createReplyDraft(tenantId, postId, commentId));
    if (action === "send_reply") {
      return Response.json(await sendReply(
        tenantId, postId, commentId,
        typeof body.text === "string" ? body.text : "",
        typeof body.request_key === "string" ? body.request_key : "",
      ));
    }
    if (action === "like") return Response.json(await likeComment(tenantId, postId, commentId));
    if (action === "defer") return Response.json(await deferComment(tenantId, postId, commentId));
    if (action === "editor_handoff") return Response.json(await handoffCommentToEditor(tenantId, postId, commentId));
    return Response.json({ error: "지원하지 않는 댓글 동작입니다." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
