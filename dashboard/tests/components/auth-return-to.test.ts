// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  clearAuthToken,
  customerLoginUrl,
  getAuthIdentityKind,
  safeCustomerReturnTo,
  setAuthToken,
} from "@/lib/auth";

describe("QA-AUTH-07 고객 재로그인 복귀 주소 계약", () => {
  it("정상: 고객 내부 경로와 검색 조건을 보존한다", () => {
    expect(safeCustomerReturnTo("/studio?room=edit")).toBe("/studio?room=edit");
    expect(customerLoginUrl("/studio?room=edit")).toBe("/login?returnTo=%2Fstudio%3Froom%3Dedit");
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "/%5c%5cattacker.example",
    "/studio\n/next",
    "/operator",
    "/operator/customers",
    "/%6fperator/customers",
    "/login",
    "/login?returnTo=%2Fstudio",
    "/signup",
    "/api/auth/google",
    "/auth/callback",
  ])(
    "거절: 고객 영역 밖 복귀 주소 %s는 홈으로 제한한다",
    (value) => expect(safeCustomerReturnTo(value)).toBe("/"),
  );

  it("정상: 고객과 운영자 자격증명의 종류를 토큰 형식과 별개로 보존하고 로그아웃 때 제거한다", () => {
    setAuthToken("malformed-customer-snapshot", "customer");
    expect(getAuthIdentityKind()).toBe("customer");
    setAuthToken("operator-token", "operator");
    expect(getAuthIdentityKind()).toBe("operator");
    clearAuthToken();
    expect(getAuthIdentityKind()).toBeNull();
  });
});
