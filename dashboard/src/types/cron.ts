export interface CronJob {
  name: string;
  description?: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  lastStatus?: "success" | "error";
  lastError?: string;
  nextRun?: string;
  model?: string;
}

export interface CronRun {
  jobName: string;
  startedAt: string;
  endedAt?: string;
  status: "success" | "error";
  error?: string;
  model?: string;
}
