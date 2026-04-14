import { execSync } from "child_process";

export async function POST(request: Request) {
  const data = await request.json();
  const title = data.title || "";
  const slides = data.slides || [];
  const style = data.style || "dark";

  const slidesText = slides.map((s: string, i: number) => `슬라이드 ${i + 1}: ${s}`).join("\n");
  const msg = `Figma MCP 서버를 사용하여 카드뉴스를 생성하라:

제목: ${title}
스타일: ${style}
${slidesText}

1. 새 Figma 페이지 또는 기존 파일에 1080x1350px 프레임을 슬라이드 수만큼 생성
2. 각 프레임에 배경색 적용 (dark=#0f0f0f, tech=#0a1628, gradient=#1e1b4b)
3. 첫 프레임: "CARD NEWS" 뱃지 + 제목 텍스트 (볼드 52px)
4. 중간 프레임: 넘버 + 본문 텍스트 (34px) 중앙 정렬
5. 마지막 프레임: CTA 텍스트 + "@your_threads_handle"
6. 생성 완료 후 Figma 파일 URL을 출력하라.`;

  try {
    const result = execSync(
      `docker exec ${process.env.GATEWAY_CONTAINER || "openclaw-gateway"} node dist/index.js agent --agent main --message ${JSON.stringify(msg)}`,
      { timeout: 120000 },
    ).toString().trim();

    const urlMatch = result.match(/https:\/\/www\.figma\.com\/\S+/);
    return Response.json({
      success: true,
      figmaUrl: urlMatch ? urlMatch[0] : null,
      output: result.slice(-300),
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("TIMEOUT")) {
      return Response.json({ error: "Figma 생성 타임아웃" }, { status: 504 });
    }
    const msg2 = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg2.slice(0, 200) }, { status: 500 });
  }
}
