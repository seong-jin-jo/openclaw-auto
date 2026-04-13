import { readJson, dataPath } from "@/lib/file-io";

interface BlogQueueData {
  posts: Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const queue = readJson<BlogQueueData>(dataPath("blog-queue.json"));
  if (!queue) return Response.json({ posts: [], total: 0 });

  let posts = queue.posts || [];
  if (status) posts = posts.filter((p) => p.status === status);
  posts.sort((a, b) => String(b.generatedAt || "").localeCompare(String(a.generatedAt || "")));

  return Response.json({ posts, total: posts.length });
}
