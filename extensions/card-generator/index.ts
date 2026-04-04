import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createCardGeneratorTool } from "./src/card-generator-tool.js";

export default definePluginEntry({
  id: "card-generator",
  name: "Card Generator",
  description: "Generate card news images for Instagram/Shorts",
  register(api) {
    api.registerTool(createCardGeneratorTool(api) as AnyAgentTool);
  },
});
