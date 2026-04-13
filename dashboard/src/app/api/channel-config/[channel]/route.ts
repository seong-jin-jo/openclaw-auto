import { readJson, writeJson, configPath } from "@/lib/file-io";
import { verifyChannel } from "@/lib/verify-channel";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

const PLUGIN_MAP: Record<string, string> = {
  threads: "threads-publish",
  x: "x-publish",
  facebook: "facebook-publish",
  bluesky: "bluesky-publish",
  instagram: "instagram-publish",
  linkedin: "linkedin-publish",
  pinterest: "pinterest-publish",
  tumblr: "tumblr-publish",
  tiktok: "tiktok-publish",
  youtube: "youtube-publish",
  telegram: "telegram-publish",
  discord: "discord-publish",
  slack: "slack-publish",
  line: "line-publish",
  naver_blog: "naver-blog-publish",
  blog: "dedu-blog",
};

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const data = await request.json();
  const cfgPath = configPath("openclaw.json");
  const config = readJson<OpenClawConfig>(cfgPath);
  if (!config) return Response.json({ error: "openclaw.json not found" }, { status: 404 });

  // Threads: update multiple plugins
  if (channel === "threads") {
    const plugins = (config.plugins ??= {}).entries ??= {};
    for (const pname of ["threads-publish", "threads-insights", "threads-search", "threads-growth"]) {
      const p = (plugins[pname] ??= { enabled: true, config: {} });
      if (!p.config) p.config = {};
      if (typeof data.accessToken === "string" && data.accessToken.trim()) {
        p.config.accessToken = data.accessToken.trim();
      }
      if (typeof data.userId === "string" && data.userId.trim()) {
        p.config.userId = data.userId.trim();
      }
    }
    const tpCfg = plugins["threads-publish"]?.config || {};
    const result = await verifyChannel("threads", tpCfg);
    for (const pname of ["threads-publish", "threads-insights", "threads-search", "threads-growth"]) {
      if (plugins[pname]) plugins[pname].enabled = result.verified;
    }
    writeJson(cfgPath, config);
    return Response.json({ ok: true, ...result });
  }

  // X: custom key mapping
  if (channel === "x") {
    const plugins = (config.plugins ??= {}).entries ??= {};
    const xp = (plugins["x-publish"] ??= { enabled: false, config: {} });
    if (!xp.config) xp.config = {};
    for (const key of ["apiKey", "apiKeySecret", "accessToken", "accessTokenSecret"]) {
      if (typeof data[key] === "string" && data[key].trim()) {
        xp.config[key] = data[key].trim();
      }
    }
    const result = await verifyChannel("x", xp.config || {});
    xp.enabled = result.verified;
    writeJson(cfgPath, config);
    return Response.json({ ok: true, ...result });
  }

  // Generic channel
  const pluginName = PLUGIN_MAP[channel];
  if (!pluginName) {
    return Response.json({ error: `Unknown channel: ${channel}` }, { status: 400 });
  }

  const plugins = (config.plugins ??= {}).entries ??= {};
  const p = (plugins[pluginName] ??= { enabled: false, config: {} });
  if (!p.config) p.config = {};

  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "string" && val.trim()) {
      p.config[key] = val.trim();
    }
  }

  const result = await verifyChannel(channel, p.config || {});
  p.enabled = result.verified;
  writeJson(cfgPath, config);
  return Response.json({ ok: true, enabled: p.enabled, ...result });
}
