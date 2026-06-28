#!/usr/bin/env bash
# 외부 업타임 모니터 → 슬랙 장애 알림 (2026-06-28 장애 재발방지 L5).
# VM crontab에서 1~2분마다 실행. 라이브 /api/health를 curl해 연속 N회 실패하면 슬랙 경보,
# 복구되면 복구 알림. 앱이 완전히 죽어도(524) 외부에서 감지하도록 *앱 밖* 스크립트로 둔다.
#   예: * * * * * SLACK_WEBHOOK_URL=… BASE_URL=https://<live> /app/dashboard/scripts/health-alert.sh
#
# env: BASE_URL(필수), SLACK_WEBHOOK_URL(필수). 선택: FAIL_THRESHOLD(기본 2), TIMEOUT(기본 10),
#      STATE_FILE(기본 /tmp/osmu-health.state).
set -uo pipefail

BASE_URL="${BASE_URL:-}"
HOOK="${SLACK_WEBHOOK_URL:-}"
THRESHOLD="${FAIL_THRESHOLD:-2}"
TIMEOUT="${TIMEOUT:-10}"
STATE_FILE="${STATE_FILE:-/tmp/osmu-health.state}"

[ -z "$BASE_URL" ] && { echo "ERROR: BASE_URL 미설정" >&2; exit 2; }

slack() { [ -n "$HOOK" ] && curl -s -m 10 -X POST "$HOOK" -H 'Content-Type: application/json' \
  -d "{\"text\":$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" >/dev/null 2>&1 || true; }

fails=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
code=$(curl -s -o /tmp/osmu-health.body -w "%{http_code}" -m "$TIMEOUT" "$BASE_URL/api/health" 2>/dev/null || echo 000)

if [ "$code" = "200" ]; then
  # 직전이 경보 상태(>=threshold)였다면 복구 알림
  if [ "$fails" -ge "$THRESHOLD" ]; then
    slack "✅ OSMU 대시보드 복구됨 — /api/health 200 ($BASE_URL)"
  fi
  echo 0 > "$STATE_FILE"
else
  fails=$((fails + 1))
  echo "$fails" > "$STATE_FILE"
  body=$(head -c 300 /tmp/osmu-health.body 2>/dev/null)
  # 임계 도달 '그 순간'에만 1회 경보(스팸 방지) — 이후 복구까지 침묵
  if [ "$fails" -eq "$THRESHOLD" ]; then
    slack "🚨 OSMU 대시보드 장애 — /api/health http=$code (연속 ${fails}회) @ $BASE_URL\n$body"
  fi
  echo "[health-alert] FAIL http=$code fails=$fails" >&2
fi
