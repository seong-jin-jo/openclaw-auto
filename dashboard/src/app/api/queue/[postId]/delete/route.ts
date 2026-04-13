import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });

  const before = queue.posts.length;
  queue.posts = queue.posts.filter((p) => p.id !== postId);
  if (queue.posts.length === before) return Response.json({ error: "post not found" }, { status: 404 });

  writeJson(dataPath("queue.json"), queue);
  return Response.json({ ok: true });
}
