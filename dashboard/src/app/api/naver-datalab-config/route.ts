import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface NaverDatalabConfig {
  clientId?: string;
  clientSecret?: string;
}

export async function GET() {
  const cfg = readJson<NaverDatalabConfig>(dataPath("naver-datalab-config.json")) || {};
  const cid = cfg.clientId || process.env.NAVER_CLIENT_ID || "";
  const secret = cfg.clientSecret || process.env.NAVER_CLIENT_SECRET || "";
  return Response.json({ configured: Boolean(cid), clientId: cid, clientSecret: secret });
}

export async function POST(request: Request) {
  const data = await request.json();
  const clientId: string = data.clientId || "";
  const clientSecret: string = data.clientSecret || "";

  if (!clientId || !clientSecret) {
    return Response.json({ error: "Client ID and Secret required" }, { status: 400 });
  }

  writeJson(dataPath("naver-datalab-config.json"), { clientId, clientSecret });
  return Response.json({ ok: true });
}
