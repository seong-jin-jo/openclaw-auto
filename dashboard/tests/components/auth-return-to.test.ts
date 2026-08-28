import { describe, expect, it } from "vitest";
import { customerLoginUrl, safeCustomerReturnTo } from "@/lib/auth";

describe("QA-AUTH-07 고객 재로그인 복귀 주소 계약", () => {
  it("정상: 고객 내부 경로와 검색 조건을 보존한다", () => {
    expect(safeCustomerReturnTo("/studio?room=edit")).toBe("/studio?room=edit");
    expect(customerLoginUrl("/studio?room=edit")).toBe("/login?returnTo=%2Fstudio%3Froom%3Dedit");
  });

  it.each(["https://attacker.example", "//attacker.example", "/operator", "/operator/customers"])(
    "거절: 고객 영역 밖 복귀 주소 %s는 홈으로 제한한다",
    (value) => expect(safeCustomerReturnTo(value)).toBe("/"),
  );
});
