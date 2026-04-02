import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://open.tiktokapis.com/v2";

type Config = { accessToken?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.TIKTOK_ACCESSTOKEN || "";
  if (!accessToken) throw new Error("TikTok Publish credentials not configured.");
  return { accessToken };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 2200 characters." }),
  
}, { additionalProperties: false });

export function createTiktokPublishTool(api: OpenClawPluginApi) {
  return {
    name: "tiktok_publish",
    label: "TikTok Publish",
    description: "Upload content to TikTok via Content Posting API (app audit required). Max 2200 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 2200) throw new Error(`Text exceeds 2200 char limit (${text.length} chars).`);

      const cfg = (api.pluginConfig ?? {});
      const token = (typeof cfg.accessToken === "string" && cfg.accessToken.trim()) || "";
      if (!token) throw new Error("TikTok access token not configured.");
      // Photo post (text as title)
      const resp = await fetch(`${API_BASE}/post/publish/content/init/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ post_info: { title: text, privacy_level: "SELF_ONLY" }, source_info: { source: "PULL_FROM_URL" } }),
      });
      if (!resp.ok) throw new Error(`TikTok post failed: ${await resp.text()}`);
      const data = await resp.json();
      return jsonResult({ success: true, publishId: data.data?.publish_id, note: "Post is private until app passes audit", textLength: text.length });
    },
  };
}
