import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

import crypto from "node:crypto";

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function generateOAuthSignature(method: string, url: string, params: Record<string, string>, consumerSecret: string, tokenSecret: string): string {
  const sorted = Object.keys(params).sort().map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`).join("&");
  const base = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sorted)}`;
  const key = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto.createHmac("sha1", key).update(base).digest("base64");
}

function buildOAuthHeader(method: string, url: string, config: any): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.consumerKey, oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1", oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken, oauth_version: "1.0",
  };
  oauthParams.oauth_signature = generateOAuthSignature(method, url, oauthParams, config.consumerSecret, config.accessTokenSecret);
  return "OAuth " + Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");
}

const API_BASE = "https://api.tumblr.com/v2";

type Config = { consumerKey?: string; consumerSecret?: string; accessToken?: string; accessTokenSecret?: string; blogName?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const consumerKey = (typeof pluginCfg.consumerKey === "string" && pluginCfg.consumerKey.trim()) || process.env.TUMBLR_CONSUMERKEY || "";
  const consumerSecret = (typeof pluginCfg.consumerSecret === "string" && pluginCfg.consumerSecret.trim()) || process.env.TUMBLR_CONSUMERSECRET || "";
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.TUMBLR_ACCESSTOKEN || "";
  const accessTokenSecret = (typeof pluginCfg.accessTokenSecret === "string" && pluginCfg.accessTokenSecret.trim()) || process.env.TUMBLR_ACCESSTOKENSECRET || "";
  const blogName = (typeof pluginCfg.blogName === "string" && pluginCfg.blogName.trim()) || process.env.TUMBLR_BLOGNAME || "";
  if (!consumerKey) throw new Error("Tumblr Publish credentials not configured.");
  return { consumerKey, consumerSecret, accessToken, accessTokenSecret, blogName };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 50000 characters." }),
  
}, { additionalProperties: false });

export function createTumblrPublishTool(api: OpenClawPluginApi) {
  return {
    name: "tumblr_publish",
    label: "Tumblr Publish",
    description: "Publish posts to Tumblr via API v2 (OAuth 1.0a). Max 50000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 50000) throw new Error(`Text exceeds 50000 char limit (${text.length} chars).`);

      const config = resolveConfig(api);
      const url = `${API_BASE}/blog/${config.blogName}/post`;
      const authHeader = buildOAuthHeader("POST", url, config);
      const resp = await fetch(url, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ content: [{ type: "text", text }], state: "published" }),
      });
      if (!resp.ok) throw new Error(`Tumblr post failed: ${await resp.text()}`);
      const data = await resp.json();
      return jsonResult({ success: true, postId: data.response?.id, textLength: text.length });
    },
  };
}
