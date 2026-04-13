import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request) {
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });

  const data = await request.json();
  const ids = new Set<string>(data.ids || []);
  const before = queue.posts.length;
  queue.posts = queue.posts.filter((p) => !ids.has(p.id as string));

  writeJson(dataPath("queue.json"), queue);
  return Response.json({ ok: true, deleted: before - queue.posts.length });
}
