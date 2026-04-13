import { readJson, writeJson, dataPath } from "@/lib/file-io";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const hostUrl = new URL(request.url).origin;
    const redirectUri = `${hostUrl}/api/figma-mcp/callback`;

    // 1. Register OAuth client with Figma
    const regData = JSON.stringify({
      client_name: "Claude Code",
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    });

    const regResp = await fetch("https://api.figma.com/v1/oauth/mcp/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "claude-cli/2.1.2 (external, cli)" },
      body: regData,
    });
    const reg = await regResp.json();
    const clientId = reg.client_id;
    const clientSecret = reg.client_secret || "";

    // 2. Generate PKCE
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    // Store in temp file
    writeJson(dataPath("figma-oauth-state.json"), {
      clientId, clientSecret, codeVerifier, state,
    });

    // 3. Build auth URL
    const authUrl =
      `https://www.figma.com/oauth/mcp?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code&scope=mcp:connect&state=${state}` +
      `&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    return Response.json({ authUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 300) }, { status: 500 });
  }
}
