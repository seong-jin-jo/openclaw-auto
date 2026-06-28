import crypto from "node:crypto";
import { db } from "@/lib/db";
import { getUserFromToken } from "@/lib/supabase";

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

// 로그인 세션(Supabase Auth JWT) → tenant. Authorization: Bearer <jwt>(osmu_ 아님)에서 추출·검증.
// 고객 셀프서브: 가입/로그인한 사람의 테넌트로 스코프. 유저는 있으나 테넌트 없으면(첫 로그인) 자동 생성.
export async function resolveTenantBySession(request: Request): Promise<string | null> {
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!raw || raw.startsWith("osmu_")) return null; // osmu_는 테넌트 토큰 경로(별개)
  const user = await getUserFromToken(raw);
  if (!user) return null;
  return ensureTenantForUser(user.id, user.email ?? null);
}

// auth 유저 → tenant(owner_auth_id 매핑). 없으면 생성(첫 로그인 셀프서브 온보딩).
// tenants는 RLS 제외라 bare db(). slug 충돌은 base+난수로 회피.
// ⚠️ 멱등·레이스 안전: 동시 첫로그인(여러 요청 병렬)이면 SELECT가 둘 다 비어 INSERT가 충돌해
//   unique 위반 throw → 500 → 클라 재시도 폭주 → CPU 100% 고착(2026-06-28 장애). 그래서
//   ON CONFLICT (owner_auth_id) DO UPDATE ... RETURNING로 중복이어도 기존 id를 throw 없이 반환한다.
export async function ensureTenantForUser(authId: string, email: string | null): Promise<string> {
  const sql = db();
  const [existing] = await sql<{ id: string }[]>`SELECT id FROM tenants WHERE owner_auth_id = ${authId} LIMIT 1`;
  if (existing) return existing.id;
  const base = (email?.split("@")[0] || "user").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) || "user";
  const slug = `${base}-${crypto.randomBytes(3).toString("hex")}`;
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO tenants (slug, name, status, tier, owner_auth_id)
    VALUES (${slug}, ${email || slug}, 'active', 'team', ${authId})
    ON CONFLICT (owner_auth_id) DO UPDATE SET owner_auth_id = EXCLUDED.owner_auth_id
    RETURNING id`;
  return row.id;
}

// 유효 tenantId 결정. 우선순위: ① 로그인 세션 > ② API 토큰 > ③ 커스텀 도메인(Host) > ④ 클라 fallback(운영자).
// 고객은 로그인 세션으로, 포크는 osmu_ 토큰으로, CNAME은 Host로, 운영자 중앙은 fallback으로 스코프.
export async function effectiveTenantId(request: Request, fallback?: string | null): Promise<string | null> {
  const fromSession = await resolveTenantBySession(request);
  if (fromSession) return fromSession;
  const fromToken = await resolveTenantFromRequest(request);
  if (fromToken) return fromToken;
  const fromHost = await resolveTenantByHost(request);
  if (fromHost) return fromHost;
  return fallback || null;
}
