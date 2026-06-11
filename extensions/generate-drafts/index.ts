import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createGenerateDraftsTool } from "./src/generate-drafts-tool.js";

export default definePluginEntry({
  id: "generate-drafts",
  name: "Generate Drafts",
  description: "brand_guides + viral_signals 기반 자동초안 생성 → drafts(status=draft)",
  register(api) {
    api.registerTool(createGenerateDraftsTool(api) as AnyAgentTool);
  },
});
