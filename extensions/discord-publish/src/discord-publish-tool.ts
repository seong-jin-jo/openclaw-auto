import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "";

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 2000 characters." }),
  
}, { additionalProperties: false });

export function createDiscordPublishTool(api: OpenClawPluginApi) {
  return {
    name: "discord_publish",
    label: "Discord Publish",
    description: "Send messages to Discord channels via Webhook. Max 2000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 2000) throw new Error(`Text exceeds 2000 char limit (${text.length} chars).`);

      const cfg = (api.pluginConfig ?? {});
      const webhookUrl = (typeof cfg.webhookUrl === "string" && cfg.webhookUrl.trim()) || process.env.DISCORD_WEBHOOK_URL || "";
      if (!webhookUrl) throw new Error("Discord webhook URL not configured.");
      const resp = await fetch(webhookUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!resp.ok) throw new Error(`Discord send failed (${resp.status}): ${await resp.text()}`);
      return jsonResult({ success: true, textLength: text.length });
    },
  };
}
