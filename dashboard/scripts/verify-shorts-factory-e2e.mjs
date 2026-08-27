#!/usr/bin/env node
// 도는 앱의 숏폼 공장에 여덟 컨셉을 넣고 성공과 실패 격리를 실제 HTTP로 관찰한다.
import fs from "node:fs";

const base = process.env.STUDIO_E2E_BASE_URL || "http://localhost:3456";
const token = process.env.STUDIO_DEV_BEARER_TOKEN;
const workspace = (process.env.STUDIO_DEV_WORKSPACE_IDS || "").split(",")[0].trim();
if (!token || !workspace) throw new Error("Studio 개발 인증과 작업 공간 설정이 필요하다");

const generation = JSON.parse(fs.readFileSync(new URL("../tests/studio/generation-request.json", import.meta.url), "utf8"));
delete generation.workspace_id;
const concepts = Array.from({ length: 8 }, (_, index) => {
  const config = structuredClone(generation);
  config.learning_context.r6.topic = `공장 실측 컨셉 ${index + 1}`;
  if (index === 3) config.learning_context.u3.purpose = "";
  return { concept_id: `live_${index + 1}`, name: `실측 컨셉 ${index + 1}`, config };
});
const headers = {
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
  "Idempotency-Key": `shorts-factory-live-${crypto.randomUUID()}`,
};
const response = await fetch(`${base}/api/studio/v1/shorts-factory/runs`, {
  method: "POST",
  headers,
  body: JSON.stringify({ workspace_id: workspace, concurrency_limit: 4, concepts }),
});
const payload = await response.json();
console.log(`공장 시작 HTTP ${response.status}`);
if (response.status !== 201) {
  console.log(JSON.stringify(payload));
  process.exit(1);
}

const run = payload.data.run;
const succeeded = run.concepts.filter((concept) => concept.status === "succeeded");
const failed = run.concepts.filter((concept) => concept.status === "failed");
console.log(`실행 ${run.run_id} 상태 ${run.status}, 성공 ${succeeded.length}, 실패 ${failed.length}`);
for (const concept of run.concepts) {
  console.log(`${concept.position}. ${concept.name}: ${concept.stage}, ${concept.studio_job_id || concept.error_code}`);
}

const lookup = await fetch(`${base}/api/studio/v1/shorts-factory/runs/${run.run_id}`, {
  headers: { authorization: `Bearer ${token}` },
});
const lookupPayload = await lookup.json();
console.log(`상태 조회 HTTP ${lookup.status}, 상태 ${lookupPayload.data?.status}`);

const listed = await fetch(`${base}/api/studio/v1/shorts-factory/runs?workspace_id=${workspace}`, {
  headers: { authorization: `Bearer ${token}` },
});
const listedPayload = await listed.json();
console.log(`실행 목록 HTTP ${listed.status}, 최근 실행 ${listedPayload.data?.runs?.length ?? 0}건`);

const isolated = response.status === 201
  && run.status === "partial"
  && succeeded.length === 7
  && succeeded.every((concept) => concept.studio_job_id)
  && failed.length === 1
  && failed[0].concept_id === "live_4"
  && failed[0].error_code === "LEARNING_CONTEXT_INCOMPLETE"
  && lookup.status === 200
  && lookupPayload.data?.run_id === run.run_id
  && listed.status === 200
  && listedPayload.data?.runs?.some((item) => item.run_id === run.run_id);

const healthyConcepts = concepts.map((concept, index) => {
  const copied = structuredClone(concept);
  copied.concept_id = `healthy_${index + 1}`;
  copied.name = `정상 컨셉 ${index + 1}`;
  copied.config.learning_context.u3.purpose = "여덟 컨셉이 함께 끝나는지 확인한다";
  return copied;
});
const healthyResponse = await fetch(`${base}/api/studio/v1/shorts-factory/runs`, {
  method: "POST",
  headers: { ...headers, "Idempotency-Key": `shorts-factory-healthy-${crypto.randomUUID()}` },
  body: JSON.stringify({ workspace_id: workspace, concurrency_limit: 8, concepts: healthyConcepts }),
});
const healthyPayload = await healthyResponse.json();
const healthyRun = healthyPayload.data?.run;
console.log(`정상 공장 HTTP ${healthyResponse.status}, 상태 ${healthyRun?.status}, 성공 ${healthyRun?.succeeded_concepts}`);
const allEightSucceeded = healthyResponse.status === 201
  && healthyRun?.status === "succeeded"
  && healthyRun?.succeeded_concepts === 8
  && healthyRun?.failed_concepts === 0
  && healthyRun?.concepts?.every((concept) => concept.stage === "completed" && concept.studio_job_id);

const valid = isolated && allEightSucceeded;
console.log(valid ? "숏폼 공장 실측 통과" : "숏폼 공장 실측 실패");
process.exit(valid ? 0 : 1);
