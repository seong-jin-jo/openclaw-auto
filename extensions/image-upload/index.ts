import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createImageUploadTool } from "./src/image-upload-tool.js";

export default definePluginEntry({
  id: "image-upload",
  name: "Image Upload",
  description: "Upload images to Cloudflare R2 for public URLs",
  register(api) {
    api.registerTool(createImageUploadTool(api) as AnyAgentTool);
  },
});
