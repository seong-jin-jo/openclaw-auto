#!/usr/bin/env bash
set -euo pipefail

DB_URL_INPUT="${OSMU_DATABASE_URL:-${DATABASE_URL:-}}"
ACTION="${1:-}"
MANIFEST="${ROLLBACK_MANIFEST_PATH:-}"
EXPECTED_SHA="${ROLLBACK_MANIFEST_SHA256:-}"

if [ -z "$DB_URL_INPUT" ] || [ ! -f "$MANIFEST" ] || ! [[ "$EXPECTED_SHA" =~ ^[0-9a-f]{64}$ ]]; then
  echo "ERROR: database URL, rollback manifest, and manifest checksum are required" >&2
  exit 2
fi
raw="${DB_URL_INPUT#*://}"; credentials="${raw%%@*}"; host_path="${raw#*@}"
host_port="${host_path%%/*}"; db_query="${host_path#*/}"; query="${db_query#*\?}"
user_encoded="${credentials%%:*}"; password_encoded="${credentials#*:}"
export PGUSER="$(printf '%b' "${user_encoded//%/\\x}")"
export PGPASSWORD="$(printf '%b' "${password_encoded//%/\\x}")"
export PGHOST="${host_port%:*}" PGPORT="${host_port##*:}" PGDATABASE="${db_query%%\?*}"
if [ "$query" != "$db_query" ] && [[ "$query" =~ (^|&)sslmode=([^&]+) ]]; then export PGSSLMODE="${BASH_REMATCH[2]}"; fi
unset OSMU_DATABASE_URL DATABASE_URL DB_URL_INPUT raw credentials host_path host_port db_query query user_encoded password_encoded
actual_sha="$(sha256sum "$MANIFEST" | awk '{print $1}')"
if [ "$actual_sha" != "$EXPECTED_SHA" ] || grep -q 'pending' "$MANIFEST"; then
  echo "ERROR: rollback manifest checksum mismatch or pending value" >&2
  exit 3
fi
if ! grep -q '"commands".*rollback-generation' "$MANIFEST" \
  || ! grep -q 'rollback-quota' "$MANIFEST"; then
  echo "ERROR: rollback manifest does not authorize the approved scripts" >&2
  exit 3
fi

case "$ACTION" in
  rollback-generation)
    table="public.studio_generation_idempotency"
    constraint="uq_studio_generation_idempotency_tenant_member_operation_key"
    index="uq_studio_generation_tenant_rollback_idx"
    member_constraint="uq_studio_generation_idempotency_member_operation_key"
    expected_columns_sql="'tenant_id','member_id','operation','idempotency_key'"
    ;;
  rollback-quota)
    table="public.studio_free_regeneration_uses"
    constraint="uq_studio_free_regeneration_tenant_member_date"
    index="uq_studio_quota_tenant_rollback_idx"
    member_constraint="uq_studio_free_regeneration_member_date"
    expected_columns_sql="'tenant_id','member_id','local_date'"
    ;;
  *)
    echo "usage: $0 {rollback-generation|rollback-quota}" >&2
    exit 2
    ;;
esac

psql -X -q -v ON_ERROR_STOP=1 <<SQL
BEGIN;
SET LOCAL lock_timeout='5000ms';
DO \$rollback\$
DECLARE
  relation_oid regclass := '$table'::regclass;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid=relation_oid AND conname='$member_constraint'
  ) THEN
    RAISE EXCEPTION 'member constraint missing; rollback is unsafe';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_constraint
    WHERE conrelid=relation_oid AND conname='$constraint'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class AS c
      JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
      JOIN pg_catalog.pg_index AS i ON i.indexrelid=c.oid
      WHERE n.nspname='public' AND c.relname='$index'
        AND i.indrelid=relation_oid
        AND i.indisunique AND i.indisvalid AND i.indisready
        AND i.indexprs IS NULL AND i.indpred IS NULL
        AND (
          SELECT pg_catalog.array_agg(a.attname ORDER BY keys.ordinality)
          FROM pg_catalog.unnest(i.indkey) WITH ORDINALITY AS keys(attnum, ordinality)
          JOIN pg_catalog.pg_attribute AS a
            ON a.attrelid=i.indrelid AND a.attnum=keys.attnum
        ) = ARRAY[$expected_columns_sql]::name[]
    ) THEN
      RAISE EXCEPTION 'exact valid rollback index missing or definition drifted';
    END IF;
    EXECUTE pg_catalog.format(
      'ALTER TABLE %s ADD CONSTRAINT %I UNIQUE USING INDEX %I',
      relation_oid, '$constraint', '$index'
    );
  END IF;
END
\$rollback\$;
COMMIT;
SQL

echo "rollback_action=$ACTION"
