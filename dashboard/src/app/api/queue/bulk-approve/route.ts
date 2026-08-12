import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { mirrorQueuePost } from "@/lib/queue-store";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const ids: string[] = data.ids || [];
    const intervalHours = data.intervalHours ?? 2;
    const now = Date.now();
    let approved = 0;
    const changed: Array<Record<string, unknown> & { id: string }> = [];

    await mutateJson<QueueData>(dataPath("queue.json"), (queue) => {
      approved = 0;
      for (const post of queue.posts || []) {
        if (ids.includes(post.id as string) && post.status === "draft") {
          post.status = "approved";
          post.approvedAt = new Date(now).toISOString();
          post.scheduledAt = new Date(now + intervalHours * 3600000 * approved).toISOString();
          changed.push(post as Record<string, unknown> & { id: string });
          approved++;
        }
      }
      return queue;
    }, { posts: [] });

    await Promise.all(changed.map((post) => mirrorQueuePost(__t, post)));

    return Response.json({ ok: true, approved });
  });
}
