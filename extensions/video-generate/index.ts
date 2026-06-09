import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createVideoGenerateTool } from "./src/video-generate-tool.js";

export default definePluginEntry({
  id: "video-generate",
  name: "Video Generate",
  description: "Generate short-form videos (Shorts/Reels/TikTok) for the one-source-multi-use pipeline",
  register(api) {
    api.registerTool(createVideoGenerateTool(api) as AnyAgentTool);
  },
});
