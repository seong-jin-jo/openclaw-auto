import { parseFactoryWorkspaceId } from "@/lib/studio/shorts-factory/contracts";
import { studioFailure, studioSuccess } from "@/lib/studio/generation/http";
import { StudioApiError } from "@/lib/studio/generation/errors";
import { shortsFactoryRuntime } from "@/lib/studio/shorts-factory/runtime";

type RouteContext = { params: Promise<{ runId: string }> };

function operatorError(request: Request): Response | null {
  const operatorToken = process.env.DASHBOARD_AUTH_TOKEN || "";
  if (!operatorToken) return Response.json({ error: "operator token not configured" }, { status: 503 });
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (raw !== operatorToken) return Response.json({ error: "operator token required" }, { status: 401 });
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const authError = operatorError(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => null) as { action?: unknown; workspace_id?: unknown } | null;
    if (!body || body.action !== "force_fail") {
      throw new StudioApiError({ status: 400, code: "FACTORY_OPERATOR_ACTION_INVALID", message: "force_fail 동작이 필요합니다" });
    }
    const workspaceId = parseFactoryWorkspaceId(body.workspace_id);
    const { runId } = await context.params;
    return studioSuccess({ run: await shortsFactoryRuntime().forceFail(workspaceId, runId) });
  } catch (error) {
    return studioFailure(error);
  }
}
