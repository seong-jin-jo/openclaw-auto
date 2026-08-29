import { studioFailure, studioSuccess, readJson } from "@/lib/studio/generation/http";
import { resolveStudioPrincipal } from "@/lib/studio/generation/identity";
import { StudioApiError } from "@/lib/studio/generation/errors";
import { generationRuntime } from "@/lib/studio/generation/runtime";

type RouteContext = { params: Promise<{ jobId: string }> };

// POST /api/studio/v1/generations/{jobId}/rejections
// 후보 한 장 거절을 서버 장부에 남긴다. 무료 재생성은 이 장부가 세 장을 모두 담은
// 뒤에만 나간다(요구 대장 R27). 거절 여부를 화면 상태로 판단하면 생성 직후
// 재생성을 호출해 하루 몫을 공짜로 태울 수 있다.
export async function POST(request: Request, context: RouteContext) {
  try {
    const principal = await resolveStudioPrincipal(request);
    const { jobId } = await context.params;
    const body = await readJson(request);
    const candidateId = (body as { candidate_id?: unknown })?.candidate_id;
    if (typeof candidateId !== "string" || candidateId.trim().length === 0) {
      throw new StudioApiError({
        status: 422,
        code: "CANDIDATE_ID_REQUIRED",
        message: "거절할 후보 번호가 필요합니다",
        fieldErrors: [{ field: "candidate_id", reason: "필수 문자열입니다" }],
      });
    }
    return studioSuccess(await generationRuntime().rejectCandidate(
      principal.memberId,
      jobId,
      candidateId.trim(),
      [...principal.allowedWorkspaceIds],
    ), 201);
  } catch (error) {
    return studioFailure(error);
  }
}
