import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createTumblrPublishTool } from "./src/tumblr-publish-tool.js";

export default definePluginEntry({
  id: "tumblr-publish",
  name: "Tumblr Publish",
  description: "Publish posts to Tumblr via API v2 (OAuth 1.0a)",
  register(api) {
    api.registerTool(createTumblrPublishTool(api) as AnyAgentTool);
  },
});
