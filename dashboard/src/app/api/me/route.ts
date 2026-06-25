import { effectiveTenantId } from "@/lib/tenant-auth";
import { db } from "@/lib/db";

// 로그인한 "나"의 워크스페이스. 고객(세션/토큰)이면 자기 테넌트 1개, 운영자(중앙·토큰없음)면 isOperator.
// 고객 모드 UI는 이걸로 스위처를 숨기고 자기 워크스페이스만 고정한다(남의 서비스명 노출 0).
export async function GET(request: Request) {
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";

  // 운영자 토큰은 가장 싼 문자열 비교로 먼저 단락 — SWR로 폴링되는 엔드포인트라
  // 매번 JWT 검증 + DB 2쿼리(전부 운영자엔 miss 보장)를 도는 낭비를 막는다.
  if (operatorToken && raw === operatorToken) {
    return Response.json({ isOperator: true, tenant: null });
  }

  const tenantId = await effectiveTenantId(request, null);
  if (tenantId) {
    try {
      const sql = db();
      const [t] = await sql<{ id: string; slug: string; name: string }[]>`
        SELECT id, slug, name FROM tenants WHERE id = ${tenantId} LIMIT 1`;
      return Response.json({ isOperator: false, tenant: t || null });
    } catch (e) {
      return Response.json({ isOperator: false, tenant: null, error: String(e) }, { status: 500 });
    }
  }

  // 인증 비활성(dev — DASHBOARD_AUTH_TOKEN 미설정): 전 API가 공개이므로 운영자로 통과.
  // (그래야 dev에서 /operator 콘솔도 동작.)
  if (!operatorToken) {
    return Response.json({ isOperator: true, tenant: null });
  }

  // 고객 세션/포크 토큰인데 테넌트 해석 실패(prod) → 운영자로 둔갑 금지. 명시적 에러로 UI가 재시도.
  return Response.json({ isOperator: false, tenant: null, tenantError: true });
}
