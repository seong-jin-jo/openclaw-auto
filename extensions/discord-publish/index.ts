import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createDiscordPublishTool } from "./src/discord-publish-tool.js";

export default definePluginEntry({
  id: "discord-publish",
  name: "Discord Publish",
  description: "Send messages to Discord channels via Webhook",
  register(api) {
    api.registerTool(createDiscordPublishTool(api) as AnyAgentTool);
  },
});
