import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "..");
const compose = fs.readFileSync(path.join(root, "docker-compose.postagi-4tenants.yml"), "utf8");
const workflow = fs.readFileSync(path.join(root, ".github/workflows/deploy-marketing.yml"), "utf8");

describe("OSMU dashboard public build environment", () => {
  it("fails compose interpolation when required Supabase public values are missing", () => {
    expect(compose).toContain("NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:?");
    expect(compose).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:?");
  });

  it("uses the rendered OSMU env file for production image builds and startup", () => {
    expect(workflow).toContain("docker compose --env-file .env.osmu -f docker-compose.postagi-4tenants.yml build");
    expect(workflow).toContain("docker compose --env-file .env.osmu -f docker-compose.postagi-4tenants.yml up -d");
    expect(workflow).toContain("docker compose --env-file .env.osmu -f docker-compose.postagi-4tenants.yml ps");
    expect(workflow).toContain('previous="openclaw-dashboard-osmu-pre-${GITHUB_RUN_ID}"');
    expect(workflow).toContain('docker rename "$previous" openclaw-dashboard-osmu');
    expect(workflow).toContain("docker start openclaw-dashboard-osmu");
    expect(workflow).not.toContain("--build-arg NEXT_PUBLIC_SUPABASE_URL");
    expect(workflow).not.toContain("--build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
