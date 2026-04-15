import { readJson, dataPath } from "@/lib/file-io";

interface YouTubeTokens {
  access_token?: string;
  refresh_token?: string;
}

export async function GET() {
  const tokens = readJson<YouTubeTokens>(dataPath("youtube-token.json"));
  if (!tokens || !tokens.access_token) {
    return Response.json({ connected: false });
  }
  return Response.json({ connected: true, hasRefreshToken: Boolean(tokens.refresh_token) });
}
