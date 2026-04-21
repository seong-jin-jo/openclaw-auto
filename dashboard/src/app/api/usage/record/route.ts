import { readJson, writeJson, dataPath } from "@/lib/file-io";
import path from "path";

interface DailyUsage {
  aiGenerations: number;
  publications: number;
  cronRuns: number;
  apiCalls: number;
}

interface UsageFile {
  daily: Record<string, DailyUsage>;
}

const VALID_EVENTS = ["aiGeneration", "publication", "cronRun", "apiCall"] as const;
type EventType = (typeof VALID_EVENTS)[number];

const EVENT_TO_FIELD: Record<EventType, keyof DailyUsage> = {
  aiGeneration: "aiGenerations",
  publication: "publications",
  cronRun: "cronRuns",
  apiCall: "apiCalls",
};

function emptyDay(): DailyUsage {
  return { aiGenerations: 0, publications: 0, cronRuns: 0, apiCalls: 0 };
}

export async function POST(req: Request) {
  let body: { event?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as EventType;
  if (!event || !VALID_EVENTS.includes(event)) {
    return Response.json(
      { error: `Invalid event. Must be one of: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const count = typeof body.count === "number" && body.count > 0 ? body.count : 1;
  const filePath = path.join(dataPath(""), "usage.json");
  const data = readJson<UsageFile>(filePath) || { daily: {} };
  if (!data.daily) data.daily = {};

  const todayStr = new Date().toISOString().slice(0, 10);
  if (!data.daily[todayStr]) {
    data.daily[todayStr] = emptyDay();
  }

  const field = EVENT_TO_FIELD[event];
  data.daily[todayStr][field] += count;

  // Prune entries older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const dateStr of Object.keys(data.daily)) {
    if (dateStr < cutoffStr) {
      delete data.daily[dateStr];
    }
  }

  writeJson(filePath, data);

  return Response.json({ ok: true, date: todayStr, field, newValue: data.daily[todayStr][field] });
}
