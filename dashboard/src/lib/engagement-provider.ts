import { publishThreads, type ChannelCred } from "@/lib/publish";

const THREADS_API = "https://graph.threads.net/v1.0";
const FACEBOOK_API = "https://graph.facebook.com/v21.0";
const INSTAGRAM_LOGIN_API = "https://graph.instagram.com/v21.0";
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";
const PROVIDER_TIMEOUT_MS = 15_000;

export interface ProviderComment {
  id: string;
  parentId: string | null;
  author: string;
  body: string;
  createdAt: string;
  likeCount: number | null;
  permalink: string | null;
}

export interface ProviderCommentPage {
  items: ProviderComment[];
  nextCursor: string | null;
}

export interface ProviderMutationResult {
  ok: boolean;
  externalId?: string;
  error?: string;
}

function providerError(platform: string, status: number): string {
  if (status === 401 || status === 403) return `${platform} 댓글 권한이 없거나 만료되었습니다. 채널을 다시 연결해주세요.`;
  if (status === 404) return `${platform}에서 게시물 또는 댓글을 찾을 수 없습니다.`;
  if (status === 429) return `${platform} 댓글 요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해주세요.`;
  return `${platform} 댓글 요청에 실패했습니다 (오류 코드 ${status}).`;
}

async function providerJson<T>(platform: string, url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) });
  } catch {
    throw new Error(`${platform} 댓글 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.`);
  }
  if (!response.ok) throw new Error(providerError(platform, response.status));
  return response.json() as Promise<T>;
}

function instagramBase(cred: ChannelCred): string {
  return cred.meta?.api === "instagram_login" ? INSTAGRAM_LOGIN_API : FACEBOOK_API;
}

async function listThreads(cred: ChannelCred, postId: string): Promise<ProviderCommentPage> {
  const fields = "id,text,username,timestamp,permalink,replied_to,is_reply_owned_by_me";
  const url = `${THREADS_API}/${encodeURIComponent(postId)}/conversation?fields=${encodeURIComponent(fields)}&reverse=true&limit=50&access_token=${encodeURIComponent(cred.token)}`;
  const body = await providerJson<{
    data?: Array<{ id?: string; text?: string; username?: string; timestamp?: string; permalink?: string; replied_to?: { id?: string } }>;
    paging?: { cursors?: { after?: string } };
  }>("Threads", url);
  return {
    items: (body.data ?? []).filter((item) => item.id).map((item) => ({
      id: item.id!, parentId: item.replied_to?.id ?? null, author: item.username ? `@${item.username}` : "작성자 미수집",
      body: item.text ?? "", createdAt: item.timestamp ?? "", likeCount: null, permalink: item.permalink ?? null,
    })),
    nextCursor: body.paging?.cursors?.after ?? null,
  };
}

async function listInstagram(cred: ChannelCred, postId: string): Promise<ProviderCommentPage> {
  const fields = "id,text,timestamp,username,like_count";
  const url = `${instagramBase(cred)}/${encodeURIComponent(postId)}/comments?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(cred.token)}`;
  const body = await providerJson<{
    data?: Array<{ id?: string; text?: string; timestamp?: string; username?: string; like_count?: number }>;
    paging?: { cursors?: { after?: string } };
  }>("Instagram", url);
  return {
    items: (body.data ?? []).filter((item) => item.id).map((item) => ({
      id: item.id!, parentId: null, author: item.username ? `@${item.username}` : "작성자 미수집",
      body: item.text ?? "", createdAt: item.timestamp ?? "", likeCount: item.like_count ?? null, permalink: null,
    })),
    nextCursor: body.paging?.cursors?.after ?? null,
  };
}

async function listFacebook(cred: ChannelCred, postId: string): Promise<ProviderCommentPage> {
  const fields = "id,message,from,created_time,like_count";
  const url = `${FACEBOOK_API}/${encodeURIComponent(postId)}/comments?fields=${encodeURIComponent(fields)}&filter=stream&limit=50&access_token=${encodeURIComponent(cred.token)}`;
  const body = await providerJson<{
    data?: Array<{ id?: string; message?: string; from?: { name?: string }; created_time?: string; like_count?: number }>;
    paging?: { cursors?: { after?: string } };
  }>("Facebook", url);
  return {
    items: (body.data ?? []).filter((item) => item.id).map((item) => ({
      id: item.id!, parentId: null, author: item.from?.name ?? "작성자 미수집", body: item.message ?? "",
      createdAt: item.created_time ?? "", likeCount: item.like_count ?? null, permalink: null,
    })),
    nextCursor: body.paging?.cursors?.after ?? null,
  };
}

async function listYouTube(cred: ChannelCred, postId: string): Promise<ProviderCommentPage> {
  const params = new URLSearchParams({ part: "snippet,replies", videoId: postId, maxResults: "50", textFormat: "plainText" });
  const body = await providerJson<{
    nextPageToken?: string;
    items?: Array<{
      snippet?: { topLevelComment?: YouTubeComment };
      replies?: { comments?: YouTubeComment[] };
    }>;
  }>("YouTube", `${YOUTUBE_API}/commentThreads?${params}`, { headers: { Authorization: `Bearer ${cred.token}` } });
  const items: ProviderComment[] = [];
  for (const thread of body.items ?? []) {
    const top = thread.snippet?.topLevelComment;
    if (top?.id) items.push(normalizeYouTubeComment(top));
    for (const reply of thread.replies?.comments ?? []) if (reply.id) items.push(normalizeYouTubeComment(reply));
  }
  return { items, nextCursor: body.nextPageToken ?? null };
}

interface YouTubeComment {
  id?: string;
  snippet?: {
    parentId?: string;
    textDisplay?: string;
    authorDisplayName?: string;
    publishedAt?: string;
    likeCount?: number;
  };
}

function normalizeYouTubeComment(comment: YouTubeComment): ProviderComment {
  return {
    id: comment.id!, parentId: comment.snippet?.parentId ?? null,
    author: comment.snippet?.authorDisplayName ?? "작성자 미수집", body: comment.snippet?.textDisplay ?? "",
    createdAt: comment.snippet?.publishedAt ?? "", likeCount: comment.snippet?.likeCount ?? null, permalink: null,
  };
}

export async function listProviderComments(platform: string, cred: ChannelCred, postId: string): Promise<ProviderCommentPage> {
  if (platform === "threads") return listThreads(cred, postId);
  if (platform === "instagram" || platform === "instagram_reels" || platform === "reels") return listInstagram(cred, postId);
  if (platform === "facebook") return listFacebook(cred, postId);
  if (platform === "youtube" || platform === "shorts") return listYouTube(cred, postId);
  throw new Error(`${platform} 댓글 본문 조회 계약이 없습니다.`);
}

async function graphReply(base: string, platform: string, cred: ChannelCred, commentId: string, text: string, edge: "comments" | "replies"): Promise<ProviderMutationResult> {
  try {
    const body = await providerJson<{ id?: string }>(platform, `${base}/${encodeURIComponent(commentId)}/${edge}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ message: text, access_token: cred.token }),
    });
    return body.id ? { ok: true, externalId: body.id } : { ok: false, error: `${platform} 답글 응답에 ID가 없습니다.` };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : `${platform} 답글에 실패했습니다.` };
  }
}

export async function replyToProvider(platform: string, cred: ChannelCred, commentId: string, text: string): Promise<ProviderMutationResult> {
  if (platform === "threads") return publishThreads(cred, text, undefined, commentId);
  if (platform === "instagram" || platform === "instagram_reels" || platform === "reels") {
    return graphReply(instagramBase(cred), "Instagram", cred, commentId, text, "replies");
  }
  if (platform === "facebook") return graphReply(FACEBOOK_API, "Facebook", cred, commentId, text, "comments");
  if (platform === "youtube" || platform === "shorts") {
    try {
      const body = await providerJson<{ id?: string }>("YouTube", `${YOUTUBE_API}/comments?part=snippet`, {
        method: "POST", headers: { Authorization: `Bearer ${cred.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ snippet: { parentId: commentId, textOriginal: text } }),
      });
      return body.id ? { ok: true, externalId: body.id } : { ok: false, error: "YouTube 답글 응답에 ID가 없습니다." };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "YouTube 답글에 실패했습니다." };
    }
  }
  return { ok: false, error: `${platform} 답글 계약이 없습니다.` };
}

export async function likeProviderComment(platform: string, cred: ChannelCred, commentId: string): Promise<ProviderMutationResult> {
  if (platform !== "threads" && platform !== "facebook") return { ok: false, error: `${platform} 댓글 좋아요 계약이 없습니다.` };
  const base = platform === "threads" ? THREADS_API : FACEBOOK_API;
  try {
    await providerJson<Record<string, unknown>>(platform === "threads" ? "Threads" : "Facebook", `${base}/${encodeURIComponent(commentId)}/likes`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ access_token: cred.token }),
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : `${platform} 댓글 좋아요에 실패했습니다.` };
  }
}
