import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const ToolSchema = Type.Object({
  text: Type.String({ description: "Message text to send. Supports Slack mrkdwn formatting." }),
}, { additionalProperties: false });

export function createSlackPublishTool(api: OpenClawPluginApi) {
  return {
    name: "slack_publish",
    label: "Slack Publish",
    description: "Send a message to Slack via Incoming Webhook.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      const cfg = (api.pluginConfig ?? {}) as { webhookUrl?: string };
      const webhookUrl = (typeof cfg.webhookUrl === "string" && cfg.webhookUrl.trim()) || process.env.SLACK_WEBHOOK_URL || "";
      if (!webhookUrl) throw new Error("Slack webhook URL not configured.");
      if (!webhookUrl.startsWith("https://hooks.slack.com/")) throw new Error("Invalid Slack Webhook URL.");

      const resp = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error(`Slack send failed (${resp.status}): ${await resp.text()}`);
      return jsonResult({ success: true, textLength: text.length });
    },
  };
}
