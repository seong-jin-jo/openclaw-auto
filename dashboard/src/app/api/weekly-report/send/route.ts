import { readJson, configPath, dataPath } from "@/lib/file-io";

export async function POST() {
  // Get report
  const reportModule = await import("../route");
  const reportResp = await reportModule.GET();
  const reportData = await reportResp.json();
  const reportText = reportData.report || "No data";

  const notif = readJson<Record<string, { channels?: string[] }>>(dataPath("notification-settings.json")) || {};
  const weeklyCfg = notif.weeklyReport || {};
  const channels = weeklyCfg.channels || [];

  if (!channels.length) {
    return Response.json({
      error: "No channels configured for weekly report. Set in Settings > Notifications.",
    }, { status: 400 });
  }

  const config = readJson<Record<string, unknown>>(configPath("openclaw.json")) || {};
  const plugins = ((config.plugins as Record<string, unknown>)?.entries || {}) as Record<string, Record<string, unknown>>;
  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const ch of channels) {
    try {
      if (ch === "telegram") {
        const cfg = (plugins["telegram-publish"]?.config || {}) as Record<string, string>;
        const token = cfg.botToken || "";
        const chatId = cfg.chatId || "";
        if (!token || !chatId) { results[ch] = { ok: false, error: "Not configured" }; continue; }
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: reportText }),
        });
        results[ch] = { ok: true };
      } else if (ch === "discord" || ch === "slack") {
        const cfg = (plugins[`${ch}-publish`]?.config || {}) as Record<string, string>;
        const webhookUrl = cfg.webhookUrl || "";
        if (!webhookUrl) { results[ch] = { ok: false, error: "Not configured" }; continue; }
        const payload = ch === "slack" ? { text: reportText } : { content: reportText };
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        results[ch] = { ok: true };
      } else {
        results[ch] = { ok: false, error: "Unsupported" };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results[ch] = { ok: false, error: msg.slice(0, 100) };
    }
  }

  return Response.json({ ok: true, results, report: reportText });
}
