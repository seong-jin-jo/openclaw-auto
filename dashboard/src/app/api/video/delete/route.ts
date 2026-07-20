import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { isSafeMediaFilename } from "@/lib/media-token";

export async function POST(request: Request) {
  const data = await request.json();
  const filename = data.filename || "";
  // 경로 구분자/상위참조 거부 + 화이트리스트(영숫자/./-/_ only) — 테넌트 videos 디렉터리를
  // 벗어난 삭제를 원천 차단(media-token.ts와 동일 규칙, 일관성 유지).
  if (!filename || filename.includes("..") || !isSafeMediaFilename(filename)) {
    return Response.json({ error: "invalid filename" }, { status: 400 });
  }

  const tenantId = await effectiveTenantId(request, null);

  return runWithTenant(tenantId, async () => {
    // dataPath()는 runWithTenant 컨텍스트 "안"에서 호출 — 테넌트별 격리(finding 6과 동일 함정).
    const filepath = path.join(dataPath("videos"), filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "not found" }, { status: 404 });
  });
}
