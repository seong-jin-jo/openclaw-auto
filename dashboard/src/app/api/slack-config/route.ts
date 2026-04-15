import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface SlackConfig {
  webhookUrl?: string;
}

export async function GET() {
  const cfg = readJson<SlackConfig>(dataPath("slack-config.json")) || {};
  return Response.json({
    configured: Boolean(cfg.webhookUrl),
    webhookUrl: cfg.webhookUrl || "",
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  const url: string = data.webhookUrl || "";
  if (!url || !url.startsWith("https://hooks.slack.com/")) {
    return Response.json(
      { error: "Invalid Slack Webhook URL. Must start with https://hooks.slack.com/" },
      { status: 400 },
    );
  }
  writeJson(dataPath("slack-config.json"), { webhookUrl: url });
  return Response.json({ ok: true });
}
