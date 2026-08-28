#!/usr/bin/env bash
# Actual PostgreSQL S1 -> S2 -> S3 concurrency and migration recovery proof.
set -euo pipefail

BASE_URL="${DATABASE_URL:-}"
if [ -z "$BASE_URL" ]; then
  echo "ERROR: DATABASE_URL is required" >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required" >&2
  exit 2
fi

DASHBOARD_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="osmu_matrix_${$}_$(date +%s)"
DB_BASE="${BASE_URL%/*}"
MATRIX_URL="$DB_BASE/$DB_NAME"
TMP_DIR="$(mktemp -d)"

cleanup() {
  psql "$BASE_URL" -X -q -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE)" >/dev/null || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

psql "$BASE_URL" -X -q -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$DB_NAME\""

psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='osmu_service') THEN
    CREATE ROLE osmu_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END
$role$;
CREATE TABLE public.tenants (id UUID PRIMARY KEY);
CREATE TABLE public.studio_generation_jobs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  UNIQUE (tenant_id,id)
);
CREATE TABLE public.studio_generation_idempotency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash CHAR(64) NOT NULL,
  job_id UUID NOT NULL,
  response_payload JSONB NOT NULL,
  CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key
    UNIQUE (tenant_id,member_id,operation,idempotency_key)
);
CREATE TABLE public.studio_free_regeneration_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  member_id TEXT NOT NULL,
  local_date DATE NOT NULL,
  original_job_id UUID,
  replacement_job_id UUID,
  CONSTRAINT uq_studio_free_regeneration_tenant_member_date
    UNIQUE (tenant_id,member_id,local_date)
);
INSERT INTO public.tenants(id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');
SQL

insert_generation() {
  local tenant="$1" key="$2"
  psql "$MATRIX_URL" -X -qAt -v ON_ERROR_STOP=1 -v tenant="$tenant" -v key="$key" <<'SQL'
BEGIN;
SET LOCAL statement_timeout='5000ms';
SET LOCAL lock_timeout='1500ms';
INSERT INTO public.studio_generation_idempotency
  (tenant_id,member_id,operation,idempotency_key,request_hash,job_id,response_payload)
VALUES
  (:'tenant'::uuid,'member-global','generation.create',:'key',repeat('a',64),gen_random_uuid(),'{}'::jsonb)
ON CONFLICT DO NOTHING RETURNING id;
COMMIT;
SQL
}

insert_quota() {
  local tenant="$1"
  psql "$MATRIX_URL" -X -qAt -v ON_ERROR_STOP=1 -v tenant="$tenant" <<'SQL'
BEGIN;
SET LOCAL statement_timeout='5000ms';
SET LOCAL lock_timeout='1500ms';
INSERT INTO public.studio_free_regeneration_uses
  (tenant_id,member_id,local_date,original_job_id,replacement_job_id)
VALUES
  (:'tenant'::uuid,'member-global','2026-08-29',gen_random_uuid(),gen_random_uuid())
ON CONFLICT DO NOTHING RETURNING id;
COMMIT;
SQL
}

assert_one() {
  local table="$1" where="$2" label="$3" count
  count="$(psql "$MATRIX_URL" -X -qAt -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM public.$table WHERE $where")"
  if [ "$count" != "1" ]; then
    echo "FAIL $label expected=1 actual=$count" >&2
    exit 1
  fi
  echo "PASS $label count=1"
}

run_race() {
  local state="$1" key="$2"
  insert_generation '11111111-1111-4111-8111-111111111111' "$key" >"$TMP_DIR/${state}-g1" &
  local p1=$!
  insert_generation '22222222-2222-4222-8222-222222222222' "$key" >"$TMP_DIR/${state}-g2" &
  local p2=$!
  wait "$p1" "$p2"
  assert_one studio_generation_idempotency "member_id='member-global' AND idempotency_key='$key'" "$state generation cross-tenant race"

  psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -c "DELETE FROM public.studio_free_regeneration_uses" >/dev/null
  insert_quota '11111111-1111-4111-8111-111111111111' >"$TMP_DIR/${state}-q1" &
  p1=$!
  insert_quota '22222222-2222-4222-8222-222222222222' >"$TMP_DIR/${state}-q2" &
  p2=$!
  wait "$p1" "$p2"
  assert_one studio_free_regeneration_uses "member_id='member-global' AND local_date='2026-08-29'" "$state quota cross-tenant race"
}

# S1 guard is repeatable and enforces member scope before member indexes exist.
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_020_generation_guard_expand.sql"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_020_generation_guard_expand.sql"
psql "$MATRIX_URL" -X -qAt -v ON_ERROR_STOP=1 <<'SQL' | grep -qx 't|t|t'
SELECT
  pg_get_userbyid(p.proowner)='osmu_generation_guard_owner',
  p.proconfig @> ARRAY['search_path=pg_catalog, pg_temp'],
  NOT has_function_privilege('public', p.oid, 'EXECUTE')
FROM pg_proc p
WHERE p.oid='public.guard_studio_generation_idempotency_member_scope()'::regprocedure;
SQL
run_race S1 matrix-s1

# Simulate partial E3: valid indexes exist but are not attached. Migration must resume and attach.
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -c "CREATE UNIQUE INDEX CONCURRENTLY uq_studio_generation_idempotency_member_operation_key ON public.studio_generation_idempotency(member_id,operation,idempotency_key)"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -c "CREATE UNIQUE INDEX CONCURRENTLY uq_studio_free_regeneration_member_date ON public.studio_free_regeneration_uses(member_id,local_date)"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_030_member_unique_expand.sql"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_030_member_unique_expand.sql"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -c "DELETE FROM public.studio_generation_idempotency; DELETE FROM public.studio_free_regeneration_uses" >/dev/null
run_race S2 matrix-s2

# C1 is repeatable and converges to member-only S3 while preserving rollback indexes.
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_040_tenant_unique_contract.sql"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -f "$DASHBOARD_DIR/db/migrations/20260829_040_tenant_unique_contract.sql"
psql "$MATRIX_URL" -X -q -v ON_ERROR_STOP=1 -c "DELETE FROM public.studio_generation_idempotency; DELETE FROM public.studio_free_regeneration_uses" >/dev/null
run_race S3 matrix-s3

fingerprint="$(psql "$MATRIX_URL" -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
SELECT
  NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_studio_generation_idempotency_tenant_member_operation_key')
  AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_studio_generation_idempotency_member_operation_key')
  AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_studio_free_regeneration_tenant_member_date')
  AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname='uq_studio_free_regeneration_member_date');
SQL
)"
if [ "$fingerprint" != "t" ]; then
  echo "FAIL final S3 fingerprint" >&2
  exit 1
fi
echo "PASS final S3 fingerprint and repeatability"
