import { readJson, configPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

export async function GET(request: Request) {
  // 테넌트 컨텍스트로 감싸 파일 I/O를 테넌트별로 격리
  const __t = await effectiveTenantId(request, null);
  return runWithTenant(__t, async () => {
  const config = readJson<Record<string, unknown>>(configPath("openclaw.json")) || {};
  const tp = ((config.plugins as Record<string, unknown>)?.entries as Record<string, Record<string, unknown>>)?.["threads-publish"] || {};
  const tCfg = (tp.config as Record<string, string>) || {};
  const token = tCfg.accessToken || "";

  if (!token) {
    return Response.json({ username: "" });
  }

  try {
    const res = await fetch(`https://graph.threads.net/v1.0/me?fields=username&access_token=${token}`, {
      signal: AbortSignal.timeout(3000),
    });
    const data = await res.json();
    return Response.json({ username: data.username || "" });
  } catch {
    return Response.json({ username: "" });
  }
  });
}
