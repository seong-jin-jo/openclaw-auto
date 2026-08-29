#!/usr/bin/env bash
# Explicit OSMU schema migration runner. Historical SQL glob replay is forbidden.
set -euo pipefail

DB_URL_INPUT="${OSMU_DATABASE_URL:-${DATABASE_URL:-}}"
if [ -z "$DB_URL_INPUT" ]; then
  echo "ERROR: OSMU_DATABASE_URL or DATABASE_URL is required" >&2
  exit 2
fi

# Parse the standard PostgreSQL URI into libpq environment fields so the
# credential-bearing URI never appears in psql process argv.
parse_database_url() {
  local raw="${1#*://}" credentials host_path host_port db_query query user_encoded password_encoded
  credentials="${raw%%@*}"
  host_path="${raw#*@}"
  host_port="${host_path%%/*}"
  db_query="${host_path#*/}"
  query="${db_query#*\?}"
  user_encoded="${credentials%%:*}"
  password_encoded="${credentials#*:}"
  export PGUSER="$(printf '%b' "${user_encoded//%/\\x}")"
  export PGPASSWORD="$(printf '%b' "${password_encoded//%/\\x}")"
  export PGHOST="${host_port%:*}"
  export PGPORT="${host_port##*:}"
  export PGDATABASE="${db_query%%\?*}"
  if [ "$query" != "$db_query" ] && [[ "$query" =~ (^|&)sslmode=([^&]+) ]]; then
    export PGSSLMODE="${BASH_REMATCH[2]}"
  fi
}
parse_database_url "$DB_URL_INPUT"
unset OSMU_DATABASE_URL DATABASE_URL DB_URL_INPUT
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
  psql -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
WITH expected AS (
  SELECT
    'public.studio_generation_idempotency'::regclass AS generation_table,
    'public.studio_free_regeneration_uses'::regclass AS quota_table
), flags AS (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c
      JOIN pg_catalog.pg_index i ON i.indexrelid=c.conindid
      WHERE c.conrelid=expected.generation_table
        AND c.conname='uq_studio_generation_idempotency_tenant_member_operation_key'
        AND pg_catalog.pg_get_constraintdef(c.oid)='UNIQUE (tenant_id, member_id, operation, idempotency_key)'
        AND i.indisunique AND i.indisvalid AND i.indisready
    ) AS gt,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c
      JOIN pg_catalog.pg_index i ON i.indexrelid=c.conindid
      WHERE c.conrelid=expected.generation_table
        AND c.conname='uq_studio_generation_idempotency_member_operation_key'
        AND pg_catalog.pg_get_constraintdef(c.oid)='UNIQUE (member_id, operation, idempotency_key)'
        AND i.indisunique AND i.indisvalid AND i.indisready
    ) AS gm,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c
      JOIN pg_catalog.pg_index i ON i.indexrelid=c.conindid
      WHERE c.conrelid=expected.quota_table
        AND c.conname='uq_studio_free_regeneration_tenant_member_date'
        AND pg_catalog.pg_get_constraintdef(c.oid)='UNIQUE (tenant_id, member_id, local_date)'
        AND i.indisunique AND i.indisvalid AND i.indisready
    ) AS qt,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint c
      JOIN pg_catalog.pg_index i ON i.indexrelid=c.conindid
      WHERE c.conrelid=expected.quota_table
        AND c.conname='uq_studio_free_regeneration_member_date'
        AND pg_catalog.pg_get_constraintdef(c.oid)='UNIQUE (member_id, local_date)'
        AND i.indisunique AND i.indisvalid AND i.indisready
    ) AS qm,
    (SELECT count(*) FROM pg_catalog.pg_constraint
      WHERE conrelid=expected.generation_table
        AND conname IN ('uq_studio_generation_idempotency_tenant_member_operation_key','uq_studio_generation_idempotency_member_operation_key')) AS generation_named,
    (SELECT count(*) FROM pg_catalog.pg_constraint
      WHERE conrelid=expected.quota_table
        AND conname IN ('uq_studio_free_regeneration_tenant_member_date','uq_studio_free_regeneration_member_date')) AS quota_named
  FROM expected
)
SELECT
  CASE
    WHEN generation_named <> gt::int + gm::int THEN 'X'
    WHEN gt AND NOT gm THEN 'S1' WHEN gt AND gm THEN 'S2' WHEN NOT gt AND gm THEN 'S3' ELSE 'X'
  END || '|' ||
  CASE
    WHEN quota_named <> qt::int + qm::int THEN 'X'
    WHEN qt AND NOT qm THEN 'S1' WHEN qt AND qm THEN 'S2' WHEN NOT qt AND qm THEN 'S3' ELSE 'X'
  END
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
  if [ "${value%%|*}" != "${value##*|}" ] && [ "$value" != "${1:-}" ]; then
    echo "ERROR: mixed generation/quota schema fingerprint requires an explicit recovery: $value" >&2
    exit 3
  fi
  echo "schema_fingerprint=$value"
}

duplicate_counts() {
  psql -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
SELECT
  (SELECT count(*) FROM (
    SELECT 1 FROM public.studio_generation_idempotency
    GROUP BY member_id,operation,idempotency_key HAVING count(*) > 1
  ) AS generation_duplicates)::text || '|' ||
  (SELECT count(*) FROM (
    SELECT 1 FROM public.studio_free_regeneration_uses
    GROUP BY member_id,local_date HAVING count(*) > 1
  ) AS quota_duplicates)::text || '|' ||
  (SELECT count(*) FROM (
    SELECT 1 FROM public.studio_generation_idempotency
    GROUP BY member_id,operation,idempotency_key
    HAVING count(DISTINCT request_hash) > 1
  ) AS request_hash_divergence)::text;
SQL
}

assert_no_duplicates() {
  local counts
  counts="$(duplicate_counts)"
  if [ "$counts" != "0|0|0" ]; then
    echo "ERROR: member-scope duplicate audit failed: $counts" >&2
    exit 3
  fi
  echo "duplicate_groups=$counts"
}

assert_compatibility_ready() {
  local readiness
  readiness="$(psql -X -qAt -v ON_ERROR_STOP=1 <<'SQL'
WITH flags AS (
  SELECT
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid='public.studio_generation_idempotency'::regclass
        AND conname='uq_studio_generation_idempotency_member_operation_key'
    ) AS generation_member_unique,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_constraint
      WHERE conrelid='public.studio_free_regeneration_uses'::regclass
        AND conname='uq_studio_free_regeneration_member_date'
    ) AS quota_member_unique,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_trigger
      WHERE tgrelid='public.studio_generation_idempotency'::regclass
        AND tgname='trg_studio_generation_member_guard'
        AND tgenabled <> 'D'
    ) AS generation_guard,
    EXISTS (
      SELECT 1 FROM pg_catalog.pg_trigger
      WHERE tgrelid='public.studio_free_regeneration_uses'::regclass
        AND tgname='trg_studio_free_regeneration_member_guard'
        AND tgenabled <> 'D'
    ) AS quota_guard
)
SELECT
  (generation_member_unique OR generation_guard)::text || '|' ||
  (quota_member_unique OR quota_guard)::text
FROM flags;
SQL
)"
  if [ "$readiness" != "true|true" ]; then
    echo "ERROR: compatibility app requires member UNIQUE or enabled E1 guard for generation and quota; readiness=$readiness" >&2
    exit 3
  fi
  echo "compatibility_ready=$readiness"
}

ensure_ledger() {
  psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
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

require_applied() {
  local migration_id="$1" state
  state="$(psql -X -qAt -v ON_ERROR_STOP=1 -v id="$migration_id" <<'SQL'
SELECT state FROM public.osmu_schema_migrations WHERE migration_id=:'id';
SQL
)"
  if [ "$state" != "applied" ] && [ "$state" != "baselined" ]; then
    echo "ERROR: prerequisite migration $migration_id is not applied" >&2
    exit 5
  fi
}

require_verified_app() {
  if ! [[ "${VERIFIED_APP_IMAGE_DIGEST:-}" =~ ^sha256:[0-9a-f]{64}$ ]] \
    || ! [[ "${VERIFIED_APP_COMMIT:-}" =~ ^[0-9a-f]{40}$ ]]; then
    echo "ERROR: phase requires an observed running app image digest and commit" >&2
    exit 5
  fi
}

validate_rollback_manifest() {
  local path="${ROLLBACK_MANIFEST_PATH:-}" expected="${ROLLBACK_MANIFEST_SHA256:-}" actual
  if [ ! -f "$path" ] || ! [[ "$expected" =~ ^[0-9a-f]{64}$ ]]; then
    echo "ERROR: contract and cleanup require a checksummed rollback manifest" >&2
    exit 5
  fi
  actual="$(checksum "$path")"
  if [ "$actual" != "$expected" ] || grep -q 'pending' "$path"; then
    echo "ERROR: rollback manifest checksum mismatch or pending value" >&2
    exit 5
  fi
  grep -q "${VERIFIED_APP_IMAGE_DIGEST}" "$path" \
    && grep -q "${VERIFIED_APP_COMMIT}" "$path" \
    || { echo "ERROR: rollback manifest does not match the observed app" >&2; exit 5; }
  grep -Eq '"generation"[[:space:]]*:[[:space:]]*0' "$path" \
    && grep -Eq '"quota"[[:space:]]*:[[:space:]]*0' "$path" \
    || { echo "ERROR: rollback manifest duplicate audit is not zero" >&2; exit 5; }
}

validate_cleanup_deadline() {
  local deadline allowed
  deadline="$(sed -nE 's/.*"rollback_deadline_utc"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/p' "$ROLLBACK_MANIFEST_PATH")"
  [ -n "$deadline" ] || { echo "ERROR: rollback deadline missing" >&2; exit 5; }
  allowed="$(psql -X -qAt -v ON_ERROR_STOP=1 -v deadline="$deadline" <<'SQL'
SELECT (now() >= :'deadline'::timestamptz)::text;
SQL
)"
  [ "$allowed" = "true" ] || { echo "ERROR: cleanup is forbidden before rollback deadline" >&2; exit 5; }
}

verify_entry() {
  local id="$1" file="$2" expected="$3" actual
  actual="$(checksum "$DB_DIR/$file")"
  if [ "$actual" != "$expected" ]; then
    echo "ERROR: manifest checksum mismatch for $id" >&2
    exit 4
  fi
  local recorded
  recorded="$(psql -X -qAt -v ON_ERROR_STOP=1 -v id="$id" <<'SQL'
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
  psql -X -q -v ON_ERROR_STOP=1 \
    -v id="$id" -v sha="$expected" -v commit="$RUNNER_COMMIT" <<'SQL'
INSERT INTO public.osmu_schema_migrations
  (migration_id, sha256, phase, state, runner_commit, started_at, applied_at, details)
VALUES
  (:'id', :'sha', 'baseline', 'baselined', :'commit', now(), now(), '{"historical_sql_executed":false}'::jsonb)
ON CONFLICT (migration_id) DO NOTHING;
SQL
}

apply_legacy_manifest() {
  local id phase file expected state begin_count commit_count body_tmp transaction_tmp
  while IFS=$'\t' read -r id phase file expected; do
    [ "$phase" = "legacy" ] || continue
    verify_entry "$id" "$file" "$expected"
    state="$(psql -X -qAt -v ON_ERROR_STOP=1 -v id="$id" <<'SQL'
SELECT state FROM public.osmu_schema_migrations WHERE migration_id=:'id';
SQL
)"
    if [ "$state" = "applied" ]; then
      echo "legacy_migration=$id state=applied action=checksum-only"
      continue
    fi
    begin_count="$(grep -c '^BEGIN;$' "$DB_DIR/$file" || true)"
    commit_count="$(grep -c '^COMMIT;$' "$DB_DIR/$file" || true)"
    if [ "$begin_count" != "1" ] || [ "$commit_count" != "1" ]; then
      echo "ERROR: legacy migration $id must contain exactly one top-level BEGIN/COMMIT pair" >&2
      exit 4
    fi
    body_tmp="$(mktemp)"
    transaction_tmp="$(mktemp)"
    sed -e '/^BEGIN;$/d' -e '/^COMMIT;$/d' "$DB_DIR/$file" >"$body_tmp"
    {
      echo '\set ON_ERROR_STOP on'
      echo 'BEGIN;'
      printf "\\i '%s'\n" "$body_tmp"
      if [ "${OSMU_TEST_FAIL_AFTER_LEGACY_ID:-}" = "$id" ]; then
        echo 'SELECT 1/0;'
      fi
      cat <<'SQL'
INSERT INTO public.osmu_schema_migrations
  (migration_id,sha256,phase,state,runner_commit,started_at,applied_at,details)
VALUES (:'id',:'sha','baseline','applied',:'commit',now(),now(),'{"explicit_historical_apply":true,"atomic_with_ledger":true}'::jsonb)
ON CONFLICT (migration_id) DO UPDATE
SET state='applied',runner_commit=EXCLUDED.runner_commit,applied_at=now(),details=EXCLUDED.details;
COMMIT;
SQL
    } >"$transaction_tmp"
    if ! psql -X -q -v ON_ERROR_STOP=1 \
      -v id="$id" -v sha="$expected" -v commit="$RUNNER_COMMIT" -f "$transaction_tmp"; then
      rm -f "$body_tmp" "$transaction_tmp"
      echo "ERROR: legacy migration $id and ledger transaction rolled back" >&2
      exit 6
    fi
    rm -f "$body_tmp" "$transaction_tmp"
  done <"$MANIFEST"
}

assert_exact_rollback_indexes() {
  psql -X -q -v ON_ERROR_STOP=1 -f "$DB_DIR/verify-rollback-indexes.sql"
  echo "rollback_indexes=exact-valid-ready"
}

apply_phase() {
  local wanted="$1" row id manifest_phase file expected ledger_phase tmp
  row="$(manifest_entry "$wanted")"
  IFS=$'\t' read -r id manifest_phase file expected <<<"$row"
  case "$manifest_phase" in
    expand-fk|expand-guard|expand-member|prepare-rollback) ledger_phase="expand" ;;
    contract-generation|contract-quota) ledger_phase="contract" ;;
    cleanup) ledger_phase="cleanup" ;;
    *) echo "ERROR: phase $manifest_phase is not executable" >&2; exit 2 ;;
  esac
  verify_entry "$id" "$file" "$expected"

  case "$manifest_phase" in
    expand-fk)
      require_applied "20260828_020_engagement_items"
      require_applied "20260828_030_operational_incidents"
      require_applied "20260828_040_shorts_factory_runs"
      require_applied "20260828_050_shorts_factory_run_leases"
      require_applied "20260828_060_code_review_tenant_fk"
      ;;
    expand-guard) require_applied "20260829_010_studio_generation_expand_contract" ;;
    expand-member)
      require_applied "20260829_010_studio_generation_expand_contract"
      require_verified_app
      ;;
    prepare-rollback)
      require_applied "20260829_030_member_unique_expand"
      require_verified_app
      ;;
    contract-generation)
      require_applied "20260829_035_rollback_indexes_expand"
      require_verified_app
      assert_exact_rollback_indexes
      validate_rollback_manifest
      ;;
    contract-quota)
      echo "ERROR: contract-quota is disabled until an approved R27 member-scope and UTC contract artifact is pinned" >&2
      exit 5
      ;;
    cleanup)
      require_applied "20260829_045_quota_tenant_unique_contract"
      require_verified_app
      validate_rollback_manifest
      validate_cleanup_deadline
      ;;
  esac

  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' RETURN
  {
    echo '\set ON_ERROR_STOP on'
    echo "SELECT pg_advisory_lock(hashtext('osmu-schema-migration-v1'));"
    printf "INSERT INTO public.osmu_schema_migrations (migration_id,sha256,phase,state,runner_commit,started_at,details) VALUES ('%s','%s','%s','running','%s',now(),jsonb_build_object('app_image_digest','%s','app_commit','%s','rollback_manifest_sha256','%s')) ON CONFLICT (migration_id) DO UPDATE SET state='running',runner_commit=EXCLUDED.runner_commit,started_at=now(),details=EXCLUDED.details;\n" "$id" "$expected" "$ledger_phase" "$RUNNER_COMMIT" "${VERIFIED_APP_IMAGE_DIGEST:-}" "${VERIFIED_APP_COMMIT:-}" "${ROLLBACK_MANIFEST_SHA256:-}"
    printf "\\i '%s/%s'\n" "$DB_DIR" "$file"
    printf "UPDATE public.osmu_schema_migrations SET state='applied',applied_at=now() WHERE migration_id='%s' AND sha256='%s';\n" "$id" "$expected"
    echo "SELECT pg_advisory_unlock(hashtext('osmu-schema-migration-v1'));"
  } >"$tmp"

  if ! psql -X -q -f "$tmp"; then
    psql -X -q -v ON_ERROR_STOP=1 -v id="$id" <<'SQL' || true
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
    # During the approved expand sequence, generation can remain tenant-scoped
    # while quota is already member-scoped. The compatibility guard below is
    # still mandatory, so only this exact mixed transition is deployable.
    assert_fingerprint "S1|S2"
    assert_no_duplicates
    assert_compatibility_ready
    ;;
  bootstrap)
    if psql -X -qAt -c "SELECT to_regclass('public.tenants') IS NOT NULL" | grep -qx t; then
      echo "ERROR: bootstrap is only allowed on an empty database" >&2
      exit 3
    fi
    psql -X -q -v ON_ERROR_STOP=1 -f "$DB_DIR/schema.sql"
    psql -X -q -v ON_ERROR_STOP=1 -f "$DB_DIR/rls.sql"
    assert_fingerprint
    assert_no_duplicates
    ensure_ledger
    adopt_baseline
    ;;
  baseline|apply-legacy|expand-fk|expand-guard|expand-member|prepare-rollback|contract-generation|contract-quota|cleanup)
    case "$PHASE" in
      baseline|apply-legacy|expand-fk|expand-guard|expand-member) assert_fingerprint "S1|S2" ;;
      contract-quota) assert_fingerprint "S3|S2" ;;
      *) assert_fingerprint ;;
    esac
    assert_no_duplicates
    ensure_ledger
    adopt_baseline
    if [ "$PHASE" = "apply-legacy" ]; then
      apply_legacy_manifest
    elif [ "$PHASE" != "baseline" ]; then
      apply_phase "$PHASE"
    fi
    if [ "$PHASE" = "prepare-rollback" ]; then assert_exact_rollback_indexes; fi
    case "$PHASE" in
      baseline|apply-legacy|expand-fk|expand-guard) assert_fingerprint "S1|S2" ;;
      contract-generation) assert_fingerprint "S3|S2" ;;
      *) assert_fingerprint ;;
    esac
    ;;
  *)
    echo "usage: $0 {preflight|bootstrap|baseline|apply-legacy|expand-fk|expand-guard|expand-member|prepare-rollback|contract-generation|contract-quota|cleanup}" >&2
    exit 2
    ;;
esac
