import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsQueueTool } from "./src/threads-queue-tool.js";

export default definePluginEntry({
  id: "threads-queue",
  name: "Threads Queue",
  description: "Manage content queue for scheduled Threads publishing",
  register(api) {
    api.registerTool(createThreadsQueueTool(api) as AnyAgentTool);
  },
});
