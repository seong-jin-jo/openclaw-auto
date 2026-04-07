import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createMidjourneyImageTool } from "./src/midjourney-tool.js";

export default definePluginEntry({
  id: "midjourney-image",
  name: "Midjourney Image",
  description: "Generate images via Midjourney Discord bot",
  register(api) {
    api.registerTool(createMidjourneyImageTool(api) as AnyAgentTool);
  },
});
