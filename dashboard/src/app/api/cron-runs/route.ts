import fs from "fs";
import path from "path";
import { readJson, configPath } from "@/lib/file-io";

interface CronData {
  jobs: Array<{ id: string; name: string }>;
}

export async function GET() {
  const runsDir = configPath("cron", "runs");
  if (!fs.existsSync(runsDir) || !fs.statSync(runsDir).isDirectory()) {
    return Response.json({ runs: [] });
  }

  // Build jobId -> name map
  const cronData = readJson<CronData>(configPath("cron", "jobs.json")) || { jobs: [] };
  const idToName: Record<string, string> = {};
  for (const j of cronData.jobs) {
    if (j.id) idToName[j.id] = j.name;
  }

  const runs: Record<string, unknown>[] = [];
  const files = fs.readdirSync(runsDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(runsDir, f)).mtimeMs,
    }))
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
          });
        }
      }
    } catch { /* skip malformed files */ }
  }

  runs.sort((a, b) => ((b.finishedAt as number) || 0) - ((a.finishedAt as number) || 0));
  return Response.json({ runs: runs.slice(0, 30) });
}
