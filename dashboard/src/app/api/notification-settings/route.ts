import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/constants";

const SETTINGS_PATH = dataPath("notification-settings.json");

export async function GET() {
  const saved = readJson<Record<string, unknown>>(SETTINGS_PATH) || {};
  return Response.json({ ...DEFAULT_NOTIFICATION_SETTINGS, ...saved });
}

export async function POST(request: Request) {
  const data = await request.json();
  const current = readJson<Record<string, unknown>>(SETTINGS_PATH) || {};

  for (const key of Object.keys(DEFAULT_NOTIFICATION_SETTINGS)) {
    if (key in data && typeof data[key] === "object") {
      current[key] = data[key];
    }
  }

  writeJson(SETTINGS_PATH, current);
  return Response.json({ ok: true });
}
