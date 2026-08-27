#!/usr/bin/env bash
# 외부 업타임 모니터와 운영 장애 원장 슬랙 알림 (2026-06-28 장애 재발방지 L5).
# VM crontab에서 1~2분마다 실행. 라이브 /api/health를 curl해 연속 N회 실패하면 슬랙 경보,
# 복구되면 복구 알림. 앱이 완전히 죽어도(524) 외부에서 감지하도록 앱 밖 스크립트로 둔다.
# 운영자 토큰이 있으면 사람 개입이 필요한 미알림 장애만 보내고 자동 복구 대상은 조회만 한다.
#   예: * * * * * SLACK_WEBHOOK_URL=... BASE_URL=https://<live> /app/dashboard/scripts/health-alert.sh
#
# env: BASE_URL(필수), SLACK_WEBHOOK_URL(필수). 선택: FAIL_THRESHOLD(기본 2), TIMEOUT(기본 10),
#      STATE_FILE(기본 /tmp/osmu-health.state), OPERATOR_TOKEN(운영 장애 알림 사용 시).
set -uo pipefail

BASE_URL="${BASE_URL:-}"
HOOK="${SLACK_WEBHOOK_URL:-}"
THRESHOLD="${FAIL_THRESHOLD:-2}"
TIMEOUT="${TIMEOUT:-10}"
STATE_FILE="${STATE_FILE:-/tmp/osmu-health.state}"
OPERATOR_TOKEN="${OPERATOR_TOKEN:-}"
BODY_FILE="${STATE_FILE}.body"
INCIDENT_FILE="${STATE_FILE}.incidents"

[ -z "$BASE_URL" ] && { echo "ERROR: BASE_URL 미설정" >&2; exit 2; }

slack() {
  [ -n "$HOOK" ] || return 1
  curl -fsS -m 10 -X POST "$HOOK" -H 'Content-Type: application/json' \
    -d "{\"text\":$(printf '%s' "$1" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')}" >/dev/null 2>&1
}

operator_curl() {
  curl --config <(printf 'header = "Authorization: Bearer %s"\n' "$OPERATOR_TOKEN") "$@"
}

send_operational_incidents() {
  [ -n "$OPERATOR_TOKEN" ] || return 0
  command -v jq >/dev/null 2>&1 || { echo "[health-alert] 운영 장애 조회 생략: jq 미설치" >&2; return 0; }

  local incident_code
  incident_code=$(operator_curl -sS -o "$INCIDENT_FILE" -w "%{http_code}" -m "$TIMEOUT" \
    "$BASE_URL/api/operator/incidents" 2>/dev/null || echo 000)
  if [ "$incident_code" != "200" ]; then
    echo "[health-alert] 운영 장애 조회 실패 http=$incident_code" >&2
    return 0
  fi

  while IFS=$'\t' read -r incident_id workspace category source occurrences; do
    [ -n "$incident_id" ] || continue
    if slack "$(printf '운영 장애 알림\n작업 공간: %s\n분류: %s\n서비스: %s\n발생: %s회' "$workspace" "$category" "$source" "$occurrences")"; then
      local ack_body
      ack_body=$(jq -nc --arg id "$incident_id" '{action:"mark_notified",ids:[$id]}')
      operator_curl -fsS -m "$TIMEOUT" -X POST "$BASE_URL/api/operator/incidents" \
        -H 'Content-Type: application/json' -d "$ack_body" >/dev/null 2>&1 || true
    fi
  done < <(jq -r '.incidents[] | select(.status == "open" and .intervention == "human" and .notifiedAt == null) | [.id, (.workspaceName + " (" + .workspaceSlug + ")"), .category, .source, (.occurrences|tostring)] | @tsv' "$INCIDENT_FILE")
}

fails=$(cat "$STATE_FILE" 2>/dev/null || echo 0)
case "$fails" in
  ""|*[!0-9]*) fails=0 ;;
esac
code=$(curl -s -o "$BODY_FILE" -w "%{http_code}" -m "$TIMEOUT" "$BASE_URL/api/health" 2>/dev/null || echo 000)

if [ "$code" = "200" ]; then
  # 직전이 경보 상태(>=threshold)였다면 복구 알림
  if [ "$fails" -ge "$THRESHOLD" ]; then
    slack "OSMU 대시보드 복구됨: /api/health 200 ($BASE_URL)" || true
  fi
  echo 0 > "$STATE_FILE"
  send_operational_incidents
else
  fails=$((fails + 1))
  echo "$fails" > "$STATE_FILE"
  body=$(head -c 300 "$BODY_FILE" 2>/dev/null)
  # 임계 도달 그 순간에만 1회 경보. 이후 복구까지 침묵한다.
  if [ "$fails" -eq "$THRESHOLD" ]; then
    slack "$(printf 'OSMU 대시보드 장애: /api/health http=%s (연속 %s회) %s\n%s' "$code" "$fails" "$BASE_URL" "$body")" || true
  fi
  echo "[health-alert] FAIL http=$code fails=$fails" >&2
fi
