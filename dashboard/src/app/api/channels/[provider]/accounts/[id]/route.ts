import { effectiveTenantId, AuthError } from "@/lib/tenant-auth";
import { deleteChannelAccount } from "@/lib/channel-accounts";

// DELETE /api/channels/{provider}/accounts/{id} — 계정 연결해제.
// cross-tenant(다른 테넌트 소유 id)면 deleteChannelAccount가 0행 매칭 → 404(존재 자체를 숨김).
export async function DELETE(request: Request, { params }: { params: Promise<{ provider: string; id: string }> }) {
  const { provider, id } = await params;
  let tenantId: string | null;
  try {
    tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  } catch (e) {
    if (e instanceof AuthError) return Response.json({ error: e.message, code: e.code }, { status: e.status });
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (!tenantId) return Response.json({ error: "테넌트를 식별할 수 없습니다." }, { status: 401 });

  try {
    const result = await deleteChannelAccount(tenantId, provider, id);
    if (result.notFound) return Response.json({ error: "계정을 찾을 수 없습니다." }, { status: 404 });
    return Response.json({ ok: true, promotedId: result.promotedId ?? null });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
