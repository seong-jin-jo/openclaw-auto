import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) => fs.readFileSync(path.resolve(process.cwd(), relativePath), "utf8");

describe("R-02 승인 디자인 계약", () => {
  it("Home은 성과 요약 하나만 남기고 제거 대상 패널을 다시 만들지 않는다", () => {
    const source = read("src/app/page.tsx");
    expect(source.match(/>성과 요약</g)).toHaveLength(1);
    expect(source).not.toContain(">운영 현황<");
    expect(source).not.toContain(">This Week<");
    expect(source).not.toContain(">발행물 성과<");
    expect(source).not.toContain("useWeeklySummary");
  });

  it("이번에 바꾼 UI 표면은 시맨틱 색 토큰만 사용한다", () => {
    const files = [
      "src/app/page.tsx",
      "src/app/studio/page.tsx",
      "src/app/operator/customers/page.tsx",
      "src/components/channel/ChannelPage.tsx",
    ];
    for (const file of files) {
      expect(read(file), file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it("Admin accordion은 기본 접힘과 접근 가능한 제어 관계를 유지한다", () => {
    const source = read("src/app/operator/customers/page.tsx");
    expect(source).toContain("aria-expanded={isExpanded}");
    expect(source).toContain("aria-controls={`oauth-provider-panel-${item.provider}`}");
    expect(source).toContain("aria-labelledby={`oauth-provider-trigger-${item.provider}`}");
    expect(source).toContain("{isExpanded && (");
  });
});
