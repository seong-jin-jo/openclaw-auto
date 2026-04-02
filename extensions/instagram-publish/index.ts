import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createInstagramPublishTool } from "./src/instagram-publish-tool.js";

export default definePluginEntry({
  id: "instagram-publish",
  name: "Instagram Publish",
  description: "Publish posts to Instagram via Meta Graph API (Business account required)",
  register(api) {
    api.registerTool(createInstagramPublishTool(api) as AnyAgentTool);
  },
});
