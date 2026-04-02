import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createTiktokPublishTool } from "./src/tiktok-publish-tool.js";

export default definePluginEntry({
  id: "tiktok-publish",
  name: "TikTok Publish",
  description: "Upload content to TikTok via Content Posting API (app audit required)",
  register(api) {
    api.registerTool(createTiktokPublishTool(api) as AnyAgentTool);
  },
});
