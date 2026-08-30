import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const authGate = readFileSync(resolve(root, "src/components/shared/AuthGate.tsx"), "utf8");
const privacy = readFileSync(resolve(root, "src/app/privacy/page.tsx"), "utf8");
const terms = readFileSync(resolve(root, "src/app/terms/page.tsx"), "utf8");
const deletion = readFileSync(resolve(root, "src/app/data-deletion/page.tsx"), "utf8");

describe("public legal pages required by OAuth providers", () => {
  it.each(["/privacy", "/terms", "/data-deletion"])("keeps %s outside the auth gate", (path) => {
    expect(authGate).toContain(`"${path}"`);
  });

  it("publishes privacy disclosures for OAuth tokens, tenant isolation, retention, and contact", () => {
    expect(privacy).toContain("소셜 플랫폼 비밀번호를 수집하거나 저장하지 않습니다");
    expect(privacy).toContain("토큰은 암호화해 저장");
    expect(privacy).toContain("tenant");
    expect(privacy).toContain("보유 기간과 삭제");
    expect(privacy).toContain("code0to1@gmail.com");
    expect(privacy).toContain("Threads 답글과 Instagram 댓글");
    expect(privacy).toContain("판매하지 않습니다");
    expect(privacy).toContain("연결 해제 또는 삭제 요청 시까지");
    expect(privacy).toContain("처리 목적별 Meta 권한");
  });

  it("publishes service terms covering connected-account authority and platform policies", () => {
    expect(terms).toContain("본인이 관리 권한을 가진");
    expect(terms).toContain("플랫폼 정책");
    expect(terms).toContain("연결을 해제");
    expect(terms).toContain("Meta 앱 심사");
    expect(terms).toContain("테스터 계정");
  });

  it("publishes actionable account, token, content, and Meta deletion instructions", () => {
    expect(deletion).toContain("전체 계정과 데이터 삭제 요청");
    expect(deletion).toContain("30일 이내");
    expect(deletion).toContain("Meta 액세스 토큰");
    expect(deletion).toContain("삭제 버튼");
    expect(deletion).toContain("Threads");
    expect(deletion).toContain("데이터 삭제 안내 URL");
    expect(deletion).toContain("연결 해제 또는 삭제 요청을 받은 뒤");
  });
});
