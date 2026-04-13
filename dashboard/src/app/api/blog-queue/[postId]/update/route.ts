import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface BlogQueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const queue = readJson<BlogQueueData>(dataPath("blog-queue.json"));
  if (!queue) return Response.json({ error: "blog-queue.json not found" }, { status: 404 });

  const data = await request.json();
  for (const post of queue.posts || []) {
    if (post.id === postId) {
      for (const key of ["title", "content", "seoKeyword", "category", "thumbnailUrl"]) {
        if (key in data && typeof data[key] === "string") {
          post[key] = data[key];
        }
      }
      if ("tags" in data && Array.isArray(data.tags)) {
        post.tags = data.tags.map(String);
      }
      writeJson(dataPath("blog-queue.json"), queue);
      return Response.json({ ok: true, post });
    }
  }
  return Response.json({ error: "post not found" }, { status: 404 });
}
