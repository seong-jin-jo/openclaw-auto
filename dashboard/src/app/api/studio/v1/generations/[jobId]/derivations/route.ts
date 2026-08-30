import { studioFailure, studioSuccess, readJson } from "@/lib/studio/generation/http";
import { resolveStudioPrincipal } from "@/lib/studio/generation/identity";
import { StudioApiError } from "@/lib/studio/generation/errors";
import { generationRuntime } from "@/lib/studio/generation/runtime";
import {
  DERIVATION_KINDS,
  derivationQuote,
  parseDerivationKinds,
  publicBatch,
  publicQuote,
  type DerivationKind,
} from "@/lib/studio/generation/derivation";

type RouteContext = { params: Promise<{ jobId: string }> };

// GET /api/studio/v1/generations/{jobId}/derivations?kinds=card,video
// 확정 전에 값을 보여 주는 자리다. 이 값을 못 본 채로는 확정이 안 되게 POST 가 막는다.
export async function GET(request: Request, context: RouteContext) {
  try {
    await resolveStudioPrincipal(request);
    await context.params;
    const raw = new URL(request.url).searchParams.get("kinds") ?? "";
    const requested = raw.split(",").map((value) => value.trim()).filter(Boolean);
    const kinds = requested.length > 0
      ? parseDerivationKinds(requested)
      : [...DERIVATION_KINDS] as DerivationKind[];
    return studioSuccess({ quote: publicQuote(derivationQuote(kinds)) });
  } catch (error) {
    return studioFailure(error);
  }
}

// POST /api/studio/v1/generations/{jobId}/derivations
// 주 갈래를 확정하면서 같이 고른 갈래로 옮겨 만든다. 무료 재생성 몫은 건드리지 않는다.
export async function POST(request: Request, context: RouteContext) {
  try {
    const principal = await resolveStudioPrincipal(request);
    const { jobId } = await context.params;
    const body = await readJson(request) as Record<string, unknown> | null;
    const candidateId = typeof body?.candidate_id === "string" ? body.candidate_id.trim() : "";
    if (!candidateId) {
      throw new StudioApiError({
        status: 422,
        code: "CANDIDATE_ID_REQUIRED",
        message: "확정한 후보 번호가 필요합니다",
        fieldErrors: [{ field: "candidate_id", reason: "필수 문자열입니다" }],
      });
    }
    const kinds = parseDerivationKinds(body?.kinds);
    const batch = await generationRuntime().derive(
      principal.memberId,
      jobId,
      candidateId,
      kinds,
      body?.acknowledged_cost,
      request.headers.get("Idempotency-Key") ?? "",
      [...principal.allowedWorkspaceIds],
    );
    // 한 갈래라도 실패하면 201 로 성공을 알리지 않는다. 화면이 갈래별 결과를 그대로 보이게 한다.
    return studioSuccess(publicBatch(batch), batch.status === "succeeded" ? 201 : 207);
  } catch (error) {
    return studioFailure(error);
  }
}
