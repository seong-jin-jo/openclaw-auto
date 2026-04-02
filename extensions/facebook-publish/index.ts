import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createFacebookPublishTool } from "./src/facebook-publish-tool.js";

export default definePluginEntry({
  id: "facebook-publish",
  name: "Facebook Publish",
  description: "Publish posts to Facebook Pages via Graph API",
  register(api) {
    api.registerTool(createFacebookPublishTool(api) as AnyAgentTool);
  },
});
