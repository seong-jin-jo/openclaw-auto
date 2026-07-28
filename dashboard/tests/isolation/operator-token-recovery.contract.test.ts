import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const dashboardRoot = process.cwd();
const repoRoot = resolve(dashboardRoot, "..");
const recovery = readFileSync(
  resolve(dashboardRoot, "scripts/recover-operator-token.sh"),
  "utf8",
);
const formE2e = readFileSync(
  resolve(dashboardRoot, "scripts/verify-operator-form-e2e.sh"),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(resolve(dashboardRoot, "package.json"), "utf8"),
) as { scripts: Record<string, string> };
const runbook = readFileSync(
  resolve(repoRoot, "wiki/ops/operator-token-recovery.md"),
  "utf8",
);

describe("operator canonical token recovery contract", () => {
  it("uses the protected local secret inventory as the only plaintext source", () => {
    expect(recovery).toContain(
      "${OPENCLAW_SECRET_FILE:-$HOME/.sj-agent-harness/secrets/openclaw-auto.env}",
    );
    expect(recovery).toMatch(/set -euo pipefail/);
    expect(recovery).toMatch(/set \+x/);
    expect(recovery).toMatch(/umask 077/);
    expect(recovery).toMatch(/DASHBOARD_AUTH_TOKEN/);
    expect(recovery).toMatch(/OSMU_DASHBOARD_AUTH_TOKEN/);
    expect(recovery).toMatch(/600/);
    expect(recovery).toMatch(/symbolic link|symlink/i);
  });

  it("sends the token to GitHub and curl only through stdin, never argv", () => {
    expect(recovery).toMatch(
      /printf '%s' "\$TOKEN" \| gh secret set OSMU_DASHBOARD_AUTH_TOKEN/,
    );
    expect(recovery).not.toMatch(/gh secret set[^\n]*(?:--body|-b)\b/);
    expect(recovery).toContain("-H @-");
    expect(recovery).not.toMatch(
      /curl[^\n]*-H\s+["']Authorization:\s*Bearer\s*\$\{?TOKEN/,
    );
  });

  it("watches the exact deployment run and fails before browser verification on any bad API contract", () => {
    expect(recovery).toMatch(/gh workflow run/);
    expect(recovery).toMatch(/gh run watch "\$RUN_ID" --exit-status/);
    expect(recovery).toContain("/api/me");
    expect(recovery).toContain("/api/operator/customers");
    expect(recovery).toMatch(/\.isOperator == true/);
    expect(recovery).toContain("verify-operator-form-e2e.sh");
  });

  it("keeps the real operator form as a reusable gstack E2E with strict exit criteria", () => {
    expect(formE2e).toMatch(/set -euo pipefail/);
    expect(formE2e).toContain("gstack");
    expect(formE2e).toContain("localStorage.clear()");
    expect(formE2e).toContain("sessionStorage.clear()");
    expect(formE2e).toContain("/operator/customers");
    expect(formE2e).toContain("Admin");
    expect(formE2e).toContain("고객 관리");
    expect(formE2e).toContain("운영자 토큰이 유효하지");
    expect(formE2e).toMatch(/4\d\d|5\d\d/);
    expect(formE2e).toMatch(/console --errors/);
  });

  it("exposes both commands in package scripts and documents fail-closed recovery", () => {
    expect(packageJson.scripts["e2e:operator"]).toBe(
      "bash scripts/verify-operator-form-e2e.sh",
    );
    expect(packageJson.scripts["ops:recover-operator-token"]).toBe(
      "bash scripts/recover-operator-token.sh",
    );
    expect(runbook).toContain(
      "~/.sj-agent-harness/secrets/openclaw-auto.env",
    );
    expect(runbook).toContain("OSMU_DASHBOARD_AUTH_TOKEN");
    expect(runbook).toContain("gh run watch");
    expect(runbook).toContain("/operator/customers");
    expect(runbook).toMatch(/fail-closed/i);
  });
});
