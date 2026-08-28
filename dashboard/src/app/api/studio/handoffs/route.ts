import { effectiveTenantId } from "@/lib/tenant-auth";
import { createEditorHandoff, EditorContractError } from "@/lib/studio/editor-handoff";
import { saveEditorHandoff } from "@/lib/studio/editor-handoff-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "JSON object required", code: "INVALID_JSON_BODY" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const tenantId = await effectiveTenantId(request, typeof input.tenant_id === "string" ? input.tenant_id : null);
  if (!tenantId) return Response.json({ error: "no-tenant" }, { status: 401 });
  try {
    const handoff = createEditorHandoff(input.handoff);
    const result = await saveEditorHandoff(tenantId, {
      draftId: typeof input.draft_id === "string" && input.draft_id.trim() ? input.draft_id.trim() : null,
      idea: typeof input.idea === "string" ? input.idea.trim() : handoff.summary,
      handoff,
    });
    return Response.json({ ok: true, draft_id: result.draftId, handoff: result.handoff }, {
      status: 201,
      headers: { "X-Contract-Version": handoff.contract_version },
    });
  } catch (error) {
    if (error instanceof EditorContractError) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    if (error instanceof Error && error.message === "DRAFT_NOT_FOUND") {
      return Response.json({ error: "draft not found", code: "DRAFT_NOT_FOUND" }, { status: 404 });
    }
    return Response.json({ error: "editor handoff failed" }, { status: 500 });
  }
}
