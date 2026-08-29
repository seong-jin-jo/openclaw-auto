#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${DATABASE_URL:-}"
[ -n "$BASE_URL" ] || { echo "ERROR: DATABASE_URL is required" >&2; exit 2; }
command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required" >&2; exit 2; }

DASHBOARD_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="osmu_matrix_${$}_$(date +%s)"
MATRIX_URL="${BASE_URL%/*}/$DB_NAME"
BASE_DATABASE="${BASE_URL##*/}"; BASE_DATABASE="${BASE_DATABASE%%\?*}"
TMP_DIR="$(mktemp -d)"
RUNNER_COMMIT="${RUNNER_COMMIT:-${GITHUB_SHA:-}}"
if [ -z "$RUNNER_COMMIT" ]; then
  RUNNER_COMMIT="$(git -C "$DASHBOARD_DIR/.." rev-parse HEAD)"
fi
if ! [[ "$RUNNER_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: RUNNER_COMMIT or GITHUB_SHA must be a 40-character git SHA" >&2
  exit 2
fi
APP_DIGEST="sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
PREVIOUS_DIGEST="sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

raw="${BASE_URL#*://}"; credentials="${raw%%@*}"; host_path="${raw#*@}"
host_port="${host_path%%/*}"; user_encoded="${credentials%%:*}"; password_encoded="${credentials#*:}"
export PGUSER="$(printf '%b' "${user_encoded//%/\\x}")" PGPASSWORD="$(printf '%b' "${password_encoded//%/\\x}")"
export PGHOST="${host_port%:*}" PGPORT="${host_port##*:}"
unset raw credentials host_path host_port user_encoded password_encoded

base_psql() { PGDATABASE="$BASE_DATABASE" psql -X -q -v ON_ERROR_STOP=1 "$@"; }
matrix_psql() { PGDATABASE="$DB_NAME" psql -X -q -v ON_ERROR_STOP=1 "$@"; }
cleanup() {
  base_psql -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE)" >/dev/null || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

run_phase() {
  DATABASE_URL="$MATRIX_URL" RUNNER_COMMIT="$RUNNER_COMMIT" \
    VERIFIED_APP_IMAGE_DIGEST="$APP_DIGEST" VERIFIED_APP_COMMIT="$RUNNER_COMMIT" \
    ROLLBACK_MANIFEST_PATH="${ROLLBACK_MANIFEST_PATH:-}" \
    ROLLBACK_MANIFEST_SHA256="${ROLLBACK_MANIFEST_SHA256:-}" \
    bash "$DASHBOARD_DIR/db/run-migrations.sh" "$1"
}

base_psql -c "CREATE DATABASE \"$DB_NAME\""
run_phase bootstrap
run_phase apply-legacy

# Fresh S3를 old-schema S1으로 되돌려 실제 upgrade path를 시험한다.
matrix_psql <<'SQL'
ALTER TABLE public.studio_generation_idempotency
  DROP CONSTRAINT uq_studio_generation_idempotency_member_operation_key,
  ADD CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key
    UNIQUE (tenant_id,member_id,operation,idempotency_key);
ALTER TABLE public.studio_free_regeneration_uses
  DROP CONSTRAINT uq_studio_free_regeneration_member_date,
  ADD CONSTRAINT uq_studio_free_regeneration_tenant_member_date
    UNIQUE (tenant_id,member_id,local_date);
INSERT INTO public.tenants(id,slug,name,status) VALUES
  ('11111111-1111-4111-8111-111111111111','matrix-a','Matrix A','active'),
  ('22222222-2222-4222-8222-222222222222','matrix-b','Matrix B','active');
INSERT INTO public.studio_generation_jobs
  (id,tenant_id,member_id,status,candidates,layer_revisions,time_zone,request_payload,created_at)
VALUES
  ('11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','member-global','succeeded','[]','[]','UTC','{}',now()),
  ('22222222-2222-4222-8222-222222222223','22222222-2222-4222-8222-222222222222','member-global','succeeded','[]','[]','UTC','{}',now());
INSERT INTO public.shorts_factory_runs
  (id,tenant_id,member_id,status,concurrency_limit,total_concepts,idempotency_key,request_hash,created_at,updated_at,started_at)
VALUES
  ('11111111-1111-4111-8111-111111111119','11111111-1111-4111-8111-111111111111','lease-member','running',1,1,'lease-key',repeat('c',64),'2020-01-01','2090-01-01','2020-01-02');
SQL

matrix_psql -c "DELETE FROM public.osmu_schema_migrations WHERE migration_id='20260828_050_shorts_factory_run_leases'"
if OSMU_TEST_FAIL_AFTER_LEGACY_ID='20260828_050_shorts_factory_run_leases' run_phase apply-legacy >"$TMP_DIR/legacy-crash-window" 2>&1; then
  echo "FAIL injected legacy transaction failure unexpectedly committed" >&2; exit 1
fi
grep -q 'legacy migration 20260828_050_shorts_factory_run_leases and ledger transaction rolled back' "$TMP_DIR/legacy-crash-window"
lease_updated_at="$(matrix_psql -At -c "SELECT updated_at AT TIME ZONE 'UTC' FROM public.shorts_factory_runs WHERE id='11111111-1111-4111-8111-111111111119'")"
ledger_state="$(matrix_psql -At -c "SELECT COALESCE(max(state),'missing') FROM public.osmu_schema_migrations WHERE migration_id='20260828_050_shorts_factory_run_leases'")"
[[ "$lease_updated_at" == 2090-01-01* && "$ledger_state" == missing ]] \
  || { echo "FAIL atomic rollback heartbeat=$lease_updated_at ledger=$ledger_state" >&2; exit 1; }
run_phase apply-legacy
lease_updated_at="$(matrix_psql -At -c "SELECT updated_at AT TIME ZONE 'UTC' FROM public.shorts_factory_runs WHERE id='11111111-1111-4111-8111-111111111119'")"
ledger_state="$(matrix_psql -At -c "SELECT state FROM public.osmu_schema_migrations WHERE migration_id='20260828_050_shorts_factory_run_leases'")"
[[ "$lease_updated_at" == 2090-01-01* && "$ledger_state" == applied ]] \
  || { echo "FAIL legacy recovery heartbeat=$lease_updated_at ledger=$ledger_state" >&2; exit 1; }
echo "PASS atomic legacy failure recovery preserves active lease heartbeat and applies ledger"

run_phase expand-fk
if DATABASE_URL="$MATRIX_URL" RUNNER_COMMIT="$RUNNER_COMMIT" \
  bash "$DASHBOARD_DIR/db/run-migrations.sh" expand-member >"$TMP_DIR/member-without-app" 2>&1; then
  echo "FAIL expand-member ran without a verified compatibility app" >&2; exit 1
fi
grep -q 'phase requires an observed running app image digest and commit' "$TMP_DIR/member-without-app"
echo "PASS expand-member rejects missing compatibility app evidence"
run_phase expand-guard
run_phase preflight

# FK migration proof: workspace deletion must preserve the UTC quota ledger.
matrix_psql <<'SQL'
INSERT INTO public.tenants(id,slug,name,status)
VALUES ('33333333-3333-4333-8333-333333333333','matrix-delete','Matrix delete','active');
INSERT INTO public.studio_generation_jobs
  (id,tenant_id,member_id,status,candidates,layer_revisions,time_zone,request_payload,created_at)
VALUES
  ('33333333-3333-4333-8333-333333333334','33333333-3333-4333-8333-333333333333','fk-member','succeeded','[]','[]','UTC','{}',now()),
  ('33333333-3333-4333-8333-333333333335','33333333-3333-4333-8333-333333333333','fk-member','succeeded','[]','[]','UTC','{}',now());
INSERT INTO public.studio_free_regeneration_uses
  (tenant_id,member_id,local_date,original_job_id,replacement_job_id)
VALUES
  ('33333333-3333-4333-8333-333333333333','fk-member','2026-08-29',
   '33333333-3333-4333-8333-333333333334','33333333-3333-4333-8333-333333333335');
DELETE FROM public.tenants WHERE id='33333333-3333-4333-8333-333333333333';
DO $proof$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.studio_free_regeneration_uses WHERE member_id='fk-member' AND tenant_id IS NULL) THEN
    RAISE EXCEPTION 'quota ledger was deleted with tenant';
  END IF;
END
$proof$;
DELETE FROM public.studio_free_regeneration_uses WHERE member_id='fk-member';
SQL

insert_generation() {
  local tenant="$1" key="$2" job
  if [ "$tenant" = '11111111-1111-4111-8111-111111111111' ]; then
    job='11111111-1111-4111-8111-111111111112'
  else
    job='22222222-2222-4222-8222-222222222223'
  fi
  PGDATABASE="$DB_NAME" psql -X -qAt -v ON_ERROR_STOP=1 -v tenant="$tenant" -v key="$key" -v job="$job" <<'SQL'
BEGIN;
SET LOCAL statement_timeout='5000ms';
SET LOCAL lock_timeout='1500ms';
SELECT pg_sleep(0.1);
INSERT INTO public.studio_generation_idempotency
  (tenant_id,member_id,operation,idempotency_key,request_hash,job_id,response_payload)
VALUES (:'tenant'::uuid,'member-global','generation.create',:'key',repeat('a',64),:'job'::uuid,'{}')
ON CONFLICT DO NOTHING RETURNING id;
COMMIT;
SQL
}

insert_quota() {
  local tenant="$1"
  PGDATABASE="$DB_NAME" psql -X -qAt -v ON_ERROR_STOP=1 -v tenant="$tenant" <<'SQL'
BEGIN;
SET LOCAL statement_timeout='5000ms';
SET LOCAL lock_timeout='1500ms';
SELECT pg_sleep(0.1);
INSERT INTO public.studio_free_regeneration_uses
  (tenant_id,member_id,local_date,original_job_id,replacement_job_id)
VALUES (:'tenant'::uuid,'member-global','2026-08-29',NULL,NULL)
ON CONFLICT DO NOTHING RETURNING id;
COMMIT;
SQL
}

assert_one() {
  local table="$1" where="$2" label="$3" count
  count="$(PGDATABASE="$DB_NAME" psql -X -qAt -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.$table WHERE $where")"
  [ "$count" = "1" ] || { echo "FAIL $label expected=1 actual=$count" >&2; exit 1; }
  echo "PASS $label count=1"
}

run_race() {
  local state="$1" key="$2" p1 p2
  insert_generation '11111111-1111-4111-8111-111111111111' "$key" >"$TMP_DIR/${state}-g1" 2>&1 & p1=$!
  insert_generation '22222222-2222-4222-8222-222222222222' "$key" >"$TMP_DIR/${state}-g2" 2>&1 & p2=$!
  wait "$p1" || { cat "$TMP_DIR/${state}-g1" >&2; echo "FAIL $state generation request 1" >&2; exit 1; }
  wait "$p2" || { cat "$TMP_DIR/${state}-g2" >&2; echo "FAIL $state generation request 2" >&2; exit 1; }
  assert_one studio_generation_idempotency "member_id='member-global' AND idempotency_key='$key'" "$state generation cross-tenant race"

  matrix_psql -c "DELETE FROM public.studio_free_regeneration_uses WHERE member_id='member-global'" >/dev/null
  insert_quota '11111111-1111-4111-8111-111111111111' >"$TMP_DIR/${state}-q1" 2>&1 & p1=$!
  insert_quota '22222222-2222-4222-8222-222222222222' >"$TMP_DIR/${state}-q2" 2>&1 & p2=$!
  wait "$p1" || { cat "$TMP_DIR/${state}-q1" >&2; echo "FAIL $state quota request 1" >&2; exit 1; }
  wait "$p2" || { cat "$TMP_DIR/${state}-q2" >&2; echo "FAIL $state quota request 2" >&2; exit 1; }
  assert_one studio_free_regeneration_uses "member_id='member-global' AND local_date='2026-08-29'" "$state quota cross-tenant race"
}

run_race S1 matrix-s1

# Wrong-definition must hard-stop without deleting the operator-owned index.
matrix_psql -c "CREATE UNIQUE INDEX uq_studio_free_regeneration_member_date ON public.studio_free_regeneration_uses(member_id,local_date,tenant_id)"
if run_phase expand-member >"$TMP_DIR/wrong-definition" 2>&1; then
  echo "FAIL wrong-definition index was accepted" >&2; exit 1
fi
grep -q 'definition drift requires manual recovery' "$TMP_DIR/wrong-definition"
echo "PASS wrong-definition index hard stop"
matrix_psql -c "DROP INDEX public.uq_studio_free_regeneration_member_date"

# Failed concurrent build leaves invalid index. The next approved retry must drop and rebuild it.
matrix_psql <<'SQL'
ALTER TABLE public.studio_generation_idempotency DISABLE TRIGGER trg_studio_generation_member_guard;
INSERT INTO public.studio_generation_idempotency
  (tenant_id,member_id,operation,idempotency_key,request_hash,job_id,response_payload)
VALUES
  ('11111111-1111-4111-8111-111111111111','invalid-member','generation.create','invalid-key',repeat('a',64),'11111111-1111-4111-8111-111111111112','{}'),
  ('22222222-2222-4222-8222-222222222222','invalid-member','generation.create','invalid-key',repeat('a',64),'22222222-2222-4222-8222-222222222223','{}');
SQL
if matrix_psql -c "CREATE UNIQUE INDEX CONCURRENTLY uq_studio_generation_idempotency_member_operation_key ON public.studio_generation_idempotency(member_id,operation,idempotency_key)" >"$TMP_DIR/invalid-build" 2>&1; then
  echo "FAIL duplicate concurrent index build unexpectedly succeeded" >&2; exit 1
fi
matrix_psql <<'SQL'
DELETE FROM public.studio_generation_idempotency
WHERE id IN (SELECT id FROM public.studio_generation_idempotency WHERE member_id='invalid-member' ORDER BY id OFFSET 1);
ALTER TABLE public.studio_generation_idempotency ENABLE TRIGGER trg_studio_generation_member_guard;
SQL
run_phase expand-member
echo "PASS invalid concurrent index drop and rebuild recovery"
run_race S2 matrix-s2

# Wrong same-name rollback index must fail before C1, at prepare-rollback.
matrix_psql -c "CREATE UNIQUE INDEX uq_studio_generation_tenant_rollback_idx ON public.studio_generation_idempotency(tenant_id,id)"
if run_phase prepare-rollback >"$TMP_DIR/wrong-prepare-index" 2>&1; then
  echo "FAIL prepare-rollback accepted wrong-definition index" >&2; exit 1
fi
grep -q 'generation rollback index definition drifted' "$TMP_DIR/wrong-prepare-index"
echo "PASS prepare-rollback blocks wrong-definition index before C1"
matrix_psql -c "DROP INDEX public.uq_studio_generation_tenant_rollback_idx"
run_phase prepare-rollback
export VERIFIED_APP_IMAGE_DIGEST="$APP_DIGEST" VERIFIED_APP_COMMIT="$RUNNER_COMMIT"
export PREVIOUS_COMPATIBLE_IMAGE_DIGEST="$PREVIOUS_DIGEST" ROLLBACK_DEADLINE_UTC='2099-01-01T00:00:00Z'
export DATABASE_URL="$MATRIX_URL" ROLLBACK_MANIFEST_PATH="$TMP_DIR/rollback-future.json"
bash "$DASHBOARD_DIR/db/write-rollback-manifest.sh" "$ROLLBACK_MANIFEST_PATH"
export ROLLBACK_MANIFEST_SHA256="$(sha256sum "$ROLLBACK_MANIFEST_PATH" | awk '{print $1}')"

run_phase contract-generation
# 승인된 단계 뒤에도 앱 배포는 계속 가능해야 한다. contract-generation 직후 상태는
# S3|S2 이고, 바로 아래 race 검사가 그 상태에서 회원 전역 멱등이 지켜짐을 실측한다.
# 예전에는 여기서 preflight 가 실패하는 것을 정상으로 못박아 배포와 확장이 서로를
# 기다리는 교착을 만들었다.
run_phase preflight >"$TMP_DIR/mixed-preflight" 2>&1 \
  || { echo "FAIL 승인된 C1 상태에서 일반 preflight 가 배포를 막는다" >&2; cat "$TMP_DIR/mixed-preflight" >&2; exit 1; }
grep -q 'schema_fingerprint=S3|S2' "$TMP_DIR/mixed-preflight"
echo "PASS 축이 어긋난 승인 상태에서도 배포 preflight 통과"

# 그래도 한 번 올라갔던 회원 범위 강제가 사라지면 반드시 막아야 한다.
#
# 같은 지문 S1 이라도 오는 길이 다르다. 아직 안 올라간 S1 은 정상 중간 상태이고,
# 올라갔다가 내려간 S1 은 절차 밖에서 제약이 지워졌다는 신호다. 그 둘을 가르는 근거는
# 장부다. 아래 두 사례가 "장부가 실제로 그 둘을 가르는가"를 직접 증명한다.
matrix_psql -c "ALTER TABLE public.studio_free_regeneration_uses DROP CONSTRAINT uq_studio_free_regeneration_member_date"
matrix_psql -c "ALTER TABLE public.studio_free_regeneration_uses DISABLE TRIGGER trg_studio_free_regeneration_member_guard" 2>/dev/null || true

# 사례 A. 장부에 20260829_030 이 applied 로 남아 있다. 되돌림이다. 막아야 한다.
if run_phase preflight >"$TMP_DIR/unready-preflight" 2>&1; then
  echo "FAIL 되돌려진 회원 범위 강제가 preflight 를 통과했다" >&2
  cat "$TMP_DIR/unready-preflight" >&2; exit 1
fi
grep -q 'ledger says 20260829_030_member_unique_expand is applied but the member-global UNIQUE it created is gone' "$TMP_DIR/unready-preflight" \
  || { echo "FAIL 되돌림이 다른 이유로 막혔다" >&2; cat "$TMP_DIR/unready-preflight" >&2; exit 1; }
echo "PASS 올라갔다가 내려간 회원 범위 강제는 fail-closed"

# 사례 B. 스키마는 그대로 두고 장부에서 그 단계만 내린다. 이제 "아직 안 올라간" 상태다.
# 운영이 바로 이 상태(S1, 20260829_030 미적용)이고, 배포가 통과해야 한다.
# 두 사례의 스키마는 완전히 같다. 갈라놓는 것은 오직 장부다.
matrix_psql -c "ALTER TABLE public.studio_free_regeneration_uses ENABLE TRIGGER trg_studio_free_regeneration_member_guard" 2>/dev/null || true
# 장부만 "아직 안 올라감"으로 바꾼다. 체크섬 등 나머지 기록은 그대로 둔다.
matrix_psql -c "UPDATE public.osmu_schema_migrations SET state='failed' WHERE migration_id='20260829_030_member_unique_expand'"
run_phase preflight >"$TMP_DIR/preexpansion-preflight" 2>&1 \
  || { echo "FAIL 확장 전 S1 상태에서 배포가 막혔다" >&2; cat "$TMP_DIR/preexpansion-preflight" >&2; exit 1; }
grep -q 'deploy_compatible=S3|S1' "$TMP_DIR/preexpansion-preflight"
echo "PASS 같은 스키마라도 아직 안 올라간 상태는 배포를 막지 않는다(장부가 둘을 가른다)"

# 방어 장치(guard 트리거)에는 같은 규칙을 걸지 않는다. 20260829_020 은 회원 전역 UNIQUE 가
# 없을 때만 트리거를 만드는 조건부 대체물이라, 장부의 "적용됨"이 "존재함"을 함의하지 않는다.
# 그것이 지키던 회원 범위 중복은 assert_no_duplicates 가 직접 센다(위 duplicate 사례).

# 원상 복구. 제약과 장부를 함께 되돌린다.
matrix_psql -c "ALTER TABLE public.studio_free_regeneration_uses ADD CONSTRAINT uq_studio_free_regeneration_member_date UNIQUE (member_id, local_date)"
matrix_psql -c "UPDATE public.osmu_schema_migrations SET state='applied' WHERE migration_id='20260829_030_member_unique_expand'"

# 필수 relation 과 테넌트 격리도 배포 게이트가 본다.
matrix_psql -c "ALTER TABLE public.drafts NO FORCE ROW LEVEL SECURITY"
if run_phase preflight >"$TMP_DIR/rls-preflight" 2>&1; then
  echo "FAIL RLS 가 강제되지 않은 DB가 preflight 를 통과했다" >&2; exit 1
fi
grep -q 'drafts rls-not-forced' "$TMP_DIR/rls-preflight"
echo "PASS RLS 미강제 상태는 배포 preflight 에서 차단"
matrix_psql -c "ALTER TABLE public.drafts FORCE ROW LEVEL SECURITY"
run_phase preflight >/dev/null
if run_phase contract-quota >"$TMP_DIR/quota-contract-no-approval" 2>&1; then
  echo "FAIL quota contract ran without approved R27 artifact" >&2; exit 1
fi
grep -q 'contract-quota is disabled until an approved R27' "$TMP_DIR/quota-contract-no-approval"
echo "PASS quota contract blocked without R27 approval artifact"
run_race S3-generation-S2-quota matrix-mixed

# A same-name valid UNIQUE with the wrong columns must never be attached.
matrix_psql -c "DROP INDEX public.uq_studio_generation_tenant_rollback_idx"
matrix_psql -c "CREATE UNIQUE INDEX uq_studio_generation_tenant_rollback_idx ON public.studio_generation_idempotency(tenant_id,id)"
if bash "$DASHBOARD_DIR/db/rollback-migration.sh" rollback-generation >"$TMP_DIR/wrong-rollback-index" 2>&1; then
  echo "FAIL wrong-definition rollback index was attached" >&2; exit 1
fi
grep -q 'exact valid rollback index missing or definition drifted' "$TMP_DIR/wrong-rollback-index"
echo "PASS rollback rejects same-name valid index with wrong columns"
matrix_psql -c "DROP INDEX public.uq_studio_generation_tenant_rollback_idx"
matrix_psql -c "CREATE UNIQUE INDEX uq_studio_generation_tenant_rollback_idx ON public.studio_generation_idempotency(tenant_id,member_id,operation,idempotency_key)"
bash "$DASHBOARD_DIR/db/rollback-migration.sh" rollback-generation
run_phase preflight
echo "PASS exact rollback index validation and S2 restoration"
