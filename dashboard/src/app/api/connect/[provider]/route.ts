import { effectiveTenantId } from "@/lib/tenant-auth";
import { getProvider, buildAuthUrl } from "@/lib/social-connect";

// GET /api/connect/{provider}?tenant_id=... — OAuth "연결" 동의 URL 반환.
// 프론트의 "연결" 버튼이 호출 → 받은 authUrl을 팝업으로 연다 → 사용자가 provider 공식 페이지에서
// 로그인/동의(비번은 거기서만) → callback이 토큰을 받아 테넌트별 저장. (ADR-004)
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const cfg = getProvider(provider);
  if (!cfg) return Response.json({ error: `지원하지 않는 provider: ${provider}` }, { status: 400 });

  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });

  const origin = new URL(request.url).origin;
  const authUrl = buildAuthUrl(cfg, origin, provider, tenantId);
  if (!authUrl) return Response.json({ error: `${cfg.appIdEnv} 미설정 — 플랫폼 OAuth 앱 자격증명 필요` }, { status: 500 });
  return Response.json({ authUrl });
}
