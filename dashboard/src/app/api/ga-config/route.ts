import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const cfg = readJson<Record<string, string>>(dataPath("ga-config.json"));
  if (!cfg) return Response.json({ configured: false, propertyId: "" });
  return Response.json({ configured: Boolean(cfg.propertyId), propertyId: cfg.propertyId || "" });
}

export async function POST(request: Request) {
  const data = await request.json();
  const pid = data.propertyId || "";
  if (!pid) return Response.json({ error: "propertyId required" }, { status: 400 });
  writeJson(dataPath("ga-config.json"), { propertyId: pid });
  return Response.json({ ok: true });
}
