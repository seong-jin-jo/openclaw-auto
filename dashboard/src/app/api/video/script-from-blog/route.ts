export async function POST(request: Request) {
  const data = await request.json();
  const content: string = data.content || "";
  const title: string = data.title || "";
  if (!content) {
    return Response.json({ error: "content required" }, { status: 400 });
  }

  let text = content;
  try {
    if (content.trim().startsWith("{")) {
      const doc = JSON.parse(content);
      if (doc?.type === "doc") {
        text = "";
        for (const node of doc.content || []) {
          if (node.type === "heading") {
            text += "\n## " + (node.content || []).map((t: Record<string, string>) => t.text || "").join("");
          } else if (node.type === "paragraph") {
            text += "\n" + (node.content || []).map((t: Record<string, string>) => t.text || "").join("");
          }
        }
      }
    }
  } catch {
    text = content.replace(/<[^>]+>/g, "");
  }

  const sections = text.split(/\n##\s*/);
  const slides: Array<{ text: string; duration: number; imageQuery: string }> = [
    { text: title, duration: 4, imageQuery: "" },
  ];
  for (const section of sections.slice(1, 6)) {
    const lines = section.trim().split("\n");
    const heading = lines[0]?.trim() || "";
    if (heading) {
      slides.push({ text: heading.slice(0, 40), duration: 5, imageQuery: heading });
    }
  }
  slides.push({ text: "\uC790\uC138\uD55C \uB0B4\uC6A9\uC740 \uD504\uB85C\uD544 \uB9C1\uD06C\uC5D0\uC11C", duration: 3, imageQuery: "" });

  return Response.json({
    title,
    slides,
    totalDuration: slides.reduce((s, sl) => s + sl.duration, 0),
  });
}
