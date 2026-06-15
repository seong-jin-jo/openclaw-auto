import { readText, writeText, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

// 테넌트 컨텍스트로 감싸 파일을 data/tenants/{id}/ 로 격리(운영자=공유 루트).
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    const guide = readText(dataPath("prompt-guide.txt"));
    return Response.json({ guide });
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  const guide = data.guide;
  if (typeof guide !== "string") {
    return Response.json({ error: "guide must be a string" }, { status: 400 });
  }
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    writeText(dataPath("prompt-guide.txt"), guide);
    return Response.json({ ok: true });
  });
}
