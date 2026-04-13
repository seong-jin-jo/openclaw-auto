import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { dataPath, configPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const data = await request.json();
  const prompt = (data.prompt || "").trim();
  if (!prompt || prompt.length > 500) {
    return Response.json({ error: "prompt required (max 500 chars)" }, { status: 400 });
  }

  const safePrompt = prompt.replace(/'/g, "\\'").replace(/"/g, '\\"');
  const msg = `image_generate tool로 "${safePrompt}" 이미지를 생성하라. 생성된 이미지를 /home/node/data/images/ 폴더에 저장하라.`;

  let stdout = "";
  try {
    stdout = execSync(
      `docker exec marketing-ai-openclaw-gateway-1 node dist/index.js agent --agent main --message "${msg.replace(/"/g, '\\"')}"`,
      { timeout: 120000, encoding: "utf-8" },
    );
  } catch (e) {
    const err = e as Error & { killed?: boolean };
    if (err.killed) return Response.json({ error: "Image generation timed out" }, { status: 504 });
    return Response.json({ error: err.message }, { status: 500 });
  }

  const imagesDir = dataPath("images");
  fs.mkdirSync(imagesDir, { recursive: true });

  // Find newest image
  const validExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
  const files = fs.readdirSync(imagesDir)
    .filter((f) => validExts.has(path.extname(f).toLowerCase()))
    .map((f) => ({ name: f, mtime: fs.statSync(path.join(imagesDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length) {
    return Response.json({ success: true, image: { filename: files[0].name, url: `/images/${files[0].name}` } });
  }

  // Check config/media for gateway-generated images
  const mediaDir = configPath("media", "tool-image-generation");
  if (fs.existsSync(mediaDir) && fs.statSync(mediaDir).isDirectory()) {
    const mediaFiles = fs.readdirSync(mediaDir)
      .filter((f) => validExts.has(path.extname(f).toLowerCase()))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(mediaDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (mediaFiles.length) {
      const src = path.join(mediaDir, mediaFiles[0].name);
      const dest = path.join(imagesDir, mediaFiles[0].name);
      fs.copyFileSync(src, dest);
      return Response.json({ success: true, image: { filename: mediaFiles[0].name, url: `/images/${mediaFiles[0].name}` } });
    }
  }

  return Response.json({ error: "Image generation failed", output: stdout.slice(-500) }, { status: 500 });
}
