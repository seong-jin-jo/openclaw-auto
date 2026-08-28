// 개발용 신원 우회가 운영에서 열리지 않는지 본다.
// 왜: 이 경로는 토큰 하나로 회원과 작업 공간을 가장한다. 운영에 켜진 채로 나가면
// 그것만으로 사고다(배포 준비 점검, 2026-08-28).
import { describe, it, expect, afterEach, vi } from "vitest";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

describe("studio 개발용 신원 우회", () => {
  it.each([undefined, "0", "1"])(
    "운영에서는 예외값 %s와 관계없이 열리지 않는다",
    async (override) => {
      vi.stubEnv("NODE_ENV", "production");
      process.env.STUDIO_IDENTITY_MODE = "development";
      process.env.STUDIO_DEV_BEARER_TOKEN = "test-token";
      process.env.STUDIO_DEV_MEMBER_ID = "member";
      process.env.STUDIO_DEV_WORKSPACE_IDS = "11111111-1111-4111-8111-111111111111";
      if (override === undefined) delete process.env.STUDIO_ALLOW_DEV_IDENTITY_IN_PROD;
      else process.env.STUDIO_ALLOW_DEV_IDENTITY_IN_PROD = override;
      const { resolveDevelopmentPrincipal } = await import("@/lib/studio/generation/identity");
      expect(() => resolveDevelopmentPrincipal(
        new Request("https://app.example/api/studio/v1/generations", { headers: { authorization: "Bearer test-token" } }),
      )).toThrowError(/어댑터/);
    },
  );
});
