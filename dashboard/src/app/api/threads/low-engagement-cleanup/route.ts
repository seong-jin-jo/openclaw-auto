import { readJson, mutateJson, dataPath } from "@/lib/file-io";
import { AuthError, effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getChannelCred } from "@/lib/publish";
import { DELETE_SUPPORTED_CHANNELS } from "@/lib/constants";

// 승낙 후 삭제 실행 전용. body에 명시적 postId 배열이 없으면 절대 아무것도 지우지 않는다
// (회장 지시 2026-08-29 — "기준대로 자동 삭제" 옵션 금지, 반드시 사람이 고른 postId만).
// 정기 스캔/크론은 이 라우트를 호출하지 않는다 — 후보 계산은 GET low-engagement-candidates까지만.

const THREADS_API = "https://graph.threads.net/v1.0";

interface ChannelState {
  status?: string;
  publishedAt?: string | null;
  mediaId?: string | null;
}

interface QueuePost {
  id: string;
  text?: string;
  status?: string;
  error?: string | null;
  threadsMediaId?: string | null;
  channels?: Record<string, ChannelState>;
}

interface QueueData {
  posts: QueuePost[];
}

interface CleanupLogEntry {
  tenantId: string | null;
  postId: string;
  channel: string;
  ok: boolean;
  error?: string;
  deletedAt: string;
}

interface CleanupLog {
  entries: CleanupLogEntry[];
}

function errorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return Response.json({ error: "삭제 처리 중 오류가 발생했습니다." }, { status: 500 });
}

async function appendCleanupLog(entries: CleanupLogEntry[]): Promise<void> {
  if (entries.length === 0) return;
  const logPath = dataPath("low-engagement-cleanup-log.json");
  await mutateJson<CleanupLog>(logPath, (cur) => {
    cur.entries = [...(cur.entries || []), ...entries].slice(-1000); // 무한 성장 방지
    return cur;
  }, { entries: [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { postIds?: unknown; tenant_id?: unknown } | null;
    if (!body) return Response.json({ error: "JSON 본문이 필요합니다." }, { status: 400 });

    const postIds = body.postIds;
    if (!Array.isArray(postIds) || postIds.length === 0 || !postIds.every((id) => typeof id === "string" && id.length > 0)) {
      return Response.json({ error: "postIds(문자열 배열)가 필요합니다. 개별 글을 선택해야 삭제됩니다." }, { status: 400 });
    }

    const tenantId = await effectiveTenantId(request, typeof body.tenant_id === "string" ? body.tenant_id : null);
    if (!tenantId) return Response.json({ error: "작업 공간을 확인할 수 없습니다." }, { status: 400 });

    return runWithTenant(tenantId, async () => {
      const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
      const posts = queue.posts || [];

      const results: Array<{ postId: string; ok: boolean; error?: string }> = [];
      const logEntries: CleanupLogEntry[] = [];
      const deletedIds = new Set<string>();

      let cred: Awaited<ReturnType<typeof getChannelCred>> | null = null;

      for (const postId of postIds as string[]) {
        const post = posts.find((p) => p.id === postId);
        if (!post) {
          results.push({ postId, ok: false, error: "글을 찾을 수 없습니다." });
          continue;
        }
        // 이 라우트는 threads 채널 전용 — 다른 채널 postId를 받으면 "채널 미지원"으로 명확히 거부한다.
        // 지원 여부는 게시물이 실제로 사용한 채널(threadsMediaId 존재)로 판별.
        const mediaId = post.channels?.threads?.mediaId ?? post.threadsMediaId ?? null;
        if (!mediaId) {
          const err = DELETE_SUPPORTED_CHANNELS.includes("threads")
            ? "이 글은 Threads에 발행된 기록이 없습니다."
            : "이 채널은 지울 수 없습니다(채널 미지원).";
          results.push({ postId, ok: false, error: err });
          logEntries.push({ tenantId, postId, channel: "unsupported", ok: false, error: err, deletedAt: new Date().toISOString() });
          continue;
        }

        try {
          if (!cred) cred = await getChannelCred(tenantId, "threads");
          if (!cred?.token) {
            const err = "Threads 채널 토큰이 없습니다. 채널을 다시 연결해주세요.";
            results.push({ postId, ok: false, error: err });
            logEntries.push({ tenantId, postId, channel: "threads", ok: false, error: err, deletedAt: new Date().toISOString() });
            continue;
          }
          const resp = await fetch(`${THREADS_API}/${mediaId}?access_token=${encodeURIComponent(cred.token)}`, {
            method: "DELETE",
            signal: AbortSignal.timeout(10000),
          });
          if (resp.ok) {
            results.push({ postId, ok: true });
            deletedIds.add(postId);
            logEntries.push({ tenantId, postId, channel: "threads", ok: true, deletedAt: new Date().toISOString() });
          } else {
            const data = await resp.json().catch(() => ({}));
            const err = (data as { error?: { message?: string } })?.error?.message || `Threads API 오류(${resp.status})`;
            results.push({ postId, ok: false, error: err });
            logEntries.push({ tenantId, postId, channel: "threads", ok: false, error: err, deletedAt: new Date().toISOString() });
          }
        } catch (e) {
          const err = e instanceof Error ? e.message : "삭제 요청 실패";
          results.push({ postId, ok: false, error: err });
          logEntries.push({ tenantId, postId, channel: "threads", ok: false, error: err, deletedAt: new Date().toISOString() });
        }
      }

      // 승낙되고 실제 삭제 성공한 postId만 큐에서 상태 갱신 — 다른 글은 절대 건드리지 않는다.
      if (deletedIds.size > 0) {
        await mutateJson<QueueData>(dataPath("queue.json"), (cur) => {
          for (const post of cur.posts || []) {
            if (deletedIds.has(post.id)) {
              post.status = "failed";
              post.error = "안 터진 글 정리로 삭제됨(승낙됨)";
              if (post.channels?.threads) post.channels.threads.status = "deleted";
            }
          }
          return cur;
        }, { posts: [] });
      }

      await appendCleanupLog(logEntries);

      const okCount = results.filter((r) => r.ok).length;
      return Response.json({
        ok: true,
        deleted: okCount,
        failed: results.length - okCount,
        results,
      });
    });
  } catch (error) {
    return errorResponse(error);
  }
}
