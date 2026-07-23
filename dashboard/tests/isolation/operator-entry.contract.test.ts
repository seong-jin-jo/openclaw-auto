import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/operator/page.tsx", "utf8");

describe("operator entry redirect", () => {
  it("validated operator sessions open the customer administration dashboard", () => {
    expect(source).toContain('window.location.href = "/operator/customers"');
    expect(source).not.toContain('window.location.href = "/"');
  });
});
