import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createYoutubePublishTool } from "./src/youtube-publish-tool.js";

export default definePluginEntry({
  id: "youtube-publish",
  name: "YouTube Publish",
  description: "Upload videos to YouTube via Data API v3 (video file required, community posts not supported)",
  register(api) {
    api.registerTool(createYoutubePublishTool(api) as AnyAgentTool);
  },
});
