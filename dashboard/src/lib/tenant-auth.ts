import crypto from "node:crypto";
import { db } from "@/lib/db";

// 인증모델 b — 테넌트 API 토큰. 포크 프론트가 Bearer 토큰으로 중앙 API 호출 →
// 서버가 토큰을 tenant_id로 해석해 withTenant(tenant)로 못박음(클라가 tenant_id 못 속임).
// 원문은 발급 시 1회만 노출, DB엔 sha256 해시만 저장.

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// 토큰 발급(운영자) — 원문 1회 반환. 포크에 전달해 OSMU_TENANT_TOKEN으로 설정.
export async function issueTenantToken(tenantId: string, label?: string): Promise<{ token: string; id: string }> {
  const raw = "osmu_" + crypto.randomBytes(24).toString("base64url");
  const sql = db();
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO tenant_tokens (tenant_id, token_hash, label)
    VALUES (${tenantId}, ${hashToken(raw)}, ${label ?? null}) RETURNING id`;
  return { token: raw, id: row.id };
}

// 토큰 → tenant_id 해석. RLS 컨텍스트 진입 전이라 db() 직접(tenant_tokens는 RLS 제외).
// 폐기/미존재면 null. last_used_at은 비차단 갱신.
export async function resolveTenantToken(raw: string | null | undefined): Promise<string | null> {
  if (!raw) return null;
  const sql = db();
  const h = hashToken(raw);
  const [row] = await sql<{ tenant_id: string }[]>`
    SELECT tenant_id FROM tenant_tokens WHERE token_hash = ${h} AND revoked = false LIMIT 1`;
  if (!row) return null;
  void sql`UPDATE tenant_tokens SET last_used_at = now() WHERE token_hash = ${h}`.catch(() => {});
  return row.tenant_id;
}

// 요청에서 테넌트 해석: Authorization: Bearer <token>. 없거나 무효면 null.
export async function resolveTenantFromRequest(request: Request): Promise<string | null> {
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!raw.startsWith("osmu_")) return null; // 테넌트 토큰만(운영자 DASHBOARD_AUTH_TOKEN은 별개)
  return resolveTenantToken(raw);
}

// Host 헤더 → tenant_id (커스텀 도메인 CNAME, 호스팅 멀티테넌트). tenants.domain 매핑.
// localhost/빈 host는 skip(운영자 중앙 도메인·dev → fallback 사용).
export async function resolveTenantByHost(request: Request): Promise<string | null> {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  const sql = db();
  const [row] = await sql<{ id: string }[]>`
    SELECT id FROM tenants WHERE domain = ${host} AND status = 'active' LIMIT 1`;
  return row?.id || null;
}

// 유효 tenantId 결정. 우선순위: ① API 토큰(명시) > ② 커스텀 도메인(Host) > ③ 클라 fallback(운영자 워크스페이스 선택).
// 테넌트 CNAME으로 접속하면 Host가 테넌트를 못박아 남의 데이터 못 봄. 중앙 도메인은 fallback(운영자 전체 관리).
export async function effectiveTenantId(request: Request, fallback?: string | null): Promise<string | null> {
  const fromToken = await resolveTenantFromRequest(request);
  if (fromToken) return fromToken;
  const fromHost = await resolveTenantByHost(request);
  if (fromHost) return fromHost;
  return fallback || null;
}
