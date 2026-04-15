import { readJson, dataPath, configPath } from "@/lib/file-io";

interface SlackConfig {
  webhookUrl?: string;
}

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { config?: Record<string, string> }>;
  };
}

export async function POST(request: Request) {
  // Get webhook URL
  let webhookUrl = "";
  const oc = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  webhookUrl = oc.plugins?.entries?.["slack-publish"]?.config?.webhookUrl || "";
  if (!webhookUrl) {
    const cfg = readJson<SlackConfig>(dataPath("slack-config.json")) || {};
    webhookUrl = cfg.webhookUrl || "";
  }
  if (!webhookUrl) {
    return Response.json({ error: "Slack webhook not configured" }, { status: 400 });
  }

  // Get report preview
  const origin = new URL(request.url).origin;
  try {
    const previewRes = await fetch(`${origin}/api/slack-report-preview`, {
      signal: AbortSignal.timeout(10000),
    });
    const preview = await previewRes.json();
    const report: string = preview.report || "No data";

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: report }),
      signal: AbortSignal.timeout(10000),
    });

    return Response.json({ ok: true, report });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
