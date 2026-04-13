import { readJson, writeJson, dataPath } from "@/lib/file-io";

const DEFAULT_SETTINGS: Record<string, number> = {
  viralThreshold: 500,
  minLikes: 10,
  searchDays: 7,
  maxPopularPosts: 30,
  insightsIntervalHours: 24,
  insightsMaxCollections: 3,
  publishIntervalHours: 2,
  draftsPerBatch: 5,
  imagePerBatch: 1,
  casualPerBatch: 1,
  quotePerBatch: 0,
};

function readSettings(): Record<string, number> {
  const saved = readJson<Record<string, number>>(dataPath("settings.json")) || {};
  return { ...DEFAULT_SETTINGS, ...saved };
}

export { readSettings, DEFAULT_SETTINGS };

export async function GET() {
  return Response.json(readSettings());
}

export async function POST(request: Request) {
  const data = await request.json();
  const current = readSettings();
  const allowedKeys = new Set(Object.keys(DEFAULT_SETTINGS));
  const updated: Record<string, number> = {};

  for (const key of allowedKeys) {
    if (key in data) {
      const val = data[key];
      if (typeof val === "number" && val >= 0) {
        updated[key] = Math.floor(val);
      }
    }
  }

  Object.assign(current, updated);
  writeJson(dataPath("settings.json"), current);
  return Response.json({ ok: true, settings: current });
}
