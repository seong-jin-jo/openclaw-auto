import crypto from "node:crypto";
import { StudioApiError } from "./errors";

export type StudioPrincipal = {
  memberId: string;
  allowedWorkspaceIds: ReadonlySet<string>;
};

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function resolveDevelopmentPrincipal(request: Request): StudioPrincipal {
  if (process.env.STUDIO_IDENTITY_MODE !== "development") {
    throw new StudioApiError({
      status: 503,
      code: "IDENTITY_ADAPTER_NOT_CONFIGURED",
      message: "Studio 회원 인증 어댑터가 아직 연결되지 않았습니다",
      retryable: true,
    });
  }
  const expectedToken = process.env.STUDIO_DEV_BEARER_TOKEN ?? "";
  const memberId = process.env.STUDIO_DEV_MEMBER_ID ?? "";
  const allowedWorkspaceIds = new Set(
    (process.env.STUDIO_DEV_WORKSPACE_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean),
  );
  if (!expectedToken || !memberId || allowedWorkspaceIds.size === 0) {
    throw new StudioApiError({
      status: 503,
      code: "IDENTITY_ADAPTER_NOT_CONFIGURED",
      message: "Studio 개발 인증 설정이 완결되지 않았습니다",
      retryable: true,
    });
  }
  const raw = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!raw || !safeEqual(raw, expectedToken)) {
    throw new StudioApiError({ status: 401, code: "TOKEN_INVALID", message: "Studio 인증에 실패했습니다" });
  }
  return { memberId, allowedWorkspaceIds };
}

export function assertWorkspaceAccess(principal: StudioPrincipal, workspaceId: string): void {
  if (!principal.allowedWorkspaceIds.has(workspaceId)) {
    throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "작업 공간을 찾을 수 없습니다" });
  }
}
