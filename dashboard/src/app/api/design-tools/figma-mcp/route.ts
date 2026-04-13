import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const body = await request.json();
  const enabled = !!body.enabled;

  // Update design-tools.json
  const dt = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  if (!dt.figma) dt.figma = {};
  (dt.figma as Record<string, unknown>).mcpEnabled = enabled;
  writeJson(dataPath("design-tools.json"), dt);

  // Update openclaw.json mcp.servers
  const ocPath = configPath("openclaw.json");
  const config = readJson<Record<string, unknown>>(ocPath) || {};
  if (!config.mcp) config.mcp = {};
  const mcp = config.mcp as Record<string, unknown>;
  if (!mcp.servers) mcp.servers = {};
  const servers = mcp.servers as Record<string, unknown>;

  if (enabled) {
    servers.figma = {
      url: "https://mcp.figma.com/mcp",
      transport: "streamable-http",
    };
  } else {
    delete servers.figma;
  }

  writeJson(ocPath, config);
  return Response.json({ ok: true, mcpEnabled: enabled });
}
