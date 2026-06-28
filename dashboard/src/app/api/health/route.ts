import { db } from "@/lib/db";

// GET /api/health — 헬스체크(컨테이너 healthcheck + 외부 업타임 모니터용).
// ⚠️ 부작용 0 (이번 장애 교훈: 읽기 경로에 쓰기/테넌트생성 금지). 인증/테넌트 해석 안 함.
// DB 핑(SELECT 1)만 — 빠른 타임아웃. DB 불가 시 503으로 모니터가 감지.
export async function GET() {
  const started = Date.now();
  try {
    await Promise.race([
      db()`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error("db timeout")), 3000)),
    ]);
    return Response.json({ ok: true, db: "up", ms: Date.now() - started });
  } catch (e) {
    return Response.json(
      { ok: false, db: "down", error: e instanceof Error ? e.message : String(e), ms: Date.now() - started },
      { status: 503 },
    );
  }
}
