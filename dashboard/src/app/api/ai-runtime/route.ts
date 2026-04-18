import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

interface RuntimeConfig {
  mode: "gateway" | "cli";
}

interface JobsJson {
  version: number;
  jobs: Array<Record<string, unknown>>;
}

interface UnifiedJob {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  everyMs: number;
  schedule: string;
  lastStatus: string | null;
  lastRun: string | null;
  lastError: string | null;
  model: string;
  cliPrompt: string;
}

function everyMsToCron(ms: number): string {
  const hours = Math.round(ms / 3600000);
  if (hours <= 0) return "0 */6 * * *";
  if (hours >= 168) return "0 0 * * 0";
  if (hours >= 24) return "0 0 * * *";
  return `0 */${hours} * * *`;
}

function cronToEveryMs(cron: string): number {
  const parts = cron.split(" ");
  if (parts[4] === "0") return 604800000;
  if (parts[1]?.includes("/")) return (parseInt(parts[1].split("/")[1]) || 6) * 3600000;
  if (parts[1] === "0") return 86400000;
  return 21600000;
}

function readJobs(): UnifiedJob[] {
  const data = readJson<JobsJson>(configPath("cron", "jobs.json"));
  const prompts = readJson<Record<string, string>>(dataPath("cli-prompts.json")) || {};
  if (!data?.jobs) return [];

  return data.jobs.map((j) => {
    const sched = (j.schedule as Record<string, unknown>) || {};
    const state = (j.state as Record<string, unknown>) || {};
    const payload = (j.payload as Record<string, unknown>) || {};
    const name = (j.name as string) || "";
    return {
      id: name,
      name,
      description: (j.description as string) || name,
      enabled: (j.enabled as boolean) ?? false,
      everyMs: (sched.everyMs as number) || 21600000,
      schedule: everyMsToCron((sched.everyMs as number) || 21600000),
      lastStatus: (state.lastStatus as string) || null,
      lastRun: state.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null,
      lastError: (state.lastError as string) || null,
      model: (payload.model as string) || "",
      cliPrompt: prompts[name] || "",
    };
  });
}

export async function GET() {
  const runtime = readJson<RuntimeConfig>(dataPath("ai-runtime.json")) || { mode: "gateway" };
  const jobs = readJobs();
  return Response.json({ mode: runtime.mode, jobs });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "set-mode") {
    const mode = body.mode;
    if (mode !== "gateway" && mode !== "cli") {
      return Response.json({ error: "mode must be 'gateway' or 'cli'" }, { status: 400 });
    }
    writeJson(dataPath("ai-runtime.json"), { mode });
    return Response.json({ ok: true, mode });
  }

  if (body.action === "toggle-job") {
    const { jobId, enabled } = body;
    const data = readJson<JobsJson>(configPath("cron", "jobs.json"));
    if (!data?.jobs) return Response.json({ error: "jobs.json not found" }, { status: 404 });
    const job = data.jobs.find((j) => j.name === jobId);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
    job.enabled = enabled;
    writeJson(configPath("cron", "jobs.json"), data);
    return Response.json({ ok: true });
  }

  if (body.action === "update-schedule") {
    const { jobId, schedule } = body;
    const everyMs = cronToEveryMs(schedule);
    const data = readJson<JobsJson>(configPath("cron", "jobs.json"));
    if (!data?.jobs) return Response.json({ error: "jobs.json not found" }, { status: 404 });
    const job = data.jobs.find((j) => j.name === jobId);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
    const sched = (job.schedule as Record<string, unknown>) || {};
    sched.everyMs = everyMs;
    job.schedule = sched;
    writeJson(configPath("cron", "jobs.json"), data);
    return Response.json({ ok: true });
  }

  if (body.action === "update-prompt") {
    const { jobId, prompt } = body;
    const prompts = readJson<Record<string, string>>(dataPath("cli-prompts.json")) || {};
    prompts[jobId] = prompt;
    writeJson(dataPath("cli-prompts.json"), prompts);
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 400 });
}
