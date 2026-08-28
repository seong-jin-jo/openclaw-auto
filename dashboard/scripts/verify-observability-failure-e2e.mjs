#!/usr/bin/env node
// F1 회귀 검증. 사람 개입 장애가 실제 DB와 Slack webhook 양쪽에 도달하는지 확인한다.
import crypto from "node:crypto";
import http from "node:http";
import postgres from "postgres";

const base = process.env.STUDIO_E2E_BASE_URL || "http://localhost:3456";
const operatorToken = process.env.DASHBOARD_AUTH_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
const encryptionKey = process.env.OSMU_SECRET_KEY;
const webhookPort = Number(process.env.OSMU_TEST_SLACK_PORT || 3470);
if (!operatorToken || !databaseUrl || !encryptionKey) {
  throw new Error("운영자 인증, 데이터베이스, 암호화 키 설정이 필요하다");
}

const sql = postgres(databaseUrl, { max: 1, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
const tenantId = crypto.randomUUID();
const slug = `f1-live-${tenantId}`;
const deliveries = [];
const webhook = http.createServer((request, response) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => { body += chunk; });
  request.on("end", () => {
    deliveries.push(body);
    response.writeHead(200).end("ok");
  });
});

await new Promise((resolve, reject) => {
  webhook.once("error", reject);
  webhook.listen(webhookPort, "127.0.0.1", resolve);
});

try {
  await sql`INSERT INTO tenants (id, slug, name, status) VALUES (${tenantId}, ${slug}, 'F1 실측', 'active')`;
  await sql`
    INSERT INTO channel_accounts
      (id, tenant_id, provider, external_account_id, display_name, secret_enc, is_default, status)
    VALUES
      (${crypto.randomUUID()}, ${tenantId}, 'youtube', 'f1-live-account', 'F1 실측 계정',
       armor(pgp_sym_encrypt('f1-live-token', ${encryptionKey})), true, 'expired')`;

  const response = await fetch(`${base}/api/channel-config?tenant_id=${tenantId}`, {
    headers: { authorization: `Bearer ${operatorToken}` },
  });
  for (let attempt = 0; attempt < 40 && deliveries.length === 0; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const [incident] = await sql`
    SELECT category, intervention, status, occurrences
    FROM operational_incidents
    WHERE tenant_id = ${tenantId} AND category = 'token_expired' AND status = 'open'`;
  const slackPayload = deliveries[0] ? JSON.parse(deliveries[0]) : null;
  const passed = response.status === 200
    && incident?.intervention === "human"
    && incident?.status === "open"
    && incident?.occurrences === 1
    && typeof slackPayload?.text === "string"
    && slackPayload.text.includes("token_expired");
  console.log(`F1 사람 개입 장애 이중 전달: HTTP ${response.status}, DB ${incident?.status ?? "없음"}, Slack ${deliveries.length}건, ${passed ? "통과" : "실패"}`);
  if (!passed) process.exitCode = 1;
} finally {
  await sql`DELETE FROM tenants WHERE id = ${tenantId}`;
  await sql.end({ timeout: 5 });
  await new Promise((resolve) => webhook.close(resolve));
}
