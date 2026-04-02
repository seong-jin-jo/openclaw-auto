import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createLinePublishTool } from "./src/line-publish-tool.js";

export default definePluginEntry({
  id: "line-publish",
  name: "LINE Publish",
  description: "Broadcast messages via LINE Official Account Messaging API",
  register(api) {
    api.registerTool(createLinePublishTool(api) as AnyAgentTool);
  },
});
