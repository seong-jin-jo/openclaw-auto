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

export async function GET() {
  const data = readChannelSettings();
  return Response.json({ features: AUTOMATION_FEATURES, settings: data });
}
