import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { parsePopularPosts } from "@/lib/popular-posts";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 data/tenants/{id}/ 로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source");

    let posts = parsePopularPosts();
    if (source) posts = posts.filter((p) => p.source === source);

    return Response.json({ posts, total: posts.length });
  });
}
