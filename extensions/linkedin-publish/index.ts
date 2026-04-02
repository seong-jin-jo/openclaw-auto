import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createLinkedinPublishTool } from "./src/linkedin-publish-tool.js";

export default definePluginEntry({
  id: "linkedin-publish",
  name: "LinkedIn Publish",
  description: "Publish posts to LinkedIn via Community Management API (Partner Program required)",
  register(api) {
    api.registerTool(createLinkedinPublishTool(api) as AnyAgentTool);
  },
});
