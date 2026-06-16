import { withTenant } from "@/lib/db";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileP = promisify(execFile);
const CLAUDE_BIN = process.env.CLAUDE_BIN || "claude";
const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.OSMU_GEN_MODEL || "claude-sonnet-4-6";

// 테넌트가 등록한 자기 Anthropic 키(integrations kind='anthropic') 복호화. 없으면 null.
// withTenant(RLS) 안에서 복호화 — 키는 메모리에만.
export async function getAnthropicKey(tenantId: string): Promise<string | null> {
  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return null;
  const [row] = await withTenant(tenantId, (sql) => sql<{ token: string | null }[]>`
    SELECT CASE WHEN secret_enc <> '' THEN pgp_sym_decrypt(dearmor(secret_enc), ${key}) ELSE NULL END AS token
    FROM integrations WHERE tenant_id = ${tenantId} AND kind = 'anthropic' LIMIT 1`);
  return row?.token || null;
}

// 텍스트 생성. 고객이 자기 Anthropic 키를 등록했으면 그 키로 API 호출(고객 과금·격리),
// 없으면 공유 claude -p(운영자/내부 폴백). 반환=raw 텍스트(호출부가 JSON 추출).
export async function generateText(prompt: string, tenantId: string | null): Promise<string> {
  const apiKey = tenantId ? await getAnthropicKey(tenantId) : null;
  if (apiKey) {
    const res = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as { content?: { text?: string }[] };
    return data?.content?.[0]?.text || "";
  }
  const { stdout } = await execFileP(CLAUDE_BIN, ["-p", prompt], { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
  return stdout;
}
