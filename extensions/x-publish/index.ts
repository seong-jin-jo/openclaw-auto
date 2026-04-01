import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createXPublishTool } from "./src/x-publish-tool.js";

export default definePluginEntry({
  id: "x-publish",
  name: "X Publish",
  description: "Publish tweets to X (Twitter) via API v2",
  register(api) {
    api.registerTool(createXPublishTool(api) as AnyAgentTool);
  },
});
