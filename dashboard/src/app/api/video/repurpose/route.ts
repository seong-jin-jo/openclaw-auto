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

  const cfg = getClippingConfig();
  if (!cfg.apiKey && !videoUrl?.includes("example")) {
    // allow mock for dev
  }

  try {
    // For uploadRef (local), in full impl we would make it accessible (copy to R2 or temp url).
    // For 0차 MVP: prefer videoUrl (YT). Local uploadRef can be handled by passing local path if provider supports, but here we expect caller to provide accessible url.
    const input = videoUrl ? { videoUrl } : { videoUrl: uploadRef }; // placeholder; enhance later

    const result = await repurposeVideo(input, {
      provider: body.provider,
      numClips: body.numClips || 6,
      ...body.options,
    });

    // Record usage (basic)
    // TODO: wire to /api/usage/record for shorts/videoClips

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
