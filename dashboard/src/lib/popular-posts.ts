import { dataPath, readText } from "@/lib/file-io";

export function parsePopularPosts(): Array<Record<string, string>> {
  const content = readText(dataPath("popular-posts.txt"));
  if (!content) return [];
  const posts: Array<Record<string, string>> = [];
  for (const block of content.split("---")) {
    const trimmed = block.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const post: Record<string, string> = {};
    const textLines: string[] = [];
    let inText = false;
    for (const line of trimmed.split("\n")) {
      if (line.startsWith("text:")) {
        inText = true;
        textLines.push(line.slice(5).trim());
      } else if (inText) {
        textLines.push(line.trim());
      } else if (line.includes(":")) {
        const index = line.indexOf(":");
        post[line.slice(0, index).trim()] = line.slice(index + 1).trim();
      }
    }
    if (textLines.length) post.text = textLines.join(" ").trim();
    if (post.text) posts.push(post);
  }
  return posts;
}
