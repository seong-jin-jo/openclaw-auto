import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createNaverBlogPublishTool } from "./src/naver-blog-publish-tool.js";

export default definePluginEntry({
  id: "naver-blog-publish",
  name: "Naver Blog Publish",
  description: "Publish posts to Naver Blog via XML-RPC (legacy API)",
  register(api) {
    api.registerTool(createNaverBlogPublishTool(api) as AnyAgentTool);
  },
});
