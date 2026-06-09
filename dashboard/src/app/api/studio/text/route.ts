import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";

// POST /api/studio/text — 글감 1개 → 플랫폼별 텍스트 변형(OSMU).
// body: { idea, guide? } guide=브랜드 톤(prompt-guide 발췌, 선택)
export async function POST(request: Request) {
  const { idea, guide = "" } = await request.json();
  if (!idea || typeof idea !== "string") {
    return Response.json({ error: "idea required" }, { status: 400 });
  }
  const prompt = `너는 SNS 마케팅 카피라이터다. 아래 글감을 플랫폼 특성에 맞춰 변형하라.
${guide ? `브랜드 톤 가이드:\n${guide}\n` : ""}
글감: "${idea}"

규칙: 100% 한국어, AI가 쓴 티 금지, 후킹 첫 문장, 과한 이모지 금지.
출력은 JSON만(다른 텍스트 없이):
{
 "threads": "Threads용 본문 (~500자, 구어체, 첫 줄 훅)",
 "x": "X용 (280자 이내, 압축)",
 "instagram": {"caption": "IG 캡션", "hashtags": ["태그", ...], "slides": ["카드1(표지 훅)", "카드2", "카드3", "카드4(CTA)"]},
 "shorts": {"hook": "0~3초 훅", "body": "3~20초 3포인트", "cta": "20~30초 CTA"},
 "image_prompt": "히어로 이미지 생성용 영문 프롬프트(텍스트 없이, 플랫 일러스트)"
}`;
  try {
    const { stdout } = await execFileP(CLAUDE_BIN, ["-p", prompt], { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
    const m = stdout.match(/\{[\s\S]*\}/);
    if (!m) return Response.json({ error: "JSON 추출 실패", raw: stdout.slice(-400) }, { status: 502 });
    return Response.json({ ok: true, ...JSON.parse(m[0]) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 400) }, { status: 502 });
  }
}
