import { db } from "@/lib/db";
import { issueTenantToken } from "@/lib/tenant-auth";

// 테넌트 API 토큰 관리(운영자 전용 — prod는 middleware DASHBOARD_AUTH_TOKEN 게이트).
// 포크 프론트에 발급 → OSMU_TENANT_TOKEN으로 중앙 API 호출. 원문은 발급 응답에만 1회.

// GET /api/tenant-tokens?tenant_id=... — 토큰 목록(원문 없음, 마스킹)
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  try {
    const sql = db();
    const rows = tenantId
      ? await sql`SELECT id, tenant_id, label, last_used_at, revoked, created_at
                  FROM tenant_tokens WHERE tenant_id = ${tenantId} ORDER BY created_at DESC`
      : await sql`SELECT id, tenant_id, label, last_used_at, revoked, created_at
                  FROM tenant_tokens ORDER BY created_at DESC`;
    return Response.json({ tokens: rows });
  } catch (e) {
    return Response.json({ tokens: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/tenant-tokens — { tenant_id, label? } → 토큰 발급(원문 1회 반환)
export async function POST(request: Request) {
  const { tenant_id, label } = await request.json();
  if (!tenant_id) return Response.json({ error: "tenant_id required" }, { status: 400 });
  try {
    const { token, id } = await issueTenantToken(tenant_id, label);
    return Response.json({ ok: true, id, token, note: "이 토큰은 지금만 표시됩니다. 안전히 보관 후 포크에 전달하세요." });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/tenant-tokens?id=... — 토큰 폐기(revoke)
export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  try {
    const sql = db();
    await sql`UPDATE tenant_tokens SET revoked = true WHERE id = ${id}`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
