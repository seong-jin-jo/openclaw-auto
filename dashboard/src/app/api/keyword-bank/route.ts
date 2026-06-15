import { readJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface KeywordBank {
  keywords: Array<{ keyword: string; source?: string; addedAt?: string; used?: boolean; usedAt?: string }>;
}

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 data/tenants/{id}/ 로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
    return Response.json(bank);
  });
}
