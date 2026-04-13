import { readJson, writeJson, configPath } from "@/lib/file-io";

interface CronJob {
  id: string;
  name: string;
  enabled?: boolean;
  schedule?: { everyMs?: number };
  state?: Record<string, unknown>;
  payload?: Record<string, unknown>;
}
interface CronData { jobs: CronJob[] }

export async function POST(request: Request, { params }: { params: Promise<{ jobName: string }> }) {
  const { jobName } = await params;
  const cronPath = configPath("cron", "jobs.json");
  const cronData = readJson<CronData>(cronPath);
  if (!cronData) return Response.json({ error: "cron jobs not found" }, { status: 404 });

  const job = cronData.jobs.find((j) => j.name === jobName);
  if (!job) return Response.json({ error: "job not found" }, { status: 404 });

  const data = await request.json();
  const hours = data.hours;
  if (typeof hours !== "number" || hours < 1 || hours > 168) {
    return Response.json({ error: "hours must be between 1 and 168" }, { status: 400 });
  }

  // Re-read to avoid stale data
  const freshData = readJson<CronData>(cronPath);
  if (freshData) {
    for (const j of freshData.jobs) {
      if (j.id === job.id) {
        if (!j.schedule) j.schedule = {};
        j.schedule.everyMs = Math.floor(hours) * 3600 * 1000;
        break;
      }
    }
    writeJson(cronPath, freshData);
  }

  return Response.json({ ok: true, hours });
}
