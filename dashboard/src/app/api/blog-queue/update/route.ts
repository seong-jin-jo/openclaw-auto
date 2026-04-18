import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface BlogPost { id: string; [k: string]: unknown }
interface BlogQueue { posts: BlogPost[] }

export async function POST(request: Request) {
  const data = await request.json();
  const { id, ...updates } = data;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const path = dataPath("blog-queue.json");
  const queue = readJson<BlogQueue>(path) || { posts: [] };
  const post = queue.posts.find((p) => p.id === id);
  if (!post) return Response.json({ error: "Post not found" }, { status: 404 });

  Object.assign(post, updates);
  writeJson(path, queue);
  return Response.json({ ok: true });
}
