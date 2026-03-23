import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsStyleTool } from "./src/threads-style-tool.js";

export default definePluginEntry({
  id: "threads-style",
  name: "Threads Style",
  description: "Manage style learning data for Threads content generation",
  register(api) {
    api.registerTool(createThreadsStyleTool(api) as AnyAgentTool);
  },
});
