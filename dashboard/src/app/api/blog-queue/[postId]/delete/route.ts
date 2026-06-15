import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface BlogQueueData { posts: Array<Record<string, unknown>> }

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    const queue = readJson<BlogQueueData>(dataPath("blog-queue.json"));
    if (!queue) return Response.json({ error: "blog-queue.json not found" }, { status: 404 });

    const before = queue.posts.length;
    queue.posts = queue.posts.filter((p) => p.id !== postId);
    if (queue.posts.length === before) {
      return Response.json({ error: "post not found" }, { status: 404 });
    }

    writeJson(dataPath("blog-queue.json"), queue);
    return Response.json({ ok: true });
  });
}
