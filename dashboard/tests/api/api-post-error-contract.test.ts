import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  token: "customer-token",
}));

vi.mock("@/lib/auth", () => ({
  clearAuthToken: vi.fn(),
  getAuthToken: vi.fn(() => auth.token),
}));

describe("apiPost non-2xx response contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    auth.token = "customer-token";
  });

  it("preserves partial external publish metadata on the thrown API error", async () => {
    const payload = {
      ok: false,
      externalPublished: true,
      externalId: "external-1",
      permalink: "https://provider.example/post/1",
      error: "외부 게시 후 내부 기록에 실패했습니다.",
      persistence: {
        stage: "publication_record",
        reconciliation: {
          required: true,
          action: "repair_persistence_only",
          retryPublish: false,
        },
      },
    };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(payload), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })));
    const { apiPost, ApiResponseError } = await import("@/lib/api");

    await expect(apiPost("/api/publish", { platform: "threads" })).rejects.toEqual(
      expect.objectContaining({
        name: "ApiResponseError",
        status: 500,
        payload,
      }),
    );
    await apiPost("/api/publish", { platform: "threads" }).catch((error) => {
      expect(error).toBeInstanceOf(ApiResponseError);
    });
  });
});
