import { readJson, writeJson, configPath } from "@/lib/file-io";

interface CronJob {
  name: string;
  enabled?: boolean;
  [key: string]: unknown;
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
  const enabled = typeof data.enabled === "boolean" ? data.enabled : !job.enabled;
  job.enabled = enabled;

  writeJson(cronPath, cronData);
  return Response.json({ ok: true, enabled });
}
