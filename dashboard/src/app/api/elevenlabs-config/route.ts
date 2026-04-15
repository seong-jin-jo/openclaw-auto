import { readJson, writeJson, dataPath } from "@/lib/file-io";

const ELEVENLABS_CONFIG_PATH = dataPath("elevenlabs-config.json");

interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
}

export async function GET() {
  const cfg = readJson<ElevenLabsConfig>(ELEVENLABS_CONFIG_PATH) || {};
  return Response.json({
    configured: Boolean(cfg.apiKey),
    apiKey: cfg.apiKey || "",
    voiceId: cfg.voiceId || "",
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  writeJson(ELEVENLABS_CONFIG_PATH, {
    apiKey: data.apiKey || "",
    voiceId: data.voiceId || "",
  });
  return Response.json({ ok: true });
}
