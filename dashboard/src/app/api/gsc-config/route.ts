import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function GET() {
  const keyData = readJson<Record<string, string>>(dataPath("gsc-service-account.json"));
  if (!keyData) return Response.json({ configured: false, email: "" });
  return Response.json({ configured: true, email: keyData.client_email || "" });
}

export async function POST(request: Request) {
  const data = await request.json();
  const keyJson = data.keyJson || "";
  if (!keyJson) return Response.json({ error: "keyJson is required" }, { status: 400 });

  try {
    const parsed = typeof keyJson === "string" ? JSON.parse(keyJson) : keyJson;
    if (!parsed.client_email || !parsed.private_key) {
      return Response.json({ error: "Invalid service account JSON: missing client_email or private_key" }, { status: 400 });
    }
    writeJson(dataPath("gsc-service-account.json"), parsed);
    return Response.json({ ok: true, email: parsed.client_email || "" });
  } catch {
    return Response.json({ error: "Invalid JSON format" }, { status: 400 });
  }
}
