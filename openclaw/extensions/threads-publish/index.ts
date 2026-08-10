import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createThreadsPublishTool } from "./src/threads-publish-tool.js";

export default definePluginEntry({
  id: "threads-publish",
  name: "Threads Publish",
  description: "Publish text posts to Meta Threads",
  register(api) {
    api.registerTool(createThreadsPublishTool(api) as AnyAgentTool);
  },
});
