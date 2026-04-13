import { readJson, writeJson, configPath } from "@/lib/file-io";

interface OpenClawConfig {
  agents?: { defaults?: { model?: Record<string, unknown> } };
  plugins?: unknown;
}

const AVAILABLE_MODELS = [
  "anthropic/claude-opus-4-6",
  "anthropic/claude-opus-4-5",
  "anthropic/claude-sonnet-4-6",
  "anthropic/claude-sonnet-4-5",
  "anthropic/claude-haiku-4-5",
  "google/gemini-2.5-flash",
  "ollama/llama3.1:8b",
  "ollama/mistral:7b",
];

export async function GET() {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const model = (config.agents?.defaults?.model as Record<string, unknown>) || {};

  // Read per-job model overrides from jobs.json
  const jobs = readJson<{ jobs: Array<{ name: string; payload?: { model?: string } }> }>(configPath("cron", "jobs.json"));
  const jobModels: Record<string, string> = {};
  const primaryModel = (model.primary as string) || "";
  for (const job of jobs?.jobs || []) {
    jobModels[job.name] = job.payload?.model || primaryModel;
  }

  return Response.json({
    primary: primaryModel,
    fallbacks: (model.fallbacks as string[]) || [],
    jobModels,
    available: AVAILABLE_MODELS,
  });
}

export async function POST(request: Request) {
  const data = await request.json();

  if (data.primary !== undefined || data.fallbacks !== undefined) {
    const config = readJson<Record<string, unknown>>(configPath("openclaw.json")) || {};
    if (!config.agents) config.agents = {};
    const agents = config.agents as Record<string, unknown>;
    if (!agents.defaults) agents.defaults = {};
    const defaults = agents.defaults as Record<string, unknown>;
    if (!defaults.model) defaults.model = {};
    const model = defaults.model as Record<string, unknown>;

    if (data.primary !== undefined && typeof data.primary === "string" && data.primary.trim()) {
      model.primary = data.primary.trim();
    }
    if (data.fallbacks !== undefined && Array.isArray(data.fallbacks)) {
      model.fallbacks = data.fallbacks.filter((f: unknown) => typeof f === "string" && (f as string).trim());
    }

    writeJson(configPath("openclaw.json"), config);
  }

  if (data.jobModels && typeof data.jobModels === "object") {
    const jobsData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json"));
    if (jobsData?.jobs) {
      const config2 = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
      const primaryModel = (config2.agents?.defaults?.model?.primary as string) || "";

      for (const job of jobsData.jobs) {
        const name = job.name as string;
        if (name in data.jobModels) {
          const override = data.jobModels[name];
          if (override && override !== primaryModel) {
            if (!job.payload) job.payload = {};
            (job.payload as Record<string, unknown>).model = override;
          } else {
            if (job.payload) {
              delete (job.payload as Record<string, unknown>).model;
            }
          }
        }
      }
      writeJson(configPath("cron", "jobs.json"), jobsData);
    }
  }

  return Response.json({ ok: true });
}
