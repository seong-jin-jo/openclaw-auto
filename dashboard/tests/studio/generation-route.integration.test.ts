import { beforeEach, describe, expect, it } from "vitest";
import { studioFailure } from "@/lib/studio/generation/http";
import { setGenerationRuntimeForTests } from "@/lib/studio/generation/runtime";
import { GenerationService } from "@/lib/studio/generation/service";
import { FIXTURE_STUDIO_CONTENT_GENERATOR, generationRequestFixture, STUDIO_TEST_WORKSPACE_ID } from "./generation-fixture";
import { MemoryGenerationRepository } from "./generation-memory-repository";

const TOKEN = "local-test-token-without-production-authority";

function postRequest(body: unknown, idempotencyKey = "integration-create-1", token = TOKEN): Request {
  return new Request("http://localhost/api/studio/v1/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
}

// 무료 재생성 전에 후보 셋을 서버 장부에 거절로 남긴다(요구 대장 R27).
async function rejectAllCandidatesOverHttp(created: { data: { job_id: string; candidates: { candidate_id: string }[] } }): Promise<void> {
  const { POST: reject } = await import("@/app/api/studio/v1/generations/[jobId]/rejections/route");
  for (const candidate of created.data.candidates) {
    const response = await reject(
      new Request("http://localhost/api/studio/v1/generations/job/rejections", {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidate.candidate_id }),
      }),
      { params: Promise.resolve({ jobId: created.data.job_id }) },
    );
    if (response.status !== 201) throw new Error(`후보 거절이 실패했습니다: ${response.status}`);
  }
}

beforeEach(() => {
  setGenerationRuntimeForTests(new GenerationService(new MemoryGenerationRepository(), undefined, FIXTURE_STUDIO_CONTENT_GENERATOR));
  process.env.STUDIO_IDENTITY_MODE = "development";
  process.env.STUDIO_DEV_BEARER_TOKEN = TOKEN;
  process.env.STUDIO_DEV_MEMBER_ID = "member-integration";
  process.env.STUDIO_DEV_WORKSPACE_IDS = STUDIO_TEST_WORKSPACE_ID;
  process.env.STUDIO_PREVIEW_COST_MIN_MINOR = "1200";
  process.env.STUDIO_PREVIEW_COST_MAX_MINOR = "3600";
  process.env.STUDIO_PAID_REGENERATION_MINOR = "4900";
});

describe("Studio 생성 HTTP 통합 계약", () => {
  it("GEN-HTTP-01 한국어 설명: 실제 Route Handler가 생성 요청을 받아 후보 세 장을 201로 반환한다", async () => {
    const { POST } = await import("@/app/api/studio/v1/generations/route");
    const response = await POST(postRequest(generationRequestFixture()));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(response.headers.get("X-Contract-Version")).toBe("1.0");
    expect(body.data.candidates).toHaveLength(3);
    expect(body.data.candidates.map((candidate: { label: string }) => candidate.label)).toEqual(["A", "B", "C"]);
    expect(body.data.job_id).toEqual(expect.any(String));
    expect(body.data.jobId).toBeUndefined();
  });

  it("GEN-HTTP-02 한국어 설명: 필수 U3 목적이 빠지면 필드 오류와 422를 반환한다", async () => {
    const { POST } = await import("@/app/api/studio/v1/generations/route");
    const invalid = generationRequestFixture();
    invalid.learning_context.u3.purpose = "";
    const response = await POST(postRequest(invalid));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("LEARNING_CONTEXT_INCOMPLETE");
    expect(body.error.field_errors).toContainEqual({
      field: "learning_context.u3.purpose",
      reason: "필수 문자열입니다",
    });
  });

  it("GEN-HTTP-03 한국어 설명: 다른 bearer는 생성 전에 401로 거절한다", async () => {
    const { POST } = await import("@/app/api/studio/v1/generations/route");
    const response = await POST(postRequest(generationRequestFixture(), "auth-reject", "wrong-token"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("TOKEN_INVALID");
  });

  it("GEN-HTTP-04 한국어 설명: 같은 원본 무료 재생성 재시도는 같은 교체 작업을 재생한다", async () => {
    const { POST: create } = await import("@/app/api/studio/v1/generations/route");
    const created = await (await create(postRequest(generationRequestFixture()))).json();
    await rejectAllCandidatesOverHttp(created);
    const { POST: regenerate } = await import("@/app/api/studio/v1/regenerations/[jobId]/route");
    const request = new Request("http://localhost/api/studio/v1/regenerations/job", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    const context = { params: Promise.resolve({ jobId: created.data.job_id }) };
    const first = await regenerate(request, context);
    const second = await regenerate(request, context);
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(secondBody.data.replacement.job_id).toBe(firstBody.data.replacement.job_id);
  });

  it("GEN-HTTP-05 한국어 설명: 다른 Next 번들에서 온 도메인 오류도 안정 상태 코드로 보존한다", async () => {
    const response = studioFailure({
      kind: "StudioApiError",
      status: 409,
      code: "PAID_REGENERATION_APPROVAL_REQUIRED",
      message: "오늘의 무료 재생성을 이미 사용했습니다",
      retryable: false,
      fieldErrors: [],
      details: { paid_retry_quote: null },
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("PAID_REGENERATION_APPROVAL_REQUIRED");
  });
});

describe("R27 무료 재생성 거절 관문 HTTP 계약", () => {
  it("R27-HTTP-01 거절: 후보를 거절하지 않은 재생성 호출은 409로 막고 몫을 태우지 않는다", async () => {
    const { POST: create } = await import("@/app/api/studio/v1/generations/route");
    const created = await (await create(postRequest(generationRequestFixture()))).json();
    const { POST: regenerate } = await import("@/app/api/studio/v1/regenerations/[jobId]/route");
    const context = { params: Promise.resolve({ jobId: created.data.job_id }) };
    const request = () => new Request("http://localhost/api/studio/v1/regenerations/job", {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}` },
    });

    const blocked = await regenerate(request(), context);
    const blockedBody = await blocked.json();
    expect(blocked.status).toBe(409);
    expect(blockedBody.error.code).toBe("CANDIDATES_NOT_REJECTED");

    await rejectAllCandidatesOverHttp(created);
    const granted = await regenerate(request(), context);
    expect(granted.status).toBe(201);
  });

  it("R27-HTTP-02 거절: 후보 번호가 없는 거절 요청은 422로 막는다", async () => {
    const { POST: create } = await import("@/app/api/studio/v1/generations/route");
    const created = await (await create(postRequest(generationRequestFixture()))).json();
    const { POST: reject } = await import("@/app/api/studio/v1/generations/[jobId]/rejections/route");

    const response = await reject(
      new Request("http://localhost/api/studio/v1/generations/job/rejections", {
        method: "POST",
        headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ jobId: created.data.job_id }) },
    );

    expect(response.status).toBe(422);
    expect((await response.json()).error.code).toBe("CANDIDATE_ID_REQUIRED");
  });
});
