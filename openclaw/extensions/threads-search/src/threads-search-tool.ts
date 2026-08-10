import fs from "node:fs/promises";
import path from "node:path";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

type SearchConfig = {
  accessToken?: string;
  userId?: string;
  keywordsPath?: string;
  popularPostsPath?: string;
  archivePath?: string;
  maxPopularPosts?: number;
  minLikes?: number;
  searchDays?: number;
};

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), "data");

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as SearchConfig;
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
  const keywordsPath =
    (typeof cfg.keywordsPath === "string" && cfg.keywordsPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "search-keywords.txt");
  const popularPostsPath =
    (typeof cfg.popularPostsPath === "string" && cfg.popularPostsPath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "popular-posts.txt");
  const archivePath =
    (typeof cfg.archivePath === "string" && cfg.archivePath.trim()) ||
    path.join(DEFAULT_DATA_DIR, "popular-posts-archive.txt");
  const maxPopularPosts =
    (typeof cfg.maxPopularPosts === "number" && cfg.maxPopularPosts) ||
    Number(process.env.MAX_POPULAR_POSTS) ||
    30;
  const minLikes =
    (typeof cfg.minLikes === "number" && cfg.minLikes) ||
    Number(process.env.MIN_LIKES) ||
    10;
  const searchDays =
    (typeof cfg.searchDays === "number" && cfg.searchDays) ||
    Number(process.env.SEARCH_DAYS) ||
    7;
  return { accessToken, userId, keywordsPath, popularPostsPath, archivePath, maxPopularPosts, minLikes, searchDays };
}

type PopularPost = {
  topic: string;
  engagement: string;
  likes: number;
  source: string;
  collected: string;
  text: string;
};

function parsePopularPosts(content: string): PopularPost[] {
  const posts: PopularPost[] = [];
  const blocks = content.split(/^---$/m).filter((b) => b.trim());
  for (const block of blocks) {
    if (block.trim().startsWith("#")) continue;
    const lines = block.trim().split("\n");
    const entry: Record<string, string> = {};
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        entry[match[1]] = match[2];
      }
    }
    if (entry.text) {
      posts.push({
        topic: entry.topic ?? "general",
        engagement: entry.engagement ?? "unknown",
        likes: Number(entry.likes) || 0,
        source: entry.source ?? "unknown",
        collected: entry.collected ?? "",
        text: entry.text,
      });
    }
  }
  return posts;
}

function formatPopularPost(post: PopularPost): string {
  return `---\ntopic: ${post.topic}\nengagement: ${post.engagement}\nlikes: ${post.likes}\nsource: ${post.source}\ncollected: ${post.collected}\ntext: ${post.text}\n`;
}

function koreanRatio(text: string): number {
  const stripped = text.replace(/\s/g, "");
  if (stripped.length === 0) return 0;
  const korean = (text.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g) || []).length;
  return korean / stripped.length;
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

const ThreadsSearchToolSchema = Type.Object(
  {
    action: optionalStringEnum(["fetch"] as const, {
      description: 'Action: "fetch" — search trending posts by keywords and update popular-posts.txt.',
    }),
  },
  { additionalProperties: false },
);

export function createThreadsSearchTool(api: OpenClawPluginApi) {
  return {
    name: "threads_search",
    label: "Threads Search",
    description:
      "Search trending posts on Threads using keywords from search-keywords.txt. Filters by likes, Korean ratio, and recency. Updates popular-posts.txt.",
    parameters: ThreadsSearchToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "fetch";
      if (action !== "fetch") {
        throw new Error(`Unknown action: ${action}. Use "fetch".`);
      }

      const config = resolveConfig(api);

      // Read keywords
      const keywordsRaw = await readTextFile(config.keywordsPath);
      const keywords = keywordsRaw
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));

      if (keywords.length === 0) {
        return jsonResult({ message: "No keywords found in search-keywords.txt", newPosts: 0 });
      }

      // Read existing popular posts
      const existingContent = await readTextFile(config.popularPostsPath);
      const existingPosts = parsePopularPosts(existingContent);

      // Extract header (comments at the top)
      const headerLines: string[] = [];
      for (const line of existingContent.split("\n")) {
        if (line.startsWith("#")) headerLines.push(line);
        else break;
      }
      const header = headerLines.length > 0 ? headerLines.join("\n") + "\n" : "";

      const now = new Date();
      const cutoffMs = config.searchDays * 24 * 60 * 60 * 1000;
      const seenIds = new Set<string>();
      const newPosts: PopularPost[] = [];

      for (const keyword of keywords) {
        try {
          const encoded = encodeURIComponent(keyword);
          const url = `${THREADS_API_BASE}/keyword_search?q=${encoded}&search_type=TOP&limit=25&fields=id,text,timestamp,like_count,username&access_token=${config.accessToken}`;
          const resp = await fetch(url);
          if (!resp.ok) continue;

          const data = (await resp.json()) as { data?: Array<{ id: string; text?: string; timestamp?: string; like_count?: number; username?: string }> };
          if (!data.data) continue;

          for (const item of data.data) {
            // Skip duplicates
            if (seenIds.has(item.id)) continue;
            seenIds.add(item.id);
            // Skip low engagement
            const likes = item.like_count ?? 0;
            if (likes < config.minLikes) continue;
            // Skip non-Korean
            if (!item.text || koreanRatio(item.text) < 0.2) continue;
            // Skip old posts
            if (item.timestamp) {
              const postAge = now.getTime() - new Date(item.timestamp).getTime();
              if (postAge > cutoffMs) continue;
            }
            // Skip duplicates by text prefix
            const textOneLine = item.text.replace(/\n/g, " ");
            const prefix = textOneLine.substring(0, 100);
            const isDupe = existingPosts.some((p) => p.text.substring(0, 100) === prefix) ||
              newPosts.some((p) => p.text.substring(0, 100) === prefix);
            if (isDupe) continue;

            newPosts.push({
              topic: keyword,
              engagement: `high (${likes} likes)`,
              likes,
              source: "external",
              collected: now.toISOString().split("T")[0],
              text: textOneLine,
            });
          }
        } catch {
          // Skip failed keyword searches
        }
      }

      // Merge and sort all posts by likes descending
      const allPosts = [...existingPosts, ...newPosts].sort((a, b) => b.likes - a.likes);

      // Split into main and archive
      const mainPosts = allPosts.slice(0, config.maxPopularPosts);
      const overflowPosts = allPosts.slice(config.maxPopularPosts);

      // Write main file
      const mainContent = header + "\n" + mainPosts.map(formatPopularPost).join("\n");
      await writeTextFile(config.popularPostsPath, mainContent);

      // Append overflow to archive
      if (overflowPosts.length > 0) {
        let archiveContent = await readTextFile(config.archivePath);
        archiveContent += "\n" + overflowPosts.map(formatPopularPost).join("\n");
        await writeTextFile(config.archivePath, archiveContent);
      }

      return jsonResult({
        message: `Done: popular-posts.txt now has ${mainPosts.length} posts (${newPosts.length} new)`,
        totalPosts: mainPosts.length,
        newPosts: newPosts.length,
        archived: overflowPosts.length,
        keywordsSearched: keywords.length,
      });
    },
  };
}
