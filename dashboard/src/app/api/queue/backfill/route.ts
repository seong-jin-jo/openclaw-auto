import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { backfillQueueToDb } from "@/lib/queue-store";

// POST /api/queue/backfill — P4: 현 queue.json 전체를 queue_posts로 미러(멱등).
// read-switch 전에 DB를 완전한 그림자로 만든다. DB 미설정/RLS 미적용이면 skipped로 집계(무해).
export async function POST(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, async () => {
    const r = await backfillQueueToDb(tenantId);
    return Response.json({ ok: true, ...r });
  });
}
