import { db } from "@/lib/db";
import { publicOrigin } from "@/lib/social-connect";

interface CustomerRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  tier: string;
  owner_auth_id: string | null;
  created_at: string;
  integrations: Array<{ kind: string; label: string | null; has_secret: boolean; connected_at?: string | null }>;
  drafts_count: number;
  published_count: number;
  failed_count: number;
  usage_events_count: number;
  last_usage_at: string | null;
  shorts_used: number | null;
  generations_used: number | null;
}

interface AuthUserRow {
  id: string;
  email: string | null;
  provider: string | null;
  created_at: string;
  email_confirmed_at: string | null;
  confirmation_sent_at: string | null;
  recovery_sent_at: string | null;
  last_sign_in_at: string | null;
  tenant_id: string | null;
  tenant_slug: string | null;
}

function operatorError(request: Request): Response | null {
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (operatorToken && raw !== operatorToken) {
    return Response.json({ error: "operator token required" }, { status: 401 });
  }
  return null;
}

function supabaseBase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
}

function supabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

async function sendPasswordResetEmail(email: string, request: Request): Promise<void> {
  const base = supabaseBase();
  const anon = supabaseAnonKey();
  if (!base || !anon) {
    throw new Error("Supabase URL/anon key missing");
  }

  const redirectTo = `${publicOrigin(request)}/login?type=recovery`;
  const url = new URL(`${base}/auth/v1/recover`);
  url.searchParams.set("redirect_to", redirectTo);

  const res = await fetch(url.href, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Supabase recover ${res.status}`);
  }
}

export async function GET(request: Request) {
  const authError = operatorError(request);
  if (authError) return authError;

  try {
    const sql = db();
    const rows = await sql<CustomerRow[]>`
      SELECT
        t.id::text,
        t.slug,
        t.name,
        t.status,
        t.tier,
        t.owner_auth_id::text,
        t.created_at::text,
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'kind', i.kind,
            'label', i.label,
            'has_secret', i.secret_enc <> '',
            'connected_at', i.meta->>'connectedAt'
          ) ORDER BY i.kind, i.label)
          FROM integrations i
          WHERE i.tenant_id = t.id
        ), '[]'::jsonb) AS integrations,
        COALESCE((SELECT count(*)::int FROM drafts d WHERE d.tenant_id = t.id), 0) AS drafts_count,
        COALESCE((SELECT count(*)::int FROM published_posts p WHERE p.tenant_id = t.id AND p.status = 'published'), 0) AS published_count,
        COALESCE((SELECT count(*)::int FROM published_posts p WHERE p.tenant_id = t.id AND p.status = 'failed'), 0) AS failed_count,
        COALESCE((SELECT count(*)::int FROM usage_events u WHERE u.tenant_id = t.id), 0) AS usage_events_count,
        (SELECT max(u.created_at)::text FROM usage_events u WHERE u.tenant_id = t.id) AS last_usage_at,
        uq.shorts_used,
        uq.generations_used
      FROM tenants t
      LEFT JOIN usage_quotas uq ON uq.tenant_id = t.id
      ORDER BY t.created_at DESC
      LIMIT 200`;
    const authUsers = await sql<AuthUserRow[]>`
      SELECT
        u.id::text,
        u.email,
        COALESCE(u.raw_app_meta_data->>'provider', '') AS provider,
        u.created_at::text,
        u.email_confirmed_at::text,
        u.confirmation_sent_at::text,
        u.recovery_sent_at::text,
        u.last_sign_in_at::text,
        t.id::text AS tenant_id,
        t.slug AS tenant_slug
      FROM auth.users u
      LEFT JOIN tenants t ON t.owner_auth_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 500`;
    return Response.json({ customers: rows, authUsers });
  } catch (e) {
    return Response.json({ customers: [], authUsers: [], error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = operatorError(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({})) as { action?: string; email?: string };
    const email = String(body.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return Response.json({ error: "valid email required" }, { status: 400 });
    }

    if (body.action === "send_password_reset") {
      await sendPasswordResetEmail(email, request);
      return Response.json({
        ok: true,
        action: "send_password_reset",
        email,
        note: "비밀번호 원문은 조회하지 않았고 재설정 메일만 발송했습니다.",
      });
    }

    return Response.json({ error: "unsupported action" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
