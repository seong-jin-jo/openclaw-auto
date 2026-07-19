import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const composePath = path.resolve(process.cwd(), "../docker-compose.postagi-4tenants.yml");
const compose = fs.readFileSync(composePath, "utf8");

describe("OSMU production persistence contract", () => {
  it("keeps customer data outside the disposable Actions checkout", () => {
    const service = compose.split("  openclaw-dashboard-osmu:")[1] ?? "";

    expect(service).toContain("- osmu-data:/app/data");
    expect(service).toContain("- osmu-config:/app/config");
    expect(service).not.toContain("- ./data-osmu:/app/data");
    expect(service).not.toContain("- ./config-osmu:/app/config");
  });

  it("pins globally stable Docker volume names", () => {
    expect(compose).toContain("name: openclaw-osmu-data");
    expect(compose).toContain("name: openclaw-osmu-config");
  });
});
