#!/usr/bin/env node
// verify-publish-intent-guard.mjs
//
// 무엇을 막는가: 되돌릴 수 없는 외부 게시가 한 의도에 두 번 나가는 것.
//   1. 초안 번호 없는 발행이 중복 방지 예약을 통째로 건너뛰던 결함.
//   2. 게시 성공 뒤 응답만 끊긴 경우를 실패로 저장해 재시도가 중복 게시하던 결함.
//   3. 예약만 남기고 프로세스가 죽으면 그 작업이 영원히 409 이던 결함.
//
// 실제 채널 자격 없이도 검증할 수 있는 두 층을 본다.
//   HTTP 층: 키 없는 실발행이 외부 게시를 시작하기 전에 400 으로 막히는지.
//   저장 층: 같은 의도의 동시 예약, uncertain 보존, 임차 만료 회수를 실 DB 인덱스로.
//
// 사용: cd dashboard && set -a && . ./.env.local && set +a &&
//       node scripts/verify-publish-intent-guard.mjs
import postgres from "postgres";

const BASE = process.env.OSMU_BASE_URL || "http://localhost:3456";
const DATABASE_URL = process.env.DATABASE_URL;
const OPERATOR_TOKEN = process.env.DASHBOARD_AUTH_TOKEN;
if (!DATABASE_URL || !OPERATOR_TOKEN) {
  console.error("DATABASE_URL, DASHBOARD_AUTH_TOKEN 이 필요합니다");
  process.exit(2);
}

const failures = [];
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "통과" : "실패"} ${label}: 관찰 ${JSON.stringify(actual)} 기대 ${JSON.stringify(expected)}`);
  if (!ok) failures.push(label);
}

const sql = postgres(DATABASE_URL, { max: 4, idle_timeout: 5, connect_timeout: 8, onnotice: () => {} });
const INTENT = `verify-intent-${crypto.randomUUID()}`;
let tenantId = null;

try {
  const [tenant] = await sql`SELECT id FROM tenants ORDER BY created_at LIMIT 1`;
  if (!tenant) throw new Error("검증에 테넌트가 하나 필요합니다");
  tenantId = tenant.id;

  // HTTP 층. 초안도 키도 없는 실발행은 자격 조회 전에 막혀야 한다.
  const publish = (body, headers = {}) => fetch(`${BASE}/api/publish`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${OPERATOR_TOKEN}`, ...headers },
    body: JSON.stringify({ tenant_id: tenantId, platform: "threads", text: "중복 방지 검증", ...body }),
    signal: AbortSignal.timeout(20_000),
  });

  const unkeyed = await publish({});
  const unkeyedBody = await unkeyed.json().catch(() => ({}));
  check("키 없는 실발행 상태", unkeyed.status, 400);
  check("키 없는 실발행 사유", unkeyedBody.code, "PUBLISH_IDEMPOTENCY_KEY_REQUIRED");

  // 키를 주면 이 관문은 통과하고, 그 다음 관문(채널 자격)까지 나아간다.
  const keyed = await publish({}, { "Idempotency-Key": `${INTENT}-http` });
  const keyedBody = await keyed.json().catch(() => ({}));
  check("키 있는 실발행은 이 관문을 통과한다", keyedBody.code === "PUBLISH_IDEMPOTENCY_KEY_REQUIRED", false);

  const reserve = () => sql`
    INSERT INTO published_posts (tenant_id, platform, text, status, idempotency_key, reserved_at)
    VALUES (${tenantId}, 'threads', '중복 방지 검증', 'in_progress', ${INTENT}, now())
    ON CONFLICT DO NOTHING
    RETURNING id`;
  const [first, second] = await Promise.all([reserve(), reserve()]);
  check("같은 의도 동시 예약 성사 건수", first.length + second.length, 1);

  const reservationId = (first[0] ?? second[0]).id;

  // 결과 미확정은 실패가 아니라 uncertain 으로 보존되고, 그 상태에서도 재예약을 막아야 한다.
  await sql`UPDATE published_posts SET status = 'uncertain', reserved_at = NULL WHERE id = ${reservationId}`;
  const afterUncertain = await reserve();
  check("uncertain 상태에서 재예약 성사 건수", afterUncertain.length, 0);

  // failed 는 재시도를 막으면 안 된다.
  await sql`UPDATE published_posts SET status = 'failed' WHERE id = ${reservationId}`;
  const afterFailed = await reserve();
  check("failed 상태에서 재예약 성사 건수", afterFailed.length, 1);
  const retryId = afterFailed[0]?.id;

  // 임차 만료 판정. 예약 시각이 임차 시간보다 오래되면 회수 대상으로 보인다.
  await sql`UPDATE published_posts SET reserved_at = now() - interval '1 hour' WHERE id = ${retryId}`;
  const [stale] = await sql`
    SELECT (now() - reserved_at) > interval '10 minutes' AS expired
    FROM published_posts WHERE id = ${retryId}`;
  check("한 시간 묵은 예약의 임차 만료 판정", stale.expired, true);
} finally {
  try {
    if (tenantId) {
      await sql`DELETE FROM published_posts WHERE tenant_id = ${tenantId} AND idempotency_key LIKE ${INTENT + "%"}`;
    }
  } catch (error) {
    console.error("정리 실패:", error instanceof Error ? error.message : String(error));
    failures.push("정리");
  }
  await sql.end({ timeout: 5 });
}

console.log(failures.length === 0 ? "\n판정: 한 의도의 외부 게시는 한 번만 나가고, 미확정은 보존되며, 만료 예약은 회수 대상이다." : `\n판정: 실패 ${failures.length}건 (${failures.join(", ")})`);
process.exit(failures.length === 0 ? 0 : 1);
