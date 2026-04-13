import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { AUTOMATION_FEATURES } from "@/lib/constants";

interface ChannelSettingsData {
  [channel: string]: Record<string, boolean>;
}

function readChannelSettings(): ChannelSettingsData {
  const data: ChannelSettingsData = readJson<ChannelSettingsData>(dataPath("channel-settings.json")) || {};
  for (const ch of ["threads", "x"]) {
    if (!data[ch]) data[ch] = {};
    for (const f of AUTOMATION_FEATURES) {
      if (!(f.key in data[ch])) {
        data[ch][f.key] = f.default;
      }
    }
  }
  return data;
}

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const body = await request.json();
  const data = readChannelSettings();
  const validKeys = new Set(AUTOMATION_FEATURES.map((f) => f.key));

  if (!data[channel]) data[channel] = {};
  for (const [k, v] of Object.entries(body)) {
    if (validKeys.has(k) && typeof v === "boolean") {
      data[channel][k] = v;
    }
  }

  writeJson(dataPath("channel-settings.json"), data);
  return Response.json({ ok: true, settings: data[channel] });
}
