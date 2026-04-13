import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const body = await request.json();
  const data = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  data.canva = { clientId: body.clientId || "", clientSecret: body.clientSecret || "" };
  writeJson(dataPath("design-tools.json"), data);
  return Response.json({ ok: true });
}
