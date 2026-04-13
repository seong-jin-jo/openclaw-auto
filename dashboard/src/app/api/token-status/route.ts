import { readJson, configPath } from "@/lib/file-io";

export async function GET() {
  const result: Record<string, unknown> = { claude: null, threads: null, x: null };

  // Claude auth profile
  const authPath = configPath("agents", "main", "agent", "auth-profiles.json");
  const auth = readJson<Record<string, unknown>>(authPath);
  if (auth) {
    const profiles = (auth.profiles as Record<string, Record<string, unknown>>) || {};
    const usageStats = (auth.usageStats as Record<string, Record<string, unknown>>) || {};
    for (const [k, v] of Object.entries(profiles)) {
      const exp = (v.expires as number) || 0;
      const remainingH = (exp / 1000 - Date.now() / 1000) / 3600;
      const stats = usageStats[k] || {};
      result.claude = {
        profile: k,
        type: v.type,
        expiresAt: exp,
        remainingHours: Math.round(remainingH * 10) / 10,
        healthy: remainingH > 1,
        errorCount: stats.errorCount || 0,
        lastUsed: stats.lastUsed || null,
      };
    }
  }

  // Channel status
  const config = readJson<Record<string, unknown>>(configPath("openclaw.json")) || {};
  const plugins = ((config.plugins as Record<string, unknown>)?.entries as Record<string, Record<string, unknown>>) || {};

  const tp = plugins["threads-publish"] || {};
  const tCfg = (tp.config as Record<string, string>) || {};
  result.threads = { connected: Boolean(tCfg.accessToken || ""), userId: tCfg.userId || "" };

  const xp = plugins["x-publish"] || {};
  const xCfg = (xp.config as Record<string, string>) || {};
  result.x = { connected: Boolean(xCfg.apiKey || ""), enabled: xp.enabled || false };

  // LLM model info
  const agents = ((config.agents as Record<string, unknown>)?.defaults as Record<string, unknown>) || {};
  const model = (agents.model as Record<string, unknown>) || {};
  result.llm = {
    primary: (model.primary as string) || "unknown",
    fallbacks: (model.fallbacks as string[]) || [],
    auth: "Claude Code Max Plan (OAuth, auto-refresh)",
  };

  return Response.json(result);
}
