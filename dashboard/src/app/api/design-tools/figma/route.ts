import { readJson, writeJson, dataPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const body = await request.json();
  const data = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  const existing = (data.figma || {}) as Record<string, unknown>;
  data.figma = {
    accessToken: body.accessToken || existing.accessToken || "",
    mcpEnabled: existing.mcpEnabled || false,
  };
  writeJson(dataPath("design-tools.json"), data);
  return Response.json({ ok: true });
}
