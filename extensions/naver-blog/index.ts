import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createNaverBlogTool } from "./src/naver-blog-tool.js";

export default definePluginEntry({
  id: "naver-blog",
  name: "Naver Blog",
  description: "Publish blog posts to Naver Blog via XML-RPC",
  register(api) {
    api.registerTool(createNaverBlogTool(api) as AnyAgentTool);
  },
});
