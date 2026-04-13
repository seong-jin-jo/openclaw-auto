import { execSync } from "child_process";

export async function POST() {
  try {
    execSync("docker restart marketing-ai-openclaw-gateway-1", {
      timeout: 30000,
    });
    return Response.json({ ok: true, message: "Gateway 재시작 완료. 15초 후 사용 가능." });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}
