import path from "path";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { hfRun, extractJson, findResultUrl, downloadTo, logGen, recordMediaGenerationEvent, HiggsfieldUnavailableError, HiggsfieldUnauthenticatedError, assertHiggsfieldReady, studioDir, assetUrl } from "@/lib/higgsfield";

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
  // 2026-09-06: 생성 요청이 Cloudflare 502(Host Error)로 끝나는데 컨테이너 로그에 아무것도
  // 남지 않아 어느 단계가 죽는지 알 수 없었다. 단계 표식을 남겨 다음 시도 한 번이면 특정된다.
  const mark = (step: string, extra?: string) =>
    console.log(JSON.stringify({ kind: "hf_image_step", step, extra: extra?.slice(0, 300) }));
  try {
    mark("ready:start");
    await assertHiggsfieldReady();
    mark("ready:ok");
    const { stdout } = await hfRun([
      "generate", "create", "text2image_soul_v2",
      "--prompt", prompt, "--aspect_ratio", aspectRatio, "--quality", quality,
      "--wait", "--json",
    ]);
    mark("run:ok", `stdout=${stdout.length}`);
    const url = findResultUrl(extractJson(stdout), /png|jpg|jpeg|webp/);
    if (!url) return Response.json({ error: "no image url", raw: stdout.slice(-400) }, { status: 502 });

    // 종전에는 공용 루트에 저장하고 주소도 테넌트 없이 돌려줬다. 그런데 자산 라우트는
    // 테넌트 폴더에서만 읽고 tenant_id 를 요구한다. 그래서 만들기는 성공하는데 화면에서
    // 그림이 안 뜨는 상태였다(회장 2026-09-07 실사용). 저장과 주소를 테넌트로 맞춘다.
    const fname = `img_${Date.now()}.png`;
    const localPath = path.join(studioDir(tenantId), fname);
    await downloadTo(url, localPath);
    runWithTenant(tenantId, () => logGen("image", "Higgsfield Soul V2", label));
    await recordMediaGenerationEvent(tenantId, "image", "Higgsfield Soul V2", label);
    return Response.json({ ok: true, url, file: assetUrl(tenantId, fname), localPath });
  } catch (e) {
    mark("catch", e instanceof Error ? `${e.name}: ${e.message}` : String(e));
    if (e instanceof HiggsfieldUnauthenticatedError) {
      return Response.json({
        error: "이미지 생성기에 로그인되어 있지 않습니다. 서버에서 생성기 로그인을 한 번 해 주시면 바로 쓰실 수 있습니다.",
        code: "GENERATOR_UNAUTHENTICATED",
      }, { status: 503 });
    }
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
