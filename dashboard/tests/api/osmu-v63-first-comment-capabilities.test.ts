import { describe, expect, it } from "vitest";

describe("BE-V63-07 첫 댓글 capability", () => {
  it("BE-V63-07 정상 경로: 일곱 미리보기 플랫폼의 지원 여부를 빠짐없이 반환한다", async () => {
    const { GET } = await import("@/app/api/publish/first-comment-capabilities/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.capabilities).toHaveLength(7);
    expect(body.capabilities.find((item: { platform: string }) => item.platform === "threads")).toMatchObject({
      supported: true,
      requiredPermission: "threads_manage_replies",
    });
    expect(body.capabilities.find((item: { platform: string }) => item.platform === "tiktok")).toMatchObject({
      supported: false,
    });
  });

  it("BE-V63-07 거절 경로: 빈 first comment는 입력 경계에서 거절한다", async () => {
    const { normalizeFirstComment } = await import("@/lib/first-comment");
    expect(() => normalizeFirstComment("   ")).toThrow(/must not be empty/);
  });
});
