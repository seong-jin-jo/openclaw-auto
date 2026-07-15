import { effectiveTenantId } from "@/lib/tenant-auth";
import { getWikiContext } from "@/lib/wiki-retrieve";
import { generateText, sharedGenerationQuotaErrorResponse, sharedAiApprovalErrorResponse } from "@/lib/anthropic";

// POST /api/video/refine-clip
// Refine an external clip's caption/hook with tenant wiki + brand guide (0차 brand tone).
// body: { caption, hook?, tenant_id?, guide?, context_sources? }
export async function POST(request: Request) {
  const body = await request.json();
  const { caption, hook, tenant_id, guide = "", context_sources } = body;

  if (!caption) {
    return Response.json({ error: "caption required" }, { status: 400 });
  }

  const tenantId = await effectiveTenantId(request, tenant_id);
  const { text: wiki } = tenantId ? await getWikiContext(tenantId, caption + " " + (hook || "")) : { text: "" };

  let extraContext = "";
  if (context_sources && Array.isArray(context_sources)) {
    // reuse simple context pull (same as studio/text)
    for (const src of context_sources) {
      try {
        let content = "";
        if (src.type === "github" && src.owner && src.repo && src.path) {
          const ref = src.ref || "main";
          const url = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${ref}/${src.path}`;
          const headers: Record<string, string> = {};
          if (src.token) headers.Authorization = `token ${src.token}`;
          const res = await fetch(url, { headers });
          if (res.ok) content = await res.text();
        } else if (src.type === "local" && src.path) {
          content = require("fs").readFileSync(require("path").resolve(process.cwd(), src.path), "utf8");
        }
        if (content) extraContext += `\n\n## Context from ${src.owner || "local"}/${src.repo || src.path}\n${content.slice(0, 1200)}`;
      } catch (e: any) {
        extraContext += `\n\n[context error] ${src.path || ""}: ${e.message}`;
      }
    }
  }

  const prompt = `너는 숏폼 편집자다. 아래 클립 캡션/훅을 브랜드 톤과 위키 사실에 맞게 다듬어라.
${guide ? `브랜드 가이드: ${guide}\n` : ""}${wiki ? `=== 위키 사실 (반드시 준수) ===\n${wiki}\n===\n` : ""}${extraContext ? `=== 추가 컨텍스트 ===\n${extraContext}\n===\n` : ""}
원본:
hook: ${hook || ""}
caption: ${caption}

규칙: 100% 한국어, 자연스럽고 강한 훅 유지, 과한 이모지 금지, 사실 지어내지 말기.
JSON만 출력:
{ "refinedHook": "...", "refinedCaption": "..." }`;

  try {
    const stdout = await generateText(prompt, tenantId);
    const m = stdout.match(/\{[\s\S]*\}/);
    if (!m) return Response.json({ error: "JSON parse fail", raw: stdout.slice(-300) }, { status: 502 });

    const refined = JSON.parse(m[0]);
    return Response.json({ ok: true, ...refined });
  } catch (e: any) {
    const approvalResponse = sharedAiApprovalErrorResponse(e);
    if (approvalResponse) return approvalResponse;
    const quotaResponse = sharedGenerationQuotaErrorResponse(e);
    if (quotaResponse) return quotaResponse;
    return Response.json({ error: e.message }, { status: 500 });
  }
}
