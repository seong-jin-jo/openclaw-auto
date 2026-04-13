import { readJson, writeJson, dataPath, configPath } from "./file-io";

interface NotifResult {
  ok: boolean;
  error?: string;
}

interface PluginConfig {
  config?: Record<string, string>;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, PluginConfig>;
  };
}

function getPluginConfig(channel: string): Record<string, string> {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const pluginKey = `${channel}-publish`;
  return config.plugins?.entries?.[pluginKey]?.config || {};
}

export async function sendNotification(channel: string, message: string): Promise<NotifResult> {
  try {
    if (channel === "telegram") {
      const cfg = getPluginConfig("telegram");
      const token = cfg.botToken || "";
      const chatId = cfg.chatId || "";
      if (!token || !chatId) return { ok: false, error: "Telegram not configured (need Bot Token + Chat ID)" };

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      logNotification(channel, message, true);
      return { ok: true };
    }

    if (channel === "discord" || channel === "slack") {
      const cfg = getPluginConfig(channel);
      const url = cfg.webhookUrl || "";
      if (!url) return { ok: false, error: `${channel} not configured` };

      const payload = channel === "slack" ? { text: message } : { content: message };
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      logNotification(channel, message, true);
      return { ok: true };
    }

    if (channel === "line") {
      const cfg = getPluginConfig("line");
      const token = cfg.channelAccessToken || "";
      if (!token) return { ok: false, error: "LINE not configured" };

      await fetch("https://api.line.me/v2/bot/message/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: [{ type: "text", text: message }] }),
        signal: AbortSignal.timeout(10000),
      });
      logNotification(channel, message, true);
      return { ok: true };
    }

    return { ok: false, error: `Unsupported channel: ${channel}` };
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200);
    logNotification(channel, message, false, error);
    return { ok: false, error };
  }
}

function logNotification(channel: string, message: string, success: boolean, error?: string): void {
  const logPath = dataPath("notification-log.json");
  const log = readJson<Array<Record<string, unknown>>>(logPath) || [];
  log.push({
    channel,
    message: message.slice(0, 200),
    success,
    error: error || null,
    timestamp: new Date().toISOString(),
  });
  // keep last 100 entries
  writeJson(logPath, log.slice(-100));
}
