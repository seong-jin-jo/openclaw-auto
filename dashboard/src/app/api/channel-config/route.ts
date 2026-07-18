import { readJson, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { withTenant } from "@/lib/db";
import { maskConfigSecrets } from "@/lib/secret-mask";

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
  // 테넌트 컨텍스트로 감싸 파일 I/O를 테넌트별로 격리.
  // tenant_id 쿼리 파라미터는 fallback으로만 존중된다 — 로그인 세션/토큰/Host로 테넌트가
  // 먼저 해석되면(고객·포크) 파라미터는 무시되므로 고객이 남의 테넌트를 조회할 수 없다.
  // 세션이 없는 운영자(DASHBOARD_AUTH_TOKEN)만 fallback 파라미터로 임의 테넌트 조회 가능.
  // (metrics/studio 라우트와 동일한 확립된 패턴.)
  const __t = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
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
    keys: maskConfigSecrets({ accessToken: tToken, userId: tUid }),
  };

  // X — special handling (matches Flask exactly)
  const xp = plugins["x-publish"] || {};
  const xCfg = xp.config || {};
  channels.x = {
    enabled: xp.enabled ?? false,
    connected: Boolean(xCfg.apiKey || ""),
    keys: maskConfigSecrets({
      apiKey: xCfg.apiKey || "",
      apiKeySecret: xCfg.apiKeySecret || "",
      accessToken: xCfg.accessToken || "",
      accessTokenSecret: xCfg.accessTokenSecret || "",
    }),
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
      keys: maskConfigSecrets(keys),
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
    password: bCfg.password ? "********" : "",
    keys: maskConfigSecrets(bKeys),
  };

  // OAuth "연결"은 테넌트 integrations 테이블에 저장된다(플러그인 config가 아님). 대시보드 "연결됨"
  // 배지가 이를 반영하도록, 해당 테넌트에 저장된 channel 토큰이 있으면 connected=true 로 보정한다.
  //
  // 2026-07-16 P0 QA 정정 — 예전엔 "secret_enc가 비어있지 않다"(has_secret)만으로 connected=true를
  // 세웠는데, 실측 결과 Instagram/Threads는 secret은 있지만(암호화 저장은 성공) 프로바이더가 실제로는
  // OAuth code 190(토큰 무효)을 리턴 — 사용자에게 "Connected"로 거짓 노출됐다. 여기서부터 instagram/
  // threads만 실제 read-only 계정 조회(GET /me)로 라이브 검증한다. 그 외 채널은 기존 stored-credential
  // 동작(secret 존재=connected) 유지 — 이번 패치 범위 아님.
  if (__t) {
    try {
      // instagram/threads는 이제부터 이 블록의 라이브 검증 결과가 유일한 진실원이다.
      // openclaw.json(파일 기반 config)에 과거 저장된 accessToken만으로 connected=true가 새지 않도록
      // DB 조회/검증 전에 먼저 false로 리셋한다 — integrations row가 아예 없거나(미연결) 검증에
      // 실패하면 아래에서 명시적으로만 true가 된다.
      channels.instagram = { ...(channels.instagram || {}), connected: false, connectionStatus: "unverified" };
      channels.threads = { ...(channels.threads || {}), connected: false, connectionStatus: "unverified" };

      const key = process.env.OSMU_SECRET_KEY || "";
      // OSMU_SECRET_KEY가 없으면 복호화 자체가 불가 — 토큰을 "유효"라고 주장하지 않고 미검증으로 마킹.
      const rows = await withTenant(__t, (sql) => sql<{ label: string; token: string | null; meta: Record<string, unknown> | null }[]>`
        SELECT label,
               CASE WHEN secret_enc <> '' AND ${key} <> ''
                    THEN pgp_sym_decrypt(dearmor(secret_enc), ${key}) ELSE NULL END AS token,
               meta
        FROM integrations
        WHERE tenant_id = ${__t} AND kind = 'channel' AND secret_enc <> ''`);

      const liveCheckable = new Set(["instagram", "threads"]);
      const toVerify: Array<{ label: string; token: string; userId: string }> = [];

      for (const { label, token, meta } of rows) {
        const ch = channels[label];
        if (!ch) continue;
        const m = (meta ?? {}) as Record<string, unknown>;
        const userId = typeof m.userId === "string" ? m.userId : "";

        if (liveCheckable.has(label)) {
          if (!key || !token) {
            // 복호화 불가(키 미설정) 또는 저장된 토큰 없음 — 유효를 주장하지 않는다.
            ch.connected = false;
            ch.connectionStatus = "unverified";
            ch.connectionError = key ? "no_token" : "server_key_missing";
            continue;
          }
          toVerify.push({ label, token, userId });
          continue; // 최종 connected/status는 아래 병렬 검증 결과로 확정
        }

        // instagram/threads 이외 채널 — 기존 stored-credential 동작 유지(이번 패치 범위 밖).
        ch.connected = true;
        if (ch.status === "available" || ch.status === "soon" || !ch.status) {
          ch.status = ch.enabled ? "live" : "connected";
        }
      }

      // Instagram/Threads read-only 계정 조회를 병렬로 — 각 5s 타임아웃. 토큰 원문은 응답/로그에 절대
      // 포함하지 않는다(fetch 결과 body를 그대로 리턴하지 않고 분류된 상태 문자열만 사용).
      if (toVerify.length) {
        await Promise.all(toVerify.map(async ({ label, token, userId }) => {
          const ch = channels[label];
          if (!ch) return;
          try {
            // threads는 id도 함께 조회 — 저장된 meta.userId가 이 토큰의 실제 계정과 같은지
            // 비교해야 한다(SNS-009: username 조회 성공만으로 valid 처리하면 저장 userId가
            // stale해도 "연결됨"으로 오판해 발행 시 잘못된 계정 URL로 400이 남).
            const url = label === "threads"
              ? `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(token)}`
              : `https://graph.instagram.com/v21.0/${encodeURIComponent(userId || "me")}?fields=username&access_token=${encodeURIComponent(token)}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (res.ok) {
              if (label === "threads") {
                let liveId = "";
                try { liveId = String((await res.json())?.id ?? ""); } catch { /* 아래에서 확인 불가로 처리 */ }
                if (!liveId) {
                  ch.connected = false;
                  ch.connectionStatus = "unverified";
                  ch.connectionError = "identity_unavailable";
                  ch.reconnectRequired = false;
                  return;
                }
                if (userId && userId !== liveId) {
                  ch.connected = false;
                  ch.status = "available";
                  ch.reconnectRequired = true;
                  ch.connectionStatus = "invalid";
                  ch.connectionError = "identity_mismatch";
                  return;
                }
              }
              ch.connected = true;
              ch.connectionStatus = "valid";
              ch.reconnectRequired = false;
              ch.connectionError = null;
              if (ch.status === "available" || ch.status === "soon" || !ch.status) {
                ch.status = ch.enabled ? "live" : "connected";
              }
              return;
            }
            // Meta Graph API 표준 에러 포맷: {error:{message,type:"OAuthException",code:190,...}}.
            // code/subcode는 파싱하되 원문 메시지·바디는 응답에 실지 않는다(https://developers.facebook.com/docs/graph-api/guides/error-handling/).
            let errCode: number | undefined;
            try {
              const body = await res.json();
              errCode = body?.error?.code;
            } catch { /* 본문 파싱 실패는 무시 — status로만 판정 */ }
            const isInvalidOAuth = res.status === 400 || res.status === 401 || errCode === 190;
            if (isInvalidOAuth) {
              ch.connected = false;
              ch.status = "available";
              ch.reconnectRequired = true;
              ch.connectionStatus = "invalid";
              ch.connectionError = "oauth_token_invalid";
            } else {
              // 5xx 등 프로바이더/네트워크 이상 — 저장된 토큰을 무효로 단정하지 않는다.
              ch.connected = false;
              ch.connectionStatus = "unverified";
              ch.connectionError = "provider_unreachable";
            }
          } catch {
            // fetch 자체 실패(타임아웃/네트워크) — 토큰을 지우거나 무효 판정하지 않는다.
            ch.connected = false;
            ch.connectionStatus = "unverified";
            ch.connectionError = "provider_unreachable";
          }
        }));
      }
    } catch { /* DB 미가용 시 파일 기반 상태 유지 */ }
  }

  return Response.json(channels);
  });
}
