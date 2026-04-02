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
  url?: string;
  username?: string;
};

function parsePopularPosts(content: string): PopularPost[] {
  const posts: PopularPost[] = [];
  const blocks = content.split(/^---$/m).filter((b) => b.trim());
  for (const block of blocks) {
    if (block.trim().startsWith("#")) continue;
    const lines = block.trim().split("\n");
    const entry: Record<string, string> = {};
    let inText = false;
    const textLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith("#")) continue;
      if (line.startsWith("text:")) {
        inText = true;
        textLines.push(line.substring(5).trim());
      } else if (inText) {
        textLines.push(line);
      } else {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) entry[match[1]] = match[2];
      }
    }
    if (textLines.length) entry.text = textLines.join("\n").trim();
    if (entry.text) {
      posts.push({
        topic: entry.topic ?? "general",
        engagement: entry.engagement ?? "unknown",
        likes: Number(entry.likes) || 0,
        source: entry.source ?? "unknown",
        collected: entry.collected ?? "",
        text: entry.text,
        url: entry.url,
        username: entry.username,
      });
    }
  }
  return posts;
}

function formatPopularPost(post: PopularPost): string {
  let s = `---\ntopic: ${post.topic}\nengagement: ${post.engagement}\nlikes: ${post.likes}\nsource: ${post.source}\ncollected: ${post.collected}`;
  if (post.username) s += `\nusername: ${post.username}`;
  if (post.url) s += `\nurl: ${post.url}`;
  s += `\ntext: ${post.text}\n`;
  return s;
}

async function scrapeThreadsSearch(config: ReturnType<typeof resolveConfig>) {
  const { chromium } = await import("playwright-core");

  const keywordsRaw = await readTextFile(config.keywordsPath);
  const keywords = keywordsRaw.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (!keywords.length) {
    return jsonResult({ message: "No keywords found", newPosts: 0 });
  }

  const existingContent = await readTextFile(config.popularPostsPath);
  const existingPosts = parsePopularPosts(existingContent);
  const headerLines: string[] = [];
  for (const line of existingContent.split("\n")) {
    if (line.startsWith("#")) headerLines.push(line);
    else break;
  }
  const header = headerLines.length > 0 ? headerLines.join("\n") + "\n" : "";

  const chromePath = "/home/node/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome";
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: chromePath, args: ["--no-sandbox"] });
  } catch {
    return jsonResult({ message: "Browser launch failed. Chromium not available.", newPosts: 0 });
  }

  const newPosts: PopularPost[] = [];
  const seenTexts = new Set(existingPosts.map((p) => p.text.substring(0, 80)));
  // Fetch own username to skip own posts
  let ownUsername = "";
  try {
    const meResp = await fetch(`https://graph.threads.net/v1.0/${config.userId}?fields=username&access_token=${config.accessToken}`);
    if (meResp.ok) { const me = (await meResp.json()) as { username?: string }; ownUsername = me.username ?? ""; }
  } catch { /* ignore */ }

  const maxKeywords = Math.min(keywords.length, 5); // Limit to avoid too many browser sessions
  for (let ki = 0; ki < maxKeywords; ki++) {
    const keyword = keywords[ki];
    try {
      const page = await browser.newPage();
      const encoded = encodeURIComponent(keyword);
      await page.goto(`https://www.threads.net/search?q=${encoded}&serp_type=default`, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(6000);

      const posts = await page.evaluate(() => {
        const results: Array<{ username: string; url: string; text: string; likes: number; replies: number }> = [];
        const links = document.querySelectorAll('a[href*="/post/"]');
        const seen = new Set<string>();
        for (const link of links) {
          const href = link.getAttribute("href");
          if (!href || seen.has(href) || href.includes("/media")) continue;
          seen.add(href);
          const match = href.match(/@([^/]+)\/post\/([^/?]+)/);
          if (!match) continue;
          const container = link.closest("[data-pressable-container]") || link.parentElement?.parentElement?.parentElement?.parentElement;
          if (!container) continue;
          const spans = container.querySelectorAll("span");
          let text = "";
          for (const span of spans) {
            const t = span.textContent?.trim();
            if (t && t.length > 20 && t.length < 600 && !t.includes("Translate") && !t.includes("Log in")) { text = t; break; }
          }
          // Extract likes/replies from SVG icon siblings
          const svgs = container.querySelectorAll("svg");
          const metrics: number[] = [];
          for (const svg of svgs) {
            const next = svg.parentElement?.nextElementSibling || svg.nextElementSibling;
            if (next) { const n = parseInt(next.textContent?.trim() || ""); if (!isNaN(n)) metrics.push(n); }
          }
          if (text) results.push({ username: match[1], url: "https://www.threads.net" + href, text: text.substring(0, 500), likes: metrics[0] || 0, replies: metrics[1] || 0 });
        }
        return results;
      });

      for (const post of posts) {
        if (post.username === ownUsername) continue;
        if (koreanRatio(post.text) < 0.15) continue;
        if (post.likes < config.minLikes) continue;
        const prefix = post.text.substring(0, 80);
        if (seenTexts.has(prefix)) continue;
        seenTexts.add(prefix);
        newPosts.push({
          topic: keyword,
          engagement: `trending (${post.likes} likes, ${post.replies} replies)`,
          likes: post.likes,
          source: "external",
          collected: new Date().toISOString().split("T")[0],
          text: post.text,
          url: post.url,
          username: post.username,
        });
      }
      await page.close();
    } catch {
      // Skip failed keyword
    }
  }

  await browser.close();

  if (newPosts.length > 0) {
    const allPosts = [...existingPosts, ...newPosts].sort((a, b) => b.likes - a.likes);
    const trimmed = allPosts.slice(0, config.maxPopularPosts);
    const content = header + trimmed.map(formatPopularPost).join("");
    await fs.writeFile(config.popularPostsPath, content, "utf-8");
  }

  return jsonResult({
    message: `Browser scrape: ${maxKeywords} keywords → ${newPosts.length} new external posts collected`,
    newPosts: newPosts.length,
    keywords: maxKeywords,
    total: existingPosts.length + newPosts.length,
  });
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
    action: optionalStringEnum(["fetch", "scrape"] as const, {
      description: 'Action: "fetch" — search via API (own posts only). "scrape" — browser-based search for external trending posts by keywords.',
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
      const action = readStringParam(rawParams, "action") ?? "scrape";

      if (action === "scrape") {
        return await scrapeThreadsSearch(resolveConfig(api));
      }

      if (action !== "fetch") {
        throw new Error(`Unknown action: ${action}. Use "scrape" or "fetch".`);
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

      // Fetch own username to skip own posts
      let ownUsername = "";
      try {
        const meResp = await fetch(`${THREADS_API_BASE}/${config.userId}?fields=username&access_token=${config.accessToken}`);
        if (meResp.ok) {
          const me = (await meResp.json()) as { username?: string };
          ownUsername = me.username ?? "";
        }
      } catch { /* ignore */ }

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
            // Skip own posts
            if (item.username && item.username === ownUsername) continue;
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

            const postUrl = item.username ? `https://www.threads.net/@${item.username}/post/${item.id}` : "";
            newPosts.push({
              topic: keyword,
              engagement: `high (${likes} likes)`,
              likes,
              source: "external",
              collected: now.toISOString().split("T")[0],
              text: textOneLine,
              url: postUrl,
              username: item.username ?? "",
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
