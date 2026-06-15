import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 격리 (본문 로직 불변)
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const growth = readJson(dataPath("growth.json"));
  if (!growth) return Response.json({ records: [] });
  return Response.json(growth);
  });
}
