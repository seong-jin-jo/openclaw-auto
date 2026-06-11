import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createSyncInsightsTool } from "./src/sync-insights-tool.js";

export default definePluginEntry({
  id: "sync-insights",
  name: "Sync Insights",
  description: "로컬 insights를 Supabase로 단방향 upsert",
  register(api) {
    api.registerTool(createSyncInsightsTool(api) as AnyAgentTool);
  },
});
