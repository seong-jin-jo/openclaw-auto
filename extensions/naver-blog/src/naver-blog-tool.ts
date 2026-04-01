import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const NAVER_XMLRPC_URL = "https://api.blog.naver.com/xmlrpc";

type NaverBlogConfig = {
  blogId?: string;
  apiPassword?: string;
};

function resolveConfig(api: OpenClawPluginApi): { blogId: string; apiPassword: string } {
  const pluginCfg = (api.pluginConfig ?? {}) as NaverBlogConfig;
  const blogId =
    (typeof pluginCfg.blogId === "string" && pluginCfg.blogId.trim()) ||
    process.env.NAVER_BLOG_ID ||
    "";
  const apiPassword =
    (typeof pluginCfg.apiPassword === "string" && pluginCfg.apiPassword.trim()) ||
    process.env.NAVER_BLOG_API_PASSWORD ||
    "";
  if (!blogId) {
    throw new Error(
      "Naver Blog ID not configured. Set NAVER_BLOG_ID env var or configure in plugin settings.",
    );
  }
  if (!apiPassword) {
    throw new Error(
      "Naver Blog API password not configured. Set NAVER_BLOG_API_PASSWORD env var or configure in plugin settings.",
    );
  }
  return { blogId, apiPassword };
}

function buildXmlRpcPayload(
  blogId: string,
  apiPassword: string,
  title: string,
  content: string,
  categories: string,
  tags: string[],
): string {
  const escapedTitle = escapeXml(title);
  const escapedContent = escapeXml(content);
  const escapedCategories = escapeXml(categories);
  const tagString = escapeXml(tags.join(","));

  return `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>metaWeblog.newPost</methodName>
  <params>
    <param><value><string>${escapeXml(blogId)}</string></value></param>
    <param><value><string>${escapeXml(blogId)}</string></value></param>
    <param><value><string>${escapeXml(apiPassword)}</string></value></param>
    <param>
      <value>
        <struct>
          <member>
            <name>title</name>
            <value><string>${escapedTitle}</string></value>
          </member>
          <member>
            <name>description</name>
            <value><string>${escapedContent}</string></value>
          </member>
          <member>
            <name>categories</name>
            <value>
              <array>
                <data>
                  <value><string>${escapedCategories}</string></value>
                </data>
              </array>
            </value>
          </member>
          <member>
            <name>mt_keywords</name>
            <value><string>${tagString}</string></value>
          </member>
        </struct>
      </value>
    </param>
    <param><value><boolean>1</boolean></value></param>
  </params>
</methodCall>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseXmlRpcResponse(xml: string): { success: boolean; postId?: string; error?: string } {
  // Success: <value><string>POST_ID</string></value>
  const postIdMatch = xml.match(/<value><string>(\d+)<\/string><\/value>/);
  if (postIdMatch) {
    return { success: true, postId: postIdMatch[1] };
  }
  // Fault: <fault><value><struct>...<name>faultString</name><value><string>ERROR</string>
  const faultMatch = xml.match(/<name>faultString<\/name>\s*<value><string>([^<]+)<\/string>/);
  if (faultMatch) {
    return { success: false, error: faultMatch[1] };
  }
  return { success: false, error: "Unknown XML-RPC response format" };
}

const NaverBlogToolSchema = Type.Object(
  {
    title: Type.String({
      description: "Blog post title. Place the main SEO keyword in the first 30 characters.",
    }),
    content: Type.String({
      description:
        "Blog post content in HTML format. Use <h2>/<h3> for headings, <p> for paragraphs. 1500-3000 characters recommended for SEO.",
    }),
    category: Type.Optional(
      Type.String({ description: "Blog category name (default: empty)." }),
    ),
    tags: Type.Optional(
      Type.Array(Type.String(), {
        description: "Blog tags for SEO. 10-15 tags recommended.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createNaverBlogTool(api: OpenClawPluginApi) {
  return {
    name: "naver_blog_publish",
    label: "Naver Blog Publish",
    description:
      "Publish a blog post to Naver Blog via XML-RPC API. Provide title (with SEO keyword in first 30 chars), HTML content (1500-3000 chars with h2/h3 headings), and tags (10-15 for SEO).",
    parameters: NaverBlogToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const title = readStringParam(rawParams, "title", { required: true });
      const content = readStringParam(rawParams, "content", { required: true });
      const category = readStringParam(rawParams, "category") ?? "";
      const tagsParam = rawParams.tags;
      const tags = Array.isArray(tagsParam) ? tagsParam.map(String) : [];

      const { blogId, apiPassword } = resolveConfig(api);

      const xmlPayload = buildXmlRpcPayload(blogId, apiPassword, title, content, category, tags);

      const resp = await fetch(NAVER_XMLRPC_URL, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: xmlPayload,
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Naver Blog XML-RPC failed (${resp.status}): ${err}`);
      }

      const responseXml = await resp.text();
      const result = parseXmlRpcResponse(responseXml);

      if (!result.success) {
        throw new Error(`Naver Blog publish failed: ${result.error}`);
      }

      const postUrl = `https://blog.naver.com/${blogId}/${result.postId}`;

      return jsonResult({
        success: true,
        postId: result.postId,
        postUrl,
        titleLength: title.length,
        contentLength: content.length,
        tagCount: tags.length,
      });
    },
  };
}
