import crypto from "node:crypto";
import type { StudioContentGenerator } from "@/lib/studio/generation/llm";

export const STUDIO_TEST_WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";

export const FIXTURE_STUDIO_CONTENT_GENERATOR: StudioContentGenerator = {
  async generateCandidates({ request }) {
    const topic = request.learningContext.r6.topic;
    return [
      { label: "A", ordinal: 1, angle: "problem_first", title: `${topic}, 실패 신호부터 찾기`, rationale: "사용자가 겪는 오류의 징후를 먼저 특정하고 원인별 확인 순서를 제시합니다.", outline: ["반복 실패를 알리는 신호를 먼저 분류합니다.", "권한과 입력값, 실행 기록을 차례로 확인합니다.", "같은 실패를 막는 점검표로 마무리합니다."] },
      { label: "B", ordinal: 2, angle: "proof_first", title: `${topic}, 복구 기록으로 검증하기`, rationale: "실제 복구 전후의 차이를 증거로 보여 준 뒤 재현 가능한 점검법을 설명합니다.", outline: ["복구 전후 실행 기록의 차이를 먼저 보여 줍니다.", "차이를 만든 설정 한 가지를 분리해 설명합니다.", "독자가 자기 기록으로 검증할 방법을 안내합니다."] },
      { label: "C", ordinal: 3, angle: "process_first", title: `${topic}, 삼 단계 복구 절차`, rationale: "진단부터 재실행까지 시간 순서로 따라 할 수 있는 작업 절차를 제공합니다.", outline: ["현재 상태를 보존하고 실패 시점을 기록합니다.", "가장 작은 입력으로 원인을 격리합니다.", "수정 뒤 같은 조건에서 다시 실행해 확인합니다."] },
    ];
  },
  async generateDerivation({ candidate, kind }) {
    if (kind === "text") return { kind, body: `${candidate.title}\n\n${candidate.rationale}\n\n${candidate.format.outline.join("\n\n")}\n\n마지막으로 같은 조건에서 다시 실행해 결과를 기록합니다.` };
    if (kind === "card") return { kind, slides: [candidate.title, ...candidate.format.outline].map((text, order) => ({ id: crypto.randomUUID(), order, text, image_url: null })) };
    return { kind, asset_url: "pending:render", scenes: candidate.format.outline.map((text, order) => ({ id: crypto.randomUUID(), order, title: `${order + 1}번 장면`, lines: [{ id: crypto.randomUUID(), order: 0, text, visible: true, deleted_at: null }] })) };
  },
};

export function generationRequestFixture() {
  return {
    workspace_id: STUDIO_TEST_WORKSPACE_ID,
    learning_context: {
      s0: { revision: 1, safety_rules: ["권리 확인 전 외부 소재를 쓰지 않는다"] },
      s1: { revision: 2, market_context: "짧은 교육형 콘텐츠의 첫 장면에서 핵심을 분명히 보여 준다" },
      u2: {
        revision: 3,
        locale: "ko-KR",
        time_zone: "Asia/Seoul",
        accessibility_requirements: ["자막 포함"],
      },
      u3: {
        revision: 4,
        purpose: "처음 보는 사람에게 복잡한 개념을 설명한다",
        audience: "업무 자동화를 처음 접하는 1인 사업가",
        content_branch: "video",
        workspace_facts: ["실제 운영 기록만 근거로 쓴다"],
        workspace_facts_confirmed_empty: false,
        forbidden_phrases: [],
        forbidden_phrases_confirmed_empty: true,
        material_rights_confirmed: true,
        tone: "짧고 구체적으로 말한다",
      },
      x4: {
        revision: 5,
        skill_version_id: "22222222-2222-4222-8222-222222222222",
        structure_rules: ["첫 장면에 문제나 결과를 둔다", "마지막에 다음 행동을 둔다"],
      },
      l5: { revision: 6, accepted_rules: ["증거가 먼저 나오는 구성을 선호한다"] },
      r6: {
        topic: "자동화가 실패했을 때 확인할 세 가지",
        output_language: "ko-KR",
        adjustments: { emphasis: "실패 원인" },
      },
    },
    platform_spec: {
      reference: "opaque-platform-contract",
      version: "2026-08",
      digest: "a".repeat(64),
      targets: [{
        target_id: "vertical-video-primary",
        format: "short-video",
        aspect_ratio: "9:16",
        max_duration_seconds: 60,
      }],
      body: { codec: "configured-at-request-time" },
    },
  };
}
