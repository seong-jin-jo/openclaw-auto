import { execSync } from "child_process";

export async function POST(request: Request) {
  const data = await request.json();
  const prompt = (data.prompt || "").trim();
  if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

  const msg = `midjourney_image tool로 action=imagine, prompt="${prompt}", auto_upscale=false 실행하라. 결과의 imagePath를 출력하라.`;

  try {
    const result = execSync(
      `docker exec ${process.env.GATEWAY_CONTAINER || "openclaw-gateway"} node dist/index.js agent --agent main --message ${JSON.stringify(msg)}`,
      { timeout: 180000 },
    ).toString().trim();

    const pathMatch = result.match(/\/images\/[^\s"']+\.png/);
    if (pathMatch) {
      return Response.json({ success: true, imagePath: pathMatch[0] });
    }
    return Response.json({ error: "이미지 경로를 찾을 수 없음", output: result.slice(-300) }, { status: 500 });
  } catch (e) {
    if (e instanceof Error && e.message.includes("TIMEOUT")) {
      return Response.json({ error: "미드저니 생성 타임아웃 (3분)" }, { status: 504 });
    }
    const msg2 = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg2.slice(0, 200) }, { status: 500 });
  }
}
