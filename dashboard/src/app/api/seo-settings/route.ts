import { readJson, writeJson, dataPath } from "@/lib/file-io";

const DEFAULT_SEO_SETTINGS = {
  googleSearchConsole: { metaTag: "", sitemapUrl: "", registered: false },
  naverSearchAdvisor: { metaTag: "", sitemapUrl: "", registered: false },
};

export async function GET() {
  const settings = readJson(dataPath("seo-settings.json")) || DEFAULT_SEO_SETTINGS;
  return Response.json(settings);
}

export async function POST(request: Request) {
  const data = await request.json();
  writeJson(dataPath("seo-settings.json"), data);
  return Response.json({ ok: true });
}
