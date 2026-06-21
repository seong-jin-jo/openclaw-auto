import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface QueuePost {
  id: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  [key: string]: unknown;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    const data = await request.json();
    const imageUrl = data.imageUrl || "";

    if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });

    let count = -1;
    await mutateJson<{ version: number; posts: QueuePost[] }>(dataPath("queue.json"), (queue) => {
      for (const p of queue.posts) {
        if (p.id === postId) {
          if (!p.imageUrls) p.imageUrls = [];
          p.imageUrls.push(imageUrl);
          if (!p.imageUrl) p.imageUrl = imageUrl;
          count = p.imageUrls.length;
        }
      }
      return queue;
    }, { version: 2, posts: [] });

    if (count < 0) return Response.json({ error: "Post not found" }, { status: 404 });
    return Response.json({ ok: true, count });
  });
}
