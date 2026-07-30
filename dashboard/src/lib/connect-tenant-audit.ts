// OAuth 연결 라우트의 defense-in-depth 감사 로그.
// 고객 JWT가 확정한 tenant와 브라우저가 보낸 tenant_id가 다르면 서버가 JWT tenant를 계속
// 사용하되 불일치 사실만 기록한다. tenant id·Bearer 원문은 로그에 포함하지 않는다.
export function auditConnectTenantQueryMismatch(
  request: Request,
  effectiveTenantId: string,
  requestedTenantId: string | null,
): void {
  if (!requestedTenantId || requestedTenantId === effectiveTenantId) return;

  const bearer = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  const isCustomerJwt = bearer.length > 40
    && bearer.split(".").length === 3
    && (!operatorToken || bearer !== operatorToken);
  if (!isCustomerJwt) return;

  console.warn(JSON.stringify({
    kind: "oauth_connect_tenant_mismatch",
    customerJwt: true,
  }));
}
