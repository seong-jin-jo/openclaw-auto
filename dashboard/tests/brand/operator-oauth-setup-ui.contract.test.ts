import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const page = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/operator/customers/page.tsx"),
  "utf8",
);

describe("operator central OAuth setup UI contract", () => {
  it("renders callback, required fields, setup steps, source/time and official external links", () => {
    expect(page).toContain("item.callbackUrl");
    expect(page).toContain("item.fields");
    expect(page).toContain("item.consoleUrl");
    expect(page).toContain("item.docsUrl");
    expect(page).toContain("item.setupSteps");
    expect(page).toContain("item.source");
    expect(page).toContain("item.updatedAt");
    expect(page).toContain("navigator.clipboard.writeText");
  });

  it("supports credential input/update plus DB-only reveal/hide with automatic raw-value clearing", () => {
    const oauthSection = page.slice(
      page.indexOf("중앙 OAuth 개발자 앱"),
      page.indexOf("Auth 가입자"),
    );
    expect(oauthSection).toContain("<input");
    expect(oauthSection).toContain("숨기기");
    expect(page).toContain('action: "reveal"');
    expect(page).toContain("window.setTimeout");
    expect(page).toContain("setRevealedValues");
    expect(page).toContain("setCredentialInputs");
    expect(oauthSection).toContain('item.source === "db"');
    expect(oauthSection).not.toMatch(/item\.credentialsConfigured\s*\?\s*\([\s\S]{0,300}원문 확인/);
  });

  it("offers audited DB deletion and treats storage outages as recovery events rather than re-entry prompts", () => {
    const oauthSection = page.slice(
      page.indexOf("중앙 OAuth 개발자 앱"),
      page.indexOf("Auth 가입자"),
    );
    expect(page).toContain('method: "DELETE"');
    expect(oauthSection).toContain("DB 저장값 삭제");
    expect(oauthSection).toContain("item.unavailableReason");
    expect(oauthSection).toContain("기존 값을 다시 입력하지 마세요");
    expect(oauthSection).toContain("disabled={Boolean(item.unavailableReason)");
  });
});
