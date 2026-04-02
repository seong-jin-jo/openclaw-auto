import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://www.googleapis.com/youtube/v3";

type Config = { accessToken?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.YOUTUBE_ACCESSTOKEN || "";
  if (!accessToken) throw new Error("YouTube Publish credentials not configured.");
  return { accessToken };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 5000 characters." }),
  
}, { additionalProperties: false });

export function createYoutubePublishTool(api: OpenClawPluginApi) {
  return {
    name: "youtube_publish",
    label: "YouTube Publish",
    description: "Upload videos to YouTube via Data API v3 (video file required, community posts not supported). Max 5000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 5000) throw new Error(`Text exceeds 5000 char limit (${text.length} chars).`);

      const cfg = (api.pluginConfig ?? {});
      const token = (typeof cfg.accessToken === "string" && cfg.accessToken.trim()) || "";
      if (!token) throw new Error("YouTube access token not configured.");
      // Note: YouTube API requires video file upload, not text-only posts
      // Community posts have no official API
      return jsonResult({ success: false, error: "YouTube requires video file upload. Community posts API is not available. Use the YouTube Studio UI for community posts.", textLength: text.length });
    },
  };
}
