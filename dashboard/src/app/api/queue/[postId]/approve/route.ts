import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    const data = await request.json();
    let found: Record<string, unknown> | null = null;
    await mutateJson<QueueData>(dataPath("queue.json"), (queue) => {
      for (const post of queue.posts || []) {
        if (post.id === postId) {
          post.status = "approved";
          const now = new Date();
          post.approvedAt = now.toISOString();
          const hours = typeof data.hours === "number" && data.hours >= 0 ? data.hours : 0;
          post.scheduledAt = new Date(now.getTime() + hours * 3600000).toISOString();
          found = post;
        }
      }
      return queue;
    }, { posts: [] });
    if (!found) return Response.json({ error: "post not found" }, { status: 404 });
    return Response.json({ ok: true, post: found });
  });
}
