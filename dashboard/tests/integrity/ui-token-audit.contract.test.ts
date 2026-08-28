import { describe, expect, it } from "vitest";
import { auditDirectory, auditSource } from "../../scripts/ui-token-audit.mjs";

describe("UI-TOKEN-01 시각값 토큰 계약", () => {
  it("UI-TOKEN-01 정상 경로: 시맨틱 토큰만 쓴 화면은 직접값이 없다", () => {
    const source = `<button className="px-pad-inset text-body rounded-control bg-accent text-accent-fg">저장</button>`;
    expect(auditSource(source)).toEqual([]);
  });

  it("UI-TOKEN-01 거절 경로: 직접 여백·글자·색·반경·그림자를 모두 검출한다", () => {
    const source = `<button className="px-4 text-sm rounded-lg bg-blue-500 shadow-[0_4px_16px_rgba(0,0,0,0.2)]">저장</button>`;
    expect(auditSource(source).map(({ category }) => category)).toEqual([
      "spacing",
      "typography",
      "radius",
      "color",
      "elevation",
    ]);
  });

  it("UI-TOKEN-02 통합 경로: 실제 화면 소스의 직접 시각값은 0건이다", () => {
    expect(auditDirectory("src").total).toBe(0);
  });

  it("UI-TOKEN-03 거절 경로: 강조 전경을 일반 바탕에 쓰면 대비 오류로 검출한다", () => {
    const source = `<strong className="bg-surface text-accent-fg">제목</strong>`;
    expect(auditSource(source).map(({ category }) => category)).toContain("contrast");
  });
});
