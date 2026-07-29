import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";

// Studio 초안/발행 이력 — Supabase drafts 테이블(테넌트별). payload jsonb에 본문 보관.
interface DraftRow {
  id: string;
  tenant_id: string;
  idea: string;
  payload: {
    text?: unknown;
    img?: unknown;
    vid?: unknown;
    includes?: Record<string, boolean>;
    publishReconciliation?: unknown;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

// GET /api/studio/drafts?tenant_id=... — 워크스페이스 초안 목록(최근 50)
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ drafts: [] });
  try {
    const rows = await withTenant(tenantId, (sql) => sql<DraftRow[]>`
      SELECT id, tenant_id, idea, payload, status, created_at, updated_at
      FROM drafts WHERE tenant_id = ${tenantId}
      ORDER BY updated_at DESC LIMIT 50`);
    // 기존 Studio 형식과 호환되게 평탄화
    const drafts = rows.map((r) => ({
      id: r.id,
      idea: r.idea,
      text: r.payload?.text ?? null,
      img: r.payload?.img ?? null,
      vid: r.payload?.vid ?? null,
      includes: r.payload?.includes ?? {},
      publishReconciliation: r.payload?.publishReconciliation ?? null,
      status: r.status,
      savedAt: r.updated_at,
    }));
    return Response.json({ drafts });
  } catch (e) {
    return Response.json({ drafts: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/studio/drafts — 초안 저장/갱신 { tenant_id, id?, idea, text, img, vid, includes, status }
export async function POST(request: Request) {
  const body = await request.json();
  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });
  const payload = {
    text: body.text ?? null, img: body.img ?? null, vid: body.vid ?? null,
    includes: body.includes ?? {},
    publishReconciliation: body.publishReconciliation ?? null,
  };
  const status = body.status || "draft";
  const idea = body.idea || "";
  try {
    const id = await withTenant(tenantId, async (sql) => {
      if (body.id) {
        const [row] = await sql<{ id: string }[]>`
          UPDATE drafts SET idea = ${idea}, payload = ${sql.json(payload)}, status = ${status}, updated_at = now()
          WHERE id = ${body.id} AND tenant_id = ${tenantId} RETURNING id`;
        if (row) return row.id;
      }
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO drafts (tenant_id, idea, payload, status)
        VALUES (${tenantId}, ${idea}, ${sql.json(payload)}, ${status}) RETURNING id`;
      return row.id;
    });
    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
