import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface BlogPost { id: string; [k: string]: unknown }
interface BlogQueue { posts: BlogPost[] }

export async function POST(request: Request) {
  const { id } = await request.json();
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const path = dataPath("blog-queue.json");
  const queue = readJson<BlogQueue>(path) || { posts: [] };
  queue.posts = queue.posts.filter((p) => p.id !== id);
  writeJson(path, queue);
  return Response.json({ ok: true });
}
