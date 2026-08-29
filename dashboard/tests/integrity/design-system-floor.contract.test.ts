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

describe("Tailwind v4 numeric spacing scale is never overridden", () => {
  // 사고 재발방지 (2026-08-29, 편집실 목차 max-h-72 사고): 이 테마는 `@theme inline`에
  // --spacing-micro 같은 "이름 있는" 하위 토큰만 추가한다. 만약 누군가 --spacing 자체(접미사
  // 없는 bare key)를 재정의하면 Tailwind v4 네임스페이스 override 규칙에 따라 w-40 / h-64 /
  // max-h-72 같은 "숫자" 유틸리티 전체가 calc(var(--spacing) * N)에서 --spacing을 못 찾아
  // 0으로 풀린다(치명적 — 전 화면 숫자 크기 유틸리티가 조용히 무너진다). 이 테스트는 globals.css가
  // bare --spacing을 재정의하지 않는지, 그리고 named 토큰이 접두어 없는 --spacing과 절대
  // 충돌하지 않는지 고정한다.
  it("does not redefine the bare --spacing key anywhere in globals.css", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    // "--spacing:" (뒤에 이름이 붙지 않은 순수 키) 정의를 금지. "--spacing-xxx:"는 허용.
    const bareSpacingRedefinition = /(^|[^-])--spacing\s*:/m;
    expect(bareSpacingRedefinition.test(css)).toBe(false);
  });

  it("keeps every named --spacing-* token namespaced (never collides with the bare scale key)", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src", "app", "globals.css"), "utf8");
    const namedSpacingTokens = css.match(/--spacing-[a-z-]+\s*:/g) ?? [];
    expect(namedSpacingTokens.length).toBeGreaterThan(0);
    for (const token of namedSpacingTokens) {
      expect(token).toMatch(/^--spacing-[a-z-]+:$/);
    }
  });
});
