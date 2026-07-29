import { publicOrigin } from "@/lib/social-connect";
import {
  deleteOAuthCredentialSet,
  getOAuthCredentialDefinition,
  importOAuthCredentialSetFromEnv,
  listOAuthCredentialMetadata,
  OAuthCredentialAlreadyStoredError,
  OAuthCredentialEnvIncompleteError,
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
    return jsonNoStore({ error: "자격증명 상태를 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  if (!process.env.OSMU_SECRET_KEY || !process.env.DATABASE_URL) {
    return jsonNoStore({
      error: "암호화 키 또는 데이터베이스 연결이 설정되지 않았습니다.",
    }, { status: 503 });
  }
  try {
    const body = await request.json().catch(() => null) as { provider?: unknown; values?: unknown } | null;
    const validated = validateOAuthCredentialValues(body?.provider, body?.values);
    if (!validated.ok) {
      return jsonNoStore({ error: "자격증명 전체 세트의 필드와 값을 확인해주세요." }, { status: 400 });
    }
    const result = await upsertOAuthCredentialSet(validated.provider, validated.values);
    return jsonNoStore({ ok: true, provider: validated.provider, updatedAt: result.updatedAt });
  } catch {
    return jsonNoStore({ error: "자격증명 저장 중 데이터베이스 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = operatorAuthError(request);
  if (authError) return authError;
  let action = "";
  try {
    const body = await request.json().catch(() => null) as { action?: unknown; provider?: unknown } | null;
    action = String(body?.action || "");
    const provider = String(body?.provider || "");
    if (!getOAuthCredentialDefinition(provider)) {
      return jsonNoStore({ error: "지원하지 않는 자격증명 요청입니다." }, { status: 400 });
    }
    if (action === "reveal") {
      if (!process.env.OSMU_SECRET_KEY || !process.env.DATABASE_URL) {
        return jsonNoStore({
          error: "암호화 키 또는 데이터베이스 연결이 설정되지 않았습니다.",
        }, { status: 503 });
      }
      const revealed = await revealOAuthCredentialSet(provider);
      return jsonNoStore(revealed);
    }
    if (action === "import-env") {
      if (!process.env.OSMU_SECRET_KEY || !process.env.DATABASE_URL) {
        return jsonNoStore({
          error: "암호화 키 또는 데이터베이스 연결이 설정되지 않았습니다.",
        }, { status: 503 });
      }
      const imported = await importOAuthCredentialSetFromEnv(provider);
      return jsonNoStore({
        ok: true,
        provider,
        source: "db",
        updatedAt: imported.updatedAt,
      });
    }
    return jsonNoStore({ error: "지원하지 않는 자격증명 요청입니다." }, { status: 400 });
  } catch (error) {
    if (error instanceof OAuthCredentialEnvIncompleteError) {
      return jsonNoStore({
        error: "환경변수 세트가 불완전합니다. 누락 값을 서버 환경에서 먼저 설정하세요.",
        missing: error.missing,
      }, { status: 409 });
    }
    if (error instanceof OAuthCredentialAlreadyStoredError) {
      return jsonNoStore({
        error: "이미 DB에 저장된 자격증명이 있습니다. 환경변수로 덮어쓰지 않았습니다.",
      }, { status: 409 });
    }
    return jsonNoStore({
      error: action === "reveal"
        ? "자격증명 원문 확인 중 데이터베이스 오류가 발생했습니다."
        : "환경변수 자격증명을 가져오는 중 데이터베이스 오류가 발생했습니다.",
    }, { status: 500 });
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
    return jsonNoStore({ error: "자격증명 삭제 중 데이터베이스 오류가 발생했습니다." }, { status: 500 });
  }
}
