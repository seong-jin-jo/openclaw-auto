import { effectiveTenantId } from "@/lib/tenant-auth";
import { refreshYoutubeAccessToken } from "@/lib/youtube-token";

// POST /api/youtube/refresh — 사용자가 수동으로 누르는 갱신 버튼. finding 5: 실제 갱신 로직은
// lib/youtube-token.ts의 refreshYoutubeAccessToken() 단일 헬퍼 하나뿐 — /api/video/publish의
// 자동 재시도도 같은 헬퍼를 쓴다(로직 중복 금지, 드리프트 방지).
export async function POST(request: Request) {
  const url = new URL(request.url);
  const tenantId = await effectiveTenantId(request, url.searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });

  const result = await refreshYoutubeAccessToken(tenantId, url.searchParams.get("account_id") || undefined);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status ?? 500 });
  }
  return Response.json({ ok: true });
}
