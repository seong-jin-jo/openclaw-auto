import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://graph.facebook.com/v21.0";

type Config = { accessToken?: string; pageId?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.FACEBOOK_ACCESSTOKEN || "";
  const pageId = (typeof pluginCfg.pageId === "string" && pluginCfg.pageId.trim()) || process.env.FACEBOOK_PAGEID || "";
  if (!accessToken) throw new Error("Facebook Publish credentials not configured.");
  return { accessToken, pageId };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 63206 characters." }),
  
}, { additionalProperties: false });

export function createFacebookPublishTool(api: OpenClawPluginApi) {
  return {
    name: "facebook_publish",
    label: "Facebook Publish",
    description: "Publish posts to Facebook Pages via Graph API. Max 63206 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 63206) throw new Error(`Text exceeds 63206 char limit (${text.length} chars).`);

      const { accessToken, pageId } = resolveConfig(api);
      const url = `${API_BASE}/${pageId}/feed`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ message: text, access_token: accessToken }),
      });
      if (!resp.ok) { const err = await resp.text(); throw new Error(`Facebook post failed (${resp.status}): ${err}`); }
      const data = await resp.json();
      return jsonResult({ success: true, postId: data.id, textLength: text.length });
    },
  };
}
