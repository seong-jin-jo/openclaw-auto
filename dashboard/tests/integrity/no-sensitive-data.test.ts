import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "../../src");

// 금지어 목록(브랜드명·실도메인·개인 프로젝트·시크릿)은 공개 레포에 두지 않는다 —
// 목록 자체가 민감 정보이므로 fork-local 파일에서 로드한다.
// 형식: JSON 문자열 배열. 예) ["mybrand", "real-domain.com"]
// 파일이 없으면(공개 clone / CI) 강제검사를 건너뛴다.
const DENYLIST_FILE = path.resolve(__dirname, "sensitive-denylist.local.json");

function loadDenylist(): string[] {
  try {
    const arr = JSON.parse(fs.readFileSync(DENYLIST_FILE, "utf-8"));
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string" && s.length > 0) : [];
  } catch {
    return [];
  }
}

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
  const denylist = loadDenylist();

  it("should have source files to check", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("denylist source loads (skips enforcement if fork-local file absent)", () => {
    expect(Array.isArray(denylist)).toBe(true);
  });

  // 금지어는 인덱스로만 라벨링한다(테스트 출력에 민감어가 찍히지 않도록).
  denylist.forEach((forbidden, i) => {
    it(`forbidden term #${i + 1} must not appear in src`, () => {
      const found: string[] = [];
      for (const file of files) {
        const content = fs.readFileSync(file, "utf-8");
        if (content.toLowerCase().includes(forbidden.toLowerCase())) {
          found.push(path.relative(SRC_DIR, file));
        }
      }
      expect(found, `term #${i + 1} found in: ${found.join(", ")}`).toHaveLength(0);
    });
  });
});
