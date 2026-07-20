import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { DEFAULT_SETTINGS, readSettings } from "@/lib/settings-store";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 file-io가 data/tenants/{id}/ 로 격리되도록 함
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    return Response.json(readSettings());
  });
}

export async function POST(request: Request) {
  // 테넌트 컨텍스트로 감싸 file-io가 data/tenants/{id}/ 로 격리되도록 함
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const current = readSettings();
    const allowedKeys = new Set(Object.keys(DEFAULT_SETTINGS));
    const updated: Record<string, number> = {};

    for (const key of allowedKeys) {
      if (key in data) {
        const val = data[key];
        if (typeof val === "number" && val >= 0) {
          updated[key] = Math.floor(val);
        }
      }
    }

    Object.assign(current, updated);
    writeJson(dataPath("settings.json"), current);
    return Response.json({ ok: true, settings: current });
  });
}
