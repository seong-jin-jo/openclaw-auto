#!/usr/bin/env bash
# Canonical operator token recovery:
# protected local inventory → GitHub Actions secret → OSMU deploy → live API → real form E2E.
#
# The token is never accepted as an argument and is never printed. GitHub CLI and curl
# receive it through stdin only. Every stage is fail-closed: a failure stops later stages.

set -euo pipefail
set +x
umask 077

SECRET_FILE="${OPENCLAW_SECRET_FILE:-$HOME/.sj-agent-harness/secrets/openclaw-auto.env}"
SECRET_DIR="$(dirname "$SECRET_FILE")"
REPO="${OSMU_GITHUB_REPOSITORY:-seong-jin-jo/openclaw-auto}"
WORKFLOW="${OSMU_DEPLOY_WORKFLOW:-deploy-marketing.yml}"
REF="${OSMU_DEPLOY_REF:-main}"
SERVICES="${OSMU_DEPLOY_SERVICES:-openclaw-dashboard-osmu}"
BASE_URL="${OSMU_BASE_URL:-https://openclaw.sj-onpremise-cloudflare-tunnel.cloud}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FORM_E2E="$SCRIPT_DIR/verify-operator-form-e2e.sh"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/osmu-operator-recovery.XXXXXX")"

TOKEN=""
OSMU_TOKEN_ALIAS=""

cleanup() {
  TOKEN=""
  OSMU_TOKEN_ALIAS=""
  unset TOKEN OSMU_TOKEN_ALIAS
  rm -f "$TMP_ROOT/me.json" "$TMP_ROOT/customers.json"
  rmdir "$TMP_ROOT" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

stat_mode() {
  if stat -f '%Lp' "$1" >/dev/null 2>&1; then
    stat -f '%Lp' "$1"
  else
    stat -c '%a' "$1"
  fi
}

stat_uid() {
  if stat -f '%u' "$1" >/dev/null 2>&1; then
    stat -f '%u' "$1"
  else
    stat -c '%u' "$1"
  fi
}

read_env_value() {
  local wanted="$1"
  local destination="$2"
  local line=""
  local value=""
  local matches=0

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "$wanted="*)
        matches=$((matches + 1))
        value="${line#*=}"
        ;;
    esac
  done < "$SECRET_FILE"

  [ "$matches" -eq 1 ] || fail "$wanted must appear exactly once in the secret inventory"
  [ -n "$value" ] || fail "$wanted is empty in the secret inventory"
  case "$value" in
    *$'\r'*|*$'\n'*) fail "$wanted contains a forbidden line break" ;;
  esac
  printf -v "$destination" '%s' "$value"
}

authenticated_status() {
  local path="$1"
  local output_file="$2"
  printf 'Authorization: Bearer %s\n' "$TOKEN" |
    curl --silent --show-error \
      --connect-timeout 15 --max-time 45 \
      --output "$output_file" --write-out '%{http_code}' \
      -H @- "${BASE_URL%/}${path}"
}

require_command gh
require_command curl
require_command jq

[ -f "$SECRET_FILE" ] || fail "secret inventory is not a regular file: $SECRET_FILE"
[ -r "$SECRET_FILE" ] || fail "secret inventory is not readable: $SECRET_FILE"
# Reject symbolic link indirection so the reviewed path remains the real plaintext source.
[ ! -L "$SECRET_FILE" ] || fail "secret inventory must not be a symlink"
[ "$(stat_mode "$SECRET_DIR")" = "700" ] ||
  fail "secret inventory directory permissions must be 700"
[ "$(stat_uid "$SECRET_DIR")" = "$(id -u)" ] ||
  fail "secret inventory directory must be owned by the current user"
[ "$(stat_mode "$SECRET_FILE")" = "600" ] ||
  fail "secret inventory permissions must be 600"
[ "$(stat_uid "$SECRET_FILE")" = "$(id -u)" ] ||
  fail "secret inventory must be owned by the current user"

read_env_value DASHBOARD_AUTH_TOKEN TOKEN
read_env_value OSMU_DASHBOARD_AUTH_TOKEN OSMU_TOKEN_ALIAS
[ "$TOKEN" = "$OSMU_TOKEN_ALIAS" ] ||
  fail "local token aliases differ; fix the canonical inventory before deployment"

printf '[operator-recovery] syncing GitHub Actions secret from protected local inventory\n'
printf '%s' "$TOKEN" | gh secret set OSMU_DASHBOARD_AUTH_TOKEN --repo "$REPO"

printf '[operator-recovery] dispatching OSMU dashboard deployment\n'
DISPATCH_OUTPUT="$(
  gh workflow run "$WORKFLOW" \
    --repo "$REPO" \
    --ref "$REF" \
    --raw-field "services=$SERVICES"
)"
RUN_ID="$(
  printf '%s\n' "$DISPATCH_OUTPUT" |
    sed -nE 's#.*actions/runs/([0-9]+).*#\1#p' |
    tail -1
)"
case "$RUN_ID" in
  ''|*[!0-9]*) fail "deployment dispatch did not return an exact GitHub run id" ;;
esac

printf '[operator-recovery] watching deploy run %s\n' "$RUN_ID"
gh run watch "$RUN_ID" --exit-status --compact --repo "$REPO"

printf '[operator-recovery] verifying live operator APIs\n'
ME_CODE="$(authenticated_status "/api/me" "$TMP_ROOT/me.json")"
[ "$ME_CODE" = "200" ] || fail "live /api/me returned HTTP $ME_CODE"
jq -e '.isOperator == true' "$TMP_ROOT/me.json" >/dev/null ||
  fail "live /api/me did not confirm operator identity"

CUSTOMERS_CODE="$(authenticated_status "/api/operator/customers" "$TMP_ROOT/customers.json")"
[ "$CUSTOMERS_CODE" = "200" ] ||
  fail "live /api/operator/customers returned HTTP $CUSTOMERS_CODE"

printf '[operator-recovery] verifying real /operator form through isolated gstack browser\n'
OPENCLAW_SECRET_FILE="$SECRET_FILE" OSMU_BASE_URL="$BASE_URL" "$FORM_E2E"

printf '[operator-recovery] PASS run=%s api/me=200 operator/customers=200 form=PASS\n' "$RUN_ID"
