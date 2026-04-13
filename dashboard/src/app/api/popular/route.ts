import { readText, dataPath } from "@/lib/file-io";

function parsePopularPosts() {
  const content = readText(dataPath("popular-posts.txt"));
  if (!content) return [];

  const blocks = content.split("---");
  const posts: Record<string, string>[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const post: Record<string, string> = {};
    const lines = trimmed.split("\n");
    const textLines: string[] = [];
    let inText = false;

    for (const line of lines) {
      if (line.startsWith("text:")) {
        inText = true;
        textLines.push(line.slice(5).trim());
      } else if (inText) {
        textLines.push(line.trim());
      } else if (line.includes(":")) {
        const idx = line.indexOf(":");
        post[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }
    if (textLines.length) post.text = textLines.join(" ").trim();
    if (post.text) posts.push(post);
  }
  return posts;
}

export { parsePopularPosts };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source");

  let posts = parsePopularPosts();
  if (source) posts = posts.filter((p) => p.source === source);

  return Response.json({ posts, total: posts.length });
}
