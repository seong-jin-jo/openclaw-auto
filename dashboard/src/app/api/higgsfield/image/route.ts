import path from "path";
import { hfRun, extractJson, findResultUrl, downloadTo, logGen, STUDIO_DIR } from "@/lib/higgsfield";

// POST /api/higgsfield/image — Soul V2 text→image. body: { prompt, aspectRatio?, quality?, label? }
// 반환: { url(cloudfront), file(/studio-assets/..), localPath } — video 단계에서 localPath 재사용
export async function POST(request: Request) {
  const { prompt, aspectRatio = "9:16", quality = "1.5k", label = "" } = await request.json();
  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "prompt required" }, { status: 400 });
  }
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
    logGen("image", "Higgsfield Soul V2", label);
    return Response.json({ ok: true, url, file: `/api/higgsfield/asset/${fname}`, localPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const nsfw = /nsfw/i.test(msg);
    const credits = /not enough credits/i.test(msg);
    return Response.json({ error: msg.slice(0, 400), nsfw, credits }, { status: 502 });
  }
}
