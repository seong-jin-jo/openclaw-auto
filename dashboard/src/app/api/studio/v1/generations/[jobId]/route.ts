import { studioFailure, studioSuccess } from "@/lib/studio/generation/http";
import { resolveStudioPrincipal } from "@/lib/studio/generation/identity";
import { generationRuntime } from "@/lib/studio/generation/runtime";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const principal = await resolveStudioPrincipal(request);
    const { jobId } = await context.params;
    return studioSuccess(await generationRuntime().get(
      principal.memberId,
      jobId,
      [...principal.allowedWorkspaceIds],
    ));
  } catch (error) {
    return studioFailure(error);
  }
}
