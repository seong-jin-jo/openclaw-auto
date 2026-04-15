import { readJson, writeJson, configPath } from "@/lib/file-io";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

export async function GET() {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const seoCfg = config.plugins?.entries?.["seo-keywords"]?.config || {};
  const cid = seoCfg.naverClientId || process.env.NAVER_SEARCHAD_CLIENT_ID || "";
  const secret = seoCfg.naverClientSecret || process.env.NAVER_SEARCHAD_CLIENT_SECRET || "";
  const customer = seoCfg.naverCustomerId || process.env.NAVER_SEARCHAD_CUSTOMER_ID || "";
  return Response.json({ configured: Boolean(cid), clientId: cid, clientSecret: secret, customerId: customer });
}

export async function POST(request: Request) {
  const data = await request.json();
  const clientId: string = data.clientId || "";
  const clientSecret: string = data.clientSecret || "";
  const customerId: string = data.customerId || "";

  if (!clientId || !clientSecret || !customerId) {
    return Response.json({ error: "All 3 fields required" }, { status: 400 });
  }

  const cfgPath = configPath("openclaw.json");
  const config = readJson<OpenClawConfig>(cfgPath) || {};
  if (!config.plugins) config.plugins = { entries: {} };
  if (!config.plugins.entries) config.plugins.entries = {};

  const p = config.plugins.entries["seo-keywords"] || { enabled: true, config: {} };
  if (!p.config) p.config = {};
  p.config.naverClientId = clientId;
  p.config.naverClientSecret = clientSecret;
  p.config.naverCustomerId = customerId;
  p.enabled = true;
  config.plugins.entries["seo-keywords"] = p;

  writeJson(cfgPath, config);
  return Response.json({ ok: true });
}
