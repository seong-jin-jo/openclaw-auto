import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { AUTOMATION_FEATURES } from "@/lib/constants";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

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

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 테넌트별로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const data = readChannelSettings();
  return Response.json({ features: AUTOMATION_FEATURES, settings: data });
  });
}
