import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "../../src");

const FORBIDDEN = [
  "tenant",
  "tenant",
  "sample",
  "example.com",
  "sample_brand",
  "sample-brand",
  "REDACTED",
  "REDACTED",
];

function getAllFiles(dir: string, ext: string[]): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("no sensitive/service-specific data", () => {
  const files = getAllFiles(SRC_DIR, [".ts", ".tsx"]);

  it("should have source files to check", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const forbidden of FORBIDDEN) {
    it(`no files contain "${forbidden}"`, () => {
      const found: string[] = [];
      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.toLowerCase().includes(forbidden.toLowerCase())) {
          found.push(path.relative(SRC_DIR, file));
        }
      }
      expect(found, `Files containing "${forbidden}": ${found.join(", ")}`).toHaveLength(0);
    });
  }
});
