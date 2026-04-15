import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface KeywordBank {
  keywords: Array<{ keyword: string }>;
}

export async function POST(request: Request) {
  const data = await request.json();
  const keyword: string = data.keyword || "";
  const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
  const before = bank.keywords.length;
  bank.keywords = bank.keywords.filter((k) => k.keyword !== keyword);
  writeJson(dataPath("keyword-bank.json"), bank);
  return Response.json({ ok: true, removed: before - bank.keywords.length });
}
