import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { buildPublishReturnContext, isPublishReturnSource } from "@/lib/publish-return-context";

interface QueueData {
  posts: Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const requestUrl = new URL(request.url);
  const __t = await effectiveTenantId(request, requestUrl.searchParams.get("tenant_id"));
  return runWithTenant(__t, async () => {
    const { searchParams } = requestUrl;
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    if (source && !isPublishReturnSource(source)) {
      return Response.json({ error: "source must be inbox or calendar" }, { status: 400 });
    }
    const returnSource = source && isPublishReturnSource(source) ? source : null;

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

    if (returnSource) {
      posts = posts.map((post) => ({
        ...post,
        publishContext: buildPublishReturnContext(post, returnSource),
      }));
    }

    return Response.json({ posts, total: posts.length });
  });
}
