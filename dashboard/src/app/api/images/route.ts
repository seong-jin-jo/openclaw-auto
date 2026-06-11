import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";
import { safeTenantId } from "@/lib/storage";

// GET /api/images?tenant_id=... — 테넌트 격리 이미지 갤러리 목록.
// 테넌트 prefix 디렉토리(data/images/{tenantId}/)의 파일만 반환. tenant_id 없거나 유효하지 않으면 빈 목록(fail-closed).
// 보안: 전역 data/images를 통째로 노출하면 타테넌트 에셋이 열거되므로 테넌트 하위 디렉토리로만 한정.
export async function GET(req: Request) {
  const tenantParam = new URL(req.url).searchParams.get("tenant_id") || req.headers.get("x-tenant-id");
  const tenant = safeTenantId(tenantParam); // traversal 차단 + 정규화
  if (!tenant) return Response.json([]);

  // 테넌트 prefix 디렉토리만 조회 (path.join이 정규화된 tenant만 받으므로 안전)
  const imagesDir = path.join(dataPath("images"), tenant);
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
        // URL도 테넌트 prefix 포함 — 정적 서빙 경로 격리
        url: `/images/${tenant}/${f}`,
        size: stat.size,
        createdAt: new Date(stat.mtimeMs).toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return Response.json(files);
}
