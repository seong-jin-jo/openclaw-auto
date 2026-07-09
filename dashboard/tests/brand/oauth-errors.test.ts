import { describe, it, expect } from "vitest";
import { escapeHtml, oauthErrorMessage } from "@/lib/oauth-errors";

describe("oauthErrorMessage", () => {
  it("Supabase Google provider disabled JSON을 사용자가 읽는 문장으로 바꾼다", () => {
    const msg = oauthErrorMessage('{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}', "Google");
    expect(msg).toContain("Google 로그인이 아직 설정되지 않았습니다");
    expect(msg).not.toContain("Unsupported provider");
  });

  it("Meta tester invite 미수락 에러를 조치 가능한 문장으로 바꾼다", () => {
    const msg = oauthErrorMessage("Invalid Request: The user has not accepted the invite to test the app. error_code=1349245", "Threads");
    expect(msg).toContain("테스트 사용자 초대");
    expect(msg).toContain("Threads");
  });

  it("Supabase env missing 에러도 raw 문자열로 노출하지 않는다", () => {
    const msg = oauthErrorMessage("supabaseUrl is required.", "Google");
    expect(msg).toContain("로그인 설정");
    expect(msg).not.toContain("supabaseUrl");
  });

  it("Meta 개발자 역할 권한 부족 에러를 조치 가능한 문장으로 바꾼다", () => {
    const msg = oauthErrorMessage("개발자 역할 권한이 부족합니다", "Instagram");
    expect(msg).toContain("앱 권한이 부족합니다");
    expect(msg).toContain("개발자/테스터/관리자");
  });

  it("HTML callback에 들어갈 에러 문자열을 escape한다", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });
});
