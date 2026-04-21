import { readJson, dataPath } from "@/lib/file-io";
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

function emptyDay(): DailyUsage {
  return { aiGenerations: 0, publications: 0, cronRuns: 0, apiCalls: 0 };
}

function sumDays(days: DailyUsage[]): DailyUsage {
  const result = emptyDay();
  for (const d of days) {
    result.aiGenerations += d.aiGenerations || 0;
    result.publications += d.publications || 0;
    result.cronRuns += d.cronRuns || 0;
    result.apiCalls += d.apiCalls || 0;
  }
  return result;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const filePath = path.join(dataPath(""), "usage.json");
  const data = readJson<UsageFile>(filePath) || { daily: {} };
  const daily = data.daily || {};

  const now = new Date();
  const todayStr = toDateStr(now);

  // This week (Mon-Sun)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - mondayOffset);
  const mondayStr = toDateStr(monday);

  // This month
  const monthStr = todayStr.slice(0, 7); // YYYY-MM

  const todayData = daily[todayStr] || emptyDay();

  const weekDays: DailyUsage[] = [];
  const monthDays: DailyUsage[] = [];

  for (const [dateStr, usage] of Object.entries(daily)) {
    if (dateStr >= mondayStr && dateStr <= todayStr) {
      weekDays.push(usage);
    }
    if (dateStr.startsWith(monthStr)) {
      monthDays.push(usage);
    }
  }

  // Build last 30 days for the daily breakdown
  const recentDaily: Record<string, DailyUsage> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = toDateStr(d);
    if (daily[ds]) {
      recentDaily[ds] = daily[ds];
    }
  }

  return Response.json({
    today: todayData,
    thisWeek: sumDays(weekDays),
    thisMonth: sumDays(monthDays),
    daily: recentDaily,
  });
}
