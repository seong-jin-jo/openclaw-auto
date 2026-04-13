import { readText, writeText, dataPath } from "@/lib/file-io";

function parseKeywords(content: string): string[] {
  return content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
}

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const commonContent = readText(dataPath("search-keywords.txt"));
  const channelContent = readText(dataPath(`search-keywords.${channel}.txt`));
  const common = parseKeywords(commonContent);
  const channelKw = parseKeywords(channelContent);
  const keywords = channelKw.length ? channelKw : common;
  return Response.json({ keywords, common, channelKeywords: channelKw.length > 0, channel });
}

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const data = await request.json();
  const keywords = data.keywords;
  if (!Array.isArray(keywords)) {
    return Response.json({ error: "keywords must be an array" }, { status: 400 });
  }
  const header = `# ${channel} 검색 키워드\n`;
  writeText(dataPath(`search-keywords.${channel}.txt`), header + keywords.join("\n") + "\n");
  return Response.json({ ok: true, count: keywords.length, channel });
}
