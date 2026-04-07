import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { stat } from "node:fs/promises";

type SampleBlogConfig = {
  apiBaseUrl?: string;
  email?: string;
  password?: string;
};

function resolveConfig(api: OpenClawPluginApi): { apiBaseUrl: string; email: string; password: string } {
  const pluginCfg = (api.pluginConfig ?? {}) as SampleBlogConfig;
  const apiBaseUrl =
    (typeof pluginCfg.apiBaseUrl === "string" && pluginCfg.apiBaseUrl.trim()) ||
    process.env.SAMPLE_API_BASE_URL ||
    "";
  const email =
    (typeof pluginCfg.email === "string" && pluginCfg.email.trim()) ||
    process.env.SAMPLE_ADMIN_EMAIL ||
    "";
  const password =
    (typeof pluginCfg.password === "string" && pluginCfg.password.trim()) ||
    process.env.SAMPLE_ADMIN_PASSWORD ||
    "";
  if (!apiBaseUrl) throw new Error("Sample API base URL not configured. Set via dashboard Blog Settings or SAMPLE_API_BASE_URL env var.");
  if (!email || !password) throw new Error("Sample admin credentials not configured. Set via dashboard Blog Settings or SAMPLE_ADMIN_EMAIL/SAMPLE_ADMIN_PASSWORD env vars.");
  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ""), email, password };
}

/** Login and return authorization cookie value */
async function login(apiBaseUrl: string, email: string, password: string): Promise<string> {
  const resp = await fetch(`${apiBaseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });

  if (!resp.ok && resp.status !== 302) {
    const err = await resp.text();
    throw new Error(`Sample login failed (${resp.status}): ${err}`);
  }

  const setCookie = resp.headers.get("set-cookie") || "";
  const match = setCookie.match(/Authorization=([^;]+)/);
  if (match) return match[1];

  try {
    const data = (await resp.json()) as Record<string, unknown>;
    if (data.token) return String(data.token);
    if (data.data && typeof data.data === "string") return data.data;
  } catch { /* ignore */ }

  throw new Error("Sample login succeeded but could not extract auth token from response.");
}

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
};

/** Upload image to sample via presigned URL. Returns mediaId. */
async function uploadImage(
  apiBaseUrl: string,
  authHeaders: Record<string, string>,
  filePath: string,
): Promise<string> {
  const fileName = basename(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  const fileStat = await stat(filePath);

  // 1. Get presigned URL
  const presignResp = await fetch(`${apiBaseUrl}/api/common/media/presign-batch`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      mediaAssetList: [{ fileName, contentType, sizeBytes: fileStat.size }],
    }),
  });
  if (!presignResp.ok) {
    const err = await presignResp.text();
    throw new Error(`Presign failed (${presignResp.status}): ${err}`);
  }
  const presignData = (await presignResp.json()) as Record<string, unknown>;
  const inner = (presignData.data ?? presignData) as Record<string, unknown>;
  const assets = (inner.mediaAssetList ?? []) as Array<Record<string, unknown>>;
  if (assets.length === 0) throw new Error("No presigned URL returned");

  const { mediaId, uploadUrl, headers: uploadHeaders } = assets[0] as {
    mediaId: string; uploadUrl: string; headers: Record<string, string>;
  };

  // 2. Upload file to presigned URL
  const fileData = await readFile(filePath);
  const putHeaders: Record<string, string> = { "Content-Type": contentType };
  if (uploadHeaders) Object.assign(putHeaders, uploadHeaders);

  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: putHeaders,
    body: fileData,
  });
  if (!uploadResp.ok) {
    throw new Error(`Upload to presigned URL failed (${uploadResp.status})`);
  }

  return String(mediaId);
}

/** Upload image from URL (download first, then upload via presigned URL) */
async function uploadImageFromUrl(
  apiBaseUrl: string,
  authHeaders: Record<string, string>,
  imageUrl: string,
): Promise<string> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`Failed to download image from ${imageUrl}: ${resp.status}`);

  const contentType = resp.headers.get("content-type") || "image/png";
  const buffer = Buffer.from(await resp.arrayBuffer());
  const urlPath = new URL(imageUrl).pathname;
  const fileName = basename(urlPath) || `image-${Date.now()}.png`;

  // 1. Get presigned URL
  const presignResp = await fetch(`${apiBaseUrl}/api/common/media/presign-batch`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      mediaAssetList: [{ fileName, contentType, sizeBytes: buffer.length }],
    }),
  });
  if (!presignResp.ok) throw new Error(`Presign failed (${presignResp.status})`);

  const presignData = (await presignResp.json()) as Record<string, unknown>;
  const inner = (presignData.data ?? presignData) as Record<string, unknown>;
  const assets = (inner.mediaAssetList ?? []) as Array<Record<string, unknown>>;
  if (assets.length === 0) throw new Error("No presigned URL returned");

  const { mediaId, uploadUrl, headers: uploadHeaders } = assets[0] as {
    mediaId: string; uploadUrl: string; headers: Record<string, string>;
  };

  // 2. Upload
  const putHeaders: Record<string, string> = { "Content-Type": contentType };
  if (uploadHeaders) Object.assign(putHeaders, uploadHeaders);
  const uploadResp = await fetch(uploadUrl, { method: "PUT", headers: putHeaders, body: buffer });
  if (!uploadResp.ok) throw new Error(`Upload failed (${uploadResp.status})`);

  return String(mediaId);
}

type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

/** Parse inline markdown (bold, italic, links) into Tiptap text nodes */
function parseInline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = [];
  // Pattern: **bold**, *italic*, [text](url)
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIdx) {
      nodes.push({ type: "text", text: text.slice(lastIdx, m.index) });
    }
    if (m[2]) {
      // **bold**
      nodes.push({ type: "text", text: m[2], marks: [{ type: "bold" }] });
    } else if (m[3]) {
      // *italic*
      nodes.push({ type: "text", text: m[3], marks: [{ type: "italic" }] });
    } else if (m[4] && m[5]) {
      // [text](url)
      nodes.push({ type: "text", text: m[4], marks: [{ type: "link", attrs: { href: m[5], target: "_blank" } }] });
    }
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIdx) });
  }
  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

/** Convert markdown string to Tiptap JSON document */
function markdownToTiptap(md: string): string {
  const lines = md.split("\n");
  const doc: TiptapNode = { type: "doc", content: [] };
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // Heading
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      doc.content!.push({
        type: "heading",
        attrs: { level, textAlign: null },
        content: parseInline(hMatch[2]),
      });
      i++; continue;
    }

    // Horizontal rule
    if (trimmed === "---") {
      doc.content!.push({ type: "horizontalRule" });
      i++; continue;
    }

    // Image ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      doc.content!.push({
        type: "image",
        attrs: { src: imgMatch[2], alt: imgMatch[1] || null, title: null, width: null, align: "center", isUploading: false },
      });
      i++; continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      doc.content!.push({
        type: "blockquote",
        content: [{ type: "paragraph", attrs: { textAlign: null }, content: parseInline(trimmed.slice(2)) }],
      });
      i++; continue;
    }

    // Bullet list
    if (trimmed.startsWith("- ")) {
      const items: TiptapNode[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", attrs: { textAlign: null }, content: parseInline(lines[i].trim().slice(2)) }],
        });
        i++;
      }
      doc.content!.push({ type: "bulletList", content: items });
      continue;
    }

    // Paragraph (default)
    doc.content!.push({
      type: "paragraph",
      attrs: { textAlign: null },
      content: parseInline(trimmed),
    });
    i++;
  }

  return JSON.stringify(doc);
}

/** Convert HTML string to Tiptap JSON document */
function htmlToTiptap(html: string): string {
  // Strip inline styles, parse structure
  const doc: TiptapNode = { type: "doc", content: [] };
  const tagRe = /<(\/?)(\w+)([^>]*)>([\s\S]*?)(?=<\/?(?:h[1-3]|p|ul|ol|li|blockquote|hr|img)\b|$)/gi;

  // Simple approach: split by block-level tags
  const blocks = html.split(/(?=<(?:h[1-6]|p|ul|blockquote|hr|img)\b)/gi).filter(s => s.trim());

  for (const block of blocks) {
    const tagMatch = block.match(/^<(\w+)[^>]*>([\s\S]*?)<\/\1>/);
    if (!tagMatch) {
      // Self-closing or bare text
      if (block.match(/^<hr\b/i)) {
        doc.content!.push({ type: "horizontalRule" });
      } else if (block.match(/^<img\b/i)) {
        const src = block.match(/src="([^"]+)"/)?.[1] || "";
        const alt = block.match(/alt="([^"]+)"/)?.[1] || null;
        doc.content!.push({ type: "image", attrs: { src, alt, title: null, width: null, align: "center", isUploading: false } });
      }
      continue;
    }

    const tag = tagMatch[1].toLowerCase();
    let inner = tagMatch[2];
    // Strip inner tags to get text with marks
    const textContent = inner.replace(/<[^>]+>/g, (t) => {
      if (t.match(/^<strong\b/i)) return "**";
      if (t.match(/^<\/strong/i)) return "**";
      if (t.match(/^<em\b/i)) return "*";
      if (t.match(/^<\/em/i)) return "*";
      const linkMatch = t.match(/^<a[^>]*href="([^"]+)"[^>]*>/i);
      if (linkMatch) return `[LINKSTART:${linkMatch[1]}]`;
      if (t.match(/^<\/a/i)) return "[LINKEND]";
      return "";
    });

    // Convert link markers back
    const cleanText = textContent
      .replace(/\[LINKSTART:([^\]]+)\](.*?)\[LINKEND\]/g, "[$2]($1)");

    if (tag.match(/^h[1-3]$/)) {
      const level = parseInt(tag[1]);
      doc.content!.push({ type: "heading", attrs: { level, textAlign: null }, content: parseInline(cleanText) });
    } else if (tag === "p") {
      doc.content!.push({ type: "paragraph", attrs: { textAlign: null }, content: parseInline(cleanText) });
    } else if (tag === "ul") {
      const items = inner.split(/<li[^>]*>/i).slice(1).map(li => {
        const liText = li.replace(/<\/li>.*/i, "").replace(/<[^>]+>/g, (t) => {
          if (t.match(/^<strong/i)) return "**";
          if (t.match(/^<\/strong/i)) return "**";
          return "";
        });
        return {
          type: "listItem" as const,
          content: [{ type: "paragraph" as const, attrs: { textAlign: null }, content: parseInline(liText) }],
        };
      });
      doc.content!.push({ type: "bulletList", content: items });
    } else if (tag === "blockquote") {
      doc.content!.push({ type: "blockquote", content: [{ type: "paragraph", attrs: { textAlign: null }, content: parseInline(cleanText) }] });
    }
  }

  return JSON.stringify(doc);
}

const SampleBlogToolSchema = Type.Object(
  {
    action: optionalStringEnum(
      ["publish", "list", "stats", "upload_image"] as const,
      { description: 'Action: "publish" (create article), "list" (list articles), "stats" (statistics), "upload_image" (upload image and get mediaId).' },
    ),
    title: Type.Optional(Type.String({ description: "Article title. Place main SEO keyword in first 30 chars. (for publish)" })),
    content: Type.Optional(Type.String({ description: "Article content in HTML or Markdown format. Markdown is auto-converted to HTML. 1500-3000 chars recommended. (for publish)" })),
    contentFormat: Type.Optional(Type.String({ description: 'Content format: "html" (default) or "markdown". When markdown, content is converted to HTML before publishing.' })),
    tags: Type.Optional(Type.Array(Type.String(), { description: "Tags for SEO. 10-15 recommended. (for publish)" })),
    thumbnailMediaId: Type.Optional(Type.String({ description: "Media ID for thumbnail image. Get via upload_image action. (for publish)" })),
    mediaIds: Type.Optional(Type.Array(Type.String(), { description: "Media IDs for inline images. Get via upload_image action. (for publish)" })),
    imagePath: Type.Optional(Type.String({ description: "Local file path of image to upload. (for upload_image)" })),
    imageUrl: Type.Optional(Type.String({ description: "URL of image to download and upload. Use for AI-generated images or external images. (for upload_image)" })),
    page: Type.Optional(Type.Number({ description: "Page number for list action (default: 0)." })),
    size: Type.Optional(Type.Number({ description: "Page size for list action (default: 20)." })),
  },
  { additionalProperties: false },
);

export function createSampleBlogTool(api: OpenClawPluginApi) {
  return {
    name: "sample_blog_publish",
    label: "Sample Blog",
    description:
      "Manage Sample site column articles. Actions: publish (create article with optional thumbnail/images, supports HTML or Markdown), list (articles with viewCount), stats (aggregate), upload_image (upload image file or URL, returns mediaId for use in publish).",
    parameters: SampleBlogToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action") ?? "publish";
      const { apiBaseUrl, email, password } = resolveConfig(api);
      const authToken = await login(apiBaseUrl, email, password);
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Cookie: `Authorization=${authToken}`,
      };

      switch (action) {
        case "publish": {
          const title = readStringParam(rawParams, "title", { required: true });
          let content = readStringParam(rawParams, "content", { required: true });
          let contentFormat = readStringParam(rawParams, "contentFormat") ?? "auto";
          const tagsParam = rawParams.tags;
          const tags = Array.isArray(tagsParam) ? tagsParam.map(String) : [];
          const thumbnailMediaId = readStringParam(rawParams, "thumbnailMediaId") ?? null;
          const mediaIdsParam = rawParams.mediaIds;
          const mediaIds = Array.isArray(mediaIdsParam) ? mediaIdsParam.map(String) : [];

          // Auto-detect format
          if (contentFormat === "auto") {
            const hasHtml = /<(h[1-6]|p|div|ul|ol|li|strong|em|a|img)\b/i.test(content);
            const hasMd = /^#{1,3}\s|^\*\*|^- |\[.+\]\(.+\)/m.test(content);
            contentFormat = hasHtml ? "html" : hasMd ? "markdown" : "html";
          }

          // Convert to Tiptap JSON (sample uses Tiptap editor)
          if (contentFormat === "markdown") {
            content = markdownToTiptap(content);
          } else {
            content = htmlToTiptap(content);
          }

          const body: Record<string, unknown> = { title, content };
          if (tags.length > 0) body.tags = tags;
          if (thumbnailMediaId) body.thumbnailMediaId = thumbnailMediaId;
          if (mediaIds.length > 0) body.mediaIds = mediaIds;

          const resp = await fetch(`${apiBaseUrl}/api/admin/column-articles`, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(body),
          });

          if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Sample publish failed (${resp.status}): ${err}`);
          }

          const data = (await resp.json()) as Record<string, unknown>;
          const articleId = data.data ?? data.id ?? null;

          return jsonResult({
            success: true,
            articleId,
            articleUrl: `${apiBaseUrl.replace("api.", "www.")}/community/column/${articleId}`,
            titleLength: title.length,
            contentLength: content.length,
            tagCount: tags.length,
            hasThumbnail: !!thumbnailMediaId,
            imageCount: mediaIds.length,
          });
        }

        case "upload_image": {
          const imagePath = readStringParam(rawParams, "imagePath") ?? null;
          const imageUrl = readStringParam(rawParams, "imageUrl") ?? null;

          if (!imagePath && !imageUrl) {
            throw new Error("Provide imagePath (local file) or imageUrl (remote URL) to upload.");
          }

          let mediaId: string;
          if (imagePath) {
            mediaId = await uploadImage(apiBaseUrl, authHeaders, imagePath);
          } else {
            mediaId = await uploadImageFromUrl(apiBaseUrl, authHeaders, imageUrl!);
          }

          return jsonResult({ success: true, mediaId, source: imagePath || imageUrl });
        }

        case "list": {
          const page = typeof rawParams.page === "number" ? rawParams.page : 0;
          const size = typeof rawParams.size === "number" ? rawParams.size : 20;

          const resp = await fetch(
            `${apiBaseUrl}/api/admin/column-articles?status=APPROVED&page=${page}&size=${size}`,
            { headers: authHeaders },
          );

          if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Sample list failed (${resp.status}): ${err}`);
          }

          const data = (await resp.json()) as Record<string, unknown>;
          const inner = (data.data ?? data) as Record<string, unknown>;
          const articles = ((inner.content ?? []) as Array<Record<string, unknown>>).map((a) => ({
            id: a.id, title: a.title, tags: a.tags,
            viewCount: a.viewCount ?? 0, thumbnailUrl: a.thumbnailUrl,
            regDate: a.regDate, modDate: a.modDate,
          }));

          return jsonResult({ total: inner.totalElements ?? articles.length, page, size, articles });
        }

        case "stats": {
          const resp = await fetch(
            `${apiBaseUrl}/api/admin/column-articles?status=APPROVED&page=0&size=100`,
            { headers: authHeaders },
          );
          if (!resp.ok) throw new Error(`Sample stats failed (${resp.status})`);

          const data = (await resp.json()) as Record<string, unknown>;
          const inner = (data.data ?? data) as Record<string, unknown>;
          const content = (inner.content ?? []) as Array<Record<string, unknown>>;
          const views = content.map((a) => Number(a.viewCount ?? 0));
          const totalViews = views.reduce((s, v) => s + v, 0);
          const avgViews = views.length > 0 ? Math.round(totalViews / views.length) : 0;
          const maxIdx = views.indexOf(Math.max(...views));
          const topArticle = maxIdx >= 0 ? content[maxIdx] : null;

          return jsonResult({
            totalArticles: content.length, totalViews, avgViews,
            topArticle: topArticle ? { id: topArticle.id, title: topArticle.title, viewCount: topArticle.viewCount } : null,
          });
        }

        default:
          throw new Error(`Unknown action: ${action}. Use publish, list, stats, or upload_image.`);
      }
    },
  };
}
