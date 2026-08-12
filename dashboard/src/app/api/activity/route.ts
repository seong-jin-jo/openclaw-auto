import { readJson, dataPath } from "@/lib/file-io";
import { readSettings } from "@/lib/settings-store";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { getActivityEvents } from "@/lib/home-metrics";
import { homeDataSource, homeDbUnavailable, logHomeShadowDiff } from "@/lib/home-data-source";

// F3(fdd-r02): 파일(queue.json) 대신 DB(published_posts)를 단일 소스로 읽는다. DB 미가용시에만
// 파일로 폴백한다. 무중단 롤백 경로는 migration-filestore-to-db-v1.0.0-opus.md §6을 따른다.
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  return runWithTenant(tenantId, async () => {
    const fileEvents = () => {
    const queue = readJson<{ posts: Array<Record<string, unknown>> }>(dataPath("queue.json")) || { posts: [] };
    const posts = queue.posts || [];
    const settings = readSettings();
    const events: Array<Record<string, unknown>> = [];

    for (const p of posts) {
      const ch = (p.channels as Record<string, Record<string, unknown>>) || {};
      const text = ((p.text as string) || "").slice(0, 60);

      if (p.publishedAt) {
        const channelsPublished: string[] = [];
        if (ch.threads?.status === "published") channelsPublished.push("Threads");
        if (ch.x?.status === "published") channelsPublished.push("X");
        events.push({ type: "publish", text, channel: channelsPublished.join(" + ") || "Threads", at: p.publishedAt });
      }
      if (p.status === "draft" && p.generatedAt) {
        events.push({ type: "draft", text, at: p.generatedAt });
      }
      const eng = (p.engagement as Record<string, unknown>) || {};
      if (((eng.views as number) || 0) >= (settings.viralThreshold ?? 500)) {
        events.push({ type: "viral", text, views: eng.views as number, at: (eng.collectedAt as string) || (p.publishedAt as string) || "" });
      }
    }
    events.sort((a, b) => ((b.at as string) || "").localeCompare((a.at as string) || ""));
    return events.slice(0, 20);
    };
    const settings = readSettings();
    const source = homeDataSource();
    if (!tenantId || source === "file") {
      return Response.json({ events: fileEvents(), source: tenantId ? "file-rollback" : "file-legacy" });
    }
    if (source === "shadow") {
      try {
        const file = fileEvents();
        const db = await getActivityEvents(tenantId, 20, settings.viralThreshold ?? 500);
        const shadowMatches = logHomeShadowDiff("activity", tenantId, file, db);
        return Response.json({ events: file, source: "shadow-file", shadowMatches });
      } catch (error) {
        console.error("[home-data-shadow]", error instanceof Error ? error.message : String(error));
        return Response.json({ events: fileEvents(), source: "shadow-file", shadowMatches: false });
      }
    }
    try {
      return Response.json({ events: await getActivityEvents(tenantId, 20, settings.viralThreshold ?? 500), source: "db" });
    } catch (error) {
      return homeDbUnavailable(error);
    }
  });
}
