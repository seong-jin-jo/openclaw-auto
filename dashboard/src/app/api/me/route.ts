import { effectiveTenantId, AuthError } from "@/lib/tenant-auth";
import { db } from "@/lib/db";

// 로그인한 "나"의 워크스페이스. 고객(세션/토큰)이면 자기 테넌트 1개, 운영자(중앙·토큰없음)면 isOperator.
// 고객 모드 UI는 이걸로 스위처를 숨기고 자기 워크스페이스만 고정한다(남의 서비스명 노출 0).
// paused/unavailable 테넌트도 이 엔드포인트만은 200으로 상태를 알려줘야(accessPaused/accountUnavailable)
// AuthGate가 정지/이용불가 화면으로 분기할 수 있다 — 그래서 allowInactive:true로 호출한다.
// OSMU v1.0.0부터 계정 게이트는 paused/unavailable만(active는 항상 통과) — sharedAiApproved는
// 공유 claude -p 사용 가능 여부(별도 entitlement, tenants.shared_cli_approved_at)를 그대로 노출한다.
export async function GET(request: Request) {
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";

  // 운영자 토큰은 가장 싼 문자열 비교로 먼저 단락 — SWR로 폴링되는 엔드포인트라
  // 매번 JWT 검증 + DB 2쿼리(전부 운영자엔 miss 보장)를 도는 낭비를 막는다.
  if (operatorToken && raw === operatorToken) {
    return Response.json({ isOperator: true, tenant: null });
  }

  let tenantId: string | null;
  try {
    tenantId = await effectiveTenantId(request, null, { allowInactive: true });
  } catch (e) {
    // 무효/미인식 토큰이나 검증기 장애는 여기서도 절대 운영자로 둔갑하지 않는다 — 원래 에러 그대로.
    if (e instanceof AuthError) {
      return Response.json({ error: e.message, code: e.code }, { status: e.status });
    }
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }

  if (tenantId) {
    try {
      const sql = db();
      const [t] = await sql<{ id: string; slug: string; name: string; status: string; shared_cli_approved_at: string | null }[]>`
        SELECT id, slug, name, status, shared_cli_approved_at FROM tenants WHERE id = ${tenantId} LIMIT 1`;
      if (!t) return Response.json({ isOperator: false, tenant: null });
      const payload: Record<string, unknown> = {
        isOperator: false,
        tenant: { id: t.id, slug: t.slug, name: t.name, status: t.status },
        // 공유 claude -p 사용 승인 여부(계정 접근과 분리된 entitlement) — BYO Anthropic 키가 있으면
        // 이 값과 무관하게 생성 가능하므로 클라는 이 플래그를 "quota 안내"용으로만 쓴다.
        sharedAiApproved: Boolean(t.shared_cli_approved_at),
      };
      // 계정 게이트는 paused/unavailable만(active는 정상 페이로드). 레거시 pending 등 알수없는 값도
      // fail-closed로 accountUnavailable — assertTenantActive/checkTenantAccess와 동일 정책.
      if (t.status === "paused") payload.accessPaused = true;
      else if (t.status !== "active") payload.accountUnavailable = true;
      return Response.json(payload);
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
