import path from "path";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { hfRun, extractJson, findResultUrl, downloadTo, logGen, recordMediaGenerationEvent, HiggsfieldUnavailableError, STUDIO_DIR } from "@/lib/higgsfield";

// POST /api/higgsfield/image — Soul V2 text→image. body: { prompt, aspectRatio?, quality?, label? }
// 반환: { url(cloudfront), file(/studio-assets/..), localPath } — video 단계에서 localPath 재사용
export async function POST(request: Request) {
  const body = await request.json();
  const { prompt, aspectRatio = "9:16", quality = "1.5k", label = "" } = body;
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt required" }, { status: 400 });
  }
  // 누가 만든 것인지 남겨야 사용량과 이력이 작업 공간별로 갈린다. 고객에게 생성을
  // 연 이상 이것이 없으면 모두의 이력이 한 파일에 섞인다(2026-09-06).
  const tenantId = await effectiveTenantId(request, body.tenant_id);
  if (!tenantId) return Response.json({ error: "테넌트를 식별할 수 없습니다." }, { status: 401 });
  try {
    const { stdout } = await hfRun([
      "generate", "create", "text2image_soul_v2",
      "--prompt", prompt, "--aspect_ratio", aspectRatio, "--quality", quality,
      "--wait", "--json",
    ]);
    const url = findResultUrl(extractJson(stdout), /png|jpg|jpeg|webp/);
    if (!url) return Response.json({ error: "no image url", raw: stdout.slice(-400) }, { status: 502 });

    const fname = `img_${Date.now()}.png`;
    const localPath = path.join(STUDIO_DIR, fname);
    await downloadTo(url, localPath);
    runWithTenant(tenantId, () => logGen("image", "Higgsfield Soul V2", label));
    await recordMediaGenerationEvent(tenantId, "image", "Higgsfield Soul V2", label);
    return Response.json({ ok: true, url, file: `/api/higgsfield/asset/${fname}`, localPath });
  } catch (e) {
    if (e instanceof HiggsfieldUnavailableError) {
      return Response.json({
        error: "이미지 생성기가 아직 이 서버에 준비되지 않았습니다. 준비되면 바로 쓰실 수 있습니다.",
        code: "GENERATOR_UNAVAILABLE",
      }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : String(e);
    const nsfw = /nsfw/i.test(msg);
    const credits = /not enough credits/i.test(msg);
    return Response.json({ error: msg.slice(0, 400), nsfw, credits }, { status: 502 });
  }
}
