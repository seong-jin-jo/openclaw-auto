import { readJson, configPath } from "@/lib/file-io";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { enabled?: boolean; config?: Record<string, string> }>;
  };
}

export async function GET(request: Request) {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const ytCfg = config.plugins?.entries?.["youtube-publish"]?.config || {};

  const { searchParams } = new URL(request.url);
  const clientId = ytCfg.clientId || searchParams.get("clientId") || "";

  if (!clientId) {
    return Response.json({
      error: "YouTube OAuth Client ID not configured. Set it in YouTube Settings.",
    });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/youtube/callback`;
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=https://www.googleapis.com/auth/youtube.upload` +
    `&access_type=offline` +
    `&prompt=consent`;

  return Response.json({ authUrl, redirectUri });
}
