import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

type Engagement = {
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  collectedAt: string;
  collectCount: number;
  fedToPopular: boolean;
  fedToStyle: boolean;
};

type Post = {
  id: string;
  text: string;
  originalText: string | null;
  topic: string;
  hashtags: string[];
  status: "draft" | "approved" | "published" | "failed";
  generatedAt: string;
  approvedAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  threadsMediaId: string | null;
  error: string | null;
  abVariant: string;
  model: string | null;
  imageUrl: string | null;
  engagement: Engagement | null;
};

type QueueData = {
  version: number;
  posts: Post[];
};

type QueueConfig = {
  queuePath?: string;
};

const DEFAULT_QUEUE_DIR = path.resolve(process.cwd(), "data");
const DEFAULT_QUEUE_PATH = path.join(DEFAULT_QUEUE_DIR, "queue.json");

function resolveQueuePath(api: OpenClawPluginApi): string {
  const pluginCfg = (api.pluginConfig ?? {}) as QueueConfig;
  return (
    (typeof pluginCfg.queuePath === "string" && pluginCfg.queuePath.trim()) ||
    process.env.THREADS_QUEUE_PATH ||
    DEFAULT_QUEUE_PATH
  );
}

async function readQueue(queuePath: string): Promise<QueueData> {
  try {
    const raw = await fs.readFile(queuePath, "utf-8");
    return JSON.parse(raw) as QueueData;
  } catch {
    return { version: 1, posts: [] };
  }
}

async function writeQueue(queuePath: string, data: QueueData): Promise<void> {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  const tmpPath = queuePath + `.tmp.${process.pid}`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmpPath, queuePath);
}

const ThreadsQueueToolSchema = Type.Object(
  {
    action: optionalStringEnum(
      ["list", "add", "update", "delete", "get_approved", "cleanup"] as const,
      {
        description:
          'Action to perform: "list" (all posts), "add" (new draft), "update" (modify post), "delete" (remove post), "get_approved" (get approved posts ready to publish), "cleanup" (remove old published/failed posts).',
      },
    ),
    id: Type.Optional(
      Type.String({ description: "Post ID for update/delete actions." }),
    ),
    text: Type.Optional(
      Type.String({ description: "Post text content (for add/update)." }),
    ),
    topic: Type.Optional(
      Type.String({ description: "Post topic (for add)." }),
    ),
    hashtags: Type.Optional(
      Type.Array(Type.String(), { description: "Hashtags (for add)." }),
    ),
    status: optionalStringEnum(
      ["draft", "approved", "published", "failed"] as const,
      { description: "New status (for update)." },
    ),
    scheduledAt: Type.Optional(
      Type.String({ description: "ISO datetime for scheduled publishing (for update)." }),
    ),
    threadsMediaId: Type.Optional(
      Type.String({ description: "Threads media ID after publishing (for update)." }),
    ),
    error: Type.Optional(
      Type.String({ description: "Error message (for update on failure)." }),
    ),
    abVariant: Type.Optional(
      Type.String({ description: 'A/B test variant label (for add). Default: "A".' }),
    ),
    model: Type.Optional(
      Type.String({ description: 'Model used to generate this post (e.g. "gemini-2.5-flash", "llama3.1:8b"). For add action.' }),
    ),
    imageUrl: Type.Optional(
      Type.String({ description: "Public image URL to attach to the post (for add/update)." }),
    ),
    statusFilter: optionalStringEnum(
      ["draft", "approved", "published", "failed"] as const,
      { description: "Filter by status (for list)." },
    ),
  },
  { additionalProperties: false },
);

export function createThreadsQueueTool(api: OpenClawPluginApi) {
  return {
    name: "threads_queue",
    label: "Threads Queue",
    description:
      "Manage the Threads content queue. List, add, update, or delete posts. Get approved posts ready for publishing.",
    parameters: ThreadsQueueToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      const queuePath = resolveQueuePath(api);
      const queue = await readQueue(queuePath);

      switch (action) {
        case "list": {
          const statusFilter = readStringParam(rawParams, "statusFilter");
          const filtered = statusFilter
            ? queue.posts.filter((p) => p.status === statusFilter)
            : queue.posts;
          return jsonResult({
            total: filtered.length,
            posts: filtered.map((p, i) => ({
              index: i + 1,
              ...p,
            })),
          });
        }

        case "add": {
          const text = readStringParam(rawParams, "text", { required: true });
          const topic = readStringParam(rawParams, "topic") ?? "general";
          let hashtags = Array.isArray(rawParams.hashtags)
            ? (rawParams.hashtags as string[]).filter((h) => typeof h === "string")
            : [];
          const abVariant = readStringParam(rawParams, "abVariant") ?? "A";
          const model = readStringParam(rawParams, "model") ?? null;
          const imageUrl = readStringParam(rawParams, "imageUrl") ?? null;

          // Validate text length
          if (text.length > 500) {
            return jsonResult({ success: false, reason: "500자 초과" });
          }

          // Validate Korean ratio: count Korean characters (Hangul syllables + Jamo)
          const koreanChars = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
          const totalChars = text.replace(/\s/g, "").length;
          if (totalChars > 0 && koreanChars / totalChars < 0.3) {
            return jsonResult({ success: false, reason: "한국어 비율 부족" });
          }

          const post: Post = {
            id: crypto.randomUUID(),
            text,
            originalText: null,
            topic,
            hashtags,
            status: "draft",
            generatedAt: new Date().toISOString(),
            approvedAt: null,
            scheduledAt: null,
            publishedAt: null,
            threadsMediaId: null,
            error: null,
            abVariant,
            model,
            imageUrl,
            engagement: null,
          };

          queue.posts.push(post);
          await writeQueue(queuePath, queue);
          return jsonResult({ success: true, post });
        }

        case "update": {
          const id = readStringParam(rawParams, "id", { required: true });
          const post = queue.posts.find((p) => p.id === id);
          if (!post) {
            throw new Error(`Post not found: ${id}`);
          }

          const newText = readStringParam(rawParams, "text");
          if (newText && newText !== post.text) {
            if (!post.originalText) {
              post.originalText = post.text;
            }
            post.text = newText;
          }

          const newStatus = readStringParam(rawParams, "status") as Post["status"] | undefined;
          if (newStatus) {
            post.status = newStatus;
            if (newStatus === "approved") {
              post.approvedAt = new Date().toISOString();
            } else if (newStatus === "published") {
              post.publishedAt = new Date().toISOString();
            }
          }

          const scheduledAt = readStringParam(rawParams, "scheduledAt");
          if (scheduledAt) {
            post.scheduledAt = scheduledAt;
          }

          const threadsMediaId = readStringParam(rawParams, "threadsMediaId");
          if (threadsMediaId) {
            post.threadsMediaId = threadsMediaId;
          }

          const error = readStringParam(rawParams, "error");
          if (error !== undefined) {
            post.error = error ?? null;
          }

          const newImageUrl = readStringParam(rawParams, "imageUrl");
          if (newImageUrl !== undefined) {
            post.imageUrl = newImageUrl ?? null;
          }

          await writeQueue(queuePath, queue);
          return jsonResult({ success: true, post });
        }

        case "delete": {
          const id = readStringParam(rawParams, "id", { required: true });
          const idx = queue.posts.findIndex((p) => p.id === id);
          if (idx === -1) {
            throw new Error(`Post not found: ${id}`);
          }
          const removed = queue.posts.splice(idx, 1)[0];
          await writeQueue(queuePath, queue);
          return jsonResult({ success: true, removed });
        }

        case "get_approved": {
          const now = new Date();
          const ready = queue.posts.filter(
            (p) =>
              p.status === "approved" &&
              p.scheduledAt &&
              new Date(p.scheduledAt) <= now,
          );
          return jsonResult({
            total: ready.length,
            posts: ready,
          });
        }

        case "cleanup": {
          const now = new Date();
          const PUBLISHED_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
          const FAILED_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
          const details: { id: string; status: string; age: string }[] = [];

          queue.posts = queue.posts.filter((p) => {
            if (p.status === "published" && p.publishedAt) {
              const age = now.getTime() - new Date(p.publishedAt).getTime();
              if (age > PUBLISHED_MAX_AGE_MS) {
                details.push({ id: p.id, status: "published", age: `${Math.floor(age / 86400000)}d` });
                return false;
              }
            }
            if (p.status === "failed" && p.generatedAt) {
              const age = now.getTime() - new Date(p.generatedAt).getTime();
              if (age > FAILED_MAX_AGE_MS) {
                details.push({ id: p.id, status: "failed", age: `${Math.floor(age / 86400000)}d` });
                return false;
              }
            }
            return true;
          });

          await writeQueue(queuePath, queue);
          return jsonResult({ removed: details.length, details });
        }

        default:
          throw new Error(
            `Unknown action: ${action}. Use list, add, update, delete, get_approved, or cleanup.`,
          );
      }
    },
  };
}
