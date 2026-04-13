import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });

  const data = await request.json();
  for (const post of queue.posts || []) {
    if (post.id === postId) {
      if (data.status && ["draft", "approved"].includes(data.status)) post.status = data.status;
      if (typeof data.text === "string" && data.text.trim()) {
        if (!post.originalText && post.text !== data.text) post.originalText = post.text;
        post.text = data.text;
      }
      if (data.topic !== undefined) post.topic = data.topic;
      if (data.hashtags !== undefined) post.hashtags = data.hashtags;
      if (data.scheduledAt !== undefined) post.scheduledAt = data.scheduledAt;
      if (data.imageUrl !== undefined) {
        if (data.imageUrl === null || (typeof data.imageUrl === "string" && (data.imageUrl.startsWith("/images/") || data.imageUrl.startsWith("https://")))) {
          post.imageUrl = data.imageUrl;
        } else {
          return Response.json({ error: "imageUrl must be null, /images/ path, or https:// URL" }, { status: 400 });
        }
      }
      writeJson(dataPath("queue.json"), queue);
      return Response.json({ ok: true, post });
    }
  }
  return Response.json({ error: "post not found" }, { status: 404 });
}
