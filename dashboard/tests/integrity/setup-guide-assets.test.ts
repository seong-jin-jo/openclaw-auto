import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dashboardRoot = path.resolve(__dirname, "../..");

describe("setup guide onboarding assets", () => {
  it("does not reference any onboarding screenshot that is absent from public", () => {
    const source = fs.readFileSync(path.join(dashboardRoot, "src/lib/setup-guides.ts"), "utf8");
    const imageRefs = [...source.matchAll(/src:\s*"([^"]*\/onboarding\/[^"]+)"/g)]
      .map((match) => match[1]);

    const missing = imageRefs.filter(
      (src) => !fs.existsSync(path.join(dashboardRoot, "public", src.replace(/^\//, ""))),
    );

    expect(missing).toEqual([]);
  });
});
