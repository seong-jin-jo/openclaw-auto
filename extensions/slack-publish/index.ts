import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createSlackPublishTool } from "./src/slack-publish-tool.js";

export default definePluginEntry({
  id: "slack-publish",
  name: "Slack Publish",
  description: "Send messages to Slack channels via Incoming Webhook",
  register(api) {
    api.registerTool(createSlackPublishTool(api) as AnyAgentTool);
  },
});
