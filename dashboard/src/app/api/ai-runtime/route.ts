import { execFile } from "child_process";
import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

interface RuntimeConfig {
  mode: "gateway" | "cli";
  enabledJobs: string[];
}

interface JobsJson {
  version: number;
  jobs: Array<Record<string, unknown>>;
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

function getRuntime(): RuntimeConfig {
  return readJson<RuntimeConfig>(dataPath("ai-runtime.json")) || { mode: "gateway", enabledJobs: [] };
}

function getJobsData(): JobsJson | null {
  return readJson<JobsJson>(configPath("cron", "jobs.json"));
}

function restartGateway(): string {
  const container = process.env.GATEWAY_CONTAINER || "openclaw-gateway";
  try {
    // Fire-and-forget — don't wait for restart to complete
    execFile("docker", ["restart", container], { timeout: 30000 }, () => {});
    return "ok";
  } catch {
    return "Gateway 재시작 요청 실패";
  }
}

export async function GET() {
  const runtime = getRuntime();
  const data = getJobsData();
  const prompts = readJson<Record<string, string>>(dataPath("cli-prompts.json")) || {};
  if (!data?.jobs) return Response.json({ mode: runtime.mode, jobs: [] });

  const jobs = data.jobs.map((j) => {
    const sched = (j.schedule as Record<string, unknown>) || {};
    const state = (j.state as Record<string, unknown>) || {};
    const payload = (j.payload as Record<string, unknown>) || {};
    const name = (j.name as string) || "";

    const effectiveEnabled = runtime.mode === "cli"
      ? runtime.enabledJobs.includes(name)
      : (j.enabled as boolean) ?? false;

    return {
      id: name,
      name,
      description: (j.description as string) || name,
      enabled: effectiveEnabled,
      everyMs: (sched.everyMs as number) || 21600000,
      schedule: everyMsToCron((sched.everyMs as number) || 21600000),
      lastStatus: (state.lastStatus as string) || null,
      lastRun: state.lastRunAtMs ? new Date(state.lastRunAtMs as number).toISOString() : null,
      lastError: (state.lastError as string) || null,
      model: (payload.model as string) || "",
      cliPrompt: prompts[name] || "",
    };
  });

  return Response.json({ mode: runtime.mode, jobs });
}

export async function POST(request: Request) {
  const body = await request.json();

  if (body.action === "set-mode") {
    const newMode = body.mode;
    if (newMode !== "gateway" && newMode !== "cli") {
      return Response.json({ error: "mode must be 'gateway' or 'cli'" }, { status: 400 });
    }

    const runtime = getRuntime();
    const data = getJobsData();
    if (!data?.jobs) return Response.json({ error: "jobs.json not found" }, { status: 404 });

    if (newMode === runtime.mode) {
      return Response.json({ ok: true, mode: newMode, message: "이미 해당 모드입니다." });
    }

    let gatewayMsg = "";

    if (newMode === "cli") {
      // Gateway → CLI
      // 1. 현재 enabled 상태 저장
      const enabled = data.jobs.filter((j) => j.enabled).map((j) => j.name as string);
      // 2. jobs.json 전부 disabled (gateway 중지)
      for (const j of data.jobs) j.enabled = false;
      writeJson(configPath("cron", "jobs.json"), data);
      // 3. runtime 저장
      writeJson(dataPath("ai-runtime.json"), { mode: "cli", enabledJobs: enabled });
      // 4. gateway restart (disabled 상태 즉시 반영)
      gatewayMsg = restartGateway();
    } else {
      // CLI → Gateway
      // 1. enabledJobs를 jobs.json에 복원
      for (const j of data.jobs) {
        j.enabled = runtime.enabledJobs.includes(j.name as string);
      }
      writeJson(configPath("cron", "jobs.json"), data);
      // 2. runtime 저장
      writeJson(dataPath("ai-runtime.json"), { mode: "gateway", enabledJobs: [] });
      // 3. gateway restart (enabled 상태 즉시 반영)
      gatewayMsg = restartGateway();
    }

    const restored = newMode === "gateway"
      ? data.jobs.filter((j) => j.enabled).map((j) => j.name).join(", ")
      : "";

    return Response.json({
      ok: true,
      mode: newMode,
      gateway: gatewayMsg,
      message: newMode === "cli"
        ? "CLI 모드 전환 완료. Gateway 크론 중지됨. claude -p로 실행됩니다."
        : `Gateway 모드 전환 완료. 크론 복원: ${restored || "없음"}. Gateway 재시작 중 (~15초).`,
    });
  }

  if (body.action === "toggle-job") {
    const { jobId, enabled } = body;
    const runtime = getRuntime();

    if (runtime.mode === "cli") {
      const set = new Set(runtime.enabledJobs);
      if (enabled) set.add(jobId); else set.delete(jobId);
      runtime.enabledJobs = [...set];
      writeJson(dataPath("ai-runtime.json"), runtime);
    } else {
      const data = getJobsData();
      if (!data?.jobs) return Response.json({ error: "jobs.json not found" }, { status: 404 });
      const job = data.jobs.find((j) => j.name === jobId);
      if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
      job.enabled = enabled;
      writeJson(configPath("cron", "jobs.json"), data);
    }

    return Response.json({ ok: true });
  }

  if (body.action === "update-schedule") {
    const { jobId, schedule } = body;
    const everyMs = cronToEveryMs(schedule);
    const data = getJobsData();
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
