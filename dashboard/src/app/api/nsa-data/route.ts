import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const data = readJson(dataPath("nsa-data.json"));
  if (!data) {
    return Response.json({ clicks: 0, impressions: 0, ctr: 0, position: 0, keywords: [], savedAt: null });
  }
  return Response.json(data);
}

export async function POST(request: Request) {
  const data = await request.json();
  data.savedAt = new Date().toISOString();
  writeJson(dataPath("nsa-data.json"), data);
  return Response.json({ ok: true });
}
