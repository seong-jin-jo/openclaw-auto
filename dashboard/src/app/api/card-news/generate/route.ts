import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { DATA_DIR } from "@/lib/file-io";

const IMAGES_DIR = path.join(DATA_DIR, "images");

export async function POST(request: Request) {
  const data = await request.json();
  const title = (data.title || "").trim();
  const slides = data.slides || [];
  const style = data.style || "dark";
  const ending = data.ending || "";

  if (!title) return Response.json({ error: "title required" }, { status: 400 });
  if (!slides || !Array.isArray(slides)) return Response.json({ error: "slides array required" }, { status: 400 });

  const slidesJson = JSON.stringify(slides);
  let msg = `card_generate tool로 action=generate, title="${title}", slides=${slidesJson}, style="${style}"`;
  if (ending) msg += `, ending="${ending}"`;
  msg += " 를 실행하라. 결과의 files와 batchId를 그대로 출력하라.";
  const container = process.env.GATEWAY_CONTAINER || "openclaw-gateway";

  try {
    execFileSync(
      "docker",
      ["exec", container, "node", "dist/index.js", "agent", "--agent", "main", "--message", msg],
      { timeout: 60000 },
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes("TIMEOUT")) {
      return Response.json({ error: "Card generation timed out" }, { status: 504 });
    }
    const msg2 = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg2.slice(0, 200) }, { status: 500 });
  }

  // Find newly created card images by scanning for latest batch
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const cardFiles = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.startsWith("card-") && f.endsWith("-01-title.png"))
    .sort((a, b) => {
      const aStat = fs.statSync(path.join(IMAGES_DIR, a));
      const bStat = fs.statSync(path.join(IMAGES_DIR, b));
      return bStat.mtimeMs - aStat.mtimeMs;
    });

  if (!cardFiles.length) {
    return Response.json({ error: "No card images generated" }, { status: 500 });
  }

  const latest = cardFiles[0];
  const batchMatch = latest.match(/^card-([a-f0-9]{8})-/);
  if (!batchMatch) {
    return Response.json({ error: "Could not parse batch ID" }, { status: 500 });
  }

  const batchId = batchMatch[1];
  const prefix = `card-${batchId}-`;
  const allSlides = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith(".png"))
    .sort()
    .map(f => `/images/${f}`);

  return Response.json({
    success: true,
    batchId,
    slides: allSlides,
    totalSlides: allSlides.length,
  });
}
