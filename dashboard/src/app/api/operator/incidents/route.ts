import { db } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface IncidentRow {
  id: string;
  tenant_id: string;
  workspace_name: string;
  workspace_slug: string;
  category: string;
  source: string;
  reason_code: string;
  severity: string;
  intervention: string;
  status: string;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  recovered_at: string | null;
  notified_at: string | null;
}

function operatorError(request: Request): Response | null {
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  if (!operatorToken) return Response.json({ error: "operator token not configured" }, { status: 503 });
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (raw !== operatorToken) return Response.json({ error: "operator token required" }, { status: 401 });
  return null;
}

function serialize(row: IncidentRow) {
  return {
    id: row.id,
    workspaceId: row.tenant_id,
    workspaceName: row.workspace_name,
    workspaceSlug: row.workspace_slug,
    category: row.category,
    source: row.source,
    reasonCode: row.reason_code,
    severity: row.severity,
    intervention: row.intervention,
    status: row.status,
    occurrences: Number(row.occurrences),
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    recoveredAt: row.recovered_at,
    notifiedAt: row.notified_at,
  };
}

export async function GET(request: Request) {
  const authError = operatorError(request);
  if (authError) return authError;

  try {
    const sql = db();
    const rows = await sql<IncidentRow[]>`
      SELECT
        oi.id::text,
        oi.tenant_id::text,
        t.name AS workspace_name,
        t.slug AS workspace_slug,
        oi.category,
        oi.source,
        oi.reason_code,
        oi.severity,
        oi.intervention,
        oi.status,
        oi.occurrences,
        oi.first_seen_at::text,
        oi.last_seen_at::text,
        oi.recovered_at::text,
        oi.notified_at::text
      FROM operational_incidents oi
      JOIN tenants t ON t.id = oi.tenant_id
      ORDER BY (oi.status = 'open') DESC, oi.last_seen_at DESC
      LIMIT 200
    `;
    const incidents = rows.map(serialize);
    return Response.json({
      incidents,
      summary: {
        humanOpen: incidents.filter((item) => item.status === "open" && item.intervention === "human").length,
        automaticOpen: incidents.filter((item) => item.status === "open" && item.intervention === "automatic").length,
        recovered: incidents.filter((item) => item.status === "recovered").length,
      },
    });
  } catch {
    return Response.json({ incidents: [], error: "운영 장애 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = operatorError(request);
  if (authError) return authError;

  const body = await request.json().catch(() => ({})) as { action?: string; ids?: unknown };
  if (body.action !== "mark_notified" || !Array.isArray(body.ids)) {
    return Response.json({ error: "올바른 알림 확인 요청이 필요합니다." }, { status: 400 });
  }
  const ids = [...new Set(body.ids.filter((id): id is string => typeof id === "string" && UUID_RE.test(id)))];
  if (ids.length === 0 || ids.length > 100 || ids.length !== body.ids.length) {
    return Response.json({ error: "올바른 장애 식별자가 필요합니다." }, { status: 400 });
  }

  try {
    const sql = db();
    const updated = await sql<{ id: string }[]>`
      UPDATE operational_incidents
      SET notified_at = COALESCE(notified_at, now())
      WHERE id = ANY(${ids}::uuid[])
        AND status = 'open'
        AND intervention = 'human'
      RETURNING id::text
    `;
    return Response.json({ ok: true, marked: updated.length });
  } catch {
    return Response.json({ error: "알림 상태를 기록하지 못했습니다." }, { status: 500 });
  }
}
