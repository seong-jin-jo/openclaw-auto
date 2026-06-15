import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface BlogPost { id: string; status: string; [k: string]: unknown }
interface BlogQueue { posts: BlogPost[] }

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function POST(request: Request) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const path = dataPath("blog-queue.json");
    const queue = readJson<BlogQueue>(path) || { posts: [] };
    const post = queue.posts.find((p) => p.id === id);
    if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

    post.status = "approved";
    post.approvedAt = new Date().toISOString();
    writeJson(path, queue);
    return Response.json({ ok: true });
  });
}
