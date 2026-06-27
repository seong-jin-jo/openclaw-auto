import { withTenant } from "@/lib/db";
import { effectiveTenantId } from "@/lib/tenant-auth";

// Anthropic 키 유효성 검증 — 최소 호출(max_tokens:1)로 키만 확인. 401/403=키 문제, 그 외=일시오류.
async function verifyAnthropicKey(apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.OSMU_GEN_MODEL || "claude-sonnet-4-6",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, error: "인증 실패 — 키를 확인하세요" };
    return { ok: false, error: `Anthropic API ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// 테넌트 통합(채널 토큰 / AI 키 / MCP). secret_enc = pgcrypto 암호화.
// 모든 쿼리는 withTenant 경유(L1 RLS 방어심층 — app.tenant_id 트랜잭션 스코프).
// GET /api/integrations?tenant_id=... — 목록(시크릿 마스킹)
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ integrations: [] });
  try {
    const rows = await withTenant(tenantId, (sql) => sql<{ id: string; kind: string; label: string; meta: unknown; has_secret: boolean }[]>`
      SELECT id, kind, label, meta, (secret_enc IS NOT NULL AND secret_enc <> '') AS has_secret
      FROM integrations WHERE tenant_id = ${tenantId} ORDER BY kind, label`);
    return Response.json({ integrations: rows });
  } catch (e) {
    return Response.json({ integrations: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/integrations — 저장/갱신 { tenant_id, kind, label, secret, meta? }
// 예: { kind:'channel', label:'threads', secret:'<access_token>', meta:{userId:'...'} }
export async function POST(request: Request) {
  const __b = await request.json();
  const { kind, label, secret, meta } = __b;
  const tenant_id = await effectiveTenantId(request, __b.tenant_id);
  if (!tenant_id || !kind || !label) {
    return Response.json({ error: "tenant_id, kind, label required" }, { status: 400 });
  }
  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return Response.json({ error: "OSMU_SECRET_KEY 미설정 — 시크릿 암호화 불가" }, { status: 500 });
  // A3: Anthropic 키는 저장 전 실제 호출로 유효성 검증(잘못된 키를 조용히 저장 → 생성 실패 후에야 인지 방지).
  if (kind === "anthropic" && secret) {
    const v = await verifyAnthropicKey(String(secret));
    if (!v.ok) return Response.json({ error: `Anthropic 키 검증 실패: ${v.error}` }, { status: 400 });
  }
  try {
    // L2: secret을 pgcrypto로 암호화 저장(armor=TEXT). 평문 적재 금지.
    await withTenant(tenant_id, (sql) => sql`
      INSERT INTO integrations (tenant_id, kind, label, secret_enc, meta)
      VALUES (${tenant_id}, ${kind}, ${label}, armor(pgp_sym_encrypt(${secret ?? ""}, ${key})), ${sql.json(meta ?? {})})
      ON CONFLICT (tenant_id, kind, label) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc, meta = EXCLUDED.meta`);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
