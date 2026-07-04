import { readJson, writeJson, configPath } from "@/lib/file-io";
import { verifyChannel } from "@/lib/verify-channel";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { withTenant } from "@/lib/db";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

// 수동 입력 키를 대시보드 "직접 발행"(publish.ts getChannelCred)이 읽는 integrations 테이블로 브리지한다.
// openclaw.json(위)은 게이트웨이 extension 경로용, integrations(아래)는 대시보드 직접 발행용 —
// 같은 키를 두 곳에 채워야 UI 수동입력 → /api/publish 경로가 끊기지 않는다.
// getChannelCred가 이해하는 채널(직접발행 함수 존재)만 대상: threads/instagram/x/facebook.
// 그 외(telegram/discord/slack/line/naver_blog/tiktok/linkedin/pinterest/tumblr/youtube)는
// 직접발행 함수가 없어 게이트웨이 extension(openclaw.json)만으로 발행 → 브리지 불필요.
function toIntegration(channel: string, cfg: Record<string, string>): { secret: string; meta: Record<string, unknown> } | null {
  if (channel === "threads") return { secret: cfg.accessToken || "", meta: { userId: cfg.userId || null, api: "threads_login" } };
  if (channel === "instagram") return { secret: cfg.accessToken || "", meta: { userId: cfg.userId || null, api: "instagram_login" } };
  if (channel === "facebook") return { secret: cfg.accessToken || "", meta: { userId: cfg.pageId || null, api: "facebook_graph" } };
  if (channel === "x") {
    // X는 4키 OAuth1.0a — token 컬럼 미사용, 4키를 meta에 적재(publish.ts의 X 발행이 소비).
    return { secret: "", meta: { apiKey: cfg.apiKey || null, apiKeySecret: cfg.apiKeySecret || null, accessToken: cfg.accessToken || null, accessTokenSecret: cfg.accessTokenSecret || null, api: "x_oauth1" } };
  }
  return null;
}

async function bridgeToIntegrations(tenantId: string | null, channel: string, cfg: Record<string, string>, saved: boolean): Promise<void> {
  if (!tenantId || !saved) return; // 검증 실패(키 미저장)면 브리지 안 함
  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return; // 암호화 키 없으면 DB 저장 불가(openclaw.json 게이트웨이 경로는 이미 기록됨)
  const m = toIntegration(channel, cfg);
  if (!m) return; // 직접발행 미지원 채널 — 게이트웨이 extension만(브리지 대상 아님)
  try {
    await withTenant(tenantId, (sql) => sql`
      INSERT INTO integrations (tenant_id, kind, label, secret_enc, meta)
      VALUES (${tenantId}, 'channel', ${channel},
              armor(pgp_sym_encrypt(${m.secret}, ${key})),
              ${sql.json(m.meta as Parameters<typeof sql.json>[0])})
      ON CONFLICT (tenant_id, kind, label) DO UPDATE
        SET secret_enc = EXCLUDED.secret_enc, meta = EXCLUDED.meta`);
  } catch { /* DB 미가용 — openclaw.json(게이트웨이)만으로 진행(파일 기반 상태 유지) */ }
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
  blog: "sample-blog",
};

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 테넌트별로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
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
    await bridgeToIntegrations(__t, "threads", tpCfg, result.verified || !!result.unverified);
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
    await bridgeToIntegrations(__t, "x", xp.config || {}, result.verified || !!result.unverified);
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
  // facebook/instagram은 직접발행 대상 → integrations 브리지(toIntegration이 그 외 채널은 null로 무시).
  await bridgeToIntegrations(__t, channel, p.config || {}, result.verified || !!result.unverified);
  return Response.json({ ok: true, enabled: p.enabled, ...result });
  });
}
