import { readJson, writeJson, configPath } from "@/lib/file-io";

export async function POST(request: Request) {
  const data = await request.json();
  const token = (data.token || "").trim();

  if (!token) return Response.json({ error: "Token is empty" }, { status: 400 });

  const authPath = configPath("agents", "main", "agent", "auth-profiles.json");
  const auth = readJson<Record<string, unknown>>(authPath) || {
    version: 1, profiles: {}, lastGood: {}, usageStats: {},
  };

  const profiles = (auth.profiles || {}) as Record<string, unknown>;
  const usageStats = (auth.usageStats || {}) as Record<string, unknown>;
  const lastGood = (auth.lastGood || {}) as Record<string, unknown>;

  let tokenType: string;

  if (token.startsWith("sk-ant-oat01-")) {
    profiles["anthropic:default"] = {
      type: "token",
      provider: "anthropic",
      token,
    };
    tokenType = "setup-token";
  } else if (token.startsWith("sk-ant-api")) {
    profiles["anthropic:default"] = {
      type: "api-key",
      provider: "anthropic",
      token,
    };
    tokenType = "api-key";
  } else {
    return Response.json({
      error: "Invalid token format. Expected sk-ant-oat01-... (setup-token) or sk-ant-api... (API key)",
    }, { status: 400 });
  }

  // 기존 OAuth 프로필 제거 — Gateway가 새 토큰만 사용하도록
  for (const key of Object.keys(profiles)) {
    if (key !== "anthropic:default") {
      delete profiles[key];
    }
  }

  usageStats["anthropic:default"] = {
    errorCount: 0,
    lastUsed: Date.now(),
  };
  lastGood["anthropic"] = "anthropic:default";

  // 다른 provider의 lastGood도 정리
  for (const key of Object.keys(lastGood)) {
    if (key === "anthropic") continue;
    delete lastGood[key];
  }

  auth.profiles = profiles;
  auth.usageStats = usageStats;
  auth.lastGood = lastGood;

  writeJson(authPath, auth);
  return Response.json({ ok: true, type: tokenType, preview: token.slice(0, 15) + "..." });
}
