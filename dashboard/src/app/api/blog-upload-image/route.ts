import { readJson, configPath } from "@/lib/file-io";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { config?: Record<string, string> }>;
  };
}

export async function POST(request: Request) {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const blogCfg = config.plugins?.entries?.["dedu-blog"]?.config || {};
  const apiBase = blogCfg.apiBaseUrl || "";
  const email = blogCfg.email || "";
  const password = blogCfg.password || "";

  if (!apiBase || !email) {
    return Response.json({ error: "Blog not configured" }, { status: 400 });
  }

  const data = await request.json();
  const imageUrl = data.imageUrl || "";
  if (!imageUrl) {
    return Response.json({ error: "imageUrl is required" }, { status: 400 });
  }

  try {
    // Login
    const loginRes = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(10000),
    });
    const cookie = loginRes.headers.get("set-cookie") || "";
    const authMatch = cookie.match(/Authorization=([^;]+)/);
    if (!authMatch) {
      return Response.json({ error: "d-edu login failed" }, { status: 500 });
    }
    const authToken = authMatch[1];
    const authHeaders = {
      Cookie: `Authorization=${authToken}`,
      "Content-Type": "application/json",
    };

    // Download image
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(30000),
    });
    const imgBuffer = await imgRes.arrayBuffer();
    const imgData = new Uint8Array(imgBuffer);
    let contentType = (imgRes.headers.get("content-type") || "image/png").split(";")[0].trim();
    const validTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]);
    if (!validTypes.has(contentType)) contentType = "image/png";

    // Extract filename
    const urlPath = new URL(imageUrl).pathname;
    let fname = urlPath.split("/").pop() || `image-${Date.now()}.png`;
    const validExts = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (!validExts.test(fname)) {
      const extMap: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp" };
      fname = `image-${Date.now()}${extMap[contentType] || ".png"}`;
    }

    // Presign
    const presignRes = await fetch(`${apiBase}/api/common/media/presign-batch`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ mediaAssetList: [{ fileName: fname, contentType, sizeBytes: imgData.length }] }),
      signal: AbortSignal.timeout(10000),
    });
    const presignResult = await presignRes.json();
    const asset = presignResult.data.mediaAssetList[0];
    const mediaId = asset.mediaId;

    // Upload to S3
    const uploadHeaders: Record<string, string> = { "Content-Type": contentType };
    if (asset.headers) {
      for (const [k, v] of Object.entries(asset.headers)) {
        uploadHeaders[k] = v as string;
      }
    }
    await fetch(asset.uploadUrl, {
      method: "PUT",
      headers: uploadHeaders,
      body: imgData,
      signal: AbortSignal.timeout(30000),
    });

    return Response.json({ ok: true, mediaId, fileName: fname });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
