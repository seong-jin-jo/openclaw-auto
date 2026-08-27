import crypto from "node:crypto";
import { STUDIO_GENERATION_CONTRACT_VERSION } from "./contracts";
import { StudioApiError } from "./errors";

export function studioSuccess(data: unknown, status = 200): Response {
  const requestId = crypto.randomUUID();
  return Response.json({
    data,
    meta: {
      request_id: requestId,
      contract_version: STUDIO_GENERATION_CONTRACT_VERSION,
      served_at: new Date().toISOString(),
    },
  }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      "X-Contract-Version": STUDIO_GENERATION_CONTRACT_VERSION,
    },
  });
}

export function studioFailure(error: unknown): Response {
  const requestId = crypto.randomUUID();
  const known = error instanceof StudioApiError
    ? error
    : new StudioApiError({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Studio 요청을 처리하지 못했습니다",
      retryable: false,
    });
  return Response.json({
    error: {
      code: known.code,
      message: known.message,
      retryable: known.retryable,
      field_errors: known.fieldErrors,
      details: known.details,
    },
    meta: { request_id: requestId, contract_version: STUDIO_GENERATION_CONTRACT_VERSION },
  }, {
    status: known.status,
    headers: {
      "Cache-Control": "no-store",
      "X-Request-Id": requestId,
      "X-Contract-Version": STUDIO_GENERATION_CONTRACT_VERSION,
    },
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new StudioApiError({ status: 400, code: "INVALID_JSON_BODY", message: "올바른 JSON 본문이 필요합니다" });
  }
}
