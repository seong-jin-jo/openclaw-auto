import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface QueueData { posts: Array<Record<string, unknown>> }

export async function POST(request: Request) {
  const queue = readJson<QueueData>(dataPath("queue.json"));
  if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });

  const data = await request.json();
  const ids: string[] = data.ids || [];
  const intervalHours = data.intervalHours ?? 2;
  const now = Date.now();
  let approved = 0;

  for (const post of queue.posts || []) {
    if (ids.includes(post.id as string) && post.status === "draft") {
      post.status = "approved";
      post.approvedAt = new Date(now).toISOString();
      post.scheduledAt = new Date(now + intervalHours * 3600000 * approved).toISOString();
      approved++;
    }
  }

  writeJson(dataPath("queue.json"), queue);
  return Response.json({ ok: true, approved });
}
