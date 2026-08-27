#!/usr/bin/env node
// studio v1 생성 계약 E2E. 도는 앱에 실제로 붙어 상태코드와 응답을 관찰한다.
// 사용: set -a && . ./.env.local && set +a && node scripts/verify-studio-v1-e2e.mjs
import fs from "node:fs";

const base = process.env.STUDIO_E2E_BASE_URL || "http://localhost:3456";
const token = process.env.STUDIO_DEV_BEARER_TOKEN;
const workspace = (process.env.STUDIO_DEV_WORKSPACE_IDS || "").split(",")[0].trim();
if (!token || !workspace) throw new Error("STUDIO_DEV_BEARER_TOKEN 과 STUDIO_DEV_WORKSPACE_IDS 가 필요하다");

const fixtureText = fs.readFileSync(new URL("../tests/studio/generation-fixture.ts", import.meta.url), "utf8");
const literal = fixtureText.match(/return \{([\s\S]*?)\n {2}\};\n\}/);
if (!literal) throw new Error("generation-fixture.ts 에서 요청 본문을 찾지 못했다");
const body = eval(`({${literal[1].replace(/STUDIO_TEST_WORKSPACE_ID/g, JSON.stringify(workspace))}})`);
body.workspace_id = workspace;

const auth = { authorization: `Bearer ${token}` };
const json = () => ({ "content-type": "application/json", ...auth, "Idempotency-Key": crypto.randomUUID() });
const results = [];
const record = (name, got, want) => {
  const ok = got === want;
  results.push({ name, got, want, ok });
  console.log(`${ok ? "통과" : "실패"}  ${name}  기대 ${want} 실제 ${got}`);
};

const noToken = await fetch(`${base}/api/studio/v1/generations`, {
  method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: "{}",
});
record("토큰 없이 생성 요청은 거절된다", noToken.status, 401);

const noKey = await fetch(`${base}/api/studio/v1/generations`, {
  method: "POST", headers: { "content-type": "application/json", ...auth }, body: JSON.stringify(body),
});
record("멱등 키 없는 생성 요청은 거절된다", noKey.status, 400);

const empty = await fetch(`${base}/api/studio/v1/generations`, { method: "POST", headers: json(), body: "{}" });
record("빈 본문은 어느 항목이 빠졌는지 밝히며 거절된다", empty.status, 422);

const created = await fetch(`${base}/api/studio/v1/generations`, { method: "POST", headers: json(), body: JSON.stringify(body) });
record("일곱 층 학습 정보를 갖춘 생성 요청은 받아들여진다", created.status, 201);
const payload = (await created.json()).data;
record("후보를 세 장 돌려준다", payload.candidates.length, 3);

const jobId = payload.job_id;
const lookup = await fetch(`${base}/api/studio/v1/generations/${jobId}`, { headers: auth });
record("만든 작업을 다시 조회할 수 있다", lookup.status, 200);

const missing = await fetch(`${base}/api/studio/v1/generations/00000000-0000-0000-0000-000000000000`, { headers: auth });
record("없는 작업 조회는 404 로 답한다", missing.status, 404);

// 무료 다시 만들기 몫은 작업 단위가 아니라 회원의 하루 단위다(service.ts 의 memberId:localDate 키).
// 그러므로 이 날 첫 호출이면 201, 이미 썼으면 409 이며, 어느 쪽이든 그 다음 호출은 반드시 409 다.
const retry = await fetch(`${base}/api/studio/v1/regenerations/${jobId}`, { method: "POST", headers: json(), body: JSON.stringify({ reason: "free_retry" }) });
record("무료 다시 만들기 첫 호출은 받아들이거나 오늘 몫 소진으로 거절한다", [201, 409].includes(retry.status), true);
if (retry.status === 409) {
  const denial = await retry.json();
  record("거절할 때는 언제 몫이 되살아나는지 함께 알린다", Boolean(denial.error?.details?.free_retry_resets_at), true);
}

const retryAgain = await fetch(`${base}/api/studio/v1/regenerations/${jobId}`, { method: "POST", headers: json(), body: JSON.stringify({ reason: "free_retry" }) });
record("하루 몫을 쓴 뒤의 다시 만들기는 거절된다", retryAgain.status, 409);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length}건 중 통과 ${results.length - failed.length}건, 실패 ${failed.length}건`);
process.exit(failed.length ? 1 : 0);
