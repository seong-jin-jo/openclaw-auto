import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import { studioFailure, studioSuccess, readJson } from "@/lib/studio/generation/http";
import { assertWorkspaceAccess, resolveDevelopmentPrincipal } from "@/lib/studio/generation/identity";
import { generationRuntime } from "@/lib/studio/generation/runtime";

export async function POST(request: Request) {
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const input = parseGenerationRequest(await readJson(request));
    assertWorkspaceAccess(principal, input.workspaceId);
    const response = generationRuntime().create(
      principal.memberId,
      request.headers.get("Idempotency-Key") ?? "",
      input,
    );
    return studioSuccess(response, 201);
  } catch (error) {
    return studioFailure(error);
  }
}
