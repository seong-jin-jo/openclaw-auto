import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface QueueData {
  posts: Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
    let posts = queue.posts || [];

    if (status && status !== "all") {
      posts = posts.filter((p) => p.status === status);
    }

    // Sort by generatedAt descending (matching Flask)
    posts.sort((a, b) => {
      const aAt = (a.generatedAt as string) || "";
      const bAt = (b.generatedAt as string) || "";
      return bAt.localeCompare(aAt);
    });

    return Response.json({ posts, total: posts.length });
  });
}
