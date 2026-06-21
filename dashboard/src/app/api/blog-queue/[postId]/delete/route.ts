import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface BlogQueueData { posts: Array<Record<string, unknown>> }

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    let removed = false;
    await mutateJson<BlogQueueData>(dataPath("blog-queue.json"), (queue) => {
      const before = queue.posts.length;
      queue.posts = queue.posts.filter((p) => p.id !== postId);
      removed = queue.posts.length !== before;
      return queue;
    }, { posts: [] });
    if (!removed) return Response.json({ error: "post not found" }, { status: 404 });
    return Response.json({ ok: true });
  });
}
