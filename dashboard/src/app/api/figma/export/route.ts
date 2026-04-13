import { readJson, dataPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const data = await request.json();
  const fileKey = data.fileKey || "";
  const nodeIds = data.nodeIds || "";

  const dt = readJson<Record<string, unknown>>(dataPath("design-tools.json")) || {};
  const figma = (dt.figma || {}) as Record<string, unknown>;
  const token = (figma.accessToken as string) || "";

  if (!token) return Response.json({ error: "Figma token not set" }, { status: 400 });
  if (!fileKey) return Response.json({ error: "fileKey required" }, { status: 400 });

  try {
    let url = `https://api.figma.com/v1/images/${fileKey}?format=png&scale=2`;
    if (nodeIds) url += `&ids=${nodeIds}`;

    const resp = await fetch(url, { headers: { "X-Figma-Token": token } });
    const result = await resp.json();
    return Response.json({ success: true, images: result.images || {} });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}
