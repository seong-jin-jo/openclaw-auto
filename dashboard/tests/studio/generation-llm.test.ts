import { afterEach, describe, expect, it } from "vitest";
import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import {
  buildCandidatePrompt,
  LlmStudioContentGenerator,
  StudioLlmExecutionError,
  type StudioContentGenerator,
  type StudioLlmRunner,
  type StudioLlmUsageRecorder,
} from "@/lib/studio/generation/llm";
import { GenerationService } from "@/lib/studio/generation/service";
import { FIXTURE_STUDIO_CONTENT_GENERATOR, generationRequestFixture } from "./generation-fixture";
import { MemoryGenerationRepository } from "./generation-memory-repository";

const MEMBER = "member-llm-contract";

class MemoryUsageRecorder implements StudioLlmUsageRecorder {
  readonly started: { model: string; operation: string }[] = [];
  readonly finished: { status: string; totalTokens: number | null }[] = [];
  async start(input: Parameters<StudioLlmUsageRecorder["start"]>[0]) {
    this.started.push({ model: input.model, operation: input.operation });
    return `event-${this.started.length}`;
  }
  async finish(input: Parameters<StudioLlmUsageRecorder["finish"]>[0]) {
    this.finished.push({ status: input.status, totalTokens: input.result?.usage.totalTokens ?? null });
  }
}

afterEach(() => {
  delete process.env.STUDIO_LLM_MODEL;
  delete process.env.STUDIO_LLM_FALLBACK_MODELS;
  delete process.env.STUDIO_LLM_MAX_ATTEMPTS;
});

describe("Studio 실제 LLM 생성 계약", () => {
  it("LLM-01 정상: 후보 프롬프트가 일곱 칸 학습 정보와 채널 규격을 모두 포함한다", () => {
    const request = parseGenerationRequest(generationRequestFixture());
    const prompt = buildCandidatePrompt(request);
    for (const layer of ["S0", "S1", "U2", "U3", "X4", "L5", "R6"]) expect(prompt).toContain(layer);
    expect(prompt).toContain("자동화가 실패했을 때 확인할 세 가지");
    expect(prompt).toContain("vertical-video-primary");
  });

  it("LLM-02 정상: 서로 다른 후보 셋과 정확한 token 사용량을 기록한다", async () => {
    const ledger = new MemoryUsageRecorder();
    const runner: StudioLlmRunner = async ({ model }) => ({
      provider: "claude-cli",
      model,
      text: JSON.stringify({ candidates: [
        { label: "A", angle: "problem_first", title: "실패 신호 세 가지", rationale: "오류가 나타나는 순간의 신호를 먼저 분리해 원인을 좁히는 구성입니다.", outline: ["실패 시점을 기록합니다.", "권한 오류를 확인합니다.", "입력값을 다시 검증합니다."] },
        { label: "B", angle: "proof_first", title: "복구 전후 기록 비교", rationale: "실제 실행 기록의 전후 차이를 증거로 보여 주고 해결법을 설명하는 구성입니다.", outline: ["성공 기록을 먼저 보여 줍니다.", "달라진 설정을 비교합니다.", "같은 조건으로 재현합니다."] },
        { label: "C", angle: "process_first", title: "십 분 복구 순서", rationale: "보존, 격리, 재실행 순서로 독자가 그대로 따라 할 수 있게 만든 구성입니다.", outline: ["상태를 보존합니다.", "최소 입력으로 격리합니다.", "수정 뒤 다시 실행합니다."] },
      ] }),
      usage: { inputTokens: 100, cacheCreationInputTokens: 10, cacheReadInputTokens: 20, outputTokens: 30, totalTokens: 160, totalCostUsd: 0.01 },
    });
    const generator = new LlmStudioContentGenerator(runner, ledger);
    const result = await generator.generateCandidates({ memberId: MEMBER, request: parseGenerationRequest(generationRequestFixture()) });
    expect(new Set(result.map((candidate) => candidate.outline[0])).size).toBe(3);
    expect(ledger.finished).toEqual([{ status: "succeeded", totalTokens: 160 }]);
  });

  it("LLM-03 거절: 제공자 실패 시 템플릿 후보를 저장하지 않고 정확한 오류를 반환한다", async () => {
    const repository = new MemoryGenerationRepository();
    const failing: StudioContentGenerator = {
      ...FIXTURE_STUDIO_CONTENT_GENERATOR,
      async generateCandidates() { throw new StudioLlmExecutionError("provider_unavailable", true); },
    };
    const service = new GenerationService(repository, undefined, failing);
    await expect(service.create(MEMBER, "fail-closed", parseGenerationRequest(generationRequestFixture())))
      .rejects.toMatchObject({ code: "STUDIO_LLM_PROVIDER_UNAVAILABLE", retryable: true });
    expect(await repository.findCreation(MEMBER, generationRequestFixture().workspace_id, "generation.create", "fail-closed")).toBeNull();
  });

  it("LLM-04 경계: 모델 fallback과 재시도는 설정한 두 번에서 멈춘다", async () => {
    process.env.STUDIO_LLM_MODEL = "anthropic/primary";
    process.env.STUDIO_LLM_FALLBACK_MODELS = "anthropic/fallback";
    process.env.STUDIO_LLM_MAX_ATTEMPTS = "2";
    const attempts: string[] = [];
    const ledger = new MemoryUsageRecorder();
    const generator = new LlmStudioContentGenerator(async ({ model }) => {
      attempts.push(model);
      throw new Error("provider down");
    }, ledger);
    await expect(generator.generateCandidates({ memberId: MEMBER, request: parseGenerationRequest(generationRequestFixture()) }))
      .rejects.toMatchObject({ reason: "provider_unavailable" });
    expect(attempts).toEqual(["anthropic/primary", "anthropic/fallback"]);
  });
});
