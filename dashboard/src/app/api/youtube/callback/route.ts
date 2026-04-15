import { readJson, writeJson, configPath, dataPath } from "@/lib/file-io";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code") || "";
  if (!code) {
    return new Response("Authorization failed - no code", { status: 400 });
  }

  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const ytCfg = config.plugins?.entries?.["youtube-publish"]?.config || {};
  const clientId = ytCfg.clientId || "";
  const clientSecret = ytCfg.clientSecret || "";
  const redirectUri = `${origin}/api/youtube/callback`;

  try {
    const body = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const tokens = await tokenRes.json();

    writeJson(dataPath("youtube-token.json"), tokens);

    // Update openclaw.json
    if (!config.plugins) config.plugins = { entries: {} };
    if (!config.plugins.entries) config.plugins.entries = {};
    const entry = config.plugins.entries["youtube-publish"] || { enabled: true, config: {} };
    if (!entry.config) entry.config = {};
    entry.config.accessToken = tokens.access_token || "";
    entry.enabled = true;
    config.plugins.entries["youtube-publish"] = entry;
    writeJson(configPath("openclaw.json"), config);

    const html = `<html><body style="background:#0a0a0a;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="text-align:center"><h2>YouTube Connected!</h2><p style="color:#888">Close this window and return to dashboard.</p>
      <script>setTimeout(()=>window.close(),2000)</script></div></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return new Response(`Authorization failed: ${e}`, { status: 500 });
  }
}
