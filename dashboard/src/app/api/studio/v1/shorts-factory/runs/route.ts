import { parseFactoryWorkspaceId, parseShortsFactoryRequest } from "@/lib/studio/shorts-factory/contracts";
import { studioFailure, studioSuccess, readJson } from "@/lib/studio/generation/http";
import { assertWorkspaceAccess, resolveDevelopmentPrincipal } from "@/lib/studio/generation/identity";
import { shortsFactoryRuntime } from "@/lib/studio/shorts-factory/runtime";

export async function POST(request: Request) {
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const input = parseShortsFactoryRequest(await readJson(request));
    assertWorkspaceAccess(principal, input.workspaceId);
    const result = await shortsFactoryRuntime().start(
      principal.memberId,
      request.headers.get("Idempotency-Key") ?? "",
      input,
    );
    return studioSuccess(result, result.reused ? 200 : 201);
  } catch (error) {
    return studioFailure(error);
  }
}

export async function GET(request: Request) {
  try {
    const principal = resolveDevelopmentPrincipal(request);
    const workspaceId = parseFactoryWorkspaceId(new URL(request.url).searchParams.get("workspace_id"));
    assertWorkspaceAccess(principal, workspaceId);
    return studioSuccess({ runs: await shortsFactoryRuntime().list(principal.memberId, workspaceId) });
  } catch (error) {
    return studioFailure(error);
  }
}
