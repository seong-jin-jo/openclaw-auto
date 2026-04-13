import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const data = await request.json();
  const title = (data.title || "").trim();
  const slides = data.slides || [];
  const style = data.style || "dark";

  if (!title || !slides.length) {
    return Response.json({ error: "title and slides required" }, { status: 400 });
  }

  const slidesJson = JSON.stringify(slides);
  const msg = `card_generate tool 호출: action="generate", title="${title}", slides=${slidesJson}, style="${style}"`;

  try {
    execSync(
      `docker exec marketing-ai-openclaw-gateway-1 node dist/index.js agent --agent main --session-id card-api-${process.pid} --message "${msg.replace(/"/g, '\\"')}"`,
      { timeout: 60000, encoding: "utf-8" },
    );
  } catch (e) {
    const err = e as Error & { killed?: boolean };
    if (err.killed) return Response.json({ error: "Card generation timed out" }, { status: 504 });
    return Response.json({ error: err.message }, { status: 500 });
  }

  const imagesDir = dataPath("images");
  fs.mkdirSync(imagesDir, { recursive: true });

  const cards = fs.readdirSync(imagesDir)
    .filter((f) => f.startsWith("card-") && f.endsWith(".png"))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(imagesDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (cards.length) {
    const batchPrefix = cards[0].name.slice(0, 13); // "card-XXXXXXXX"
    const batchFiles = cards
      .filter((c) => c.name.startsWith(batchPrefix))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({ filename: c.name, url: `/images/${c.name}` }));
    return Response.json({ success: true, cards: batchFiles });
  }

  return Response.json({ error: "Card generation failed" }, { status: 500 });
}
