import { readJson, dataPath } from "@/lib/file-io";
import { getGoogleAccessToken } from "@/lib/gsc-auth";

export async function POST(request: Request) {
  const keyData = readJson<Record<string, string>>(dataPath("gsc-service-account.json"));
  if (!keyData) return Response.json({ error: "GSC service account not configured" }, { status: 400 });

  const data = await request.json();
  const url = data.url || "";
  if (!url) return Response.json({ error: "url is required" }, { status: 400 });

  try {
    const accessToken = await getGoogleAccessToken(keyData, "https://www.googleapis.com/auth/indexing");
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ url, type: "URL_UPDATED" }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await res.json();
    return Response.json({ ok: true, url, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 500 });
  }
}
