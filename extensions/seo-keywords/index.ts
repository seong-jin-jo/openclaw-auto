import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createSeoKeywordsTool } from "./src/seo-keywords-tool.js";

export default definePluginEntry({
  id: "seo-keywords",
  name: "SEO Keywords",
  description: "Analyze keyword search volume and competition for SEO optimization",
  register(api) {
    api.registerTool(createSeoKeywordsTool(api) as AnyAgentTool);
  },
});
