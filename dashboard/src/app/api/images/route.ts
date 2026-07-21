import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";
import { effectiveTenantId, AuthError } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { signImageToken, isSafeMediaFilename } from "@/lib/image-token";
import { canonicalPublicOrigin } from "@/lib/social-connect";

// GET /api/images — 테넌트 격리 이미지 갤러리 목록(SNS-016).
// 테넌트는 effectiveTenantId(req)로 인증(osmu_ 토큰/Supabase JWT)에서 직접 유도한다 — 클라이언트가
// 보내는 tenant_id 쿼리/헤더를 그대로 믿으면 임의 tenant_id를 넣어 다른 테넌트 갤러리를 열람하는
// IDOR이 된다(proxy가 osmu_/JWT를 검증하지만 "그 안의 tenant_id"까지는 대조하지 않았음).
// 운영자 토큰은 tenant_id 쿼리를 fallback으로 허용(대시보드에서 워크스페이스 전환 시 사용).
// 저장 경로는 다른 테넌트 미디어(videos/studio)와 동일하게 dataPath("images")(=data/tenants/{id}/images/)
// 로 격리한다 — data/images/{tenantId}/ 같은 공유 루트 하위 prefix가 아니다.
export async function GET(req: Request) {
  const tenantParam = new URL(req.url).searchParams.get("tenant_id");
  let resolved: string | null;
  try {
    resolved = await effectiveTenantId(req, tenantParam);
  } catch (e) {
    if (e instanceof AuthError) return Response.json([]);
    throw e;
  }
  if (!resolved) return Response.json([]);
  const tenantId = resolved;

  return runWithTenant(tenantId, async () => {
    const imagesDir = dataPath("images");
    if (!fs.existsSync(imagesDir) || !fs.statSync(imagesDir).isDirectory()) {
      return Response.json([]);
    }

    const validExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
    const origin = canonicalPublicOrigin();
    const files = fs.readdirSync(imagesDir)
      .filter((f) => validExts.has(path.extname(f).toLowerCase()) && isSafeMediaFilename(f))
      .map((f) => {
        const filePath = path.join(imagesDir, f);
        const stat = fs.statSync(filePath);
        // 서명/공개 origin이 없으면 열람 불가능한 링크를 주느니 목록에서 제외한다(fail closed).
        const token = origin ? signImageToken(tenantId, f) : null;
        if (!origin || !token) return null;
        return {
          filename: f,
          url: `${origin}/api/images/deliver/${token}`,
          size: stat.size,
          createdAt: new Date(stat.mtimeMs).toISOString(),
        };
      })
      .filter((v): v is { filename: string; url: string; size: number; createdAt: string } => v !== null)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Response.json(files);
  });
}
