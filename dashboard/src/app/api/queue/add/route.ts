import crypto from "crypto";
import { mutateJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

interface QueuePost {
  id: string;
  text: string;
  originalText: null;
  topic: string;
  hashtags: string[];
  status: string;
  generatedAt: string;
  approvedAt: null;
  scheduledAt: null;
  publishedAt: null;
  threadsMediaId: null;
  error: null;
  abVariant: string;
  model: string;
  imageUrl: string | null;
  imageUrls?: string[] | null;
  cardBatchId?: string | null;
  videoFilename?: string | null;
  videoUrl?: string | null;
  videoThumbnail?: string | null;
  engagement: null;
}

export async function POST(request: Request) {
  // 테넌트별 파일 격리 컨텍스트로 래핑
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const data = await request.json();
    const text = (data.text || "").trim();

    if (!text) return Response.json({ error: "text required" }, { status: 400 });

    const imageUrls: string[] | null = data.imageUrls || null;

    const post: QueuePost = {
      id: crypto.randomUUID(),
      text,
      originalText: null,
      topic: data.topic || "general",
      hashtags: data.hashtags || [],
      status: "draft",
      generatedAt: new Date().toISOString().replace(/\.\d+Z$/, ""),
      approvedAt: null,
      scheduledAt: null,
      publishedAt: null,
      threadsMediaId: null,
      error: null,
      abVariant: "A",
      model: "manual",
      imageUrl: data.imageUrl || (imageUrls ? imageUrls[0] : null) || null,
      imageUrls,
      cardBatchId: data.cardBatchId || null,
      videoFilename: data.videoFilename || null,
      videoUrl: data.videoUrl || null,
      videoThumbnail: data.videoThumbnail || null,
      engagement: null,
    };

    await mutateJson<{ version: number; posts: QueuePost[] }>(
      dataPath("queue.json"),
      (queue) => { queue.posts.push(post); return queue; },
      { version: 2, posts: [] },
    );
    return Response.json({ success: true, post });
  });
}
