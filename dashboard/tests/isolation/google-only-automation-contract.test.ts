import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Google-only 가입 정책 회귀 방지 (owner directive 2026-07-16): 이메일/비밀번호 가입·로그인·재설정
// 전면 제거. 이 계약은 "앱 소스"가 아니라 "배포/E2E 자동화 스크립트 자체"가 옛 이메일/비밀번호 UX를
// 계약으로 다시 요구하지 않는지를 고정한다 — Codex review blocking finding(2026-07-16): 이 두 파일이
// email textbox / '비밀번호 찾기' 마커를 요구하면 Google-only 배포가 항상 스모크 FAIL한다.
const REPO_ROOT = resolve(__dirname, "../../..");
const verifyE2E = readFileSync(resolve(REPO_ROOT, "dashboard/scripts/verify-e2e.sh"), "utf-8");
const deployWorkflow = readFileSync(
  resolve(REPO_ROOT, ".github/workflows/deploy-marketing.yml"),
  "utf-8"
);

describe("verify-e2e.sh — Google-only public UX 관찰 계약", () => {
  it("'Google로 계속' CTA 존재를 검증한다", () => {
    expect(verifyE2E).toContain("Google로 계속");
  });

  it("email textbox 요구(구 계약)가 더 이상 없다", () => {
    expect(verifyE2E).not.toMatch(/textbox\.\*email/);
    // 과거엔 '이메일' 존재를 성공 조건(OK)으로 요구했다 — 이제는 반대로 부재를 검증해야 한다.
    expect(verifyE2E).toMatch(/이메일[\s\S]{0,80}FAIL/);
  });

  it("비밀번호/복구 컨트롤 부재를 검증한다", () => {
    expect(verifyE2E).toMatch(/비밀번호[\s\S]{0,80}FAIL/);
  });

  it("/signup이 /login으로 리다이렉트되는지 하드 실패로 검증한다(WARN이 아니라 FAIL)", () => {
    const signupBlock = verifyE2E.slice(verifyE2E.indexOf("/signup redirects"));
    expect(signupBlock).toMatch(/FAIL[\s\S]{0,80}\/signup/);
    expect(signupBlock).not.toMatch(/WARN.*redirect/);
  });
});

describe("deploy-marketing.yml 스모크 게이트 — Google-only 회귀 방지 계약", () => {
  it("'Google로 계속' CTA 부재 시 배포를 FAIL시킨다", () => {
    expect(deployWorkflow).toContain("Google로 계속");
    expect(deployWorkflow).toMatch(/'Google로 계속'[\s\S]{0,120}exit 1/);
  });

  it("옛 '비밀번호 찾기' 마커를 성공 조건으로 요구하지 않는다(존재하면 오히려 FAIL)", () => {
    // 과거엔 이 마커의 '부재'가 실패였다. 이제는 '존재'가 실패여야 한다(구버전 배포 감지).
    expect(deployWorkflow).toMatch(/grep -q '비밀번호 찾기'[\s\S]{0,150}exit 1/);
    expect(deployWorkflow).not.toMatch(
      /grep -q '비밀번호 찾기'\s*\\\s*\n\s*\|\|\s*\{[\s\S]{0,80}exit 1/
    );
  });

  it("/api/auth/google preflight(200|400) 및 operator/customers(200) 게이트는 그대로 유지된다", () => {
    expect(deployWorkflow).toContain("/api/auth/google?redirect_to=");
    expect(deployWorkflow).toMatch(/\[ "\$G" = "200" \] \|\| \[ "\$G" = "400" \]/);
    expect(deployWorkflow).toContain("/api/operator/customers");
    expect(deployWorkflow).toMatch(/\[ "\$OC" = "200" \]/);
  });
});
