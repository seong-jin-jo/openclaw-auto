import { publicOrigin } from "@/lib/social-connect";
import {
  deleteOAuthCredentialSet,
  getOAuthCredentialDefinition,
  listOAuthCredentialMetadata,
  OAuthCredentialSourceNotRevealableError,
  revealOAuthCredentialSet,
  upsertOAuthCredentialSet,
  validateOAuthCredentialValues,
} from "@/lib/oauth-app-credentials";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
};

function jsonNoStore(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  for (const [name, value] of Object.entries(NO_STORE_HEADERS)) headers.set(name, value);
  return Response.json(body, { ...init, headers });
}

function operatorAuthError(request: Request): Response | null {
  const token = process.env.DASHBOARD_AUTH_TOKEN || "";
  if (!token) return jsonNoStore({ error: "operator token not configured" }, { status: 503 });
  if (request.headers.get("Authorization") !== `Bearer ${token}`) {
    return jsonNoStore({ error: "operator token required" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  try {
    const providers = await listOAuthCredentialMetadata(publicOrigin(request));
    return jsonNoStore({ providers });
  } catch {
    return jsonNoStore({ error: "credential metadata unavailable" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  if (!process.env.OSMU_SECRET_KEY) {
    return jsonNoStore({ error: "credential encryption unavailable" }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => null) as { provider?: unknown; values?: unknown } | null;
    const validated = validateOAuthCredentialValues(body?.provider, body?.values);
    if (!validated.ok) return jsonNoStore({ error: "invalid credential set" }, { status: 400 });
    const result = await upsertOAuthCredentialSet(validated.provider, validated.values);
    return jsonNoStore({ ok: true, provider: validated.provider, updatedAt: result.updatedAt });
  } catch {
    return jsonNoStore({ error: "credential update failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => null) as { action?: unknown; provider?: unknown } | null;
    const provider = String(body?.provider || "");
    if (body?.action !== "reveal" || !getOAuthCredentialDefinition(provider)) {
      return jsonNoStore({ error: "invalid reveal request" }, { status: 400 });
    }
    const revealed = await revealOAuthCredentialSet(provider);
    return jsonNoStore(revealed);
  } catch (error) {
    if (error instanceof OAuthCredentialSourceNotRevealableError) {
      return jsonNoStore({ error: "DB에 저장한 자격증명만 원문 확인할 수 있습니다." }, { status: 409 });
    }
    return jsonNoStore({ error: "credential reveal failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => null) as { provider?: unknown } | null;
    const provider = String(body?.provider || "");
    if (!getOAuthCredentialDefinition(provider)) {
      return jsonNoStore({ error: "invalid credential delete request" }, { status: 400 });
    }
    const result = await deleteOAuthCredentialSet(provider);
    return jsonNoStore({ ok: true, provider, deleted: result.deleted });
  } catch {
    return jsonNoStore({ error: "credential delete failed" }, { status: 500 });
  }
}
