import crypto from "crypto";
import { readJson, writeJson, dataPath } from "@/lib/file-io";

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
  engagement: null;
}

export async function POST(request: Request) {
  const data = await request.json();
  const text = (data.text || "").trim();

  if (!text) return Response.json({ error: "text required" }, { status: 400 });

  const queue = readJson<{ version: number; posts: QueuePost[] }>(dataPath("queue.json"))
    || { version: 2, posts: [] };

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
    engagement: null,
  };

  queue.posts.push(post);
  writeJson(dataPath("queue.json"), queue);
  return Response.json({ success: true, post });
}
