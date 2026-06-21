import { effectiveTenantId } from "@/lib/tenant-auth";
import { withTenant, db } from "@/lib/db";

// 테넌트 격리 시각 증명. "0"은 클라이언트가 위조하는 값이 아니라 실제 RLS-스코프 쿼리 결과.
// withTenant 안에서 다른 테넌트(tenant_id <> 현재) 행을 세면 RLS가 강제로 0을 반환한다.
// otherTenants(전체 테넌트 - 나)로 "다른 테넌트가 N개 있는데 그 데이터를 0개 본다"는 증명을 완성.
// tenant는 effectiveTenantId로만 도출 — 클라이언트가 보낸 tenant_id는 절대 신뢰하지 않는다.
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ error: "no-tenant" }, { status: 401 });

  try {
    const result = await withTenant(tenantId, async (sql) => {
      const [own] = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM drafts`;
      const [cross] = await sql<{ c: number }[]>`
        SELECT count(*)::int AS c FROM drafts
        WHERE tenant_id <> current_setting('app.tenant_id', true)::uuid`;
      return { own: own.c, crossTenant: cross.c };
    });

    // 시스템에 존재하는 "다른 테넌트" 수 (tenants는 RLS 제외라 bare db). 증명 맥락용.
    let otherTenants = 0;
    try {
      const sql = db();
      const [row] = await sql<{ c: number }[]>`
        SELECT count(*)::int AS c FROM tenants WHERE id <> ${tenantId} AND status = 'active'`;
      otherTenants = row?.c ?? 0;
    } catch {}

    return Response.json({ ...result, otherTenants });
  } catch {
    return Response.json({ error: "db-unavailable" }, { status: 503 });
  }
}
