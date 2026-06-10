import { db, type Tenant } from "@/lib/db";

// GET /api/workspaces — 테넌트(워크스페이스) 목록 (DB-backed, SaaS 멀티테넌트)
// 단계0: 내부 팀용. 하드인증 없음. 격리는 SaaS화 시 RLS로 승격.
export async function GET() {
  try {
    const sql = db();
    const rows = await sql<Tenant[]>`
      SELECT id, slug, name, status, created_at
      FROM tenants WHERE status = 'active' ORDER BY created_at`;
    return Response.json({ workspaces: rows });
  } catch (e) {
    return Response.json({ workspaces: [], error: String(e) }, { status: 500 });
  }
}

// POST /api/workspaces — 워크스페이스 등록 { slug, name }
export async function POST(req: Request) {
  try {
    const { slug, name } = await req.json();
    if (!slug || !name) {
      return Response.json({ error: "slug, name 필수" }, { status: 400 });
    }
    const clean = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const sql = db();
    const [row] = await sql<Tenant[]>`
      INSERT INTO tenants (slug, name) VALUES (${clean}, ${String(name).trim()})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, slug, name, status, created_at`;
    return Response.json({ workspace: row });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
