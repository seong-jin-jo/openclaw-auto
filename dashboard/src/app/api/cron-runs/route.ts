import fs from "fs";
import path from "path";
import { readJson, configPath, dataPath } from "@/lib/file-io";

interface CronData {
  jobs: Array<{ id: string; name: string }>;
}

export async function GET() {
  const runs: Record<string, unknown>[] = [];

  // 1. OpenClaw gateway runs (config/cron/runs/*.jsonl)
  const runsDir = configPath("cron", "runs");
  if (fs.existsSync(runsDir) && fs.statSync(runsDir).isDirectory()) {
    const cronData = readJson<CronData>(configPath("cron", "jobs.json")) || { jobs: [] };
    const idToName: Record<string, string> = {};
    for (const j of cronData.jobs) {
      if (j.id) idToName[j.id] = j.name;
    }

    const files = fs.readdirSync(runsDir)
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({ name: f, mtime: fs.statSync(path.join(runsDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(runsDir, file.name), "utf-8");
        for (const line of content.split("\n")) {
          if (!line.trim()) continue;
          const entry = JSON.parse(line.trim());
          if (entry.action === "finished") {
            const jobId = entry.jobId || file.name.replace(".jsonl", "");
            runs.push({
              jobId,
              jobName: idToName[jobId] || jobId,
              status: entry.status || "unknown",
              summary: (entry.summary || "").slice(0, 200),
              durationMs: entry.durationMs || 0,
              finishedAt: entry.ts || 0,
              model: entry.model || "",
              runtime: "gateway",
            });
          }
        }
      } catch { /* skip */ }
    }
  }

  // 2. CLI runs (data/cli-logs/*.log)
  const cliLogsDir = dataPath("cli-logs");
  if (fs.existsSync(cliLogsDir) && fs.statSync(cliLogsDir).isDirectory()) {
    const logFiles = fs.readdirSync(cliLogsDir)
      .filter((f) => f.endsWith(".log"))
      .map((f) => {
        const stat = fs.statSync(path.join(cliLogsDir, f));
        return { name: f, mtime: stat.mtimeMs, size: stat.size };
      })
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 50);

    for (const file of logFiles) {
      // Filename format: {jobName}-{YYYYMMDD-HHMM}.log
      const match = file.name.match(/^(.+)-(\d{8}-\d{4})\.log$/);
      if (!match) continue;
      const jobName = match[1];
      const dateStr = match[2]; // YYYYMMDD-HHMM

      let content = "";
      try { content = fs.readFileSync(path.join(cliLogsDir, file.name), "utf-8"); } catch { continue; }

      const hasError = content.toLowerCase().includes("error") || content.includes("실패") || content.includes("Timeout");
      const status = hasError ? "error" : "ok";

      // Parse model info from first line: [model: xxx | cost: $0.0123]
      let cliModel = "claude-cli";
      const modelMatch = content.match(/\[model:\s*([^\|]+)\|/);
      if (modelMatch) cliModel = modelMatch[1].trim();
      const summary = content.slice(0, 200).replace(/\n/g, " ");

      // Parse date from filename — filename is KST, convert to UTC timestamp
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const hour = dateStr.slice(9, 11);
      const min = dateStr.slice(11, 13);
      const ts = new Date(`${year}-${month}-${day}T${hour}:${min}:00+09:00`).getTime();

      runs.push({
        jobId: jobName,
        jobName,
        status,
        summary,
        durationMs: 0,
        finishedAt: ts,
        model: cliModel,
        runtime: "cli",
      });
    }
  }

  runs.sort((a, b) => ((b.finishedAt as number) || 0) - ((a.finishedAt as number) || 0));
  return Response.json({ runs: runs.slice(0, 50) });
}
