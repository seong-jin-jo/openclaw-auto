import { readJson, dataPath } from "@/lib/file-io";
import { readSettings } from "@/app/api/settings/route";

export async function GET() {
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
      events.push({
        type: "publish",
        text,
        channel: channelsPublished.join(" + ") || "Threads",
        at: p.publishedAt,
      });
    }

    if (p.status === "draft" && p.generatedAt) {
      events.push({ type: "draft", text, at: p.generatedAt });
    }

    const eng = (p.engagement as Record<string, unknown>) || {};
    if (((eng.views as number) || 0) >= (settings.viralThreshold ?? 500)) {
      events.push({
        type: "viral",
        text,
        views: eng.views as number,
        at: (eng.collectedAt as string) || (p.publishedAt as string) || "",
      });
    }
  }

  events.sort((a, b) => {
    const aAt = (a.at as string) || "";
    const bAt = (b.at as string) || "";
    return bAt.localeCompare(aAt);
  });

  return Response.json({ events: events.slice(0, 20) });
}
