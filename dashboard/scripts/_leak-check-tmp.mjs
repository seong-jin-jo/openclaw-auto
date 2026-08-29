import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import postgres from "postgres";

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    process.env[match[1]] = value;
  }
}
loadLocalEnv();

const BASE_URL = "http://localhost:3456";
const databaseUrl = process.env.DATABASE_URL;
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN;
const sql = postgres(databaseUrl, { max: 2, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });

function bearer(token) { return { Authorization: `Bearer ${token}` }; }
async function req(p, { token, method="GET", body } = {}) {
  const headers = token ? bearer(token) : {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const r = await fetch(`${BASE_URL}${p}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await r.text();
  return { status: r.status, text };
}
async function issueToken(tenantId, label) {
  const r = await req("/api/tenant-tokens", { token: operatorToken, method: "POST", body: { tenant_id: tenantId, label } });
  const j = JSON.parse(r.text);
  return j.token;
}

const suffix = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const [a] = await sql`insert into tenants (slug, name, status, tier) values (${`leak-a-${suffix}`}, 'Leak A', 'active', 'team') returning id`;
const [b] = await sql`insert into tenants (slug, name, status, tier) values (${`leak-b-${suffix}`}, 'Leak B', 'active', 'team') returning id`;

const tokenA = await issueToken(a.id, `leak-a-${suffix}`);
const tokenB = await issueToken(b.id, `leak-b-${suffix}`);

const MARKER_B = `LEAK_MARK_B_${Date.now()}`;
const postRes = await req("/api/performance/learned-rules", { token: tokenB, method: "POST", body: { tenant_id: b.id, text: MARKER_B, sourceLabel: "leak-test" } });
console.log("POST as B:", postRes.status, postRes.text);

const getAsA = await req(`/api/performance/learned-rules?tenant_id=${a.id}`, { token: tokenA });
console.log("GET as A:", getAsA.status, getAsA.text);
const leaked = getAsA.text.includes(MARKER_B);
console.log("LEAKED (A sees B's marker)?", leaked);

const getAsB = await req(`/api/performance/learned-rules?tenant_id=${b.id}`, { token: tokenB });
console.log("GET as B (should see own):", getAsB.status, getAsB.text.includes(MARKER_B));

// cross param attack: A token but tenant_id query param = B's id
const crossParam = await req(`/api/performance/learned-rules?tenant_id=${b.id}`, { token: tokenA });
console.log("GET with A token but tenant_id=B param:", crossParam.status, crossParam.text.includes(MARKER_B), crossParam.text);

await sql`delete from tenants where id in (${a.id}, ${b.id})`;
await sql.end();
