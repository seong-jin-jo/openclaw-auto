import fs from "fs";
import path from "path";
import { STUDIO_DIR } from "@/lib/higgsfield";

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm",
};

// GET /api/higgsfield/asset/<file> — data/studio/ 생성물 스트리밍.
// 영상 재생/탐색 위해 HTTP Range(206 Partial Content) 지원.
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (file.includes("..") || file.includes("/")) return Response.json({ error: "invalid" }, { status: 400 });
  const fp = path.join(STUDIO_DIR, file);
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) return Response.json({ error: "not found" }, { status: 404 });

  const size = fs.statSync(fp).size;
  const ct = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.get("range");

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    const start = m && m[1] ? parseInt(m[1], 10) : 0;
    const end = m && m[2] ? parseInt(m[2], 10) : size - 1;
    if (start >= size || end >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const fd = fs.openSync(fp, "r");
    const len = end - start + 1;
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, start);
    fs.closeSync(fd);
    return new Response(new Uint8Array(buf), {
      status: 206,
      headers: { "Content-Type": ct, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": String(len) },
    });
  }
  const buf = fs.readFileSync(fp);
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": ct, "Accept-Ranges": "bytes", "Content-Length": String(size), "Cache-Control": "public, max-age=3600" },
  });
}
