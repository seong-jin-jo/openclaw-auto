import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { normalizeTone, DEFAULT_TONE, type VoiceTone } from "@/lib/voice-tone";

// 브랜드 보이스 슬라이더 설정(테넌트별). seed/generate가 읽어 톤 지침으로 컴파일.
const FILE = "voice-tone.json";

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    const saved = readJson<VoiceTone>(dataPath(FILE));
    return Response.json({ tone: saved ? normalizeTone(saved) : DEFAULT_TONE });
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    const tone = normalizeTone(body);
    writeJson(dataPath(FILE), tone);
    return Response.json({ ok: true, tone });
  });
}
