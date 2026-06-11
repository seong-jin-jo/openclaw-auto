import fs from "fs";
import path from "path";
import { resolveMediaPath } from "@/lib/storage";

const TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm",
};

// GET /api/higgsfield/asset/<file>?tenant_id=... — 테넌트 격리 미디어 스트리밍.
// 테넌트의 data/studio/{tenantId}/ 디렉토리에서만 서빙. tenant_id 없거나 파일이 그 테넌트 dir 밖이면 404.
// 영상 재생/탐색 위해 HTTP Range(206 Partial Content) 지원.
// 보안: 모든 실패를 404로 통일해 다른 테넌트 파일 존재 여부 열거(enumerate)를 차단.
export async function GET(req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  // 테넌트 컨텍스트는 쿼리(?tenant_id=) 또는 헤더(X-Tenant-ID)에서. 없으면 404.
  const tenantId = new URL(req.url).searchParams.get("tenant_id") || req.headers.get("x-tenant-id");
  if (!tenantId) return Response.json({ error: "not found" }, { status: 404 });

  // resolveMediaPath가 path traversal( .. / \ )과 타테넌트 경로를 차단. null이면 404.
  const fp = resolveMediaPath(tenantId, file);
  if (!fp) return Response.json({ error: "not found" }, { status: 404 });
  if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) return Response.json({ error: "not found" }, { status: 404 });

  const size = fs.statSync(fp).size;
  const ct = TYPES[path.extname(fp).toLowerCase()] || "application/octet-stream";
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
    headers: { "Content-Type": ct, "Accept-Ranges": "bytes", "Content-Length": String(size), "Cache-Control": "private, max-age=3600" },
  });
}
