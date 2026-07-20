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
    // SNS-015: 같은 핸들러가 Reels도 처리하지만 계정 선택값은 YouTube 발행에만 실린다
    // (Instagram 발행에 YouTube 계정 id가 새면 안 된다).
    expect(page).toContain('account_id: platform === "youtube" ? (publishAccountId || undefined) : undefined');
    expect(route).toContain('getChannelCred(tenantId, "youtube", accountId)');
    expect(route).toContain("refreshYoutubeAccessToken(tenantId, accountId)");
  });

  it("Reels UI uses design tokens only and stays gated on Instagram connection", () => {
    const page = source("app/videos/page.tsx");
    // SNS-015 QA: 하드코딩 팔레트는 라이트/다크 대비가 깨진다 — 시맨틱 토큰만 허용.
    expect(page).not.toMatch(/\b(?:bg|text|hover:bg|hover:text)-pink-\d{2,3}\b/);
    const reelsCard = page.slice(page.indexOf('data-testid="reels-status-card"'));
    expect(reelsCard.slice(0, 400)).not.toMatch(/\btext-green-\d{2,3}\b/);
    expect(page).toContain('data-testid="reels-publish-button"');
    expect(page).toContain('data-testid="reels-status-card"');
    expect(page).toMatch(/igConnected \? "text-success" : "text-subtle"/);
    expect(page).toMatch(/igConnected && \(\s*<button\s+data-testid="reels-publish-button"/);
    // 생성 탭은 운영자 전용 — 고객 세션에는 탭도 패널도 그리지 않는다.
    expect(page).toMatch(/canGenerate && \(\s*<button\s+data-testid="video-generate-tab"/);
    expect(page).toContain('tab === "generate" && canGenerate');
  });
});
