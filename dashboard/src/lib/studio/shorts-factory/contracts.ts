import { StudioApiError } from "@/lib/studio/generation/errors";

export const SHORTS_FACTORY_CONCEPT_COUNT = 8;
export const SHORTS_FACTORY_MAX_CONCURRENCY = 8;

export type ShortsFactoryConceptInput = {
  conceptId: string;
  name: string;
  generationBody: Record<string, unknown>;
};

export type ShortsFactoryRequest = {
  workspaceId: string;
  concurrencyLimit: number;
  concepts: ShortsFactoryConceptInput[];
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONCEPT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function requiredText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseFactoryWorkspaceId(value: unknown): string {
  const workspaceId = requiredText(value);
  if (!workspaceId || !UUID_PATTERN.test(workspaceId)) {
    throw new StudioApiError({
      status: 422,
      code: "FACTORY_WORKSPACE_INVALID",
      message: "UUID 형식의 작업 공간 번호가 필요합니다",
      fieldErrors: [{ field: "workspace_id", reason: "UUID 형식의 필수 값입니다" }],
    });
  }
  return workspaceId;
}

export function parseShortsFactoryRequest(value: unknown): ShortsFactoryRequest {
  const input = record(value);
  if (!input) {
    throw new StudioApiError({
      status: 400,
      code: "INVALID_JSON_BODY",
      message: "JSON 객체 본문이 필요합니다",
    });
  }

  const workspaceId = parseFactoryWorkspaceId(input.workspace_id);
  const concurrencyLimit = input.concurrency_limit === undefined ? SHORTS_FACTORY_MAX_CONCURRENCY : Number(input.concurrency_limit);
  if (!Number.isSafeInteger(concurrencyLimit) || concurrencyLimit < 1 || concurrencyLimit > SHORTS_FACTORY_MAX_CONCURRENCY) {
    throw new StudioApiError({
      status: 422,
      code: "FACTORY_CONCURRENCY_INVALID",
      message: "동시 실행 한도는 1부터 8까지입니다",
      fieldErrors: [{ field: "concurrency_limit", reason: "1부터 8까지의 정수여야 합니다" }],
    });
  }

  if (!Array.isArray(input.concepts) || input.concepts.length !== SHORTS_FACTORY_CONCEPT_COUNT) {
    throw new StudioApiError({
      status: 422,
      code: "FACTORY_CONCEPT_COUNT_INVALID",
      message: "한 공장 실행에는 컨셉이 정확히 8개 필요합니다",
      fieldErrors: [{ field: "concepts", reason: "정확히 8개여야 합니다" }],
    });
  }

  const seen = new Set<string>();
  const concepts = input.concepts.map((raw, index): ShortsFactoryConceptInput => {
    const concept = record(raw);
    const conceptId = requiredText(concept?.concept_id);
    const name = requiredText(concept?.name);
    const config = record(concept?.config);
    if (!conceptId || !CONCEPT_ID_PATTERN.test(conceptId)) {
      throw new StudioApiError({
        status: 422,
        code: "FACTORY_CONCEPT_INVALID",
        message: `${index + 1}번째 컨셉 식별자가 올바르지 않습니다`,
        fieldErrors: [{ field: `concepts.${index}.concept_id`, reason: "영문 소문자, 숫자, 밑줄, 붙임표로 64자 이내여야 합니다" }],
      });
    }
    if (seen.has(conceptId)) {
      throw new StudioApiError({
        status: 422,
        code: "FACTORY_CONCEPT_DUPLICATED",
        message: "컨셉 식별자는 한 실행 안에서 중복될 수 없습니다",
        fieldErrors: [{ field: `concepts.${index}.concept_id`, reason: "중복 값입니다" }],
      });
    }
    if (!name || name.length > 100) {
      throw new StudioApiError({
        status: 422,
        code: "FACTORY_CONCEPT_INVALID",
        message: `${index + 1}번째 컨셉 이름이 올바르지 않습니다`,
        fieldErrors: [{ field: `concepts.${index}.name`, reason: "1자부터 100자까지 필요합니다" }],
      });
    }
    if (!config) {
      throw new StudioApiError({
        status: 422,
        code: "FACTORY_CONCEPT_INVALID",
        message: `${index + 1}번째 컨셉 설정이 필요합니다`,
        fieldErrors: [{ field: `concepts.${index}.config`, reason: "객체여야 합니다" }],
      });
    }
    if ("workspace_id" in config) {
      throw new StudioApiError({
        status: 422,
        code: "FACTORY_WORKSPACE_CONFLICT",
        message: "컨셉 설정은 다른 작업 공간을 지정할 수 없습니다",
        fieldErrors: [{ field: `concepts.${index}.config.workspace_id`, reason: "최상위 작업 공간을 사용합니다" }],
      });
    }
    seen.add(conceptId);
    return {
      conceptId,
      name,
      generationBody: { ...config, workspace_id: workspaceId },
    };
  });

  return { workspaceId, concurrencyLimit, concepts };
}
