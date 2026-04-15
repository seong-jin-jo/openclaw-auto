import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";

const VIDEO_OUTPUT_DIR = dataPath("videos");

export async function POST(request: Request) {
  const data = await request.json();
  const filename = data.filename || "";
  if (!filename || filename.includes("..")) {
    return Response.json({ error: "invalid filename" }, { status: 400 });
  }
  const filepath = path.join(VIDEO_OUTPUT_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return Response.json({ ok: true });
  }
  return Response.json({ error: "not found" }, { status: 404 });
}
