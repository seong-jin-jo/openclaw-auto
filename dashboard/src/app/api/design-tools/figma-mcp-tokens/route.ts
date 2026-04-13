import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const body = await request.json();
  const accessToken = (body.mcpAccessToken || "").trim();
  const refreshToken = (body.mcpRefreshToken || "").trim();
  const clientId = (body.mcpClientId || "").trim();
  const clientSecret = (body.mcpClientSecret || "").trim();

  if (!accessToken) {
    return Response.json({ error: "Access Token required" }, { status: 400 });
  }

  // Save to design-tools.json
  const dt = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  if (!dt.figma) dt.figma = {};
  const figma = dt.figma as Record<string, unknown>;
  figma.mcpAccessToken = accessToken;
  figma.mcpRefreshToken = refreshToken;
  figma.mcpClientId = clientId;
  figma.mcpClientSecret = clientSecret;
  figma.mcpEnabled = true;
  writeJson(dataPath("design-tools.json"), dt);

  // Update openclaw.json with MCP server + auth header
  const ocPath = configPath("openclaw.json");
  const config = readJson<Record<string, unknown>>(ocPath) || {};
  if (!config.mcp) config.mcp = {};
  const mcp = config.mcp as Record<string, unknown>;
  if (!mcp.servers) mcp.servers = {};
  const servers = mcp.servers as Record<string, unknown>;

  servers.figma = {
    url: "https://mcp.figma.com/mcp",
    transport: "streamable-http",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  writeJson(ocPath, config);
  return Response.json({ ok: true });
}
