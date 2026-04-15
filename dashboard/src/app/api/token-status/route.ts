import { readJson, configPath } from "@/lib/file-io";

export async function GET() {
  const result: Record<string, unknown> = { claude: null, threads: null, x: null };

  // Claude auth profile
  const authPath = configPath("agents", "main", "agent", "auth-profiles.json");
  const auth = readJson<Record<string, unknown>>(authPath);
  if (auth) {
    const profiles = (auth.profiles as Record<string, Record<string, unknown>>) || {};
    const usageStats = (auth.usageStats as Record<string, Record<string, unknown>>) || {};
    const lastGood = (auth.lastGood as Record<string, string>) || {};

    // Find active profile — lastGood.anthropic or first available
    const activeKey = lastGood.anthropic || Object.keys(profiles)[0];
    const v = activeKey ? profiles[activeKey] : null;

    if (v) {
      const tokenType = v.type as string || "unknown";
      const exp = (v.expires as number) || 0;
      const stats = usageStats[activeKey] || {};

      let healthy: boolean;
      let remainingHours: number | null;

      if (tokenType === "oauth" && exp > 0) {
        // OAuth — check expiry
        remainingHours = Math.round(((exp / 1000 - Date.now() / 1000) / 3600) * 10) / 10;
        healthy = remainingHours > 1;
      } else {
        // setup-token or api-key — no expiry, check if token exists
        remainingHours = null;
        healthy = !!(v.token);
      }

      const tokenStr = (v.token as string) || "";
      result.claude = {
        profile: activeKey,
        type: tokenType,
        expiresAt: exp || null,
        remainingHours,
        healthy,
        errorCount: stats.errorCount || 0,
        lastUsed: stats.lastUsed || null,
        token: tokenStr,
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
