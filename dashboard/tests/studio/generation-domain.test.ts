import { beforeEach, describe, expect, it } from "vitest";
import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import { StudioApiError } from "@/lib/studio/generation/errors";
import { GenerationService } from "@/lib/studio/generation/service";
import { generationRequestFixture } from "./generation-fixture";
import { MemoryGenerationRepository } from "./generation-memory-repository";

const WORKSPACES = ["11111111-1111-4111-8111-111111111111"];

function generationService(): GenerationService {
  return new GenerationService(new MemoryGenerationRepository());
}

beforeEach(() => {
  process.env.STUDIO_PREVIEW_COST_MIN_MINOR = "1200";
  process.env.STUDIO_PREVIEW_COST_MAX_MINOR = "3600";
  process.env.STUDIO_PAID_REGENERATION_MINOR = "4900";
  process.env.STUDIO_COST_CURRENCY = "KRW";
});

describe("Studio 생성 도메인 계약", () => {
  it("GEN-INPUT-01 한국어 설명: 일곱 층과 요청 시점 플랫폼 규격을 하나의 생성 입력으로 조립한다", () => {
    const parsed = parseGenerationRequest(generationRequestFixture());

    expect(parsed.learningContext).toEqual(expect.objectContaining({
      s0: expect.objectContaining({ revision: 1 }),
      s1: expect.objectContaining({ revision: 2 }),
      u2: expect.objectContaining({ revision: 3, timeZone: "Asia/Seoul" }),
      u3: expect.objectContaining({ revision: 4, materialRightsConfirmed: true }),
      x4: expect.objectContaining({ revision: 5 }),
      l5: expect.objectContaining({ revision: 6 }),
      r6: expect.objectContaining({ outputLanguage: "ko-KR" }),
    }));
    expect(parsed.platformSpec?.targets).toEqual([expect.objectContaining({ targetId: "vertical-video-primary" })]);
  });

  it("GEN-INPUT-02 한국어 설명: 승낙된 학습 규칙이 없으면 L5를 빈 판으로 조립한다", () => {
    const body = generationRequestFixture();
    delete (body.learning_context as Record<string, unknown>).l5;

    expect(parseGenerationRequest(body).learningContext.l5).toEqual({ revision: 0, acceptedRules: [] });
  });

  it("GEN-INPUT-03 한국어 설명: 소재 권리가 확인되지 않으면 생성을 거절한다", () => {
    const body = generationRequestFixture();
    body.learning_context.u3.material_rights_confirmed = false;

    expect(() => parseGenerationRequest(body)).toThrowError(expect.objectContaining({
      code: "OUTPUT_RIGHTS_BLOCKED",
      status: 422,
    }));
  });

  it("GEN-INPUT-04 한국어 설명: openclaw 소유 채널 자격증명은 입력에서 거절한다", () => {
    const body = { ...generationRequestFixture(), credential: "must-not-enter-studio" };

    expect(() => parseGenerationRequest(body)).toThrowError(expect.objectContaining({
      code: "PLATFORM_CREDENTIAL_NOT_ALLOWED",
      status: 422,
    }));
  });

  it("GEN-CANDIDATE-01 한국어 설명: 후보 A B C 세 장에 형식 근거 비용 채널을 모두 반환한다", async () => {
    const service = generationService();
    const response = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));

    expect(response.candidates).toHaveLength(3);
    expect(response.candidates.map((candidate) => candidate.label)).toEqual(["A", "B", "C"]);
    for (const candidate of response.candidates) {
      expect(candidate.rationale.length).toBeGreaterThan(20);
      expect(candidate.format.outline).toHaveLength(3);
      expect(candidate.estimatedCost).toEqual(expect.objectContaining({
        status: "quoted",
        currency: "KRW",
        minMinor: 1200,
        maxMinor: 3600,
      }));
      expect(candidate.channels).toEqual([expect.objectContaining({ targetId: "vertical-video-primary" })]);
    }
    expect(response.platformSpecReceipt).toEqual({
      reference: "opaque-platform-contract",
      version: "2026-08",
      digest: "a".repeat(64),
    });
    expect(JSON.stringify(response)).not.toContain("configured-at-request-time");
  });

  it("GEN-IDEMPOTENCY-01 한국어 설명: 같은 키와 같은 본문은 같은 작업을 돌려준다", async () => {
    const service = generationService();
    const request = parseGenerationRequest(generationRequestFixture());
    const first = await service.create("member-1", "same-key", request);
    const second = await service.create("member-1", "same-key", request);

    expect(second).toEqual(first);
  });

  it("GEN-IDEMPOTENCY-02 한국어 설명: 같은 키에 다른 본문은 거절한다", async () => {
    const service = generationService();
    await service.create("member-1", "same-key", parseGenerationRequest(generationRequestFixture()));
    const changed = generationRequestFixture();
    changed.learning_context.r6.topic = "다른 주제";

    await expect(service.create("member-1", "same-key", parseGenerationRequest(changed))).rejects.toEqual(expect.objectContaining({
      code: "IDEMPOTENCY_CONFLICT",
      status: 409,
    }));
  });

  it("GEN-RETRY-01 한국어 설명: 후보 셋 거절 뒤 첫 재생성은 회원에게 하루 한 번 무료다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    const retried = await service.regenerate("member-1", original.jobId, WORKSPACES, new Date("2026-08-27T01:00:00.000Z"));

    expect(retried.freeRetryConsumed).toBe(true);
    expect(retried.replacement.jobId).not.toBe(original.jobId);
    expect(retried.replacement.candidates).toHaveLength(3);
    expect(retried.freeRetryResetsAt).toBe("2026-08-27T15:00:00.000Z");
  });

  it("GEN-RETRY-02 한국어 설명: 같은 회원의 두 번째 재생성은 비용 승인 전 거절한다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    const now = new Date("2026-08-27T01:00:00.000Z");
    await service.regenerate("member-1", original.jobId, WORKSPACES, now);

    try {
      await service.regenerate("member-1", original.jobId, WORKSPACES, now);
      throw new Error("두 번째 재생성이 거절되지 않았습니다");
    } catch (error) {
      expect(error).toBeInstanceOf(StudioApiError);
      expect(error).toEqual(expect.objectContaining({
        code: "PAID_REGENERATION_APPROVAL_REQUIRED",
        status: 409,
        details: expect.objectContaining({
          paid_retry_quote: { currency: "KRW", amount_minor: 4900 },
        }),
      }));
    }
  });

  it("GEN-RETRY-03 한국어 설명: 동시에 두 번 재생성해도 무료 처리는 한 건만 성공한다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    const now = new Date("2026-08-27T01:00:00.000Z");
    const settled = await Promise.allSettled([
      service.regenerate("member-1", original.jobId, WORKSPACES, now),
      service.regenerate("member-1", original.jobId, WORKSPACES, now),
    ]);

    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = settled.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toEqual(expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED" }));
  });
});
