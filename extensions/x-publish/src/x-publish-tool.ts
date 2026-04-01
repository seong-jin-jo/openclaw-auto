import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const X_API_BASE = "https://api.twitter.com/2";

type XPublishConfig = {
  apiKey?: string;
  apiKeySecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
};

function resolveConfig(api: OpenClawPluginApi): {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
} {
  const pluginCfg = (api.pluginConfig ?? {}) as XPublishConfig;
  const apiKey =
    (typeof pluginCfg.apiKey === "string" && pluginCfg.apiKey.trim()) ||
    process.env.X_API_KEY ||
    "";
  const apiKeySecret =
    (typeof pluginCfg.apiKeySecret === "string" && pluginCfg.apiKeySecret.trim()) ||
    process.env.X_API_KEY_SECRET ||
    "";
  const accessToken =
    (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) ||
    process.env.X_ACCESS_TOKEN ||
    "";
  const accessTokenSecret =
    (typeof pluginCfg.accessTokenSecret === "string" && pluginCfg.accessTokenSecret.trim()) ||
    process.env.X_ACCESS_TOKEN_SECRET ||
    "";

  if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      "X API credentials not configured. Set X_API_KEY, X_API_KEY_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET env vars or configure in plugin settings.",
    );
  }
  return { apiKey, apiKeySecret, accessToken, accessTokenSecret };
}

// OAuth 1.0a signature generation
function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  apiKeySecret: string,
  accessTokenSecret: string,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");

  const signatureBase = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(sortedParams)}`;
  const signingKey = `${percentEncode(apiKeySecret)}&${percentEncode(accessTokenSecret)}`;

  return crypto
    .createHmac("sha1", signingKey)
    .update(signatureBase)
    .digest("base64");
}

function buildOAuthHeader(
  method: string,
  url: string,
  config: ReturnType<typeof resolveConfig>,
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: config.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: config.accessToken,
    oauth_version: "1.0",
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    config.apiKeySecret,
    config.accessTokenSecret,
  );
  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(", ");

  return `OAuth ${headerParts}`;
}

const XPublishToolSchema = Type.Object(
  {
    text: Type.String({
      description: "The text content to publish on X (Twitter). Max 280 characters.",
    }),
  },
  { additionalProperties: false },
);

export function createXPublishTool(api: OpenClawPluginApi) {
  return {
    name: "x_publish",
    label: "X Publish",
    description:
      "Publish a text tweet to X (Twitter) via API v2. Max 280 characters.",
    parameters: XPublishToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 280) {
        throw new Error(`Text exceeds 280 character limit (${text.length} chars).`);
      }

      const config = resolveConfig(api);
      const url = `${X_API_BASE}/tweets`;
      const authHeader = buildOAuthHeader("POST", url, config);

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`X tweet creation failed (${resp.status}): ${err}`);
      }

      const data = (await resp.json()) as { data: { id: string; text: string } };

      return jsonResult({
        success: true,
        tweetId: data.data.id,
        textLength: text.length,
      });
    },
  };
}
