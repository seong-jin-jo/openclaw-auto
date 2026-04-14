import { execFileSync } from "child_process";

export async function POST(request: Request) {
  const data = await request.json();
  const title = (data.title || "").trim();
  if (!title) return Response.json({ error: "title required" }, { status: 400 });

  const msg = `다음 주제로 Instagram 카드뉴스 슬라이드 초안을 만들어라: "${title}"

규칙:
- 슬라이드 4~5장 분량
- 각 슬라이드는 핵심 포인트 1개
- 짧고 임팩트 있게 (각 슬라이드 2~3줄)
- 100% 한국어
- 마지막 슬라이드는 CTA (프로필 링크 유도)

출력 형식 (JSON만, 다른 텍스트 없이):
{"slides": ["슬라이드1 내용", "슬라이드2 내용", ...], "caption": "Instagram 캡션", "hashtags": ["태그1", "태그2", ...]}`;

  try {
    const container = process.env.GATEWAY_CONTAINER || "openclaw-gateway";
    const result = execFileSync("docker", [
      "exec", container, "node", "dist/index.js", "agent", "--agent", "main", "--message", msg,
    ], { timeout: 120000 }).toString().trim();

    const jsonMatch = result.match(/\{[\s\S]*"slides"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return Response.json({ success: true, ...parsed });
    }
    return Response.json({ error: "AI 응답에서 JSON을 추출할 수 없음", raw: result.slice(-500) }, { status: 500 });
  } catch (e) {
    const msg2 = e instanceof Error ? e.message : String(e);
    if (msg2.includes("TIMEOUT") || msg2.includes("timed out")) {
      return Response.json({ error: "AI outline generation timed out (2분 제한)" }, { status: 504 });
    }
    return Response.json({ error: msg2.slice(0, 500) }, { status: 500 });
  }
}
