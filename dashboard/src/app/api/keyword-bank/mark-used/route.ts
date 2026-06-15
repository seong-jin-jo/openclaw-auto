import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface KeywordEntry {
  keyword: string;
  used?: boolean;
  usedAt?: string;
}

interface KeywordBank {
  keywords: KeywordEntry[];
}

export async function POST(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 data/tenants/{id}/ 로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const keyword: string = data.keyword || "";
    const bank = readJson<KeywordBank>(dataPath("keyword-bank.json")) || { keywords: [] };
    for (const k of bank.keywords) {
      if (k.keyword === keyword) {
        k.used = true;
        k.usedAt = new Date().toISOString();
      }
    }
    writeJson(dataPath("keyword-bank.json"), bank);
    return Response.json({ ok: true });
  });
}
