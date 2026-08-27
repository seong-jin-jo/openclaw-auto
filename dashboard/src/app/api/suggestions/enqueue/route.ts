import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { addQueuePost, QueueInputError, QueueSourceContext } from "@/lib/queue-add";
import { HYPOTHESIS_LABEL } from "@/lib/performance-suggestions";

const BASIS = new Set(["hypothesis", "performance", "trend"]);

function stringIds(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 20)
    : [];
}

function safeEvidence(value: unknown): Record<string, unknown> {
  const evidence = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const sampleCount = typeof evidence.sampleCount === "number" && Number.isFinite(evidence.sampleCount)
    ? Math.max(0, Math.floor(evidence.sampleCount))
    : 0;
  return {
    postIds: stringIds(evidence.postIds),
    signalIds: stringIds(evidence.signalIds),
    sampleCount,
    brandContextAvailable: evidence.brandContextAvailable === true,
    marketTrendAvailable: evidence.marketTrendAvailable === true,
  };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, body.tenant_id ?? null);
  if (!tenantId) return Response.json({ error: "no-tenant" }, { status: 401 });

  const suggestion = body.suggestion && typeof body.suggestion === "object" ? body.suggestion : {};
  const id = typeof suggestion.id === "string" ? suggestion.id.trim() : "";
  const text = typeof suggestion.text === "string" ? suggestion.text.trim() : "";
  const basis = typeof suggestion.basis === "string" ? suggestion.basis : "";
  if (!id || id.length > 120 || !text || text.length > 5_000 || !BASIS.has(basis)) {
    return Response.json({ error: "suggestion id, text, basis required" }, { status: 400 });
  }
  if (basis === "hypothesis" && (suggestion.label !== HYPOTHESIS_LABEL || suggestion.verified !== false)) {
    return Response.json({ error: `hypothesis label must be '${HYPOTHESIS_LABEL}' and verified must be false` }, { status: 400 });
  }

  const sourceContext: QueueSourceContext = {
    type: "performance_suggestion",
    suggestionId: id,
    basis: basis as QueueSourceContext["basis"],
    label: typeof suggestion.label === "string" ? suggestion.label : "",
    verified: suggestion.verified === true,
    evidence: safeEvidence(suggestion.evidence),
  };

  return runWithTenant(tenantId, async () => {
    try {
      const result = await addQueuePost(tenantId, {
        text,
        topic: typeof body.topic === "string" ? body.topic : "performance-suggestion",
        hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
        sourceContext,
        idempotencyKey: `suggestion:${id}`,
      });
      return Response.json({ ok: true, ...result }, { status: result.reused ? 200 : 201 });
    } catch (error) {
      if (error instanceof QueueInputError) {
        return Response.json({ error: error.message }, { status: 400 });
      }
      return Response.json({ error: "queue enqueue failed" }, { status: 500 });
    }
  });
}
