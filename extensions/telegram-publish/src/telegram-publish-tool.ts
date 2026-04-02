import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://api.telegram.org";

type Config = { botToken?: string; chatId?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const botToken = (typeof pluginCfg.botToken === "string" && pluginCfg.botToken.trim()) || process.env.TELEGRAM_BOTTOKEN || "";
  const chatId = (typeof pluginCfg.chatId === "string" && pluginCfg.chatId.trim()) || process.env.TELEGRAM_CHATID || "";
  if (!botToken) throw new Error("Telegram Publish credentials not configured.");
  return { botToken, chatId };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 4096 characters." }),
  
}, { additionalProperties: false });

export function createTelegramPublishTool(api: OpenClawPluginApi) {
  return {
    name: "telegram_publish",
    label: "Telegram Publish",
    description: "Send messages to Telegram channels/groups via Bot API. Max 4096 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 4096) throw new Error(`Text exceeds 4096 char limit (${text.length} chars).`);

      const { botToken, chatId } = resolveConfig(api);
      const url = `${API_BASE}/bot${botToken}/sendMessage`;
      const resp = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      if (!resp.ok) throw new Error(`Telegram send failed: ${await resp.text()}`);
      const data = await resp.json();
      return jsonResult({ success: true, messageId: data.result.message_id, textLength: text.length });
    },
  };
}
