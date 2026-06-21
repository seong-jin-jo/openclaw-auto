import { repurposeVideo, getClippingConfig } from "@/lib/clipping";
import { effectiveTenantId } from "@/lib/tenant-auth";

// POST /api/video/repurpose
// body: { videoUrl?: string, uploadRef?: string, provider?: string, ...options }
// Returns clips ready for OSMU refinement + publish.
// 0차: external clipping (Reap/Ssemble) + basic mock support. Then refine in UI with wiki.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, body.tenant_id);

  const videoUrl: string | undefined = body.videoUrl;
  const uploadRef: string | undefined = body.uploadRef; // from /video/upload

  if (!videoUrl && !uploadRef) {
    return Response.json({ error: "videoUrl or uploadRef required" }, { status: 400 });
  }

  // For local long video (uploadRef), external providers need public URL. For 0차, recommend YT URL.
  // If uploadRef and no videoUrl, we can use it for local processing if provider supports, but current is url based.
  if (uploadRef && !videoUrl) {
    // For now, require videoUrl for clipping; uploadRef is for output clips or future.
    // To support local long video, user can host or use YT.
    return Response.json({ error: "For long video input, provide public videoUrl (YT preferred). uploadRef is for clip output." }, { status: 400 });
  }

  const cfg = getClippingConfig();
  if (!cfg.apiKey && !videoUrl?.includes("example")) {
    // allow mock for dev
  }

  try {
    // For uploadRef (local), in full impl we would make it accessible (copy to R2 or temp url).
    // For 0차 MVP: prefer videoUrl (YT). Local uploadRef can be handled by passing local path if provider supports, but here we expect caller to provide accessible url.
    const input = { videoUrl }; // uploadRef for local long not supported for input yet (use public YT URL)

    const result = await repurposeVideo(input, {
      provider: body.provider,
      numClips: body.numClips || 6,
      ...body.options,
    });

    // Record usage
    try {
      const auth = request.headers.get('Authorization') || '';
      await fetch(new URL('/api/usage/record', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': auth,
        },
        body: JSON.stringify({ event: 'shortsGeneration', count: result.clips.length }),
      });
    } catch {}

    return Response.json({
      ok: true,
      provider: result.provider,
      clips: result.clips,
      // Add tenant context for later refinement
      tenant_id: tenantId,
    });
  } catch (e: any) {
    return Response.json({ error: e.message || String(e) }, { status: 500 });
  }
}
