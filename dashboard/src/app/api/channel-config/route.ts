import { readJson, configPath } from "@/lib/file-io";

interface PluginEntry {
  enabled?: boolean;
  config?: Record<string, string>;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, PluginEntry>;
  };
}

const IMPLEMENTED_PLUGINS = new Set([
  "facebook-publish", "bluesky-publish", "instagram-publish", "linkedin-publish",
  "pinterest-publish", "tumblr-publish", "tiktok-publish", "youtube-publish",
  "telegram-publish", "discord-publish", "line-publish", "naver-blog-publish",
]);

const OTHER_CHANNELS: Record<string, { plugin: string; keyField: string }> = {
  facebook: { plugin: "facebook-publish", keyField: "accessToken" },
  bluesky: { plugin: "bluesky-publish", keyField: "handle" },
  instagram: { plugin: "instagram-publish", keyField: "accessToken" },
  linkedin: { plugin: "linkedin-publish", keyField: "accessToken" },
  pinterest: { plugin: "pinterest-publish", keyField: "accessToken" },
  tumblr: { plugin: "tumblr-publish", keyField: "consumerKey" },
  tiktok: { plugin: "tiktok-publish", keyField: "accessToken" },
  youtube: { plugin: "youtube-publish", keyField: "accessToken" },
  telegram: { plugin: "telegram-publish", keyField: "botToken" },
  discord: { plugin: "discord-publish", keyField: "webhookUrl" },
  line: { plugin: "line-publish", keyField: "channelAccessToken" },
  naver_blog: { plugin: "naver-blog-publish", keyField: "blogId" },
};

export async function GET() {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const plugins = config.plugins?.entries || {};
  const channels: Record<string, Record<string, unknown>> = {};

  // Threads — special handling (matches Flask exactly)
  const tp = plugins["threads-publish"] || {};
  const tCfg = tp.config || {};
  const tToken = tCfg.accessToken || "";
  const tUid = tCfg.userId || "";
  channels.threads = {
    enabled: tp.enabled ?? false,
    userId: tUid,
    username: "", // loaded lazily via /api/threads-username
    connected: Boolean(tToken),
    keys: { accessToken: tToken, userId: tUid },
  };

  // X — special handling (matches Flask exactly)
  const xp = plugins["x-publish"] || {};
  const xCfg = xp.config || {};
  channels.x = {
    enabled: xp.enabled ?? false,
    connected: Boolean(xCfg.apiKey || ""),
    keys: {
      apiKey: xCfg.apiKey || "",
      apiKeySecret: xCfg.apiKeySecret || "",
      accessToken: xCfg.accessToken || "",
      accessTokenSecret: xCfg.accessTokenSecret || "",
    },
  };

  // All other channels (matches Flask exactly)
  for (const [chKey, chInfo] of Object.entries(OTHER_CHANNELS)) {
    const p = plugins[chInfo.plugin] || {};
    const pCfg = p.config || {};
    const hasExt = IMPLEMENTED_PLUGINS.has(chInfo.plugin);
    const hasKey = Boolean(pCfg[chInfo.keyField] || "");

    let status: string;
    if (hasKey && p.enabled) status = "live";
    else if (hasKey) status = "connected";
    else if (hasExt) status = "available";
    else status = "soon";

    // Filter to string values only (matches Flask: {k: v for k, v in p_cfg.items() if isinstance(v, str)})
    const keys: Record<string, string> = {};
    for (const [k, v] of Object.entries(pCfg)) {
      if (typeof v === "string") keys[k] = v;
    }

    channels[chKey] = {
      status,
      enabled: p.enabled ?? false,
      connected: hasKey,
      keys,
    };
  }

  // Blog (dedu-blog) — matches Flask exactly
  const bp = plugins["dedu-blog"] || {};
  const bCfg = bp.config || {};
  const bEmail = bCfg.email || "";
  const bKeys: Record<string, string> = {};
  for (const [k, v] of Object.entries(bCfg)) {
    if (typeof v === "string") bKeys[k] = v;
  }
  channels.blog = {
    enabled: bp.enabled ?? false,
    connected: Boolean(bEmail),
    apiBaseUrl: bCfg.apiBaseUrl || "",
    email: bEmail,
    password: bCfg.password || "",
    keys: bKeys,
  };

  return Response.json(channels);
}
