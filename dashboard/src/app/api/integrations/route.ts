import { db } from "@/lib/db";

// 테넌트 통합(채널 토큰 / AI 키 / MCP). secret_enc = 단계0 평문(P4에서 암호화).
// GET /api/integrations?tenant_id=... — 목록(시크릿 마스킹)
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return Response.json({ integrations: [] });
  try {
    const sql = db();
    const rows = await sql<{ id: string; kind: string; label: string; meta: unknown; has_secret: boolean }[]>`
      SELECT id, kind, label, meta, (secret_enc IS NOT NULL AND secret_enc <> '') AS has_secret
      FROM integrations WHERE tenant_id = ${tenantId} ORDER BY kind, label`;
    return Response.json({ integrations: rows });
  } catch (e) {
    return Response.json({ integrations: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/integrations — 저장/갱신 { tenant_id, kind, label, secret, meta? }
// 예: { kind:'channel', label:'threads', secret:'<access_token>', meta:{userId:'...'} }
export async function POST(request: Request) {
  const { tenant_id, kind, label, secret, meta } = await request.json();
  if (!tenant_id || !kind || !label) {
    return Response.json({ error: "tenant_id, kind, label required" }, { status: 400 });
  }
  try {
    const sql = db();
    await sql`
      INSERT INTO integrations (tenant_id, kind, label, secret_enc, meta)
      VALUES (${tenant_id}, ${kind}, ${label}, ${secret ?? ""}, ${JSON.stringify(meta ?? {})}::jsonb)
      ON CONFLICT (tenant_id, kind, label) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc, meta = EXCLUDED.meta`;
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
