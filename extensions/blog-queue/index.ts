import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createBlogQueueTool } from "./src/blog-queue-tool.js";

export default definePluginEntry({
  id: "blog-queue",
  name: "Blog Queue",
  description: "Manage blog content queue for Naver Blog posts",
  register(api) {
    api.registerTool(createBlogQueueTool(api) as AnyAgentTool);
  },
});
