import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://api.pinterest.com/v5";

type Config = { accessToken?: string; boardId?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.PINTEREST_ACCESSTOKEN || "";
  const boardId = (typeof pluginCfg.boardId === "string" && pluginCfg.boardId.trim()) || process.env.PINTEREST_BOARDID || "";
  if (!accessToken) throw new Error("Pinterest Publish credentials not configured.");
  return { accessToken, boardId };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 500 characters." }),
  image_url: Type.Optional(Type.String({ description: 'Public image URL to attach.' })),
}, { additionalProperties: false });

export function createPinterestPublishTool(api: OpenClawPluginApi) {
  return {
    name: "pinterest_publish",
    label: "Pinterest Publish",
    description: "Create Pins on Pinterest via Content API v5. Max 500 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 500) throw new Error(`Text exceeds 500 char limit (${text.length} chars).`);

      const { accessToken, boardId } = resolveConfig(api);
      const imageUrl = readStringParam(rawParams, "image_url");
      if (!imageUrl) throw new Error("Pinterest requires an image_url.");
      const resp = await fetch(`${API_BASE}/pins`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: boardId, title: text.slice(0, 100), description: text, media_source: { source_type: "image_url", url: imageUrl } }),
      });
      if (!resp.ok) throw new Error(`Pinterest pin failed: ${await resp.text()}`);
      const data = await resp.json();
      return jsonResult({ success: true, pinId: data.id, textLength: text.length });
    },
  };
}
