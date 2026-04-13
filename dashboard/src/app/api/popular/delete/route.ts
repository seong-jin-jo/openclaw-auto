import { writeText, dataPath } from "@/lib/file-io";
import { parsePopularPosts } from "../route";

export async function POST(request: Request) {
  const data = await request.json();
  const index = data.index;
  if (typeof index !== "number" || index < 0) {
    return Response.json({ error: "invalid index" }, { status: 400 });
  }

  const posts = parsePopularPosts();
  if (index >= posts.length) {
    return Response.json({ error: "index out of range" }, { status: 404 });
  }

  posts.splice(index, 1);

  const header = "# Threads 인기글 참고 목록\n# source: manual(수동), external(외부수집), own-viral(자체바이럴)\n# type: 꿀팁, 공감, 의견, 경험담, 밈\n";
  let entries = "";
  for (const p of posts) {
    entries += "\n---\n";
    for (const [k, v] of Object.entries(p)) {
      if (k !== "text") entries += `${k}: ${v}\n`;
    }
    entries += `text: ${p.text || ""}\n`;
  }

  writeText(dataPath("popular-posts.txt"), header + entries);
  return Response.json({ ok: true });
}
