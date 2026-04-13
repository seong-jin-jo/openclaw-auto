import { readText, writeText, dataPath } from "@/lib/file-io";

export async function GET() {
  const content = readText(dataPath("blog-keywords.txt"));
  const lines = content
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return Response.json({ keywords: lines });
}

export async function POST(request: Request) {
  const data = await request.json();
  const keywords = data.keywords;
  if (!Array.isArray(keywords)) {
    return Response.json({ error: "keywords must be an array" }, { status: 400 });
  }
  const header = "# Blog SEO 키워드 — 학생/학부모 대상 (한 줄에 하나, #=주석)\n";
  writeText(dataPath("blog-keywords.txt"), header + keywords.join("\n") + "\n");
  return Response.json({ ok: true, count: keywords.length });
}
