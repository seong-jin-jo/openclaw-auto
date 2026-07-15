import { db } from "@/lib/db";
import { publicOrigin } from "@/lib/social-connect";
import { ensureTenantForUser } from "@/lib/tenant-auth";
import { reportFailure, normalizeOperatorAction } from "@/lib/observability";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface CustomerRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  tier: string;
  owner_auth_id: string | null;
  created_at: string;
  shared_cli_approved_at: string | null;
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
  tenant_status: string | null;
  tenant_shared_ai_approved_at: string | null;
}

// fail-closed: DASHBOARD_AUTH_TOKEN이 설정 안 됐으면(운영 사고) 이 라우트는 무조건 닫는다(503) —
// 과거엔 미설정 시 operatorToken이 falsy라 인증 자체를 건너뛰어(fail-open) 누구나 auth.users +
// integrations 존재여부를 열람할 수 있었다. 토큰이 설정된 경우엔 정확히 일치할 때만 통과(401).
function operatorError(request: Request): Response | null {
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  if (!operatorToken) {
    return Response.json({ error: "operator token not configured" }, { status: 503 });
  }
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (raw !== operatorToken) {
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
        t.shared_cli_approved_at::text,
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
        t.slug AS tenant_slug,
        t.status AS tenant_status,
        t.shared_cli_approved_at::text AS tenant_shared_ai_approved_at
      FROM auth.users u
      LEFT JOIN tenants t ON t.owner_auth_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 500`;
    return Response.json({ customers: rows, authUsers });
  } catch (e) {
    return Response.json({ customers: [], authUsers: [], error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

// 공통: user_id → auth.users 존재 검증 후 테넌트 확보(없으면 멱등 생성, OSMU v1.0.0부터 'active').
// 이메일이 아니라 user_id로 키잉한다(이메일은 auth.users에서 unique/stable 식별자가 아니므로
// 이메일 기반 뮤테이션은 의도적으로 금지). 이 레포는 GoTrue REST admin API(service_role key)를
// 어디서도 쓰지 않고 auth.users를 직접 Postgres로 조회하는 패턴을 이미 GET에서 쓰고 있어
// (admin listUsers/getUserById도 내부적으로 이 테이블을 조회) 동일 패턴을 따른다.
async function resolveTargetTenant(userId: unknown): Promise<{ error: Response } | { tenantId: string; id: string }> {
  const id = String(userId || "").trim();
  if (!id || !UUID_RE.test(id)) {
    return { error: Response.json({ error: "valid user_id required" }, { status: 400 }) };
  }
  const sql = db();
  const [authUser] = await sql<{ id: string; email: string | null }[]>`
    SELECT id::text, email FROM auth.users WHERE id = ${id} LIMIT 1`;
  if (!authUser) {
    return { error: Response.json({ error: "unknown user_id" }, { status: 404 }) };
  }
  const tenantId = await ensureTenantForUser(authUser.id, authUser.email);
  return { tenantId, id };
}

// 계정 정지/재개 — 계정 자체 접근(tenants.status)만 다룬다. OSMU v1.0.0부터 신규 가입은 이미
// active라 "승인"(approve_user) 액션은 없다 — 있는 건 정지(pause_user)와 그 해제(resume_user)뿐.
async function handleAccountStatusAction(action: "pause_user" | "resume_user", userId: unknown): Promise<Response> {
  const resolved = await resolveTargetTenant(userId);
  if ("error" in resolved) return resolved.error;
  const { tenantId, id } = resolved;
  const targetStatus = action === "resume_user" ? "active" : "paused";
  const sql = db();
  await sql`UPDATE tenants SET status = ${targetStatus} WHERE id = ${tenantId}`;
  return Response.json({ ok: true, action, user_id: id, tenant_id: tenantId, status: targetStatus });
}

// 공유 AI(claude -p) 사용 승인/회수 — 계정 접근(paused/active)과 분리된 별도 entitlement
// (tenants.shared_cli_approved_at). 계정이 paused여도 이 액션 자체는 실행 가능(재개 시 바로
// 반영되도록) — 접근 게이트는 tenant-auth.ts/proxy.ts가 별도로 강제한다.
async function handleSharedAiApprovalAction(action: "approve_shared_ai" | "revoke_shared_ai", userId: unknown): Promise<Response> {
  const resolved = await resolveTargetTenant(userId);
  if ("error" in resolved) return resolved.error;
  const { tenantId, id } = resolved;
  const sql = db();
  const approved = action === "approve_shared_ai";
  if (approved) {
    await sql`UPDATE tenants SET shared_cli_approved_at = now() WHERE id = ${tenantId}`;
  } else {
    await sql`UPDATE tenants SET shared_cli_approved_at = NULL WHERE id = ${tenantId}`;
  }
  return Response.json({ ok: true, action, user_id: id, tenant_id: tenantId, shared_ai_approved: approved });
}

export async function POST(request: Request) {
  const authError = operatorError(request);
  if (authError) return authError;

  let actionForReport: string | undefined;
  try {
    const body = await request.json().catch(() => ({})) as { action?: string; email?: string; user_id?: string };
    actionForReport = body.action;

    if (body.action === "pause_user" || body.action === "resume_user") {
      return await handleAccountStatusAction(body.action, body.user_id);
    }
    if (body.action === "approve_shared_ai" || body.action === "revoke_shared_ai") {
      return await handleSharedAiApprovalAction(body.action, body.user_id);
    }

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
    // 운영자 뮤테이션(정지/재개/공유AI 승인·회수/비밀번호 재설정) 실행 실패 — 고위험 경계.
    // action(요청 바디 원문, 공격자 통제 가능)은 고정 enum으로 정규화한 값만 담고, user_id/email/
    // e.message(임의 텍스트)는 애초에 넘기지 않는다(observability.ts 스키마가 마지막 방어선).
    // 응답 status/body는 기존 그대로(fire-and-forget이 이 500 응답을 바꾸지 않는다).
    void reportFailure({
      event: "operator_mutation_failed",
      severity: "error",
      context: { action: normalizeOperatorAction(actionForReport) },
    });
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
