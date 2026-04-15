import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface KeywordEntry {
  keyword: string;
  used?: boolean;
  usedAt?: string;
}

interface KeywordBank {
  keywords: KeywordEntry[];
}

export async function POST(request: Request) {
  const data = await request.json();
  const keyword: string = data.keyword || "";
  const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
  for (const k of bank.keywords) {
    if (k.keyword === keyword) {
      k.used = true;
      k.usedAt = new Date().toISOString();
    }
  }
  writeJson(dataPath("keyword-bank.json"), bank);
  return Response.json({ ok: true });
}
