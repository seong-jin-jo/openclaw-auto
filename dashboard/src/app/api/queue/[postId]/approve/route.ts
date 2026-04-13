import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });

  const data = await request.json();
  for (const post of queue.posts || []) {
    if (post.id === postId) {
      post.status = "approved";
      const now = new Date();
      post.approvedAt = now.toISOString();
      const hours = typeof data.hours === "number" && data.hours >= 0 ? data.hours : 0;
      post.scheduledAt = new Date(now.getTime() + hours * 3600000).toISOString();
      writeJson(dataPath("queue.json"), queue);
      return Response.json({ ok: true, post });
    }
  }
  return Response.json({ error: "post not found" }, { status: 404 });
}
