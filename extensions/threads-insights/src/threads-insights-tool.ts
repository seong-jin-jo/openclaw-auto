import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

type InsightsConfig = {
  accessToken?: string;
  userId?: string;
  queuePath?: string;
  stylePath?: string;
  popularPostsPath?: string;
  viralThreshold?: number;
};

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
  status: string;
  generatedAt: string;
  approvedAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  threadsMediaId: string | null;
  error: string | null;
  abVariant: string;
  model: string | null;
  engagement: Engagement | null;
};

type QueueData = {
  version: number;
  posts: Post[];
};

type StyleEntry = {
  original: string;
  edited: string;
  editType: string;
  timestamp: string;
};

type StyleData = {
  version: number;
  entries: StyleEntry[];
};

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as InsightsConfig;
  const accessToken =
    (typeof cfg.accessToken === "string" && cfg.accessToken.trim()) ||
    process.env.THREADS_ACCESS_TOKEN ||
    "";
  const userId =
    (typeof cfg.userId === "string" && cfg.userId.trim()) ||
    process.env.THREADS_USER_ID ||
    "";
  if (!accessToken) {
    throw new Error("Threads access token not configured. Set THREADS_ACCESS_TOKEN env var or configure in plugin settings.");
  }
  if (!userId) {
    throw new Error("Threads user ID not configured. Set THREADS_USER_ID env var or configure in plugin settings.");
  }
  const queuePath =
    (typeof cfg.queuePath === "string" && cfg.queuePath.trim()) ||
    process.env.THREADS_QUEUE_PATH ||
    path.join(DEFAULT_DATA_DIR, "queue.json");
  const stylePath =
    (typeof cfg.stylePath === "string" && cfg.stylePath.trim()) ||
    process.env.THREADS_STYLE_PATH ||
    path.join(DEFAULT_DATA_DIR, "style-data.json");
  const popularPostsPath =
    (typeof cfg.popularPostsPath === "string" && cfg.popularPostsPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "popular-posts.txt");
  const viralThreshold =
    (typeof cfg.viralThreshold === "number" && cfg.viralThreshold) ||
    Number(process.env.VIRAL_THRESHOLD) ||
    500;
  return { accessToken, userId, queuePath, stylePath, popularPostsPath, viralThreshold };
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function readTextFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function writeTextFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}

function extractMetricValue(data: { data?: Array<{ name: string; values?: Array<{ value: number }>; total_value?: { value: number } }> }, metric: string): number {
  const entry = data.data?.find((d) => d.name === metric);
  if (!entry) return 0;
  if (entry.total_value?.value !== undefined) return entry.total_value.value;
  if (entry.values && entry.values.length > 0) return entry.values[entry.values.length - 1].value;
  return 0;
}

const ThreadsInsightsToolSchema = Type.Object(
  {
    action: optionalStringEnum(["collect", "auto_like_replies", "cleanup_low_engagement"] as const, {
      description: 'Action: "collect" — collect engagement metrics, detect viral, auto-feed. "auto_like_replies" — like all replies on published posts. "cleanup_low_engagement" — delete posts with low engagement after 3 days.',
    }),
    minViews: Type.Optional(
      Type.Number({ description: "Min views threshold for cleanup (default: 100)." }),
    ),
    minLikes: Type.Optional(
      Type.Number({ description: "Min likes threshold for cleanup (default: 3)." }),
    ),
  },
  { additionalProperties: false },
);

type ResolvedConfig = ReturnType<typeof resolveConfig>;

async function autoLikeReplies(config: ResolvedConfig) {
  const queue = await readJson<QueueData>(config.queuePath, { version: 1, posts: [] });
  const published = queue.posts.filter((p) => p.status === "published" && p.threadsMediaId);

  let liked = 0;
  let errors = 0;

  for (const post of published) {
    try {
      // Get replies
      const repliesUrl = `${THREADS_API_BASE}/${post.threadsMediaId}/replies?fields=id&access_token=${config.accessToken}`;
      const repliesResp = await fetch(repliesUrl);
      if (!repliesResp.ok) continue;
      const repliesData = await repliesResp.json() as { data?: Array<{ id: string }> };
      const replies = repliesData.data ?? [];

      for (const reply of replies) {
        try {
          const likeUrl = `${THREADS_API_BASE}/${reply.id}/likes`;
          const likeResp = await fetch(likeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: config.accessToken }),
          });
          if (likeResp.ok) liked++;
        } catch {
          errors++;
        }
      }
    } catch {
      errors++;
    }
  }

  return jsonResult({ message: `Liked ${liked} replies (${errors} errors)`, liked, errors });
}

async function cleanupLowEngagement(config: ResolvedConfig, minViews: number, minLikes: number) {
  const queue = await readJson<QueueData>(config.queuePath, { version: 1, posts: [] });
  const now = new Date();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  const toDelete = queue.posts.filter((p) => {
    if (p.status !== "published" || !p.threadsMediaId || !p.publishedAt) return false;
    const age = now.getTime() - new Date(p.publishedAt).getTime();
    if (age < THREE_DAYS_MS) return false;
    if (!p.engagement) return false;
    return p.engagement.views < minViews && p.engagement.likes < minLikes;
  });

  let deleted = 0;
  let errors = 0;

  for (const post of toDelete) {
    try {
      const deleteUrl = `${THREADS_API_BASE}/${post.threadsMediaId}?access_token=${config.accessToken}`;
      const resp = await fetch(deleteUrl, { method: "DELETE" });
      if (resp.ok) {
        post.status = "failed";
        post.error = `Auto-deleted: low engagement (views=${post.engagement!.views}, likes=${post.engagement!.likes})`;
        deleted++;
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  if (deleted > 0) {
    await writeJson(config.queuePath, queue);
  }

  return jsonResult({
    message: `Deleted ${deleted} low-engagement posts (${errors} errors)`,
    deleted,
    errors,
    candidates: toDelete.length,
  });
}

export function createThreadsInsightsTool(api: OpenClawPluginApi) {
  return {
    name: "threads_insights",
    label: "Threads Insights",
    description:
      "Collect engagement metrics, auto-like replies, and cleanup low-engagement posts. Actions: collect, auto_like_replies, cleanup_low_engagement.",
    parameters: ThreadsInsightsToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "collect";

      if (action === "auto_like_replies") {
        return await autoLikeReplies(resolveConfig(api));
      }

      if (action === "cleanup_low_engagement") {
        const minViews = typeof rawParams.minViews === "number" ? rawParams.minViews : 100;
        const minLikes = typeof rawParams.minLikes === "number" ? rawParams.minLikes : 3;
        return await cleanupLowEngagement(resolveConfig(api), minViews, minLikes);
      }

      if (action !== "collect") {
        throw new Error(`Unknown action: ${action}. Use "collect", "auto_like_replies", or "cleanup_low_engagement".`);
      }

      const config = resolveConfig(api);
      const queue = await readJson<QueueData>(config.queuePath, { version: 1, posts: [] });

      // Filter posts needing collection
      const now = new Date();
      const DAY_MS = 24 * 60 * 60 * 1000;
      const targets = queue.posts.filter((p) => {
        if (p.status !== "published" || !p.threadsMediaId) return false;
        if (!p.engagement) return true;
        const elapsed = now.getTime() - new Date(p.engagement.collectedAt).getTime();
        return elapsed >= DAY_MS && p.engagement.collectCount < 3;
      });

      if (targets.length === 0) {
        return jsonResult({ message: "No posts to collect", collected: 0, viral: 0, errors: 0 });
      }

      let collected = 0;
      let viral = 0;
      let errors = 0;
      const viralPosts: Post[] = [];

      for (const post of targets) {
        try {
          const url = `${THREADS_API_BASE}/${post.threadsMediaId}/insights?metric=views,likes,replies,reposts,quotes&access_token=${config.accessToken}`;
          const resp = await fetch(url);
          if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`API error (${resp.status}): ${errText}`);
          }
          const data = await resp.json();

          const views = extractMetricValue(data, "views");
          const likes = extractMetricValue(data, "likes");
          const replies = extractMetricValue(data, "replies");
          const reposts = extractMetricValue(data, "reposts");
          const quotes = extractMetricValue(data, "quotes");

          const prevFedToPopular = post.engagement?.fedToPopular ?? false;
          const prevFedToStyle = post.engagement?.fedToStyle ?? false;
          const prevCollectCount = post.engagement?.collectCount ?? 0;

          post.engagement = {
            views,
            likes,
            replies,
            reposts,
            quotes,
            collectedAt: now.toISOString(),
            collectCount: prevCollectCount + 1,
            fedToPopular: prevFedToPopular,
            fedToStyle: prevFedToStyle,
          };

          collected++;

          if (views >= config.viralThreshold) {
            viral++;
            viralPosts.push(post);
          }
        } catch (err) {
          errors++;
        }
      }

      // Feed viral posts to popular-posts.txt and style-data.json
      if (viralPosts.length > 0) {
        let popularContent = await readTextFile(config.popularPostsPath);
        const styleData = await readJson<StyleData>(config.stylePath, { version: 1, entries: [] });

        for (const post of viralPosts) {
          // Feed to popular-posts.txt
          if (!post.engagement!.fedToPopular) {
            const textOneLine = post.text.replace(/\n/g, " ");
            if (!popularContent.includes(textOneLine.substring(0, 100))) {
              const entry = `\n---\ntopic: ${post.topic}\nengagement: viral (${post.engagement!.views} views, ${post.engagement!.likes} likes)\nlikes: ${post.engagement!.likes}\nsource: own-viral\ncollected: ${now.toISOString().split("T")[0]}\ntext: ${textOneLine}\n`;
              popularContent += entry;
              post.engagement!.fedToPopular = true;
            }
          }

          // Feed to style-data.json
          if (!post.engagement!.fedToStyle) {
            const editedText = post.text;
            const alreadyExists = styleData.entries.some((e) => e.edited === editedText);
            if (!alreadyExists) {
              const entry: StyleEntry = {
                original: post.originalText ?? post.text,
                edited: post.text,
                editType: post.originalText ? "style_rewrite" : "viral_pattern",
                timestamp: now.toISOString(),
              };
              styleData.entries.push(entry);
              post.engagement!.fedToStyle = true;
            }
          }
        }

        await writeTextFile(config.popularPostsPath, popularContent);
        await writeJson(config.stylePath, styleData);
      }

      // Save updated queue
      await writeJson(config.queuePath, queue);

      return jsonResult({
        message: `Done: collected=${collected}, viral=${viral}, errors=${errors}`,
        collected,
        viral,
        errors,
        targets: targets.length,
      });
    },
  };
}
