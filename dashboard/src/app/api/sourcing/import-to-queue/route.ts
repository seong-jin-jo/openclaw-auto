import { effectiveTenantId } from "@/lib/tenant-auth";
import { importShortDraftsToQueue, countUnimportedShortDrafts } from "@/lib/sourcing-bridge";

// GET: 미import short draft 개수(UI 배지). POST: 큐로 가져오기(멱등).
// tenant는 effectiveTenantId로만 도출 — 클라이언트가 보낸 tenant_id 신뢰 안 함.
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ pending: 0 });
  const pending = await countUnimportedShortDrafts(tenantId);
  return Response.json({ pending });
}

export async function POST(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ error: "no-tenant" }, { status: 401 });
  try {
    const { imported } = await importShortDraftsToQueue(tenantId);
    return Response.json({ ok: true, imported });
  } catch (e) {
    return Response.json({ error: `import 실패: ${(e as Error).message.slice(0, 160)}` }, { status: 500 });
  }
}
