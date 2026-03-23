import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsGrowthTool } from "./src/threads-growth-tool.js";

export default definePluginEntry({
  id: "threads-growth",
  name: "Threads Growth",
  description: "Track Threads follower count and profile views",
  register(api) {
    api.registerTool(createThreadsGrowthTool(api) as AnyAgentTool);
  },
});
