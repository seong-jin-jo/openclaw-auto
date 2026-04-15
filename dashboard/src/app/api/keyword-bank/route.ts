import { readJson, dataPath } from "@/lib/file-io";

interface KeywordBank {
  keywords: Array<{ keyword: string; source?: string; addedAt?: string; used?: boolean; usedAt?: string }>;
}

export async function GET() {
  const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
  return Response.json(bank);
}
