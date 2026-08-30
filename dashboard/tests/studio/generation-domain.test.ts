import { beforeEach, describe, expect, it } from "vitest";
import { parseGenerationRequest } from "@/lib/studio/generation/contracts";
import { GenerationService } from "@/lib/studio/generation/service";
import { FIXTURE_STUDIO_CONTENT_GENERATOR, generationRequestFixture } from "./generation-fixture";
import { MemoryGenerationRepository } from "./generation-memory-repository";

const WORKSPACES = ["11111111-1111-4111-8111-111111111111"];

function generationService(): GenerationService {
  return new GenerationService(new MemoryGenerationRepository(), undefined, FIXTURE_STUDIO_CONTENT_GENERATOR);
}

// 무료 재생성은 후보 셋을 모두 거절한 뒤에만 나간다(요구 대장 R27).
// 거절은 서버 장부에만 남으므로 검증도 실제 거절 호출을 거쳐야 한다.
async function rejectAllCandidates(
  service: GenerationService,
  memberId: string,
  job: { jobId: string; candidates: { candidateId: string }[] },
): Promise<void> {
  for (const candidate of job.candidates) {
    await service.rejectCandidate(memberId, job.jobId, candidate.candidateId, WORKSPACES);
  }
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
    await rejectAllCandidates(service, "member-1", original);
    const retried = await service.regenerate("member-1", original.jobId, WORKSPACES, new Date("2026-08-27T01:00:00.000Z"));

    expect(retried.freeRetryConsumed).toBe(true);
    expect(retried.replacement.jobId).not.toBe(original.jobId);
    expect(retried.replacement.candidates).toHaveLength(3);
    expect(retried.freeRetryResetsAt).toBe("2026-08-28T00:00:00.000Z");
  });

  it("GEN-RETRY-02 한국어 설명: 같은 원본의 두 번째 재생성 요청은 같은 교체 작업을 재생한다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    await rejectAllCandidates(service, "member-1", original);
    const now = new Date("2026-08-27T01:00:00.000Z");
    const first = await service.regenerate("member-1", original.jobId, WORKSPACES, now);
    const replay = await service.regenerate("member-1", original.jobId, WORKSPACES, now);

    expect(replay.replacement.jobId).toBe(first.replacement.jobId);
  });

  it("GEN-RETRY-03 한국어 설명: 동시에 같은 재생성을 두 번 보내도 교체 작업은 한 건으로 수렴한다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    await rejectAllCandidates(service, "member-1", original);
    const now = new Date("2026-08-27T01:00:00.000Z");
    const settled = await Promise.allSettled([
      service.regenerate("member-1", original.jobId, WORKSPACES, now),
      service.regenerate("member-1", original.jobId, WORKSPACES, now),
    ]);

    expect(settled.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    const replacements = settled
      .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof service.regenerate>>> => result.status === "fulfilled")
      .map((result) => result.value.replacement.jobId);
    expect(new Set(replacements).size).toBe(1);
  });

  it("R27-GEN-RETRY-05 거절: 후보를 하나도 거절하지 않은 재생성은 무료 몫을 쓰지 않고 막힌다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    const now = new Date("2026-08-27T01:00:00.000Z");

    await expect(service.regenerate("member-1", original.jobId, WORKSPACES, now)).rejects.toEqual(
      expect.objectContaining({ code: "CANDIDATES_NOT_REJECTED", status: 409 }),
    );

    // 막힌 요청이 몫을 태우지 않았어야 한다. 셋을 거절하면 오늘 몫이 그대로 남아 있다.
    await rejectAllCandidates(service, "member-1", original);
    const retried = await service.regenerate("member-1", original.jobId, WORKSPACES, now);
    expect(retried.freeRetryConsumed).toBe(true);
  });

  it("R27-GEN-RETRY-06 거절: 후보 두 장만 거절한 재생성도 막고 남은 후보를 알려준다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    for (const candidate of original.candidates.slice(0, 2)) {
      await service.rejectCandidate("member-1", original.jobId, candidate.candidateId, WORKSPACES);
    }

    await expect(service.regenerate("member-1", original.jobId, WORKSPACES, new Date("2026-08-27T01:00:00.000Z")))
      .rejects.toEqual(expect.objectContaining({
        code: "CANDIDATES_NOT_REJECTED",
        details: expect.objectContaining({ pending_candidate_ids: [original.candidates[2].candidateId] }),
      }));
  });

  it("R27-GEN-RETRY-07 거절: 같은 후보를 두 번 거절해도 거절 장부는 한 장으로 센다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));
    const target = original.candidates[0].candidateId;
    await service.rejectCandidate("member-1", original.jobId, target, WORKSPACES);
    const second = await service.rejectCandidate("member-1", original.jobId, target, WORKSPACES);

    expect(second.rejectedCandidateIds).toEqual([target]);
    expect(second.allRejected).toBe(false);
    expect(second.pendingCandidateIds).toHaveLength(2);
  });

  it("R27-GEN-RETRY-08 거절: 이 작업의 후보가 아닌 번호는 거절 장부에 들어가지 않는다", async () => {
    const service = generationService();
    const original = await service.create("member-1", "create-1", parseGenerationRequest(generationRequestFixture()));

    await expect(service.rejectCandidate("member-1", original.jobId, "99999999-9999-4999-8999-999999999999", WORKSPACES))
      .rejects.toEqual(expect.objectContaining({ code: "RESOURCE_NOT_FOUND", status: 404 }));
  });

  it("M1-GEN-RETRY-04 한국어 설명: 서로 다른 시간대의 서로 다른 작업도 UTC 하루 무료 몫을 한 번만 쓴다", async () => {
    const service = generationService();
    const eastBody = generationRequestFixture();
    eastBody.learning_context.u2.time_zone = "Pacific/Kiritimati";
    const westBody = generationRequestFixture();
    westBody.learning_context.u2.time_zone = "Etc/GMT+12";
    westBody.learning_context.r6.topic = "서쪽 시간대 작업";
    const east = await service.create("member-1", "create-east", parseGenerationRequest(eastBody));
    const west = await service.create("member-1", "create-west", parseGenerationRequest(westBody));
    await rejectAllCandidates(service, "member-1", east);
    await rejectAllCandidates(service, "member-1", west);
    const now = new Date("2026-08-27T12:30:00.000Z");

    await service.regenerate("member-1", east.jobId, WORKSPACES, now);
    await expect(service.regenerate("member-1", west.jobId, WORKSPACES, now)).rejects.toEqual(
      expect.objectContaining({ code: "PAID_REGENERATION_APPROVAL_REQUIRED", status: 409 }),
    );
  });
});
