import { readJson, dataPath } from "@/lib/file-io";

interface ElevenLabsConfig {
  apiKey?: string;
  voiceId?: string;
}

export async function GET() {
  const cfg = readJson<ElevenLabsConfig>(dataPath("elevenlabs-config.json")) || {};
  const apiKey = cfg.apiKey || "";
  if (!apiKey) {
    return Response.json({ error: "API key not set", voices: [] });
  }
  try {
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    const voices = (data.voices || []).map((v: Record<string, string>) => ({
      id: v.voice_id,
      name: v.name,
      category: v.category || "",
    }));
    return Response.json({ voices });
  } catch (e) {
    return Response.json({ error: String(e), voices: [] });
  }
}
