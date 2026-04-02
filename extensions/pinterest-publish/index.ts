import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createPinterestPublishTool } from "./src/pinterest-publish-tool.js";

export default definePluginEntry({
  id: "pinterest-publish",
  name: "Pinterest Publish",
  description: "Create Pins on Pinterest via Content API v5",
  register(api) {
    api.registerTool(createPinterestPublishTool(api) as AnyAgentTool);
  },
});
