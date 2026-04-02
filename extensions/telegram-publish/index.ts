import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createTelegramPublishTool } from "./src/telegram-publish-tool.js";

export default definePluginEntry({
  id: "telegram-publish",
  name: "Telegram Publish",
  description: "Send messages to Telegram channels/groups via Bot API",
  register(api) {
    api.registerTool(createTelegramPublishTool(api) as AnyAgentTool);
  },
});
