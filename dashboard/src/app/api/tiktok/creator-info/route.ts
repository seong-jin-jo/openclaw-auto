import { effectiveTenantId, AuthError } from "@/lib/tenant-auth";
import { getChannelCred } from "@/lib/publish";
import { queryTikTokCreatorInfo } from "@/lib/tiktok";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const accountId = new URL(request.url).searchParams.get("account_id") || undefined;
  if (accountId && !UUID_RE.test(accountId)) {
    return Response.json({ error: "계정 식별자 형식이 올바르지 않습니다." }, { status: 400 });
  }

  let tenantId: string | null;
  try {
    tenantId = await effectiveTenantId(request, null);
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json({ error: "테넌트를 확인할 수 없습니다." }, { status: 500 });
  }
  if (!tenantId) return Response.json({ error: "테넌트를 확인할 수 없습니다." }, { status: 400 });

  const cred = await getChannelCred(tenantId, "tiktok", accountId);
  if (!cred?.token) {
    return Response.json({ connected: false, error: "TikTok 계정을 먼저 연결해주세요." }, { status: 404 });
  }

  const creator = await queryTikTokCreatorInfo(cred.token);
  if (!creator) {
    return Response.json(
      { connected: true, ready: false, error: "TikTok 계정 정보를 확인하지 못했습니다. 계정을 다시 연결해주세요." },
      { status: 502 },
    );
  }
  return Response.json({ connected: true, ready: true, accountId: cred.accountId, creator });
}
