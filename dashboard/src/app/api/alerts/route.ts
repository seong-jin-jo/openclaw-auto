import { readJson, dataPath, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 격리 (본문 로직 불변)
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const alerts: Array<Record<string, unknown>> = [];

  // Failed posts
  const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
  const failed = (queue.posts || []).filter((p) => p.status === "failed");
  if (failed.length) {
    alerts.push({
      severity: "error",
      message: `발행 실패 ${failed.length}건`,
      count: failed.length,
      type: "failed_posts",
    });
  }

  // Cron errors
  const cronData = readJson<{ jobs: Array<Record<string, unknown>> }>(configPath("cron", "jobs.json")) || { jobs: [] };
  for (const job of cronData.jobs || []) {
    const state = (job.state as Record<string, unknown>) || {};
    if (state.lastRunStatus === "error") {
      alerts.push({
        severity: "warning",
        message: `Cron 에러: ${job.name || "unknown"}`,
        type: "cron_error",
        jobName: job.name,
      });
    }
  }

  return Response.json({ alerts });
  });
}
