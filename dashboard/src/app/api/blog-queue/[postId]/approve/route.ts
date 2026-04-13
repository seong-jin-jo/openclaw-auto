import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface BlogQueueData { posts: Array<Record<string, unknown>> }

export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const queue = readJson<BlogQueueData>(dataPath("blog-queue.json"));
  if (!queue) return Response.json({ error: "blog-queue.json not found" }, { status: 404 });

  for (const post of queue.posts || []) {
    if (post.id === postId) {
      post.status = "approved";
      const now = new Date().toISOString();
      post.approvedAt = now;
      post.scheduledAt = now;
      writeJson(dataPath("blog-queue.json"), queue);
      return Response.json({ ok: true, post });
    }
  }
  return Response.json({ error: "post not found" }, { status: 404 });
}
