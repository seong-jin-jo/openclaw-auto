import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createSampleBlogTool } from "./src/sample-blog-tool.js";

export default definePluginEntry({
  id: "sample-blog",
  name: "Sample Blog",
  description: "Publish column articles to Sample site",
  register(api) {
    api.registerTool(createSampleBlogTool(api) as AnyAgentTool);
  },
});
