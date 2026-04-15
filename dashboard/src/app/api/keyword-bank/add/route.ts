import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface KeywordEntry {
  keyword: string;
  source?: string;
  addedAt?: string;
  used?: boolean;
}

interface KeywordBank {
  keywords: KeywordEntry[];
}

export async function POST(request: Request) {
  const data = await request.json();
  const keywords: Array<string | KeywordEntry> = data.keywords || [];
  const source: string = data.source || "manual";

  if (!keywords.length) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
  const existing = new Set(bank.keywords.map((k) => k.keyword));
  let added = 0;

  for (const kw of keywords) {
    const entry: KeywordEntry = typeof kw === "string" ? { keyword: kw } : kw;
    if (entry.keyword && !existing.has(entry.keyword)) {
      if (!entry.source) entry.source = source;
      if (!entry.addedAt) entry.addedAt = new Date().toISOString();
      if (entry.used === undefined) entry.used = false;
      bank.keywords.push(entry);
      existing.add(entry.keyword);
      added++;
    }
  }

  writeJson(dataPath("keyword-bank.json"), bank);
  return Response.json({ ok: true, added, total: bank.keywords.length });
}
