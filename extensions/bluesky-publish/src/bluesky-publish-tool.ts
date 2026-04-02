import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://bsky.social/xrpc";

type Config = { handle?: string; appPassword?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const handle = (typeof pluginCfg.handle === "string" && pluginCfg.handle.trim()) || process.env.BLUESKY_HANDLE || "";
  const appPassword = (typeof pluginCfg.appPassword === "string" && pluginCfg.appPassword.trim()) || process.env.BLUESKY_APPPASSWORD || "";
  if (!handle) throw new Error("Bluesky Publish credentials not configured.");
  return { handle, appPassword };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 300 characters." }),
  
}, { additionalProperties: false });

export function createBlueskyPublishTool(api: OpenClawPluginApi) {
  return {
    name: "bluesky_publish",
    label: "Bluesky Publish",
    description: "Publish posts to Bluesky via AT Protocol. Max 300 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 300) throw new Error(`Text exceeds 300 char limit (${text.length} chars).`);

      const { handle, appPassword } = resolveConfig(api);
      // Create session
      const sessResp = await fetch(`${API_BASE}/com.atproto.server.createSession`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle, password: appPassword }),
      });
      if (!sessResp.ok) throw new Error(`Bluesky auth failed: ${await sessResp.text()}`);
      const sess = await sessResp.json();
      // Create post
      const postResp = await fetch(`${API_BASE}/com.atproto.repo.createRecord`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.accessJwt}` },
        body: JSON.stringify({
          repo: sess.did, collection: "app.bsky.feed.post",
          record: { text, createdAt: new Date().toISOString(), "$type": "app.bsky.feed.post" },
        }),
      });
      if (!postResp.ok) throw new Error(`Bluesky post failed: ${await postResp.text()}`);
      const post = await postResp.json();
      return jsonResult({ success: true, uri: post.uri, cid: post.cid, textLength: text.length });
    },
  };
}
