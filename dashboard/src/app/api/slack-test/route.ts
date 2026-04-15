import { readJson, dataPath, configPath } from "@/lib/file-io";

interface SlackConfig {
  webhookUrl?: string;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { config?: Record<string, string> }>;
  };
}

export async function POST() {
  let webhookUrl = "";
  const cfg = readJson<SlackConfig>(dataPath("slack-config.json")) || {};
  webhookUrl = cfg.webhookUrl || "";
  if (!webhookUrl) {
    const oc = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
    webhookUrl = oc.plugins?.entries?.["slack-publish"]?.config?.webhookUrl || "";
  }
  if (!webhookUrl) {
    return Response.json({ error: "Slack webhook not configured" }, { status: 400 });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Marketing Hub connection test successful!" }),
      signal: AbortSignal.timeout(10000),
    });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
