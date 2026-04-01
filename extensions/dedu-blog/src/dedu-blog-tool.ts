import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

type DeduBlogConfig = {
  apiBaseUrl?: string;
  adminToken?: string;
};

function resolveConfig(api: OpenClawPluginApi): { apiBaseUrl: string; adminToken: string } {
  const pluginCfg = (api.pluginConfig ?? {}) as DeduBlogConfig;
  const apiBaseUrl =
    (typeof pluginCfg.apiBaseUrl === "string" && pluginCfg.apiBaseUrl.trim()) ||
    process.env.DEDU_API_BASE_URL ||
    "";
  const adminToken =
    (typeof pluginCfg.adminToken === "string" && pluginCfg.adminToken.trim()) ||
    process.env.DEDU_ADMIN_TOKEN ||
    "";
  if (!apiBaseUrl) {
    throw new Error(
      "D-Edu API base URL not configured. Set DEDU_API_BASE_URL env var or configure in plugin settings.",
    );
  }
  if (!adminToken) {
    throw new Error(
      "D-Edu admin token not configured. Set DEDU_ADMIN_TOKEN env var or configure in plugin settings.",
    );
  }
  return { apiBaseUrl: apiBaseUrl.replace(/\/$/, ""), adminToken };
}

const DeduBlogToolSchema = Type.Object(
  {
    title: Type.String({
      description:
        "Column article title. Place the main SEO keyword in the first 30 characters.",
    }),
    content: Type.String({
      description:
        "Column article content in HTML format. Use <h2>/<h3> for headings, <p> for paragraphs. 1500-3000 characters recommended for SEO.",
    }),
    slug: Type.Optional(
      Type.String({
        description:
          "URL slug for SEO (e.g. 'tutoring-student-management-tips'). Auto-generated from title if not provided.",
      }),
    ),
    metaDescription: Type.Optional(
      Type.String({
        description: "Meta description for search results. Max 160 characters.",
      }),
    ),
    category: Type.Optional(
      Type.String({ description: "Column category (default: empty)." }),
    ),
    tags: Type.Optional(
      Type.Array(Type.String(), {
        description: "Tags for SEO. 10-15 tags recommended.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createDeduBlogTool(api: OpenClawPluginApi) {
  return {
    name: "dedu_blog_publish",
    label: "D-Edu Blog Publish",
    description:
      "Publish a column article to D-Edu site (d-edu.site) via admin API. The article is published immediately as APPROVED. Provide title with SEO keyword, HTML content (1500-3000 chars), and tags (10-15 for SEO).",
    parameters: DeduBlogToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const title = readStringParam(rawParams, "title", { required: true });
      const content = readStringParam(rawParams, "content", { required: true });
      const slug = readStringParam(rawParams, "slug") ?? null;
      const metaDescription = readStringParam(rawParams, "metaDescription") ?? null;
      const category = readStringParam(rawParams, "category") ?? null;
      const tagsParam = rawParams.tags;
      const tags = Array.isArray(tagsParam) ? tagsParam.map(String) : [];

      const { apiBaseUrl, adminToken } = resolveConfig(api);

      const body: Record<string, unknown> = { title, content };
      if (slug) body.slug = slug;
      if (metaDescription) body.metaDescription = metaDescription;
      if (category) body.category = category;
      if (tags.length > 0) body.tags = tags;

      const resp = await fetch(`${apiBaseUrl}/api/admin/column-articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`D-Edu API failed (${resp.status}): ${err}`);
      }

      const data = (await resp.json()) as Record<string, unknown>;
      const articleId = data.id ?? data.articleId ?? null;
      const articleSlug = data.slug ?? slug ?? String(articleId);
      const articleUrl = `${apiBaseUrl}/community/column/${articleSlug}`;

      return jsonResult({
        success: true,
        articleId,
        articleUrl,
        titleLength: title.length,
        contentLength: content.length,
        tagCount: tags.length,
      });
    },
  };
}
