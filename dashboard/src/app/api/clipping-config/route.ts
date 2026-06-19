import { readJson, writeJson, dataPath } from "@/lib/file-io";

const CLIPPING_CONFIG_PATH = dataPath("clipping-config.json");

export interface ClippingConfig {
  provider?: "reap" | "ssemble" | "";
  apiKey?: string;
  baseUrl?: string; // optional override
}

export async function GET() {
  const cfg = readJson<ClippingConfig>(CLIPPING_CONFIG_PATH) || {};
  return Response.json({
    configured: Boolean(cfg.apiKey),
    provider: cfg.provider || "",
    apiKey: cfg.apiKey || "",
    baseUrl: cfg.baseUrl || "",
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  writeJson(CLIPPING_CONFIG_PATH, {
    provider: data.provider || "",
    apiKey: data.apiKey || "",
    baseUrl: data.baseUrl || "",
  });
  return Response.json({ ok: true });
}
