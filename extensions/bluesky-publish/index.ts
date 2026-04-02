import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createBlueskyPublishTool } from "./src/bluesky-publish-tool.js";

export default definePluginEntry({
  id: "bluesky-publish",
  name: "Bluesky Publish",
  description: "Publish posts to Bluesky via AT Protocol",
  register(api) {
    api.registerTool(createBlueskyPublishTool(api) as AnyAgentTool);
  },
});
