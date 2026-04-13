import fs from "fs";
import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`<h2>Figma OAuth Error: ${error}</h2><p><a href='javascript:window.close()'>Close</a></p>`, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // Load stored state
  const oauthState = readJson<Record<string, string>>(dataPath("figma-oauth-state.json"));
  if (!oauthState || oauthState.state !== state) {
    return new Response("<h2>State mismatch</h2>", { status: 400, headers: { "Content-Type": "text/html" } });
  }

  try {
    const hostUrl = url.origin;
    const redirectUri = `${hostUrl}/api/figma-mcp/callback`;

    // Exchange code for tokens
    const tokenData = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: oauthState.clientId,
      client_secret: oauthState.clientSecret,
      code: code || "",
      redirect_uri: redirectUri,
      code_verifier: oauthState.codeVerifier,
    });

    const tokenResp = await fetch("https://api.figma.com/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "claude-cli/2.1.2 (external, cli)" },
      body: tokenData.toString(),
    });
    const tokens = await tokenResp.json();

    // Save tokens
    const dt = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
    if (!dt.figma) dt.figma = {};
    const figma = dt.figma as Record<string, unknown>;
    figma.mcpAccessToken = tokens.access_token;
    figma.mcpRefreshToken = tokens.refresh_token || "";
    figma.mcpClientId = oauthState.clientId;
    figma.mcpClientSecret = oauthState.clientSecret;
    figma.mcpEnabled = true;
    writeJson(dataPath("design-tools.json"), dt);

    // Update openclaw.json
    const ocPath = configPath("openclaw.json");
    const config = readJson<Record<string, unknown>>(ocPath) || {};
    if (!config.mcp) config.mcp = {};
    const mcp = config.mcp as Record<string, unknown>;
    if (!mcp.servers) mcp.servers = {};
    const servers = mcp.servers as Record<string, unknown>;
    servers.figma = {
      url: "https://mcp.figma.com/mcp",
      transport: "streamable-http",
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    };
    writeJson(ocPath, config);

    // Cleanup
    try { fs.unlinkSync(dataPath("figma-oauth-state.json")); } catch { /* ok */ }

    const html = `<html><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh">
    <div style="text-align:center">
      <h2 style="color:#22c55e">Figma MCP 연결 완료!</h2>
      <p style="color:#9ca3af">이 탭을 닫고 대시보드로 돌아가세요.</p>
      <p style="color:#6b7280;font-size:12px">Gateway 재시작 후 사용 가능</p>
    </div></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  } catch (e) {
    return new Response(`<h2>Token exchange failed: ${e}</h2>`, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
