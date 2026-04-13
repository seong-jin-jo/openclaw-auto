import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";

export async function GET() {
  const imagesDir = dataPath("images");
  if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) {
    return Response.json([]);
  }

  const validExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
  const files = fs.readdirSync(imagesDir)
    .filter((f) => validExts.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const filePath = path.join(imagesDir, f);
      const stat = fs.statSync(filePath);
      return {
        filename: f,
        url: `/images/${f}`,
        size: stat.size,
        createdAt: new Date(stat.mtimeMs).toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json(files);
}
