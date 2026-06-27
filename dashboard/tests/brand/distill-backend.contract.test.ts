import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// A1 계약 — 브랜드 증류 3라우트는 generateText(테넌트 키 우선·claude 폴백)로 통일돼야 한다.
// 누군가 다시 claude -p(execFile/CLAUDE_BIN)를 하드코딩하면 셀프서브 고객(키만 등록)이
// 502로 조용히 깨지므로, 이 테스트가 회귀를 diff로 드러낸다.

const SRC = path.resolve(__dirname, "../../src/app/api");
const ROUTES = [
  "studio/brand-setup/route.ts",
  "brand/sync-wiki/route.ts",
  "brand/sync-repo/route.ts",
];
const read = (rel: string) => readFileSync(path.join(SRC, rel), "utf8");

describe("브랜드 증류 백엔드 — generateText 통일 계약", () => {
  for (const rel of ROUTES) {
    it(`${rel} 는 generateText를 쓰고 claude -p를 하드코딩하지 않는다`, () => {
      const src = read(rel);
      expect(src, `${rel}: generateText import 필요`).toMatch(/generateText/);
      expect(src, `${rel}: execFile 잔재 금지`).not.toMatch(/execFileP?\s*\(/);
      expect(src, `${rel}: CLAUDE_BIN 직접참조 금지`).not.toMatch(/CLAUDE_BIN/);
    });
  }
});
