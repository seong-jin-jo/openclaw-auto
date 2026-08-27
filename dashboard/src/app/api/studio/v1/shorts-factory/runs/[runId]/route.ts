import { studioFailure, studioSuccess } from "@/lib/studio/generation/http";
import { resolveDevelopmentPrincipal } from "@/lib/studio/generation/identity";
import { shortsFactoryRuntime } from "@/lib/studio/shorts-factory/runtime";

type RouteContext = { params: Promise<{ runId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const { runId } = await context.params;
    return studioSuccess(await shortsFactoryRuntime().get(
      principal.memberId,
      runId,
      [...principal.allowedWorkspaceIds],
    ));
  } catch (error) {
    return studioFailure(error);
  }
}
