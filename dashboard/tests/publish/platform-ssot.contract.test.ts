import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { SCHEDULABLE_PLATFORMS, SCHEDULABLE_PLATFORM_LABELS } from "@/lib/constants";

// ── 예약 발행 플랫폼 SSOT 계약 ─────────────────────────────────────────────
// 과거: SchedulePanel UI는 7채널(threads/x/facebook/instagram/shorts/reels/tiktok)을 노출했으나
//       publish-due 백엔드는 4채널만 지원 → shorts/reels/tiktok 예약은 "미지원"으로 영영 미발행.
// 이제 두 곳이 constants.SCHEDULABLE_PLATFORMS 단일 소스를 소비한다. 누구든 한쪽에 플랫폼을
// 하드코딩하면 이 테스트가 깨져 드리프트가 diff로 드러난다.

const SRC = path.resolve(__dirname, "../../src");
const read = (rel: string) => readFileSync(path.join(SRC, rel), "utf8");

describe("예약 발행 플랫폼 — UI/백엔드 단일 소스 계약", () => {
  it("SSOT 상수는 라벨과 키가 일대일 대응한다", () => {
    expect(SCHEDULABLE_PLATFORMS.length).toBeGreaterThan(0);
    for (const p of SCHEDULABLE_PLATFORMS) {
      expect(SCHEDULABLE_PLATFORM_LABELS[p], `${p} 라벨 누락`).toBeTruthy();
    }
    expect(Object.keys(SCHEDULABLE_PLATFORM_LABELS).sort()).toEqual([...SCHEDULABLE_PLATFORMS].sort());
  });

  it("SchedulePanel(UI)은 SSOT를 소비하고 플랫폼을 하드코딩하지 않는다", () => {
    const src = read("components/studio/SchedulePanel.tsx");
    expect(src).toMatch(/SCHEDULABLE_PLATFORMS/);
    expect(src).toMatch(/SCHEDULABLE_PLATFORM_LABELS/);
    // 영상 플랫폼 하드코딩이 되살아나면 실패 — 백엔드가 못 받는 채널을 노출하면 안 됨.
    expect(src).not.toMatch(/"shorts"|"reels"|"tiktok"/);
  });

  it("publish-due(백엔드)는 SSOT를 소비하고 플랫폼 목록을 하드코딩하지 않는다", () => {
    const src = read("app/api/schedule/publish-due/route.ts");
    expect(src).toMatch(/SCHEDULABLE_PLATFORMS/);
    // 과거의 하드코딩 Set 리터럴이 되살아나면 실패.
    expect(src).not.toMatch(/new Set\(\[\s*"threads"/);
  });
});
