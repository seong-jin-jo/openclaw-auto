import fs from "fs";
import path from "path";
import crypto from "crypto";
import { readJson, mutateJson, dataPath, DATA_DIR } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

const IMAGES_DIR = path.join(DATA_DIR, "images");

export async function POST(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑(기존엔 누락돼 항상 공유 루트에 기록되는 버그였음).
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const data = await request.json();
  const fileKey = data.fileKey || "";
  const postId = data.postId || "";

  if (!fileKey || !postId) {
    return Response.json({ error: "fileKey and postId required" }, { status: 400 });
  }

  const dt = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  const figma = (dt.figma || {}) as Record<string, unknown>;
  const token = (figma.accessToken as string) || "";
  if (!token) return Response.json({ error: "Figma token not set" }, { status: 400 });

  try {
    // Get file structure to find frame node IDs
    const fileResp = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=2`, {
      headers: { "X-Figma-Token": token, "User-Agent": "Mozilla/5.0" },
    });
    const fileData = await fileResp.json();

    const page = fileData?.document?.children?.[0] || {};
    const frames = (page.children || []).filter((c: Record<string, unknown>) => c.type === "FRAME");
    if (!frames.length) return Response.json({ error: "No frames found in file" }, { status: 400 });

    const nodeIds = frames.map((f: Record<string, unknown>) => f.id).join(",");

    // Export as PNG
    const exportResp = await fetch(
      `https://api.figma.com/v1/images/${fileKey}?ids=${nodeIds}&format=png&scale=2`,
      { headers: { "X-Figma-Token": token, "User-Agent": "Mozilla/5.0" } },
    );
    const exportData = await exportResp.json();
    const images = exportData.images || {};

    if (!Object.keys(images).length) {
      return Response.json({ error: "Export returned no images" }, { status: 500 });
    }

    // Download each image and save locally
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

    const newUrls: string[] = [];
    const sortedEntries = Object.entries(images).sort(([a], [b]) => (a as string).localeCompare(b as string));

    for (const [, imgUrl] of sortedEntries) {
      if (!imgUrl) continue;
      const imgResp = await fetch(imgUrl as string, { headers: { "User-Agent": "Mozilla/5.0" } });
      const imgBuf = Buffer.from(await imgResp.arrayBuffer());
      const filename = `figma-${crypto.randomBytes(4).toString("hex")}.png`;
      fs.writeFileSync(path.join(IMAGES_DIR, filename), imgBuf);
      newUrls.push(`/images/${filename}`);
    }

    // Update queue post
    interface QueuePost {
      id: string;
      imageUrls?: string[];
      imageUrl?: string;
      [key: string]: unknown;
    }
    // 느린 figma fetch/download는 위에서 끝남 → 여기선 in-memory 갱신+write만 락 안에서.
    await mutateJson<{ version: number; posts: QueuePost[] }>(dataPath("queue.json"), (queue) => {
      for (const p of queue.posts) {
        if (p.id === postId) {
          p.imageUrls = newUrls;
          if (newUrls.length) p.imageUrl = newUrls[0];
          break;
        }
      }
      return queue;
    }, { version: 2, posts: [] });

    return Response.json({ ok: true, count: newUrls.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
  });
}
