import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { dataPath } from "@/lib/file-io";
import { runWithTenant } from "@/lib/tenant-context";
import { verifyImageToken } from "@/lib/image-token";

// GET /api/images/deliver/<signed-token> — SNS-016 서명 이미지 배달.
// Meta/Threads 서버가 큐에 저장된 이미지 URL을 직접 가져가므로(Authorization 헤더를 못 붙임)
// 인증 대신 HMAC 서명 토큰이 자격증명 역할을 한다. media/[token](영상)과 같은 형태지만
// image-token.ts가 별도 서명 키를 쓰므로 토큰이 서로 교차 재생되지 않는다.
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const notFound = () => Response.json({ error: "not found" }, { status: 404 });

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let decodedToken: string;
  try {
    decodedToken = decodeURIComponent(token || "");
  } catch {
    return notFound();
  }
  const claim = verifyImageToken(decodedToken);
  if (!claim) return notFound();

  return runWithTenant(claim.tenantId, async () => {
    const fp = path.join(dataPath("images"), claim.filename);
    if (!fs.existsSync(fp) || !fs.statSync(fp).isFile()) return notFound();
    const ct = TYPES[path.extname(fp).toLowerCase()];
    if (!ct) return notFound(); // 허용된 이미지 확장자만 배달 — 임의 파일 유출 방지

    const size = fs.statSync(fp).size;
    const stream = Readable.toWeb(fs.createReadStream(fp)) as unknown as ReadableStream<Uint8Array>;
    return new Response(stream, {
      headers: {
        "Content-Type": ct,
        "Content-Length": String(size),
        // 삭제 직후에도 CDN/브라우저 캐시에서 원본이 남지 않게 한다. URL 토큰의 30일 수명은
        // 예약 발행을 위한 접근 수명이지, 삭제를 무시하는 캐시 수명이 아니다.
        "Cache-Control": "private, no-store",
      },
    });
  });
}
