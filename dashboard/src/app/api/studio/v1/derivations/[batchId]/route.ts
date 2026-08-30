import { studioFailure, studioSuccess } from "@/lib/studio/generation/http";
import { resolveStudioPrincipal } from "@/lib/studio/generation/identity";
import { generationRuntime } from "@/lib/studio/generation/runtime";
import { publicBatch } from "@/lib/studio/generation/derivation";

type RouteContext = { params: Promise<{ batchId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const principal = await resolveStudioPrincipal(request);
    const { batchId } = await context.params;
    const batch = await generationRuntime().getDerivation(
      principal.memberId,
      batchId,
      [...principal.allowedWorkspaceIds],
    );
    return studioSuccess(publicBatch(batch));
  } catch (error) {
    return studioFailure(error);
  }
}

// DELETE /api/studio/v1/derivations/{batchId}
// 파생을 안 쓰기로 하면 버린다. 주 갈래 결과는 다른 표에 있어 함께 사라지지 않는다.
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const principal = await resolveStudioPrincipal(request);
    const { batchId } = await context.params;
    const batch = await generationRuntime().discardDerivation(
      principal.memberId,
      batchId,
      [...principal.allowedWorkspaceIds],
    );
    return studioSuccess(publicBatch(batch));
  } catch (error) {
    return studioFailure(error);
  }
}
