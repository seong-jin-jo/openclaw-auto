import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://graph.instagram.com/v21.0";

type Config = { accessToken?: string; userId?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.INSTAGRAM_ACCESSTOKEN || "";
  const userId = (typeof pluginCfg.userId === "string" && pluginCfg.userId.trim()) || process.env.INSTAGRAM_USERID || "";
  if (!accessToken) throw new Error("Instagram Publish credentials not configured.");
  return { accessToken, userId };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 2200 characters." }),
  image_url: Type.Optional(Type.String({ description: 'Public image URL to attach.' })),
}, { additionalProperties: false });

export function createInstagramPublishTool(api: OpenClawPluginApi) {
  return {
    name: "instagram_publish",
    label: "Instagram Publish",
    description: "Publish posts to Instagram via Meta Graph API (Business account required). Max 2200 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 2200) throw new Error(`Text exceeds 2200 char limit (${text.length} chars).`);

      const { accessToken, userId } = resolveConfig(api);
      const imageUrl = readStringParam(rawParams, "image_url");
      if (!imageUrl) throw new Error("Instagram requires an image_url.");
      // Step 1: Create media container
      const createResp = await fetch(`${API_BASE}/${userId}/media`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ image_url: imageUrl, caption: text, access_token: accessToken }),
      });
      if (!createResp.ok) throw new Error(`IG container failed: ${await createResp.text()}`);
      const { id: containerId } = await createResp.json();
      // Step 2: Publish
      const pubResp = await fetch(`${API_BASE}/${userId}/media_publish`, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
      });
      if (!pubResp.ok) throw new Error(`IG publish failed: ${await pubResp.text()}`);
      const pub = await pubResp.json();
      return jsonResult({ success: true, mediaId: pub.id, textLength: text.length });
    },
  };
}
