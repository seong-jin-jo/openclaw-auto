import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createDeduBlogTool } from "./src/dedu-blog-tool.js";

export default definePluginEntry({
  id: "dedu-blog",
  name: "D-Edu Blog",
  description: "Publish column articles to D-Edu site",
  register(api) {
    api.registerTool(createDeduBlogTool(api) as AnyAgentTool);
  },
});
