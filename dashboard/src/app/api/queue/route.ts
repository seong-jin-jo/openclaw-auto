import { readJson, dataPath } from "@/lib/file-io";

interface QueueData {
  posts: Array<Record<string, unknown>>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const queue = readJson<QueueData>(dataPath("queue.json")) || { posts: [] };
  let posts = queue.posts || [];

  if (status && status !== "all") {
    posts = posts.filter((p) => p.status === status);
  }

  // Sort by generatedAt descending (matching Flask)
  posts.sort((a, b) => {
    const aAt = (a.generatedAt as string) || "";
    const bAt = (b.generatedAt as string) || "";
    return bAt.localeCompare(aAt);
  });

  return Response.json({ posts, total: posts.length });
}
