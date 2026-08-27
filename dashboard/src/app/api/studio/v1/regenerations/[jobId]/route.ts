import { studioFailure, studioSuccess } from "@/lib/studio/generation/http";
import { resolveDevelopmentPrincipal } from "@/lib/studio/generation/identity";
import { generationRuntime } from "@/lib/studio/generation/runtime";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const { jobId } = await context.params;
    return studioSuccess(generationRuntime().regenerate(principal.memberId, jobId), 201);
  } catch (error) {
    return studioFailure(error);
  }
}
