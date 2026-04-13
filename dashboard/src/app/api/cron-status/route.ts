import { readJson, configPath } from "@/lib/file-io";

interface CronJob {
  name: string;
  enabled?: boolean;
  schedule?: { everyMs?: number };
  state?: {
    lastRunAtMs?: number;
    nextRunAtMs?: number;
    lastRunStatus?: string;
  };
  payload?: { model?: string };
}

interface JobsConfig {
  jobs: CronJob[];
}

const NAME_MAP: Record<string, string> = {
  "threads-generate-drafts": "콘텐츠 생성",
  "threads-auto-publish": "자동 발행",
  "multi-channel-publish": "멀티채널 발행",
  "threads-collect-insights": "반응 수집 + 좋아요 + 저조삭제",
  "threads-track-growth": "팔로워 추적",
  "threads-fetch-trending": "인기글 수집",
  "threads-rewrite-trending": "트렌드 재가공",
};

export async function GET() {
  const config = readJson<JobsConfig>(configPath("cron", "jobs.json"));
  if (!config) {
    return Response.json({ jobs: [] });
  }

  const jobs = (config.jobs || []).map((job) => {
    const state = job.state || {};
    return {
      name: NAME_MAP[job.name] || job.name,
      id: job.name,
      enabled: job.enabled ?? false,
      lastRunAt: state.lastRunAtMs ?? null,
      nextRunAt: state.nextRunAtMs ?? null,
      lastStatus: state.lastRunStatus || "unknown",
      everyMs: job.schedule?.everyMs ?? null,
    };
  });

  return Response.json({ jobs });
}
