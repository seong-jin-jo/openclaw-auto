import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// String-consistency contract: prevents the env var name from drifting between Dockerfile ARG,
// deploy workflow secret pass-through, and the code that actually reads it (ga.ts). A typo in
// any one of these silently ships a build where GA is baked in as "" (disabled) with no error.

const ENV_VAR = "NEXT_PUBLIC_GA_MEASUREMENT_ID";
const SECRET_NAME = "OSMU_GA4_MEASUREMENT_ID";

const dashboardRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(dashboardRoot, "..");

function read(relFromRepoRoot: string): string {
  return readFileSync(path.join(repoRoot, relFromRepoRoot), "utf8");
}

describe("GA env var wiring — Dockerfile <-> workflow <-> code string consistency", () => {
  it("Dockerfile declares the ARG and ENV with the exact var name", () => {
    const dockerfile = read("dashboard/Dockerfile");
    expect(dockerfile).toContain(`ARG ${ENV_VAR}=""`);
    expect(dockerfile).toContain(`ENV ${ENV_VAR}=$${ENV_VAR}`);
  });

  it("deploy workflow passes the same var name as a --build-arg sourced from the chosen secret", () => {
    const workflow = read(".github/workflows/deploy-marketing.yml");
    expect(workflow).toContain(`--build-arg ${ENV_VAR}="\${{ secrets.${SECRET_NAME} }}"`);
  });

  it("ga.ts reads process.env with the exact same var name", () => {
    const gaSource = readFileSync(path.join(dashboardRoot, "src/lib/analytics/ga.ts"), "utf8");
    expect(gaSource).toContain(`process.env.${ENV_VAR}`);
  });
});
