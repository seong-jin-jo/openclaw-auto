import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";

// ── 발행 루프의 "갭"을 통과 테스트로 박제 (Layer 3) ──────────────────────────
// 사실: 이 레포에는 예약/승인된 글을 도래 시각에 자동 발행하는 스케줄러가 없다.
//   - queue.json approved + scheduledAt → 외부 OpenClaw 게이트웨이 크론이 발행.
//   - schedules 테이블 status='scheduled' → 동일 외부 크론이 발행.
//   - 레포 내 유일한 실발행·기록 경로 = /api/publish (유저 트리거, 동기) → published_posts.
// 누군가 레포 내 스케줄러를 추가하면 이 테스트가 깨진다 → 숨은 동작 변경이 diff로 드러난다.

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

describe("발행 루프 — 외부 게이트웨이 의존 계약", () => {
  it("published_posts에 INSERT하는 라우트는 /api/publish 하나뿐 (동기 유저 트리거)", () => {
    const inserters = routes
      .filter((r) => /INSERT\s+INTO\s+published_posts/i.test(r.src))
      .map((r) => r.rel);
    expect(inserters).toEqual(["publish/route.ts"]);
  });

  it("실 publish*() 함수를 호출하는 라우트는 /api/publish 하나뿐", () => {
    const callers = routes.filter((r) => PUBLISH_FNS.test(r.src)).map((r) => r.rel);
    expect(callers).toEqual(["publish/route.ts"]);
  });

  it("schedules 테이블을 다루는 라우트는 발행을 수행하지 않는다 (스케줄러 부재)", () => {
    const scheduleRoutes = routes.filter((r) => /\bschedules\b/.test(r.src));
    // schedule/route.ts는 존재(INSERT/SELECT)하되, publish*를 호출하지 않아야 한다.
    expect(scheduleRoutes.map((r) => r.rel)).toContain("schedule/route.ts");
    for (const r of scheduleRoutes) {
      expect(PUBLISH_FNS.test(r.src), `${r.rel}가 publish*를 호출하면 안 됨`).toBe(false);
    }
  });

  it("도래한 예약을 긁어 발행하는 스케줄러 패턴이 레포에 없다", () => {
    // 'scheduled_at <= now()' 류로 도래 예약을 selecting하는 라우트가 없어야 함
    const due = routes.filter((r) => /scheduled_at\s*<=?\s*now\(\)/i.test(r.src)).map((r) => r.rel);
    expect(due).toEqual([]);
  });
});
