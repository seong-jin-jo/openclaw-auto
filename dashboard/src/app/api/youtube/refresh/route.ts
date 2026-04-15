import { readJson, writeJson, configPath, dataPath } from "@/lib/file-io";

interface YouTubeTokens {
  access_token?: string;
  refresh_token?: string;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

export async function POST() {
  const tokens = readJson<YouTubeTokens>(dataPath("youtube-token.json"));
  if (!tokens || !tokens.refresh_token) {
    return Response.json({ error: "No refresh token" }, { status: 400 });
  }

  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const ytCfg = config.plugins?.entries?.["youtube-publish"]?.config || {};
  const clientId = ytCfg.clientId || "";
  const clientSecret = ytCfg.clientSecret || "";

  try {
    const body = new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const newTokens = await res.json();
    tokens.access_token = newTokens.access_token;
    writeJson(dataPath("youtube-token.json"), tokens);

    // Update openclaw.json
    if (config.plugins?.entries?.["youtube-publish"]?.config) {
      config.plugins.entries["youtube-publish"].config.accessToken = newTokens.access_token;
      writeJson(configPath("openclaw.json"), config);
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
