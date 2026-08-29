#!/usr/bin/env bash
# 2026-08-29 운영 교착의 로컬 재현 및 회귀 방지.
#
# 운영 실측 상태를 그대로 만든다.
#   fingerprint       S1|S2   (생성 축은 tenant+member UNIQUE, 무료 몫 축은 확장 중간)
#   readiness         false|true
#   실행 중 컨테이너   revision 라벨 없음 (VERIFIED_APP_* 미설정)
#
# 이 상태에서
#   1. 배포 preflight 가 통과해야 한다. 통과하지 않으면 새 이미지가 못 올라가고,
#      새 이미지가 없으면 revision 라벨이 없어서 expand-member 도 영원히 못 돈다.
#   2. 동시에 게이트가 얇아지지 않았음을 보여야 한다. 필수 표 누락, 중복 발생,
#      제약 정의 드리프트는 여전히 preflight 를 막아야 한다.
#   3. expand-member 를 돌리면 readiness 가 true|true 로 닫혀야 한다.
set -euo pipefail

BASE_URL="${DATABASE_URL:-}"
[ -n "$BASE_URL" ] || { echo "ERROR: DATABASE_URL is required" >&2; exit 2; }
command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required" >&2; exit 2; }

DASHBOARD_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB_NAME="osmu_deadlock_${$}_$(date +%s)"
TARGET_URL="${BASE_URL%/*}/$DB_NAME"
BASE_DATABASE="${BASE_URL##*/}"; BASE_DATABASE="${BASE_DATABASE%%\?*}"
TMP_DIR="$(mktemp -d)"
RUNNER_COMMIT="${RUNNER_COMMIT:-${GITHUB_SHA:-$(git -C "$DASHBOARD_DIR/.." rev-parse HEAD)}}"

raw="${BASE_URL#*://}"; credentials="${raw%%@*}"; host_path="${raw#*@}"
host_port="${host_path%%/*}"; user_encoded="${credentials%%:*}"; password_encoded="${credentials#*:}"
export PGUSER="$(printf '%b' "${user_encoded//%/\\x}")" PGPASSWORD="$(printf '%b' "${password_encoded//%/\\x}")"
export PGHOST="${host_port%:*}" PGPORT="${host_port##*:}"
unset raw credentials host_path host_port user_encoded password_encoded

base_psql() { PGDATABASE="$BASE_DATABASE" psql -X -q -v ON_ERROR_STOP=1 "$@"; }
target_psql() { PGDATABASE="$DB_NAME" psql -X -q -v ON_ERROR_STOP=1 "$@"; }
cleanup() {
  base_psql -c "DROP DATABASE IF EXISTS \"$DB_NAME\" WITH (FORCE)" >/dev/null 2>&1 || true
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

# 실행 중 컨테이너에 revision 라벨이 없는 상황을 그대로 재현한다.
# VERIFIED_APP_IMAGE_DIGEST 와 VERIFIED_APP_COMMIT 를 일부러 주지 않는다.
run_phase() {
  DATABASE_URL="$TARGET_URL" RUNNER_COMMIT="$RUNNER_COMMIT" \
    bash "$DASHBOARD_DIR/db/run-migrations.sh" "$1"
}
run_phase_with_app() {
  DATABASE_URL="$TARGET_URL" RUNNER_COMMIT="$RUNNER_COMMIT" \
    VERIFIED_APP_IMAGE_DIGEST="sha256:$(printf 'a%.0s' {1..64})" \
    VERIFIED_APP_COMMIT="$RUNNER_COMMIT" \
    bash "$DASHBOARD_DIR/db/run-migrations.sh" "$1"
}

echo "== 준비: 운영과 같은 스키마를 세운다 =="
base_psql -c "CREATE DATABASE \"$DB_NAME\""
run_phase bootstrap >/dev/null
run_phase apply-legacy >/dev/null
# 운영은 20260829_010 까지 적용된 상태다(audit 실측: applied expand).
run_phase expand-fk >/dev/null

echo "== 재현: 운영 실측 상태 S1|S2 / readiness false|true 로 되돌린다 =="
target_psql <<'SQL'
-- expand-fk 직후는 두 축 모두 S2(tenant UNIQUE + member UNIQUE 공존)다.
-- 운영은 생성 축의 회원 전역 UNIQUE 가 아직 없는 S1 이다. 그것만 떼어 맞춘다.
ALTER TABLE public.studio_generation_idempotency
  DROP CONSTRAINT uq_studio_generation_idempotency_member_operation_key;
SQL

observed="$(DATABASE_URL="$TARGET_URL" bash "$DASHBOARD_DIR/db/run-migrations.sh" audit | grep -E '^(schema_fingerprint|compatibility_readiness)=' | head -2)"
printf '%s\n' "$observed"
printf '%s\n' "$observed" | grep -qx 'schema_fingerprint=S1|S2' \
  || { echo "FAIL 운영 상태 재현 실패: fingerprint" >&2; exit 1; }
printf '%s\n' "$observed" | grep -qx 'compatibility_readiness=false|true' \
  || { echo "FAIL 운영 상태 재현 실패: readiness" >&2; exit 1; }
echo "PASS 운영 실측 상태를 그대로 재현했다"

echo
echo "== 1. 배포 preflight 가 이 상태를 통과한다 =="
run_phase preflight | tee "$TMP_DIR/preflight"
grep -q 'deploy_compatible=S1|S2 member_global_readiness=false|true' "$TMP_DIR/preflight" \
  || { echo "FAIL preflight 관측 출력이 없다" >&2; exit 1; }
echo "PASS 표식 없는 컨테이너 상태에서 배포 preflight 통과"

echo
echo "== 2. 게이트는 얇아지지 않았다 =="

target_psql -c "ALTER TABLE public.studio_generation_candidate_rejections RENAME TO studio_generation_candidate_rejections_moved"
if run_phase preflight >"$TMP_DIR/missing-relation" 2>&1; then
  echo "FAIL 필수 표가 없는데 preflight 가 통과했다" >&2; exit 1
fi
grep -q 'runtime schema audit failed' "$TMP_DIR/missing-relation"
grep -q 'studio_generation_candidate_rejections missing-relation' "$TMP_DIR/missing-relation"
echo "PASS 필수 표 누락은 여전히 배포를 막는다"
target_psql -c "ALTER TABLE public.studio_generation_candidate_rejections_moved RENAME TO studio_generation_candidate_rejections"

target_psql -c "ALTER TABLE public.drafts NO FORCE ROW LEVEL SECURITY"
if run_phase preflight >"$TMP_DIR/rls-not-forced" 2>&1; then
  echo "FAIL RLS 강제가 풀렸는데 preflight 가 통과했다" >&2; exit 1
fi
grep -q 'drafts rls-not-forced' "$TMP_DIR/rls-not-forced"
echo "PASS 접근 정책 강제 해제는 여전히 배포를 막는다"
target_psql -c "ALTER TABLE public.drafts FORCE ROW LEVEL SECURITY"

target_psql -c "ALTER ROLE osmu_service BYPASSRLS" >/dev/null 2>&1 || SKIP_BYPASS=1
if [ -z "${SKIP_BYPASS:-}" ]; then
  if run_phase preflight >"$TMP_DIR/bypass" 2>&1; then
    echo "FAIL 앱 role 이 RLS 를 우회하는데 preflight 가 통과했다" >&2; exit 1
  fi
  grep -q 'osmu_service bypasses-rls' "$TMP_DIR/bypass"
  echo "PASS 권한 우회는 여전히 배포를 막는다"
  target_psql -c "ALTER ROLE osmu_service NOBYPASSRLS"
else
  echo "SKIP osmu_service 권한 변경 불가(로컬 권한). 운영에서는 audit 이 관측한다"
fi

target_psql <<'SQL'
ALTER TABLE public.studio_generation_idempotency
  DROP CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key;
ALTER TABLE public.studio_generation_idempotency
  ADD CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key
    UNIQUE (tenant_id,member_id,idempotency_key);
SQL
if run_phase preflight >"$TMP_DIR/drift" 2>&1; then
  echo "FAIL 제약 정의가 드리프트했는데 preflight 가 통과했다" >&2; exit 1
fi
grep -q 'unsupported generation/quota schema fingerprint: X|S2' "$TMP_DIR/drift"
echo "PASS 제약 정의 드리프트(X)는 여전히 배포를 막는다"
target_psql <<'SQL'
ALTER TABLE public.studio_generation_idempotency
  DROP CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key;
ALTER TABLE public.studio_generation_idempotency
  ADD CONSTRAINT uq_studio_generation_idempotency_tenant_member_operation_key
    UNIQUE (tenant_id,member_id,operation,idempotency_key);
SQL

target_psql <<'SQL'
INSERT INTO public.tenants(id,slug,name,status) VALUES
  ('44444444-4444-4444-8444-444444444441','dup-a','Dup A','active'),
  ('44444444-4444-4444-8444-444444444442','dup-b','Dup B','active');
INSERT INTO public.studio_generation_jobs
  (id,tenant_id,member_id,status,candidates,layer_revisions,time_zone,request_payload,created_at)
VALUES
  ('44444444-4444-4444-8444-44444444444a','44444444-4444-4444-8444-444444444441','dup-member','succeeded','[]','[]','UTC','{}',now()),
  ('44444444-4444-4444-8444-44444444444b','44444444-4444-4444-8444-444444444442','dup-member','succeeded','[]','[]','UTC','{}',now());
INSERT INTO public.studio_generation_idempotency
  (tenant_id,member_id,operation,idempotency_key,request_hash,job_id,response_payload)
VALUES
  ('44444444-4444-4444-8444-444444444441','dup-member','generation.create','dup-key',repeat('a',64),'44444444-4444-4444-8444-44444444444a','{}'),
  ('44444444-4444-4444-8444-444444444442','dup-member','generation.create','dup-key',repeat('a',64),'44444444-4444-4444-8444-44444444444b','{}');
SQL
if run_phase preflight >"$TMP_DIR/duplicates" 2>&1; then
  echo "FAIL 회원 범위 중복이 있는데 preflight 가 통과했다" >&2; exit 1
fi
grep -q 'member-scope duplicate audit failed: 1|0|0' "$TMP_DIR/duplicates"
echo "PASS 회원 범위 중복은 여전히 배포를 막는다"
target_psql -c "DELETE FROM public.studio_generation_idempotency WHERE member_id='dup-member' AND tenant_id='44444444-4444-4444-8444-444444444442'"

run_phase preflight >/dev/null
echo "PASS 원상 복구 후 preflight 다시 통과"

echo
echo "== 3. 배포가 끝나면 expand-member 로 회원 전역 강제가 닫힌다 =="
if run_phase expand-member >"$TMP_DIR/member-no-app" 2>&1; then
  echo "FAIL 표식 없는 앱으로 expand-member 가 돌았다" >&2; exit 1
fi
grep -q 'phase requires an observed running app image digest and commit' "$TMP_DIR/member-no-app" \
  || { echo "FAIL expand-member 가 다른 이유로 멈췄다" >&2; cat "$TMP_DIR/member-no-app" >&2; exit 1; }
echo "PASS 표식 없는 앱에서는 expand-member 가 계속 막힌다(우회로가 생기지 않았다)"

run_phase_with_app expand-member | tee "$TMP_DIR/member-with-app"
grep -q 'compatibility_ready=true|true' "$TMP_DIR/member-with-app" \
  || { echo "FAIL expand-member 사후 조건이 확인되지 않았다" >&2; exit 1; }
grep -q 'schema_fingerprint=S2|S2' "$TMP_DIR/member-with-app"
echo "PASS 라벨 붙은 배포 뒤 expand-member 가 readiness 를 true|true 로 닫는다"

echo
echo "ALL PASS 배포 교착이 풀렸고 fail-closed 범위는 그대로다"
