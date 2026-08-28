import { generateText } from "@/lib/anthropic";
import { getEngagementCapability, type EngagementAction, type EngagementCapability } from "@/lib/channel-capabilities";
import { withTenant } from "@/lib/db";
import { getChannelCred } from "@/lib/publish";
import { getWikiContext } from "@/lib/wiki-retrieve";
import { likeProviderComment, listProviderComments, replyToProvider, type ProviderComment } from "@/lib/engagement-provider";
import {
  claimReply, completeReply, likeEngagementOnce, listEngagementStates, markEngagement, releaseReplyClaim, touchReplyClaim,
  type EngagementStateRow,
} from "@/lib/engagement-store";

interface PublishedPostRow {
  id: string;
  platform: string;
  external_id: string | null;
  provider_post_id: string | null;
  account_id: string | null;
  draft_id: string | null;
  text: string | null;
}

export class EngagementError extends Error {
  constructor(public status: number, public code: string, message: string, public capability?: EngagementCapability) {
    super(message);
  }
}

function normalizedPlatform(platform: string): string {
  if (platform === "shorts") return "youtube";
  if (platform === "reels" || platform === "instagram_reels") return "instagram";
  return platform;
}

function assertUuid(value: string, label: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new EngagementError(400, "INVALID_ID", `${label} 형식이 올바르지 않습니다.`);
  }
}

async function loadPost(tenantId: string, postId: string): Promise<PublishedPostRow> {
  assertUuid(postId, "post_id");
  const [post] = await withTenant(tenantId, (sql) => sql<PublishedPostRow[]>`
    SELECT id, platform, external_id, provider_post_id, account_id, draft_id, text
    FROM published_posts WHERE tenant_id = ${tenantId} AND id = ${postId}`);
  if (!post) throw new EngagementError(404, "POST_NOT_FOUND", "이 작업 공간의 발행 글을 찾을 수 없습니다.");
  return post;
}

function requireAction(capability: EngagementCapability, action: EngagementAction): void {
  const contract = capability[action];
  if (!contract.supported) throw new EngagementError(409, "ACTION_UNSUPPORTED", contract.reason ?? "지원하지 않는 동작입니다.", capability);
}

async function providerContext(tenantId: string, post: PublishedPostRow) {
  const platform = normalizedPlatform(post.platform);
  const capability = getEngagementCapability(platform);
  const providerPostId = post.provider_post_id ?? post.external_id;
  if (!providerPostId) throw new EngagementError(409, "PROVIDER_POST_ID_MISSING", "외부 게시물 ID가 없어 댓글을 읽을 수 없습니다.", capability);
  const cred = await getChannelCred(tenantId, platform, post.account_id ?? undefined);
  if (!cred) throw new EngagementError(409, "CHANNEL_NOT_CONNECTED", `${platform} 발행 계정을 찾을 수 없습니다. 채널 연결 상태를 확인해주세요.`, capability);
  return { platform, capability, providerPostId, cred };
}

function displayState(row?: EngagementStateRow): Record<string, unknown> {
  return {
    state: row?.state ?? "unread", repliedAt: row?.replied_at ?? null, replyText: row?.reply_text ?? null,
    replyExternalId: row?.reply_external_id ?? null, likedAt: row?.liked_at ?? null,
    deferredAt: row?.deferred_at ?? null, editorHandoffAt: row?.editor_handoff_at ?? null,
    editorDraftId: row?.editor_draft_id ?? null,
  };
}

export async function listEngagement(tenantId: string, postId: string) {
  const post = await loadPost(tenantId, postId);
  const platform = normalizedPlatform(post.platform);
  const capability = getEngagementCapability(platform);
  if (!capability.read.supported) {
    return { postId, platform, items: [], capability, unavailableReason: capability.read.reason };
  }
  const context = await providerContext(tenantId, post);
  const [page, states] = await Promise.all([
    listProviderComments(context.platform, context.cred, context.providerPostId),
    listEngagementStates(tenantId, postId),
  ]);
  const stateById = new Map(states.map((state) => [state.provider_comment_id, state]));
  return {
    postId, platform, capability, nextCursor: page.nextCursor,
    items: page.items.map((item) => ({ ...item, ...displayState(stateById.get(item.id)) })),
  };
}

async function loadComment(tenantId: string, post: PublishedPostRow, commentId: string, action: EngagementAction) {
  if (!commentId || commentId.length > 300) throw new EngagementError(400, "INVALID_COMMENT_ID", "comment_id가 올바르지 않습니다.");
  const capability = getEngagementCapability(normalizedPlatform(post.platform));
  requireAction(capability, action);
  const context = await providerContext(tenantId, post);
  const page = await listProviderComments(context.platform, context.cred, context.providerPostId);
  const comment = page.items.find((item) => item.id === commentId);
  if (!comment) throw new EngagementError(404, "COMMENT_NOT_FOUND", "이 게시물의 댓글을 찾을 수 없습니다.", context.capability);
  return { ...context, comment };
}

function cleanDraft(value: string): string {
  return value.trim().replace(/^```(?:text)?\s*/i, "").replace(/\s*```$/, "").replace(/^(["'])|(["'])$/g, "").trim().slice(0, 1000);
}

export async function createReplyDraft(tenantId: string, postId: string, commentId: string) {
  const post = await loadPost(tenantId, postId);
  const context = await loadComment(tenantId, post, commentId, "reply");
  const { text: wiki } = await getWikiContext(tenantId, `${post.text ?? ""}\n${context.comment.body}`);
  const prompt = `당신은 여섯 사업체가 함께 쓰는 SNS 댓글 담당자입니다. 아래 댓글에 보낼 답글 초안 하나만 한국어로 쓰세요.
브랜드 문서에 없는 사실은 만들지 말고, 과장·이모지·해시태그·따옴표·설명문을 쓰지 마세요. 300자 안으로 답하세요.

올린 글: ${post.text?.slice(0, 1000) || "본문 미수집"}
댓글 작성자: ${context.comment.author}
댓글: ${context.comment.body.slice(0, 1000)}
브랜드 근거:
${wiki.slice(0, 3000) || "근거 없음. 확인 가능한 내용만 짧게 답할 것."}`;
  const draft = cleanDraft(await generateText(prompt, tenantId));
  if (!draft) throw new EngagementError(502, "EMPTY_REPLY_DRAFT", "답글 초안이 비어 있습니다. 다시 시도해주세요.");
  return { draft, comment: context.comment, capability: context.capability };
}

export async function sendReply(tenantId: string, postId: string, commentId: string, text: string, requestKey: string) {
  if (!text.trim() || text.trim().length > 1000) throw new EngagementError(400, "INVALID_REPLY", "답글은 1자 이상 1,000자 이하여야 합니다.");
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(requestKey)) throw new EngagementError(400, "INVALID_REQUEST_KEY", "request_key 형식이 올바르지 않습니다.");
  const post = await loadPost(tenantId, postId);
  const context = await loadComment(tenantId, post, commentId, "reply");
  const claim = await claimReply({ tenantId, postId, platform: context.platform, commentId, requestKey, text: text.trim() });
  if (claim.status === "replay") return { ok: true, reused: true, state: displayState(claim.row ?? undefined), capability: context.capability };
  if (claim.status === "conflict") throw new EngagementError(409, "REPLY_ALREADY_CLAIMED", "이미 답글을 보내고 있거나 답글 이력이 있습니다.", context.capability);
  const result = await replyToProvider(context.platform, context.cred, commentId, text.trim());
  if (!result.ok) {
    if (result.failureKind === "indeterminate") {
      await touchReplyClaim(tenantId, context.platform, commentId, requestKey);
      throw new EngagementError(502, "PROVIDER_REPLY_STATUS_UNKNOWN", result.error ?? "답글 전송 결과를 확인하지 못했습니다.", context.capability);
    }
    await releaseReplyClaim(tenantId, context.platform, commentId, requestKey);
    throw new EngagementError(502, "PROVIDER_REPLY_FAILED", result.error ?? "답글 전송에 실패했습니다.", context.capability);
  }
  const row = await completeReply({ tenantId, platform: context.platform, commentId, requestKey, externalId: result.externalId ?? null });
  return { ok: true, reused: false, externalId: result.externalId ?? null, state: displayState(row), capability: context.capability };
}

export async function likeComment(tenantId: string, postId: string, commentId: string) {
  const post = await loadPost(tenantId, postId);
  const context = await loadComment(tenantId, post, commentId, "like");
  const applied = await likeEngagementOnce(
    { tenantId, postId, platform: context.platform, commentId },
    async () => {
      const result = await likeProviderComment(context.platform, context.cred, commentId);
      if (!result.ok) {
        throw new EngagementError(502, "PROVIDER_LIKE_FAILED", result.error ?? "댓글 좋아요에 실패했습니다.", context.capability);
      }
    },
  );
  return { ok: true, reused: applied.reused, state: displayState(applied.row), capability: context.capability };
}

export async function deferComment(tenantId: string, postId: string, commentId: string) {
  const post = await loadPost(tenantId, postId);
  const context = await loadComment(tenantId, post, commentId, "defer");
  const row = await markEngagement({ tenantId, postId, platform: context.platform, commentId, action: "defer" });
  return { ok: true, state: displayState(row), capability: context.capability };
}

export async function handoffCommentToEditor(tenantId: string, postId: string, commentId: string) {
  const post = await loadPost(tenantId, postId);
  const context = await loadComment(tenantId, post, commentId, "editorHandoff");
  if (!post.draft_id) throw new EngagementError(409, "EDITOR_SOURCE_MISSING", "이 발행 글에는 편집실 원본이 없어 넘길 수 없습니다.", context.capability);
  const row = await markEngagement({ tenantId, postId, platform: context.platform, commentId, action: "editorHandoff", draftId: post.draft_id });
  return { ok: true, draftId: post.draft_id, href: `/studio?room=edit&draft_id=${encodeURIComponent(post.draft_id)}&comment_id=${encodeURIComponent(commentId)}`, state: displayState(row), capability: context.capability };
}

export type { ProviderComment };
