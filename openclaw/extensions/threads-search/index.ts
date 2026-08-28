import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsSearchTool } from "./src/threads-search-tool.js";

export default definePluginEntry({
  id: "threads-search",
  name: "Threads Search",
  description: "Search trending posts on Threads by keywords",
  register(api) {
    api.registerTool(createThreadsSearchTool(api) as AnyAgentTool);
  },
});
