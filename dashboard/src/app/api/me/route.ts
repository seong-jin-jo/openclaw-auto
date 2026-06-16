import { effectiveTenantId } from "@/lib/tenant-auth";
import { db } from "@/lib/db";

// 로그인한 "나"의 워크스페이스. 고객(세션/토큰)이면 자기 테넌트 1개, 운영자(중앙·토큰없음)면 isOperator.
// 고객 모드 UI는 이걸로 스위처를 숨기고 자기 워크스페이스만 고정한다(남의 서비스명 노출 0).
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  if (!tenantId) return Response.json({ isOperator: true, tenant: null });
  try {
    const sql = db();
    const [t] = await sql<{ id: string; slug: string; name: string }[]>`
      SELECT id, slug, name FROM tenants WHERE id = ${tenantId} LIMIT 1`;
    return Response.json({ isOperator: false, tenant: t || null });
  } catch (e) {
    return Response.json({ isOperator: false, tenant: null, error: String(e) }, { status: 500 });
  }
}
