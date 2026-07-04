import { readJson, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { withTenant } from "@/lib/db";

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
  "telegram-publish", "discord-publish", "slack-publish", "line-publish", "naver-blog-publish",
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
  slack: { plugin: "slack-publish", keyField: "webhookUrl" },
  line: { plugin: "line-publish", keyField: "channelAccessToken" },
  naver_blog: { plugin: "naver-blog-publish", keyField: "blogId" },
};

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 테넌트별로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
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

  // Blog (sample-blog) — matches Flask exactly
  const bp = plugins["sample-blog"] || {};
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

  // OAuth "연결"은 테넌트 integrations 테이블에 저장된다(플러그인 config가 아님). 대시보드 "연결됨"
  // 배지가 이를 반영하도록, 해당 테넌트에 저장된 channel 토큰이 있으면 connected=true 로 보정한다.
  if (__t) {
    try {
      const rows = await withTenant(__t, (sql) => sql<{ label: string }[]>`
        SELECT label FROM integrations
        WHERE tenant_id = ${__t} AND kind = 'channel' AND secret_enc <> ''`);
      for (const { label } of rows) {
        const ch = channels[label];
        if (ch) {
          ch.connected = true;
          if (ch.status === "available" || ch.status === "soon" || !ch.status) {
            ch.status = ch.enabled ? "live" : "connected";
          }
        }
      }
    } catch { /* DB 미가용 시 파일 기반 상태 유지 */ }
  }

  return Response.json(channels);
  });
}
