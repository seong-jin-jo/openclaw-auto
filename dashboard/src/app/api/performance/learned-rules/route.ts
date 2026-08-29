import { readJson, writeJson, dataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";

// 성과실 챗봇 L5. "이거 왜 잘 됐어" → 규칙 후보 → 고객 승낙 → 여기 저장.
// docs/design-docs/osmu-4room-구조질문-선택지-v1.0.0-opus-20260829.md 질문3 "성과실 챗봇"의 마지막 줄
// (성과가 학습 정보로 되돌아가는 승낙은 대화가 아니면 자연스럽게 못 만든다) 구현.
// 어디서 왔는지 추적 가능하게 sourcePostIds·sourceLabel을 같이 저장한다(성과실 화면이 이걸 보여줘야 함).

export interface LearnedRule {
  id: string;
  text: string;
  sourcePostIds: string[];
  sourceLabel: string;
  createdAt: string;
  active: boolean;
}

interface RulesFile {
  rules: LearnedRule[];
}

const FILE_NAME = "performance-learned-rules.json";

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ rules: [] });
  return runWithTenant(tenantId, async () => {
    const data = readJson<RulesFile>(dataPath(FILE_NAME)) || { rules: [] };
    return Response.json({ rules: (data.rules || []).filter((rule) => rule.active !== false) });
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const tenantId = await effectiveTenantId(request, body.tenant_id ?? null);
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });
  const text = String(body.text || "").trim();
  if (!text) return Response.json({ error: "text required" }, { status: 400 });
  return runWithTenant(tenantId, async () => {
    const data = readJson<RulesFile>(dataPath(FILE_NAME)) || { rules: [] };
    const rule: LearnedRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      sourcePostIds: Array.isArray(body.sourcePostIds) ? body.sourcePostIds.map(String).slice(0, 10) : [],
      sourceLabel: String(body.sourceLabel || "성과실 담당과 대화 중 승낙"),
      createdAt: new Date().toISOString(),
      active: true,
    };
    const next = { rules: [...(data.rules || []), rule] };
    writeJson(dataPath(FILE_NAME), next);
    return Response.json({ ok: true, rule });
  });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const tenantId = await effectiveTenantId(request, url.searchParams.get("tenant_id"));
  const id = url.searchParams.get("id");
  if (!tenantId || !id) return Response.json({ error: "tenant_id, id required" }, { status: 400 });
  return runWithTenant(tenantId, async () => {
    const data = readJson<RulesFile>(dataPath(FILE_NAME)) || { rules: [] };
    const next = { rules: (data.rules || []).map((rule) => (rule.id === id ? { ...rule, active: false } : rule)) };
    writeJson(dataPath(FILE_NAME), next);
    return Response.json({ ok: true });
  });
}
