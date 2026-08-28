import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsInsightsTool } from "./src/threads-insights-tool.js";

export default definePluginEntry({
  id: "threads-insights",
  name: "Threads Insights",
  description: "Collect engagement metrics and detect viral posts",
  register(api) {
    api.registerTool(createThreadsInsightsTool(api) as AnyAgentTool);
  },
});
