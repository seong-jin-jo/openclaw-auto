import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

function source(relative: string): string {
  return fs.readFileSync(path.resolve(__dirname, "../../src", relative), "utf8");
}

describe("SNS-007 multi-account source contracts", () => {
  it("account creation is serialized and inactive accounts cannot publish", () => {
    const code = source("lib/channel-accounts.ts");
    expect(code).toContain("pg_advisory_xact_lock");
    expect(code).toMatch(/id = \$\{accountId\}[\s\S]*status = 'active'/);
    expect(code).toMatch(/is_default = true[\s\S]*status = 'active'/);
  });

  it("OAuth callback never places refreshToken in plaintext meta", () => {
    const code = source("app/api/connect/[provider]/callback/route.ts");
    expect(code).not.toMatch(/meta\.refreshToken\s*=/);
    expect(code).toContain("refreshToken: tok.refreshToken");
  });

  it("workspace changes clear prior account selections", () => {
    expect(source("app/studio/page.tsx")).toMatch(/useEffect\(\(\) => \{\s*setSelectedAccounts\(\{\}\)/);
    expect(source("components/studio/SchedulePanel.tsx")).toMatch(/useEffect\(\(\) => \{\s*setSelectedAccounts\(\{\}\)/);
    expect(source("app/videos/page.tsx")).toMatch(/setPublishAccountId\(""\)[\s\S]*activeWorkspace\?\.id/);
  });

  it("YouTube upload UI and API carry the selected account id", () => {
    const page = source("app/videos/page.tsx");
    const route = source("app/api/video/publish/route.ts");
    expect(page).toContain('data-testid="youtube-publish-account-select"');
    expect(page).toContain("account_id: publishAccountId || undefined");
    expect(route).toContain('getChannelCred(tenantId, "youtube", accountId)');
    expect(route).toContain("refreshYoutubeAccessToken(tenantId, accountId)");
  });
});
