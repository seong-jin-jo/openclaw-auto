import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const API_BASE = "https://api.linkedin.com/v2";

type Config = { accessToken?: string; personUrn?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.LINKEDIN_ACCESSTOKEN || "";
  const personUrn = (typeof pluginCfg.personUrn === "string" && pluginCfg.personUrn.trim()) || process.env.LINKEDIN_PERSONURN || "";
  if (!accessToken) throw new Error("LinkedIn Publish credentials not configured.");
  return { accessToken, personUrn };
}

const ToolSchema = Type.Object({
  text: Type.String({ description: "Text content to publish. Max 3000 characters." }),
  
}, { additionalProperties: false });

export function createLinkedinPublishTool(api: OpenClawPluginApi) {
  return {
    name: "linkedin_publish",
    label: "LinkedIn Publish",
    description: "Publish posts to LinkedIn via Community Management API (Partner Program required). Max 3000 chars.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 3000) throw new Error(`Text exceeds 3000 char limit (${text.length} chars).`);

      const { accessToken, personUrn } = resolveConfig(api);
      const resp = await fetch(`${API_BASE}/ugcPosts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
        body: JSON.stringify({
          author: personUrn, lifecycleState: "PUBLISHED",
          specificContent: { "com.linkedin.ugc.ShareContent": { shareCommentary: { text }, shareMediaCategory: "NONE" } },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        }),
      });
      if (!resp.ok) throw new Error(`LinkedIn post failed: ${await resp.text()}`);
      const data = await resp.json();
      return jsonResult({ success: true, postId: data.id, textLength: text.length });
    },
  };
}
