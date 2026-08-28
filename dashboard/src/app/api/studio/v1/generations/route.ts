import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import { studioFailure, studioSuccess, readJson } from "@/lib/studio/generation/http";
import { assertWorkspaceAccess, resolveDevelopmentPrincipal } from "@/lib/studio/generation/identity";
import { generationRuntime } from "@/lib/studio/generation/runtime";
import { isStudioApiError } from "@/lib/studio/generation/errors";
import { reportFailure, reportRecovery } from "@/lib/observability";

export async function POST(request: Request) {
  let workspaceId: string | null = null;
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const input = parseGenerationRequest(await readJson(request));
    workspaceId = input.workspaceId;
    assertWorkspaceAccess(principal, input.workspaceId);
    const response = await generationRuntime().create(
      principal.memberId,
      request.headers.get("Idempotency-Key") ?? "",
      input,
    );
    void reportRecovery?.({ workspaceId, category: "generation_failed", source: "studio" });
    return studioSuccess(response, 201);
  } catch (error) {
    const status = isStudioApiError(error) ? error.status : 500;
    if (workspaceId && status >= 500) {
      void reportFailure({
        event: "studio_generation_failed",
        severity: "error",
        workspaceId,
        context: { reason: isStudioApiError(error) && error.retryable ? "provider_unavailable" : "unknown" },
      });
    }
    return studioFailure(error);
  }
}
