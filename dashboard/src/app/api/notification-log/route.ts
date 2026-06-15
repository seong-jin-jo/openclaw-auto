import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 file-io가 data/tenants/{id}/ 로 격리되도록 함
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const log = readJson<Record<string, unknown>>(dataPath("notification-log.json")) || { entries: [] };
    return Response.json(log);
  });
}
