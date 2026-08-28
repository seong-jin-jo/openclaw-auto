import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

describe("DESIGN.md v23 typography floor", () => {
  it("allows no sub-12px utility outside the explicitly protected Studio render blocks", () => {
    const src = path.join(process.cwd(), "src");
    const violations: string[] = [];

    for (const file of sourceFiles(src)) {
      let text = fs.readFileSync(file, "utf8");
      if (file.endsWith(path.join("app", "studio", "page.tsx"))) {
        text = text.replace(/\{\/\* 발행 이력 \*\/\}[\s\S]*?\{\/\* 편집 드로어/, "");
        text = text.replace(/^.*<PlatformPreview platform=\{editing\}.*$/m, "");
      }
      if (/text-\[(?:[0-9]|10|11)px\]/.test(text)) violations.push(path.relative(src, file));
    }

    expect(violations).toEqual([]);
  });

  it("forces protected legacy utilities to render at the 12px caption token", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    for (const size of [8, 9, 10, 11]) {
      expect(css).toContain(`.text-\\[${size}px\\]`);
    }
    expect(css).toContain("font-size: var(--font-caption-size)");
    expect(css).toContain("line-height: var(--font-caption-leading)");
  });
});
