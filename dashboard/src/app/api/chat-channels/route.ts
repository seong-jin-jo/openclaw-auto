import { readJson, configPath } from "@/lib/file-io";
import fs from "fs";
import path from "path";

interface OpenClawConfig {
  channels?: Record<string, { enabled?: boolean; botToken?: string }>;
  plugins?: { entries?: Record<string, { config?: Record<string, string> }> };
}

export async function GET() {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const telegramDir = path.join(configPath("telegram"));

  const result: Record<string, { configured: boolean; botUsername?: string }> = {
    telegram: { configured: false },
    slack: { configured: false },
    discord: { configured: false },
  };

  // Check Telegram interactive chat
  try {
    const botConfigPath = path.join(telegramDir, "bot-config.json");
    if (fs.existsSync(botConfigPath)) {
      const botConfig = readJson<{ botUsername?: string }>(botConfigPath);
      result.telegram = { configured: true, botUsername: botConfig?.botUsername };
    } else if (config.channels?.telegram?.enabled) {
      result.telegram = { configured: true };
    }
  } catch {
    // ignore
  }

  return Response.json(result);
}
