import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";

interface NotifState {
  lastCronErrors: string[];
  lastViralIds: string[];
}

export async function POST() {
  const statePath = dataPath("notification-state.json");
  const state: NotifState = readJson<NotifState>(statePath) || { lastCronErrors: [], lastViralIds: [] };
  const notif = readJson<Record<string, { enabled?: boolean; channels?: string[] }>>(dataPath("notification-settings.json")) || {};
  const config = readJson<Record<string, unknown>>(configPath("openclaw.json")) || {};
  const plugins = ((config.plugins as Record<string, unknown>)?.entries || {}) as Record<string, { config?: Record<string, string> }>;
  const messages: { event: string; text: string }[] = [];

  // 1. Check cron errors
  const cronData = readJson<{ jobs: Array<{ name: string; state?: { lastRunStatus?: string } }> }>(configPath("cron", "jobs.json")) || { jobs: [] };
  const currentErrors = cronData.jobs
    .filter((j) => j.state?.lastRunStatus === "error")
    .map((j) => j.name);
  const prevErrors = state.lastCronErrors || [];
  const newErrors = currentErrors.filter((e) => !prevErrors.includes(e));
  if (newErrors.length && notif.onError?.enabled) {
    messages.push({ event: "onError", text: `⚠️ 크론 에러 발생: ${newErrors.join(", ")}` });
  }

  // 2. Check viral posts
  const queue = readJson<{ posts: Array<{ id: string; text: string; engagement?: { views?: number } }> }>(dataPath("queue.json")) || { posts: [] };
  const settings = readJson<{ viralThreshold?: number }>(dataPath("settings.json")) || {};
  const vt = settings.viralThreshold || 500;
  const viralIds = queue.posts
    .filter((p) => (p.engagement?.views || 0) >= vt)
    .map((p) => p.id);
  const prevViral = state.lastViralIds || [];
  const newViral = viralIds.filter((vid) => !prevViral.includes(vid));
  if (newViral.length && notif.onViral?.enabled) {
    for (const vid of newViral) {
      const post = queue.posts.find((p) => p.id === vid);
      if (post) {
        const views = post.engagement?.views || 0;
        messages.push({ event: "onViral", text: `🔥 바이럴! "${post.text.slice(0, 40)}..." — ${views.toLocaleString()} views` });
      }
    }
  }

  // 3. Send notifications
  let sentCount = 0;
  for (const msg of messages) {
    const channels = notif[msg.event]?.channels || [];
    for (const ch of channels) {
      try {
        if (ch === "telegram") {
          const cfg = plugins["telegram-publish"]?.config || {};
          const token = cfg.botToken || "";
          const chatId = cfg.chatId || "";
          if (token && chatId) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text: msg.text }),
              signal: AbortSignal.timeout(10000),
            });
            sentCount++;
          }
        } else if (ch === "discord" || ch === "slack") {
          const cfg = plugins[`${ch}-publish`]?.config || {};
          const url = cfg.webhookUrl || "";
          if (url) {
            const payload = ch === "slack" ? { text: msg.text } : { content: msg.text };
            await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(10000),
            });
            sentCount++;
          }
        }
      } catch { /* ignore notification failures */ }
    }
  }

  // Update state
  state.lastCronErrors = currentErrors;
  state.lastViralIds = viralIds;
  writeJson(statePath, state);

  return Response.json({ ok: true, newErrors, newViral, sent: sentCount });
}
