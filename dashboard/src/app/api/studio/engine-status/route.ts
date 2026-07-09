import { effectiveTenantId } from "@/lib/tenant-auth";
import { getAnthropicKey } from "@/lib/anthropic";

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  const model = process.env.OSMU_GEN_MODEL || "claude-sonnet-4-6";
  const claudeBin = process.env.CLAUDE_BIN || "claude";

  if (!tenantId) {
    return Response.json({ mode: "claude-p", label: "공유 Claude CLI", model, claudeBin, tenantScoped: false });
  }

  try {
    const hasAnthropicKey = Boolean(await getAnthropicKey(tenantId));
    if (hasAnthropicKey) {
      return Response.json({ mode: "anthropic-api", label: "내 Anthropic API 키", model, tenantScoped: true });
    }
    return Response.json({ mode: "claude-p", label: "공유 Claude CLI", model, claudeBin, tenantScoped: true });
  } catch (e) {
    return Response.json({
      mode: "unknown",
      label: "생성 엔진 확인 실패",
      model,
      error: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200),
    }, { status: 200 });
  }
}
