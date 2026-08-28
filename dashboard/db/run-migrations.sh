#!/usr/bin/env bash
# Explicit OSMU schema migration runner. Historical SQL glob replay is forbidden.
set -euo pipefail

DB_URL="${OSMU_DATABASE_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL" ]; then
  echo "ERROR: OSMU_DATABASE_URL or DATABASE_URL is required" >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required" >&2
  exit 2
fi

DB_DIR="$(cd "$(dirname "$0")" && pwd)"
MANIFEST="$DB_DIR/migration-manifest.tsv"
PHASE="${1:-preflight}"
RUNNER_COMMIT="${GITHUB_SHA:-${RUNNER_COMMIT:-0000000000000000000000000000000000000000}}"
if ! [[ "$RUNNER_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "ERROR: RUNNER_COMMIT must be a 40-character git SHA" >&2
  exit 2
fi

checksum() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

fingerprint() {
  psql "$DB_URL" -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
WITH flags AS (
  SELECT
    EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.studio_generation_idempotency'::regclass AND conname='uq_studio_generation_idempotency_tenant_member_operation_key') AS gt,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.studio_generation_idempotency'::regclass AND conname='uq_studio_generation_idempotency_member_operation_key') AS gm,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.studio_free_regeneration_uses'::regclass AND conname='uq_studio_free_regeneration_tenant_member_date') AS qt,
    EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.studio_free_regeneration_uses'::regclass AND conname='uq_studio_free_regeneration_member_date') AS qm
)
SELECT
  CASE WHEN gt AND NOT gm THEN 'S1' WHEN gt AND gm THEN 'S2' WHEN NOT gt AND gm THEN 'S3' ELSE 'X' END || '|' ||
  CASE WHEN qt AND NOT qm THEN 'S1' WHEN qt AND qm THEN 'S2' WHEN NOT qt AND qm THEN 'S3' ELSE 'X' END
FROM flags;
SQL
}

assert_fingerprint() {
  local value
  value="$(fingerprint)"
  if [[ "$value" == *X* ]]; then
    echo "ERROR: unsupported generation/quota schema fingerprint: $value" >&2
    exit 3
  fi
  echo "schema_fingerprint=$value"
}

ensure_ledger() {
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS public.osmu_schema_migrations (
  migration_id TEXT PRIMARY KEY,
  sha256 CHAR(64) NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('baseline','expand','contract','cleanup')),
  state TEXT NOT NULL CHECK (state IN ('baselined','running','applied','failed')),
  runner_commit CHAR(40) NOT NULL,
  started_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);
REVOKE ALL ON public.osmu_schema_migrations FROM PUBLIC;
DO $revoke$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='osmu_service') THEN
    REVOKE ALL ON public.osmu_schema_migrations FROM osmu_service;
  END IF;
END
$revoke$;
SQL
}

manifest_entry() {
  awk -F '\t' -v wanted="$1" '$1 !~ /^#/ && $2 == wanted { print; found=1 } END { if (!found) exit 1 }' "$MANIFEST"
}

verify_entry() {
  local id="$1" file="$2" expected="$3" actual
  actual="$(checksum "$DB_DIR/$file")"
  if [ "$actual" != "$expected" ]; then
    echo "ERROR: manifest checksum mismatch for $id" >&2
    exit 4
  fi
  local recorded
  recorded="$(psql "$DB_URL" -X -qAt -v ON_ERROR_STOP=1 -v id="$id" <<'SQL'
SELECT sha256 FROM public.osmu_schema_migrations WHERE migration_id=:'id';
SQL
)"
  if [ -n "$recorded" ] && [ "$recorded" != "$expected" ]; then
    echo "ERROR: ledger checksum mismatch for $id" >&2
    exit 4
  fi
}

adopt_baseline() {
  local row id phase file expected
  row="$(manifest_entry baseline)"
  IFS=$'\t' read -r id phase file expected <<<"$row"
  verify_entry "$id" "$file" "$expected"
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 \
    -v id="$id" -v sha="$expected" -v commit="$RUNNER_COMMIT" <<'SQL'
INSERT INTO public.osmu_schema_migrations
  (migration_id, sha256, phase, state, runner_commit, started_at, applied_at, details)
VALUES
  (:'id', :'sha', 'baseline', 'baselined', :'commit', now(), now(), '{"historical_sql_executed":false}'::jsonb)
ON CONFLICT (migration_id) DO NOTHING;
SQL
}

apply_phase() {
  local wanted="$1" row id manifest_phase file expected ledger_phase tmp
  row="$(manifest_entry "$wanted")"
  IFS=$'\t' read -r id manifest_phase file expected <<<"$row"
  case "$manifest_phase" in
    expand-guard|expand-member) ledger_phase="expand" ;;
    contract) ledger_phase="contract" ;;
    *) echo "ERROR: phase $manifest_phase is not executable" >&2; exit 2 ;;
  esac
  verify_entry "$id" "$file" "$expected"

  if [ "$manifest_phase" != "expand-guard" ] && [ "${COMPATIBILITY_APP_DIGEST_VERIFIED:-0}" != "1" ]; then
    echo "ERROR: $manifest_phase requires COMPATIBILITY_APP_DIGEST_VERIFIED=1" >&2
    exit 5
  fi

  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' RETURN
  {
    echo '\set ON_ERROR_STOP on'
    echo "SELECT pg_advisory_lock(hashtext('osmu-schema-migration-v1'));"
    printf "INSERT INTO public.osmu_schema_migrations (migration_id,sha256,phase,state,runner_commit,started_at,details) VALUES ('%s','%s','%s','running','%s',now(),'{}'::jsonb) ON CONFLICT (migration_id) DO UPDATE SET state='running',runner_commit=EXCLUDED.runner_commit,started_at=now(),details='{}'::jsonb;\n" "$id" "$expected" "$ledger_phase" "$RUNNER_COMMIT"
    printf "\\i '%s/%s'\n" "$DB_DIR" "$file"
    printf "UPDATE public.osmu_schema_migrations SET state='applied',applied_at=now() WHERE migration_id='%s' AND sha256='%s';\n" "$id" "$expected"
    echo "SELECT pg_advisory_unlock(hashtext('osmu-schema-migration-v1'));"
  } >"$tmp"

  if ! psql "$DB_URL" -X -q -f "$tmp"; then
    psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -v id="$id" <<'SQL' || true
UPDATE public.osmu_schema_migrations
SET state='failed',details=jsonb_build_object('failed_at',now())
WHERE migration_id=:'id';
SQL
    echo "ERROR: migration $id failed; catalog state must be re-evaluated before retry" >&2
    exit 6
  fi
}

case "$PHASE" in
  preflight)
    assert_fingerprint
    ;;
  bootstrap)
    if psql "$DB_URL" -X -qAt -c "SELECT to_regclass('public.tenants') IS NOT NULL" | grep -qx t; then
      echo "ERROR: bootstrap is only allowed on an empty database" >&2
      exit 3
    fi
    psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$DB_DIR/schema.sql"
    psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$DB_DIR/rls.sql"
    assert_fingerprint
    ensure_ledger
    adopt_baseline
    ;;
  baseline|expand-guard|expand-member|contract)
    assert_fingerprint
    ensure_ledger
    adopt_baseline
    if [ "$PHASE" != "baseline" ]; then apply_phase "$PHASE"; fi
    assert_fingerprint
    ;;
  *)
    echo "usage: $0 {preflight|bootstrap|baseline|expand-guard|expand-member|contract}" >&2
    exit 2
    ;;
esac
