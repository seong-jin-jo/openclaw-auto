import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

type BlogPost = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  status: "draft" | "approved" | "published" | "failed";
  sourceThreadsId: string | null;
  sourceTopic: string;
  seoKeyword: string;
  generatedAt: string;
  approvedAt: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  blogPostId: string | null;
  blogPostUrl: string | null;
  error: string | null;
  model: string | null;
};

type BlogQueueData = {
  version: number;
  posts: BlogPost[];
};

type BlogQueueConfig = {
  queuePath?: string;
};

const DEFAULT_QUEUE_DIR = path.resolve(process.cwd(), "data");
const DEFAULT_QUEUE_PATH = path.join(DEFAULT_QUEUE_DIR, "blog-queue.json");

function resolveQueuePath(api: OpenClawPluginApi): string {
  const pluginCfg = (api.pluginConfig ?? {}) as BlogQueueConfig;
  return (
    (typeof pluginCfg.queuePath === "string" && pluginCfg.queuePath.trim()) ||
    process.env.BLOG_QUEUE_PATH ||
    DEFAULT_QUEUE_PATH
  );
}

async function readQueue(queuePath: string): Promise<BlogQueueData> {
  try {
    const raw = await fs.readFile(queuePath, "utf-8");
    return JSON.parse(raw) as BlogQueueData;
  } catch {
    return { version: 1, posts: [] };
  }
}

async function writeQueue(queuePath: string, data: BlogQueueData): Promise<void> {
  await fs.mkdir(path.dirname(queuePath), { recursive: true });
  const tmp = `${queuePath}.${process.pid}.${crypto.randomBytes(8).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, queuePath);
}

const BlogQueueToolSchema = Type.Object(
  {
    action: optionalStringEnum(
      ["list", "add", "update", "delete", "get_approved"] as const,
      {
        description:
          'Action: "list" (all posts), "add" (new draft), "update" (modify post), "delete" (remove post), "get_approved" (posts ready to publish).',
      },
    ),
    id: Type.Optional(Type.String({ description: "Post ID (for update/delete)." })),
    title: Type.Optional(Type.String({ description: "Blog post title (for add)." })),
    content: Type.Optional(
      Type.String({ description: "Blog post HTML content (for add)." }),
    ),
    tags: Type.Optional(
      Type.Array(Type.String(), { description: "Blog tags (for add)." }),
    ),
    category: Type.Optional(Type.String({ description: "Blog category (for add)." })),
    sourceThreadsId: Type.Optional(
      Type.String({ description: "Source Threads post ID (for add, to track origin)." }),
    ),
    sourceTopic: Type.Optional(
      Type.String({ description: "Source topic from Threads post (for add)." }),
    ),
    seoKeyword: Type.Optional(
      Type.String({ description: "Primary SEO keyword for this post (for add)." }),
    ),
    status: Type.Optional(
      Type.String({ description: "New status (for update): draft, approved, failed." }),
    ),
    scheduledAt: Type.Optional(Type.String({ description: "Scheduled publish time ISO (for update)." })),
    blogPostId: Type.Optional(Type.String({ description: "Naver blog post ID (for update after publish)." })),
    blogPostUrl: Type.Optional(Type.String({ description: "Naver blog post URL (for update after publish)." })),
    error: Type.Optional(Type.String({ description: "Error message (for update on failure)." })),
    model: Type.Optional(Type.String({ description: "LLM model name used for generation." })),
    statusFilter: optionalStringEnum(
      ["draft", "approved", "published", "failed"] as const,
      { description: "Filter by status (for list)." },
    ),
    limit: Type.Optional(
      Type.Number({ description: "Max posts to return for get_approved (default: 1)." }),
    ),
  },
  { additionalProperties: false },
);

export function createBlogQueueTool(api: OpenClawPluginApi) {
  return {
    name: "blog_queue",
    label: "Blog Queue",
    description:
      "Manage the blog content queue. List, add, update, delete posts, or get approved posts ready for publishing to Naver Blog.",
    parameters: BlogQueueToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      const queuePath = resolveQueuePath(api);
      const queue = await readQueue(queuePath);

      switch (action) {
        case "list": {
          const statusFilter = readStringParam(rawParams, "statusFilter");
          let posts = queue.posts;
          if (statusFilter) {
            posts = posts.filter((p) => p.status === statusFilter);
          }
          return jsonResult({ total: posts.length, posts });
        }

        case "add": {
          const title = readStringParam(rawParams, "title", { required: true });
          const content = readStringParam(rawParams, "content", { required: true });
          const tagsParam = rawParams.tags;
          const tags = Array.isArray(tagsParam) ? tagsParam.map(String) : [];
          const category = readStringParam(rawParams, "category") ?? "";
          const sourceThreadsId = readStringParam(rawParams, "sourceThreadsId") ?? null;
          const sourceTopic = readStringParam(rawParams, "sourceTopic") ?? "";
          const seoKeyword = readStringParam(rawParams, "seoKeyword") ?? "";
          const model = readStringParam(rawParams, "model") ?? null;

          const post: BlogPost = {
            id: crypto.randomUUID(),
            title,
            content,
            tags,
            category,
            status: "draft",
            sourceThreadsId,
            sourceTopic,
            seoKeyword,
            generatedAt: new Date().toISOString(),
            approvedAt: null,
            scheduledAt: null,
            publishedAt: null,
            blogPostId: null,
            blogPostUrl: null,
            error: null,
            model,
          };

          queue.posts.push(post);
          await writeQueue(queuePath, queue);
          return jsonResult({ success: true, post });
        }

        case "update": {
          const id = readStringParam(rawParams, "id", { required: true });
          for (const post of queue.posts) {
            if (post.id === id) {
              const newStatus = readStringParam(rawParams, "status");
              if (newStatus && ["draft", "approved", "published", "failed"].includes(newStatus)) {
                post.status = newStatus as BlogPost["status"];
                if (newStatus === "approved") {
                  post.approvedAt = new Date().toISOString();
                }
                if (newStatus === "published") {
                  post.publishedAt = new Date().toISOString();
                }
              }
              const title = readStringParam(rawParams, "title");
              if (title) post.title = title;
              const content = readStringParam(rawParams, "content");
              if (content) post.content = content;
              const scheduledAt = readStringParam(rawParams, "scheduledAt");
              if (scheduledAt) post.scheduledAt = scheduledAt;
              const blogPostId = readStringParam(rawParams, "blogPostId");
              if (blogPostId) post.blogPostId = blogPostId;
              const blogPostUrl = readStringParam(rawParams, "blogPostUrl");
              if (blogPostUrl) post.blogPostUrl = blogPostUrl;
              const error = readStringParam(rawParams, "error");
              if (error) post.error = error;

              await writeQueue(queuePath, queue);
              return jsonResult({ success: true, post });
            }
          }
          throw new Error(`Post not found: ${id}`);
        }

        case "delete": {
          const id = readStringParam(rawParams, "id", { required: true });
          const before = queue.posts.length;
          queue.posts = queue.posts.filter((p) => p.id !== id);
          if (queue.posts.length === before) {
            throw new Error(`Post not found: ${id}`);
          }
          await writeQueue(queuePath, queue);
          return jsonResult({ success: true, deleted: id });
        }

        case "get_approved": {
          const now = new Date();
          const limitParam = rawParams.limit;
          const limit = typeof limitParam === "number" && limitParam > 0 ? limitParam : 1;
          const ready = queue.posts
            .filter(
              (p) =>
                p.status === "approved" &&
                p.scheduledAt &&
                new Date(p.scheduledAt) <= now,
            )
            .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
            .slice(0, limit);
          return jsonResult({ total: ready.length, posts: ready });
        }

        default:
          throw new Error(`Unknown action: ${action}. Use list, add, update, delete, or get_approved.`);
      }
    },
  };
}
