#!/usr/bin/env bash
# OSMU 멀티테넌트 DB 프로비저닝 (멱등) — 배포/신규 DB에 1회(또는 스키마 변경 시) 적용.
#   schema.sql(테이블+pgcrypto+pg_trgm) → [--seed] → rls.sql(osmu_service role + RLS 정책)
# 순서 주의: seed-test-tenants는 rls.sql "전"에 실행해야 함(FORCE RLS가 owner INSERT도 막음).
# 운영(프로덕션)은 보통 --seed 없이. --seed는 CI/격리 테스트 DB 전용.
#
# 사용:
#   DATABASE_URL=postgres://user@host:5432/db bash dashboard/scripts/apply-schema.sh [--seed]
# psql 필요. ON_ERROR_STOP로 첫 에러에서 중단.
set -euo pipefail

DB="${DATABASE_URL:-}"
if [ -z "$DB" ]; then
  echo "ERROR: DATABASE_URL 미설정 — 대상 DB를 지정하라." >&2
  exit 2
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql 미설치 — Postgres client 필요." >&2
  exit 2
fi

DIR="$(cd "$(dirname "$0")/.." && pwd)"   # dashboard/
SEED=0
[ "${1:-}" = "--seed" ] && SEED=1

run() {
  echo "[apply-schema] → $1"
  psql "$DB" -v ON_ERROR_STOP=1 -f "$1"
}

run "$DIR/db/schema.sql"
if [ "$SEED" -eq 1 ]; then
  run "$DIR/scripts/seed-test-tenants.sql"   # rls 전에 (FORCE RLS 회피)
fi
run "$DIR/db/rls.sql"

echo "[apply-schema] 검증:"
psql "$DB" -tAc "SELECT extname FROM pg_extension WHERE extname IN ('pgcrypto','pg_trgm') ORDER BY 1;" \
  | sed 's/^/  ext: /'
psql "$DB" -tAc "SELECT rolname FROM pg_roles WHERE rolname='osmu_service';" \
  | sed 's/^/  role: /'
echo "[apply-schema] 완료. (ext에 pgcrypto·pg_trgm, role에 osmu_service 보이면 OK)"
