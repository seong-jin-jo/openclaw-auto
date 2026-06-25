#!/usr/bin/env bash
# 예약 발행 크론 드라이버 — 전 테넌트 due schedules를 실발행한다.
# 배포 호스트 crontab(또는 게이트웨이 스케줄러)이 주기적으로 이걸 호출한다.
#   예: */10 * * * * /app/dashboard/scripts/publish-due-cron.sh >> /var/log/publish-due.log 2>&1
#
# 인증: 운영자 토큰(DASHBOARD_AUTH_TOKEN)으로 호출하면 publish-due가 tenant_id 없이
#       due가 있는 모든 테넌트를 순회한다(operator all-tenants sweep).
# 필수 env: DASHBOARD_AUTH_TOKEN(운영자 토큰). 선택: BASE_URL(기본 http://localhost:3456),
#           PUBLISH_DUE_LIMIT(테넌트당 1회 처리 상한, 기본 백엔드 default).
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3456}"
TOKEN="${DASHBOARD_AUTH_TOKEN:-}"
LIMIT="${PUBLISH_DUE_LIMIT:-}"

if [ -z "$TOKEN" ]; then
  echo "ERROR: DASHBOARD_AUTH_TOKEN 미설정 — 운영자 전체 스윕 불가." >&2
  exit 2
fi

body='{}'
if [ -n "$LIMIT" ]; then
  body="{\"limit\":${LIMIT}}"
fi

echo "[publish-due] $(date -u +%FT%TZ) sweeping all tenants @ ${BASE_URL}"
http_code=$(curl -sS -o /tmp/publish-due-resp.json -w "%{http_code}" \
  -X POST "${BASE_URL}/api/schedule/publish-due" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$body")

cat /tmp/publish-due-resp.json
echo
if [ "$http_code" != "200" ]; then
  echo "[publish-due] FAILED http=${http_code}" >&2
  exit 1
fi
echo "[publish-due] OK http=${http_code}"
