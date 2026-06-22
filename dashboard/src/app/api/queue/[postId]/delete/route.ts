import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { mirrorQueueDelete } from "@/lib/queue-store";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    let removed = false;
    await mutateJson<QueueData>(dataPath("queue.json"), (queue) => {
      const before = queue.posts.length;
      queue.posts = queue.posts.filter((p) => p.id !== postId);
      removed = queue.posts.length !== before;
      return queue;
    }, { posts: [] });
    if (!removed) return Response.json({ error: "post not found" }, { status: 404 });
    // P4 dual-write: 삭제 미러(best-effort, 무중단).
    await mirrorQueueDelete(__t, postId);
    return Response.json({ ok: true });
  });
}
