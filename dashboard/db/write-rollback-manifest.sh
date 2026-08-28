#!/usr/bin/env bash
set -euo pipefail

DB_URL_INPUT="${OSMU_DATABASE_URL:-${DATABASE_URL:-}}"
OUTPUT="${1:-}"
APP_DIGEST="${VERIFIED_APP_IMAGE_DIGEST:-}"
APP_COMMIT="${VERIFIED_APP_COMMIT:-}"
PREVIOUS_DIGEST="${PREVIOUS_COMPATIBLE_IMAGE_DIGEST:-}"
DEADLINE="${ROLLBACK_DEADLINE_UTC:-}"

if [ -z "$DB_URL_INPUT" ] || [ -z "$OUTPUT" ]; then
  echo "ERROR: database URL and output path are required" >&2
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
if ! [[ "$APP_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] \
  || ! [[ "$PREVIOUS_DIGEST" =~ ^sha256:[0-9a-f]{64}$ ]] \
  || ! [[ "$APP_COMMIT" =~ ^[0-9a-f]{40}$ ]] \
  || [ -z "$DEADLINE" ]; then
  echo "ERROR: verified app digest, previous digest, commit, and rollback deadline are required" >&2
  exit 2
fi

umask 077
psql -X -qAt -v ON_ERROR_STOP=1 \
  -v digest="$APP_DIGEST" -v previous_digest="$PREVIOUS_DIGEST" \
  -v app_commit="$APP_COMMIT" -v deadline="$DEADLINE" >"$OUTPUT" <<'SQL'
WITH constraints AS (
  SELECT c.oid, c.conname, pg_catalog.pg_get_constraintdef(c.oid) AS definition,
         CASE WHEN c.conname LIKE '%tenant%' THEN 'tenant' ELSE 'member' END AS scope
  FROM pg_catalog.pg_constraint AS c
  WHERE c.conrelid IN (
    'public.studio_generation_idempotency'::regclass,
    'public.studio_free_regeneration_uses'::regclass
  ) AND c.contype = 'u'
), rollback_indexes AS (
  SELECT c.relname, pg_catalog.pg_get_indexdef(c.oid) AS definition,
         i.indisvalid AND i.indisready AS valid
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid=c.relnamespace
  JOIN pg_catalog.pg_index AS i ON i.indexrelid=c.oid
  WHERE n.nspname='public' AND c.relname IN (
    'uq_studio_generation_tenant_rollback_idx',
    'uq_studio_quota_tenant_rollback_idx'
  )
), duplicate_counts AS (
  SELECT
    (SELECT count(*) FROM (
      SELECT 1 FROM public.studio_generation_idempotency
      GROUP BY member_id,operation,idempotency_key HAVING count(*) > 1
    ) AS d) AS generation,
    (SELECT count(*) FROM (
      SELECT 1 FROM public.studio_free_regeneration_uses
      GROUP BY member_id,local_date HAVING count(*) > 1
    ) AS d) AS quota
)
SELECT pg_catalog.jsonb_build_object(
  'manifest_version', 1,
  'app_image_digest', :'digest',
  'app_commit', :'app_commit',
  'previous_compatible_digest', :'previous_digest',
  'rollback_deadline_utc', :'deadline',
  'duplicate_counts', (SELECT to_jsonb(duplicate_counts) FROM duplicate_counts),
  'ledger_rows', COALESCE((
    SELECT jsonb_agg(migration_id || ':' || sha256 || ':' || state ORDER BY migration_id)
    FROM public.osmu_schema_migrations
  ), '[]'::jsonb),
  'tenant_constraints', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('oid',oid,'name',conname,'definition',definition) ORDER BY conname)
    FROM constraints WHERE scope='tenant'
  ), '[]'::jsonb),
  'member_constraints', COALESCE((
    SELECT jsonb_agg(jsonb_build_object('oid',oid,'name',conname,'definition',definition) ORDER BY conname)
    FROM constraints WHERE scope='member'
  ), '[]'::jsonb),
  'rollback_indexes', COALESCE((SELECT jsonb_agg(to_jsonb(rollback_indexes)) FROM rollback_indexes), '[]'::jsonb),
  'commands', jsonb_build_array('rollback-generation','rollback-quota')
);
SQL

if grep -q 'pending' "$OUTPUT"; then
  echo "ERROR: rollback manifest contains pending values" >&2
  exit 3
fi
echo "rollback_manifest=$OUTPUT"
