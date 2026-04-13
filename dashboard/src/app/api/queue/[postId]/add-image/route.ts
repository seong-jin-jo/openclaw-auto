import { readJson, writeJson, dataPath } from "@/lib/file-io";

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
  const { postId } = await params;
  const data = await request.json();
  const imageUrl = data.imageUrl || "";

  if (!imageUrl) return Response.json({ error: "imageUrl required" }, { status: 400 });

  const queue = readJson<{ version: number; posts: QueuePost[] }>(dataPath("queue.json"))
    || { version: 2, posts: [] };

  for (const p of queue.posts) {
    if (p.id === postId) {
      if (!p.imageUrls) p.imageUrls = [];
      p.imageUrls.push(imageUrl);
      if (!p.imageUrl) p.imageUrl = imageUrl;
      writeJson(dataPath("queue.json"), queue);
      return Response.json({ ok: true, count: p.imageUrls.length });
    }
  }

  return Response.json({ error: "Post not found" }, { status: 404 });
}
