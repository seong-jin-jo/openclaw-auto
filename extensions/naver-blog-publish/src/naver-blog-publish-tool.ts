import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://api.blog.naver.com/xmlrpc";

type Config = { blogId?: string; username?: string; apiKey?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const blogId = (typeof pluginCfg.blogId === "string" && pluginCfg.blogId.trim()) || process.env.NAVER_BLOG_BLOGID || "";
  const username = (typeof pluginCfg.username === "string" && pluginCfg.username.trim()) || process.env.NAVER_BLOG_USERNAME || "";
  const apiKey = (typeof pluginCfg.apiKey === "string" && pluginCfg.apiKey.trim()) || process.env.NAVER_BLOG_APIKEY || "";
  if (!blogId) throw new Error("Naver Blog Publish credentials not configured.");
  return { blogId, username, apiKey };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 50000 characters." }),
  
}, { additionalProperties: false });

export function createNaverBlogPublishTool(api: OpenClawPluginApi) {
  return {
    name: "naver_blog_publish",
    label: "Naver Blog Publish",
    description: "Publish posts to Naver Blog via XML-RPC (legacy API). Max 50000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 50000) throw new Error(`Text exceeds 50000 char limit (${text.length} chars).`);

      const cfg = (api.pluginConfig ?? {});
      const blogId = cfg.blogId || ""; const username = cfg.username || ""; const apiKey = cfg.apiKey || "";
      if (!blogId || !username || !apiKey) throw new Error("Naver Blog credentials not configured.");
      // XML-RPC metaWeblog.newPost
      const xmlBody = '<?xml version="1.0"?><methodCall><methodName>metaWeblog.newPost</methodName><params>' +
        '<param><value>' + blogId + '</value></param>' +
        '<param><value>' + username + '</value></param>' +
        '<param><value>' + apiKey + '</value></param>' +
        '<param><value><struct><member><name>title</name><value>' + text.slice(0, 100) + '</value></member>' +
        '<member><name>description</name><value><![CDATA[' + text + ']]></value></member></struct></value></param>' +
        '<param><value><boolean>1</boolean></value></param></params></methodCall>';
      const resp = await fetch(API_BASE, { method: "POST", headers: { "Content-Type": "text/xml" }, body: xmlBody });
      if (!resp.ok) throw new Error(`Naver Blog post failed: ${await resp.text()}`);
      return jsonResult({ success: true, textLength: text.length });
    },
  };
}
