import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";

const VIDEO_OUTPUT_DIR = dataPath("videos");

export async function GET() {
  fs.mkdirSync(VIDEO_OUTPUT_DIR, { recursive: true });
  const videos: Array<{ filename: string; url: string; size: number; createdAt: number }> = [];

  try {
    const files = fs.readdirSync(VIDEO_OUTPUT_DIR);
    const entries = files
      .filter((f) => f.endsWith(".mp4"))
      .map((f) => {
        const fp = path.join(VIDEO_OUTPUT_DIR, f);
        const stat = fs.statSync(fp);
        return { filename: f, url: `/videos/${f}`, size: stat.size, createdAt: stat.mtimeMs };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    videos.push(...entries);
  } catch {
    // dir doesn't exist yet
  }

  return Response.json({ videos });
}
