import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import type { ContextSource } from "@/lib/context-source";

// 제품-grounded 생성용 "제품 소스" 설정(테넌트별). repo changelog/README/docs를 가리킨다.
// seed/generate가 이걸 읽어 글의 사실 근거로 주입 → "방금 X 배포함 → 관련 글" (바이브코더 정조준).
const FILE = "product-source.json";

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    const cfg = readJson<ContextSource>(dataPath(FILE)) || null;
    // token은 클라로 돌려보내지 않음(보안)
    const safe = cfg ? { ...cfg, token: cfg.token ? "***" : undefined } : null;
    return Response.json({ source: safe });
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    if (body?.clear) {
      writeJson(dataPath(FILE), null);
      return Response.json({ ok: true, cleared: true });
    }
    const type = body?.type === "local" ? "local" : "github";
    const src: ContextSource = {
      type,
      owner: typeof body.owner === "string" ? body.owner.trim() : undefined,
      repo: typeof body.repo === "string" ? body.repo.trim() : undefined,
      path: typeof body.path === "string" ? body.path.trim() : undefined,
      ref: typeof body.ref === "string" && body.ref.trim() ? body.ref.trim() : "main",
    };
    if (type === "github" && (!src.owner || !src.repo || !src.path)) {
      return Response.json({ error: "github 소스는 owner/repo/path 필수" }, { status: 400 });
    }
    if (type === "local" && !src.path) {
      return Response.json({ error: "local 소스는 path 필수" }, { status: 400 });
    }
    // token은 들어오면 보존(미입력 시 기존 token 유지)
    const prev = readJson<ContextSource>(dataPath(FILE)) || null;
    if (typeof body.token === "string" && body.token && body.token !== "***") src.token = body.token;
    else if (prev?.token) src.token = prev.token;
    writeJson(dataPath(FILE), src);
    return Response.json({ ok: true });
  });
}
