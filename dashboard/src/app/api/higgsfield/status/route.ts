import { hfRun } from "@/lib/higgsfield";

// GET /api/higgsfield/status — 로그인 계정/플랜/크레딧 잔액
export async function GET() {
  try {
    const { stdout } = await hfRun(["account", "status"], 20000);
    const line = stdout.trim();
    // 형식: "email@x.com — starter plan, 209.88 credits"
    const m = line.match(/^(\S+@\S+)\s+[—-]\s+(.+?),\s+([\d.]+)\s+credits/);
    if (m) {
      return Response.json({ ok: true, email: m[1], plan: m[2], credits: parseFloat(m[3]), raw: line });
    }
    return Response.json({ ok: true, raw: line });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 미로그인/CLI 부재
    return Response.json({ ok: false, error: msg.slice(0, 300), needsLogin: /not.*log|auth|token/i.test(msg) }, { status: 200 });
  }
}
