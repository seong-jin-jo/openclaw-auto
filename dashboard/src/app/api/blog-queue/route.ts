import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface BlogQueueData {
  posts: Array<Record<string, unknown>>;
}

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function GET(request: Request) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const queue = readJson<BlogQueueData>(dataPath("blog-queue.json"));
    if (!queue) return Response.json({ posts: [], total: 0 });

    let posts = queue.posts || [];
    if (status) posts = posts.filter((p) => p.status === status);
    posts.sort((a, b) => String(b.generatedAt || "").localeCompare(String(a.generatedAt || "")));

    return Response.json({ posts, total: posts.length });
  });
}
