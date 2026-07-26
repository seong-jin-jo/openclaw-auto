import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const page = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/operator/customers/page.tsx"),
  "utf8",
);

describe("operator central OAuth setup UI contract", () => {
  it("renders callback, secret-name copy controls and official external links", () => {
    expect(page).toContain("item.callbackUrl");
    expect(page).toContain("item.requiredSecrets");
    expect(page).toContain("item.consoleUrl");
    expect(page).toContain("item.docsUrl");
    expect(page).toContain("navigator.clipboard.writeText");
  });

  it("never renders a Client ID or Client Secret value input", () => {
    const oauthSection = page.slice(
      page.indexOf("중앙 OAuth 개발자 앱"),
      page.indexOf("Auth 가입자"),
    );
    expect(oauthSection).not.toContain("<input");
    expect(oauthSection).not.toContain("<textarea");
    expect(oauthSection).not.toContain("clientSecret");
    expect(oauthSection).not.toContain("secretValue");
  });
});
