import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://api.line.me/v2/bot";

type Config = { channelAccessToken?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const channelAccessToken = (typeof pluginCfg.channelAccessToken === "string" && pluginCfg.channelAccessToken.trim()) || process.env.LINE_CHANNELACCESSTOKEN || "";
  if (!channelAccessToken) throw new Error("LINE Publish credentials not configured.");
  return { channelAccessToken };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 5000 characters." }),
  
}, { additionalProperties: false });

export function createLinePublishTool(api: OpenClawPluginApi) {
  return {
    name: "line_publish",
    label: "LINE Publish",
    description: "Broadcast messages via LINE Official Account Messaging API. Max 5000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 5000) throw new Error(`Text exceeds 5000 char limit (${text.length} chars).`);

      const cfg = (api.pluginConfig ?? {});
      const token = (typeof cfg.channelAccessToken === "string" && cfg.channelAccessToken.trim()) || process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
      if (!token) throw new Error("LINE channel access token not configured.");
      const resp = await fetch(`${API_BASE}/message/broadcast`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ type: "text", text }] }),
      });
      if (!resp.ok) throw new Error(`LINE broadcast failed: ${await resp.text()}`);
      return jsonResult({ success: true, textLength: text.length });
    },
  };
}
