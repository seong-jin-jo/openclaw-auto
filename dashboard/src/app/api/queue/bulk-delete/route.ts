import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const ids = new Set<string>(data.ids || []);
    let deleted = 0;
    await mutateJson<QueueData>(dataPath("queue.json"), (queue) => {
      const before = queue.posts.length;
      queue.posts = queue.posts.filter((p) => !ids.has(p.id as string));
      deleted = before - queue.posts.length;
      return queue;
    }, { posts: [] });
    return Response.json({ ok: true, deleted });
  });
}
