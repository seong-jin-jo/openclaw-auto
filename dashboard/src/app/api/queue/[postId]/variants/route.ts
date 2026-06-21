import { execFile } from "child_process";
import { promisify } from "util";
import crypto from "crypto";
import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

// 소스 큐 포스트(특히 비디오 클립)의 텍스트만 N개로 변형해 같은 영상으로 큐에 추가.
// "이 영상으로 5개 텍스트 변형" — 영상 1개를 여러 캡션으로 OSMU 재활용하는 흐름.
// claude -p 로 캡션 변형 생성(sourcing 패턴 재사용). 실패 시 502.

const execFileP = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const MAX_VARIANTS = 5;

interface QueuePost {
  id: string;
  text: string;
  topic?: string;
  hashtags?: string[];
  videoFilename?: string | null;
  videoUrl?: string | null;
  videoThumbnail?: string | null;
  [k: string]: unknown;
}

function buildPrompt(text: string, count: number): string {
  return `너는 숏폼 카피라이터다. 아래 원본 캡션을 같은 영상에 쓸 ${count}개의 서로 다른 버전으로 다시 써라.
규칙: 100% 한국어, 각 버전은 훅(첫 문장)과 어조를 다르게(궁금증형/공감형/단언형 등), 사실 왜곡 금지, 길이는 원본과 비슷하게.
출력은 JSON 배열만(설명·코드펜스 없이): ["버전1", "버전2", ...]

원본 캡션:
"""
${text}
"""`;
}

async function generateVariants(text: string, count: number): Promise<string[]> {
  const { stdout } = await execFileP(CLAUDE_BIN, ["-p", buildPrompt(text, count)], {
    timeout: 120000,
    maxBuffer: 8 * 1024 * 1024,
  });
  const m = stdout.match(/\[[\s\S]*\]/);
  if (!m) return [];
  try {
    const arr = JSON.parse(m[0]) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x).trim()).filter(Boolean).slice(0, count);
  } catch {
    return [];
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
    const { postId } = await params;
    const body = await request.json().catch(() => ({}));
    const count = Math.min(MAX_VARIANTS, Math.max(1, Number(body.count) || 3));

    const queue = readJson<{ version: number; posts: QueuePost[] }>(dataPath("queue.json"));
    if (!queue) return Response.json({ error: "queue.json not found" }, { status: 404 });
    const src = queue.posts.find((p) => p.id === postId);
    if (!src) return Response.json({ error: "post not found" }, { status: 404 });

    const baseText = (src.text || "").trim();
    if (!baseText) return Response.json({ error: "source post has no text" }, { status: 400 });

    let variants: string[];
    try {
      variants = await generateVariants(baseText, count);
    } catch (e) {
      return Response.json({ error: `변형 생성 실패: ${(e as Error).message.slice(0, 160)}` }, { status: 502 });
    }
    if (variants.length === 0) return Response.json({ error: "변형 후보 0개" }, { status: 502 });

    const now = new Date().toISOString().replace(/\.\d+Z$/, "");
    for (const text of variants) {
      queue.posts.push({
        id: crypto.randomUUID(),
        text,
        originalText: null,
        topic: src.topic || "video-variant",
        hashtags: src.hashtags || [],
        status: "draft",
        generatedAt: now,
        approvedAt: null,
        scheduledAt: null,
        publishedAt: null,
        threadsMediaId: null,
        error: null,
        abVariant: "A",
        model: "variant",
        imageUrl: null,
        imageUrls: null,
        cardBatchId: null,
        videoFilename: src.videoFilename || null,
        videoUrl: src.videoUrl || null,
        videoThumbnail: src.videoThumbnail || null,
        engagement: null,
      } as QueuePost);
    }
    writeJson(dataPath("queue.json"), queue);
    return Response.json({ ok: true, created: variants.length });
  });
}
