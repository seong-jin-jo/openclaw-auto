import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

// ── 발행 루프 계약 (Layer 3) ──────────────────────────────────────────────
// 레포 내 실발행 경로는 두 가지뿐이어야 한다.
//   - /api/publish: Studio 등 유저 트리거 동기 발행.
//   - /api/schedule/publish-due: cron/gateway가 도래 예약을 claim해 발행.
//   - /api/video/publish: 영상 전용 경로(YouTube 업로드 + SNS-015 Instagram Reels).
// 새 실발행 경로가 생기면 이 테스트가 깨져 숨은 동작 변경이 diff로 드러난다.

const API_DIR = path.resolve(__dirname, "../../src/app/api");

function walkRoutes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkRoutes(full));
    else if (name === "route.ts") out.push(full);
  }
  return out;
}

const routes = walkRoutes(API_DIR).map((f) => ({
  rel: path.relative(API_DIR, f).replace(/\\/g, "/"),
  src: readFileSync(f, "utf8"),
}));

const PUBLISH_FNS = /\b(publishThreads|publishInstagram|publishX|publishFacebook)\b/;
// Reels(publishInstagramReels)는 영상 전용 경로에서만 호출된다 — 위 4개와 분리해 계약을 따로 건다.

describe("발행 루프 — 명시된 실발행 경로 계약", () => {
  it("published_posts에 INSERT하는 라우트는 명시된 실발행 경로뿐", () => {
    const inserters = routes
      .filter((r) => /INSERT\s+INTO\s+published_posts/i.test(r.src))
      .map((r) => r.rel);
    expect(inserters.sort()).toEqual(
      ["publish/route.ts", "schedule/publish-due/route.ts", "video/publish/route.ts"].sort(),
    );
  });

  it("실 publish*() 함수를 호출하는 라우트는 명시된 실발행 경로뿐", () => {
    const callers = routes.filter((r) => PUBLISH_FNS.test(r.src)).map((r) => r.rel);
    expect(callers.sort()).toEqual(["publish/route.ts", "schedule/publish-due/route.ts"].sort());
  });

  it("publishInstagramReels를 호출하는 라우트는 영상 발행 경로뿐", () => {
    const callers = routes.filter((r) => /\bpublishInstagramReels\b/.test(r.src)).map((r) => r.rel);
    expect(callers.sort()).toEqual(["video/publish/route.ts"]);
  });

  it("/api/schedule 생성/조회 라우트는 발행을 수행하지 않는다", () => {
    const scheduleRoutes = routes.filter((r) => /\bschedules\b/.test(r.src));
    expect(scheduleRoutes.map((r) => r.rel)).toContain("schedule/route.ts");
    for (const r of scheduleRoutes.filter((r) => r.rel !== "schedule/publish-due/route.ts")) {
      expect(PUBLISH_FNS.test(r.src), `${r.rel}가 publish*를 호출하면 안 됨`).toBe(false);
    }
  });

  it("도래 예약을 긁어 발행하는 스케줄러 패턴은 /api/schedule/publish-due 하나뿐", () => {
    const due = routes.filter((r) => /scheduled_at\s*<=?\s*now\(\)/i.test(r.src)).map((r) => r.rel);
    expect(due).toEqual(["schedule/publish-due/route.ts"]);
  });
});
