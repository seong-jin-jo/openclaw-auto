export interface StudioLearningInput {
  workspaceId: string;
  topic: string;
  purpose: string;
  audience: string;
  workspaceFacts: string[];
  forbiddenPhrases: string[];
  materialRightsConfirmed: boolean;
  contentBranch: "text_image" | "video";
}

// 현재 생성기는 서버의 내장 X4 조립 규칙 v1을 사용한다. 사용자가 세션 저장소에 내부 UUID를
// 심어야만 생성되는 것은 제품 계약이 아니므로, 클라이언트 릴리스에 고정된 추적 ID로 보낸다.
export const STUDIO_GENERATION_SKILL_VERSION_ID = "9f73f414-7084-4a44-9ab4-6fe0fd0f5140";

export interface StudioGenerationCandidate {
  generation_id?: string;
  candidate_id: string;
  ordinal: 1 | 2 | 3;
  label: "A" | "B" | "C";
  angle: "problem_first" | "proof_first" | "process_first";
  title: string;
  rationale: string;
  format: {
    content_branch: "text_image" | "video";
    preview_kind: "structured_storyboard";
    quality: "draft";
    outline: string[];
  };
}

interface StudioGenerationEnvelope {
  data?: { job_id: string; candidates: StudioGenerationCandidate[] };
  error?: { message?: string; field_errors?: Array<{ field: string; reason: string }> };
}

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label}이 비어 있습니다`);
  return normalized;
}

export function buildStudioGenerationRequest(input: StudioLearningInput) {
  const topic = required(input.topic, "이번 주제");
  const purpose = required(input.purpose, "목적");
  const audience = required(input.audience, "대상");
  if (!input.materialRightsConfirmed) throw new Error("소재 권리 확인이 필요합니다");

  return {
    workspace_id: required(input.workspaceId, "작업 공간"),
    learning_context: {
      s0: { revision: 1, safety_rules: ["거짓 정보와 권리 미확인 소재를 만들지 않는다"] },
      s1: { revision: 1, market_context: "한국어 소셜 채널용 OSMU 콘텐츠" },
      u2: { revision: 1, locale: "ko-KR", time_zone: "Asia/Seoul", accessibility_requirements: ["자막 없이도 핵심 문장이 읽혀야 한다"] },
      u3: {
        revision: 1,
        purpose,
        audience,
        content_branch: input.contentBranch,
        workspace_facts: input.workspaceFacts,
        workspace_facts_confirmed_empty: input.workspaceFacts.length === 0,
        forbidden_phrases: input.forbiddenPhrases,
        forbidden_phrases_confirmed_empty: input.forbiddenPhrases.length === 0,
        material_rights_confirmed: true,
        tone: null,
      },
      x4: {
        revision: 1,
        skill_version_id: STUDIO_GENERATION_SKILL_VERSION_ID,
        structure_rules: ["후보 A, B, C를 서로 다른 도입 각도로 만든다"],
      },
      l5: { revision: 0, accepted_rules: [] },
      r6: { topic, output_language: "ko-KR", adjustments: {} },
    },
    platform_spec: null,
  };
}

export async function requestStudioCandidates(input: StudioLearningInput, token: string): Promise<StudioGenerationCandidate[]> {
  const authorization = required(token, "Studio 인증");
  const response = await fetch("/api/studio/v1/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authorization}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(buildStudioGenerationRequest(input)),
  });
  const body = await response.json() as StudioGenerationEnvelope;
  if (!response.ok || !body.data) {
    const field = body.error?.field_errors?.[0];
    throw new Error(field ? `${field.field}: ${field.reason}` : body.error?.message || "후보 생성에 실패했습니다");
  }
  if (body.data.candidates.length !== 3) throw new Error("Studio가 후보 세 장을 반환하지 않았습니다");
  return body.data.candidates.map((candidate) => ({
    ...candidate,
    generation_id: body.data!.job_id,
  }));
}
